const service = require("./admin.service");

const { success } = require("../../responses/api.response");

/**
 * Login
 */
const login = async (req, res) => {

    const { username, password } = req.body;

    const result =
        await service.login(username, password);

    return success(res, {
        message: "Admin authenticated successfully.",
        data: result
    });

};

/**
 * Logout
 */
const logout = async (req, res) => {

    service.logout(req.admin.sessionId);

    return success(res, {
        message: "Admin session ended.",
        data: {}
    });

};

/**
 * Session
 */
const session = async (req, res) => {

    return success(res, {
        message: "Session is active.",
        data: { admin: req.admin }
    });

};

module.exports = {

    login,

    logout,

    session

};
