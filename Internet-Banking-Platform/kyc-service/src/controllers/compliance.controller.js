/**
 * ==========================================================
 * Compliance Controller
 * ----------------------------------------------------------
 * Handles HTTP requests for credit, AML, PEP and sanctions
 * checks.
 *
 * Responsibilities:
 *  - Accept HTTP requests
 *  - Call the relevant compliance service
 *  - Return HTTP responses
 * ==========================================================
 */

const asyncHandler = require("../middleware/asyncHandler");

const creditService = require("../services/credit.service");
const amlService = require("../services/aml.service");
const pepService = require("../services/pep.service");
const sanctionsService = require("../services/sanctions.service");

/**
 * ==========================================================
 * Credit Check
 * ==========================================================
 */
exports.checkCredit = asyncHandler(async (req, res) => {

    const result = await creditService.check(

        req.params.customerId,

        req.body,

        req.admin

    );

    res.status(200).json({

        success: true,

        message: "Credit check completed.",

        data: result

    });

});

exports.getCredit = asyncHandler(async (req, res) => {

    const result = await creditService.get(

        req.params.customerId

    );

    res.json({

        success: true,

        data: result

    });

});

/**
 * ==========================================================
 * AML Screen
 * ==========================================================
 */
exports.checkAml = asyncHandler(async (req, res) => {

    const result = await amlService.check(

        req.params.customerId,

        req.body,

        req.admin

    );

    res.status(200).json({

        success: true,

        message: "AML screen completed.",

        data: result

    });

});

exports.getAml = asyncHandler(async (req, res) => {

    const result = await amlService.get(

        req.params.customerId

    );

    res.json({

        success: true,

        data: result

    });

});

/**
 * ==========================================================
 * PEP Screen
 * ==========================================================
 */
exports.checkPep = asyncHandler(async (req, res) => {

    const result = await pepService.check(

        req.params.customerId,

        req.body,

        req.admin

    );

    res.status(200).json({

        success: true,

        message: "PEP screen completed.",

        data: result

    });

});

exports.getPep = asyncHandler(async (req, res) => {

    const result = await pepService.get(

        req.params.customerId

    );

    res.json({

        success: true,

        data: result

    });

});

/**
 * ==========================================================
 * Sanctions Screen
 * ==========================================================
 */
exports.checkSanctions = asyncHandler(async (req, res) => {

    const result = await sanctionsService.check(

        req.params.customerId,

        req.body,

        req.admin

    );

    res.status(200).json({

        success: true,

        message: "Sanctions screen completed.",

        data: result

    });

});

exports.getSanctions = asyncHandler(async (req, res) => {

    const result = await sanctionsService.get(

        req.params.customerId

    );

    res.json({

        success: true,

        data: result

    });

});
