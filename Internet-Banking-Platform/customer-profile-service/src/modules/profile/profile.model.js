const mongoose = require("mongoose");

/**
 * ==========================================================
 * Profile Preference
 * ==========================================================
 *
 * Customer demographic fields (name, email, phone, address)
 * are owned by Fineract via Account Service — this service
 * only aggregates them and must never write them directly.
 *
 * This collection holds the preferences that customer-profile
 * itself owns: values with no Fineract source of truth.
 */
const ProfilePreferenceSchema = new mongoose.Schema(
    {
        clientId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        displayName: {
            type: String,
            default: null
        },

        notificationsEnabled: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "ProfilePreference",
    ProfilePreferenceSchema
);
