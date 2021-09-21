const express = require('express');

// Import environment variables
require('dotenv').config();

const router = express.Router();

// @route   GET api/v1/session
// @desc    Get current user
// @access  Private
router.get('/', (req, res) => {
    res.status(500).send('Not implemented');
});

// @route   POST api/v1/session
// @desc    Create new session
// @access  Public
router.post('/', (req, res) => {
    res.status(500).send('Not implemented');
});

// @route   PUT api/v1/session
// @desc    Refresh session
// @access  Private
router.put('/', (req, res) => {
    res.status(500).send('Not implemented');
});

// @route   DELETE api/v1/session
// @desc    Delete current session
// @access  Private
router.delete('/', (req, res) => {
    res.status(500).send('Not implemented');
});

module.exports = router;
