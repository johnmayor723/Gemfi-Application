const axios = require("axios");
const https = require("https");

const app = require("../src/config/app.config");

/**
 * One-time setup script.
 *
 * Registers the client_account_identifiers Data Table against
 * Fineract's m_client entity via Fineract's own Data Tables
 * API. This is the upgrade-safe, officially supported way to
 * attach custom fields to a core Fineract entity without
 * touching m_client or any other core table directly.
 *
 * Idempotent: if the datatable is already registered, this
 * exits without making any change.
 *
 * Usage:
 *   node scripts/register-account-identifiers-datatable.js
 *
 * Run this once, against each Fineract environment (sandbox,
 * staging, production) before account-service starts calling
 * FineractAdapter#setClientAccountIdentifiers.
 */

const DATATABLE_NAME = "client_account_identifiers";

const client = axios.create({

    baseURL: app.fineract.url,

    timeout: 30000,

    httpsAgent: new https.Agent({
        rejectUnauthorized: app.fineract.rejectUnauthorized
    }),

    headers: {
        Authorization: `Basic ${app.fineract.basicAuth}`,
        Accept: "application/json",
        "Content-Type": "application/json"
    }

});

async function datatableExists() {

    const response = await client.get(
        `/datatables?tenantIdentifier=${app.fineract.tenant}`
    );

    return response.data.some(
        (datatable) => datatable.registeredTableName === DATATABLE_NAME
    );

}

async function registerDatatable() {

    const alreadyExists = await datatableExists();

    if (alreadyExists) {

        console.log(
            `Datatable "${DATATABLE_NAME}" is already registered - nothing to do.`
        );

        return;

    }

    const payload = {

        apptableName: "m_client",

        datatableName: DATATABLE_NAME,

        entitySubType: "PERSON",

        multiRow: false,

        columns: [

            {
                name: "accountNumber",
                type: "String",
                length: 10,
                mandatory: true,
                unique: true,
                indexed: true
            },

            {
                name: "nuban",
                type: "String",
                length: 10,
                mandatory: true,
                unique: true,
                indexed: true
            }

        ]

    };

    await client.post(
        `/datatables?tenantIdentifier=${app.fineract.tenant}`,
        payload
    );

    console.log(
        `Datatable "${DATATABLE_NAME}" registered against m_client.`
    );

}

registerDatatable()
    .then(() => process.exit(0))
    .catch((error) => {

        console.error("Failed to register the account identifiers datatable.");

        if (error.response) {

            console.error("Status :", error.response.status);
            console.error("Body :", JSON.stringify(error.response.data, null, 4));

        } else {

            console.error(error.message);

        }

        process.exit(1);

    });
