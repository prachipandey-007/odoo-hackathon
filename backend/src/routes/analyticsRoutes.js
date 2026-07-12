// backend/src/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getDashboardKPIs,
    getVehicleROI,
    getTripAnalytics,
    getFuelEfficiency,
    getOperationalCost
} = require('../controllers/analyticsController');

router.get('/dashboard', protect, getDashboardKPIs);
router.get('/roi', protect, getVehicleROI);
router.get('/trips', protect, getTripAnalytics);
router.get('/fuel-efficiency', protect, getFuelEfficiency);
router.get('/operational-cost', protect, getOperationalCost);

module.exports = router;