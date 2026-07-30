/**
 * ==========================================================
 * PEP Provider Interface
 * ----------------------------------------------------------
 * Every PEP screening provider must implement this
 * interface.
 *
 * Providers:
 *  - Dummy
 *  - ComplyAdvantage
 *  - Refinitiv World-Check
 *  - Dow Jones Risk & Compliance
 *
 * Each provider MUST return the same normalized response.
 * ==========================================================
 */

class PepProvider {

    /**
     * Run a PEP screen.
     *
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async screen(payload) {

        throw new Error(
            "screen() must be implemented by the provider."
        );

    }

}

module.exports = PepProvider;
