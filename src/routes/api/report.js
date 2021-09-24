const fs = require('fs');
const express = require('express');
const requireToken = require('../../middleware/requireToken');
const uploadImage = require('../../middleware/uploadImage');
const { Report } = require('../../models');
const { ReportCreationError } = require('../../utils/errors');

const UPLOADS_DIR = process.env.UPLOADS_DIR;

if (!UPLOADS_DIR) {
    throw new UnsetEnvError('UPLOADS_DIR');
}

const router = express.Router();

router.use(requireToken());

// @route   GET api/v1/report
// @desc    Query reports
// @access  Private
router.get('/', (req, res) => {
    res.status(500).send('Not implemented');
});

// @route   POST api/v1/report
// @desc    Create a report
// @access  Private
router.post('/', uploadImage, async (req, res, next) => {
    // This flow uses exceptions pretty much exclusively just to also handle
    // obscure or unexpected errors that may occur.
    try {
        console.log(req.body);

        if (!('category' in req.body)) {
            throw new ReportCreationError('Missing category', 400);
        }

        const report = await Report.create(req.body);
        return res.send(report);
        // console.log(req.body.image);
        // return res.status(500).send('Not implemented');
        //
    } catch (err) {
        // Remove the image from the directory and database.
        if (req.body.image) {
            fs.unlinkSync(`${UPLOADS_DIR}/${req.body.image.fileName}`);
            await req.body.image.remove();
        }

        if (err instanceof ReportCreationError) {
            return res.status(err.code).send({ error: err.message });
        }
        return next(err);
    }
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
