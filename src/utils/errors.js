class UnsetEnvError extends Error {
    constructor(key) {
        super(`Environment variable ${key} is not set`);
        this.name = 'UnsetEnvError';
    }
}

class ReportCreationError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'ReportCreationError';
        this.code = code;
    }
}

module.exports = {
    UnsetEnvError,
    ReportCreationError,
};
