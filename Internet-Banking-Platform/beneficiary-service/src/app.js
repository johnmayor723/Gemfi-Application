require("express-async-errors");

const express = require("express");

const helmet = require("helmet");

const cors = require("cors");

const mongoSanitize = require("express-mongo-sanitize");

const hpp = require("hpp");

const routes = require("./routes");

const correlationId = require("./middleware/correlation-id.middleware");
const requestLogger = require("./middleware/request-logger.middleware");
const notFoundMiddleware = require("./middleware/not-found.middleware");
const errorHandler = require("./middleware/error-handler.middleware");
const { globalLimiter } = require("./middleware/rate-limit.middleware");

const app = express();

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
 * CORS
 * (Temporary: allow all origins during development, matching
 * the Banking Template - lock this down before production.)
 */
app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/**
 * Strip Mongo operators ($gt, $ne, etc.) from req.body/query/params.
 */
app.use(mongoSanitize());

/**
 * HTTP Parameter Pollution protection.
 */
app.use(hpp());

/**
 * Baseline rate limit across every route. Routes that need a
 * tighter limit layer their own on top.
 */
app.use(globalLimiter);

/**
 * Correlation ID must run before logging so every log line
 * (including this request's own) carries it.
 */
app.use(correlationId);

/**
 * Log every request.
 */
app.use(requestLogger);

/**
 * Register application routes.
 */
app.use(routes);

/**
 * Unknown routes.
 */
app.use(notFoundMiddleware);

/**
 * Global error handler.
 */
app.use(errorHandler);

module.exports = app;
