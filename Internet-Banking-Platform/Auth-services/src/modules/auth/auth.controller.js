const service = require("./auth.service");

/**
 * ==========================================================
 * Register
 * ==========================================================
 */
exports.register =
    async (
        req,
        res
    ) => {

        const result =
            await service.register(
                req.body,
                req
            );

        return res.status(201).json({

            success: true,

            message:
                "Registration completed successfully.",

            data: result,

            meta: {

                timestamp:
                    new Date()

            }

        });

    };

/**
 * ==========================================================
 * Login
 * ==========================================================
 */
exports.login =
    async (
        req,
        res
    ) => {

        const result =
            await service.login(
                req.body,
                req
            );

        return res.json({

            success: true,

            message:
                "Login successful.",

            data: result,

            meta: {

                timestamp:
                    new Date()

            }

        });

    };

/**
 * ==========================================================
 * Refresh Token
 * ==========================================================
 */
exports.refreshToken =
    async (
        req,
        res
    ) => {

        const result =
            await service.refreshToken(
                req.body.refreshToken,
                req
            );

        return res.json({

            success: true,

            message:
                "Token refreshed successfully.",

            data: result,

            meta: {

                timestamp:
                    new Date()

            }

        });

    };

/**
 * ==========================================================
 * Logout Current Device
 * ==========================================================
 */
exports.logout =
    async (
        req,
        res
    ) => {

        const result =
            await service.logout(
                req.body.refreshToken,
                req
            );

        return res.json({

            success: true,

            message:
                "Logged out successfully.",

            data: result,

            meta: {

                timestamp:
                    new Date()

            }

        });

    };

/**
 * ==========================================================
 * Logout Everywhere
 * ==========================================================
 */
exports.logoutAll =
    async (
        req,
        res
    ) => {

        const result =
            await service.logoutAll(
                req.user.userId,
                req
            );

        return res.json({

            success: true,

            message:
                "Logged out from all devices successfully.",

            data: result,

            meta: {

                timestamp:
                    new Date()

            }

        });

    };

/**
 * ==========================================================
 * Active Sessions
 * ==========================================================
 */
exports.getSessions =
    async (
        req,
        res
    ) => {

        const result =
            await service.getSessions(
                req.user.userId
            );

        return res.json({

            success: true,

            message:
                "Sessions retrieved successfully.",

            data: result,

            meta: {

                timestamp:
                    new Date()

            }

        });

    };

/**
 * ==========================================================
 * Forgot Password
 * ==========================================================
 */
exports.forgotPassword =
    async (
        req,
        res
    ) => {

        const result =
            await service.forgotPassword(
                req.body,
                req
            );

        return res.json({

            success: true,

            message:
                "Password reset instructions have been sent.",

            data: result,

            meta: {

                timestamp:
                    new Date()

            }

        });

    };

/**
 * ==========================================================
 * Reset Password
 * ==========================================================
 */
exports.resetPassword =
    async (
        req,
        res
    ) => {

        const result =
            await service.resetPassword(
                req.body,
                req
            );

        return res.json({

            success: true,

            message:
                "Password reset successfully.",

            data: result,

            meta: {

                timestamp:
                    new Date()

            }

        });

    };

/**
 * ==========================================================
 * Change Password
 * ==========================================================
 */
exports.changePassword =
    async (
        req,
        res
    ) => {

        const result =
            await service.changePassword(
                req.user.userId,
                req.body,
                req
            );

        return res.json({

            success: true,

            message:
                "Password changed successfully.",

            data: result,

            meta: {

                timestamp:
                    new Date()

            }

        });

    };
