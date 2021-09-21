const express = require('express');

const router = express.Router();

// @route   GET api/v1/report
// @desc    Query reports
// @access  Private
router.get('/', (req, res) => {
    res.status(500).send('Not implemented');
});

// @route   POST api/v1/report
// @desc    Create a report
// @access  Private
router.post('/', (req, res) => {
    res.status(500).send('Not implemented');
});

// @route  GET api/v1/report/:id
// @desc   Get report by id
// @access Private
router.get('/:id', (req, res) => {
    res.status(500).send('Not implemented');
});

// @route  PUT api/v1/report/:id
// @desc   Update report by id
// @access Admin
router.put('/:id', (req, res) => {
    res.status(500).send('Not implemented');
});

module.exports = router;
