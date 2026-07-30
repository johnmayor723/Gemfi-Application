const express = require("express");

const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

router.use(adminAuth);

/**
 * Controllers
 */
const controller = require("../controllers/kyc.controller");
const photoController = require("../controllers/photo.controller");
const signatureController = require("../controllers/signature.controller");
const documentController = require("../controllers/document.controller");
const bvnController = require("../controllers/bvn.controller");
const ninController = require("../controllers/nin.controller");
const statusController = require("../controllers/status.controller");
const identificationController = require("../controllers/identification.controller");
const addressController = require("../controllers/address.controller");
const nextOfKinController =
require("../controllers/nextOfKin.controller");
const referenceController =
require("../controllers/reference.controller");
/**
 * Upload middleware
 */
const upload = require("../config/multer");
const uploadType = require("../middleware/uploadType");
const FileTypes = require("../constants/fileTypes");


router.post(
    "/customers/:customerId/kyc",
    controller.create
);

router.get(
    "/customers/:customerId/kyc",
    controller.get
);

router.patch(
    "/customers/:customerId/kyc",
    controller.update
);

/**
 * ==========================================================
 * KYC Approval
 * ==========================================================
 */

/**
 * Approve KYC profile.
 */
router.post(
    "/customers/:customerId/kyc/approve",
    controller.approve
);

/**
 * Reject KYC profile.
 */
router.post(
    "/customers/:customerId/kyc/reject",
    controller.reject
);

/**
 * ==========================================================
 * Passport Photograph
 * ==========================================================
 */

/**
 * Upload passport photo.
 */
router.post(

    "/customers/:customerId/photo",

    uploadType(FileTypes.PHOTO),

    upload.single("photo"),

    photoController.upload

);

/**
 * Get passport photo metadata.
 */
router.get(

    "/customers/:customerId/photo",

    photoController.get

);

/**
 * Delete passport photo.
 */
router.delete(

    "/customers/:customerId/photo",

    photoController.remove

);
/**
 * ==========================================================
 * Customer Signature
 * ==========================================================
 */

/**
 * Upload Signature
 *
 * POST /customers/:customerId/signature
 */
router.post(

    "/customers/:customerId/signature",

    uploadType(FileTypes.SIGNATURE),

    upload.single("signature"),

    signatureController.upload

);


/**
 * Get Signature
 *
 * GET /customers/:customerId/signature
 */
router.get(

    "/customers/:customerId/signature",

    signatureController.get

);


/**
 * Delete Signature
 *
 * DELETE /customers/:customerId/signature
 */
router.delete(

    "/customers/:customerId/signature",

    signatureController.remove

);

/**
 * ==========================================================
 * Customer Documents
 * ==========================================================
 */

/**
 * Upload Document
 */
router.post(

    "/customers/:customerId/documents",

    uploadType(FileTypes.DOCUMENT),

    upload.single("file"),

    documentController.upload

);


/**
 * List Documents
 */
router.get(

    "/customers/:customerId/documents",

    documentController.list

);


/**
 * Get Document
 */
router.get(

    "/documents/:documentId",

    documentController.get

);


/**
 * Download Document
 */
router.get(

    "/documents/:documentId/download",

    documentController.download

);


/**
 * Delete Document
 */
router.delete(

    "/documents/:documentId",

    documentController.remove

);
/**
 * ==========================================================
 * BVN
 * ==========================================================
 */

router.post(
    "/customers/:customerId/bvn/verify",
    bvnController.verify
);

router.get(
    "/customers/:customerId/bvn",
    bvnController.get
);
/**
 * ==========================================================
 * NIN
 * ==========================================================
 */

router.post(
    "/customers/:customerId/nin/verify",
    ninController.verify
);

router.get(
    "/customers/:customerId/nin",
    ninController.get
);

/**
 * ==========================================================
 * KYC Status
 * ==========================================================
 */

/**
 * Overall customer KYC completion status.
 */
router.get(
    "/customers/:customerId/status",
    statusController.get
);

/**
 * ==========================================================
 * Identification
 * ==========================================================
 */

/**
 * Create identification record.
 */
router.post(
    "/customers/:customerId/identification",
    identificationController.create
);

/**
 * Update identification record.
 */
router.put(
    "/customers/:customerId/identification",
    identificationController.update
);

/**
 * Get identification record.
 */
router.get(
    "/customers/:customerId/identification",
    identificationController.get
);
/**
 * ==========================================================
 * Address Management
 * ==========================================================
 */


/**
 * Update customer address
 */
router.put(
    "/customers/:customerId/address",
    addressController.update
);


/**
 * Get customer address
 */
router.get(
    "/customers/:customerId/address",
    addressController.get
);


/**
 * Upload proof of address
 */
router.post(
    "/customers/:customerId/address/proof",

    uploadType(FileTypes.ADDRESS_PROOF),

    upload.single("file"),

    addressController.uploadProof
);


/**
 * Verify address
 */
router.post(
    "/customers/:customerId/address/verify",

    addressController.verify
);
/**
 * ==========================================================
 * Next Of Kin
 * ==========================================================
 */


/**
 * Create next of kin
 */
router.post(

    "/customers/:customerId/next-of-kin",

    nextOfKinController.create

);



/**
 * List next of kin
 */
router.get(

    "/customers/:customerId/next-of-kin",

    nextOfKinController.list

);



/**
 * Update next of kin
 */
router.put(

    "/next-of-kin/:id",

    nextOfKinController.update

);



/**
 * Delete next of kin
 */
router.delete(

    "/next-of-kin/:id",

    nextOfKinController.remove

);


/**
 * ==========================================================
 * Account References
 * ==========================================================
 */


/**
 * Create reference
 */
router.post(

    "/customers/:customerId/references",

    referenceController.create

);



/**
 * List references
 */
router.get(

    "/customers/:customerId/references",

    referenceController.list

);



/**
 * Update reference
 */
router.put(

    "/references/:id",

    referenceController.update

);



/**
 * Delete reference
 */
router.delete(

    "/references/:id",

    referenceController.remove

);



/**
 * Upload reference letter
 */
router.post(

    "/references/:id/letter",

    uploadType(FileTypes.REFERENCE_LETTER),

    upload.single("file"),

    referenceController.uploadLetter

);

module.exports = router;