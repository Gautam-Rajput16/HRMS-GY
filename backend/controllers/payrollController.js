const { validationResult } = require('express-validator');
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const {
    getWorkingDaysInMonth,
    getMonthDateRange,
    calculatePayroll
} = require('../utils/payrollUtils');
const { generatePayslipPDF } = require('../utils/pdfGenerator');
const { sendPushNotification } = require('../utils/notificationService');

/**
 * Get attendance summary for an employee for a specific month
 */
const getAttendanceSummary = async (employeeId, month, year) => {
    const { startDate, endDate } = getMonthDateRange(month, year);

    const attendanceRecords = await Attendance.find({
        employee: employeeId,
        date: { $gte: startDate, $lte: endDate },
    });

    let present = 0;
    let halfDays = 0;

    attendanceRecords.forEach(record => {
        if (record.status === 'present') {
            // Check for half day (less than 4 hours)
            if (record.workingMinutes < 240) {
                halfDays++;
            } else {
                present++;
            }
        } else if (record.status === 'incomplete') {
            // Login but no logout - count as half day
            halfDays++;
        }
    });

    return { present, halfDays, totalRecords: attendanceRecords.length };
};

/**
 * Get leave summary for an employee for a specific month
 */
const getLeaveSummary = async (employeeId, month, year) => {
    const { startDate, endDate } = getMonthDateRange(month, year);

    const leaves = await Leave.find({
        employee: employeeId,
        status: 'approved',
        $or: [
            { startDate: { $gte: startDate, $lte: endDate } },
            { endDate: { $gte: startDate, $lte: endDate } },
            { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
        ],
    });

    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;

    leaves.forEach(leave => {
        // Calculate days within this month
        const leaveStart = leave.startDate > startDate ? leave.startDate : startDate;
        const leaveEnd = leave.endDate < endDate ? leave.endDate : endDate;
        const days = Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;

        if (leave.leaveType === 'unpaid') {
            unpaidLeaveDays += days;
        } else {
            paidLeaveDays += days;
        }
    });

    return { paidLeaveDays, unpaidLeaveDays };
};

/**
 * @desc    Generate monthly payroll for all employees
 * @route   POST /api/payroll/generate
 * @access  Private (Admin/HR)
 */
const generateMonthlyPayroll = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { month, year } = req.body;

        // Validate month/year
        if (month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                message: 'Invalid month. Must be between 1 and 12',
            });
        }

        // Get all active employees
        const employees = await User.find({
            role: 'employee',
            isActive: true
        });

        if (employees.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No active employees found',
            });
        }

        const workingDaysInMonth = getWorkingDaysInMonth(month, year);
        const payrollResults = [];
        const errors_list = [];

        for (const employee of employees) {
            try {
                // Check if payroll already exists
                const existingPayroll = await Payroll.findOne({
                    employee: employee._id,
                    month,
                    year,
                });

                if (existingPayroll) {
                    errors_list.push({
                        employeeId: employee.employeeId,
                        message: 'Payroll already exists for this month',
                    });
                    continue;
                }

                // Get attendance and leave summaries
                const attendanceSummary = await getAttendanceSummary(employee._id, month, year);
                const leaveSummary = await getLeaveSummary(employee._id, month, year);

                // Calculate payroll
                const payrollData = calculatePayroll(
                    employee,
                    attendanceSummary,
                    leaveSummary,
                    workingDaysInMonth
                );

                // Create payroll record
                const payroll = await Payroll.create({
                    employee: employee._id,
                    month,
                    year,
                    ...payrollData,
                    status: 'processed',
                    processedBy: req.user._id,
                    processedOn: new Date(),
                });

                payrollResults.push({
                    employeeId: employee.employeeId,
                    name: employee.name,
                    netSalary: payroll.netSalary,
                    status: 'success',
                });
            } catch (err) {
                errors_list.push({
                    employeeId: employee.employeeId,
                    message: err.message,
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `Payroll generated for ${payrollResults.length} employees`,
            data: {
                month,
                year,
                workingDaysInMonth,
                processed: payrollResults,
                errors: errors_list,
            },
        });

        // Send "Salary Processed" notification to each employee (fire-and-forget)
        const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        for (const result of payrollResults) {
            const emp = employees.find(e => e.employeeId === result.employeeId);
            if (emp) {
                const netFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(result.netSalary);
                sendPushNotification(emp._id, {
                    title: `💰 Salary Processed for ${monthNames[month]} ${year}`,
                    body: `Your payroll for ${monthNames[month]} ${year} has been processed. Net Salary: ${netFormatted}. View your payslip for details.`,
                    data: { screen: 'Payroll', type: 'salary_processed' },
                }).catch(() => {});
            }
        }
    } catch (error) {
        console.error('Generate Payroll Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error generating payroll',
        });
    }
};

/**
 * @desc    Get all payroll records (HR/Admin)
 * @route   GET /api/payroll
 * @access  Private (Admin/HR)
 */
const getAllPayroll = async (req, res) => {
    try {
        const { page = 1, limit = 20, month, year, status, employeeId } = req.query;

        const query = {};
        if (month) query.month = parseInt(month);
        if (year) query.year = parseInt(year);
        if (status) query.status = status;
        if (employeeId) query.employee = employeeId;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [payrolls, total] = await Promise.all([
            Payroll.find(query)
                .populate('employee', 'name employeeId email department designation')
                .populate('processedBy', 'name employeeId')
                .sort({ year: -1, month: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Payroll.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: {
                payrolls,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    total,
                },
            },
        });
    } catch (error) {
        console.error('Get All Payroll Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching payroll records',
        });
    }
};

/**
 * @desc    Get my payroll history (Employee)
 * @route   GET /api/payroll/my
 * @access  Private (Employee)
 */
const getMyPayroll = async (req, res) => {
    try {
        const { page = 1, limit = 12 } = req.query;
        const employeeId = req.user._id;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [payrolls, total] = await Promise.all([
            Payroll.find({ employee: employeeId })
                .sort({ year: -1, month: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Payroll.countDocuments({ employee: employeeId }),
        ]);

        res.status(200).json({
            success: true,
            payroll: payrolls,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total,
            },
        });
    } catch (error) {
        console.error('Get My Payroll Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching payroll history',
        });
    }
};

/**
 * @desc    Get payroll by ID
 * @route   GET /api/payroll/:id
 * @access  Private (Admin/HR or Owner)
 */
const getPayrollById = async (req, res) => {
    try {
        const { id } = req.params;

        const payroll = await Payroll.findById(id)
            .populate('employee', 'name employeeId email department designation joiningDate')
            .populate('processedBy', 'name employeeId');

        if (!payroll) {
            return res.status(404).json({
                success: false,
                message: 'Payroll record not found',
            });
        }

        // Check access - must be admin/hr or the employee themselves
        const isOwner = payroll.employee._id.toString() === req.user._id.toString();
        const isAdminOrHR = ['admin', 'hr'].includes(req.user.role);

        if (!isOwner && !isAdminOrHR) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        res.status(200).json({
            success: true,
            data: payroll,
        });
    } catch (error) {
        console.error('Get Payroll By ID Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching payroll record',
        });
    }
};

/**
 * @desc    Update payroll status
 * @route   PATCH /api/payroll/:id/status
 * @access  Private (Admin/HR)
 */
const updatePayrollStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['draft', 'processed', 'paid'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be draft, processed, or paid',
            });
        }

        const payroll = await Payroll.findById(id);

        if (!payroll) {
            return res.status(404).json({
                success: false,
                message: 'Payroll record not found',
            });
        }

        payroll.status = status;
        if (status === 'paid') {
            payroll.paidOn = new Date();
        }
        await payroll.save();

        await payroll.populate('employee', 'name employeeId email department');

        res.status(200).json({
            success: true,
            message: `Payroll status updated to ${status}`,
            data: payroll,
        });

        // Send notification when salary is credited
        if (status === 'paid') {
            const empId = payroll.employee._id || payroll.employee;
            const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            const netFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(payroll.netSalary);
            sendPushNotification(empId, {
                title: '🎉 Salary Credited!',
                body: `Your salary of ${netFormatted} for ${monthNames[payroll.month]} ${payroll.year} has been credited. Download your payslip from the app.`,
                data: { screen: 'Payroll', type: 'salary_credited' },
            }).catch(() => {});
        }
    } catch (error) {
        console.error('Update Payroll Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating payroll status',
        });
    }
};

/**
 * @desc    Generate and download payslip PDF
 * @route   GET /api/payroll/:id/payslip
 * @access  Private (Admin/HR or Owner)
 */
const downloadPayslip = async (req, res) => {
    try {
        const { id } = req.params;

        const payroll = await Payroll.findById(id)
            .populate('employee', 'name employeeId email department designation joiningDate');

        if (!payroll) {
            return res.status(404).json({
                success: false,
                message: 'Payroll record not found',
            });
        }

        // Check access
        const isOwner = payroll.employee._id.toString() === req.user._id.toString();
        const isAdminOrHR = ['admin', 'hr'].includes(req.user.role);

        if (!isOwner && !isAdminOrHR) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        // Generate PDF
        const pdfBuffer = await generatePayslipPDF(payroll, payroll.employee);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=payslip_${payroll.employee.employeeId}_${payroll.monthYear.replace(' ', '_')}.pdf`
        );

        res.send(pdfBuffer);

        // Send payslip ready notification (fire-and-forget)
        const empId = payroll.employee._id;
        const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        sendPushNotification(empId, {
            title: '📄 Payslip Ready',
            body: `Your payslip for ${monthNames[payroll.month]} ${payroll.year} is now available for download.`,
            data: { screen: 'Payroll', type: 'payslip_ready' },
        }).catch(() => {});
    } catch (error) {
        console.error('Download Payslip Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error generating payslip',
        });
    }
};

/**
 * @desc    Get payroll statistics (HR/Admin)
 * @route   GET /api/payroll/stats
 * @access  Private (Admin/HR)
 */
const getPayrollStats = async (req, res) => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // Get stats for current month
        const [
            totalPayrolls,
            processedThisMonth,
            paidThisMonth,
            totalSalaryExpense,
        ] = await Promise.all([
            Payroll.countDocuments(),
            Payroll.countDocuments({ month: currentMonth, year: currentYear, status: 'processed' }),
            Payroll.countDocuments({ month: currentMonth, year: currentYear, status: 'paid' }),
            Payroll.aggregate([
                { $match: { month: currentMonth, year: currentYear } },
                { $group: { _id: null, total: { $sum: '$netSalary' } } },
            ]),
        ]);

        // Get monthly expense for last 6 months
        const sixMonthsAgo = new Date(currentYear, currentMonth - 7, 1);
        const monthlyExpense = await Payroll.aggregate([
            {
                $match: {
                    $expr: {
                        $gte: [
                            { $dateFromParts: { year: '$year', month: '$month' } },
                            sixMonthsAgo,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: { month: '$month', year: '$year' },
                    totalExpense: { $sum: '$netSalary' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 6 },
        ]);

        res.status(200).json({
            success: true,
            data: {
                currentMonth: {
                    month: currentMonth,
                    year: currentYear,
                    processed: processedThisMonth,
                    paid: paidThisMonth,
                    totalExpense: totalSalaryExpense[0]?.total || 0,
                },
                totalPayrolls,
                monthlyExpense,
            },
        });
    } catch (error) {
        console.error('Get Payroll Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching payroll statistics',
        });
    }
};

module.exports = {
    generateMonthlyPayroll,
    getAllPayroll,
    getMyPayroll,
    getPayrollById,
    updatePayrollStatus,
    downloadPayslip,
    getPayrollStats,
};
