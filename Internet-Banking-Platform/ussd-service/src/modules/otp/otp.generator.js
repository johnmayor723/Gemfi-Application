const crypto = require("crypto");

/**
 * ==========================================================
 * OTP Generator
 * ==========================================================
 *
 * Identical to transaction-service's - SHA-256, not Argon2 (see
 * pin.service.js for why a PIN gets different treatment: this
 * is a single-use, minutes-lived code, not a long-lived secret).
 * ==========================================================
 */

class OtpGenerator {

    generate() {

        return String(

            crypto.randomInt(
                100000,
                999999
            )

        );

    }

    hash(code) {

        return crypto
            .createHash("sha256")
            .update(code)
            .digest("hex");

    }

    verify(
        plainCode,
        storedHash
    ) {

        const hash =
            this.hash(
                plainCode
            );

        return hash === storedHash;

    }

}

module.exports =
    new OtpGenerator();
