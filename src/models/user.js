const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;
const { isEmail } = require('validator');

const userSchema = new Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        maxlength: [320, 'Email must be less than 320 characters'],
        validate: [isEmail, 'Invalid email'],
        createIndexes: { unique: true },
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
        type: Integer,
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
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(user.pwHash, salt);
        this.pwHash = hash;
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.pwHash);
};

module.exports = mongoose.model('User', userSchema);
