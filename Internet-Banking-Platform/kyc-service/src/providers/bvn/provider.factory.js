/**
 * ==========================================================
 * BVN Provider Factory
 * ----------------------------------------------------------
 * Returns the configured BVN provider.
 * ==========================================================
 */

const dummyProvider = require("./dummy.provider");

// Future providers
// const premblyProvider = require("./prembly.provider");
// const verifyMeProvider = require("./verifyme.provider");
// const monoProvider = require("./mono.provider");
// const smileProvider = require("./smile.provider");

class ProviderFactory {

    /**
     * Get configured provider.
     *
     * @returns {Object}
     */
    getProvider() {

        const provider =
            process.env.BVN_PROVIDER || "DUMMY";

        switch (provider.toUpperCase()) {

            case "PREMBLY":
                // return premblyProvider;
                return dummyProvider;

            case "VERIFYME":
                // return verifyMeProvider;
                return dummyProvider;

            case "MONO":
                // return monoProvider;
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