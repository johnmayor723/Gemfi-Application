const repository = require("./audit.repository");

const { logger } = require("../../config");

const {
    AUDIT_STATUS
} = require("../../constants/audit-event.constants");

class AuditService {

    /**
     * ==========================================================
     * Log Audit Event
     * ==========================================================
     *
     * Best-effort: a failure to persist an audit event must
     * never break the primary flow that triggered it.
     */
    async log({

        eventType,

        status = AUDIT_STATUS.SUCCESS,

        userId = null,

        identifier = null,

        accountNumber = null,

        request = null,

        metadata = {}

    }) {

        try {

            await repository.create({

                eventType,

                status,

                userId,

                identifier,

                accountNumber,

                ipAddress:
                    request ? request.ip : null,

                userAgent:
                    request && typeof request.get === "function"
                        ? request.get("user-agent")
                        : null,

                metadata

            });

        } catch (error) {

            logger.warn(
                {
                    error: {
                        message: error.message
                    },
                    eventType
                },
                "Failed to persist audit event."
            );

        }

    }

    /**
     * ==========================================================
     * Get User Audit Trail
     * ==========================================================
     */
    async getUserAuditTrail(
        userId,
        {
            page = 1,
            limit = 20
        } = {}
    ) {

        const [
            events,
            total
        ] = await Promise.all([

            repository.findByUserId(
                userId,
                {
                    page,
                    limit
                }
            ),

            repository.countByUserId(
                userId
            )

        ]);

        return {

            events:
                events.map(
                    (event) => ({

                        id:
                            event.id,

                        eventType:
                            event.eventType,

                        status:
                            event.status,

                        accountNumber:
                            event.accountNumber,

                        ipAddress:
                            event.ipAddress,

                        userAgent:
                            event.userAgent,

                        metadata:
                            event.metadata,

                        createdAt:
                            event.createdAt

                    })
                ),

            pagination: {

                page,

                limit,

                total

            }

        };

    }

}

module.exports = new AuditService();
