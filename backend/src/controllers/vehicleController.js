// backend/src/controllers/vehicleController.js
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const { VEHICLE_STATUS } = require('../config/constants');

// @desc    Create vehicle
// @route   POST /api/vehicles
// @access  Private (Fleet Manager)
const createVehicle = async (req, res) => {
    try {
        const {
            registrationNumber,
            name,
            model,
            type,
            maxLoadCapacity,
            odometer,
            acquisitionCost,
            region
        } = req.body;

        // Check if registration number exists
        const existingVehicle = await Vehicle.findOne({ registrationNumber });
        if (existingVehicle) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle with this registration number already exists'
            });
        }

        const vehicle = await Vehicle.create({
            registrationNumber,
            name,
            model,
            type,
            maxLoadCapacity,
            odometer: odometer || 0,
            acquisitionCost,
            region: region || 'Central',
            status: VEHICLE_STATUS.AVAILABLE
        });

        res.status(201).json({
            success: true,
            data: vehicle
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

// @desc    Get all vehicles with filters
// @route   GET /api/vehicles
// @access  Private
const getVehicles = async (req, res) => {
    try {
        const { status, type, region, search, page = 1, limit = 10 } = req.query;

        // Build filter query
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (region) filter.region = region;
        if (search) {
            filter.$or = [
                { registrationNumber: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const vehicles = await Vehicle.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Vehicle.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: vehicles,
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

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private
const getVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id)
            .populate('maintenanceHistory')
            .populate({
                path: 'trips',
                select: 'source destination status createdAt'
            });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        res.status(200).json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (Fleet Manager)
const updateVehicle = async (req, res) => {
    try {
        const {
            name,
            model,
            type,
            maxLoadCapacity,
            odometer,
            acquisitionCost,
            status,
            region
        } = req.body;

        let vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Prevent updating to Available if vehicle is On Trip
        if (status === 'Available' && vehicle.status === 'On Trip') {
            return res.status(400).json({
                success: false,
                message: 'Cannot set vehicle to Available while it is On Trip'
            });
        }

        // Update fields
        if (name) vehicle.name = name;
        if (model) vehicle.model = model;
        if (type) vehicle.type = type;
        if (maxLoadCapacity) vehicle.maxLoadCapacity = maxLoadCapacity;
        if (odometer) vehicle.odometer = odometer;
        if (acquisitionCost) vehicle.acquisitionCost = acquisitionCost;
        if (status) vehicle.status = status;
        if (region) vehicle.region = region;

        await vehicle.save();

        res.status(200).json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (Fleet Manager)
const deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check if vehicle has active trips
        const activeTrips = await Trip.findOne({
            vehicle: vehicle._id,
            status: { $in: ['Draft', 'Dispatched'] }
        });

        if (activeTrips) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete vehicle with active trips'
            });
        }

        // Instead of deleting, mark as retired
        vehicle.status = VEHICLE_STATUS.RETIRED;
        await vehicle.save();

        res.status(200).json({
            success: true,
            message: 'Vehicle retired successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get available vehicles for dispatch
// @route   GET /api/vehicles/available
// @access  Private
const getAvailableVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({
            status: VEHICLE_STATUS.AVAILABLE
        }).select('registrationNumber name model type maxLoadCapacity');

        res.status(200).json({
            success: true,
            data: vehicles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update vehicle odometer
// @route   PUT /api/vehicles/:id/odometer
// @access  Private
const updateOdometer = async (req, res) => {
    try {
        const { odometer } = req.body;

        if (odometer === undefined || odometer < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid odometer reading is required'
            });
        }

        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        if (odometer < vehicle.odometer) {
            return res.status(400).json({
                success: false,
                message: 'Odometer cannot be less than current reading'
            });
        }

        vehicle.odometer = odometer;
        await vehicle.save();

        res.status(200).json({
            success: true,
            data: vehicle
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
    createVehicle,
    getVehicles,
    getVehicle,
    updateVehicle,
    deleteVehicle,
    getAvailableVehicles,
    updateOdometer
};
