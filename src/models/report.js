const mongoose = require('mongoose');
const { Schema } = mongoose;
const Int32 = require('mongoose-int32').loadType(mongoose);
const imageSchema = require('./image');
const { InvalidReportError } = require('../utils/errors');
const { ReportFactory } = require('../utils/reportDefinitions');
const { status, category } = require('../utils/constants');

// Schema used for a GeoJSON point
const pointSchema = new Schema({
    _id: false,
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
});

// Actual report schema
const reportSchema = new Schema({
    _id: {
        required: true,
        type: Schema.Types.ObjectId,
        default: mongoose.Types.ObjectId,
    },
    category: {
        type: Int32,
        required: [true, 'Category is required'],
        // enum: category,
    },
    creationDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    status: {
        type: Int32,
        required: true,
        enum: status,
        default: status.PENDING,
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

reportSchema.methods.getData = async function () {
    console.log(this);

    const user = await this.model('User').findById(this.creator);
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
        image: this.image && this.image._id,
        creatorFirstName: user.firstName,
        creatorLastName: user.lastName,
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
