const path = require("node:path");

const service = require("./onboarding.service");

const { app: config } = require("../../config");

const { success, created } = require("../../responses/api.response");

/**
 * Build the persisted-logo shape from a multer file, or null
 * if no file was uploaded.
 */
function logoFromUpload(file) {

    if (!file) {

        return null;

    }

    return {

        originalName: file.originalname,

        storedName: file.filename,

        mimeType: file.mimetype,

        size: file.size,

        path: file.filename

    };

}

/**
 * Public Submit
 *
 * POST /onboarding/requests
 */
const submit = async (req, res) => {

    const request = await service.submit(
        req.body,
        "client",
        logoFromUpload(req.file)
    );

    return created(res, {
        message: "Onboarding request submitted. We'll review it shortly.",
        data: {
            id: request._id,
            subdomain: request.subdomain,
            status: request.status
        }
    });

};

/**
 * Public Status Check
 *
 * GET /onboarding/requests/:id/status
 */
const getPublicStatus = async (req, res) => {

    const status = await service.getPublicStatus(req.params.id);

    return success(res, {
        message: "Status retrieved successfully.",
        data: status
    });

};

/**
 * Public Branding
 *
 * GET /branding/:subdomain
 */
const getBranding = async (req, res) => {

    const branding = await service.getBranding(req.params.subdomain);

    return success(res, {
        message: "Branding retrieved successfully.",
        data: branding
    });

};

/**
 * Public Logo
 *
 * GET /onboarding/requests/:id/logo
 */
const getLogo = async (req, res) => {

    const logo = await service.getLogo(req.params.id);

    const absolutePath = path.join(

        __dirname,

        "..",
        "..",
        "..",

        config.upload.dir,

        "logos",

        logo.storedName

    );

    return res.sendFile(absolutePath);

};

/**
 * Admin List
 *
 * GET /admin/onboarding/requests
 */
const list = async (req, res) => {

    const requests = await service.list(req.query.status);

    return success(res, {
        message: "Onboarding requests retrieved successfully.",
        data: requests
    });

};

/**
 * Admin Detail
 *
 * GET /admin/onboarding/requests/:id
 */
const getById = async (req, res) => {

    const request = await service.getById(req.params.id);

    return success(res, {
        message: "Onboarding request retrieved successfully.",
        data: request
    });

};

/**
 * Admin Blank-Start
 *
 * POST /admin/onboarding/requests
 */
const adminCreate = async (req, res) => {

    const request = await service.submit(
        req.body,
        "admin",
        logoFromUpload(req.file)
    );

    return created(res, {
        message: "Onboarding request created.",
        data: request
    });

};

/**
 * Admin Edit
 *
 * PATCH /admin/onboarding/requests/:id
 */
const update = async (req, res) => {

    const request = await service.update(req.params.id, req.body);

    return success(res, {
        message: "Onboarding request updated.",
        data: request
    });

};

/**
 * Admin Reject
 *
 * POST /admin/onboarding/requests/:id/reject
 */
const reject = async (req, res) => {

    const request = await service.reject(
        req.params.id,
        req.admin,
        req.body?.reason
    );

    return success(res, {
        message: "Onboarding request rejected.",
        data: request
    });

};

/**
 * Admin Approve
 *
 * POST /admin/onboarding/requests/:id/approve
 */
const approve = async (req, res) => {

    const request = await service.approve(req.params.id, req.admin);

    return success(res, {
        message: "Onboarding request approved and tenant provisioned.",
        data: request
    });

};

module.exports = {

    submit,

    getPublicStatus,

    getBranding,

    getLogo,

    list,

    getById,

    adminCreate,

    update,

    reject,

    approve

};
