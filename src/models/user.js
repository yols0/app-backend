const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;
const Int32 = require('mongoose-int32').loadType(mongoose);
const { isEmail } = require('validator');
const { randomIntGenerator } = require('../utils');

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
    profilePicture: {
        type: Int32,
        required: true,
        default: randomIntGenerator(0, 25),
    },
    lastSeen: {
        type: Date,
        required: true,
        default: Date.now,
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
        return next();
    } catch (err) {
        return next(err);
    }
});

// Also delete all the user's reports
userSchema.pre('remove', async function (next) {
    const reports = await this.model('Report').find({ creator: this._id });

    await Promise.all(
        reports.map(async (report) => {
            await report.remove();
        })
    );
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
        profilePicture: this.profilePicture,
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
        profilePicture: this.profilePicture,
    };
};

userSchema.index({ firstName: 'text', lastName: 'text' });

module.exports = userSchema;
