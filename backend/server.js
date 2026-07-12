// backend/server.js
const dotenv = require('dotenv');

dotenv.config();

const app = require('./src/app');
const connectDB = require('./src/config/database');
const { validateEnv } = require('./src/config/env');

const PORT = process.env.PORT || 5000;

validateEnv();
connectDB();

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API URL: http://localhost:${PORT}/api`);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
    });
});

console.log('TransitOps Backend initialized successfully');
