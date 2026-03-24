const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
    {
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

const attendanceSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Employee reference is required'],
        },
        date: {
            type: Date,
            required: [true, 'Date is required'],
            default: () => {
                const now = new Date();
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            },
        },
        // Login details
        loginTime: {
            type: Date,
            default: null,
        },
        loginPhoto: {
            type: String, // Cloudinary URL
            default: null,
        },
        loginLocation: {
            type: locationSchema,
            default: null,
        },
        loginFaceDetected: {
            type: Boolean,
            default: false,
        },
        loginFaceConfidence: {
            type: Number,
            default: null,
        },
        // Logout details
        logoutTime: {
            type: Date,
            default: null,
        },
        logoutPhoto: {
            type: String, // Cloudinary URL
            default: null,
        },
        logoutLocation: {
            type: locationSchema,
            default: null,
        },
        logoutFaceDetected: {
            type: Boolean,
            default: false,
        },
        logoutFaceConfidence: {
            type: Number,
            default: null,
        },
        // Overall status
        status: {
            type: String,
            enum: ['present', 'incomplete', 'absent'],
            default: 'incomplete',
        },
        // Calculated working hours (in minutes)
        workingMinutes: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });

// Calculate working hours when logout is recorded
attendanceSchema.pre('save', function (next) {
    if (this.loginTime && this.logoutTime) {
        const diff = this.logoutTime.getTime() - this.loginTime.getTime();
        this.workingMinutes = Math.floor(diff / (1000 * 60));
        this.status = 'present';
    } else if (this.loginTime && !this.logoutTime) {
        this.status = 'incomplete';
    }
    next();
});

// Virtual for formatted working hours
attendanceSchema.virtual('workingHours').get(function () {
    if (this.workingMinutes === 0) return '0h 0m';
    const hours = Math.floor(this.workingMinutes / 60);
    const minutes = this.workingMinutes % 60;
    return `${hours}h ${minutes}m`;
});

// Ensure virtuals are included in JSON
attendanceSchema.set('toJSON', { virtuals: true });
attendanceSchema.set('toObject', { virtuals: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
