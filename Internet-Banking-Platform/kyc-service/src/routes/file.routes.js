const express = require("express");

const router = express.Router();

const controller =
require("../controllers/file.controller");

router.get(

    "/files/:fileId",

    controller.download

);

module.exports = router;