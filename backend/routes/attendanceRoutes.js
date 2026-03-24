const express = require('express');
const { body } = require('express-validator');
const {
    markLogin,
    markLogout,
    getTodayStatus,
    getMyAttendance,
    getAllAttendance,
    getStats,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { isAdminOrHR } = require('../middleware/roleMiddleware');
const { generateQRCode, getQRInfo } = require('../controllers/qrController');

const router = express.Router();

// Validation rules for face attendance (photo required)
const faceAttendanceValidation = [
    body('photo')
        .notEmpty()
        .withMessage('Photo is required'),
    body('latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Valid latitude is required'),
    body('longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Valid longitude is required'),
    // Reject dummy 0,0 coordinates (sent when location fetch fails on mobile)
    body().custom((value) => {
        if (Number(value.latitude) === 0 && Number(value.longitude) === 0) {
            throw new Error('Location is required. Please enable location services and try again.');
        }
        return true;
    }),
];

// Validation rules for QR attendance (qrCode required, no photo)
const qrAttendanceValidation = [
    body('qrCode')
        .notEmpty()
        .withMessage('QR Code is required'),
    body('latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Valid latitude is required'),
    body('longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Valid longitude is required'),
    body().custom((value) => {
        if (Number(value.latitude) === 0 && Number(value.longitude) === 0) {
            throw new Error('Location is required. Please enable location services and try again.');
        }
        return true;
    }),
];

// Employee routes — Face attendance
router.post('/login', protect, faceAttendanceValidation, markLogin);
router.post('/logout', protect, faceAttendanceValidation, markLogout);

// Employee routes — QR attendance
router.post('/qr-login', protect, qrAttendanceValidation, markLogin);
router.post('/qr-logout', protect, qrAttendanceValidation, markLogout);

router.get('/today-status', protect, getTodayStatus);
router.get('/my', protect, getMyAttendance);

// Admin/HR routes
router.get('/all', protect, isAdminOrHR, getAllAttendance);
router.get('/stats', protect, isAdminOrHR, getStats);
router.post('/generate-qr', protect, isAdminOrHR, generateQRCode);
router.get('/qr-info', protect, isAdminOrHR, getQRInfo);

module.exports = router;
