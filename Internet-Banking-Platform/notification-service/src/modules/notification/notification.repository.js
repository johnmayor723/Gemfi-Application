const Notification = require("./notification.model");

class NotificationRepository {

    /**
     * Create a notification log entry.
     */
    async create(data) {

        return Notification.create(data);

    }

    /**
     * Find by ID.
     */
    async findById(id) {

        return Notification.findById(id);

    }

    /**
     * Find paginated notifications for a user, newest first.
     */
    async findByUserId(
        userId,
        {
            page = 1,
            limit = 20
        } = {}
    ) {

        return Notification
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
     * Count notifications for a user.
     */
    async countByUserId(userId) {

        return Notification.countDocuments({
            userId
        });

    }

    /**
     * Mark a notification as read.
     */
    async markRead(id) {

        return Notification.findByIdAndUpdate(
            id,
            {
                isRead: true
            },
            {
                new: true
            }
        );

    }

}

module.exports = new NotificationRepository();
