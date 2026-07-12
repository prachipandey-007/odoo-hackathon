// backend/tests/vehicle.test.js
const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Vehicle = require('../src/models/Vehicle');
const User = require('../src/models/User');

describe('Vehicle API Tests', () => {
    let token;
    let userId;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/transitops_test');
        
        // Create test user
        const user = await User.create({
            name: 'Test Fleet Manager',
            email: 'fleet@test.com',
            password: 'password123',
            role: 'fleet_manager'
        });
        userId = user._id;
        
        // Get token
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'fleet@test.com', password: 'password123' });
        token = response.body.data.token;
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Vehicle.deleteMany({});
    });

    describe('POST /api/vehicles', () => {
        test('should create a new vehicle', async () => {
            const vehicleData = {
                registrationNumber: 'TEST-001',
                name: 'Test Vehicle',
                model: 'Test Model',
                type: 'Van',
                maxLoadCapacity: 1000,
                odometer: 0,
                acquisitionCost: 25000,
                region: 'Central'
            };

            const response = await request(app)
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${token}`)
                .send(vehicleData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.registrationNumber).toBe('TEST-001');
            expect(response.body.data.status).toBe('Available');
        });

        test('should reject duplicate registration number', async () => {
            const vehicleData = {
                registrationNumber: 'TEST-001',
                name: 'Test Vehicle',
                model: 'Test Model',
                type: 'Van',
                maxLoadCapacity: 1000,
                odometer: 0,
                acquisitionCost: 25000
            };

            await request(app)
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${token}`)
                .send(vehicleData);

            const response = await request(app)
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${token}`)
                .send(vehicleData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('should reject without authentication', async () => {
            const response = await request(app)
                .post('/api/vehicles')
                .send({
                    registrationNumber: 'TEST-001',
                    name: 'Test Vehicle',
                    model: 'Test Model',
                    type: 'Van',
                    maxLoadCapacity: 1000
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/vehicles', () => {
        test('should get all vehicles', async () => {
            // Create test vehicles
            await Vehicle.create([
                {
                    registrationNumber: 'TEST-001',
                    name: 'Vehicle 1',
                    model: 'Model 1',
                    type: 'Van',
                    maxLoadCapacity: 1000,
                    acquisitionCost: 25000,
                    status: 'Available'
                },
                {
                    registrationNumber: 'TEST-002',
                    name: 'Vehicle 2',
                    model: 'Model 2',
                    type: 'Truck',
                    maxLoadCapacity: 5000,
                    acquisitionCost: 50000,
                    status: 'On Trip'
                }
            ]);

            const response = await request(app)
                .get('/api/vehicles')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });

        test('should filter by status', async () => {
            await Vehicle.create([
                {
                    registrationNumber: 'TEST-001',
                    name: 'Vehicle 1',
                    model: 'Model 1',
                    type: 'Van',
                    maxLoadCapacity: 1000,
                    acquisitionCost: 25000,
                    status: 'Available'
                },
                {
                    registrationNumber: 'TEST-002',
                    name: 'Vehicle 2',
                    model: 'Model 2',
                    type: 'Truck',
                    maxLoadCapacity: 5000,
                    acquisitionCost: 50000,
                    status: 'On Trip'
                }
            ]);

            const response = await request(app)
                .get('/api/vehicles?status=Available')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].status).toBe('Available');
        });
    });
});