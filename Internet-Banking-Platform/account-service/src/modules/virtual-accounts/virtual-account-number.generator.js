const accountRepository = require("../accounts/account.repository");
const virtualAccountRepository = require("./virtual-account.repository");

/**
 * Generate a unique NUBAN-shaped virtual account number.
 *
 * Format:
 * 20XXXXXXXX
 *
 * This is the same interim NUBAN-shaped format used by
 * ../accounts/nuban.generator.js and
 * ../accounts/account-number.generator.js - reused verbatim
 * here rather than reimplemented, per this repo's existing
 * account number generator logic.
 *
 * Uniqueness is checked against every existing real-account
 * identifier (AccountMapping.accountNumber, AccountMapping.nuban)
 * as well as every already-issued virtual account number, so a
 * virtual account number can never collide with a real Fineract
 * account's identifiers or with another virtual account.
 */

class VirtualAccountNumberGenerator {

    async generate() {

        while (true) {

            const candidate =
                "20" +
                Math.floor(
                    10000000 + Math.random() * 90000000
                );

            const [
                collidesWithAccountNumber,
                collidesWithNuban,
                collidesWithVirtualAccount
            ] = await Promise.all([

                accountRepository.existsByAccountNumber(
                    candidate
                ),

                accountRepository.existsByNuban(
                    candidate
                ),

                virtualAccountRepository.existsByVirtualAccountNumber(
                    candidate
                )

            ]);

            if (
                !collidesWithAccountNumber &&
                !collidesWithNuban &&
                !collidesWithVirtualAccount
            ) {

                return String(candidate);

            }

        }

    }

}

module.exports = new VirtualAccountNumberGenerator();
