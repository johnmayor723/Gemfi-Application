const repository = require("./account.repository");

/**
 * Generate a temporary 10-digit account number.
 *
 * Format:
 * 20XXXXXXXX
 *
 * Later this file will be replaced with the
 * official NIBSS account number generator.
 */

class AccountNumberGenerator {

    async generate() {

        while (true) {

            const accountNumber =
                "20" +
                Math.floor(
                    10000000 + Math.random() * 90000000
                );

            const exists =
                await repository.findByAccountNumber(
                    accountNumber
                );

            if (!exists) {
                return accountNumber;
            }

        }

    }

}

module.exports = new AccountNumberGenerator();
