// backend/src/routes/driverRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');
const {
    createDriver,
    getDrivers,
    getDriver,
    updateDriver,
    deleteDriver,
    getAvailableDrivers,
    getExpiringLicenses
} = require('../controllers/driverController');

router.get('/', protect, getDrivers);
router.get('/available', protect, getAvailableDrivers);
router.get('/expiring-licenses', protect, authorize(USER_ROLES.SAFETY_OFFICER), getExpiringLicenses);
router.get('/:id', protect, getDriver);

router.post('/', protect, authorize(USER_ROLES.FLEET_MANAGER), createDriver);
router.put('/:id', protect, authorize(USER_ROLES.FLEET_MANAGER), updateDriver);
router.delete('/:id', protect, authorize(USER_ROLES.FLEET_MANAGER), deleteDriver);

module.exports = router;