const axios = require("axios");

const config = require("./nibss.config");

const { ApiError } = require("../../errors");

/**
 * ==========================================================
 * NIBSS NPS Transport
 * ==========================================================
 *
 * Sends an outward ISO 20022 XML message to NIBSS. The response
 * to a pacs.008 or acmt.023 send never comes back on this same
 * HTTP call — it arrives later at our own /pacs002 or /acmt024
 * callback route, correlated via ./callback-correlator.js. This
 * client only covers the send side. pacs.028 is the exception:
 * its response is the direct HTTP response to this call (NPS
 * guide §3.3 — not in NIBSS's callback URL list).
 *
 * NIBSS's exact inbound endpoint path per message type hasn't
 * been confirmed yet (still in their discovery stage) — this
 * defaults to the same "/<messageType>" convention they gave us
 * for callback registration, under config.baseUrl, until that's
 * confirmed otherwise.
 */

const client = axios.create({

    timeout: config.paymentTimeoutMs,

    headers: {
        "Content-Type": "application/xml",
        Accept: "application/xml"
    }

});

/**
 * Sends `xmlBody` to NIBSS for the given message type (e.g.
 * "pacs008", "acmt023", "pacs028"). Returns the raw response
 * body (used directly by pacs.028's synchronous status query;
 * ignored by pacs.008/acmt.023 sends, which wait on the
 * callback correlator instead).
 */
const send = async (messageType, xmlBody) => {

    if (!config.isConfigured()) {

        throw new ApiError({
            statusCode: 503,
            message: "NIBSS is not configured.",
            errorCode: "SYS-NIBSS-5030"
        });

    }

    try {

        const { data } = await client.post(

            `${config.baseUrl}/${messageType}`,

            xmlBody

        );

        return data;

    } catch (error) {

        if (error.response) {

            throw new ApiError({
                statusCode: 502,
                message: "NIBSS returned an unexpected error.",
                errorCode: "SYS-NIBSS-5020"
            });

        }

        throw new ApiError({
            statusCode: 503,
            message: "NIBSS is unreachable.",
            errorCode: "SYS-NIBSS-5030"
        });

    }

};

module.exports = {
    send
};
