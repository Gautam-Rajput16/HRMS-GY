const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Employee reference is required'],
        },
        month: {
            type: Number,
            required: [true, 'Month is required'],
            min: 1,
            max: 12,
        },
        year: {
            type: Number,
            required: [true, 'Year is required'],
        },

        // Attendance Summary
        workingDaysInMonth: {
            type: Number,
            required: true,
        },
        daysPresent: {
            type: Number,
            required: true,
            default: 0,
        },
        daysAbsent: {
            type: Number,
            required: true,
            default: 0,
        },
        paidLeaveDays: {
            type: Number,
            default: 0,
        },
        unpaidLeaveDays: {
            type: Number,
            default: 0,
        },
        halfDays: {
            type: Number,
            default: 0,
        },

        // Salary Breakdown - Earnings
        baseSalary: {
            type: Number,
            required: true,
            default: 0,
        },
        grossSalary: {
            type: Number,
            required: true,
        },

        // Deductions
        fixedDeductions: {
            type: Number,
            default: 0,
        },
        unpaidLeaveDeduction: {
            type: Number,
            default: 0,
        },
        absentDeduction: {
            type: Number,
            default: 0,
        },
        totalDeductions: {
            type: Number,
            required: true,
        },

        // Final Amount
        netSalary: {
            type: Number,
            required: true,
        },

        // Status
        status: {
            type: String,
            enum: ['draft', 'processed', 'paid'],
            default: 'draft',
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        processedOn: {
            type: Date,
        },
        paidOn: {
            type: Date,
        },

        // Additional notes
        notes: {
            type: String,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
    }
);

// Unique index - one payroll record per employee per month
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ status: 1 });
payrollSchema.index({ year: 1, month: 1 });

// Virtual for formatted month-year
payrollSchema.virtual('monthYear').get(function () {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[this.month - 1]} ${this.year}`;
});

// Virtual for per day salary
payrollSchema.virtual('perDaySalary').get(function () {
    if (this.workingDaysInMonth === 0) return 0;
    return Math.round(this.grossSalary / this.workingDaysInMonth);
});

// Ensure virtuals are included in JSON
payrollSchema.set('toJSON', { virtuals: true });
payrollSchema.set('toObject', { virtuals: true });

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll;
