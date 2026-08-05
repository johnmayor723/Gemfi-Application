const express = require("express");

const healthModule = require("../modules/health");

const ussdModule = require("../modules/ussd/ussd.routes");

const router = express.Router();

router.use("/", healthModule);

router.use("/", ussdModule);

module.exports = router;