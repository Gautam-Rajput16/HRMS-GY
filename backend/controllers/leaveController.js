const { validationResult } = require('express-validator');
const Leave = require('../models/Leave');
const LeaveBalance = require('../models/LeaveBalance');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/notificationService');

/**
 * @desc    Apply for leave
 * @route   POST /api/leaves/apply
 * @access  Private (Employee)
 */
const applyLeave = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { leaveType, startDate, endDate, reason } = req.body;
        const employeeId = req.user._id;

        // Check for overlapping leaves
        const overlappingLeave = await Leave.findOne({
            employee: employeeId,
            status: { $in: ['pending', 'approved'] },
            $or: [
                {
                    startDate: { $lte: new Date(endDate) },
                    endDate: { $gte: new Date(startDate) },
                },
            ],
        });

        if (overlappingLeave) {
            return res.status(400).json({
                success: false,
                message: 'You already have a leave request for these dates',
            });
        }

        // Check leave balance for non-unpaid leaves
        if (leaveType !== 'unpaid') {
            const currentYear = new Date().getFullYear();
            const balance = await LeaveBalance.getOrCreate(employeeId, currentYear);

            // Calculate total days
            const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
            const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            if (balance[leaveType].remaining < totalDays) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient ${leaveType} leave balance. Available: ${balance[leaveType].remaining} days`,
                });
            }
        }

        // Calculate total days for the leave request
        const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Create leave request
        const leave = await Leave.create({
            employee: employeeId,
            leaveType,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            totalDays,
            reason,
        });

        await leave.populate('employee', 'name employeeId email department');

        res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully',
            data: leave,
        });

        // Send push notification (fire-and-forget)
        const startStr = new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const endStr = new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        sendPushNotification(employeeId, {
            title: '📝 Leave Request Submitted',
            body: `Your ${leaveType} leave request for ${startStr} – ${endStr} (${totalDays} day${totalDays > 1 ? 's' : ''}) has been submitted for approval.`,
            data: { screen: 'LeaveHistory', type: 'leave_applied' },
        }).catch(() => {});
    } catch (error) {
        console.error('Apply Leave Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error applying for leave',
        });
    }
};

/**
 * @desc    Get my leave requests
 * @route   GET /api/leaves/my
 * @access  Private (Employee)
 */
const getMyLeaves = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const employeeId = req.user._id;

        const query = { employee: employeeId };
        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [leaves, total] = await Promise.all([
            Leave.find(query)
                .sort({ appliedOn: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Leave.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            leaves,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total,
            },
        });
    } catch (error) {
        console.error('Get My Leaves Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching leave requests',
        });
    }
};

/**
 * @desc    Get my leave balance
 * @route   GET /api/leaves/my/balance
 * @access  Private (Employee)
 */
const getMyLeaveBalance = async (req, res) => {
    try {
        const employeeId = req.user._id;
        const currentYear = new Date().getFullYear();

        const balance = await LeaveBalance.getOrCreate(employeeId, currentYear);

        res.status(200).json({
            success: true,
            balance: {
                year: currentYear,
                casual: balance.casual,
                sick: balance.sick,
                paid: balance.paid,
            },
        });
    } catch (error) {
        console.error('Get Leave Balance Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching leave balance',
        });
    }
};

/**
 * @desc    Cancel pending leave
 * @route   DELETE /api/leaves/:id/cancel
 * @access  Private (Employee)
 */
const cancelLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.user._id;

        const leave = await Leave.findOne({ _id: id, employee: employeeId });

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found',
            });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending leave requests can be cancelled',
            });
        }

        leave.status = 'cancelled';
        await leave.save();

        res.status(200).json({
            success: true,
            message: 'Leave request cancelled successfully',
            data: leave,
        });
    } catch (error) {
        console.error('Cancel Leave Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error cancelling leave',
        });
    }
};

/**
 * @desc    Get all leave requests (HR/Admin)
 * @route   GET /api/leaves
 * @access  Private (Admin/HR)
 */
const getAllLeaves = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, employeeId, startDate, endDate } = req.query;

        const query = {};
        if (status) query.status = status;
        if (employeeId) query.employee = employeeId;
        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) query.startDate.$gte = new Date(startDate);
            if (endDate) query.startDate.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [leaves, total] = await Promise.all([
            Leave.find(query)
                .populate('employee', 'name employeeId email department designation')
                .populate('reviewedBy', 'name employeeId')
                .sort({ appliedOn: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Leave.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data: {
                leaves,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit)),
                    total,
                },
            },
        });
    } catch (error) {
        console.error('Get All Leaves Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching leave requests',
        });
    }
};

/**
 * @desc    Get pending leave requests (HR/Admin)
 * @route   GET /api/leaves/pending
 * @access  Private (Admin/HR)
 */
const getPendingLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ status: 'pending' })
            .populate('employee', 'name employeeId email department designation')
            .sort({ appliedOn: -1 });

        res.status(200).json({
            success: true,
            data: leaves,
        });
    } catch (error) {
        console.error('Get Pending Leaves Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching pending leaves',
        });
    }
};

/**
 * @desc    Approve leave request (HR/Admin)
 * @route   PATCH /api/leaves/:id/approve
 * @access  Private (Admin/HR)
 */
const approveLeave = async (req, res) => {
    try {
        const { id } = req.params;

        const leave = await Leave.findById(id).populate('employee');

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found',
            });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending leave requests can be approved',
            });
        }

        // Update leave status
        leave.status = 'approved';
        leave.reviewedBy = req.user._id;
        leave.reviewedOn = new Date();
        await leave.save();

        // Deduct leave balance for non-unpaid leaves
        if (leave.leaveType !== 'unpaid') {
            const currentYear = new Date(leave.startDate).getFullYear();
            const balance = await LeaveBalance.getOrCreate(leave.employee._id, currentYear);
            await balance.deductLeave(leave.leaveType, leave.totalDays);
        }

        await leave.populate('reviewedBy', 'name employeeId');

        res.status(200).json({
            success: true,
            message: 'Leave request approved successfully',
            data: leave,
        });

        // Send push notification to the employee (fire-and-forget)
        const empId = leave.employee._id || leave.employee;
        const startStr = new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const endStr = new Date(leave.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        sendPushNotification(empId, {
            title: '✅ Leave Approved!',
            body: `Your ${leave.leaveType} leave for ${startStr} – ${endStr} (${leave.totalDays} day${leave.totalDays > 1 ? 's' : ''}) has been approved. Enjoy your time off!`,
            data: { screen: 'LeaveHistory', type: 'leave_approved' },
        }).catch(() => {});

        // Check low leave balance and send warning
        if (leave.leaveType !== 'unpaid') {
            try {
                const currentYear = new Date(leave.startDate).getFullYear();
                const balance = await LeaveBalance.getOrCreate(empId, currentYear);
                if (balance[leave.leaveType] && balance[leave.leaveType].remaining <= 2) {
                    sendPushNotification(empId, {
                        title: '⚠️ Low Leave Balance',
                        body: `You have only ${balance[leave.leaveType].remaining} ${leave.leaveType} leave day(s) remaining for ${currentYear}. Plan your leaves wisely.`,
                        data: { screen: 'LeaveHistory', type: 'low_leave_balance' },
                    }).catch(() => {});
                }
            } catch (e) { /* ignore balance check errors */ }
        }
    } catch (error) {
        console.error('Approve Leave Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error approving leave',
        });
    }
};

/**
 * @desc    Reject leave request (HR/Admin)
 * @route   PATCH /api/leaves/:id/reject
 * @access  Private (Admin/HR)
 */
const rejectLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const leave = await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found',
            });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending leave requests can be rejected',
            });
        }

        leave.status = 'rejected';
        leave.reviewedBy = req.user._id;
        leave.reviewedOn = new Date();
        leave.rejectionReason = reason || 'No reason provided';
        await leave.save();

        await leave.populate('employee', 'name employeeId email department');
        await leave.populate('reviewedBy', 'name employeeId');

        res.status(200).json({
            success: true,
            message: 'Leave request rejected',
            data: leave,
        });

        // Send push notification to the employee (fire-and-forget)
        const empId = leave.employee._id || leave.employee;
        const startStr = new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const endStr = new Date(leave.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        sendPushNotification(empId, {
            title: '❌ Leave Rejected',
            body: `Your ${leave.leaveType} leave for ${startStr} – ${endStr} has been rejected. Reason: "${leave.rejectionReason}"`,
            data: { screen: 'LeaveHistory', type: 'leave_rejected' },
        }).catch(() => {});
    } catch (error) {
        console.error('Reject Leave Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error rejecting leave',
        });
    }
};

/**
 * @desc    Get leave statistics (HR/Admin)
 * @route   GET /api/leaves/stats
 * @access  Private (Admin/HR)
 */
const getLeaveStats = async (req, res) => {
    try {
        const [pending, approved, rejected, totalEmployees] = await Promise.all([
            Leave.countDocuments({ status: 'pending' }),
            Leave.countDocuments({ status: 'approved' }),
            Leave.countDocuments({ status: 'rejected' }),
            User.countDocuments({ role: 'employee', isActive: true }),
        ]);

        // Get employees currently on leave
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const onLeaveToday = await Leave.countDocuments({
            status: 'approved',
            startDate: { $lte: today },
            endDate: { $gte: today },
        });

        res.status(200).json({
            success: true,
            data: {
                pending,
                approved,
                rejected,
                totalEmployees,
                onLeaveToday,
            },
        });
    } catch (error) {
        console.error('Get Leave Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching leave statistics',
        });
    }
};

module.exports = {
    applyLeave,
    getMyLeaves,
    getMyLeaveBalance,
    cancelLeave,
    getAllLeaves,
    getPendingLeaves,
    approveLeave,
    rejectLeave,
    getLeaveStats,
};
