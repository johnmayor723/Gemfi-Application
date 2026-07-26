module.exports = {

    register:
        require("./register.validator"),

    login:
        require("./login.validator"),

    verifyOtp:
        require("./verify-otp.validator"),

    forgotPassword:
        require("./forgot-password.validator"),

    resetPassword:
        require("./reset-password.validator"),

    changePassword:
        require("./change-password.validator")

};
