const express = require('express');
const requireToken = require('../../middleware/requireToken');
const { Report } = require('../../models');

const router = express.Router();

const UPLOADS_DIR = process.env.UPLOADS_DIR;

if (!UPLOADS_DIR) {
    throw new UnsetEnvError('UPLOADS_DIR');
}

router.use(requireToken());

// @route   GET api/image/:id
// @desc    Get image
// @access  Private
router.get('/:id', (req, res) => {
    if (req.user.role >= 2) {
        // Find if the image belongs to a report created by the user
        const report = Report.findOne({ 'image.id': req.params.id });
        if (report.creator.id != req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
    }
    return res.sendFile(`${UPLOADS_DIR}/${req.params.filename}`);
});

module.exports = router;
