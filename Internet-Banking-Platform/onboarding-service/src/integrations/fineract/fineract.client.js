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

class FineractClient {

    /**
     * A freshly-provisioned tenant's schema is empty until the
     * first authenticated request carrying its header runs
     * Liquibase migration. This is that first request - any
     * cheap authenticated GET would do, /offices is Fineract's
     * own example in the onboarding script.
     */
    async warmUp(tenantIdentifier) {

        const { data } = await client.get(

            "/offices",

            {

                headers: tenantHeaders(tenantIdentifier),

                params: { tenantIdentifier }

            }

        );

        return data;

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

}

module.exports = new FineractClient();
