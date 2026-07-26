require("express-async-errors");

const express = require("express");

const cors = require("cors");

const routes = require("./routes");

const requestLogger = require("./middleware/request-logger.middleware");
const notFoundMiddleware = require("./middleware/not-found.middleware");
const errorHandler = require("./middleware/error-handler.middleware");

const app = express();

app.disable("x-powered-by");

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