const express = require("express");

const healthModule = require("../modules/health");
const adminModule = require("../modules/admin");
const onboardingModule = require("../modules/onboarding");

const router = express.Router();

router.use("/", healthModule);
router.use("/", adminModule);
router.use("/", onboardingModule);

module.exports = router;