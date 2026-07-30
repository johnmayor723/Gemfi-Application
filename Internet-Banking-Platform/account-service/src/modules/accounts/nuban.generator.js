const repository = require("./account.repository");

/**
 * Generate an interim NUBAN-shaped identifier.
 *
 * Format:
 * 20XXXXXXXX
 *
 * This is a placeholder generator used until a real NIBSS
 * integration exists. It runs alongside the phone-derived
 * Account Number, not instead of it - every provisioned
 * account gets both: a phone-derived accountNumber and a
 * generated nuban.
 */

class NubanGenerator {

    async generate() {

        while (true) {

            const nuban =
                "20" +
                Math.floor(
                    10000000 + Math.random() * 90000000
                );

            const exists =
                await repository.existsByNuban(
                    nuban
                );

            if (!exists) {
                return nuban;
            }

        }

    }

}

module.exports = new NubanGenerator();
