const {
    accountNumber,
    email,
    phoneNumber
} = require("../../../validators");

module.exports = [
    accountNumber(),
    email(),
    phoneNumber()
];