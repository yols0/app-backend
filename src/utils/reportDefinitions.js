const { InvalidReportError } = require('./errors');
const { category } = require('./constants');

// Character to use to join error messages when aggregating
const JOIN_CHAR = ' ';

// Mechanism to aggregate all error messages generated when validating a report
function aggregateError(error, superClassValidation) {
    try {
        superClassValidation();
    } catch (e) {
        if (e instanceof InvalidReportError) {
            error = `${e.message}${error ? JOIN_CHAR : ''}${error}`;
        } else {
            throw e;
        }
    }

    if (error) {
        throw new InvalidReportError(error);
    }
}

// Base class for all Report objects
// When asking if it can have a field, only fields that are NOT defined in the
// generic report should be asked.
class Report {
    canHaveField(_) {
        return false;
    }

    constructor(data) {
        this.data = data;
    }

    validate() {}
}

class LocatedReport extends Report {
    static fields = new Set(['locationString', 'locationGeo']);

    canHaveField(field) {
        return super.canHaveField(field) || LocatedReport.fields.has(field);
    }

    validate() {
        let error = '';

        const locStr = !!this.data.locationString;
        const locGeo = !!this.data.locationGeo;

        if (!locStr && !locGeo) {
            error = 'Missing location info.';
        } else if (locStr && locGeo) {
            error = 'Location info is ambiguous.';
        }

        aggregateError(error, () => super.validate());
    }
}

class DescribedReport extends LocatedReport {
    static fields = new Set(['desc']);
    canHaveField(field) {
        return super.canHaveField(field) || DescribedReport.fields.has(field);
    }

    validate() {
        let error = '';
        if (!this.data.desc) {
            error = 'Missing description.';
        }

        aggregateError(error, () => super.validate());
    }
}

class LuminaryReport extends Report {
    static fields = new Set(['luminaryCode']);
    canHaveField(field) {
        return super.canHaveField(field) || LuminaryReport.fields.has(field);
    }

    validate() {
        let error = '';

        const code = !!this.data.luminaryCode;
        const image = !!this.data.image;

        if (!code && !image) {
            error = 'Missing luminary code.';
        } else if (code && image) {
            error = 'Luminary code and image are both present.';
        }

        aggregateError(error, () => super.validate());
    }
}

class DogFecesReport extends LocatedReport {}

class BranchesReport extends LocatedReport {}

class OvergrownGrassReport extends LocatedReport {}

class FacilitiesFaultReport extends DescribedReport {}

class LeashlessDogReport extends DescribedReport {}

class GarbageReport extends DescribedReport {}

class FacilitiesMisuseReport extends DescribedReport {}

class OtherReport extends DescribedReport {}

// Factory to instantiate a Report object given a category number
class ReportFactory {
    static types = {
        [category.OTHER]: OtherReport,
        [category.LUMINARY]: LuminaryReport,
        [category.DOG_FECES]: DogFecesReport,
        [category.BRANCHES]: BranchesReport,
        [category.OVERGROWN_GRASS]: OvergrownGrassReport,
        [category.FACILITIES_FAULT]: FacilitiesFaultReport,
        [category.LEASHLESS_DOG]: LeashlessDogReport,
        [category.GARBAGE]: GarbageReport,
        [category.FACILITIES_MISUSE]: FacilitiesMisuseReport,
    };

    static getReport(cat, data) {
        const reportType = ReportFactory.types[cat];
        if (!reportType) {
            throw new InvalidReportError(
                `Invalid report category type: ${cat}`
            );
        }
        return new reportType(data);
    }
}

module.exports = { ReportFactory };
