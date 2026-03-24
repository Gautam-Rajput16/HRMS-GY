const mongoose = require('mongoose');

const pushTokenSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        token: {
            type: String,
            required: [true, 'Push token is required'],
            unique: true,
            trim: true,
        },
        deviceInfo: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Index for fast lookup by employee
pushTokenSchema.index({ employee: 1 });

// Static method: Get all tokens for an employee
pushTokenSchema.statics.getTokensForEmployee = async function (employeeId) {
    const docs = await this.find({ employee: employeeId });
    return docs.map((d) => d.token);
};

// Static method: Get all tokens for multiple employees
pushTokenSchema.statics.getTokensForEmployees = async function (employeeIds) {
    const docs = await this.find({ employee: { $in: employeeIds } });
    return docs;
};

// Static method: Remove token
pushTokenSchema.statics.removeToken = async function (token) {
    return this.deleteOne({ token });
};

const PushToken = mongoose.model('PushToken', pushTokenSchema);

module.exports = PushToken;
