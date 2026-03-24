const express = require('express');
const { body } = require('express-validator');
const {
    getAllAttendance,
    getAttendanceById,
    updateAttendance,
    deleteAttendance,
    getStats,
    getEmployees,
    createAttendance,
} = require('../controllers/developerController');
const { protect } = require('../middleware/authMiddleware');
const { isDeveloper } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require developer authentication
router.use(protect);
router.use(isDeveloper);

// Validation rules for attendance update
const updateValidation = [
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('loginTime').optional().isISO8601().withMessage('Invalid login time format'),
    body('logoutTime').optional().isISO8601().withMessage('Invalid logout time format'),
    body('loginLocation.latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Invalid login latitude'),
    body('loginLocation.longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Invalid login longitude'),
    body('logoutLocation.latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Invalid logout latitude'),
    body('logoutLocation.longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Invalid logout longitude'),
    body('status')
        .optional()
        .isIn(['present', 'incomplete', 'absent'])
        .withMessage('Invalid status'),
];

// Validation rules for attendance creation
const createValidation = [
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('date').notEmpty().isISO8601().withMessage('Valid date is required'),
    body('loginTime').optional().isISO8601().withMessage('Invalid login time format'),
    body('logoutTime').optional().isISO8601().withMessage('Invalid logout time format'),
    body('loginLocation.latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Invalid login latitude'),
    body('loginLocation.longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Invalid login longitude'),
    body('logoutLocation.latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Invalid logout latitude'),
    body('logoutLocation.longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Invalid logout longitude'),
    body('status')
        .optional()
        .isIn(['present', 'incomplete', 'absent'])
        .withMessage('Invalid status'),
];

// Routes
router.get('/stats', getStats);
router.get('/employees', getEmployees);
router.get('/attendance', getAllAttendance);
router.get('/attendance/:id', getAttendanceById);
router.post('/attendance', createValidation, createAttendance);
router.put('/attendance/:id', updateValidation, updateAttendance);
router.delete('/attendance/:id', deleteAttendance);

module.exports = router;
