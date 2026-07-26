const express = require("express");

const controller = require("../controllers/health.controller");

const router = express.Router();

router.get("/health", controller.health);

module.exports = router;