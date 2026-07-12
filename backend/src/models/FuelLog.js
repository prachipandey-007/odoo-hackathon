// backend/src/models/FuelLog.js
const mongoose = require('mongoose');

const FuelLogSchema = new mongoose.Schema({
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Vehicle is required']
    },
    liters: {
        type: Number,
        required: [true, 'Fuel liters is required'],
        min: [0, 'Liters must be positive']
    },
    cost: {
        type: Number,
        required: [true, 'Cost is required'],
        min: [0, 'Cost must be positive']
    },
    pricePerLiter: {
        type: Number,
        min: 0
    },
    odometerReading: {
        type: Number,
        required: [true, 'Odometer reading is required'],
        min: 0
    },
    fuelType: {
        type: String,
        enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
        default: 'Diesel'
    },
    stationName: String,
    location: String,
    date: {
        type: Date,
        default: Date.now
    },
    notes: String
}, {
    timestamps: true
});

// Auto-calculate price per liter
FuelLogSchema.pre('save', function(next) {
    if (this.liters > 0 && this.cost > 0) {
        this.pricePerLiter = this.cost / this.liters;
    }
    next();
});

// Index for analytics
FuelLogSchema.index({ vehicle: 1, date: -1 });
FuelLogSchema.index({ date: -1 });

module.exports = mongoose.model('FuelLog', FuelLogSchema);