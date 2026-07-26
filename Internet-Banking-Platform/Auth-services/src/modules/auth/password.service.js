const argon2 = require("argon2");
const bcrypt = require("bcryptjs");

class PasswordService {

    /**
     * Hash a plain text password with Argon2id.
     */
    async hash(password) {

        return argon2.hash(
            password,
            { type: argon2.argon2id }
        );

    }

    /**
     * Verify a password against a stored hash.
     *
     * Existing accounts may still carry a bcrypt hash from before
     * this service switched to Argon2 — bcrypt hashes are always
     * prefixed "$2a$"/"$2b$"/"$2y$", Argon2 hashes are always
     * prefixed "$argon2". Routing on that prefix lets old accounts
     * keep logging in without a forced reset.
     */
    async verify(
        plainPassword,
        passwordHash
    ) {

        if (passwordHash.startsWith("$2")) {

            return bcrypt.compare(
                plainPassword,
                passwordHash
            );

        }

        return argon2.verify(
            passwordHash,
            plainPassword
        );

    }

    /**
     * Validate password strength.
     */
    validateStrength(password) {

        const errors = [];

        if (!password) {
            errors.push(
                "Password is required."
            );
        }

        if (password.length < 8) {
            errors.push(
                "Password must be at least 8 characters."
            );
        }

        if (!/[A-Z]/.test(password)) {
            errors.push(
                "Password must contain at least one uppercase letter."
            );
        }

        if (!/[a-z]/.test(password)) {
            errors.push(
                "Password must contain at least one lowercase letter."
            );
        }

        if (!/[0-9]/.test(password)) {
            errors.push(
                "Password must contain at least one number."
            );
        }

        if (
            !/[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]/.test(
                password
            )
        ) {
            errors.push(
                "Password must contain at least one special character."
            );
        }

        return {
            valid:
                errors.length === 0,
            errors
        };

    }

}

module.exports =
    new PasswordService();
