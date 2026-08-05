const express = require("express");

const healthModule = require("../modules/health");
const accountModule = require("../modules/accounts");
const customerModule = require("../modules/customer");
const adminModule = require("../modules/admin");
const virtualAccountModule = require("../modules/virtual-accounts");

const router = express.Router();

router.use("/", healthModule);
router.use("/", accountModule);
router.use("/", customerModule);
router.use("/", adminModule);
router.use("/", virtualAccountModule);

module.exports = router;