const express = require('express');
const jwt = require('jsonwebtoken');
const requireFields = require('../../middleware/requireFields');
const requireToken = require('../../middleware/requireToken');
const { User } = require('../../models');
const { UnsetEnvError } = require('../../utils/errors');

const TOKEN_SECRET = process.env.TOKEN_SECRET;

if (!TOKEN_SECRET) {
    throw new UnsetEnvError('TOKEN_SECRET');
}

const ACCESS_EXPIRATON = parseInt(process.env.ACCESS_EXPIRATON) || 1800;
const REFRESH_EXPIRATION = parseInt(process.env.REFRESH_EXPIRATION) || 259200;

const router = express.Router();

// @route   GET api/v1/session
// @desc    Get current user and update last seen
// @access  Private
router.get('/', requireToken(), async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.lastSeen = Date.now();
        await user.save();
        res.send(user.getFullData());
    } catch (err) {
        return next(err);
    }
});

// @route   POST api/v1/session
// @desc    Create new session
// @access  Public
router.post('/', requireFields('email', 'password'), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        // Email not found
        if (!user) {
            return res.status(401).send({
                error: 'Invalid credentials',
            });
        }

        // Password incorrect
        if (!(await user.validatePassword(password))) {
            return res.status(401).send({
                error: 'Invalid credentials',
            });
        }

        const tokens = generateTokens(user.id, user.role);
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

function generateTokens(id, role) {
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
