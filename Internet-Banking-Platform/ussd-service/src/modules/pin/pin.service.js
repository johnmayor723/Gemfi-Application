const argon2 = require("argon2");

const pinRepository = require("./pin.repository");

const config = require("../../config/app.config");

const {
    ValidationError,
    BusinessRuleError,
    NotFoundError
} = require("../../errors");

class PinService {

    /**
     * Whether an account already has a PIN on file - the session
     * state machine uses this to decide enrollment vs. verification.
     */
    async isSet(accountNumber) {

        return pinRepository.existsByAccountNumber(
            accountNumber
        );

    }

    /**
     * Set (or change) the PIN for an account. Used both for
     * first-time enrollment (after OTP verification - see
     * enrollment.service.js) and a later change-PIN flow.
     */
    async set(accountNumber, plainPin) {

        this.validateFormat(plainPin);

        const pinHash =
            await argon2.hash(
                plainPin,
                { type: argon2.argon2id }
            );

        await pinRepository.upsert(accountNumber, pinHash);

    }

    /**
     * Verify a PIN, with cooldown-based attempt limiting.
     *
     * Unlike transaction-service's OTP verify(), a wrong PIN does
     * not delete or expire the credential - it accumulates a
     * failed-attempt count that locks the PIN out for
     * PIN_LOCKOUT_MINUTES once PIN_MAX_ATTEMPTS is reached, then
     * resets on either a successful verify or the lock expiring.
     */
    async verify(accountNumber, plainPin) {

        const credential =
            await pinRepository.findByAccountNumber(
                accountNumber
            );

        if (!credential) {

            throw new NotFoundError(
                "No PIN is set for this account."
            );

        }

        if (
            credential.lockedUntil &&
            credential.lockedUntil > new Date()
        ) {

            throw new BusinessRuleError(
                "PIN is temporarily locked due to too many failed attempts. Please try again later."
            );

        }

        const matches =
            await argon2.verify(
                credential.pinHash,
                plainPin
            );

        if (!matches) {

            const updated =
                await pinRepository.incrementAttempts(
                    credential._id
                );

            if (updated.attempts >= config.pin.maxAttempts) {

                const lockedUntil =
                    new Date(
                        Date.now() +
                        config.pin.lockoutMinutes * 60 * 1000
                    );

                await pinRepository.lock(
                    credential._id,
                    lockedUntil
                );

                throw new BusinessRuleError(
                    `Too many failed PIN attempts. Locked for ${config.pin.lockoutMinutes} minutes.`
                );

            }

            const remaining =
                config.pin.maxAttempts - updated.attempts;

            throw new ValidationError(
                `Incorrect PIN. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            );

        }

        await pinRepository.resetAttempts(credential._id);

        return true;

    }

    validateFormat(plainPin) {

        const pattern =
            new RegExp(`^\\d{${config.pin.length}}$`);

        if (!pattern.test(plainPin)) {

            throw new ValidationError(
                `PIN must be exactly ${config.pin.length} digits.`
            );

        }

    }

}

module.exports = new PinService();
