const crypto = require("crypto");

const config = require("./nibss.config");

/**
 * ==========================================================
 * NIBSS Message Identifiers
 * ==========================================================
 *
 * Generates the MsgId, TxId, and EndToEndId every outward
 * acmt.023 / pacs.008 needs. Reusing any one of the three
 * across a retried transaction is an explicit settlement-
 * dispute liability under the NPS guide (§14c), so every call
 * returns a fresh triple — a retry must always call this again,
 * never reuse a previous result.
 *
 * ISO 20022 identifiers are Max35Text — truncated defensively
 * even though none of these compositions should ever exceed it.
 */

const MAX_ID_LENGTH = 35;

const randomSuffix = () =>
    crypto.randomBytes(5).toString("hex").toUpperCase();

const prefix = () =>
    (config.institutionCode || "NPS").slice(0, 8);

const generateMessageId = () =>
    `MSG${prefix()}${Date.now()}${randomSuffix()}`.slice(0, MAX_ID_LENGTH);

const generateTransactionId = () =>
    `TXN${prefix()}${Date.now()}${randomSuffix()}`.slice(0, MAX_ID_LENGTH);

const generateEndToEndId = (reference) => {

    const id = reference
        ? `E2E${reference}`
        : `E2E${Date.now()}${randomSuffix()}`;

    return id.slice(0, MAX_ID_LENGTH);

};

/**
 * The usual entry point — one call, one fresh triple, scoped to
 * a single outward message attempt.
 */
const generateIdentifiers = (reference) => ({

    messageId: generateMessageId(),

    transactionId: generateTransactionId(),

    endToEndId: generateEndToEndId(reference)

});

module.exports = {
    generateMessageId,
    generateTransactionId,
    generateEndToEndId,
    generateIdentifiers
};
