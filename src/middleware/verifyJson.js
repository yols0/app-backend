module.exports = function (err, _, res, next) {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).send({
            error: 'Invalid JSON data',
        });
    } else {
        // Pass the error to the next middleware if it wasn't a JSON parse error
        return next(err);
    }
};
