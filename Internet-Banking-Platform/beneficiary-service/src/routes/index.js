const express = require("express");

const healthModule = require("../modules/health");
const beneficiaryModule = require("../modules/beneficiary/beneficiary.routes");

const router = express.Router();

router.use("/", healthModule);
router.use("/", beneficiaryModule);

module.exports = router;
