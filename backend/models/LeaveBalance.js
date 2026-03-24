const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Employee reference is required'],
        },
        year: {
            type: Number,
            required: [true, 'Year is required'],
        },
        casual: {
            total: { type: Number, default: 12 },
            used: { type: Number, default: 0 },
            remaining: { type: Number, default: 12 },
        },
        sick: {
            total: { type: Number, default: 12 },
            used: { type: Number, default: 0 },
            remaining: { type: Number, default: 12 },
        },
        paid: {
            total: { type: Number, default: 15 },
            used: { type: Number, default: 0 },
            remaining: { type: Number, default: 15 },
        },
    },
    {
        timestamps: true,
    }
);

// Unique index per employee per year
leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

// Method to deduct leave balance
leaveBalanceSchema.methods.deductLeave = function (leaveType, days) {
    if (['casual', 'sick', 'paid'].includes(leaveType)) {
        this[leaveType].used += days;
        this[leaveType].remaining = this[leaveType].total - this[leaveType].used;
    }
    return this.save();
};

// Method to restore leave balance (when leave is cancelled)
leaveBalanceSchema.methods.restoreLeave = function (leaveType, days) {
    if (['casual', 'sick', 'paid'].includes(leaveType)) {
        this[leaveType].used = Math.max(0, this[leaveType].used - days);
        this[leaveType].remaining = this[leaveType].total - this[leaveType].used;
    }
    return this.save();
};

// Static method to get or create leave balance for an employee
leaveBalanceSchema.statics.getOrCreate = async function (employeeId, year) {
    let balance = await this.findOne({ employee: employeeId, year });

    if (!balance) {
        balance = await this.create({
            employee: employeeId,
            year,
        });
    }

    return balance;
};

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);

module.exports = LeaveBalance;
