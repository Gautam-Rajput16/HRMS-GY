const { validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

/**
 * @desc    Get all attendance records for developer editing
 * @route   GET /api/developer/attendance
 * @access  Private (Developer)
 */
const getAllAttendance = async (req, res) => {
    try {
        const { page = 1, limit = 20, date, employeeId, status, search } = req.query;

        const query = {};

        // Date filter - use date range to handle timezone differences
        if (date) {
            const filterDate = new Date(date);
            // Start of day in UTC
            const startOfDay = new Date(Date.UTC(
                filterDate.getFullYear(),
                filterDate.getMonth(),
                filterDate.getDate(),
                0, 0, 0, 0
            ));
            // End of day in UTC
            const endOfDay = new Date(Date.UTC(
                filterDate.getFullYear(),
                filterDate.getMonth(),
                filterDate.getDate(),
                23, 59, 59, 999
            ));
            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        // Employee filter
        if (employeeId) {
            query.employee = employeeId;
        }

        // Status filter
        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // If search query, first find matching employees
        let employeeFilter = null;
        if (search) {
            const matchingEmployees = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { employeeId: { $regex: search, $options: 'i' } },
                ],
            }).select('_id');
            employeeFilter = matchingEmployees.map((e) => e._id);
            query.employee = { $in: employeeFilter };
        }

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
        console.error('Get All Attendance (Developer) Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching attendance records',
        });
    }
};

/**
 * @desc    Get single attendance record by ID
 * @route   GET /api/developer/attendance/:id
 * @access  Private (Developer)
 */
const getAttendanceById = async (req, res) => {
    try {
        const { id } = req.params;

        const attendance = await Attendance.findById(id).populate(
            'employee',
            'name employeeId email department designation'
        );

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found',
            });
        }

        res.status(200).json({
            success: true,
            data: attendance,
        });
    } catch (error) {
        console.error('Get Attendance By ID Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching attendance record',
        });
    }
};

/**
 * @desc    Update attendance record (date, time, location)
 * @route   PUT /api/developer/attendance/:id
 * @access  Private (Developer)
 */
const updateAttendance = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { id } = req.params;
        const {
            date,
            loginTime,
            logoutTime,
            loginLocation,
            logoutLocation,
            status,
        } = req.body;

        const attendance = await Attendance.findById(id);

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found',
            });
        }

        // Update fields if provided
        if (date) {
            // Normalize date to UTC midnight to ensure consistent storage
            const newDate = new Date(date);
            attendance.date = new Date(Date.UTC(
                newDate.getFullYear(),
                newDate.getMonth(),
                newDate.getDate(),
                0, 0, 0, 0
            ));
        }

        if (loginTime) {
            attendance.loginTime = new Date(loginTime);
        }

        if (logoutTime) {
            attendance.logoutTime = new Date(logoutTime);
        }

        if (loginLocation) {
            attendance.loginLocation = {
                latitude: loginLocation.latitude,
                longitude: loginLocation.longitude,
            };
        }

        if (logoutLocation) {
            attendance.logoutLocation = {
                latitude: logoutLocation.latitude,
                longitude: logoutLocation.longitude,
            };
        }

        if (status) {
            attendance.status = status;
        }

        // Recalculate working minutes if both times exist
        if (attendance.loginTime && attendance.logoutTime) {
            const diff =
                attendance.logoutTime.getTime() - attendance.loginTime.getTime();
            attendance.workingMinutes = Math.floor(diff / (1000 * 60));
            if (!status) {
                attendance.status = 'present';
            }
        }

        await attendance.save();

        // Populate employee details for response
        await attendance.populate('employee', 'name employeeId email department designation');

        res.status(200).json({
            success: true,
            message: 'Attendance record updated successfully',
            data: attendance,
        });
    } catch (error) {
        console.error('Update Attendance Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating attendance record',
        });
    }
};

/**
 * @desc    Delete attendance record
 * @route   DELETE /api/developer/attendance/:id
 * @access  Private (Developer)
 */
const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        const attendance = await Attendance.findById(id);

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found',
            });
        }

        await Attendance.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Attendance record deleted successfully',
        });
    } catch (error) {
        console.error('Delete Attendance Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting attendance record',
        });
    }
};

/**
 * @desc    Get developer dashboard statistics
 * @route   GET /api/developer/stats
 * @access  Private (Developer)
 */
const getStats = async (req, res) => {
    try {
        // Calculate "Now" in IST
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istNow = new Date(utc + (3600000 * 5.5));

        // Today's date range in UTC (corresponding to IST day)
        // We use UTC methods on the IST date object to strip time and get the "Day"
        const todayStart = new Date(Date.UTC(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 0, 0, 0, 0));
        const todayEnd = new Date(Date.UTC(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 23, 59, 59, 999));

        // Start of month in UTC (based on IST month)
        const startOfMonth = new Date(Date.UTC(istNow.getFullYear(), istNow.getMonth(), 1, 0, 0, 0, 0));

        const [
            totalRecords,
            todayRecords,
            monthlyRecords,
            totalEmployees,
            incompleteRecords,
        ] = await Promise.all([
            Attendance.countDocuments(),
            Attendance.countDocuments({ date: { $gte: todayStart, $lte: todayEnd } }),
            Attendance.countDocuments({ date: { $gte: startOfMonth } }),
            User.countDocuments({ role: 'employee', isActive: true }),
            Attendance.countDocuments({ status: 'incomplete' }),
        ]);

        // Get recent attendance for quick view
        const recentAttendance = await Attendance.find()
            .populate('employee', 'name employeeId department')
            .sort({ updatedAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalRecords,
                    todayRecords,
                    monthlyRecords,
                    totalEmployees,
                    incompleteRecords,
                },
                recentAttendance,
            },
        });
    } catch (error) {
        console.error('Get Developer Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching statistics',
        });
    }
};

/**
 * @desc    Get all employees for dropdown
 * @route   GET /api/developer/employees
 * @access  Private (Developer)
 */
const getEmployees = async (req, res) => {
    try {
        const employees = await User.find({ role: 'employee' })
            .select('_id name employeeId department')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: employees,
        });
    } catch (error) {
        console.error('Get Employees Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching employees',
        });
    }
};

/**
 * @desc    Create new attendance record
 * @route   POST /api/developer/attendance
 * @access  Private (Developer)
 */
const createAttendance = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const {
            employeeId,
            date,
            loginTime,
            logoutTime,
            loginLocation,
            logoutLocation,
            status,
        } = req.body;

        // Check if employee exists
        const employee = await User.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        // Check if attendance already exists for this employee on this date
        // Normalize to UTC Midnight
        const d = new Date(date);
        const attendanceDate = new Date(Date.UTC(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
            0, 0, 0, 0
        ));

        const existingAttendance = await Attendance.findOne({
            employee: employeeId,
            date: attendanceDate,
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Attendance record already exists for this employee on this date',
            });
        }

        // Create attendance record
        const attendanceData = {
            employee: employeeId,
            date: attendanceDate,
            status: status || 'incomplete',
        };

        if (loginTime) {
            attendanceData.loginTime = new Date(loginTime);
        }

        if (logoutTime) {
            attendanceData.logoutTime = new Date(logoutTime);
        }

        if (loginLocation) {
            attendanceData.loginLocation = {
                latitude: loginLocation.latitude,
                longitude: loginLocation.longitude,
            };
        }

        if (logoutLocation) {
            attendanceData.logoutLocation = {
                latitude: logoutLocation.latitude,
                longitude: logoutLocation.longitude,
            };
        }

        // Calculate working minutes if both times exist
        if (attendanceData.loginTime && attendanceData.logoutTime) {
            const diff =
                attendanceData.logoutTime.getTime() - attendanceData.loginTime.getTime();
            attendanceData.workingMinutes = Math.floor(diff / (1000 * 60));
            attendanceData.status = 'present';
        }

        const attendance = await Attendance.create(attendanceData);

        // Populate employee details for response
        await attendance.populate('employee', 'name employeeId email department designation');

        res.status(201).json({
            success: true,
            message: 'Attendance record created successfully',
            data: attendance,
        });
    } catch (error) {
        console.error('Create Attendance Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating attendance record',
        });
    }
};

module.exports = {
    getAllAttendance,
    getAttendanceById,
    updateAttendance,
    deleteAttendance,
    getStats,
    getEmployees,
    createAttendance,
};
