require("express-async-errors");

const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");

const routes = require("./routes");

const requestLogger = require("./middleware/request-logger.middleware");
const notFoundMiddleware = require("./middleware/not-found.middleware");
const errorHandler = require("./middleware/error-handler.middleware");

const app = express();

/**
 * Hide Express fingerprint.
 */
app.disable("x-powered-by");

/**
 * Secure HTTP headers.
 */
app.use(
    helmet({
        crossOriginResourcePolicy: false
    })
);

/**
 * Compress responses.
 */
app.use(compression());

/**
 * CORS
 * (Temporary: allow all origins during development)
 * We'll lock this down before production.
 */
app.use(
    cors({
        origin: true,
        credentials: true
    })
);

/**
 * Parse JSON.
 */
app.use(express.json());

/**
 * Parse URL Encoded.
 */
app.use(express.urlencoded({ extended: true }));

/**
 * Request logging.
 */
app.use(requestLogger);

/**
 * Routes.
 */
app.use(routes);

/**
 * 404 handler.
 */
app.use(notFoundMiddleware);

/**
 * Global error handler.
 */
app.use(errorHandler);

module.exports = app;