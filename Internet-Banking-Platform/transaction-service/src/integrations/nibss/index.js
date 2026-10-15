const config = require("../../config/app.config");

const dummyAdapter = require("./dummy.adapter");

const liveAdapter = require("./live.adapter");

/**
 * Provider selection. Set NIBSS_PROVIDER=live once
 * nibss.config.js has a real baseUrl/institutionCode — until
 * then "live" stays network-inert (nibss.client.js refuses to
 * call a null baseURL). Nothing that calls
 * `adapter.initiateNip()`/`nameEnquiry()`/`getPaymentStatus()`
 * needs to change when switching providers.
 */
const providers = {
    dummy: dummyAdapter,
    live: liveAdapter
};

const adapter =
    providers[config.nibss.provider] || dummyAdapter;

module.exports = {
    adapter
};
