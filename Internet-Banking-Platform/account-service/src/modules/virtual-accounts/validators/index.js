module.exports = {

    createVirtualAccount:
        require("./create-virtual-account.validator"),

    getVirtualAccount:
        require("./get-virtual-account.validator"),

    listVirtualAccounts:
        require("./list-virtual-accounts.validator"),

    updateVirtualAccountStatus:
        require("./update-status.validator")

};
