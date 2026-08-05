const mongoose = require("mongoose");

const config = require("../../config/app.config");

/**
 * UssdSession
 *
 * One document per Africa's Talking sessionId, tracking which
 * menu screen a caller is on across the repeated POSTs that make
 * up a single USSD session (Decision E from the scoping plan -
 * same Mongo-TTL-index pattern as transaction-service's OTP
 * module). AT's own session lifetime is ~180s regardless of what
 * this service does, so expiresAt is refreshed on every step to
 * that same window rather than fixed at creation time.
 */
const UssdSessionSchema = new mongoose.Schema(

    {

        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        phoneNumber: {
            type: String,
            required: true
        },

        /**
         * Set once the phone number resolves to an account -
         * null for an unrecognized number for the (short) life of
         * that rejected session.
         */
        accountNumber: {
            type: String,
            default: null
        },

        state: {
            type: String,
            required: true,
            enum: [
                "ENROLL_AWAITING_OTP",
                "ENROLL_AWAITING_PIN",
                "ENROLL_AWAITING_PIN_CONFIRM",
                "AWAITING_PIN",
                "MAIN_MENU"
            ]
        },

        /**
         * Holds the first entry of a new PIN between
         * ENROLL_AWAITING_PIN and ENROLL_AWAITING_PIN_CONFIRM, so
         * the confirmation step can check the two match before
         * pin.service.set() is ever called. Never persisted
         * beyond this session's short TTL, and cleared as soon as
         * enrollment completes.
         */
        pendingPin: {
            type: String,
            default: null
        },

        expiresAt: {
            type: Date,
            required: true
        }

    },

    {

        timestamps: true

    }

);

UssdSessionSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

UssdSessionSchema.statics.freshExpiry = function () {

    return new Date(
        Date.now() +
        (config.ussd.sessionTtlSeconds * 1000)
    );

};

module.exports =
    mongoose.model(
        "UssdSession",
        UssdSessionSchema
    );
