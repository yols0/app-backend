module.exports = function (...args) {
    return function (req, _, next) {
        for (key of args) {
            delete req.body[key];
        }
        return next();
    };
};
