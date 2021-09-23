const mongoose = require('mongoose');
const { Schema } = mongoose;
const Int32 = require('mongoose-int32').loadType(mongoose);
const imageSchema = require('./image');

const { ReportFactory } = require('../utils/reportDefinitions');

// Schema used for a GeoJSON point
const pointSchema = new Schema({
    _id: false,
    type: {
        type: String,
        enum: {
            values: ['Point'],
            message: 'Location data must be Point',
        },
        required: [true, 'Location data type is required'],
    },
    coordinates: {
        type: [Number],
        required: [true, 'Location coordinates are required'],
    },
});

// Actual report schema
const reportSchema = new Schema({
    category: {
        type: Int32,
        required: [true, 'Category is required'],
    },
    creationDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    status: {
        type: Int32,
        required: true,
        default: 0,
    },
    endMessage: {
        type: String,
        required: false,
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    luminaryCode: {
        type: String,
        maxlength: [32, 'Luminary code must be less than 32 characters'],
        trim: true,
    },
    locationString: {
        type: String,
        maxLength: [255, 'Location string must be less than 255 characters'],
        trim: true,
    },
    locationGeo: {
        type: pointSchema,
    },
    desc: {
        type: String,
        maxLength: [255, 'Description must be less than 255 characters'],
        trim: true,
    },
    image: {
        type: imageSchema,
    },
});

// Virtual property to get the image file name
reportSchema.virtual('imageFileName').get(function () {
    if (this.image) {
        return this.image._id.toString() + '.' + this.image.extension;
    }
    return null;
});

// Special report dependant validation by category
reportSchema.pre('validate', function (next) {
    try {
        // Cast report by category number
        const report = ReportFactory(this.category, this);

        // Check for specific (non generic report) fields
        const invalid = [
            'luminaryCode',
            'locationString',
            'locationGeo',
            'desc',
        ].filter((field) => !report.canHaveField(field));
        if (invalid) {
            throw new Error(
                `Invalid fields for given report category: ${invalid.join()}`
            );
        }

        // Validate further
        report.validate();

        next();
    } catch (err) {
        next(err);
    }
});

module.exports = reportSchema;
