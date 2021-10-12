const express = require('express');
const MongooseError = require('mongoose').Error;
const requireToken = require('../../middleware/requireToken');
const requireFields = require('../../middleware/requireFields');
const validateId = require('../../middleware/validateId');
const ignoreFields = require('../../middleware/ignoreFields');
const requireMinRole = require('../../middleware/requireMinRole');
const { User, FcmToken } = require('../../models');
const { roles } = require('../../utils/constants');
const { ObjectId } = require('mongoose').Types;
const {
    subscribeToReportCreationTopic,
    unsubscribeFromReportCreationTopic,
} = require('../../fcm');

const router = express.Router();

const MAX_USERS_RESULTS = parseInt(process.env.MAX_USERS_RESULTS) || 15;

// @route   GET api/v1/user
// @desc    Query users by name
// @access  Admin
router.get(
    '/',
    requireToken('access'),
    requireMinRole(roles.ADMIN),
    async (req, res, next) => {
        const name = req.query.name;
        const skip = parseInt(req.query.skip) || 0;

        if (!name) {
            return res.status(400).send({
                error: 'Query parameter name is required',
            });
        }

        try {
            const users = await User.aggregate([
                {
                    $match: {
                        role: { $gt: roles.ROOT },
                        $text: { $search: name },
                    },
                },
                { $sort: { score: { $meta: 'textScore' } } },
                { $skip: skip },
                { $limit: MAX_USERS_RESULTS },
                {
                    $project: {
                        _id: 0,
                        id: '$_id',
                        firstName: 1,
                        lastName: 1,
                        profilePicture: 1,
                    },
                },
            ]);
            return res.send(users);
        } catch (err) {
            return next(err);
        }
    }
);

// @route   POST api/v1/user
// @desc    Create user
// @access  Public
router.post(
    '/',
    ignoreFields('_id', '__v', 'role', 'profilePicture'),
    (req, res, next) => {
        try {
            // The password is hashed when the user model is created
            req.body.pwHash = req.body.password;
            delete req.body.password;

            // Create and save user
            const user = new User(req.body);
            user.save((err, user) => {
                if (err) {
                    // Error when invalid fields are sent
                    if (err instanceof MongooseError.ValidationError) {
                        return res.status(400).send({ error: err.message });
                    }
                    // Error when a duplicate email is sent
                    else if (err.code === 11000) {
                        return res
                            .status(400)
                            .send({ error: 'User already exists' });
                    } else {
                        throw err;
                    }
                }

                res.status(201).send(user.getFullData());
            });
        } catch (err) {
            return next(err);
        }
    }
);

// @route   PUT api/v1/user
// @desc    Update user
// @access  Private
router.put(
    '/',
    requireToken(),
    ignoreFields('_id', '__v', 'role', 'lastSeen'),
    async (req, res, next) => {
        try {
            // The password is hashed when the user model is created
            req.body.pwHash = req.body.password;
            delete req.body.password;

            const user = await User.findByIdAndUpdate(req.user.id, req.body, {
                new: true,
            });
            if (!user) {
                return res.status(404).send({ error: 'User not found' });
            }

            return res.send(user.getFullData());
        } catch (err) {
            return next(err);
        }
    }
);

// @route   DELETE api/v1/user
// @desc    Delete user
// @access  Private
router.delete('/', requireToken(), async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        await user.remove();
        return res.send(user.getFullData());
    } catch (err) {
        return next(err);
    }
});

// @route   GET api/v1/user/:id
// @desc    Get user by id
// @access  Admin
router.get(
    '/:id',
    requireToken(),
    requireMinRole(roles.ADMIN),
    validateId,
    async (req, res, next) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).send({ error: 'User not found' });
            }

            return res.send(user.getPublicData());
        } catch (err) {
            return next(err);
        }
    }
);

// @route   PUT api/v1/user/:id
// @desc    Update user role by id
// @access  Admin
router.put(
    '/:id',
    requireToken(),
    requireMinRole(roles.ADMIN),
    requireFields('role'),
    validateId,
    async (req, res, next) => {
        try {
            const { role } = req.body;
            let user = await User.findByIdAndUpdate(
                req.params.id,
                { role },
                { new: true }
            );
            if (!user) {
                return res.status(404).send({ error: 'User not found' });
            }

            const tokens = (await FcmToken.find({ userId: req.user.id })).map(
                (t) => t.value
            );

            // Also (un)subscribe notification tokens if neccesary
            if (Array.isArray(tokens) && tokens.length > 0) {
                if (user.role == roles.ADMIN && user.appNotificationsEnabled) {
                    subscribeToReportCreationTopic(req.user.id, tokens);
                } else {
                    unsubscribeFromReportCreationTopic(req.user.id, tokens);
                }
            }

            return res.send(user.getPublicData());
        } catch (err) {
            return next(err);
        }
    }
);

// @route   POST api/v1/user/notifications
// @desc    Register user FCM token
// @access  Private
router.post(
    '/notifications',
    requireToken(),
    requireFields('token'),
    async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).send({ error: 'User not found' });
            }

            const { token } = req.body;

            // First check if the token is already saved
            const savedToken = await FcmToken.find({
                userId: req.user.id,
                value: token,
            });

            // If so, do nothing
            if (savedToken.length) {
                return res.send({ updated: true });
            }

            // If not, save the token to the database
            const newToken = await FcmToken.create({
                value: token,
                userId: req.user.id,
            });

            // Subscribe admin to report creation notifications
            if (req.user.role <= roles.ADMIN) {
                subscribeToReportCreationTopic(user._id, newToken.value);
            }

            return res.status.send({ updated: true });
        } catch (err) {
            return next(err);
        }
    }
);

module.exports = router;
