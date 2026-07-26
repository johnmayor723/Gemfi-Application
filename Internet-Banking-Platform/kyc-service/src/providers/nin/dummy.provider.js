/**
 * ==========================================================
 * Dummy NIN Provider
 * ----------------------------------------------------------
 * Simulates NIN verification.
 * ==========================================================
 */

const crypto = require("crypto");

const NINProvider = require("./provider.interface");

class DummyProvider extends NINProvider {

    async verify(payload) {

        const {

            nin,

            firstName,

            lastName,

            phoneNumber

        } = payload;

        await new Promise(resolve =>
            setTimeout(resolve, 800)
        );

        return {

            verified: true,

            provider: "DUMMY",

            reference: crypto.randomUUID(),

            nin,

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