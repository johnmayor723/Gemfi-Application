const service = require("./notification.service");

const { success, created } = require("../../responses/api.response");

/**
 * Send Notification (internal, service-to-service)
 */
const sendInternal = async (req, res) => {

    const result =
        await service.send({
            ...req.body,
            correlationId: req.correlationId
        });

    return created(res, {
        message: "Notification processed.",
        data: result
    });

};

/**
 * List Notifications For A User (internal, service-to-service)
 */
const listInternal = async (req, res) => {

    const {
        userId,
        page,
        limit
    } = req.query;

    const result =
        await service.list(userId, {

            page:
                page ? Number(page) : 1,

            limit:
                limit ? Number(limit) : 20

        });

    return success(res, {
        message: "Notifications retrieved successfully.",
        data: result
    });

};

/**
 * List My Notifications (customer-facing)
 */
const list = async (req, res) => {

    const {
        page,
        limit
    } = req.query;

    const result =
        await service.list(req.user.userId, {

            page:
                page ? Number(page) : 1,

            limit:
                limit ? Number(limit) : 20

        });

    return success(res, {
        message: "Notifications retrieved successfully.",
        data: result
    });

};

/**
 * Mark My Notification Read (customer-facing)
 */
const markRead = async (req, res) => {

    const result =
        await service.markRead(req.user, req.params.id);

    return success(res, {
        message: "Notification marked as read.",
        data: result
    });

};

module.exports = {

    sendInternal,

    listInternal,

    list,

    markRead

};
