/**
 * ==========================================================
 * Dummy Sanctions Provider
 * ----------------------------------------------------------
 * Simulates an external sanctions-list screening service.
 *
 * Used during development before integrating
 * ComplyAdvantage, Refinitiv World-Check or Dow Jones
 * Risk & Compliance.
 * ==========================================================
 */

const crypto = require("crypto");

const SanctionsProvider = require("./provider.interface");

class DummyProvider extends SanctionsProvider {

    /**
     * Run a sanctions screen.
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

            lists: []

        };

    }

}

module.exports = new DummyProvider();
