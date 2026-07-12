// backend/src/routes/tripRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { USER_ROLES } = require('../config/constants');
const {
    createTrip,
    dispatchTrip,
    completeTrip,
    cancelTrip,
    getTrips,
    getTrip,
    getActiveTrips
} = require('../controllers/tripController');

router.get('/', protect, getTrips);
router.get('/active', protect, getActiveTrips);
router.get('/:id', protect, getTrip);

router.post('/', protect, createTrip);
router.put('/:id/dispatch', protect, dispatchTrip);
router.put('/:id/complete', protect, completeTrip);
router.put('/:id/cancel', protect, cancelTrip);

module.exports = router;