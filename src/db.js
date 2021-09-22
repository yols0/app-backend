const mongoose = require('mongoose');

// Import environment variables
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be defined');
}

mongoose.connect(MONGODB_URI);
