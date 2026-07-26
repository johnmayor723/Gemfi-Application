const bcrypt = require("bcryptjs");

class PasswordService {

    /**
     * Number of bcrypt rounds.
     */
    constructor() {
        this.saltRounds = 12;
    }

    /**
     * Hash a plain text password.
     */
    async hash(password) {

        return bcrypt.hash(
            password,
            this.saltRounds
        );

    }

    /**
     * Verify a password.
     */
    async verify(
        plainPassword,
        passwordHash
    ) {

        return bcrypt.compare(
            plainPassword,
            passwordHash
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
