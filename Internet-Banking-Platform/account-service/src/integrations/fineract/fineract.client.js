const axios = require("axios");
const https = require("https");

const app = require("../../config/app.config");

/**
 * Axios client
 */
const client = axios.create({

    baseURL: app.fineract.url,

    timeout: 30000,

    httpsAgent: new https.Agent({

        rejectUnauthorized: app.fineract.rejectUnauthorized

    }),

    headers: {

        /**
         * TEMPORARY
         * Hardcoded for integration testing.
         * Move to .env after verification.
         */
       Authorization: `Basic ${app.fineract.basicAuth}`,

        Accept: "application/json",

        "Content-Type": "application/json"

    }

});

/**
 * Request Logger
 */
client.interceptors.request.use((config) => {

    console.log("");
    console.log("========================================");
    console.log("FINERACT REQUEST");
    console.log("========================================");
    console.log(`${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log("");

    return config;

});

/**
 * Response Logger
 */
client.interceptors.response.use(

    (response) => {

        console.log("");
        console.log("========================================");
        console.log("FINERACT RESPONSE");
        console.log("========================================");
        console.log("Status :", response.status);
        console.log("");

        return response;

    },

    (error) => {

        console.log("");
        console.log("========================================");
        console.log("FINERACT ERROR");
        console.log("========================================");

        if (error.response) {

            console.log("Status :", error.response.status);
            console.log("Body :");
            console.log(JSON.stringify(error.response.data, null, 4));

        } else {

            console.log("Message :", error.message);
            console.log("Code :", error.code);

            if (error.cause) {

                console.log("Cause :", error.cause);

            }

        }

        console.log("");

        return Promise.reject(error);

    }

);

class FineractClient {

    /**
     * Get Savings Account
     */
   async getSavingsAccount(accountId) {

    const { data } = await client.get(
        `/savingsaccounts/${accountId}?tenantIdentifier=${app.fineract.tenant}`
    );

    return data;

}

async getClient(clientId) {

    const { data } = await client.get(
        `/clients/${clientId}?tenantIdentifier=${app.fineract.tenant}`
    );

    return data;

}

/**
 * Get Client Accounts
 *
 * Fineract's client-accounts-summary endpoint.
 * Returns { savingsAccounts, loanAccounts, ... }.
 */
async getClientAccounts(clientId) {

    const { data } = await client.get(
        `/clients/${clientId}/accounts?tenantIdentifier=${app.fineract.tenant}`
    );

    return data;

}

/**
 * Get Savings Account Transactions
 *
 * Fineract does not expose a standalone GET transactions
 * endpoint (that path only accepts POST for transaction
 * commands). Transaction history is embedded on the savings
 * account itself via the "transactions" association.
 */
async getSavingsTransactions(accountId) {

    const { data } = await client.get(
        `/savingsaccounts/${accountId}?associations=transactions&tenantIdentifier=${app.fineract.tenant}`
    );

    return data.transactions || [];

}

}

module.exports = new FineractClient();
