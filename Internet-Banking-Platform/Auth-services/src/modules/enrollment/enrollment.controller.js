const service =
    require("./enrollment.service");

/**
 * ==========================================================
 * Start Enrollment
 * ==========================================================
 */
exports.start =
    async (
        req,
        res
    ) => {

        const result =
            await service.start(
                req.body,
                req
            );

        return res.status(201).json({

            success: true,

            message:
                "Enrollment started successfully.",

            data: result,

            meta: {

                timestamp:
                    new Date()

            }

        });

    };

/**
 * ==========================================================
 * Verify Enrollment
 * ==========================================================
 */
exports.verify =
    async (
        req,
        res
    ) => {

        const result =
            await service.verify(
                req.body,
                req
            );

        return res.json({

            success: true,

            message:
                "Enrollment verified successfully.",

            data: result,

            meta: {

                timestamp:
                    new Date()

            }

        });

    };

/**
 * ==========================================================
 * Complete Enrollment
 * ==========================================================
 */
exports.complete =
    async (
        req,
        res
    ) => {

        const result =
            await service.complete(
                req.body,
                req
            );

        return res.status(201).json({

            success: true,

            message:
                "Enrollment completed successfully.",

            data: result,

            meta: {

                timestamp:
                    new Date()

            }

        });

    };
