const express = require("express");

const healthModule = require("../modules/health");

const enrollmentRoutes =
    require("../modules/enrollment/enrollment.routes");

const authRoutes =
    require("../modules/auth/auth.routes");

const auditRoutes =
    require("../modules/audit/audit.routes");



const router = express.Router();

router.use("/", healthModule);
router.use("/auth", enrollmentRoutes);
router.use("/auth", authRoutes);
router.use("/auth", auditRoutes);

module.exports = router;