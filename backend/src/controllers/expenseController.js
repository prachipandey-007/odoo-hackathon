// backend/src/controllers/expenseController.js
const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');

// @desc    Create expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
    try {
        const {
            vehicleId: vehicleIdFromBody,
            vehicle: vehicleFromBody,
            type,
            description,
            amount,
            date,
            category,
            paidBy,
            notes,
            receiptUrl
        } = req.body;

        const vehicleId = vehicleIdFromBody || vehicleFromBody;

        if (!vehicleId || !type || !description || amount === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle, type, description, and amount are required'
            });
        }

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        const expense = await Expense.create({
            vehicle: vehicleId,
            type,
            description,
            amount,
            date: date || new Date(),
            category: category || 'Operational',
            paidBy,
            notes,
            receiptUrl
        });

        res.status(201).json({
            success: true,
            data: expense
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
    try {
        const { vehicleId, type, category, startDate, endDate, page = 1, limit = 10 } = req.query;

        const filter = {};
        if (vehicleId) filter.vehicle = vehicleId;
        if (type) filter.type = type;
        if (category) filter.category = category;
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const expenses = await Expense.find(filter)
            .populate('vehicle', 'registrationNumber name')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ date: -1 });

        const total = await Expense.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: expenses,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get expense summary by vehicle
// @route   GET /api/expenses/summary/:vehicleId
// @access  Private
const getExpenseSummary = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const { startDate, endDate } = req.query;

        const filter = { vehicle: vehicleId };
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const expenses = await Expense.find(filter);

        const summary = {
            totalAmount: 0,
            byType: {},
            byCategory: {}
        };

        expenses.forEach(expense => {
            summary.totalAmount += expense.amount;
            
            if (!summary.byType[expense.type]) {
                summary.byType[expense.type] = 0;
            }
            summary.byType[expense.type] += expense.amount;
            
            if (!summary.byCategory[expense.category]) {
                summary.byCategory[expense.category] = 0;
            }
            summary.byCategory[expense.category] += expense.amount;
        });

        res.status(200).json({
            success: true,
            data: summary,
            count: expenses.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    createExpense,
    getExpenses,
    getExpenseSummary
};
