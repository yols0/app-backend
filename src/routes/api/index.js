const express = require('express');
const userRoutes = require('./user');
const sessionRoutes = require('./session');
const reportRoutes = require('./report');

const verifyJson = require('../../middleware/verifyJson');

const router = express.Router();

// Enable JSON parsing middleware
router.use(express.json());

// Check JSON validity
router.use(verifyJson);

// Use the routes
router.use('/user', userRoutes);
router.use('/session', sessionRoutes);
router.use('/report', reportRoutes);

module.exports = router;
