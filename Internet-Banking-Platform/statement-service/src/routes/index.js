const express = require("express");

const healthModule = require("../modules/health");
const statementModule = require("../modules/statement/statement.routes");

const router = express.Router();

router.use("/", healthModule);
router.use("/", statementModule);

module.exports = router;
