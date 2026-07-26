const express = require("express");

const healthModule = require("../modules/health");
const profileModule = require("../modules/profile/profile.routes");

const router = express.Router();

router.use("/", healthModule);
router.use("/", profileModule);

module.exports = router;
