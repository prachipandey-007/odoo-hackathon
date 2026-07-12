// backend/tests/trip.test.js
const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Vehicle = require('../src/models/Vehicle');
const Driver = require('../src/models/Driver');
const Trip = require('../src/models/Trip');
const User = require('../src/models/User');
const { VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS } = require('../src/config/constants');

describe('Trip Business Rules Tests', () => {
    let token;
    let vehicle;
    let driver;

    beforeAll(async () => {
        await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/transitops_test');
        
        const user = await User.create({
            name: 'Test User',
            email: 'test@test.com',
            password: 'password123',
            role: 'driver'
        });
        
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@test.com', password: 'password123' });
        token = response.body.data.token;
    });

    beforeEach(async () => {
        await Vehicle.deleteMany({});
        await Driver.deleteMany({});
        await Trip.deleteMany({});

        // Create test vehicle
        vehicle = await Vehicle.create({
            registrationNumber: 'TEST-VAN-01',
            name: 'Test Van',
            model: 'Sprinter',
            type: 'Van',
            maxLoadCapacity: 500,
            odometer: 10000,
            acquisitionCost: 30000,
            status: VEHICLE_STATUS.AVAILABLE
        });

        // Create test driver
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        
        driver = await Driver.create({
            name: 'Alex Johnson',
            licenseNumber: 'DL-2024-001',
            licenseCategory: 'C',
            licenseExpiryDate: expiryDate,
            contactNumber: '+1-555-0123',
            safetyScore: 95,
            status: DRIVER_STATUS.AVAILABLE
        });
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    test('should validate cargo weight against vehicle capacity', async () => {
        const tripData = {
            vehicleId: vehicle._id,
            driverId: driver._id,
            source: 'Warehouse A',
            destination: 'Store B',
            cargoWeight: 600, // Exceeds 500kg capacity
            plannedDistance: 100
        };

        const response = await request(app)
            .post('/api/trips')
            .set('Authorization', `Bearer ${token}`)
            .send(tripData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('exceeds vehicle capacity');
    });

    test('should allow trip creation with valid cargo weight', async () => {
        const tripData = {
            vehicleId: vehicle._id,
            driverId: driver._id,
            source: 'Warehouse A',
            destination: 'Store B',
            cargoWeight: 450,
            plannedDistance: 100
        };

        const response = await request(app)
            .post('/api/trips')
            .set('Authorization', `Bearer ${token}`)
            .send(tripData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe(TRIP_STATUS.DRAFT);
    });

    test('should update vehicle and driver status on dispatch', async () => {
        // Create trip
        const trip = await Trip.create({
            vehicle: vehicle._id,
            driver: driver._id,
            source: 'Warehouse A',
            destination: 'Store B',
            cargoWeight: 450,
            plannedDistance: 100,
            status: TRIP_STATUS.DRAFT
        });

        // Dispatch trip
        const response = await request(app)
            .put(`/api/trips/${trip._id}/dispatch`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);

        // Check vehicle status
        const updatedVehicle = await Vehicle.findById(vehicle._id);
        expect(updatedVehicle.status).toBe(VEHICLE_STATUS.ON_TRIP);

        // Check driver status
        const updatedDriver = await Driver.findById(driver._id);
        expect(updatedDriver.status).toBe(DRIVER_STATUS.ON_TRIP);
    });

    test('should restore statuses on trip completion', async () => {
        // Create and dispatch trip
        const trip = await Trip.create({
            vehicle: vehicle._id,
            driver: driver._id,
            source: 'Warehouse A',
            destination: 'Store B',
            cargoWeight: 450,
            plannedDistance: 100,
            status: TRIP_STATUS.DISPATCHED,
            dispatchedAt: new Date()
        });

        // Update vehicle and driver to On Trip
        await Vehicle.findByIdAndUpdate(vehicle._id, { status: VEHICLE_STATUS.ON_TRIP });
        await Driver.findByIdAndUpdate(driver._id, { status: DRIVER_STATUS.ON_TRIP });

        // Complete trip
        const response = await request(app)
            .put(`/api/trips/${trip._id}/complete`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                actualDistance: 95,
                fuelConsumed: 20
            });

        expect(response.status).toBe(200);

        // Check vehicle restored
        const updatedVehicle = await Vehicle.findById(vehicle._id);
        expect(updatedVehicle.status).toBe(VEHICLE_STATUS.AVAILABLE);

        // Check driver restored
        const updatedDriver = await Driver.findById(driver._id);
        expect(updatedDriver.status).toBe(DRIVER_STATUS.AVAILABLE);
    });

    test('should prevent assigning On Trip driver to another trip', async () => {
        // Set driver to On Trip
        await Driver.findByIdAndUpdate(driver._id, { status: DRIVER_STATUS.ON_TRIP });

        const tripData = {
            vehicleId: vehicle._id,
            driverId: driver._id,
            source: 'Warehouse A',
            destination: 'Store B',
            cargoWeight: 450,
            plannedDistance: 100
        };

        const response = await request(app)
            .post('/api/trips')
            .set('Authorization', `Bearer ${token}`)
            .send(tripData);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('not available');
    });
});