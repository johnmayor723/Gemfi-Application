/**
 * ==========================================================
 * NIBSS Callback Correlator
 * ==========================================================
 *
 * NIBSS answers an outward acmt.023/pacs.008 asynchronously —
 * as a separate POST to our own /acmt024 or /pacs002 route —
 * rather than in the HTTP response to our send. This registry
 * lets live.adapter.js await that later POST as if it were a
 * normal response, keeping the same synchronous call contract
 * transfer.service.js already relies on.
 *
 * An in-memory Map is sufficient here: nothing else in this
 * service uses a queue or shares state across processes, and a
 * transfer's full round trip (NPS guide §3.2: 20s at most)
 * comfortably fits inside a single request's lifetime.
 */

const pending = new Map();

/**
 * Registers a wait for `key` (the MsgId/TxId we sent out) and
 * resolves with whatever resolveCallback(key, payload) is later
 * called with — or with null if timeoutMs elapses first. Never
 * rejects: a timeout is "no result yet", for the caller to run
 * its own exception-handling path (NPS guide §11) rather than a
 * hard error.
 */
const waitFor = (key, timeoutMs) =>
    new Promise((resolve) => {

        const timer = setTimeout(() => {

            pending.delete(key);

            resolve(null);

        }, timeoutMs);

        pending.set(key, { resolve, timer });

    });

/**
 * Called by the callback route handlers when a matching
 * /pacs002 or /acmt024 POST arrives from NIBSS. Returns false
 * if nothing is waiting on `key` (late response after our own
 * timeout already fired, or an unsolicited/unmatched callback)
 * so the route can log it instead of silently dropping it.
 */
const resolveCallback = (key, payload) => {

    const entry = pending.get(key);

    if (!entry) {

        return false;

    }

    clearTimeout(entry.timer);

    pending.delete(key);

    entry.resolve(payload);

    return true;

};

const isPending = (key) =>
    pending.has(key);

module.exports = {
    waitFor,
    resolveCallback,
    isPending
};
