const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');
const {
    sendPushNotification,
    sendBulkNotifications,
    getShiftTiming,
    formatHour,
    verifyCronSecret,
} = require('../utils/notificationService');

/**
 * Get IST date helpers (reused from attendanceController)
 */
const getISTDate = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 3600000 * 5.5);
};

const getTodayDate = () => {
    const istNow = getISTDate();
    return new Date(Date.UTC(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 0, 0, 0, 0));
};

const getDayRange = (date) => {
    const d = new Date(date);
    return {
        startOfDay: new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)),
        endOfDay: new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)),
    };
};

/**
 * Get all active employees (non-admin, non-developer)
 */
const getActiveEmployees = async () => {
    return User.find({ role: { $in: ['employee', 'hr'] }, isActive: true }).select('_id name employeeId joiningDate');
};

/**
 * @desc    Punch-In Reminder (15 min before shift)
 * @route   GET /api/cron/punch-in-reminder
 */
const punchInReminder = async (req, res) => {
    try {
        if (!verifyCronSecret(req)) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const today = getTodayDate();
        const dayOfWeek = getISTDate().getDay();
        // Skip Sundays (0)
        if (dayOfWeek === 0) {
            return res.status(200).json({ success: true, message: 'Sunday — skipped' });
        }

        const { startOfDay, endOfDay } = getDayRange(today);
        const { startHour } = getShiftTiming();

        // Get employees who haven't punched in yet
        const employees = await getActiveEmployees();
        const attendanceToday = await Attendance.find({
            date: { $gte: startOfDay, $lte: endOfDay },
        }).select('employee');
        const punchedInIds = new Set(attendanceToday.map((a) => a.employee.toString()));

        const targetEmployees = employees.filter((e) => !punchedInIds.has(e._id.toString()));

        if (targetEmployees.length === 0) {
            return res.status(200).json({ success: true, message: 'All employees already punched in' });
        }

        const result = await sendBulkNotifications(
            targetEmployees.map((e) => e._id),
            {
                title: '⏰ Time to Punch In!',
                body: `Good morning! Your shift starts at ${formatHour(startHour)}. Don't forget to mark your attendance.`,
                data: { screen: 'FaceAttendance', type: 'punch_in_reminder' },
            }
        );

        res.status(200).json({ success: true, message: `Sent to ${result.sent} employees`, data: result });
    } catch (error) {
        console.error('[Cron] Punch-In Reminder Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Late Punch-In Warning (15 min after shift start)
 * @route   GET /api/cron/late-punch-in
 */
const latePunchInWarning = async (req, res) => {
    try {
        if (!verifyCronSecret(req)) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const today = getTodayDate();
        const dayOfWeek = getISTDate().getDay();
        if (dayOfWeek === 0) {
            return res.status(200).json({ success: true, message: 'Sunday — skipped' });
        }

        const { startOfDay, endOfDay } = getDayRange(today);

        const employees = await getActiveEmployees();
        const attendanceToday = await Attendance.find({
            date: { $gte: startOfDay, $lte: endOfDay },
        }).select('employee');
        const punchedInIds = new Set(attendanceToday.map((a) => a.employee.toString()));

        const lateEmployees = employees.filter((e) => !punchedInIds.has(e._id.toString()));

        if (lateEmployees.length === 0) {
            return res.status(200).json({ success: true, message: 'No late employees' });
        }

        const result = await sendBulkNotifications(
            lateEmployees.map((e) => e._id),
            {
                title: "⚠️ You Haven't Punched In Yet",
                body: "You're running late. Please mark your attendance now to avoid being marked absent.",
                data: { screen: 'FaceAttendance', type: 'late_punch_in' },
            }
        );

        res.status(200).json({ success: true, message: `Sent to ${result.sent} employees`, data: result });
    } catch (error) {
        console.error('[Cron] Late Punch-In Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Absent Alert (no login + no approved leave)
 * @route   GET /api/cron/absent-alert
 */
const absentAlert = async (req, res) => {
    try {
        if (!verifyCronSecret(req)) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const today = getTodayDate();
        const dayOfWeek = getISTDate().getDay();
        if (dayOfWeek === 0) {
            return res.status(200).json({ success: true, message: 'Sunday — skipped' });
        }

        const { startOfDay, endOfDay } = getDayRange(today);

        const employees = await getActiveEmployees();
        const attendanceToday = await Attendance.find({
            date: { $gte: startOfDay, $lte: endOfDay },
        }).select('employee');
        const punchedInIds = new Set(attendanceToday.map((a) => a.employee.toString()));

        // Get employees on approved leave today
        const todayJS = new Date(today);
        const leavesToday = await Leave.find({
            status: 'approved',
            startDate: { $lte: todayJS },
            endDate: { $gte: todayJS },
        }).select('employee');
        const onLeaveIds = new Set(leavesToday.map((l) => l.employee.toString()));

        const absentEmployees = employees.filter(
            (e) => !punchedInIds.has(e._id.toString()) && !onLeaveIds.has(e._id.toString())
        );

        if (absentEmployees.length === 0) {
            return res.status(200).json({ success: true, message: 'No absent employees' });
        }

        const result = await sendBulkNotifications(
            absentEmployees.map((e) => e._id),
            {
                title: '🔴 Marked as Absent',
                body: 'You have no attendance or approved leave for today. Please contact HR if this is incorrect.',
                data: { screen: 'Dashboard', type: 'absent_alert' },
            }
        );

        res.status(200).json({ success: true, message: `Sent to ${result.sent} employees`, data: result });
    } catch (error) {
        console.error('[Cron] Absent Alert Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Punch-Out Reminder (at shift end)
 * @route   GET /api/cron/punch-out-reminder
 */
const punchOutReminder = async (req, res) => {
    try {
        if (!verifyCronSecret(req)) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const today = getTodayDate();
        const dayOfWeek = getISTDate().getDay();
        if (dayOfWeek === 0) {
            return res.status(200).json({ success: true, message: 'Sunday — skipped' });
        }

        const { startOfDay, endOfDay } = getDayRange(today);

        // Employees who punched in but haven't punched out
        const incomplete = await Attendance.find({
            date: { $gte: startOfDay, $lte: endOfDay },
            loginTime: { $ne: null },
            logoutTime: null,
        }).select('employee');

        if (incomplete.length === 0) {
            return res.status(200).json({ success: true, message: 'All employees already punched out' });
        }

        const result = await sendBulkNotifications(
            incomplete.map((a) => a.employee),
            {
                title: "🏠 Don't Forget to Punch Out!",
                body: 'Your shift has ended. Please mark your punch out to complete today\'s attendance.',
                data: { screen: 'FaceAttendance', type: 'punch_out_reminder' },
            }
        );

        res.status(200).json({ success: true, message: `Sent to ${result.sent} employees`, data: result });
    } catch (error) {
        console.error('[Cron] Punch-Out Reminder Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Missed Punch-Out Warning (2 hours after shift end)
 * @route   GET /api/cron/missed-punch-out
 */
const missedPunchOut = async (req, res) => {
    try {
        if (!verifyCronSecret(req)) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const today = getTodayDate();
        const dayOfWeek = getISTDate().getDay();
        if (dayOfWeek === 0) {
            return res.status(200).json({ success: true, message: 'Sunday — skipped' });
        }

        const { startOfDay, endOfDay } = getDayRange(today);

        const incomplete = await Attendance.find({
            date: { $gte: startOfDay, $lte: endOfDay },
            loginTime: { $ne: null },
            logoutTime: null,
        }).select('employee');

        if (incomplete.length === 0) {
            return res.status(200).json({ success: true, message: 'No missed punch-outs' });
        }

        const result = await sendBulkNotifications(
            incomplete.map((a) => a.employee),
            {
                title: '🚨 Attendance Incomplete',
                body: "You punched in today but haven't punched out. Your attendance will be marked as Incomplete.",
                data: { screen: 'FaceAttendance', type: 'missed_punch_out' },
            }
        );

        res.status(200).json({ success: true, message: `Sent to ${result.sent} employees`, data: result });
    } catch (error) {
        console.error('[Cron] Missed Punch-Out Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Weekly Attendance Summary (Saturday evening)
 * @route   GET /api/cron/weekly-summary
 */
const weeklySummary = async (req, res) => {
    try {
        if (!verifyCronSecret(req)) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const employees = await getActiveEmployees();

        // Get this week's date range (Mon to Sat)
        const istNow = getISTDate();
        const dayOfWeek = istNow.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(Date.UTC(
            istNow.getFullYear(), istNow.getMonth(), istNow.getDate() + mondayOffset, 0, 0, 0, 0
        ));
        const saturday = new Date(Date.UTC(
            istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 23, 59, 59, 999
        ));

        let sentCount = 0;
        for (const employee of employees) {
            const records = await Attendance.find({
                employee: employee._id,
                date: { $gte: monday, $lte: saturday },
            });

            const present = records.filter((r) => r.status === 'present').length;
            const incomplete = records.filter((r) => r.status === 'incomplete').length;
            const totalMinutes = records.reduce((sum, r) => sum + (r.workingMinutes || 0), 0);
            const avgMinutes = records.length > 0 ? Math.round(totalMinutes / records.length) : 0;
            const avgHours = Math.floor(avgMinutes / 60);
            const avgMins = avgMinutes % 60;

            await sendPushNotification(employee._id, {
                title: '📊 Weekly Attendance Summary',
                body: `This week: ${present} Present, ${incomplete} Incomplete. Avg working hours: ${avgHours}h ${avgMins}m.`,
                data: { screen: 'MyAttendance', type: 'weekly_summary' },
            });
            sentCount++;
        }

        res.status(200).json({ success: true, message: `Weekly summary sent to ${sentCount} employees` });
    } catch (error) {
        console.error('[Cron] Weekly Summary Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Work Anniversary Check (daily at 9 AM)
 * @route   GET /api/cron/work-anniversary
 */
const workAnniversary = async (req, res) => {
    try {
        if (!verifyCronSecret(req)) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const istNow = getISTDate();
        const todayMonth = istNow.getMonth();
        const todayDate = istNow.getDate();

        const employees = await getActiveEmployees();

        let sentCount = 0;
        for (const employee of employees) {
            if (!employee.joiningDate) continue;

            const joiningDate = new Date(employee.joiningDate);
            if (joiningDate.getMonth() === todayMonth && joiningDate.getDate() === todayDate) {
                const years = istNow.getFullYear() - joiningDate.getFullYear();
                if (years <= 0) continue; // Skip first year (joining day)

                await sendPushNotification(employee._id, {
                    title: '🏆 Happy Work Anniversary!',
                    body: `Congratulations on completing ${years} year${years > 1 ? 's' : ''} at Groww You, ${employee.name}! 🎉 Thank you for your dedication.`,
                    data: { screen: 'Dashboard', type: 'work_anniversary' },
                });
                sentCount++;
            }
        }

        res.status(200).json({ success: true, message: `Anniversary notifications sent to ${sentCount} employees` });
    } catch (error) {
        console.error('[Cron] Work Anniversary Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    punchInReminder,
    latePunchInWarning,
    absentAlert,
    punchOutReminder,
    missedPunchOut,
    weeklySummary,
    workAnniversary,
};
