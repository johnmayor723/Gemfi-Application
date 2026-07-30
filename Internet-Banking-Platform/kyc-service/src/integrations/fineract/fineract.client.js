/**
 * ==========================================================
 * Fineract Client
 * ----------------------------------------------------------
 * Low-level HTTP access to Fineract, used to sync KYC
 * artifacts (photo, signature, documents, address proof,
 * reference letters) onto the client's Fineract record.
 *
 * Uses Node's built-in https module (same pattern as
 * fineractAuth.service.js) rather than axios/form-data,
 * since neither is a kyc-service dependency.
 * ==========================================================
 */

const https = require("node:https");
const crypto = require("node:crypto");

const env = require("../../config/env");

/**
 * ==========================================================
 * Build A Multipart/Form-Data Body
 * ----------------------------------------------------------
 * @param {Object} fields - plain text fields (name, description)
 * @param {Object} filePart - { filename, mimeType, buffer }
 * @returns {{ body: Buffer, contentType: String }}
 * ==========================================================
 */
function buildMultipartBody(fields, filePart) {

    const boundary =
        `----kycServiceFineractSync${crypto.randomBytes(16).toString("hex")}`;

    const chunks = [];

    for (const [key, value] of Object.entries(fields)) {

        if (value === undefined || value === null) {

            continue;

        }

        chunks.push(Buffer.from(

            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
            `${value}\r\n`

        ));

    }

    chunks.push(Buffer.from(

        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${filePart.filename}"\r\n` +
        `Content-Type: ${filePart.mimeType}\r\n\r\n`

    ));

    chunks.push(filePart.buffer);

    chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    return {

        body: Buffer.concat(chunks),

        contentType: `multipart/form-data; boundary=${boundary}`

    };

}

/**
 * ==========================================================
 * Raw Request
 * ==========================================================
 */
function request(method, path, { headers = {}, body } = {}) {

    return new Promise((resolve, reject) => {

        let target;

        try {

            target = new URL(`${env.fineract.url}${path}`);

        } catch {

            return reject(
                new Error("Fineract is not configured correctly.")
            );

        }

        const req = https.request(

            {

                hostname: target.hostname,

                port: target.port || 443,

                path: `${target.pathname}${target.search}`,

                method,

                headers: {

                    Authorization:
                        `Basic ${env.fineract.basicAuth}`,

                    "Fineract-Platform-TenantId":
                        env.fineract.tenant,

                    ...headers

                },

                rejectUnauthorized:
                    env.fineract.rejectUnauthorized

            },

            (res) => {

                const chunks = [];

                res.on("data", (chunk) => {

                    chunks.push(chunk);

                });

                res.on("end", () => {

                    const raw =
                        Buffer.concat(chunks).toString("utf8");

                    let parsed;

                    try {

                        parsed = raw ? JSON.parse(raw) : {};

                    } catch {

                        parsed = { raw };

                    }

                    if (
                        res.statusCode >= 200 &&
                        res.statusCode < 300
                    ) {

                        return resolve(parsed);

                    }

                    const message =
                        parsed?.defaultUserMessage ||
                        parsed?.developerMessage ||
                        parsed?.error ||
                        `Fineract request failed with status ${res.statusCode}.`;

                    const error = new Error(message);

                    error.status = res.statusCode;

                    error.body = parsed;

                    return reject(error);

                });

            }

        );

        req.on("error", (err) => {

            reject(
                new Error(`Unable to reach Fineract: ${err.message}`)
            );

        });

        if (body) {

            req.write(body);

        }

        req.end();

    });

}

class FineractClient {

    /**
     * Set the client's single photograph slot.
     *
     * PUT /clients/{clientId}/images
     */
    async uploadClientImage(clientId, filePart) {

        const { body, contentType } =
            buildMultipartBody({}, filePart);

        return request(

            "PUT",

            `/clients/${clientId}/images?tenantIdentifier=${env.fineract.tenant}`,

            {

                headers: {

                    "Content-Type": contentType,

                    "Content-Length": body.length

                },

                body

            }

        );

    }

    /**
     * Upload a generic named document (signature, ID scan,
     * proof of address, reference letter).
     *
     * POST /clients/{clientId}/documents
     */
    async uploadClientDocument(clientId, filePart, { name, description }) {

        const { body, contentType } =
            buildMultipartBody({ name, description }, filePart);

        return request(

            "POST",

            `/clients/${clientId}/documents?tenantIdentifier=${env.fineract.tenant}`,

            {

                headers: {

                    "Content-Type": contentType,

                    "Content-Length": body.length

                },

                body

            }

        );

    }

    /**
     * List every document Fineract holds for this client.
     * Used for reconciliation.
     *
     * GET /clients/{clientId}/documents
     */
    async getClientDocuments(clientId) {

        return request(

            "GET",

            `/clients/${clientId}/documents?tenantIdentifier=${env.fineract.tenant}`

        );

    }

    /**
     * Fetch the client resource itself. `imagePresent` tells
     * us whether the photo slot is actually set on Fineract's
     * side, used for reconciliation.
     *
     * GET /clients/{clientId}
     */
    async getClient(clientId) {

        return request(

            "GET",

            `/clients/${clientId}?tenantIdentifier=${env.fineract.tenant}`

        );

    }

}

module.exports = new FineractClient();
