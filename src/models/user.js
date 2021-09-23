const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;
const Int32 = require('mongoose-int32').loadType(mongoose);
const { isEmail } = require('validator');

// Import environment variables
require('dotenv').config();

// Optinally specify salt rounds
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;

const userSchema = new Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        minlength: [3, 'Email must be at least 3 character'],
        maxlength: [320, 'Email must be less than 320 characters'],
        validate: [isEmail, 'Invalid email'],
        unique: true,
        // createIndexes: { unique: true },
        trim: true,
    },
    pwHash: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        // maxlength: [128, 'Password must be less than 128 characters long'],
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        maxlength: [255, 'First name must be less than 255 characters'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        maxlength: [255, 'Last name must be less than 255 characters'],
        trim: true,
    },
    role: {
        type: Int32,
        required: true,
        default: 2,
    },
    notificationsEnabled: {
        type: Boolean,
        required: true,
        default: true,
    },
    appNotificationsEnabled: {
        type: Boolean,
        required: true,
        default: true,
    },
    emailNotificationsEnabled: {
        type: Boolean,
        required: true,
        default: false,
    },
});

// Generate a hash for the user's password on creation
userSchema.pre('save', async function (next) {
    if (!this.isModified('pwHash')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hash = await bcrypt.hash(this.pwHash, salt);
        this.pwHash = hash;
        next();
    } catch (err) {
        next(err);
    }
});

// Compare a plain text password against the hashed password
userSchema.methods.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.pwHash);
};

// Get user public data
userSchema.methods.getPublicData = function () {
    return {
        id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
    };
};

// Get user full data
userSchema.methods.getFullData = function () {
    return {
        id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        role: this.role,
        notificationsEnabled: this.notificationsEnabled,
        appNotificationsEnabled: this.appNotificationsEnabled,
        emailNotificationsEnabled: this.emailNotificationsEnabled,
    };
};

module.exports = userSchema;
