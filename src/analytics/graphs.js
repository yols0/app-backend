const { Report } = require('../models');
const { status, category } = require('../utils/constants');

//graph 1 Número de reportes abiertos y cerrados (Totales)
async function reportsByStatus(initDate, finishDate) {
    return {
        total: await countReports(initDate, finishDate), //total de reportes
        openReports: await countReportsStatus(
            initDate,
            finishDate,
            status.PENDING
        ),
        closedReports: await countReportsStatus(
            initDate,
            finishDate,
            status.COMPLETED
        ),
    };
}

async function countReports(initDate, finishDate) {
    return await Report.find({
        creationDate: { $gte: initDate, $lt: finishDate },
    })
        .countDocuments()
        .exec();
}
async function countReportsStatus(initDate, finishDate, status) {
    return await Report.find({
        creationDate: { $gte: initDate, $lt: finishDate },
        status,
    })
        .countDocuments()
        .exec();
}

async function reportsByCategory(initDate, finishDate) {
    return {
        other: await countReportsCategory(initDate, finishDate, category.OTHER),
        luminary: await countReportsCategory(
            initDate,
            finishDate,
            category.LUMINARY
        ),
        dogFeces: await countReportsCategory(
            initDate,
            finishDate,
            category.DOG_FECES
        ),
        branches: await countReportsCategory(
            initDate,
            finishDate,
            category.BRANCHES
        ),
        overgrownGrass: await countReportsCategory(
            initDate,
            finishDate,
            category.OVERGROWN_GRASS
        ),
        facilitiesFault: await countReportsCategory(
            initDate,
            finishDate,
            category.FACILITIES_FAULT
        ),
        leashlessDog: await countReportsCategory(
            initDate,
            finishDate,
            category.LEASHLESS_DOG
        ),
        garbage: await countReportsCategory(
            initDate,
            finishDate,
            category.GARBAGE
        ),
        facilitiesMisuse: await countReportsCategory(
            initDate,
            finishDate,
            category.FACILITIES_MISUSE
        ),
    };
}

async function countReportsCategory(initDate, finishDate, category) {
    return await Report.find({
        category,
        creationDate: { $gte: initDate, $lt: finishDate },
    })
        .countDocuments()
        .exec();
}

//Graph 3: Número de reportes hechos por categoría
async function reportsByCategoryHistoric() {
    return {
        other: await countReportsCategoryHistoric(category.OTHER),
        luminary: await countReportsCategoryHistoric(category.LUMINARY),
        dog_feces: await countReportsCategoryHistoric(category.DOG_FECES),
        branches: await countReportsCategoryHistoric(category.BRANCHES),
        overgrown_grass: await countReportsCategoryHistoric(
            category.OVERGROWN_GRASS
        ),
        facilities_fault: await countReportsCategoryHistoric(
            category.FACILITIES_FAULT
        ),
        leashless_dog: await countReportsCategoryHistoric(
            category.LEASHLESS_DOG
        ),
        garbage: await countReportsCategoryHistoric(category.GARBAGE),
        facilities_misuse: await countReportsCategoryHistoric(
            category.FACILITIES_MISUSE
        ),
    };
}

async function countReportsCategoryHistoric(category) {
    return await Report.find({ category }).countDocuments().exec();
}

module.exports = {
    reportsByStatus,
    reportsByCategory,
    reportsByCategoryHistoric,
};
