const mongoose = require('mongoose');
const imageSchema = require('./image');
const reportSchema = require('./report');
const userSchema = require('./user');
const { UnsetEnvError } = require('../utils/errors');

const MONGODB_URI = process.env.MONGODB_URI;

if (!process.env.MONGODB_URI) {
    throw new UnsetEnvError('MONGODB_URI');
}

// Use schema export pattern
// https://mongoosejs.com/docs/connections.html#multiple_connections

const conn = mongoose.createConnection(MONGODB_URI);

const Image = conn.model('Image', imageSchema);
const Report = conn.model('Report', reportSchema);
const User = conn.model('User', userSchema);

module.exports = { conn, Image, Report, User };
