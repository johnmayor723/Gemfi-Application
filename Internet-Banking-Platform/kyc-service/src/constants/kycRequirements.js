/**
 * ==========================================================
 * KYC Requirements
 * ----------------------------------------------------------
 * Defines every KYC requirement that contributes to the
 * customer's completion percentage.
 *
 * The Status Service reads this file to determine
 * completion instead of hardcoding checks.
 *
 * Future:
 *  - Different requirements per KYC Level
 *  - Different requirements per customer type
 *  - Different requirements per product
 * ==========================================================
 */

module.exports = [

    {
        key: "photo",
        label: "Passport Photograph"
    },

    {
        key: "signature",
        label: "Customer Signature"
    },

    {
        key: "documents",
        label: "Identity Documents"
    },

    {
        key: "bvn",
        label: "BVN Verification"
    },

    {
        key: "nin",
        label: "NIN Verification"
    },

    {
        key: "identification",
        label: "Identification Record"
    },

    {
        key: "address",
        label: "Address"
    },

    {
        key: "nextOfKin",
        label: "Next Of Kin"
    },

    {
        key: "references",
        label: "References"
    },

    {
        key: "creditCheck",
        label: "Credit Check"
    },

    {
        key: "aml",
        label: "AML Screening"
    },

    {
        key: "pep",
        label: "PEP Screening"
    },

    {
        key: "sanctions",
        label: "Sanctions Screening"
    }

];