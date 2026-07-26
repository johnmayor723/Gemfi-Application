const service = require("./audit.service");

/**
 * ==========================================================
 * Get My Audit Trail
 * ==========================================================
 */
exports.getMyAuditTrail =
    async (
        req,
        res
    ) => {

        const {
            page,
            limit
        } = req.query;

        const result =
            await service.getUserAuditTrail(
                req.user.userId,
                {

                    page:
                        page || 1,

                    limit:
                        limit || 20

                }
            );

        return res.json({

            success: true,

            message:
                "Audit trail retrieved successfully.",

            data: result,

            meta: {

                timestamp:
                    new Date()

            }

        });

    };
