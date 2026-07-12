// backend/src/models/Expense.js
const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Vehicle is required']
    },
    type: {
        type: String,
        required: [true, 'Expense type is required'],
        enum: ['Toll', 'Parking', 'Cleaning', 'Repair', 'Insurance', 'Registration', 'Other']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be positive']
    },
    date: {
        type: Date,
        default: Date.now
    },
    receiptUrl: String,
    category: {
        type: String,
        enum: ['Operational', 'Maintenance', 'Administrative'],
        default: 'Operational'
    },
    paidBy: String,
    notes: String
}, {
    timestamps: true
});

ExpenseSchema.index({ vehicle: 1, date: -1 });

module.exports = mongoose.model('Expense', ExpenseSchema);