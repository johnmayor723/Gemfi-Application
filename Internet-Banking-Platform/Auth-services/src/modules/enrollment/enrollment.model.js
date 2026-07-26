const mongoose = require("mongoose");

/**
 * ==========================================================
 * Enrollment Schema
 * ==========================================================
 *
 * Temporary Internet Banking enrollment.
 *
 * This collection only tracks the enrollment
 * process. OTPs are stored separately by the
 * OTP module.
 *
 * Records automatically expire.
 * ==========================================================
 */

const EnrollmentSchema =
    new mongoose.Schema(
        {
            /**
             * External Account Number
             */
            accountNumber: {
                type: String,
                required: true,
                trim: true
            },

            /**
             * Fineract Client ID
             */
            clientId: {
                type: String,
                required: true
            },

            /**
             * Email
             */
            email: {
                type: String,
                required: true,
                lowercase: true,
                trim: true
            },

            /**
             * Phone Number
             */
            phoneNumber: {
                type: String,
                required: true,
                trim: true
            },

            /**
             * Enrollment Status
             */
            status: {
                type: String,
                enum: [
                    "PENDING",
                    "VERIFIED"
                ],
                default: "PENDING"
            },

            /**
             * Verification Time
             */
            verifiedAt: {
                type: Date,
                default: null
            },

            /**
             * Expiry Time
             */
            expiresAt: {
                type: Date,
                required: true
            }

        },
        {
            timestamps: true,
            versionKey: false
        }
    );

/**
 * ==========================================================
 * TTL Index
 * ==========================================================
 */

EnrollmentSchema.index(
    {
        expiresAt: 1
    },
    {
        expireAfterSeconds: 0
    }
);

/**
 * ==========================================================
 * Indexes
 * ==========================================================
 */

EnrollmentSchema.index({
    accountNumber: 1
});

EnrollmentSchema.index({
    clientId: 1
});

EnrollmentSchema.index({
    status: 1
});

module.exports = mongoose.model(
    "Enrollment",
    EnrollmentSchema
);