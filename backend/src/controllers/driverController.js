// backend/src/controllers/driverController.js
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const { DRIVER_STATUS } = require('../config/constants');

// @desc    Create driver
// @route   POST /api/drivers
// @access  Private (Fleet Manager)
const createDriver = async (req, res) => {
    try {
        const {
            name,
            licenseNumber,
            licenseCategory,
            licenseExpiryDate,
            contactNumber,
            email,
            address,
            hireDate,
            emergencyContact
        } = req.body;

        // Check if license number exists
        const existingDriver = await Driver.findOne({ licenseNumber });
        if (existingDriver) {
            return res.status(400).json({
                success: false,
                message: 'Driver with this license number already exists'
            });
        }

        const driver = await Driver.create({
            name,
            licenseNumber,
            licenseCategory,
            licenseExpiryDate,
            contactNumber,
            email,
            address,
            hireDate: hireDate || new Date(),
            emergencyContact,
            status: DRIVER_STATUS.AVAILABLE,
            safetyScore: 100
        });

        res.status(201).json({
            success: true,
            data: driver
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

// @desc    Get all drivers with filters
// @route   GET /api/drivers
// @access  Private
const getDrivers = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { licenseNumber: { $regex: search, $options: 'i' } },
                { contactNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const drivers = await Driver.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Driver.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: drivers,
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

// @desc    Get single driver
// @route   GET /api/drivers/:id
// @access  Private
const getDriver = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        res.status(200).json({
            success: true,
            data: driver
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update driver
// @route   PUT /api/drivers/:id
// @access  Private (Fleet Manager)
const updateDriver = async (req, res) => {
    try {
        const {
            name,
            licenseNumber,
            licenseCategory,
            licenseExpiryDate,
            contactNumber,
            email,
            address,
            status,
            safetyScore,
            emergencyContact
        } = req.body;

        let driver = await Driver.findById(req.params.id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Prevent updating to Available if driver is On Trip
        if (status === 'Available' && driver.status === 'On Trip') {
            return res.status(400).json({
                success: false,
                message: 'Cannot set driver to Available while they are On Trip'
            });
        }

        // Update fields
        if (name) driver.name = name;
        if (licenseNumber) driver.licenseNumber = licenseNumber;
        if (licenseCategory) driver.licenseCategory = licenseCategory;
        if (licenseExpiryDate) driver.licenseExpiryDate = licenseExpiryDate;
        if (contactNumber) driver.contactNumber = contactNumber;
        if (email) driver.email = email;
        if (address) driver.address = address;
        if (status) driver.status = status;
        if (safetyScore !== undefined) driver.safetyScore = safetyScore;
        if (emergencyContact) driver.emergencyContact = emergencyContact;

        await driver.save();

        res.status(200).json({
            success: true,
            data: driver
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
// @access  Private (Fleet Manager)
const deleteDriver = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Check if driver has active trips
        const activeTrips = await Trip.findOne({
            driver: driver._id,
            status: { $in: ['Draft', 'Dispatched'] }
        });

        if (activeTrips) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete driver with active trips'
            });
        }

        // Instead of deleting, set as suspended
        driver.status = DRIVER_STATUS.SUSPENDED;
        await driver.save();

        res.status(200).json({
            success: true,
            message: 'Driver suspended successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get available drivers for dispatch
// @route   GET /api/drivers/available
// @access  Private
const getAvailableDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({
            status: DRIVER_STATUS.AVAILABLE,
            licenseExpiryDate: { $gt: new Date() }
        }).select('name licenseNumber licenseCategory safetyScore');

        res.status(200).json({
            success: true,
            data: drivers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get drivers with expiring licenses
// @route   GET /api/drivers/expiring-licenses
// @access  Private (Safety Officer)
const getExpiringLicenses = async (req, res) => {
    try {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const drivers = await Driver.find({
            licenseExpiryDate: {
                $gte: new Date(),
                $lte: thirtyDaysFromNow
            }
        });

        res.status(200).json({
            success: true,
            count: drivers.length,
            data: drivers
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
    createDriver,
    getDrivers,
    getDriver,
    updateDriver,
    deleteDriver,
    getAvailableDrivers,
    getExpiringLicenses
};
