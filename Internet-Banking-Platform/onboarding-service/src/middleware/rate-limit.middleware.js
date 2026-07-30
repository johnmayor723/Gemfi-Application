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

/**
 * The admin login endpoint itself is unauthenticated by
 * definition, so it needs its own tight limiter to blunt
 * credential-stuffing against Fineract.
 */
const adminLoginLimiter = rateLimit({

    windowMs: 60 * 1000,

    limit: 10,

    standardHeaders: true,

    legacyHeaders: false,

    handler

});

/**
 * Public onboarding-request submission and status-check.
 * Anonymous by design (no invite gate), so this is the real
 * defense against spam submissions filling the pending queue.
 */
const publicOnboardingLimiter = rateLimit({

    windowMs: 60 * 1000,

    limit: 10,

    standardHeaders: true,

    legacyHeaders: false,

    handler

});

module.exports = {

    globalLimiter,

    adminLoginLimiter,

    publicOnboardingLimiter

};
