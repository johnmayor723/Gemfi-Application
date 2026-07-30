/**
 * ==========================================================
 * Credit Provider Factory
 * ----------------------------------------------------------
 * Returns the configured credit bureau provider.
 * ==========================================================
 */

const dummyProvider = require("./dummy.provider");

// Future providers
// const crcProvider = require("./crc.provider");
// const firstCentralProvider = require("./firstcentral.provider");
// const creditRegistryProvider = require("./creditregistry.provider");

class ProviderFactory {

    /**
     * Get configured provider.
     *
     * @returns {Object}
     */
    getProvider() {

        const provider =
            process.env.CREDIT_PROVIDER || "DUMMY";

        switch (provider.toUpperCase()) {

            case "CRC":
                // return crcProvider;
                return dummyProvider;

            case "FIRSTCENTRAL":
                // return firstCentralProvider;
                return dummyProvider;

            case "CREDITREGISTRY":
                // return creditRegistryProvider;
                return dummyProvider;

            default:
                return dummyProvider;

        }

    }

}

module.exports = new ProviderFactory();
