/**
 * ==========================================================
 * Reference Controller
 * ----------------------------------------------------------
 * Handles customer account reference endpoints.
 *
 * Responsibilities:
 *  - Receive HTTP requests
 *  - Call Reference Service
 *  - Return API responses
 * ==========================================================
 */


const asyncHandler =
require("../middleware/asyncHandler");


const referenceService =
require("../services/reference.service");



/**
 * ==========================================================
 * Create Account Reference
 *
 * POST /customers/:customerId/references
 * ==========================================================
 */
exports.create = asyncHandler(async(req,res)=>{


    const reference =
    await referenceService.create(

        req.params.customerId,

        req.body

    );


    res.status(201).json({

        success:true,

        message:"Reference created successfully.",

        data:reference

    });


});



/**
 * ==========================================================
 * Get Account References
 *
 * GET /customers/:customerId/references
 * ==========================================================
 */
exports.list = asyncHandler(async(req,res)=>{


    const references =
    await referenceService.list(

        req.params.customerId

    );


    res.json({

        success:true,

        data:references

    });


});



/**
 * ==========================================================
 * Update Reference
 *
 * PUT /references/:id
 * ==========================================================
 */
exports.update = asyncHandler(async(req,res)=>{


    const reference =
    await referenceService.update(

        req.params.id,

        req.body

    );


    res.json({

        success:true,

        message:"Reference updated successfully.",

        data:reference

    });


});



/**
 * ==========================================================
 * Delete Reference
 *
 * DELETE /references/:id
 * ==========================================================
 */
exports.remove = asyncHandler(async(req,res)=>{


    await referenceService.remove(

        req.params.id

    );


    res.json({

        success:true,

        message:"Reference deleted successfully."

    });


});



/**
 * ==========================================================
 * Upload Reference Letter
 *
 * POST /references/:id/letter
 *
 * multipart/form-data
 * field: file
 * ==========================================================
 */
exports.uploadLetter = asyncHandler(async(req,res)=>{


    const file =
    await referenceService.uploadLetter(

        req.body.customerId,

        req.params.id,

        req.file

    );


    res.status(201).json({

        success:true,

        message:"Reference letter uploaded successfully.",

        data:{
            fileId:file._id
        }

    });


});