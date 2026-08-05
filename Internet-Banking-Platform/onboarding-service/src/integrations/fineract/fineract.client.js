/**
 * ==========================================================
 * Fineract Client
 * ----------------------------------------------------------
 * Unlike fineract-auth.client.js (login verification against
 * a fixed admin identity), every call here targets a specific
 * tenant identifier passed in per-call - this client is used
 * against tenants this service just created, not the
 * service's own configured default tenant.
 * ==========================================================
 */

const axios = require("axios");
const https = require("https");

const { app: config } = require("../../config");

const client = axios.create({

    baseURL: config.fineract.url,

    timeout: 30000,

    httpsAgent: new https.Agent({

        rejectUnauthorized: config.fineract.rejectUnauthorized

    }),

    headers: {

        Authorization: `Basic ${config.fineract.basicAuth}`,

        Accept: "application/json",

        "Content-Type": "application/json"

    }

});

function tenantHeaders(tenantIdentifier) {

    return {

        "Fineract-Platform-TenantId": tenantIdentifier

    };

}

/**
 * warmUp always runs moments after onboard-tenant.sh's docker restart, and
 * in practice Fineract's HTTPS listener is sometimes not actually ready to
 * accept TLS handshakes yet even though the container's own HEALTHCHECK
 * already reports healthy - reproduced 3 times in a row in testing, always
 * as either ECONNRESET or "socket disconnected before secure TLS connection
 * was established". Both are transient startup timing, not a real failure,
 * and onboarding.service.js's approve() already documents that Fineract-side
 * steps are safe to repeat - this just actually retries instead of failing
 * the whole approval on the very first authenticated call a fresh tenant
 * ever receives.
 */
const WARM_UP_MAX_ATTEMPTS = 5;
const WARM_UP_RETRY_DELAY_MS = 3000;

function isTransientConnectionError(error) {

    return (
        error.code === "ECONNRESET" ||
        error.code === "ECONNREFUSED" ||
        error.code === "EPIPE" ||
        /socket disconnected before secure TLS connection was established/.test(
            error.message || ""
        )
    );

}

function delay(ms) {

    return new Promise((resolve) => setTimeout(resolve, ms));

}

class FineractClient {

    /**
     * A freshly-provisioned tenant's schema is empty until the
     * first authenticated request carrying its header runs
     * Liquibase migration. This is that first request - any
     * cheap authenticated GET would do, /offices is Fineract's
     * own example in the onboarding script.
     */
    async warmUp(tenantIdentifier) {

        for (let attempt = 1; attempt <= WARM_UP_MAX_ATTEMPTS; attempt++) {

            try {

                const { data } = await client.get(

                    "/offices",

                    {

                        headers: tenantHeaders(tenantIdentifier),

                        params: { tenantIdentifier }

                    }

                );

                return data;

            } catch (error) {

                const isLastAttempt = attempt === WARM_UP_MAX_ATTEMPTS;

                if (!isTransientConnectionError(error) || isLastAttempt) {

                    throw error;

                }

                await delay(WARM_UP_RETRY_DELAY_MS);

            }

        }

    }

    /**
     * Create a GL account (header or detail).
     */
    async createGLAccount(tenantIdentifier, payload) {

        const { data } = await client.post(

            "/glaccounts",

            payload,

            {

                headers: tenantHeaders(tenantIdentifier),

                params: { tenantIdentifier }

            }

        );

        return data;

    }

    /**
     * Create a role.
     */
    async createRole(tenantIdentifier, payload) {

        const { data } = await client.post(

            "/roles",

            payload,

            {

                headers: tenantHeaders(tenantIdentifier),

                params: { tenantIdentifier }

            }

        );

        return data;

    }

    /**
     * List Fineract users for a tenant - backs the GemFi admin console's
     * remote user management for tenants that don't have self-service
     * Users/Roles in their own portal (see gemfi-mfb-portal's tier gate).
     */
    async listUsers(tenantIdentifier) {

        const { data } = await client.get(

            "/users",

            {

                headers: tenantHeaders(tenantIdentifier),

                params: { tenantIdentifier }

            }

        );

        return data;

    }

    /**
     * Create a Fineract user for a tenant.
     */
    async createUser(tenantIdentifier, payload) {

        const { data } = await client.post(

            "/users",

            payload,

            {

                headers: tenantHeaders(tenantIdentifier),

                params: { tenantIdentifier }

            }

        );

        return data;

    }

    /**
     * List Fineract roles for a tenant (for populating a role picker
     * alongside listUsers/createUser).
     */
    async listRoles(tenantIdentifier) {

        const { data } = await client.get(

            "/roles",

            {

                headers: tenantHeaders(tenantIdentifier),

                params: { tenantIdentifier }

            }

        );

        return data;

    }

    /**
     * Enable the given currency codes for the tenant. A fresh tenant only
     * has USD selected by default - every GemFi tenant needs NGN at
     * minimum, plus a handful of other major currencies, so this is a
     * required provisioning step, not optional configuration.
     */
    async enableCurrencies(tenantIdentifier, currencyCodes) {

        const { data } = await client.put(

            "/currencies",

            { currencies: currencyCodes },

            {

                headers: tenantHeaders(tenantIdentifier),

                params: { tenantIdentifier }

            }

        );

        return data;

    }

}

module.exports = new FineractClient();
