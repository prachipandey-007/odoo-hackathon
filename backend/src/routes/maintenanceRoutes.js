// backend/src/routes/maintenanceRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');
const {
    createMaintenance,
    getMaintenanceRecords,
    getMaintenance,
    updateMaintenance,
    completeMaintenance,
    getVehicleMaintenance
} = require('../controllers/maintenanceController');

router.get('/', protect, getMaintenanceRecords);
router.get('/vehicle/:vehicleId', protect, getVehicleMaintenance);
router.get('/:id', protect, getMaintenance);

router.post('/', protect, authorize(USER_ROLES.FLEET_MANAGER), createMaintenance);
router.put('/:id', protect, authorize(USER_ROLES.FLEET_MANAGER), updateMaintenance);
router.put('/:id/complete', protect, authorize(USER_ROLES.FLEET_MANAGER), completeMaintenance);

module.exports = router;
