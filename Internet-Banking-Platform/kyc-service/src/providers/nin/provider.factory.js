/**
 * ==========================================================
 * NIN Provider Factory
 * ==========================================================
 */

const dummyProvider = require("./dummy.provider");

// const premblyProvider = require("./prembly.provider");
// const verifyMeProvider = require("./verifyme.provider");
// const smileProvider = require("./smile.provider");

class ProviderFactory {

    getProvider() {

        const provider =
            process.env.NIN_PROVIDER || "DUMMY";

        switch (provider.toUpperCase()) {

            case "PREMBLY":
                // return premblyProvider;
                return dummyProvider;

            case "VERIFYME":
                // return verifyMeProvider;
                return dummyProvider;

            case "SMILE":
                // return smileProvider;
                return dummyProvider;

            default:
                return dummyProvider;

        }

    }

}

module.exports = new ProviderFactory();