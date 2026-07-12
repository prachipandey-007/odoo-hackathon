// backend/src/controllers/maintenanceController.js
const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const { VEHICLE_STATUS } = require('../config/constants');

// @desc    Create maintenance record
// @route   POST /api/maintenance
// @access  Private (Fleet Manager)
const createMaintenance = async (req, res) => {
    try {
        const {
            vehicleId: vehicleIdFromBody,
            vehicle: vehicleFromBody,
            type,
            description,
            cost,
            scheduledDate,
            priority,
            serviceProvider,
            technicianName,
            partsUsed
        } = req.body;

        const vehicleId = vehicleIdFromBody || vehicleFromBody;

        if (!vehicleId || !type || !description || cost === undefined || !scheduledDate) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle, type, description, cost, and scheduled date are required'
            });
        }

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        if (vehicle.status === VEHICLE_STATUS.RETIRED) {
            return res.status(400).json({
                success: false,
                message: 'Cannot create maintenance for retired vehicle'
            });
        }

        // Auto-set vehicle to In Shop if maintenance is active
        if (vehicle.status !== VEHICLE_STATUS.IN_SHOP) {
            vehicle.status = VEHICLE_STATUS.IN_SHOP;
            await vehicle.save();
        }

        const maintenance = await Maintenance.create({
            vehicle: vehicleId,
            type,
            description,
            cost,
            scheduledDate: new Date(scheduledDate),
            priority: priority || 'Medium',
            status: 'Active',
            serviceProvider,
            technicianName,
            partsUsed
        });

        // Add to vehicle's maintenance history
        vehicle.maintenanceHistory.push(maintenance._id);
        await vehicle.save();

        res.status(201).json({
            success: true,
            data: maintenance
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

// @desc    Get all maintenance records
// @route   GET /api/maintenance
// @access  Private
const getMaintenanceRecords = async (req, res) => {
    try {
        const { status, vehicleId, startDate, endDate, page = 1, limit = 10 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (vehicleId) filter.vehicle = vehicleId;
        if (startDate || endDate) {
            filter.scheduledDate = {};
            if (startDate) filter.scheduledDate.$gte = new Date(startDate);
            if (endDate) filter.scheduledDate.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const records = await Maintenance.find(filter)
            .populate('vehicle', 'registrationNumber name model status')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ scheduledDate: -1 });

        const total = await Maintenance.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: records,
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

// @desc    Get single maintenance record
// @route   GET /api/maintenance/:id
// @access  Private
const getMaintenance = async (req, res) => {
    try {
        const maintenance = await Maintenance.findById(req.params.id)
            .populate('vehicle');

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance record not found'
            });
        }

        res.status(200).json({
            success: true,
            data: maintenance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update maintenance record
// @route   PUT /api/maintenance/:id
// @access  Private (Fleet Manager)
const updateMaintenance = async (req, res) => {
    try {
        const {
            type,
            description,
            cost,
            scheduledDate,
            priority,
            serviceProvider,
            technicianName,
            partsUsed
        } = req.body;

        let maintenance = await Maintenance.findById(req.params.id);

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance record not found'
            });
        }

        if (maintenance.status === 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update completed maintenance record'
            });
        }

        // Update fields
        if (type) maintenance.type = type;
        if (description) maintenance.description = description;
        if (cost) maintenance.cost = cost;
        if (scheduledDate) maintenance.scheduledDate = new Date(scheduledDate);
        if (priority) maintenance.priority = priority;
        if (serviceProvider) maintenance.serviceProvider = serviceProvider;
        if (technicianName) maintenance.technicianName = technicianName;
        if (partsUsed) maintenance.partsUsed = partsUsed;

        await maintenance.save();

        res.status(200).json({
            success: true,
            data: maintenance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Complete maintenance (close)
// @route   PUT /api/maintenance/:id/complete
// @access  Private (Fleet Manager)
const completeMaintenance = async (req, res) => {
    try {
        const maintenance = await Maintenance.findById(req.params.id);

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance record not found'
            });
        }

        if (maintenance.status === 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'Maintenance already completed'
            });
        }

        maintenance.status = 'Completed';
        maintenance.completedDate = new Date();
        await maintenance.save();

        // Restore vehicle to Available (unless retired)
        const vehicle = await Vehicle.findById(maintenance.vehicle);
        if (vehicle && vehicle.status === VEHICLE_STATUS.IN_SHOP) {
            vehicle.status = VEHICLE_STATUS.AVAILABLE;
            vehicle.lastMaintenanceDate = new Date();
            
            // Set next maintenance date (e.g., 6 months later)
            const nextMaintenance = new Date();
            nextMaintenance.setMonth(nextMaintenance.getMonth() + 6);
            vehicle.nextMaintenanceDate = nextMaintenance;
            
            await vehicle.save();
        }

        res.status(200).json({
            success: true,
            data: maintenance,
            message: 'Maintenance completed successfully'
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

// @desc    Get vehicle maintenance history
// @route   GET /api/maintenance/vehicle/:vehicleId
// @access  Private
const getVehicleMaintenance = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        
        const records = await Maintenance.find({ vehicle: vehicleId })
            .sort({ scheduledDate: -1 });

        const totalCost = records.reduce((sum, record) => sum + record.cost, 0);

        res.status(200).json({
            success: true,
            count: records.length,
            totalCost,
            data: records
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
    createMaintenance,
    getMaintenanceRecords,
    getMaintenance,
    updateMaintenance,
    completeMaintenance,
    getVehicleMaintenance
};
