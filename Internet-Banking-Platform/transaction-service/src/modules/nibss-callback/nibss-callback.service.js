const correlator = require("../../integrations/nibss/callback-correlator");

const pacs002Parser = require("../../integrations/nibss/message-builder/pacs002.parser");

const acmt023Builder = require("../../integrations/nibss/message-builder/acmt023.builder");

const { logger } = require("../../config");

/**
 * ==========================================================
 * NIBSS Callback Handling
 * ==========================================================
 *
 * NIBSS answers our outward acmt.023/pacs.008 asynchronously —
 * as a separate POST to our own /acmt024 or /pacs002 — rather
 * than in the HTTP response to our send (NPS guide §3.1/§3.2).
 * These handlers parse that POST and resolve the matching
 * live.adapter.js call waiting on ./callback-correlator.js.
 *
 * This service's transaction-service has no audit-log module
 * (unlike AZSA's) — logged via the structured service logger
 * instead.
 */
class NibssCallbackService {

    /**
     * /pacs002 — response to an outward pacs.008. Matched by the
     * original TxId. A "no matching pending request" result is
     * expected and not an error — it's either a late response
     * arriving after our own timeout already resolved the
     * transfer (guide §3.2.C), or an out-of-band status NIBSS
     * sent us unprompted.
     */
    async handlePacs002(xmlBody) {

        const parsed = pacs002Parser.parsePaymentStatus(xmlBody);

        const matched =
            correlator.resolveCallback(
                parsed.originalTransactionId,
                parsed
            );

        logger.info(
            {
                originalTransactionId: parsed.originalTransactionId,
                matched,
                status: parsed.status,
                rawStatus: parsed.rawStatus,
                reasonCode: parsed.reasonCode
            },
            "Received a pacs.002 callback from NIBSS."
        );

        if (!matched) {

            logger.warn(
                {
                    originalTransactionId: parsed.originalTransactionId,
                    status: parsed.status
                },
                "Received a pacs.002 callback with no matching pending request."
            );

        }

        return { matched };

    }

    /**
     * /acmt024 — response to an outward acmt.023 name enquiry.
     */
    async handleAcmt024(xmlBody) {

        const parsed = acmt023Builder.parseNameEnquiryResponse(xmlBody);

        const key = parsed.correlationId || parsed.messageId;

        const matched =
            correlator.resolveCallback(key, parsed);

        logger.info(
            {
                correlationId: key,
                matched,
                accountStatus: parsed.accountStatus
            },
            "Received an acmt.024 callback from NIBSS."
        );

        if (!matched) {

            logger.warn(
                { correlationId: key },
                "Received an acmt.024 callback with no matching pending request."
            );

        }

        return { matched };

    }

    /**
     * Every other registered callback URL — inbound beneficiary-
     * side requests (pacs.008, acmt.023) and non-EFT message
     * types (direct-debit mandates, account reporting). Deferred
     * scope (NPS Rails Build Plan §9/§7). Acknowledged for
     * NIBSS's connectivity testing and logged, not processed.
     */
    async handleDeferred(messageType, xmlBody) {

        logger.info(
            {
                messageType,
                bodyLength: xmlBody ? xmlBody.length : 0
            },
            "Received a NIBSS callback for a message type outside the current build phase."
        );

    }

}

module.exports = new NibssCallbackService();
