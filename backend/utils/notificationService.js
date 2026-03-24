const { Expo } = require('expo-server-sdk');
const PushToken = require('../models/PushToken');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Get shift timing from environment variables
 */
const getShiftTiming = () => {
    const startHour = parseInt(process.env.SHIFT_START_HOUR) || 10;
    const endHour = parseInt(process.env.SHIFT_END_HOUR) || 19;
    return { startHour, endHour };
};

/**
 * Format hour to readable time string (e.g., 10 → "10:00 AM", 19 → "07:00 PM")
 */
const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${String(displayHour).padStart(2, '0')}:00 ${period}`;
};

/**
 * Send push notification to a single employee
 * @param {string} employeeId - MongoDB ObjectId of the employee
 * @param {object} notification - { title, body, data }
 */
const sendPushNotification = async (employeeId, { title, body, data = {} }) => {
    try {
        const tokens = await PushToken.getTokensForEmployee(employeeId);

        if (!tokens || tokens.length === 0) {
            return { sent: 0, errors: [] };
        }

        const messages = [];
        for (const pushToken of tokens) {
            if (!Expo.isExpoPushToken(pushToken)) {
                console.warn(`[Notification] Invalid token for employee ${employeeId}: ${pushToken}`);
                continue;
            }

            messages.push({
                to: pushToken,
                sound: 'default',
                title,
                body,
                data,
            });
        }

        if (messages.length === 0) {
            return { sent: 0, errors: [] };
        }

        const chunks = expo.chunkPushNotifications(messages);
        const results = [];
        const errors = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                results.push(...ticketChunk);

                // Check for errors in tickets
                ticketChunk.forEach((ticket, index) => {
                    if (ticket.status === 'error') {
                        errors.push({
                            token: chunk[index].to,
                            error: ticket.message,
                            details: ticket.details,
                        });

                        // Remove invalid tokens
                        if (
                            ticket.details?.error === 'DeviceNotRegistered' ||
                            ticket.details?.error === 'InvalidCredentials'
                        ) {
                            PushToken.removeToken(chunk[index].to).catch(() => {});
                        }
                    }
                });
            } catch (err) {
                console.error('[Notification] Chunk send error:', err.message);
                errors.push({ error: err.message });
            }
        }

        return { sent: results.length - errors.length, errors };
    } catch (err) {
        console.error('[Notification] Send error:', err.message);
        return { sent: 0, errors: [{ error: err.message }] };
    }
};

/**
 * Send push notifications to multiple employees
 * @param {string[]} employeeIds - Array of employee ObjectIds
 * @param {object} notification - { title, body, data }
 */
const sendBulkNotifications = async (employeeIds, { title, body, data = {} }) => {
    try {
        const tokenDocs = await PushToken.getTokensForEmployees(employeeIds);

        if (!tokenDocs || tokenDocs.length === 0) {
            return { sent: 0, errors: [] };
        }

        const messages = [];
        for (const doc of tokenDocs) {
            if (!Expo.isExpoPushToken(doc.token)) {
                continue;
            }
            messages.push({
                to: doc.token,
                sound: 'default',
                title,
                body,
                data: { ...data, employeeId: doc.employee.toString() },
            });
        }

        if (messages.length === 0) {
            return { sent: 0, errors: [] };
        }

        const chunks = expo.chunkPushNotifications(messages);
        let totalSent = 0;
        const errors = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                ticketChunk.forEach((ticket, index) => {
                    if (ticket.status === 'ok') {
                        totalSent++;
                    } else if (ticket.status === 'error') {
                        errors.push({ token: chunk[index].to, error: ticket.message });
                        if (
                            ticket.details?.error === 'DeviceNotRegistered' ||
                            ticket.details?.error === 'InvalidCredentials'
                        ) {
                            PushToken.removeToken(chunk[index].to).catch(() => {});
                        }
                    }
                });
            } catch (err) {
                console.error('[Notification] Bulk chunk error:', err.message);
                errors.push({ error: err.message });
            }
        }

        return { sent: totalSent, errors };
    } catch (err) {
        console.error('[Notification] Bulk send error:', err.message);
        return { sent: 0, errors: [{ error: err.message }] };
    }
};

/**
 * Verify cron secret from request header
 */
const verifyCronSecret = (req) => {
    const secret = req.headers['x-cron-secret'] || req.headers.authorization?.replace('Bearer ', '');
    return secret === process.env.CRON_SECRET;
};

module.exports = {
    sendPushNotification,
    sendBulkNotifications,
    getShiftTiming,
    formatHour,
    verifyCronSecret,
};
