const { validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const { uploadImage } = require('../utils/uploadImage');
const { detectFace } = require('../utils/faceDetection');
const { isWithinOfficeRadius } = require('../utils/geoFencing');
const { sendPushNotification, getShiftTiming, formatHour } = require('../utils/notificationService');

/**
 * Get current date/time in IST (Indian Standard Time)
 */
const getISTDate = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    // IST offset is +5.5 hours
    return new Date(utc + (3600000 * 5.5));
};

/**
 * Get today's date at IST midnight (for comparison)
 * This consistently defines "Today" as per Indian context
 */
const getTodayDate = () => {
    const istNow = getISTDate();
    // Return midnight date object based on IST
    return new Date(Date.UTC(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 0, 0, 0, 0));
};

/**
 * Get date range for a specific day in IST
 * Returns start and end of the day in UTC, corresponding to IST day boundaries
 */
const getDayRange = (date) => {
    // If date is provided, convert it to IST context first to find the day boundaries
    // But if we pass a date object that is already midnight UTC representing a specific day,
    // we use it directly.

    // Create date object from input
    const d = new Date(date);

    // We construct the start and end times in UTC that correspond to 00:00:00 and 23:59:59 IST
    // 00:00 IST = Prev Day 18:30 UTC
    // But for simplicity in storage, we usually store dates in UTC.
    // The previous logic was comparing UTC dates. 

    // Let's stick to the convention: logic uses "Local Day" (IST)
    // We want matching records where the *stored UTC date* falls within that IST day.

    // However, existing records seem to be stored with `date` field being set to `today` from getTodayDate()
    // which was creating UTC midnights.

    // To ensure backward compatibility and fix the timezone issue:
    // We will ensure `getTodayDate` returns the SAME "Date" (Year, Month, Day) regardless of server time,
    // relative to IST.

    // Example: 
    // It is 1 AM IST on Jan 31. Server (UTC) says Jan 30 7:30 PM.
    // We want "Today" to be Jan 31.
    // getISTDate() -> Jan 31 ...
    // getTodayDate() should return Midnight Jan 31.

    return {
        startOfDay: new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)),
        endOfDay: new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999))
    };
};

/**
 * @desc    Mark attendance login
 * @route   POST /api/attendance/login
 * @access  Private (Employee)
 */
const markLogin = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { photo, qrCode, latitude, longitude } = req.body;
        const employeeId = req.user._id;
        const today = getTodayDate();
        const isQRMode = !!qrCode;

        // Validate location is provided and not dummy 0,0
        if (latitude == null || longitude == null || (Number(latitude) === 0 && Number(longitude) === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Location is required for attendance. Please enable location services and try again.',
            });
        }

        let photoUrl = null;
        let faceDetected = false;
        let faceConfidence = 0;

        if (isQRMode) {
            // --- QR Mode: Validate QR secret and enforce geo-fencing ---
            const expectedSecret = process.env.QR_SECRET || '';
            if (qrCode !== expectedSecret) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid QR Code. Please scan the correct office QR code.',
                });
            }

            // Geo-fence check
            const geoCheck = isWithinOfficeRadius(Number(latitude), Number(longitude));
            if (!geoCheck.isWithinRadius) {
                return res.status(400).json({
                    success: false,
                    message: `You are not within the office premises. You are approximately ${geoCheck.distance}m away (max allowed: ${geoCheck.maxRadius}m).`,
                });
            }
        } else {
            // --- Face Mode: Validate photo and run face detection ---
            if (!photo) {
                return res.status(400).json({
                    success: false,
                    message: 'Photo is required for face attendance.',
                });
            }

            const faceResult = await detectFace(photo);
            if (!faceResult.faceDetected) {
                return res.status(400).json({
                    success: false,
                    message: 'No face detected. Please ensure your face is clearly visible and try again.',
                });
            }
            faceDetected = true;
            faceConfidence = faceResult.confidence;

            // Upload photo to Cloudinary
            const uploadResult = await uploadImage(photo, 'identix/login');
            photoUrl = uploadResult.url;
        }

        // Check if already logged in today
        const { startOfDay, endOfDay } = getDayRange(today);
        const existingAttendance = await Attendance.findOne({
            employee: employeeId,
            date: { $gte: startOfDay, $lte: endOfDay },
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'You have already punched in today. You cannot punch in again.',
            });
        }

        // Create attendance record
        const attendance = await Attendance.create({
            employee: employeeId,
            date: today,
            loginTime: new Date(),
            loginPhoto: photoUrl,
            loginLocation: {
                latitude: Number(latitude),
                longitude: Number(longitude),
            },
            loginFaceDetected: faceDetected,
            loginFaceConfidence: faceConfidence,
            loginMethod: isQRMode ? 'qr' : 'face',
            status: 'incomplete',
        });

        // Populate employee details
        await attendance.populate('employee', 'name employeeId email');

        res.status(201).json({
            success: true,
            message: isQRMode ? 'QR Login attendance marked successfully' : 'Login attendance marked successfully',
            data: attendance,
        });

        // Send push notification (fire-and-forget)
        const loginTimeStr = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
        });
        sendPushNotification(employeeId, {
            title: '✅ Punch In Recorded',
            body: `Your attendance has been marked at ${loginTimeStr}. Have a productive day!`,
            data: { screen: 'MyAttendance', type: 'punch_in_confirmed' },
        }).catch(() => {});
    } catch (error) {
        console.error('Mark Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking login attendance',
        });
    }
};

/**
 * @desc    Mark attendance logout
 * @route   POST /api/attendance/logout
 * @access  Private (Employee)
 */
const markLogout = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { photo, qrCode, latitude, longitude } = req.body;
        const employeeId = req.user._id;
        const today = getTodayDate();
        const isQRMode = !!qrCode;

        // Validate location is provided and not dummy 0,0
        if (latitude == null || longitude == null || (Number(latitude) === 0 && Number(longitude) === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Location is required for attendance. Please enable location services and try again.',
            });
        }

        let photoUrl = null;
        let faceDetected = false;
        let faceConfidence = 0;

        if (isQRMode) {
            // --- QR Mode: Validate QR secret and enforce geo-fencing ---
            const expectedSecret = process.env.QR_SECRET || '';
            if (qrCode !== expectedSecret) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid QR Code. Please scan the correct office QR code.',
                });
            }

            const geoCheck = isWithinOfficeRadius(Number(latitude), Number(longitude));
            if (!geoCheck.isWithinRadius) {
                return res.status(400).json({
                    success: false,
                    message: `You are not within the office premises. You are approximately ${geoCheck.distance}m away (max allowed: ${geoCheck.maxRadius}m).`,
                });
            }
        } else {
            // --- Face Mode: Validate photo and run face detection ---
            if (!photo) {
                return res.status(400).json({
                    success: false,
                    message: 'Photo is required for face attendance.',
                });
            }

            const faceResult = await detectFace(photo);
            if (!faceResult.faceDetected) {
                return res.status(400).json({
                    success: false,
                    message: 'No face detected. Please ensure your face is clearly visible and try again.',
                });
            }
            faceDetected = true;
            faceConfidence = faceResult.confidence;

            const uploadResult = await uploadImage(photo, 'identix/logout');
            photoUrl = uploadResult.url;
        }

        // Find today's attendance record
        const { startOfDay, endOfDay } = getDayRange(today);
        const attendance = await Attendance.findOne({
            employee: employeeId,
            date: { $gte: startOfDay, $lte: endOfDay },
        });

        if (!attendance) {
            return res.status(400).json({
                success: false,
                message: 'You must punch in first before punching out.',
            });
        }

        if (attendance.logoutTime) {
            return res.status(400).json({
                success: false,
                message: 'You have already punched out today. You cannot punch out again.',
            });
        }

        // Prevent accidental instant logout — require at least 1 minute
        const now = new Date();
        const timeSinceLogin = now.getTime() - attendance.loginTime.getTime();
        const MIN_GAP_MS = 60 * 1000;
        if (timeSinceLogin < MIN_GAP_MS) {
            const remainingSec = Math.ceil((MIN_GAP_MS - timeSinceLogin) / 1000);
            return res.status(400).json({
                success: false,
                message: `You punched in very recently. Please wait ${remainingSec} more second(s) before punching out.`,
            });
        }

        // Update attendance record
        attendance.logoutTime = now;
        attendance.logoutPhoto = photoUrl;
        attendance.logoutLocation = {
            latitude: Number(latitude),
            longitude: Number(longitude),
        };
        attendance.logoutFaceDetected = faceDetected;
        attendance.logoutFaceConfidence = faceConfidence;
        attendance.logoutMethod = isQRMode ? 'qr' : 'face';

        await attendance.save();

        await attendance.populate('employee', 'name employeeId email');

        res.status(200).json({
            success: true,
            message: isQRMode ? 'QR Logout attendance marked successfully' : 'Logout attendance marked successfully',
            data: attendance,
        });

        // Send push notification (fire-and-forget)
        const workMins = attendance.workingMinutes || 0;
        const wH = Math.floor(workMins / 60);
        const wM = workMins % 60;
        sendPushNotification(employeeId, {
            title: '✅ Punch Out Recorded',
            body: `You worked ${wH}h ${wM}m today. See you tomorrow!`,
            data: { screen: 'MyAttendance', type: 'punch_out_confirmed' },
        }).catch(() => {});
    } catch (error) {
        console.error('Mark Logout Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking logout attendance',
        });
    }
};

/**
 * @desc    Get today's attendance status for employee
 * @route   GET /api/attendance/today-status
 * @access  Private (Employee)
 */
const getTodayStatus = async (req, res) => {
    try {
        const employeeId = req.user._id;
        const today = getTodayDate();
        const { startOfDay, endOfDay } = getDayRange(today);

        const attendance = await Attendance.findOne({
            employee: employeeId,
            date: { $gte: startOfDay, $lte: endOfDay },
        });

        // Return flattened structure with loginTime and logoutTime at top level
        res.status(200).json({
            success: true,
            data: {
                hasLoggedIn: !!attendance?.loginTime,
                hasLoggedOut: !!attendance?.logoutTime,
                loginTime: attendance?.loginTime || null,
                logoutTime: attendance?.logoutTime || null,
                status: attendance?.status || 'not_marked',
                attendance: attendance || null, // Keep for backward compatibility
            },
        });
    } catch (error) {
        console.error('Get Today Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching today\'s status',
        });
    }
};

/**
 * @desc    Get employee's own attendance history
 * @route   GET /api/attendance/my
 * @access  Private (Employee)
 */
const getMyAttendance = async (req, res) => {
    try {
        const employeeId = req.user._id;
        const { page = 1, limit = 10, startDate, endDate } = req.query;

        const query = { employee: employeeId };

        // Date filters
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [attendance, total] = await Promise.all([
            Attendance.find(query)
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Attendance.countDocuments(query),
        ]);

        // Return attendance array at top level for mobile app compatibility
        res.status(200).json({
            success: true,
            attendance,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total,
            },
        });
    } catch (error) {
        console.error('Get My Attendance Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching attendance history',
        });
    }
};

/**
 * @desc    Get all attendance records (Admin)
 * @route   GET /api/attendance/all
 * @access  Private (Admin)
 */
const getAllAttendance = async (req, res) => {
    try {
        const { page = 1, limit = 20, date, employeeId, status } = req.query;

        const query = {};

        // Filters - use date range for timezone safety
        if (date) {
            const { startOfDay, endOfDay } = getDayRange(date);
            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        if (employeeId) {
            query.employee = employeeId;
        }

        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [attendance, total] = await Promise.all([
            Attendance.find(query)
                .populate('employee', 'name employeeId email department designation')
                .sort({ date: -1, loginTime: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Attendance.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: {
                attendance,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    total,
                },
            },
        });
    } catch (error) {
        console.error('Get All Attendance Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching attendance records',
        });
    }
};

/**
 * @desc    Get dashboard statistics (Admin)
 * @route   GET /api/attendance/stats
 * @access  Private (Admin)
 */
const getStats = async (req, res) => {
    try {
        const User = require('../models/User');
        const today = getTodayDate();
        const { startOfDay, endOfDay } = getDayRange(today);

        // Get counts - use date range for timezone safety
        const [totalEmployees, todayAttendance, incompleteToday] = await Promise.all([
            User.countDocuments({ role: 'employee', isActive: true }),
            Attendance.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay } }),
            Attendance.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay }, status: 'incomplete' }),
        ]);

        const presentToday = todayAttendance;
        const absentToday = Math.max(0, totalEmployees - todayAttendance);

        // Get all employees with their total working hours (aggregated for today)
        const employeeWorkingHours = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: startOfDay, $lte: endOfDay },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'employee',
                    foreignField: '_id',
                    as: 'employeeData',
                },
            },
            {
                $unwind: '$employeeData',
            },
            {
                $project: {
                    _id: 1,
                    employee: {
                        _id: '$employeeData._id',
                        name: '$employeeData.name',
                        employeeId: '$employeeData.employeeId',
                        department: '$employeeData.department',
                    },
                    workingMinutes: 1,
                    loginTime: 1,
                    logoutTime: 1,
                    status: 1,
                },
            },
            {
                $sort: { 'employee.name': 1 },
            },
        ]);

        // Format working hours for each employee
        const formattedWorkingHours = employeeWorkingHours.map((record) => {
            const hours = Math.floor(record.workingMinutes / 60);
            const minutes = record.workingMinutes % 60;
            return {
                _id: record._id,
                employee: record.employee,
                workingMinutes: record.workingMinutes,
                workingHours: `${hours}h ${minutes}m`,
                loginTime: record.loginTime,
                logoutTime: record.logoutTime,
                status: record.status,
            };
        });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalEmployees,
                    presentToday,
                    absentToday,
                    incompleteToday,
                },
                employeeWorkingHours: formattedWorkingHours,
            },
        });
    } catch (error) {
        console.error('Get Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching statistics',
        });
    }
};

module.exports = {
    markLogin,
    markLogout,
    getTodayStatus,
    getMyAttendance,
    getAllAttendance,
    getStats,
};
