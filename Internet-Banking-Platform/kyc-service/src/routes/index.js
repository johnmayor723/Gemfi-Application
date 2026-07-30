const express = require("express");

const router = express.Router();

router.use("/", require("./health.routes"));
router.use("/", require("./adminAuth.routes"));
router.use("/", require("./me.routes"));
router.use("/", require("./kyc.routes"));
router.use("/", require("./file.routes"));
router.use("/", require("./audit.routes"));

module.exports = router;