const UssdSession = require("./ussd-session.model");

class UssdSessionRepository {

    async findBySessionId(sessionId) {

        return UssdSession.findOne({ sessionId });

    }

    async create(data) {

        return UssdSession.create({
            ...data,
            expiresAt: UssdSession.freshExpiry()
        });

    }

    /**
     * Advances state (and whatever else changed) and refreshes
     * expiresAt to a fresh window - AT's own session timeout
     * resets on activity too, so this session's TTL should
     * follow suit rather than expire mid-conversation.
     */
    async update(sessionId, update) {

        return UssdSession.findOneAndUpdate(

            { sessionId },

            {
                ...update,
                expiresAt: UssdSession.freshExpiry()
            },

            { new: true }

        );

    }

    async deleteBySessionId(sessionId) {

        return UssdSession.deleteOne({ sessionId });

    }

}

module.exports = new UssdSessionRepository();
