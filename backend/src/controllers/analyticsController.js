// backend/src/controllers/analyticsController.js
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const Maintenance = require('../models/Maintenance');
const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');
const { VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS } = require('../config/constants');

// @desc    Get dashboard KPIs
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardKPIs = async (req, res) => {
    try {
        const [
            totalVehicles,
            activeVehicles,
            availableVehicles,
            inShopVehicles,
            totalDrivers,
            driversOnDuty,
            availableDrivers,
            activeTrips,
            pendingTrips,
            totalTrips,
            totalRevenue
        ] = await Promise.all([
            Vehicle.countDocuments(),
            Vehicle.countDocuments({ status: VEHICLE_STATUS.ON_TRIP }),
            Vehicle.countDocuments({ status: VEHICLE_STATUS.AVAILABLE }),
            Vehicle.countDocuments({ status: VEHICLE_STATUS.IN_SHOP }),
            Driver.countDocuments(),
            Driver.countDocuments({ status: DRIVER_STATUS.ON_TRIP }),
            Driver.countDocuments({ status: DRIVER_STATUS.AVAILABLE }),
            Trip.countDocuments({ status: TRIP_STATUS.DISPATCHED }),
            Trip.countDocuments({ status: TRIP_STATUS.DRAFT }),
            Trip.countDocuments(),
            Trip.aggregate([
                { $match: { status: TRIP_STATUS.COMPLETED } },
                { $group: { _id: null, total: { $sum: '$revenue' } } }
            ])
        ]);

        const fleetUtilization = totalVehicles > 0 
            ? (activeVehicles / totalVehicles) * 100 
            : 0;

        // Calculate total operational costs
        const [maintenanceCosts, fuelCosts, expenseCosts] = await Promise.all([
            Maintenance.aggregate([
                { $match: { status: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$cost' } } }
            ]),
            FuelLog.aggregate([
                { $group: { _id: null, total: { $sum: '$cost' } } }
            ]),
            Expense.aggregate([
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        const totalOperationalCost = 
            (maintenanceCosts[0]?.total || 0) + 
            (fuelCosts[0]?.total || 0) + 
            (expenseCosts[0]?.total || 0);

        res.status(200).json({
            success: true,
            data: {
                vehicles: {
                    total: totalVehicles,
                    active: activeVehicles,
                    available: availableVehicles,
                    inShop: inShopVehicles,
                    fleetUtilization: parseFloat(fleetUtilization.toFixed(2))
                },
                drivers: {
                    total: totalDrivers,
                    onDuty: driversOnDuty,
                    available: availableDrivers
                },
                trips: {
                    active: activeTrips,
                    pending: pendingTrips,
                    total: totalTrips,
                    totalRevenue: totalRevenue[0]?.total || 0
                },
                costs: {
                    maintenance: maintenanceCosts[0]?.total || 0,
                    fuel: fuelCosts[0]?.total || 0,
                    expenses: expenseCosts[0]?.total || 0,
                    total: totalOperationalCost
                }
            }
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

// @desc    Get vehicle ROI analysis
// @route   GET /api/analytics/roi
// @access  Private
const getVehicleROI = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ 
            status: { $ne: VEHICLE_STATUS.RETIRED } 
        });

        const roiData = await Promise.all(vehicles.map(async (vehicle) => {
            // Get completed trips revenue
            const trips = await Trip.find({
                vehicle: vehicle._id,
                status: TRIP_STATUS.COMPLETED
            });

            const revenue = trips.reduce((sum, trip) => sum + (trip.revenue || 0), 0);

            // Get maintenance costs
            const maintenance = await Maintenance.aggregate([
                { $match: { vehicle: vehicle._id, status: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$cost' } } }
            ]);

            // Get fuel costs
            const fuel = await FuelLog.aggregate([
                { $match: { vehicle: vehicle._id } },
                { $group: { _id: null, total: { $sum: '$cost' } } }
            ]);

            const totalCost = (maintenance[0]?.total || 0) + (fuel[0]?.total || 0);
            const roi = vehicle.acquisitionCost > 0 
                ? ((revenue - totalCost) / vehicle.acquisitionCost) * 100 
                : 0;

            return {
                vehicleId: vehicle._id,
                registrationNumber: vehicle.registrationNumber,
                name: vehicle.name,
                acquisitionCost: vehicle.acquisitionCost,
                revenue,
                totalCost,
                roi: parseFloat(roi.toFixed(2)),
                tripsCompleted: trips.length
            };
        }));

        // Sort by ROI descending
        roiData.sort((a, b) => b.roi - a.roi);

        res.status(200).json({
            success: true,
            data: roiData
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

// @desc    Get trip analytics
// @route   GET /api/analytics/trips
// @access  Private
const getTripAnalytics = async (req, res) => {
    try {
        const { period = 'monthly' } = req.query;

        let dateFilter = {};
        if (period === 'monthly') {
            const start = new Date();
            start.setMonth(start.getMonth() - 1);
            dateFilter = { createdAt: { $gte: start } };
        } else if (period === 'quarterly') {
            const start = new Date();
            start.setMonth(start.getMonth() - 3);
            dateFilter = { createdAt: { $gte: start } };
        } else if (period === 'yearly') {
            const start = new Date();
            start.setFullYear(start.getFullYear() - 1);
            dateFilter = { createdAt: { $gte: start } };
        }

        const [
            totalTrips,
            completedTrips,
            cancelledTrips,
            averageDistance,
            averageFuelEfficiency,
            tripsByStatus
        ] = await Promise.all([
            Trip.countDocuments(dateFilter),
            Trip.countDocuments({ ...dateFilter, status: TRIP_STATUS.COMPLETED }),
            Trip.countDocuments({ ...dateFilter, status: TRIP_STATUS.CANCELLED }),
            Trip.aggregate([
                { $match: { ...dateFilter, status: TRIP_STATUS.COMPLETED, actualDistance: { $exists: true } } },
                { $group: { _id: null, avg: { $avg: '$actualDistance' } } }
            ]),
            Trip.aggregate([
                { $match: { ...dateFilter, status: TRIP_STATUS.COMPLETED, fuelEfficiency: { $exists: true } } },
                { $group: { _id: null, avg: { $avg: '$fuelEfficiency' } } }
            ]),
            Trip.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])
        ]);

        res.status(200).json({
            success: true,
            data: {
                total: totalTrips,
                completed: completedTrips,
                cancelled: cancelledTrips,
                completionRate: totalTrips > 0 
                    ? parseFloat(((completedTrips / totalTrips) * 100).toFixed(2))
                    : 0,
                averageDistance: averageDistance[0]?.avg || 0,
                averageFuelEfficiency: averageFuelEfficiency[0]?.avg || 0,
                byStatus: tripsByStatus
            }
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

// @desc    Get fuel efficiency report
// @route   GET /api/analytics/fuel-efficiency
// @access  Private
const getFuelEfficiency = async (req, res) => {
    try {
        const vehicles = await Vehicle.find();

        const efficiencyData = await Promise.all(vehicles.map(async (vehicle) => {
            const trips = await Trip.find({
                vehicle: vehicle._id,
                status: TRIP_STATUS.COMPLETED,
                fuelEfficiency: { $exists: true }
            });

            if (trips.length === 0) {
                return {
                    vehicleId: vehicle._id,
                    registrationNumber: vehicle.registrationNumber,
                    name: vehicle.name,
                    averageEfficiency: 0,
                    totalDistance: 0,
                    totalFuel: 0,
                    tripCount: 0
                };
            }

            const totalDistance = trips.reduce((sum, t) => sum + (t.actualDistance || 0), 0);
            const totalFuel = trips.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);
            const averageEfficiency = totalFuel > 0 ? totalDistance / totalFuel : 0;

            return {
                vehicleId: vehicle._id,
                registrationNumber: vehicle.registrationNumber,
                name: vehicle.name,
                averageEfficiency: parseFloat(averageEfficiency.toFixed(2)),
                totalDistance,
                totalFuel,
                tripCount: trips.length
            };
        }));

        // Filter out vehicles with no trips
        const filteredData = efficiencyData.filter(d => d.tripCount > 0);
        filteredData.sort((a, b) => b.averageEfficiency - a.averageEfficiency);

        res.status(200).json({
            success: true,
            data: filteredData
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

// @desc    Get operational cost report
// @route   GET /api/analytics/operational-cost
// @access  Private
const getOperationalCost = async (req, res) => {
    try {
        const vehicles = await Vehicle.find();

        const costData = await Promise.all(vehicles.map(async (vehicle) => {
            // Maintenance costs
            const maintenance = await Maintenance.aggregate([
                { $match: { vehicle: vehicle._id, status: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$cost' } } }
            ]);

            // Fuel costs
            const fuel = await FuelLog.aggregate([
                { $match: { vehicle: vehicle._id } },
                { $group: { _id: null, total: { $sum: '$cost' } } }
            ]);

            // Expenses
            const expenses = await Expense.aggregate([
                { $match: { vehicle: vehicle._id } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const totalCost = (maintenance[0]?.total || 0) + 
                            (fuel[0]?.total || 0) + 
                            (expenses[0]?.total || 0);

            return {
                vehicleId: vehicle._id,
                registrationNumber: vehicle.registrationNumber,
                name: vehicle.name,
                maintenanceCost: maintenance[0]?.total || 0,
                fuelCost: fuel[0]?.total || 0,
                otherExpenses: expenses[0]?.total || 0,
                totalCost
            };
        }));

        const totalAllCost = costData.reduce((sum, d) => sum + d.totalCost, 0);

        res.status(200).json({
            success: true,
            data: costData,
            totalAllCost
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

module.exports = {
    getDashboardKPIs,
    getVehicleROI,
    getTripAnalytics,
    getFuelEfficiency,
    getOperationalCost
};