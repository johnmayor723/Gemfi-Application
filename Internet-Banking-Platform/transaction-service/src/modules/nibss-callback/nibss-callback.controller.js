const service = require("./nibss-callback.service");

const { success } = require("../../responses/api.response");

/**
 * NIBSS's own delivery is fire-and-forget — it doesn't expect a
 * business reply, just acknowledgement of receipt. Every handler
 * here returns plain 200 JSON rather than an ISO 20022 response.
 */

const pacs002 = async (req, res) => {

    await service.handlePacs002(req.body);

    return success(res, {
        message: "pacs.002 received."
    });

};

const acmt024 = async (req, res) => {

    await service.handleAcmt024(req.body);

    return success(res, {
        message: "acmt.024 received."
    });

};

/**
 * Builds a deferred-message-type handler bound to its own
 * route's message type, so every stubbed callback URL still
 * logs distinctly rather than sharing one anonymous handler.
 */
const deferred = (messageType) => async (req, res) => {

    await service.handleDeferred(messageType, req.body);

    return success(res, {
        message: `${messageType} received — not yet processed in this build phase.`
    });

};

module.exports = {
    pacs002,
    acmt024,
    deferred
};
