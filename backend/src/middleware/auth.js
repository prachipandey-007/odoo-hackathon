// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Protect routes - verify token
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Not authorized, user not found' 
                });
            }

            if (!req.user.isActive) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Account deactivated' 
                });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized, invalid token' 
            });
        }
    }

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized, no token' 
        });
    }
};

// Role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Check if user has any of the specified roles
const hasAnyRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
        next();
    };
};

module.exports = { protect, authorize, hasAnyRole, generateToken };