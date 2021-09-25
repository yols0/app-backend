const express = require('express');
const requireToken = require('../../middleware/requireToken');
const validateId = require('../../middleware/validateId');
const { Report, Image } = require('../../models');

const router = express.Router();

const UPLOADS_DIR = process.env.UPLOADS_DIR;

if (!UPLOADS_DIR) {
    throw new UnsetEnvError('UPLOADS_DIR');
}

router.use(requireToken());

// @route   GET api/image/:id
// @desc    Get image
// @access  Private
router.get('/:id', validateId, async (req, res) => {
    try {
        if (req.user.role >= 2) {
            // Find if the image belongs to a report created by the user
            const report = await Report.findOne({ 'image.id': req.params.id });
            if (report.creator != req.user.id) {
                return res
                    .status(401)
                    .json({ msg: 'Not authorized to view this image' });
            }
        }

        const image = await Image.findOne({ _id: req.params.id });
        if (!image) {
            return res.status(404).json({ msg: 'Image not found' });
        }
        return res.sendFile(`${UPLOADS_DIR}/${image.fileName}`);
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
