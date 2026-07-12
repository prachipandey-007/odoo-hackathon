// backend/src/models/Vehicle.js
const mongoose = require('mongoose');
const { VEHICLE_STATUS } = require('../config/constants');

const VehicleSchema = new mongoose.Schema({
    registrationNumber: {
        type: String,
        required: [true, 'Registration number is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Vehicle name is required'],
        trim: true
    },
    model: {
        type: String,
        required: [true, 'Model is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Vehicle type is required'],
        enum: ['Truck', 'Van', 'Bus', 'Car', 'Motorcycle']
    },
    maxLoadCapacity: {
        type: Number,
        required: [true, 'Max load capacity is required'],
        min: [0, 'Load capacity must be positive']
    },
    odometer: {
        type: Number,
        default: 0,
        min: 0
    },
    acquisitionCost: {
        type: Number,
        required: [true, 'Acquisition cost is required'],
        min: [0, 'Cost must be positive']
    },
    status: {
        type: String,
        enum: Object.values(VEHICLE_STATUS),
        default: VEHICLE_STATUS.AVAILABLE
    },
    maintenanceHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Maintenance'
    }],
    documents: [{
        name: String,
        url: String,
        uploadDate: Date,
        expiryDate: Date
    }],
    region: {
        type: String,
        enum: ['North', 'South', 'East', 'West', 'Central'],
        default: 'Central'
    },
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date
}, {
    timestamps: true
});

// Index for faster queries
VehicleSchema.index({ status: 1, region: 1 });
VehicleSchema.index({ registrationNumber: 1 }, { unique: true });

// Virtual for age
VehicleSchema.virtual('age').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24 * 365));
});

module.exports = mongoose.model('Vehicle', VehicleSchema);