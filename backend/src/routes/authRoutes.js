// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    register,
    login,
    getMe,
    updateProfile,
    changePassword
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Private routes
router.get('/me', protect, getMe);
router.put('/updateprofile', protect, updateProfile);
router.put('/changepassword', protect, changePassword);

module.exports = router;