// backend/src/routes/fuelLogRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createFuelLog,
    getFuelLogs,
    getFuelLog,
    getFuelSummary
} = require('../controllers/fuelLogController');

router.get('/', protect, getFuelLogs);
router.get('/summary/:vehicleId', protect, getFuelSummary);
router.get('/:id', protect, getFuelLog);
router.post('/', protect, createFuelLog);

module.exports = router;
