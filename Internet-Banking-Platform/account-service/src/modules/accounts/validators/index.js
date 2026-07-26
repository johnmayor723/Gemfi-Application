module.exports = {

    createMapping:
        require("./create-mapping.validator"),

    validateAccount:
        require("./validate-account.validator"),

    nameEnquiry:
        require("./name-enquiry.validator"),
    
    syncAccount:
    require("./sync-account.validator"),

    registerAccount:
        require("./register-account.validator")

};