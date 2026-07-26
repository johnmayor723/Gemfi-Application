/**
 * ==========================================================
 * Next Of Kin Controller
 * ----------------------------------------------------------
 * Handles customer next-of-kin endpoints.
 *
 * Responsibilities:
 *  - Receive HTTP requests
 *  - Call Next Of Kin Service
 *  - Return API responses
 * ==========================================================
 */

const asyncHandler = require("../middleware/asyncHandler");

const nextOfKinService =
require("../services/nextOfKin.service");


/**
 * ==========================================================
 * Create Next Of Kin
 *
 * POST /customers/:customerId/next-of-kin
 * ==========================================================
 */
exports.create = asyncHandler(async (req, res) => {


    const nextOfKin =
        await nextOfKinService.create(

            req.params.customerId,

            req.body

        );


    res.status(201).json({

        success:true,

        message:"Next of kin created successfully.",

        data:nextOfKin

    });


});



/**
 * ==========================================================
 * List Next Of Kin
 *
 * GET /customers/:customerId/next-of-kin
 * ==========================================================
 */
exports.list = asyncHandler(async (req,res)=>{


    const nextOfKin =
        await nextOfKinService.list(

            req.params.customerId

        );


    res.json({

        success:true,

        data:nextOfKin

    });


});



/**
 * ==========================================================
 * Update Next Of Kin
 *
 * PUT /next-of-kin/:id
 * ==========================================================
 */
exports.update = asyncHandler(async(req,res)=>{


    const nextOfKin =
        await nextOfKinService.update(

            req.params.id,

            req.body

        );


    res.json({

        success:true,

        message:"Next of kin updated successfully.",

        data:nextOfKin

    });


});



/**
 * ==========================================================
 * Delete Next Of Kin
 *
 * DELETE /next-of-kin/:id
 * ==========================================================
 */
exports.remove = asyncHandler(async(req,res)=>{


    await nextOfKinService.remove(

        req.params.id

    );


    res.json({

        success:true,

        message:"Next of kin deleted successfully."

    });


});