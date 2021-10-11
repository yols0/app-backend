const express = require('express');
const requireToken = require('../../middleware/requireToken');
const uploadImage = require('../../middleware/uploadImage');
const validateId = require('../../middleware/validateId');
const ignoreFields = require('../../middleware/ignoreFields');
const requireMinRole = require('../../middleware/requireMinRole');
const { ApiRequestError, InvalidReportError } = require('../../utils/errors');
const { Report } = require('../../models');
const ValidationError = require('mongoose').Error.ValidationError;
const { roles } = require('../../utils/constants');
const { UnsetEnvError } = require('../../utils/errors');
const { notifyCreator, notifyAdmins } = require('../../fcm');

const UPLOADS_DIR = process.env.UPLOADS_DIR;

if (!UPLOADS_DIR) {
    throw new UnsetEnvError('UPLOADS_DIR');
}

const MAX_REPORTS_RESULTS = parseInt(process.env.MAX_REPORTS_RESULTS) || 50;

const router = express.Router();

// All operations require a valid token
router.use(requireToken());

// @route   GET api/v1/report
// @desc    Query reports
// @access  Private
router.get('/', async (req, res, next) => {
    const { status, category, creator, from, to } = req.query;

    let query = { creator };
    if (from || to) {
        query.creationDate = {};
        if (from) {
            query.creationDate.$gte = new Date(from);
        }
        if (to) {
            query.creationDate.$lt = new Date(to);
        }
    }

    // Split statuses separated by comma into array query
    if (status) {
        const statusValues = status
            .split(',')
            .map(Number)
            .filter((x) => !Number.isNaN(x));
        if (statusValues.length) {
            query.status = { $in: statusValues };
        }
    }

    // Split categories separated by comma into array query
    if (category) {
        const categoryValues = category
            .split(',')
            .map(Number)
            .filter((x) => !Number.isNaN(x));
        if (categoryValues.length) {
            query.category = { $in: categoryValues };
        }
    }

    // Delete all keys with undefined values
    Object.keys(query).forEach((key) =>
        query[key] === undefined ? delete query[key] : {}
    );

    console.log(query);

    const limit = Math.min(
        MAX_REPORTS_RESULTS,
        parseInt(req.query.limit) || MAX_REPORTS_RESULTS
    );

    try {
        // Also aggregates the reports with the creators' name
        const pipeline = [
            { $match: query },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'creator',
                    foreignField: '_id',
                    as: 'creatorInfo',
                },
            },
            {
                $project: {
                    _id: 0,
                    id: '$_id',
                    creationDate: 1,
                    // creator: 1,
                    creatorFirstName: {
                        $arrayElemAt: ['$creatorInfo.firstName', 0],
                    },
                    creatorLastName: {
                        $arrayElemAt: ['$creatorInfo.lastName', 0],
                    },
                    category: 1,
                    status: 1,
                    image: '$image._id',
                },
            },
            { $sort: { creationDate: -1 } },
        ];
        console.log(pipeline);

        const reports = await Report.aggregate(pipeline);

        return res.send(reports);
    } catch (err) {
        return next(err);
    }
});

// @route   POST api/v1/report
// @desc    Create a report
// @access  Private
router.post(
    '/',
    uploadImage,
    ignoreFields('_id', '__v', 'creationDate', 'status', 'endMessage'),
    async (req, res, next) => {
        // This flow uses exceptions pretty much exclusively just to also handle
        // obscure or unexpected errors that may occur.
        try {
            if (!('category' in req.body)) {
                throw new ApiRequestError('Missing category', 400);
            }

            req.body.creator = req.user.id;

            const report = await Report.create(req.body);

            notifyAdmins(report);

            return res.send(await report.getData());
        } catch (err) {
            // Remove the image from the directory and database.
            if (req.body.image) {
                await req.body.image.remove();
            }

            if (err instanceof ApiRequestError) {
                return res.status(err.statusCode).send({ error: err.message });
            } else if (
                err instanceof InvalidReportError ||
                err instanceof ValidationError
            ) {
                return res.status(400).send({ error: err.message });
            }
            return next(err);
        }
    }
);

// @route  GET api/v1/report/:id
// @desc   Get report by id
// @access Private
router.get('/:id', validateId, async (req, res, next) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).send({ error: 'Report not found' });
        }

        includeCreatorName = false;
        if (!(req.user.role <= roles.ADMIN) && report.creator != req.user.id) {
            return res
                .status(403)
                .send({ error: "User can't access this report" });
        }

        return res.send(await report.getData());
    } catch (err) {
        return next(err);
    }
});

// @route  PUT api/v1/report/:id
// @desc   Update report by id
// @access Admin
router.put(
    '/:id',
    requireMinRole(roles.ADMIN),
    ignoreFields('_id', '__v', 'creationDate', 'creator'),
    async (req, res, next) => {
        try {
            const report = await Report.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );

            if (!report) {
                return res.status(404).send({ error: 'Report not found' });
            }

            notifyCreator(report);

            return res.send(await report.getData());
        } catch (err) {
            if (err instanceof InvalidReportError) {
                return res.status(400).send({ error: err.message });
            }
            return next(err);
        }
    }
);

/*         // 1 day as base offset in milliseconds
        let timestampOffset = 24 * 60 * 60 * 1000;

        if (sinceLast == undefined) {
            timestampOffset = null;
        } else if (sinceLast == 'day') {
            timestampOffset = 0;
        } else if (sinceLast == 'week') {
            timestampOffset = timestampOffset * 6;
        } else if (sinceLast == 'month') {
            timestampOffset = timestampOffset * 29;
        } else if (sinceLast == 'year') {
            timestampOffset = timestampOffset * 364;
        } else {
            return res.status(400).send({
                error: `Invalid sinceLast query parameter: ${sinceLast}`,
            });
        }

        if (timestampOffset !== null) {
            // Rewind date to the beginning of the day
            const startDate = new Date(Date.now() - timestampOffset);
            startDate.setHours(0, 0, 0, 0);
            console.log(+startDate);

            query.creationDate = { $gte: startDate };
        } */

module.exports = router;
