// backend/src/models/Maintenance.js
const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema({
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Vehicle is required']
    },
    type: {
        type: String,
        required: [true, 'Maintenance type is required'],
        enum: ['Oil Change', 'Tire Replacement', 'Brake Service', 'Engine Repair', 
               'Transmission Service', 'Electrical Repair', 'Scheduled Service', 'Other']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    cost: {
        type: Number,
        required: [true, 'Cost is required'],
        min: [0, 'Cost must be positive']
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Active', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    },
    scheduledDate: {
        type: Date,
        required: [true, 'Scheduled date is required']
    },
    completedDate: Date,
    serviceProvider: {
        name: String,
        phone: String,
        address: String
    },
    partsUsed: [{
        name: String,
        quantity: Number,
        cost: Number
    }],
    technicianName: String,
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Emergency'],
        default: 'Medium'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Maintenance', MaintenanceSchema);