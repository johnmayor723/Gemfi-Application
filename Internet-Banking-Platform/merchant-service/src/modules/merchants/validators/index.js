module.exports = {

    createMerchant:
        require("./create-merchant.validator"),

    listMerchants:
        require("./list-merchants.validator"),

    getMerchant:
        require("./get-merchant.validator"),

    approveMerchant:
        require("./approve-merchant.validator"),

    rejectMerchant:
        require("./reject-merchant.validator"),

    updateMerchantStatus:
        require("./update-status.validator"),

    updateFeeSchedule:
        require("./update-fee-schedule.validator")

};
