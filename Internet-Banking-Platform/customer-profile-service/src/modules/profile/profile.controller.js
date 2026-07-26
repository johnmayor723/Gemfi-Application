const service = require("./profile.service");

const { success } = require("../../responses/api.response");

/**
 * Get My Profile
 */
const getProfile = async (req, res) => {

    const result =
        await service.getMyProfile(req.user);

    return success(res, {
        message: "Profile retrieved successfully.",
        data: result
    });

};

/**
 * Update My Profile
 */
const updateProfile = async (req, res) => {

    const {
        displayName,
        notificationsEnabled
    } = req.body;

    const data = {};

    if (displayName !== undefined) {

        data.displayName = displayName;

    }

    if (notificationsEnabled !== undefined) {

        data.notificationsEnabled = notificationsEnabled;

    }

    const result =
        await service.updateMyProfile(req.user, data);

    return success(res, {
        message: "Profile updated successfully.",
        data: result
    });

};

/**
 * Get My Transactions
 */
const getTransactions = async (req, res) => {

    const {
        accountNumber,
        page,
        limit
    } = req.query;

    const result =
        await service.getMyTransactions(req.user, {

            accountNumber,

            page:
                page ? Number(page) : undefined,

            limit:
                limit ? Number(limit) : undefined

        });

    return success(res, {
        message: "Transactions retrieved successfully.",
        data: result
    });

};

module.exports = {

    getProfile,

    updateProfile,

    getTransactions

};
