class UnsetEnvError extends Error {
    constructor(key) {
        super(`Environment variable ${key} is not set`);
        this.name = 'UnsetEnvError';
    }
}

class ApiRequestError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'ApiRequestError';
        this.statusCode = statusCode;
    }
}

class InvalidReportError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidReportError';
    }
}

module.exports = {
    UnsetEnvError,
    ApiRequestError,
    InvalidReportError,
};
