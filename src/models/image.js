const fs = require('fs');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { UnsetEnvError } = require('../utils/errors');

const UPLOADS_DIR = process.env.UPLOADS_DIR;

if (!UPLOADS_DIR) {
    throw new UnsetEnvError('UPLOADS_DIR');
}

const imageSchema = new Schema({
    _id: {
        required: true,
        type: Schema.Types.ObjectId,
        default: mongoose.Types.ObjectId,
    },
    extension: {
        type: String,
        enum: {
            values: ['.png', '.jpg', '.jpeg'],
            message: 'Extension must be .png, .jpg or .jpeg',
        },
        required: [true, 'Extension is required'],
    },
});

// Virtual property to get the image file name
imageSchema.virtual('fileName').get(function () {
    return `${this._id}${this.extension}`;
});

imageSchema.virtual('thumbnail').get(function () {
    return `${this._id}_thumb.jpg`;
});

imageSchema.pre('remove', function (next) {
    fs.unlink(`${UPLOADS_DIR}/${this.fileName}`, (err) => {
        if (err) {
            console.error("Couldn't delete image: " + err);
        }
    });
    fs.unlink(`${UPLOADS_DIR}/${this.thumbnail}`, (err) => {
        if (err) {
            console.error("Couldn't delete thumbnail: " + err);
        }
    });
    return next();
});

module.exports = imageSchema;
