/**
 * ==========================================================
 * Dummy PEP Provider
 * ----------------------------------------------------------
 * Simulates an external PEP screening service.
 *
 * Used during development before integrating
 * ComplyAdvantage, Refinitiv World-Check or Dow Jones
 * Risk & Compliance.
 * ==========================================================
 */

const crypto = require("crypto");

const PepProvider = require("./provider.interface");

class DummyProvider extends PepProvider {

    /**
     * Run a PEP screen.
     *
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async screen(payload) {

        // Simulate provider latency
        await new Promise(resolve =>

            setTimeout(resolve, 800)

        );

        return {

            provider: "DUMMY",

            reference: crypto.randomUUID(),

            matched: false,

            matches: []

        };

    }

}

module.exports = new DummyProvider();
