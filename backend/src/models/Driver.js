// backend/src/models/Driver.js
const mongoose = require('mongoose');
const { DRIVER_STATUS } = require('../config/constants');

const DriverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Driver name is required'],
        trim: true
    },
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    licenseCategory: {
        type: String,
        required: [true, 'License category is required'],
        enum: ['A', 'B', 'C', 'D', 'E']
    },
    licenseExpiryDate: {
        type: Date,
        required: [true, 'License expiry date is required']
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^\+?[\d\s-]{10,15}$/, 'Please enter a valid phone number']
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    safetyScore: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    },
    status: {
        type: String,
        enum: Object.values(DRIVER_STATUS),
        default: DRIVER_STATUS.AVAILABLE
    },
    hireDate: {
        type: Date,
        default: Date.now
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    documents: [{
        name: String,
        url: String,
        uploadDate: Date,
        expiryDate: Date
    }],
    certifications: [{
        name: String,
        issueDate: Date,
        expiryDate: Date
    }]
}, {
    timestamps: true
});

// Check if license is expired
DriverSchema.methods.isLicenseExpired = function() {
    return new Date(this.licenseExpiryDate) < new Date();
};

// Check if license is expiring soon (30 days)
DriverSchema.methods.isLicenseExpiringSoon = function() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return new Date(this.licenseExpiryDate) <= thirtyDaysFromNow && 
           new Date(this.licenseExpiryDate) >= new Date();
};

module.exports = mongoose.model('Driver', DriverSchema);