const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { isAdminOrHR } = require('../middleware/roleMiddleware');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const { getMonthDateRange, formatCurrency } = require('../utils/payrollUtils');

/**
 * @desc    Get attendance report
 * @route   GET /api/reports/attendance
 * @access  Private (Admin/HR)
 */
const getAttendanceReport = async (req, res) => {
    try {
        const { month, year, employeeId } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Month and year are required',
            });
        }

        const { startDate, endDate } = getMonthDateRange(parseInt(month), parseInt(year));

        const query = {
            date: { $gte: startDate, $lte: endDate },
        };
        if (employeeId) query.employee = employeeId;

        const attendanceRecords = await Attendance.find(query)
            .populate('employee', 'name employeeId department designation')
            .sort({ date: 1, employee: 1 });

        // Group by employee
        const employeeSummary = {};
        attendanceRecords.forEach(record => {
            const empId = record.employee._id.toString();
            if (!employeeSummary[empId]) {
                employeeSummary[empId] = {
                    employee: record.employee,
                    present: 0,
                    absent: 0,
                    incomplete: 0,
                    halfDays: 0,
                    totalWorkingMinutes: 0,
                };
            }

            if (record.status === 'present') {
                if (record.workingMinutes < 240) {
                    employeeSummary[empId].halfDays++;
                } else {
                    employeeSummary[empId].present++;
                }
                employeeSummary[empId].totalWorkingMinutes += record.workingMinutes;
            } else if (record.status === 'incomplete') {
                employeeSummary[empId].incomplete++;
            } else {
                employeeSummary[empId].absent++;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                month: parseInt(month),
                year: parseInt(year),
                totalRecords: attendanceRecords.length,
                employeeSummary: Object.values(employeeSummary),
            },
        });
    } catch (error) {
        console.error('Attendance Report Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error generating attendance report',
        });
    }
};

/**
 * @desc    Get leave report
 * @route   GET /api/reports/leaves
 * @access  Private (Admin/HR)
 */
const getLeaveReport = async (req, res) => {
    try {
        const { month, year, leaveType } = req.query;

        const query = { status: 'approved' };

        if (month && year) {
            const { startDate, endDate } = getMonthDateRange(parseInt(month), parseInt(year));
            query.$or = [
                { startDate: { $gte: startDate, $lte: endDate } },
                { endDate: { $gte: startDate, $lte: endDate } },
            ];
        }

        if (leaveType) query.leaveType = leaveType;

        const leaves = await Leave.find(query)
            .populate('employee', 'name employeeId department')
            .sort({ startDate: -1 });

        // Summary by leave type
        const summary = {
            casual: 0,
            sick: 0,
            paid: 0,
            unpaid: 0,
        };

        leaves.forEach(leave => {
            summary[leave.leaveType] += leave.totalDays;
        });

        res.status(200).json({
            success: true,
            data: {
                leaves,
                summary,
                totalLeaves: leaves.length,
                totalDays: Object.values(summary).reduce((a, b) => a + b, 0),
            },
        });
    } catch (error) {
        console.error('Leave Report Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error generating leave report',
        });
    }
};

/**
 * @desc    Get payroll report
 * @route   GET /api/reports/payroll
 * @access  Private (Admin/HR)
 */
const getPayrollReport = async (req, res) => {
    try {
        const { month, year, department } = req.query;

        const query = {};
        if (month) query.month = parseInt(month);
        if (year) query.year = parseInt(year);

        let payrolls = await Payroll.find(query)
            .populate('employee', 'name employeeId department designation')
            .sort({ year: -1, month: -1 });

        // Filter by department if specified
        if (department) {
            payrolls = payrolls.filter(p => p.employee.department === department);
        }

        // Calculate totals
        const totals = payrolls.reduce((acc, p) => {
            acc.grossSalary += p.grossSalary;
            acc.totalDeductions += p.totalDeductions;
            acc.netSalary += p.netSalary;
            return acc;
        }, { grossSalary: 0, totalDeductions: 0, netSalary: 0 });

        res.status(200).json({
            success: true,
            data: {
                payrolls,
                totals,
                count: payrolls.length,
            },
        });
    } catch (error) {
        console.error('Payroll Report Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error generating payroll report',
        });
    }
};

/**
 * @desc    Export report as CSV
 * @route   GET /api/reports/export/csv
 * @access  Private (Admin/HR)
 */
const exportToCSV = async (req, res) => {
    try {
        const { type, month, year } = req.query;

        if (!type || !['attendance', 'leaves', 'payroll'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Valid report type is required (attendance, leaves, payroll)',
            });
        }

        let csvContent = '';
        let filename = '';

        if (type === 'attendance') {
            const { startDate, endDate } = getMonthDateRange(parseInt(month), parseInt(year));
            const records = await Attendance.find({
                date: { $gte: startDate, $lte: endDate },
            }).populate('employee', 'name employeeId department');

            csvContent = 'Employee ID,Name,Department,Date,Login Time,Logout Time,Status,Working Hours\n';
            records.forEach(r => {
                csvContent += `${r.employee.employeeId},${r.employee.name},${r.employee.department || 'N/A'},`;
                csvContent += `${r.date.toISOString().split('T')[0]},`;
                csvContent += `${r.loginTime ? r.loginTime.toISOString() : 'N/A'},`;
                csvContent += `${r.logoutTime ? r.logoutTime.toISOString() : 'N/A'},`;
                csvContent += `${r.status},${r.workingHours}\n`;
            });
            filename = `attendance_report_${month}_${year}.csv`;

        } else if (type === 'leaves') {
            const leaves = await Leave.find({ status: 'approved' })
                .populate('employee', 'name employeeId department');

            csvContent = 'Employee ID,Name,Department,Leave Type,Start Date,End Date,Days,Reason\n';
            leaves.forEach(l => {
                csvContent += `${l.employee.employeeId},${l.employee.name},${l.employee.department || 'N/A'},`;
                csvContent += `${l.leaveType},${l.startDate.toISOString().split('T')[0]},`;
                csvContent += `${l.endDate.toISOString().split('T')[0]},${l.totalDays},"${l.reason}"\n`;
            });
            filename = `leave_report_${month || 'all'}_${year || 'years'}.csv`;

        } else if (type === 'payroll') {
            const payrolls = await Payroll.find({ month: parseInt(month), year: parseInt(year) })
                .populate('employee', 'name employeeId department');

            csvContent = 'Employee ID,Name,Department,Month,Year,Gross Salary,Deductions,Net Salary,Status\n';
            payrolls.forEach(p => {
                csvContent += `${p.employee.employeeId},${p.employee.name},${p.employee.department || 'N/A'},`;
                csvContent += `${p.month},${p.year},${p.grossSalary},${p.totalDeductions},${p.netSalary},${p.status}\n`;
            });
            filename = `payroll_report_${month}_${year}.csv`;
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(csvContent);

    } catch (error) {
        console.error('Export CSV Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error exporting report',
        });
    }
};

// Routes
router.get('/attendance', protect, isAdminOrHR, getAttendanceReport);
router.get('/leaves', protect, isAdminOrHR, getLeaveReport);
router.get('/payroll', protect, isAdminOrHR, getPayrollReport);
router.get('/export/csv', protect, isAdminOrHR, exportToCSV);

module.exports = router;
