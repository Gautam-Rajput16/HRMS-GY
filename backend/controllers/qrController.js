const crypto = require('crypto');

/**
 * @desc    Generate a QR code payload with 1-month validity
 * @route   POST /api/attendance/generate-qr
 * @access  Private (Admin/HR)
 */
const generateQRCode = async (req, res) => {
    try {
        const secret = process.env.QR_SECRET || 'IDENTIX-HRMS-QR-ATTENDANCE-2026';
        const createdAt = new Date();
        const expiresAt = new Date(createdAt);
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month validity

        // The QR payload is a JSON string containing the secret + expiry
        const qrPayload = JSON.stringify({
            secret,
            createdAt: createdAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            hash: crypto.createHash('sha256').update(secret + expiresAt.toISOString()).digest('hex').slice(0, 16),
        });

        res.status(200).json({
            success: true,
            data: {
                qrPayload,
                createdAt,
                expiresAt,
                secret, // Also return the raw secret for display
            },
        });
    } catch (error) {
        console.error('Generate QR Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error generating QR code',
        });
    }
};

/**
 * @desc    Get current QR code info (secret + validity)
 * @route   GET /api/attendance/qr-info
 * @access  Private (Admin/HR)
 */
const getQRInfo = async (req, res) => {
    try {
        const secret = process.env.QR_SECRET || 'IDENTIX-HRMS-QR-ATTENDANCE-2026';

        res.status(200).json({
            success: true,
            data: {
                secret,
                message: 'This is the current QR secret. Generate a QR code containing this exact string.',
            },
        });
    } catch (error) {
        console.error('Get QR Info Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching QR info',
        });
    }
};

module.exports = {
    generateQRCode,
    getQRInfo,
};
