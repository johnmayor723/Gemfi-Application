const mongoose = require("mongoose");

/**
 * PinCredential
 *
 * The platform's first PIN concept - no other service has one.
 * Keyed by accountNumber rather than phoneNumber: account-service
 * is the single source of truth for phone-to-account mapping, so
 * this model doesn't duplicate that relationship, it just assumes
 * the caller (pin.service.js) already resolved a phone number to
 * an accountNumber before touching this collection.
 *
 * Unlike transaction-service's OTP model, a PIN is set once and
 * reused indefinitely rather than expiring - there is deliberately
 * no expiresAt/TTL index here. Failed attempts accumulate until a
 * cooldown lock (lockedUntil), not a permanent lockout, and a
 * successful verify resets attempts back to zero.
 */
const PinCredentialSchema = new mongoose.Schema(

    {

        accountNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true
        },

        /**
         * Argon2id, matching Auth-services' password hashing
         * convention - a PIN is a long-lived reusable secret, the
         * same risk class as a password, not a single-use OTP.
         */
        pinHash: {
            type: String,
            required: true
        },

        attempts: {
            type: Number,
            default: 0,
            min: 0
        },

        /**
         * Set once attempts reaches PIN_MAX_ATTEMPTS. Verification
         * is refused while this is in the future; once it passes,
         * pin.service.js resets attempts back to zero and clears
         * this rather than locking permanently.
         */
        lockedUntil: {
            type: Date,
            default: null
        },

        setAt: {
            type: Date,
            default: Date.now
        }

    },

    {

        timestamps: true

    }

);

module.exports =
    mongoose.model(
        "PinCredential",
        PinCredentialSchema
    );
