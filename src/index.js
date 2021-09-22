const express = require('express');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

// Import environment variables
require('dotenv').config();

// Optionally specify port
const PORT = parseInt(process.env.PORT) || 3000;

// Initialize connection to database
require('./db');

// Initialize express app
const app = express();

// Use API routes
app.use('/api/v1/', apiRoutes);

// Catch any unhandled errors
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
});
