const express = require("express");

const healthModule = require("../modules/health");
const adminModule = require("../modules/admin");
const merchantModule = require("../modules/merchants");

const router = express.Router();

router.use("/", healthModule);
router.use("/", adminModule);
router.use("/", merchantModule);

module.exports = router;
