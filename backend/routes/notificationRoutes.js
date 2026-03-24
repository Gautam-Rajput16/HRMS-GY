const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    registerToken,
    unregisterToken,
} = require('../controllers/notificationController');

// Token management
router.post('/register-token', protect, registerToken);
router.delete('/unregister-token', protect, unregisterToken);

module.exports = router;
