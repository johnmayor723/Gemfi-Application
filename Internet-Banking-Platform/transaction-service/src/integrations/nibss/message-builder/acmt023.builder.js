const { XMLBuilder, XMLParser } = require("fast-xml-parser");

/**
 * ==========================================================
 * acmt.023 / acmt.024 Builder
 * ==========================================================
 *
 * Builds the outward name-enquiry request and parses the
 * matching response (NPS guide §3.1). Field names follow the
 * public ISO 20022 acmt.023.001 / acmt.024.001 message
 * definitions; NIBSS's technical spec, not yet shared, may
 * require namespace or version adjustments.
 */

const builder = new XMLBuilder({

    ignoreAttributes: false,

    format: false,

    suppressEmptyNode: true

});

const parser = new XMLParser({

    ignoreAttributes: false,

    trimValues: true

});

const buildNameEnquiryRequest = ({

    messageId,

    creationDateTime,

    originatorInstitutionCode,

    destinationInstitutionCode,

    destinationAccountNumber

}) => {

    const doc = {

        Document: {

            "@_xmlns": "urn:iso:std:iso:20022:tech:xsd:acmt.023.001.03",

            IdVrfctnReq: {

                GrpHdr: {

                    MsgId: messageId,

                    CreDtTm: creationDateTime || new Date().toISOString()

                },

                Vrfctn: {

                    Assgnmt: {

                        Assgnr: {
                            Agt: {
                                FinInstnId: {
                                    ClrSysMmbId: {
                                        MmbId: originatorInstitutionCode
                                    }
                                }
                            }
                        },

                        Assgne: {
                            Agt: {
                                FinInstnId: {
                                    ClrSysMmbId: {
                                        MmbId: destinationInstitutionCode
                                    }
                                }
                            }
                        }

                    },

                    Idntfctn: {

                        Agt: {
                            FinInstnId: {
                                ClrSysMmbId: {
                                    MmbId: destinationInstitutionCode
                                }
                            }
                        },

                        Acct: {
                            Id: {
                                Othr: {
                                    Id: destinationAccountNumber
                                }
                            }
                        }

                    }

                }

            }

        }

    };

    return builder.build(doc);

};

/**
 * Parses an acmt.024 identification-verification report —
 * NIBSS's response to our acmt.023 request.
 */
const parseNameEnquiryResponse = (xml) => {

    const parsed = parser.parse(xml);

    const report = parsed?.Document?.IdVrfctnRpt;

    if (!report) {

        return {

            messageId: null,

            accountName: null,

            accountStatus: null,

            raw: parsed

        };

    }

    const confirmation = report?.Vrfctn?.Conf || {};

    return {

        messageId:
            report?.GrpHdr?.MsgId || null,

        /**
         * Correlates this response back to our outward request.
         * NIBSS's exact acmt.024 field for "the MsgId we sent"
         * isn't confirmed yet — this checks the likely candidate
         * field names, falling back to assuming NIBSS echoes our
         * original MsgId back as its own GrpHdr.MsgId.
         */
        correlationId:
            report?.OrgnlId ||
            report?.RltdRef?.MsgId ||
            report?.GrpHdr?.MsgId ||
            null,

        accountName:
            confirmation?.Nm || null,

        accountStatus:
            confirmation?.Sts || null,

        raw: parsed

    };

};

module.exports = {
    buildNameEnquiryRequest,
    parseNameEnquiryResponse
};
