const jwtMiddleware = require('express-jwt');
const { UnsetEnvError } = require('../utils/errors');

const TOKEN_SECRET = process.env.TOKEN_SECRET;

if (!TOKEN_SECRET) {
    throw new UnsetEnvError('TOKEN_SECRET');
}

module.exports = function (type = 'access') {
    return [
        jwtMiddleware({ secret: TOKEN_SECRET, algorithms: ['HS256'] }),
        (err, req, res, next) => {
            if (err instanceof jwtMiddleware.UnauthorizedError || !req.user) {
                return res
                    .status(401)
                    .send({ error: `Invalid or expired ${type} token` });
            }
            return next(err);
        },
        (req, res, next) => {
            if (req.user.type !== type) {
                return res
                    .status(401)
                    .send({ error: `Token is not a(n) ${type} token` });
            }
            return next();
        },
    ];
};
