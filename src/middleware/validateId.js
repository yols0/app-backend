// Validate that the id in the parameter is a valid MongoDB ObjectId
const ObjectId = require('mongodb').ObjectId;

module.exports = function (req, res, next) {
    if (!req.params.id) {
        return res.status(400).json({
            message: 'Missing id parameter',
        });
    }
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            message: 'Invalid id',
        });
    }
    next();
};
