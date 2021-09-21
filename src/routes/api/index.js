const express = require('express');

const router = express.Router();

// Enable JSON parsing middleware
router.use(express.json());

module.exports = router;
