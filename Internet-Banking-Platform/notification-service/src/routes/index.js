const express = require("express");

const healthModule = require("../modules/health");
const notificationModule = require("../modules/notification/notification.routes");

const router = express.Router();

router.use("/", healthModule);
router.use("/", notificationModule);

module.exports = router;
