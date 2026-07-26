const service = require("./beneficiary.service");

const { success, created } = require("../../responses/api.response");

/**
 * Create Beneficiary
 */
const create = async (req, res) => {

    const result =
        await service.create(req.user, req.body, req);

    return created(res, {
        message: "Beneficiary saved successfully.",
        data: result
    });

};

/**
 * Update Beneficiary
 */
const update = async (req, res) => {

    const result =
        await service.update(
            req.user,
            req.params.id,
            req.body
        );

    return success(res, {
        message: "Beneficiary updated successfully.",
        data: result
    });

};

/**
 * Remove Beneficiary
 */
const remove = async (req, res) => {

    const result =
        await service.remove(req.user, req.params.id);

    return success(res, {
        message: "Beneficiary removed successfully.",
        data: result
    });

};

/**
 * Get Beneficiary By ID
 */
const getById = async (req, res) => {

    const result =
        await service.getById(req.user, req.params.id);

    return success(res, {
        message: "Beneficiary retrieved successfully.",
        data: result
    });

};

/**
 * List Beneficiaries
 */
const list = async (req, res) => {

    const {
        page,
        limit,
        favorite
    } = req.query;

    const result =
        await service.list(req.user, {

            page:
                page ? Number(page) : 1,

            limit:
                limit ? Number(limit) : 20,

            favorite:
                favorite === undefined
                    ? undefined
                    : favorite === "true"

        });

    return success(res, {
        message: "Beneficiaries retrieved successfully.",
        data: result
    });

};

module.exports = {

    create,

    update,

    remove,

    getById,

    list

};
