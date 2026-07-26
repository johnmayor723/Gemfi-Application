/**
 * ==========================================================
 * NIN Provider Interface
 * ----------------------------------------------------------
 * Every NIN provider must implement this interface.
 * ==========================================================
 */

class NINProvider {

    /**
     * Verify a National Identification Number.
     *
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async verify(payload) {

        throw new Error(
            "verify() must be implemented by the provider."
        );

    }

}

module.exports = NINProvider;