/**
 * ==========================================================
 * NIBSS Institution/Bank Code Directory
 * ==========================================================
 *
 * The NPS Operations Guide (§4) lists financial-institution
 * *category* codes only (Commercial Bank, Microfinance Bank,
 * Mobile Money Operator, etc.) — not the actual per-institution
 * code list a destinationBankCode is validated against. NIBSS
 * hasn't published that directory to us yet.
 *
 * Shipping with an empty registry rather than a guessed list —
 * a wrong bank code here misroutes real money, and the guide's
 * own §9.1.1.ii makes the sending institution liable for exactly
 * that. Call register() with the official directory once NIBSS
 * provides it.
 */

const registry = new Map();

/**
 * entries: [{ code, name }, ...]
 */
const register = (entries) => {

    entries.forEach(({ code, name }) => {

        registry.set(String(code), name);

    });

};

const isKnownCode = (code) =>
    registry.has(String(code));

const getName = (code) =>
    registry.get(String(code)) || null;

const size = () =>
    registry.size;

module.exports = {
    register,
    isKnownCode,
    getName,
    size
};
