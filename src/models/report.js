const mongoose = require('mongoose');
const { Schema } = mongoose;
const Int32 = require('mongoose-int32').loadType(mongoose);
const imageSchema = require('./image');
const { InvalidReportError } = require('../utils/errors');
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

// Special report dependant validation by category
reportSchema.pre('validate', function (next) {
    try {
        // Cast report by category number
        const report = ReportFactory.getReport(this.category, this);

        // Check for specific (non generic report) fields
        const invalid = [
            'luminaryCode',
            'locationString',
            'locationGeo',
            'desc',
        ].filter((field) => this[field] && !report.canHaveField(field));
        if (invalid.length) {
            throw new InvalidReportError(
                `Invalid fields for given report category: ${invalid.join()}`
            );
        }

        // Validate further
        report.validate();

        return next();
    } catch (err) {
        return next(err);
    }
});

reportSchema.methods.getData = function () {
    const data = {
        id: this._id,
        category: this.category.toString(),
        creationDate: this.creationDate,
        status: this.status,
        endMessage: this.endMessage,
        creator: this.creator,
        luminaryCode: this.luminaryCode,
        locationString: this.locationString,
        locationGeo: this.locationGeo,
        desc: this.desc,
        image: this.image._id,
    };

    // Delete undefined fields
    Object.keys(data).forEach((key) => {
        if (data[key] === undefined) {
            delete data[key];
        }
    });

    return data;
};

module.exports = reportSchema;
