const express = require('express');
const { body } = require('express-validator');
const { login, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const loginValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email or Employee ID is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
];

// Routes
router.post('/login', loginValidation, login);
router.get('/profile', protect, getProfile);

module.exports = router;
