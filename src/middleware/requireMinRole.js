module.exports = function (role) {
    return function (req, res, next) {
        const userRole = req.user.role;

        // This shouldn't happen if the session middleware is applied beforehand
        if (!userRole) {
            throw new Error('User role not found');
        }

        if (userRole <= role) {
            return next();
        } else {
            return res.status(403).send({
                message: 'User is not authorized for this action',
            });
        }
    };
};
