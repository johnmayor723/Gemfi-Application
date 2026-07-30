/**
 * ==========================================================
 * Dummy AML Provider
 * ----------------------------------------------------------
 * Simulates an external AML screening service.
 *
 * Used during development before integrating
 * ComplyAdvantage, Refinitiv World-Check or Dow Jones
 * Risk & Compliance.
 * ==========================================================
 */

const crypto = require("crypto");

const AmlProvider = require("./provider.interface");

class DummyProvider extends AmlProvider {

    /**
     * Run an AML screen.
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

            riskLevel: "LOW",

            matches: []

        };

    }

}

module.exports = new DummyProvider();
