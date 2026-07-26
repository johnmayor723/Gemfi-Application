const repository = require("./account.repository");

const { ValidationError } = require("../../errors");

/**
 * Derive the customer-facing Account Number from a phone
 * number.
 *
 * Rules:
 * - Strip a leading +234 or 234 if present.
 * - Use the last 10 digits.
 * - Must be unique across account mappings.
 */

class PhoneAccountNumberGenerator {

    deriveFromPhoneNumber(phoneNumber) {

        if (!phoneNumber) {

            throw new ValidationError(
                "Phone number is required to generate an account number."
            );

        }

        let digits =
            String(phoneNumber)
                .trim()
                .replace(/[^\d+]/g, "");

        if (digits.startsWith("+234")) {

            digits = digits.slice(4);

        } else if (digits.startsWith("234")) {

            digits = digits.slice(3);

        }

        digits = digits.replace(/\D/g, "");

        if (digits.length < 10) {

            throw new ValidationError(
                "Phone number is too short to generate an account number."
            );

        }

        return digits.slice(-10);

    }

    async generate(phoneNumber) {

        const accountNumber =
            this.deriveFromPhoneNumber(phoneNumber);

        const exists =
            await repository.existsByAccountNumber(
                accountNumber
            );

        return {
            accountNumber,
            alreadyAssigned: Boolean(exists)
        };

    }

}

module.exports = new PhoneAccountNumberGenerator();
