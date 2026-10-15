/**
 * ==========================================================
 * NIBSS NPS Configuration
 * ==========================================================
 *
 * Same pattern as the rest of the service's app.config.js —
 * env vars with sane defaults, nothing required. NIBSS_PROVIDER
 * defaults to "dummy" so an unconfigured environment behaves
 * exactly as it does today until real values are set.
 *
 * Per-tenant deployments (GemFi) use this unchanged — each
 * tenant's transaction-service instance sets its own NIBSS_*
 * env vars, the same way it already sets its own FINERACT_TENANT.
 */

const config = {

    provider: process.env.NIBSS_PROVIDER || "dummy",

    institutionCode: process.env.NIBSS_INSTITUTION_CODE || null,

    institutionName: process.env.NIBSS_INSTITUTION_NAME || null,

    /**
     * Where we send outward acmt.023 / pacs.008 / pacs.028
     * requests to. Not yet provided by NIBSS (still in the
     * discovery stage) — stays null until it is.
     */
    baseUrl: process.env.NIBSS_BASE_URL || null,

    /**
     * Our own public base URL — the {{BASE_URL}} NIBSS's
     * callback routes (/pacs002, /acmt024, etc.) are registered
     * against. Used only for logging/diagnostics here; the
     * routes themselves are mounted regardless of this value.
     */
    callbackBaseUrl: process.env.NIBSS_CALLBACK_BASE_URL || null,

    /**
     * Guide §3.1/§3.2: NPS's own beneficiary-side timeout is
     * 20s for acmt.023 and 10s for pacs.008, but the sending
     * institution sets its own overall timeout at 20s for both.
     * We time out at these values and fall back to a pacs.028
     * status query rather than assuming failure outright.
     */
    nameEnquiryTimeoutMs: Number(process.env.NIBSS_NAME_ENQUIRY_TIMEOUT_MS || 20000),

    paymentTimeoutMs: Number(process.env.NIBSS_PAYMENT_TIMEOUT_MS || 20000),

    statusQueryTimeoutMs: Number(process.env.NIBSS_STATUS_QUERY_TIMEOUT_MS || 15000),

    credentials: {

        apiKey: process.env.NIBSS_API_KEY || null,

        certPath: process.env.NIBSS_CERT_PATH || null,

        certPassphrase: process.env.NIBSS_CERT_PASSPHRASE || null

    },

    /**
     * The live adapter refuses to make a network call when this
     * is false, rather than failing confusingly deep inside an
     * axios request against a null baseURL.
     */
    isConfigured() {

        return Boolean(
            this.baseUrl && this.institutionCode
        );

    }

};

module.exports = config;
