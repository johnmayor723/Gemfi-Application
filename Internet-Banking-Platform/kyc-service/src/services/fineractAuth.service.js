/**
 * ==========================================================
 * Fineract Auth Service
 * ----------------------------------------------------------
 * Verifies admin credentials against the real Fineract
 * /authentication endpoint. No credentials are trusted or
 * stored locally - Fineract is the source of truth.
 * ==========================================================
 */

const https = require("node:https");

const env = require("../config/env");

/**
 * ==========================================================
 * Authenticate With Fineract
 * ==========================================================
 */
exports.authenticateWithFineract = (username, password) => {

    return new Promise((resolve, reject) => {

        let target;

        try {

            target = new URL(`${env.fineract.url}/authentication`);

        } catch {

            return reject(
                new Error("Fineract is not configured correctly.")
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
                        env.fineract.tenant

                },

                rejectUnauthorized:
                    env.fineract.rejectUnauthorized

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
                            new Error(
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
                        new Error(
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
                new Error("Unable to reach Fineract.")
            );

        });

        req.write(body);

        req.end();

    });

};
