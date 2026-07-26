const AuditEvent = require("./audit.model");

class AuditRepository {

    /**
     * Create an audit event.
     */
    async create(data) {
        return AuditEvent.create(data);
    }

    /**
     * Find paginated audit events for a user, newest first.
     */
    async findByUserId(
        userId,
        {
            page = 1,
            limit = 20
        } = {}
    ) {

        return AuditEvent
            .find({
                userId
            })
            .sort({
                createdAt: -1
            })
            .skip((page - 1) * limit)
            .limit(limit);

    }

    /**
     * Count audit events for a user.
     */
    async countByUserId(userId) {

        return AuditEvent.countDocuments({
            userId
        });

    }

}

module.exports = new AuditRepository();
