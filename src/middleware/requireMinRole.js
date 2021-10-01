module.exports = function (role) {
    return function (req, res, next) {
        // This shouldn't happen if the session middleware is applied beforehand
        if (!req.user || !req.user.role) {
            return next(new Error('User role not found'));
        }

        if (req.user.role <= role) {
            return next();
        } else {
            return res.status(403).send({
                message: 'User is not authorized for this action',
            });
        }
    };
};
