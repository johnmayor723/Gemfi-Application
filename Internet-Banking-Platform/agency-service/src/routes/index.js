const express = require("express");

const healthModule = require("../modules/health");
const adminModule = require("../modules/admin");
const agentModule = require("../modules/agents");

const router = express.Router();

router.use("/", healthModule);
router.use("/", adminModule);
router.use("/", agentModule);

module.exports = router;
