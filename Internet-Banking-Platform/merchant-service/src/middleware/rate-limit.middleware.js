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
 * limiters (admin actions, etc.) should layer a tighter limit on
 * top of this where a route needs it, not replace it.
 */
const globalLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    limit: 300,

    standardHeaders: true,

    legacyHeaders: false,

    handler

});

/**
 * Admin-session-authenticated portal actions: every /merchants
 * route (every merchant-service route is admin-only - see
 * ../modules/merchants/merchant.routes.js). Mirrors
 * account-service's adminActionLimiter - guards against a runaway
 * client/bug rather than anonymous abuse, since the caller is
 * already authenticated.
 */
const adminActionLimiter = rateLimit({

    windowMs: 60 * 1000,

    limit: 30,

    standardHeaders: true,

    legacyHeaders: false,

    handler

});

/**
 * The admin login endpoint itself is unauthenticated by
 * definition, so it needs its own tight limiter to blunt
 * credential-stuffing against Fineract. Mirrors account-service's
 * adminLoginLimiter.
 */
const adminLoginLimiter = rateLimit({

    windowMs: 60 * 1000,

    limit: 10,

    standardHeaders: true,

    legacyHeaders: false,

    handler

});

module.exports = {

    globalLimiter,

    adminActionLimiter,

    adminLoginLimiter

};
