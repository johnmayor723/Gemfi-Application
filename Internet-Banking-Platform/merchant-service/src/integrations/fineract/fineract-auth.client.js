/**
 * ==========================================================
 * Fineract Auth Client
 * ----------------------------------------------------------
 * Verifies admin credentials against Fineract's own
 * /authentication endpoint. No credentials are trusted or
 * stored locally - Fineract is the source of truth. Separate
 * from fineract.client.js, which uses a static Basic-Auth
 * service account for every other Fineract call.
 * ==========================================================
 */

const https = require("node:https");

const { app: config } = require("../../config");

const { AuthenticationError } = require("../../errors");

exports.authenticate = (username, password) => {

    return new Promise((resolve, reject) => {

        let target;

        try {

            target = new URL(`${config.fineract.url}/authentication`);

        } catch {

            return reject(
                new AuthenticationError(
                    "Fineract is not configured correctly."
                )
            );

        }

        const body =
            JSON.stringify({ username, password });

        const req = https.request(

            {

                hostname: target.hostname,

                port: target.port || 443,

                path: `${target.pathname}${target.search}`,

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Content-Length":
                        Buffer.byteLength(body),

                    "Fineract-Platform-TenantId":
                        config.fineract.tenant

                },

                rejectUnauthorized:
                    config.fineract.rejectUnauthorized

            },

            (res) => {

                let raw = "";

                res.on("data", (chunk) => {
                    raw += chunk;
                });

                res.on("end", () => {

                    let parsed;

                    try {

                        parsed = JSON.parse(raw);

                    } catch {

                        return reject(
                            new AuthenticationError(
                                "Unexpected response from Fineract."
                            )
                        );

                    }

                    if (
                        res.statusCode >= 200 &&
                        res.statusCode < 300 &&
                        parsed.authenticated
                    ) {

                        return resolve(parsed);

                    }

                    return reject(
                        new AuthenticationError(
                            parsed.defaultUserMessage ||
                            parsed.developerMessage ||
                            "Invalid Fineract credentials."
                        )
                    );

                });

            }

        );

        req.on("error", () => {

            reject(
                new AuthenticationError(
                    "Unable to reach Fineract."
                )
            );

        });

        req.write(body);

        req.end();

    });

};
