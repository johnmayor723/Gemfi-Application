/**
 * ==========================================================
 * Credit Provider Interface
 * ----------------------------------------------------------
 * Every credit bureau provider must implement this
 * interface.
 *
 * Providers:
 *  - Dummy
 *  - CRC Credit Bureau
 *  - FirstCentral
 *  - CreditRegistry
 *
 * Each provider MUST return the same normalized response.
 * ==========================================================
 */

class CreditProvider {

    /**
     * Run a credit check.
     *
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async check(payload) {

        throw new Error(
            "check() must be implemented by the provider."
        );

    }

}

module.exports = CreditProvider;
