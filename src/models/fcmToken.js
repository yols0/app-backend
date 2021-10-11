const mongoose = require('mongoose');
const { Schema } = mongoose;

// Optionally specify FCM token expiration time
// Default is ~2 months
const FCM_TOKEN_EXPIRATION =
    parseInt(process.env.FCM_TOKEN_EXPIRATION) || 60 * 60 * 24 * 60;

const fcmTokenSchema = new Schema({
    value: {
        required: true,
        type: String,
        index: true,
        unique: true,
    },
    userId: {
        required: true,
        type: Schema.Types.ObjectId,
    },
    creationDate: {
        required: true,
        type: Date,
        default: Date.now,
        expires: FCM_TOKEN_EXPIRATION,
    },
});

module.exports = fcmTokenSchema;
