/**
 * ==========================================================
 * Dummy BVN Provider
 * ----------------------------------------------------------
 * Simulates an external BVN verification service.
 *
 * Used during development before integrating
 * Prembly, VerifyMe, Mono or Smile.
 * ==========================================================
 */

const crypto = require("crypto");

const BVNProvider = require("./provider.interface");

class DummyProvider extends BVNProvider {

    /**
     * Verify BVN.
     *
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async verify(payload) {

        const {

            bvn,

            firstName,

            lastName,

            phoneNumber

        } = payload;

        // Simulate provider latency
        await new Promise(resolve =>

            setTimeout(resolve, 800)

        );

        return {

            verified: true,

            provider: "DUMMY",

            reference: crypto.randomUUID(),

            bvn,

            firstName,

            middleName: "",

            lastName,

            dob: "1995-02-04",

            phoneNumber,

            email: "john@example.com",

            gender: "Male",

            photo: null

        };

    }

}

module.exports = new DummyProvider();