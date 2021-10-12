const express = require('express');
const {
    reportsByStatus,
    reportsByCategory,
} = require('../../../analytics/graphs');
const { Report } = require('../../../models');
const requireMinRole = require('../../../middleware/requireMinRole');
const { roles, status } = require('../../../utils/constants');

const router = express.Router();

router.use(requireMinRole(roles.ADMIN));

// @route   GET api/reports/stats/status
// @desc    Get reports stats by status
// @access  Admin
router.get('/status', async (req, res, next) => {
    try {
        const { sinceLast } = req.query;

        if (!sinceLast) {
            return res.status(400).send({
                error: 'SinceLast is required',
            });
        }

        const startDate = getInitialDate(sinceLast);
        if (startDate === null) {
            return res.status(400).send({
                error: `Invalid sinceLast query parameter: ${sinceLast}`,
            });
        }

        const now = new Date();
        const result = await reportsByStatus(startDate, now);
        res.send(result);
    } catch (err) {
        return next(err);
    }
});

// @route   GET api/reports/stats/category
// @desc    Get reports stats by category
// @access  Admin
router.get('/category', async (req, res, next) => {
    try {
        const { sinceLast } = req.query;

        if (!sinceLast) {
            return res.status(400).send({
                error: 'SinceLast is required',
            });
        }

        const startDate = getInitialDate(sinceLast);
        if (startDate === null) {
            return res.status(400).send({
                error: `Invalid sinceLast query parameter: ${sinceLast}`,
            });
        }

        const now = new Date();
        const result = await reportsByCategory(startDate, now);
        res.send(result);
    } catch (err) {
        return next(err);
    }
});

// @route   GET api/reports/stats
// @desc    Find if there are any pending reports
// @access  Admin
router.get('/', async (_, res, next) => {
    try {
        const result = await Report.exists({
            status: status.PENDING,
        });

        res.send({
            pending: result,
        });
    } catch (err) {
        return next(err);
    }
});

function getInitialDate(sinceLast) {
    // 1 day as base offset in milliseconds
    let timestampOffset = 24 * 60 * 60 * 1000;

    if (sinceLast == 'day') {
        timestampOffset = 0;
    } else if (sinceLast == 'week') {
        timestampOffset = timestampOffset * 6;
    } else if (sinceLast == 'month') {
        timestampOffset = timestampOffset * 29;
    } else if (sinceLast == 'year') {
        timestampOffset = timestampOffset * 364;
    } else {
        return null;
    }

    const startDate = new Date(Date.now() - timestampOffset);
    startDate.setHours(0, 0, 0, 0);

    return startDate;
}

module.exports = router;
