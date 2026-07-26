const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema(

    {

        /**
         * Customer visible account number
         */
        accountNumber: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        /**
         * NUBAN is not sourced anywhere yet (no NIBSS
         * integration) - left null until that exists. Sparse
         * so multiple null values don't collide on the unique
         * index.
         */
        nuban: {
            type: String,
            required: false,
            default: null,
            unique: true,
            sparse: true,
            index: true
        },
         /**
         * Customer visible account number
         */
     
        /**
         * Fineract Savings Account ID
         */
        fineractAccountId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        /**
         * Fineract Account Number
         */
        fineractAccountNumber: {
            type: String,
            required: true,
            index: true
        },

        /**
         * Fineract Client ID
         */
        clientId: {
            type: String,
            required: true,
            index: true
        },

        displayName: {
            type: String,
            required: true
        },

        firstName: {
            type: String,
            default: null
        },

        middleName: {
            type: String,
            default: null
        },

        lastName: {
            type: String,
            default: null
        },

        phoneNumber: {
            type: String,
            default: null,
            index: true
        },

        email: {
            type: String,
            default: null,
            lowercase: true,
            index: true
        },

        status: {
            type: String,
            default: "ACTIVE"
        }

    },

    {

        timestamps: true

    }

);

module.exports =
    mongoose.model(
        "AccountMapping",
        AccountSchema
    );