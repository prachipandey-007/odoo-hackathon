// backend/src/models/Trip.js
const mongoose = require('mongoose');
const { TRIP_STATUS } = require('../config/constants');

const TripSchema = new mongoose.Schema({
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Vehicle is required']
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: [true, 'Driver is required']
    },
    source: {
        type: String,
        required: [true, 'Source is required'],
        trim: true
    },
    sourceCoordinates: {
        lat: Number,
        lng: Number
    },
    destination: {
        type: String,
        required: [true, 'Destination is required'],
        trim: true
    },
    destinationCoordinates: {
        lat: Number,
        lng: Number
    },
    cargoWeight: {
        type: Number,
        required: [true, 'Cargo weight is required'],
        min: [0, 'Weight must be positive']
    },
    cargoType: {
        type: String,
        enum: ['General', 'Perishable', 'Hazardous', 'Fragile', 'Oversized']
    },
    plannedDistance: {
        type: Number,
        required: [true, 'Planned distance is required'],
        min: [0, 'Distance must be positive']
    },
    actualDistance: {
        type: Number,
        min: 0
    },
    fuelConsumed: {
        type: Number,
        min: 0
    },
    fuelEfficiency: {
        type: Number,
        min: 0
    },
    status: {
        type: String,
        enum: Object.values(TRIP_STATUS),
        default: TRIP_STATUS.DRAFT
    },
    revenue: {
        type: Number,
        default: 0,
        min: 0
    },
    dispatchedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    delayMinutes: {
        type: Number,
        default: 0
    },
    notes: String
}, {
    timestamps: true
});

// Auto-calculate fuel efficiency
TripSchema.pre('save', function(next) {
    if (this.actualDistance && this.fuelConsumed && this.fuelConsumed > 0) {
        this.fuelEfficiency = this.actualDistance / this.fuelConsumed;
    }
    next();
});

// Index for efficient queries
TripSchema.index({ status: 1, dispatchedAt: -1 });
TripSchema.index({ vehicle: 1, status: 1 });
TripSchema.index({ driver: 1, status: 1 });
TripSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Trip', TripSchema);