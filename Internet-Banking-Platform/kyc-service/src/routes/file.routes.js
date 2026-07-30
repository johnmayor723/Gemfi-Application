const express = require("express");

const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

router.use(adminAuth);

const controller =
require("../controllers/file.controller");

router.get(

    "/files/:fileId",

    controller.download

);

router.post(

    "/files/:fileId/sync",

    controller.sync

);

router.get(

    "/customers/:customerId/documents/sync-status",

    controller.syncStatus

);

router.post(

    "/customers/:customerId/documents/reconcile",

    controller.reconcile

);

module.exports = router;
