/**
 * ==========================================================
 * Dummy Credit Provider
 * ----------------------------------------------------------
 * Simulates an external credit bureau.
 *
 * Used during development before integrating CRC Credit
 * Bureau, FirstCentral or CreditRegistry.
 * ==========================================================
 */

const crypto = require("crypto");

const CreditProvider = require("./provider.interface");

class DummyProvider extends CreditProvider {

    /**
     * Run a credit check.
     *
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async check(payload) {

        // Simulate provider latency
        await new Promise(resolve =>

            setTimeout(resolve, 800)

        );

        return {

            provider: "DUMMY",

            reference: crypto.randomUUID(),

            score: 720,

            rating: "GOOD"

        };

    }

}

module.exports = new DummyProvider();
