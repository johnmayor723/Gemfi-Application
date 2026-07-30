const { rateLimit } = require("express-rate-limit");

const { TooManyRequestsError } = require("../errors");

/**
 * Hands rate-limit rejections to the standard error handler
 * instead of express-rate-limit's default plain-text response,
 * so callers get the same { success, message, error, meta }
 * shape as every other error.
 */
const handler = (req, res, next) => {

    next(new TooManyRequestsError());

};

/**
 * Baseline protection applied globally in app.js. Route-specific
 * limiters (login, public lookups, etc.) should layer a tighter
 * limit on top of this where a route needs it, not replace it.
 */
const globalLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    limit: 300,

    standardHeaders: true,

    legacyHeaders: false,

    handler

});

module.exports = {

    globalLimiter

};
