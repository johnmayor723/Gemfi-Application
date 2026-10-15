const config = require("./nibss.config");

const client = require("./nibss.client");

const correlator = require("./callback-correlator");

const idGenerator = require("./message-id.generator");

const bankCodes = require("./bank-codes");

const acmt023Builder = require("./message-builder/acmt023.builder");

const pacs008Builder = require("./message-builder/pacs008.builder");

const pacs028Builder = require("./message-builder/pacs028.builder");

const pacs002Parser = require("./message-builder/pacs002.parser");

const { logger } = require("../../config");

const { ApiError } = require("../../errors");

/**
 * ==========================================================
 * Live NIBSS NPS Adapter
 * ==========================================================
 *
 * Implements the real outward flow against the NPS Operations
 * Guide: acmt.023 name enquiry (§3.1), pacs.008 payment (§3.2),
 * pacs.028 status query (§3.3). Same provider-swap shape as
 * dummy.adapter.js — selected via index.js when
 * NIBSS_PROVIDER=live — so nothing calling this needs to know
 * which one is active.
 *
 * Every call here is network-inert until nibss.config.js has a
 * baseUrl and institutionCode (NIBSS hasn't shared those yet —
 * still in the discovery stage). nibss.client.js throws a clear
 * 503 rather than attempting a request against a null baseURL.
 */

const warnIfUnknownBankCode = (code) => {

    if (bankCodes.size() > 0 && !bankCodes.isKnownCode(code)) {

        logger.warn(
            { destinationBankCode: code },
            "Destination bank code not found in the NIBSS institution directory."
        );

    }

};

class LiveNibssAdapter {

    /**
     * acmt.023 — confirms the beneficiary's name before any
     * value moves (§9.1.1.ii: mandatory, sending institution is
     * liable for a misdirected transfer where this is skipped).
     */
    async nameEnquiry({ destinationBankCode, destinationAccountNumber }) {

        warnIfUnknownBankCode(destinationBankCode);

        const { messageId } = idGenerator.generateIdentifiers();

        const xml = acmt023Builder.buildNameEnquiryRequest({

            messageId,

            originatorInstitutionCode: config.institutionCode,

            destinationInstitutionCode: destinationBankCode,

            destinationAccountNumber

        });

        await client.send("acmt023", xml);

        const callback =
            await correlator.waitFor(messageId, config.nameEnquiryTimeoutMs);

        if (!callback) {

            throw new ApiError({
                statusCode: 504,
                message: "NIBSS name enquiry timed out.",
                errorCode: "SYS-NIBSS-5040"
            });

        }

        return {

            accountName: callback.accountName,

            accountStatus: callback.accountStatus,

            provider: "NIBSS"

        };

    }

    /**
     * pacs.008 — the payment itself (§3.2). Resolves to a
     * TIMEOUT status rather than throwing when the beneficiary
     * side doesn't answer in time, so executeMovement() can run
     * its own exception-handling path (§11) — including a
     * pacs.028 reconciliation check — instead of treating a slow
     * NIBSS as an application error.
     */
    async initiateNip({

        sourceAccountNumber,

        destinationBankCode,

        destinationAccountNumber,

        amount,

        narration

    }) {

        warnIfUnknownBankCode(destinationBankCode);

        const { messageId, transactionId, endToEndId } =
            idGenerator.generateIdentifiers();

        const xml = pacs008Builder.buildPaymentRequest({

            messageId,

            transactionId,

            endToEndId,

            amount,

            originatorInstitutionCode: config.institutionCode,

            sourceAccountNumber,

            destinationInstitutionCode: destinationBankCode,

            destinationAccountNumber,

            narration

        });

        await client.send("pacs008", xml);

        const callback =
            await correlator.waitFor(transactionId, config.paymentTimeoutMs);

        if (!callback) {

            return {

                sessionId: messageId,

                status: "TIMEOUT",

                reference: transactionId,

                messageId,

                transactionId,

                endToEndId,

                provider: "NIBSS"

            };

        }

        return {

            sessionId: messageId,

            status: callback.status,

            reference: transactionId,

            messageId,

            transactionId,

            endToEndId,

            reasonCode: callback.reasonCode,

            provider: "NIBSS"

        };

    }

    /**
     * pacs.028 — status query (§3.3), a synchronous request/
     * response unlike acmt.023/pacs.008. Used to reconcile a
     * TIMEOUT or uncertain result before a reversal is finalized
     * (§10: finality is defined by receipt of pacs.002, not by
     * our own local timeout).
     */
    async getPaymentStatus({

        messageId,

        transactionId,

        endToEndId,

        destinationBankCode

    }) {

        const { messageId: queryMessageId } =
            idGenerator.generateIdentifiers();

        const xml = pacs028Builder.buildStatusRequest({

            messageId: queryMessageId,

            originalMessageId: messageId,

            originalEndToEndId: endToEndId,

            originalTransactionId: transactionId,

            originatorInstitutionCode: config.institutionCode,

            destinationInstitutionCode: destinationBankCode

        });

        const responseXml = await client.send("pacs028", xml);

        const parsed = pacs002Parser.parsePaymentStatus(responseXml);

        return {

            status: parsed.status,

            reasonCode: parsed.reasonCode,

            provider: "NIBSS"

        };

    }

}

module.exports = new LiveNibssAdapter();
