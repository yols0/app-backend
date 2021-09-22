const express = require('express');
const jwt = require('jsonwebtoken');
const requireParams = require('../../middleware/requireParams');
const requireToken = require('../../middleware/requireToken');
const User = require('../../models/user');

// Import environment variables
require('dotenv').config();

const TOKEN_SECRET = process.env.TOKEN_SECRET;

if (!TOKEN_SECRET) {
    throw new Error('TOKEN_SECRET not defined');
}

const ACCESS_EXPIRATON = parseInt(process.env.ACCESS_EXPIRATON) || 1800;
const REFRESH_EXPIRATION = parseInt(process.env.REFRESH_EXPIRATION) || 259200;

const router = express.Router();

// @route   GET api/v1/session
// @desc    Get current user
// @access  Private
router.get('/', requireToken(), async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.send(user.getFullData());
    } catch (err) {
        return next(err);
    }
});

// @route   POST api/v1/session
// @desc    Create new session
// @access  Public
router.post('/', requireParams('email', 'password'), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        // Email not found
        if (!user) {
            return res.status(400).send({
                error: 'Invalid credentials',
            });
        }

        // Password incorrect
        if (!(await user.validatePassword(password))) {
            return res.status(400).send({
                error: 'Invalid credentials',
            });
        }

        const tokens = await generateTokens(user.id, user.role);
        res.send(tokens);
    } catch (err) {
        return next(err);
    }
});

// @route   PUT api/v1/session
// @desc    Refresh session
// @access  Private
router.put('/', requireToken('refresh'), (req, res, next) => {
    try {
        const tokens = generateTokens(req.user.id, req.user.role);
        res.send(tokens);
    } catch (err) {
        return next(err);
    }
});

// @route   DELETE api/v1/session
// @desc    Delete current session
// @access  Private
router.delete('/', (_, res) => {
    res.status(204).send();
});

async function generateTokens(id, role) {
    return {
        access: jwt.sign({ id, role, type: 'access' }, TOKEN_SECRET, {
            expiresIn: ACCESS_EXPIRATON,
        }),
        refresh: jwt.sign({ id, role, type: 'refresh' }, TOKEN_SECRET, {
            expiresIn: REFRESH_EXPIRATION,
        }),
    };
}

module.exports = router;
