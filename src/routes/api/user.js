const express = require('express');
const MongooseError = require('mongoose').Error;
const requireToken = require('../../middleware/requireToken');
const requireFields = require('../../middleware/requireFields');
const requireMinRole = require('../../middleware/requireMinRole');
const { User } = require('../../models');

const router = express.Router();

const MAX_USERS_RESULTS = parseInt(process.env.MAX_USERS_RESULTS) || 15;

// @route   GET api/v1/user
// @desc    Query users by name
// @access  Admin
router.get('/', async (req, res, next) => {
    const name = req.query.name;
    const skip = parseInt(req.query.skip) || 0;

    if (!name) {
        return res.status(400).send({
            error: 'Query parameter name is required',
        });
    }

    try {
        const users = await User.aggregate([
            { $match: { $text: { $search: name } } },
            { $sort: { score: { $meta: 'textScore' } } },
            { $skip: skip },
            { $limit: MAX_USERS_RESULTS },
            {
                $project: {
                    _id: 0,
                    id: '$_id',
                    firstName: 1,
                    lastName: 1,
                },
            },
        ]);
        return res.send(users);
    } catch (err) {
        return next(err);
    }
});

// @route   POST api/v1/user
// @desc    Create user
// @access  Public
router.post('/', (req, res, next) => {
    // res.status(500).send('Not implemented');
    try {
        // Sanitize to prevent abuse
        const sanitizedData = req.body;

        // The password is hashed when the user model is created
        sanitizedData.pwHash = sanitizedData.password;

        delete sanitizedData._id;
        delete sanitizedData.__v;
        delete sanitizedData.password;
        delete sanitizedData.role;

        // Create and save user
        const user = new User(sanitizedData);
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
});

// @route   PUT api/v1/user
// @desc    Update user
// @access  Private
router.put('/', requireToken(), async (req, res, next) => {
    try {
        // Sanitize to prevent abuse
        const sanitizedData = req.body;

        // The password is hashed when the user model is created
        sanitizedData.pwHash = sanitizedData.password;

        delete sanitizedData._id;
        delete sanitizedData.__v;
        delete sanitizedData.password;
        delete sanitizedData.role;

        const user = await User.findByIdAndUpdate(req.user.id, sanitizedData, {
            new: true,
        });

        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        return res.status(204).send(user.getFullData());
    } catch (err) {
        return next(err);
    }
});

// @route   DELETE api/v1/user
// @desc    Delete user
// @access  Private
router.delete('/', requireToken(), async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.user.id);
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
    requireMinRole(1),
    async (req, res, next) => {
        if (!req.params.id) {
            return res.status(400).send({ error: 'Missing id.' });
        }

        try {
            const user = await User.findById(req.params.id);
            return res.status(200).send(user.getPublicData());
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
    requireMinRole(1),
    requireFields('role'),
    async (req, res, next) => {
        try {
            const { role } = req.body;
            await User.findByIdAndUpdate(
                req.params.id,
                { role },
                { new: true }
            );
            return res.status(204).send();
        } catch (err) {
            if (err instanceof MongooseError.CastError) {
                return res.status(400).send({ error: 'Invalid id' });
            }
            return next(err);
        }
    }
);

module.exports = router;
