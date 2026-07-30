/**
 * ==========================================================
 * Tenant Provisioner
 * ----------------------------------------------------------
 * Registers a new Fineract tenant on the shared gemfi-fineract
 * instance by invoking scripts/onboard-tenant.sh directly,
 * rather than reimplementing its logic here. That script
 * already encodes 5 real, hard-won fixes (Postgres 18's data
 * volume convention, docker exec -i for heredoc stdin,
 * Fineract's own password-encryption CLI rather than a
 * reimplemented AES scheme, the correct master-password env
 * var, and the fact that a newly-added tenant isn't usable
 * until the container restarts) - reusing it keeps that
 * knowledge in one place instead of forking it.
 * ==========================================================
 */

const { execFile } = require("node:child_process");
const path = require("node:path");

const SCRIPT_PATH =
    "/opt/gemfi-applications/gemfi-fineract/scripts/onboard-tenant.sh";

/**
 * Fineract tenant identifiers only accept lowercase letters,
 * digits, and underscores, starting with a letter - the same
 * rule the script itself enforces. Checked here too so a bad
 * identifier fails with a clear API error instead of a raw
 * shell/script failure.
 */
const IDENTIFIER_PATTERN = /^[a-z][a-z0-9_]*$/;

exports.isValidIdentifier = (identifier) => IDENTIFIER_PATTERN.test(identifier);

/**
 * Runs onboard-tenant.sh, which:
 *  - creates the tenant's Postgres schema
 *  - registers it in tenant_server_connections + tenants
 *  - restarts the gemfi-fineract container (briefly interrupts
 *    every other tenant already on the instance - accepted
 *    tradeoff, not solved here)
 *  - waits for the container to report healthy again
 *
 * The schema itself stays empty until the first authenticated
 * request carrying this tenant's header runs Liquibase
 * migration - callers must make that warm-up call themselves
 * before doing anything else with the new tenant.
 */
exports.provisionTenant = (identifier, displayName) => {

    return new Promise((resolve, reject) => {

        execFile(

            "bash",

            [SCRIPT_PATH, identifier, displayName],

            {

                cwd: path.dirname(SCRIPT_PATH),

                timeout: 4 * 60 * 1000,

                maxBuffer: 10 * 1024 * 1024

            },

            (error, stdout, stderr) => {

                if (error) {

                    const message =
                        error.killed
                            ? "Tenant provisioning timed out."
                            : `Tenant provisioning failed: ${error.message}`;

                    const wrapped = new Error(message);

                    wrapped.stdout = stdout;
                    wrapped.stderr = stderr;

                    return reject(wrapped);

                }

                resolve({ stdout, stderr });

            }

        );

    });

};
