/**
 * ==========================================================
 * BVN Provider Interface
 * ----------------------------------------------------------
 * Every BVN provider must implement this interface.
 *
 * Providers:
 *  - Dummy
 *  - Prembly
 *  - VerifyMe
 *  - Mono
 *  - Smile Identity
 *
 * Each provider MUST return the same normalized response.
 * ==========================================================
 */

class BVNProvider {

    /**
     * Verify a BVN.
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

module.exports = BVNProvider;