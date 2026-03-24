const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { isAdminOrHR } = require('../middleware/roleMiddleware');
const {
    applyLeave,
    getMyLeaves,
    getMyLeaveBalance,
    cancelLeave,
    getAllLeaves,
    getPendingLeaves,
    approveLeave,
    rejectLeave,
    getLeaveStats,
} = require('../controllers/leaveController');

// Validation rules
const applyLeaveValidation = [
    body('leaveType')
        .isIn(['casual', 'sick', 'paid', 'unpaid'])
        .withMessage('Invalid leave type'),
    body('startDate')
        .isISO8601()
        .withMessage('Valid start date is required'),
    body('endDate')
        .isISO8601()
        .withMessage('Valid end date is required'),
    body('reason')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Reason must be between 10 and 500 characters'),
];

// ===== Employee Routes =====

// Apply for leave
router.post('/apply', protect, applyLeaveValidation, applyLeave);

// Get my leave requests
router.get('/my', protect, getMyLeaves);

// Get my leave balance
router.get('/my/balance', protect, getMyLeaveBalance);

// Cancel pending leave
router.delete('/:id/cancel', protect, cancelLeave);

// ===== HR/Admin Routes =====

// Get all leave requests
router.get('/', protect, isAdminOrHR, getAllLeaves);

// Get leave statistics
router.get('/stats', protect, isAdminOrHR, getLeaveStats);

// Get pending leave requests
router.get('/pending', protect, isAdminOrHR, getPendingLeaves);

// Approve leave request
router.patch('/:id/approve', protect, isAdminOrHR, approveLeave);

// Reject leave request
router.patch(
    '/:id/reject',
    protect,
    isAdminOrHR,
    [
        body('reason')
            .optional()
            .trim()
            .isLength({ max: 300 })
            .withMessage('Rejection reason cannot exceed 300 characters'),
    ],
    rejectLeave
);

module.exports = router;
