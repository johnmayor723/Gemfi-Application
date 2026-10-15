const express = require("express");

const controller = require("./nibss-callback.controller");

const router = express.Router();

/**
 * Every path here is a literal NIBSS callback URL
 * (https://{{BASE_URL}}/<path>) — mounted at root, no API
 * prefix, exactly matching what NIBSS registers against.
 *
 * NIBSS posts ISO 20022 XML, not JSON — the global
 * express.json()/urlencoded() parsers in app.js don't match
 * that content type and pass the request through untouched, so
 * this router reads the raw body itself.
 */
const xmlBody = express.text({

    type: () => true,

    limit: "2mb"

});

/**
 * In scope for the current build phase (outward-only — see NPS
 * Rails Build Plan): responses to our own outward acmt.023 and
 * pacs.008.
 */
router.post("/pacs002", xmlBody, controller.pacs002);

router.post("/acmt024", xmlBody, controller.acmt024);

/**
 * Registered with NIBSS but outside the current build phase —
 * inbound beneficiary-side requests (we'd receive these if a
 * customer of ours were the payment recipient) and non-EFT
 * message types (direct-debit mandates, account reporting).
 * Acknowledged so NIBSS's connectivity testing has something to
 * reach; not processed yet.
 */
router.post("/pacs008", xmlBody, controller.deferred("pacs.008"));

router.post("/acmt023", xmlBody, controller.deferred("acmt.023"));

router.post("/pain001", xmlBody, controller.deferred("pain.001"));

router.post("/pain002", xmlBody, controller.deferred("pain.002"));

router.post("/pain008", xmlBody, controller.deferred("pain.008"));

router.post("/pain009", xmlBody, controller.deferred("pain.009"));

router.post("/pain010", xmlBody, controller.deferred("pain.010"));

router.post("/pain011", xmlBody, controller.deferred("pain.011"));

router.post("/pain012", xmlBody, controller.deferred("pain.012"));

router.post("/pain013", xmlBody, controller.deferred("pain.013"));

router.post("/pain014", xmlBody, controller.deferred("pain.014"));

router.post("/pacs003", xmlBody, controller.deferred("pacs.003"));

router.post("/camt052", xmlBody, controller.deferred("camt.052"));

router.post("/camt053", xmlBody, controller.deferred("camt.053"));

router.post("/camt060", xmlBody, controller.deferred("camt.060"));

module.exports = router;
