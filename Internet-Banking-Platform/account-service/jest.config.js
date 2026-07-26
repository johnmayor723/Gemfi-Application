module.exports = {

    testEnvironment: "node",

    testMatch: [
        "**/tests/**/*.test.js"
    ],

    clearMocks: true,

    collectCoverage: true,

    collectCoverageFrom: [

        "src/**/*.js",

        "!src/server.js",

        "!src/routes/**"

    ]

};