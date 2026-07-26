const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/auth");
const controller = require("../controllers/customerKyc.controller");

/**
 * Canonical customer-facing KYC endpoint - the only one the
 * Internet Banking Dashboard should ever call.
 */
router.get(
    "/kyc/me",
    authenticate,
    controller.getMe
);

router.post(
    "/kyc/link-bvn",
    authenticate,
    controller.linkBvn
);

router.post(
    "/kyc/link-nin",
    authenticate,
    controller.linkNin
);

module.exports = router;
