const { XMLBuilder } = require("fast-xml-parser");

/**
 * ==========================================================
 * pacs.008 Builder
 * ==========================================================
 *
 * Builds the outward Customer Credit Transfer payment request
 * (NPS guide §3.2). Field names follow the public ISO 20022
 * pacs.008.001 message definition; NIBSS's technical spec, not
 * yet shared, may require namespace or version adjustments.
 *
 * The matching pacs.002 response is parsed by
 * message-builder/pacs002.parser.js, shared with pacs.028.
 */

const builder = new XMLBuilder({

    ignoreAttributes: false,

    format: false,

    suppressEmptyNode: true

});

const buildPaymentRequest = ({

    messageId,

    transactionId,

    endToEndId,

    creationDateTime,

    amount,

    currency = "NGN",

    originatorInstitutionCode,

    sourceAccountNumber,

    debtorName,

    destinationInstitutionCode,

    destinationAccountNumber,

    creditorName,

    narration

}) => {

    const cdtTrfTxInf = {

        PmtId: {
            InstrId: messageId,
            EndToEndId: endToEndId,
            TxId: transactionId
        },

        IntrBkSttlmAmt: {
            "@_Ccy": currency,
            "#text": amount
        },

        DbtrAcct: {
            Id: {
                Othr: {
                    Id: sourceAccountNumber
                }
            }
        },

        DbtrAgt: {
            FinInstnId: {
                ClrSysMmbId: {
                    MmbId: originatorInstitutionCode
                }
            }
        },

        CdtrAgt: {
            FinInstnId: {
                ClrSysMmbId: {
                    MmbId: destinationInstitutionCode
                }
            }
        },

        CdtrAcct: {
            Id: {
                Othr: {
                    Id: destinationAccountNumber
                }
            }
        }

    };

    if (debtorName) {

        cdtTrfTxInf.Dbtr = { Nm: debtorName };

    }

    if (creditorName) {

        cdtTrfTxInf.Cdtr = { Nm: creditorName };

    }

    if (narration) {

        cdtTrfTxInf.RmtInf = { Ustrd: narration };

    }

    const doc = {

        Document: {

            "@_xmlns": "urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08",

            FIToFICstmrCdtTrf: {

                GrpHdr: {
                    MsgId: messageId,
                    CreDtTm: creationDateTime || new Date().toISOString(),
                    NbOfTxs: 1,
                    SttlmInf: {
                        SttlmMtd: "CLRG"
                    }
                },

                CdtTrfTxInf: cdtTrfTxInf

            }

        }

    };

    return builder.build(doc);

};

module.exports = {
    buildPaymentRequest
};
