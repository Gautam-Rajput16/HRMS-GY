const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Employee reference is required'],
        },
        leaveType: {
            type: String,
            enum: ['casual', 'sick', 'paid', 'unpaid'],
            required: [true, 'Leave type is required'],
        },
        startDate: {
            type: Date,
            required: [true, 'Start date is required'],
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required'],
        },
        totalDays: {
            type: Number,
            required: true,
            min: [0.5, 'Minimum leave is half day'],
        },
        reason: {
            type: String,
            required: [true, 'Reason is required'],
            trim: true,
            maxlength: [500, 'Reason cannot exceed 500 characters'],
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'cancelled'],
            default: 'pending',
        },
        appliedOn: {
            type: Date,
            default: Date.now,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedOn: {
            type: Date,
        },
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: [300, 'Rejection reason cannot exceed 300 characters'],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
leaveSchema.index({ employee: 1, startDate: 1, endDate: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ appliedOn: -1 });

// Validate that end date is after or equal to start date
leaveSchema.pre('validate', function (next) {
    if (this.startDate && this.endDate) {
        if (this.endDate < this.startDate) {
            this.invalidate('endDate', 'End date must be after or equal to start date');
        }
    }
    next();
});

// Calculate total days before saving
leaveSchema.pre('save', function (next) {
    if (this.startDate && this.endDate) {
        const diffTime = Math.abs(this.endDate - this.startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        this.totalDays = diffDays;
    }
    next();
});

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;
