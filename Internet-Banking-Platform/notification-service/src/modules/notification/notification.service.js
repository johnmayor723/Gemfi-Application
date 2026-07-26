const repository = require("./notification.repository");

const emailProvider = require("./email.provider");

const smsProvider = require("./sms.provider");

const {
    NotFoundError,
    AuthorizationError,
    ValidationError
} = require("../../errors");

class NotificationService {

    /**
     * ==========================================================
     * Send Notification
     * ==========================================================
     *
     * Picks the provider by channel, sends, and logs the outcome
     * regardless of whether the provider call succeeded — a
     * failed send is still a FAILED log entry, not a thrown
     * error. Notification delivery failures are never the
     * caller's problem to handle beyond "it was attempted."
     */
    async send({

        userId,

        channel,

        type,

        recipient,

        subject,

        message,

        correlationId

    }) {

        if (channel !== "EMAIL" && channel !== "SMS") {

            throw new ValidationError(
                "channel must be EMAIL or SMS."
            );

        }

        const result =
            channel === "EMAIL"
                ? await emailProvider.send({
                      email: recipient,
                      subject,
                      message
                  })
                : await smsProvider.send({
                      phoneNumber: recipient,
                      message
                  });

        const notification =
            await repository.create({

                userId,

                channel,

                type,

                recipient,

                subject:
                    subject || null,

                message,

                status:
                    result.success ? "SENT" : "FAILED",

                providerResponse:
                    result.success ? null : result.error,

                correlationId:
                    correlationId || null

            });

        return this.toPublicShape(notification);

    }

    /**
     * ==========================================================
     * Get / List
     * ==========================================================
     */
    async getOwned(user, id) {

        const notification =
            await repository.findById(id);

        if (!notification) {

            throw new NotFoundError(
                "Notification not found."
            );

        }

        if (notification.userId !== user.userId) {

            throw new AuthorizationError(
                "This notification does not belong to you."
            );

        }

        return notification;

    }

    async markRead(user, id) {

        await this.getOwned(user, id);

        const updated =
            await repository.markRead(id);

        return this.toPublicShape(updated);

    }

    async list(userId, { page, limit }) {

        const [
            notifications,
            total
        ] = await Promise.all([

            repository.findByUserId(
                userId,
                { page, limit }
            ),

            repository.countByUserId(userId)

        ]);

        return {

            notifications:
                notifications.map(
                    (notification) => this.toPublicShape(notification)
                ),

            pagination: {
                page,
                limit,
                total
            }

        };

    }

    toPublicShape(notification) {

        return {

            id: notification.id,

            channel: notification.channel,

            type: notification.type,

            recipient: notification.recipient,

            subject: notification.subject,

            message: notification.message,

            status: notification.status,

            isRead: notification.isRead,

            createdAt: notification.createdAt

        };

    }

}

module.exports = new NotificationService();
