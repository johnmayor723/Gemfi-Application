/**
 * ==========================================================
 * Address Controller
 * ----------------------------------------------------------
 * Handles customer address endpoints.
 *
 * Responsibilities:
 *  - Receive HTTP requests
 *  - Call Address Service
 *  - Return responses
 * ==========================================================
 */

const asyncHandler = require("../middleware/asyncHandler");
const addressService = require("../services/address.service");


/**
 * ==========================================================
 * Update Customer Address
 *
 * PUT /customers/:customerId/address
 * ==========================================================
 */
exports.update = asyncHandler(async (req, res) => {

    const address = await addressService.update(

        req.params.customerId,

        req.body

    );


    res.json({

        success: true,

        message: "Address updated successfully.",

        data: address

    });

});


/**
 * ==========================================================
 * Get Customer Address
 *
 * GET /customers/:customerId/address
 * ==========================================================
 */
exports.get = asyncHandler(async (req, res) => {

    const address = await addressService.get(

        req.params.customerId

    );


    res.json({

        success: true,

        data: address

    });

});


/**
 * ==========================================================
 * Upload Proof Of Address
 *
 * POST /customers/:customerId/address/proof
 *
 * multipart:
 * file
 * ==========================================================
 */
exports.uploadProof = asyncHandler(async (req, res) => {


    const file = await addressService.uploadProof(

        req.params.customerId,

        req.file

    );


    res.status(201).json({

        success: true,

        message: "Address proof uploaded successfully.",

        data: {

            fileId: file._id,

            url: `/api/v1/files/${file._id}`

        }

    });


});


/**
 * ==========================================================
 * Verify Customer Address
 *
 * POST /customers/:customerId/address/verify
 * ==========================================================
 */
exports.verify = asyncHandler(async (req, res) => {


    const address = await addressService.verify(

        req.params.customerId

    );


    res.json({

        success: true,

        message: "Address verified successfully.",

        data: address

    });


});