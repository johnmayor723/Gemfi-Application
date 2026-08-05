const menuService = require("../session/menu.service");

const { logger } = require("../../config");

/**
 * Africa's Talking's USSD callback contract, not the platform's
 * usual JSON envelope (same kind of deliberate exception as
 * statement-service's CSV export): plain text, prefixed CON
 * (session continues) or END (session terminates). A malformed
 * response or a 4xx makes AT terminate the session, so on an
 * unexpected failure this still returns a 200 with an END message
 * rather than letting the error handler produce a JSON 500 body
 * AT can't parse.
 */
const callback = async (req, res) => {

    const {
        sessionId,
        phoneNumber,
        text
    } = req.body;

    res.setHeader("Content-Type", "text/plain");

    try {

        const { continueSession, message } =
            await menuService.step({ sessionId, phoneNumber, text });

        return res
            .status(200)
            .send(`${continueSession ? "CON" : "END"} ${message}`);

    } catch (error) {

        logger.error(
            { error: { message: error.message }, sessionId },
            "USSD callback failed unexpectedly."
        );

        return res
            .status(200)
            .send("END Sorry, something went wrong. Please try again.");

    }

};

module.exports = {

    callback

};
