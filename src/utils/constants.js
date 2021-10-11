const roles = {
    ROOT: 0,
    ADMIN: 1,
    VISITOR: 2,
};

const status = {
    PENDING: 0,
    COMPLETED: 1,
};

const category = {
    OTHER: 0,
    LUMINARY: 1,
    DOG_FECES: 2,
    BRANCHES: 3,
    OVERGROWN_GRASS: 4,
    FACILITIES_FAULT: 5,
    LEASHLESS_DOG: 6,
    GARBAGE: 7,
    FACILITIES_MISUSE: 8,
};

ADMIN_TOPIC = 'reportCreate';

module.exports = {
    roles,
    status,
    ADMIN_TOPIC,
    category,
};
