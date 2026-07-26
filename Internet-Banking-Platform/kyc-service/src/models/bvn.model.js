/**
 * ==========================================================
 * BVN Model
 * ----------------------------------------------------------
 * Stores BVN verification results for customers.
 * ==========================================================
 */

const mongoose = require("mongoose");

const bvnSchema = new mongoose.Schema({

    customerId: {
        type: String,
        required: true,
        index: true,
        unique: true
    },

    bvn: {
        type: String,
        required: true
    },

    verified: {
        type: Boolean,
        default: false
    },

    firstName: String,

    lastName: String,

    middleName: String,

    dob: Date,

    phoneNumber: String,

    photo: String,

    provider: {
        type: String,
        default: "MOCK"
    },

    verificationReference: String,

    verifiedAt: Date

}, {
    timestamps: true
});

module.exports = mongoose.model("BVN", bvnSchema);