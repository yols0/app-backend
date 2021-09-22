const express = require('express');
const User = require('../../models/user');
const { Error } = require('mongoose');
const requireToken = require('../../middleware/requireToken');
const requireParams = require('../../middleware/requireParams');
const requireMinRole = require('../../middleware/requireMinRole');

const router = express.Router();

// @route   GET api/v1/user
// @desc    Query users by name
// @access  Admin
router.get('/', (_, res) => {
    // res.status(500).send('Not implemented');
    User.find({}, (err, users) => {
        if (err) return res.status(400).send(err);
        res.status(200).send(users);
    });
});

// @route   POST api/v1/user
// @desc    Create user
// @access  Public
router.post('/', (req, res, next) => {
    // res.status(500).send('Not implemented');
    try {
        // Sanitize to prevent abuse
        const sanitizedData = req.body;
        sanitizedData.pwHash = sanitizedData.password;
        delete sanitizedData.password;
        delete sanitizedData.role;

        // Create and save user
        const user = new User(sanitizedData);
        user.save((err, user) => {
            if (err) {
                // Error when invalid fields are sent
                if (err instanceof Error.ValidationError) {
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
        sanitizedData.pwHash = sanitizedData.password;
        delete sanitizedData.password;
        delete sanitizedData.role;

        const user = await User.findByIdAndUpdate(req.user.id, sanitizedData, {
            new: true,
        });

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
// @access  Admin/Private
router.get('/:id', requireToken(), async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        return res.status(200).send(user.getPublicData());
    } catch (err) {
        return next(err);
    }
});

// @route   PUT api/v1/user/:id
// @desc    Update user role by id
// @access  Admin
router.put(
    '/:id',
    requireToken(),
    requireMinRole(1),
    requireParams('role'),
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
            if (err instanceof Error.CastError) {
                return res.status(400).send({ error: 'Invalid id' });
            }
            return next(err);
        }
    }
);

module.exports = router;
