/**
 * ==========================================================
 * BVN Controller
 * ==========================================================
 */

const asyncHandler = require("../middleware/asyncHandler");
const bvnService = require("../services/bvn.service");

exports.verify = asyncHandler(async (req, res) => {

    const result = await bvnService.verify(

        req.params.customerId,

        req.body.bvn

    );

    res.json({

        success: true,

        message: "BVN verified successfully.",

        data: result

    });

});

exports.get = asyncHandler(async (req, res) => {

    const result =
        await bvnService.get(

            req.params.customerId

        );

    res.json({

        success: true,

        data: result

    });

});