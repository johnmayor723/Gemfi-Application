const express = require("express");

const healthModule = require("../modules/health");

const router = express.Router();

router.use("/", healthModule);

module.exports = router;