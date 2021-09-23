const express = require('express');
const requireToken = require('../../middleware/requireToken');

const router = express.Router();

router.use(requireToken());

// @route   GET api/image/:filename
// @desc    Get image
// @access  Private
router.get('/:filename', (req, res) => {
    res.status(500).send('Not implemented');
});

module.exports = router;
