const PushToken = require('../models/PushToken');

/**
 * @desc    Register a push notification token
 * @route   POST /api/notifications/register-token
 * @access  Private
 */
const registerToken = async (req, res) => {
    try {
        const { token, deviceInfo } = req.body;
        const employeeId = req.user._id;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Push token is required',
            });
        }

        // Upsert — update if token exists, create if not
        await PushToken.findOneAndUpdate(
            { token },
            {
                employee: employeeId,
                token,
                deviceInfo: deviceInfo || '',
            },
            { upsert: true, new: true }
        );

        console.log(`[Notification] Token registered for employee ${employeeId}`);

        res.status(200).json({
            success: true,
            message: 'Push token registered successfully',
        });
    } catch (error) {
        console.error('Register Token Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error registering push token',
        });
    }
};

/**
 * @desc    Unregister a push notification token (on logout)
 * @route   DELETE /api/notifications/unregister-token
 * @access  Private
 */
const unregisterToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Push token is required',
            });
        }

        await PushToken.removeToken(token);

        console.log(`[Notification] Token unregistered: ${token.substring(0, 20)}...`);

        res.status(200).json({
            success: true,
            message: 'Push token unregistered successfully',
        });
    } catch (error) {
        console.error('Unregister Token Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error unregistering push token',
        });
    }
};

module.exports = {
    registerToken,
    unregisterToken,
};
