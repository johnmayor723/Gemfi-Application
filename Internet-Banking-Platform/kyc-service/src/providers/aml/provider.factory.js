/**
 * ==========================================================
 * AML Provider Factory
 * ----------------------------------------------------------
 * Returns the configured AML screening provider.
 * ==========================================================
 */

const dummyProvider = require("./dummy.provider");

// Future providers
// const complyAdvantageProvider = require("./complyadvantage.provider");
// const worldCheckProvider = require("./worldcheck.provider");
// const dowJonesProvider = require("./dowjones.provider");

class ProviderFactory {

    /**
     * Get configured provider.
     *
     * @returns {Object}
     */
    getProvider() {

        const provider =
            process.env.AML_PROVIDER || "DUMMY";

        switch (provider.toUpperCase()) {

            case "COMPLYADVANTAGE":
                // return complyAdvantageProvider;
                return dummyProvider;

            case "WORLDCHECK":
                // return worldCheckProvider;
                return dummyProvider;

            case "DOWJONES":
                // return dowJonesProvider;
                return dummyProvider;

            default:
                return dummyProvider;

        }

    }

}

module.exports = new ProviderFactory();
