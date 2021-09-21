const express = require('express');

const router = express.Router();

// @route   GET api/v1/user
// @desc    Query users
// @access  Admin
router.get('/', (req, res) => {
    res.status(500).send('Not implemented');
});

// @route   POST api/v1/user
// @desc    Create user
// @access  Public
router.post('/', (req, res) => {
    res.status(500).send('Not implemented');
});

// @route   PUT api/v1/user
// @desc    Update user
// @access  Private
router.put('/', (req, res) => {
    res.status(500).send('Not implemented');
});

// @route   DELETE api/v1/user
// @desc    Delete user
// @access  Private
router.delete('/', (req, res) => {
    res.status(500).send('Not implemented');
});

// @route   GET api/v1/user/:id
// @desc    Get user by id
// @access  Admin/Private
router.get('/:id', (req, res) => {
    res.status(500).send('Not implemented');
});

// @route   PUT api/v1/user/:id
// @desc    Update user role by id
// @access  Admin
router.put('/:id', (req, res) => {
    res.status(500).send('Not implemented');
});

module.exports = router;
