const express = require('express');
const { body } = require('express-validator');
const {
    getAllEmployees,
    getEmployee,
    addEmployee,
    updateEmployee,
    toggleEmployeeStatus,
    deleteEmployee,
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { isAdminOrHR } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require admin or HR access
router.use(protect);
router.use(isAdminOrHR);

// Validation rules
const addEmployeeValidation = [
    body('employeeId')
        .notEmpty()
        .withMessage('Employee ID is required')
        .trim()
        .isLength({ min: 2, max: 20 })
        .withMessage('Employee ID must be 2-20 characters'),
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be 2-100 characters'),
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('department')
        .optional()
        .trim(),
    body('designation')
        .optional()
        .trim(),
    body('phone')
        .optional()
        .trim(),
];

const updateEmployeeValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be 2-100 characters'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('department')
        .optional()
        .trim(),
    body('designation')
        .optional()
        .trim(),
    body('phone')
        .optional()
        .trim(),
    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
];

// Routes
router.get('/', getAllEmployees);
router.get('/:id', getEmployee);
router.post('/', addEmployeeValidation, addEmployee);
router.put('/:id', updateEmployeeValidation, updateEmployee);
router.patch('/:id/toggle', toggleEmployeeStatus);
router.delete('/:id', deleteEmployee);

module.exports = router;
