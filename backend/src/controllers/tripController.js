// backend/src/controllers/tripController.js
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const { VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS } = require('../config/constants');

// @desc    Create trip (Draft)
// @route   POST /api/trips
// @access  Private
const createTrip = async (req, res) => {
    try {
        const {
            vehicleId: vehicleIdFromBody,
            driverId: driverIdFromBody,
            vehicle: vehicleFromBody,
            driver: driverFromBody,
            source,
            destination,
            cargoWeight,
            plannedDistance,
            cargoType,
            notes,
            revenue
        } = req.body;

        const vehicleId = vehicleIdFromBody || vehicleFromBody;
        const driverId = driverIdFromBody || driverFromBody;

        if (!vehicleId || !driverId || !source || !destination || cargoWeight === undefined || plannedDistance === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle, driver, source, destination, cargo weight, and planned distance are required'
            });
        }

        // Validate vehicle
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check vehicle availability
        if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
            return res.status(400).json({
                success: false,
                message: `Vehicle is not available (Current status: ${vehicle.status})`
            });
        }

        // Check cargo weight
        if (cargoWeight > vehicle.maxLoadCapacity) {
            return res.status(400).json({
                success: false,
                message: `Cargo weight (${cargoWeight}kg) exceeds vehicle capacity (${vehicle.maxLoadCapacity}kg)`
            });
        }

        // Validate driver
        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Check driver availability
        if (driver.status !== DRIVER_STATUS.AVAILABLE) {
            return res.status(400).json({
                success: false,
                message: `Driver is not available (Current status: ${driver.status})`
            });
        }

        // Check license expiry
        if (driver.isLicenseExpired()) {
            return res.status(400).json({
                success: false,
                message: 'Driver license has expired'
            });
        }

        // Check if driver is suspended
        if (driver.status === DRIVER_STATUS.SUSPENDED) {
            return res.status(400).json({
                success: false,
                message: 'Driver is suspended'
            });
        }

        // Check for vehicle on existing trip
        const existingVehicleTrip = await Trip.findOne({
            vehicle: vehicleId,
            status: { $in: [TRIP_STATUS.DRAFT, TRIP_STATUS.DISPATCHED] }
        });

        if (existingVehicleTrip) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle is already assigned to another trip'
            });
        }

        // Check for driver on existing trip
        const existingDriverTrip = await Trip.findOne({
            driver: driverId,
            status: { $in: [TRIP_STATUS.DRAFT, TRIP_STATUS.DISPATCHED] }
        });

        if (existingDriverTrip) {
            return res.status(400).json({
                success: false,
                message: 'Driver is already assigned to another trip'
            });
        }

        const trip = await Trip.create({
            vehicle: vehicleId,
            driver: driverId,
            source,
            destination,
            cargoWeight,
            plannedDistance,
            cargoType: cargoType || 'General',
            notes,
            revenue: revenue || 0,
            status: TRIP_STATUS.DRAFT
        });

        res.status(201).json({
            success: true,
            data: trip
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

// @desc    Dispatch trip
// @route   PUT /api/trips/:id/dispatch
// @access  Private
const dispatchTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        if (trip.status !== TRIP_STATUS.DRAFT) {
            return res.status(400).json({
                success: false,
                message: `Only draft trips can be dispatched. Current status: ${trip.status}`
            });
        }

        // Verify vehicle still available
        const vehicle = await Vehicle.findById(trip.vehicle);
        if (!vehicle || vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle is no longer available'
            });
        }

        // Verify driver still available
        const driver = await Driver.findById(trip.driver);
        if (!driver || driver.status !== DRIVER_STATUS.AVAILABLE) {
            return res.status(400).json({
                success: false,
                message: 'Driver is no longer available'
            });
        }

        // Check license still valid
        if (driver.isLicenseExpired()) {
            return res.status(400).json({
                success: false,
                message: 'Driver license has expired'
            });
        }

        // Update vehicle and driver status
        vehicle.status = VEHICLE_STATUS.ON_TRIP;
        await vehicle.save();

        driver.status = DRIVER_STATUS.ON_TRIP;
        await driver.save();

        // Update trip
        trip.status = TRIP_STATUS.DISPATCHED;
        trip.dispatchedAt = new Date();
        await trip.save();

        res.status(200).json({
            success: true,
            data: trip,
            message: 'Trip dispatched successfully'
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

// @desc    Complete trip
// @route   PUT /api/trips/:id/complete
// @access  Private
const completeTrip = async (req, res) => {
    try {
        const { actualDistance, fuelConsumed, revenue } = req.body;

        const trip = await Trip.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        if (trip.status !== TRIP_STATUS.DISPATCHED) {
            return res.status(400).json({
                success: false,
                message: `Only dispatched trips can be completed. Current status: ${trip.status}`
            });
        }

        // Validate actual distance
        if (actualDistance && actualDistance < 0) {
            return res.status(400).json({
                success: false,
                message: 'Actual distance must be positive'
            });
        }

        // Update trip
        trip.status = TRIP_STATUS.COMPLETED;
        trip.completedAt = new Date();
        if (actualDistance) trip.actualDistance = actualDistance;
        if (fuelConsumed) trip.fuelConsumed = fuelConsumed;
        if (revenue) trip.revenue = revenue;

        // Calculate fuel efficiency if both values exist
        if (trip.actualDistance && trip.fuelConsumed) {
            trip.fuelEfficiency = trip.actualDistance / trip.fuelConsumed;
        }

        await trip.save();

        // Update vehicle status back to Available and odometer
        const vehicle = await Vehicle.findById(trip.vehicle);
        if (vehicle && vehicle.status === VEHICLE_STATUS.ON_TRIP) {
            vehicle.status = VEHICLE_STATUS.AVAILABLE;
            if (actualDistance) {
                vehicle.odometer += actualDistance;
            }
            await vehicle.save();
        }

        // Update driver status back to Available
        const driver = await Driver.findById(trip.driver);
        if (driver && driver.status === DRIVER_STATUS.ON_TRIP) {
            driver.status = DRIVER_STATUS.AVAILABLE;
            await driver.save();
        }

        res.status(200).json({
            success: true,
            data: trip,
            message: 'Trip completed successfully'
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

// @desc    Cancel trip
// @route   PUT /api/trips/:id/cancel
// @access  Private
const cancelTrip = async (req, res) => {
    try {
        const { cancellationReason } = req.body;

        const trip = await Trip.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        if (trip.status === TRIP_STATUS.COMPLETED || trip.status === TRIP_STATUS.CANCELLED) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel a ${trip.status} trip`
            });
        }

        // Restore vehicle and driver if trip was dispatched
        if (trip.status === TRIP_STATUS.DISPATCHED) {
            const vehicle = await Vehicle.findById(trip.vehicle);
            if (vehicle && vehicle.status === VEHICLE_STATUS.ON_TRIP) {
                vehicle.status = VEHICLE_STATUS.AVAILABLE;
                await vehicle.save();
            }

            const driver = await Driver.findById(trip.driver);
            if (driver && driver.status === DRIVER_STATUS.ON_TRIP) {
                driver.status = DRIVER_STATUS.AVAILABLE;
                await driver.save();
            }
        }

        trip.status = TRIP_STATUS.CANCELLED;
        trip.cancelledAt = new Date();
        trip.cancellationReason = cancellationReason || 'No reason provided';
        await trip.save();

        res.status(200).json({
            success: true,
            data: trip,
            message: 'Trip cancelled successfully'
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

// @desc    Get all trips with filters
// @route   GET /api/trips
// @access  Private
const getTrips = async (req, res) => {
    try {
        const { status, startDate, endDate, vehicleId, driverId, page = 1, limit = 10 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (vehicleId) filter.vehicle = vehicleId;
        if (driverId) filter.driver = driverId;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const trips = await Trip.find(filter)
            .populate('vehicle', 'registrationNumber name model')
            .populate('driver', 'name licenseNumber')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Trip.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: trips,
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

// @desc    Get single trip
// @route   GET /api/trips/:id
// @access  Private
const getTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id)
            .populate('vehicle')
            .populate('driver');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        res.status(200).json({
            success: true,
            data: trip
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get active trips (Dispatched)
// @route   GET /api/trips/active
// @access  Private
const getActiveTrips = async (req, res) => {
    try {
        const trips = await Trip.find({
            status: TRIP_STATUS.DISPATCHED
        })
        .populate('vehicle', 'registrationNumber name model')
        .populate('driver', 'name licenseNumber')
        .sort({ dispatchedAt: -1 });

        res.status(200).json({
            success: true,
            count: trips.length,
            data: trips
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
    createTrip,
    dispatchTrip,
    completeTrip,
    cancelTrip,
    getTrips,
    getTrip,
    getActiveTrips
};
