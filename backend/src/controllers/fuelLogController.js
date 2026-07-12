// backend/src/controllers/fuelLogController.js
const FuelLog = require('../models/FuelLog');
const Vehicle = require('../models/Vehicle');

// @desc    Create fuel log
// @route   POST /api/fuel-logs
// @access  Private
const createFuelLog = async (req, res) => {
    try {
        const {
            vehicleId: vehicleIdFromBody,
            vehicle: vehicleFromBody,
            liters: litersFromBody,
            quantity,
            cost: costFromBody,
            totalCost,
            odometerReading: odometerFromBody,
            odometer,
            fuelType,
            stationName,
            location,
            date,
            notes
        } = req.body;

        const vehicleId = vehicleIdFromBody || vehicleFromBody;
        const liters = litersFromBody ?? quantity;
        const cost = costFromBody ?? totalCost;
        const odometerReading = odometerFromBody ?? odometer;

        if (!vehicleId || liters === undefined || cost === undefined || odometerReading === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle, liters, cost, and odometer reading are required'
            });
        }

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Validate odometer reading
        if (odometerReading < vehicle.odometer) {
            return res.status(400).json({
                success: false,
                message: 'Odometer reading cannot be less than current odometer'
            });
        }

        const fuelLog = await FuelLog.create({
            vehicle: vehicleId,
            liters,
            cost,
            odometerReading,
            fuelType: fuelType || 'Diesel',
            stationName,
            location,
            date: date || new Date(),
            notes
        });

        // Update vehicle odometer
        vehicle.odometer = odometerReading;
        await vehicle.save();

        res.status(201).json({
            success: true,
            data: fuelLog
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

// @desc    Get all fuel logs
// @route   GET /api/fuel-logs
// @access  Private
const getFuelLogs = async (req, res) => {
    try {
        const { vehicleId, startDate, endDate, page = 1, limit = 10 } = req.query;

        const filter = {};
        if (vehicleId) filter.vehicle = vehicleId;
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const logs = await FuelLog.find(filter)
            .populate('vehicle', 'registrationNumber name')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ date: -1 });

        const total = await FuelLog.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: logs,
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

// @desc    Get single fuel log
// @route   GET /api/fuel-logs/:id
// @access  Private
const getFuelLog = async (req, res) => {
    try {
        const fuelLog = await FuelLog.findById(req.params.id)
            .populate('vehicle');

        if (!fuelLog) {
            return res.status(404).json({
                success: false,
                message: 'Fuel log not found'
            });
        }

        res.status(200).json({
            success: true,
            data: fuelLog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get fuel consumption summary
// @route   GET /api/fuel-logs/summary/:vehicleId
// @access  Private
const getFuelSummary = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const { startDate, endDate } = req.query;

        const filter = { vehicle: vehicleId };
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const logs = await FuelLog.find(filter).sort({ date: 1 });

        if (logs.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    totalLiters: 0,
                    totalCost: 0,
                    averagePricePerLiter: 0,
                    averageFuelEfficiency: 0,
                    logs: []
                }
            });
        }

        const totalLiters = logs.reduce((sum, log) => sum + log.liters, 0);
        const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
        const averagePrice = totalCost / totalLiters;

        // Calculate fuel efficiency (distance per liter)
        let totalDistance = 0;
        for (let i = 1; i < logs.length; i++) {
            const distance = logs[i].odometerReading - logs[i-1].odometerReading;
            if (distance > 0) {
                totalDistance += distance;
            }
        }
        const averageEfficiency = totalDistance / totalLiters;

        res.status(200).json({
            success: true,
            data: {
                totalLiters,
                totalCost,
                averagePricePerLiter: averagePrice || 0,
                averageFuelEfficiency: averageEfficiency || 0,
                totalDistance,
                logs
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

module.exports = {
    createFuelLog,
    getFuelLogs,
    getFuelLog,
    getFuelSummary
};
