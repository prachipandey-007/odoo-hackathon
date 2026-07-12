// backend/src/routes/expenseRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createExpense,
    getExpenses,
    getExpenseSummary
} = require('../controllers/expenseController');

router.get('/', protect, getExpenses);
router.get('/summary/:vehicleId', protect, getExpenseSummary);
router.post('/', protect, createExpense);

module.exports = router;