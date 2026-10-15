const { XMLBuilder } = require("fast-xml-parser");

/**
 * ==========================================================
 * pacs.028 Builder
 * ==========================================================
 *
 * Builds a payment status request — used to reconcile an
 * outward pacs.008 whose result is uncertain (timeout, late
 * response) before finalizing a reversal (NPS guide §3.3). Per
 * the guide this is a query only, never itself a source of
 * payment finality (§10).
 *
 * The response is parsed by message-builder/pacs002.parser.js,
 * shared with pacs.008.
 */

const builder = new XMLBuilder({

    ignoreAttributes: false,

    format: false,

    suppressEmptyNode: true

});

const buildStatusRequest = ({

    messageId,

    creationDateTime,

    originalMessageId,

    originalEndToEndId,

    originalTransactionId,

    originalCreationDateTime,

    originalMessageNameId = "pacs.008.001.08",

    originatorInstitutionCode,

    destinationInstitutionCode

}) => {

    const txInf = {

        OrgnlGrpInf: {
            OrgnlMsgId: originalMessageId,
            OrgnlMsgNmId: originalMessageNameId
        },

        OrgnlInstrId: originalMessageId,

        OrgnlEndToEndId: originalEndToEndId,

        OrgnlTxId: originalTransactionId

    };

    if (originalCreationDateTime) {

        txInf.OrgnlCreDtTm = originalCreationDateTime;

    }

    const doc = {

        Document: {

            "@_xmlns": "urn:iso:std:iso:20022:tech:xsd:pacs.028.001.03",

            FIToFIPmtStsReq: {

                GrpHdr: {

                    MsgId: messageId,

                    CreDtTm: creationDateTime || new Date().toISOString(),

                    InstgAgt: {
                        FinInstnId: {
                            ClrSysMmbId: {
                                MmbId: originatorInstitutionCode
                            }
                        }
                    },

                    InstdAgt: {
                        FinInstnId: {
                            ClrSysMmbId: {
                                MmbId: destinationInstitutionCode
                            }
                        }
                    }

                },

                TxInf: txInf

            }

        }

    };

    return builder.build(doc);

};

module.exports = {
    buildStatusRequest
};
