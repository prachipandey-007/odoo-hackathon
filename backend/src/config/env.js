const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];

const validateEnv = () => {
    const missing = requiredEnv.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (!process.env.JWT_EXPIRE) {
        process.env.JWT_EXPIRE = '30d';
    }
};

module.exports = { validateEnv };
