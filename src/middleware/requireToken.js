const jwtMiddleware = require('express-jwt');

// Import environmental variables
require('dotenv').config();

const TOKEN_SECRET = process.env.TOKEN_SECRET;

if (!TOKEN_SECRET) {
    throw new Error('TOKEN_SECRET not defined');
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
