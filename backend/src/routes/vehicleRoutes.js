// backend/src/routes/vehicleRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');
const {
    createVehicle,
    getVehicles,
    getVehicle,
    updateVehicle,
    deleteVehicle,
    getAvailableVehicles,
    updateOdometer
} = require('../controllers/vehicleController');

// Public routes (authenticated)
router.get('/', protect, getVehicles);
router.get('/available', protect, getAvailableVehicles);
router.get('/:id', protect, getVehicle);

// Fleet Manager only routes
router.post('/', protect, authorize(USER_ROLES.FLEET_MANAGER), createVehicle);
router.put('/:id', protect, authorize(USER_ROLES.FLEET_MANAGER), updateVehicle);
router.delete('/:id', protect, authorize(USER_ROLES.FLEET_MANAGER), deleteVehicle);
router.put('/:id/odometer', protect, authorize(USER_ROLES.FLEET_MANAGER), updateOdometer);

module.exports = router;