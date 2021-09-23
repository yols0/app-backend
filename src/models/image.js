const mongoose = require('mongoose');
const { Schema } = mongoose;

const imageSchema = new Schema({
    extension: {
        type: String,
        enum: {
            values: ['png', 'jpg', 'jpeg'],
            message: 'Extension must be png, jpg or jpeg',
        },
        required: [true, 'Extension is required'],
    },
});

module.exports = imageSchema;
