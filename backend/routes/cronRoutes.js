const express = require('express');
const router = express.Router();
const {
    punchInReminder,
    latePunchInWarning,
    absentAlert,
    punchOutReminder,
    missedPunchOut,
    weeklySummary,
    workAnniversary,
} = require('../controllers/notificationCronController');

// All cron routes are GET endpoints called by Vercel Cron
// Protected by CRON_SECRET header validation

router.get('/punch-in-reminder', punchInReminder);
router.get('/late-punch-in', latePunchInWarning);
router.get('/absent-alert', absentAlert);
router.get('/punch-out-reminder', punchOutReminder);
router.get('/missed-punch-out', missedPunchOut);
router.get('/weekly-summary', weeklySummary);
router.get('/work-anniversary', workAnniversary);

module.exports = router;
