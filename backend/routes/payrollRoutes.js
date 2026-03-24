const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { isAdminOrHR } = require('../middleware/roleMiddleware');
const {
    generateMonthlyPayroll,
    getAllPayroll,
    getMyPayroll,
    getPayrollById,
    updatePayrollStatus,
    downloadPayslip,
    getPayrollStats,
} = require('../controllers/payrollController');

// ===== Employee Routes =====

// Get my payroll history
router.get('/my', protect, getMyPayroll);

// Download my payslip (employee can download their own)
router.get('/my/:id/payslip', protect, downloadPayslip);

// ===== HR/Admin Routes =====

// Generate monthly payroll
router.post(
    '/generate',
    protect,
    isAdminOrHR,
    [
        body('month')
            .isInt({ min: 1, max: 12 })
            .withMessage('Month must be between 1 and 12'),
        body('year')
            .isInt({ min: 2020, max: 2100 })
            .withMessage('Invalid year'),
    ],
    generateMonthlyPayroll
);

// Get all payroll records
router.get('/', protect, isAdminOrHR, getAllPayroll);

// Get payroll statistics
router.get('/stats', protect, isAdminOrHR, getPayrollStats);

// Get payroll by ID
router.get('/:id', protect, getPayrollById);

// Update payroll status
router.patch(
    '/:id/status',
    protect,
    isAdminOrHR,
    [
        body('status')
            .isIn(['draft', 'processed', 'paid'])
            .withMessage('Invalid status'),
    ],
    updatePayrollStatus
);

// Download payslip PDF (admin can download any)
router.get('/:id/payslip', protect, downloadPayslip);

module.exports = router;
