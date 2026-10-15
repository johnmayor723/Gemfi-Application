const { XMLParser } = require("fast-xml-parser");

/**
 * ==========================================================
 * pacs.002 Parser
 * ==========================================================
 *
 * Parses the FIToFIPaymentStatusReport NIBSS sends back for
 * both a pacs.008 payment and a pacs.028 status query (NPS
 * guide §3.2/§3.3) — shared by both builders rather than
 * duplicated in each.
 *
 * TxSts values mapped below (AUTH, NAUTH, RJCT, ACSP) are the
 * ones the guide's own sequence diagrams name directly.
 * NIBSS's technical spec, not yet shared, may use different
 * literal codes — STATUS_MAP is the single place to reconcile
 * that once it's known.
 */

const parser = new XMLParser({

    ignoreAttributes: false,

    trimValues: true

});

const STATUS_MAP = {

    ACSP: "SUCCESSFUL",

    AUTH: "SUCCESSFUL",

    NAUTH: "FAILED",

    RJCT: "FAILED"

};

const parsePaymentStatus = (xml) => {

    const parsed = parser.parse(xml);

    const report = parsed?.Document?.FIToFIPmtStsRpt || {};

    const txInfo = report?.TxInfAndSts || {};

    const rawStatus =
        txInfo?.TxSts ||
        report?.GrpHdr?.GrpSts ||
        null;

    const reasonInfo = txInfo?.StsRsnInf?.Rsn || {};

    return {

        messageId:
            report?.GrpHdr?.MsgId || null,

        originalMessageId:
            txInfo?.OrgnlInstrId ||
            txInfo?.OrgnlGrpInf?.OrgnlMsgId ||
            null,

        originalTransactionId:
            txInfo?.OrgnlTxId || null,

        originalEndToEndId:
            txInfo?.OrgnlEndToEndId || null,

        rawStatus,

        status:
            STATUS_MAP[rawStatus] || "UNKNOWN",

        reasonCode:
            reasonInfo?.Cd || reasonInfo?.Prtry || null,

        raw: parsed

    };

};

module.exports = {
    parsePaymentStatus,
    STATUS_MAP
};
