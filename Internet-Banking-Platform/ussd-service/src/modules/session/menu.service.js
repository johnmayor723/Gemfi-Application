const sessionRepository = require("./ussd-session.repository");

const enrollmentService = require("../enrollment/enrollment.service");

const pinService = require("../pin/pin.service");

const { client: accountClient } = require("../../integrations/account");

const { client: statementClient } = require("../../integrations/statement");

const config = require("../../config/app.config");

const {
    ValidationError,
    TooManyRequestsError
} = require("../../errors");

/**
 * The USSD menu state machine (A1 scope: balance + mini-statement
 * only, per the scoping plan - no transfer, so no dependency on
 * Decision C). One call to step() per Africa's Talking POST.
 * Returns { continueSession, message } - the controller is
 * responsible for the CON/END-prefixed plain-text formatting AT's
 * contract requires, this module knows nothing about that.
 */
class MenuService {

    async step({ sessionId, phoneNumber, text }) {

        const input =
            text === "" ? "" : text.split("*").pop();

        const session =
            await sessionRepository.findBySessionId(sessionId);

        if (!session) {

            return this.startSession(sessionId, phoneNumber);

        }

        switch (session.state) {

            case "ENROLL_AWAITING_OTP":
                return this.handleEnrollOtp(session, input);

            case "ENROLL_AWAITING_PIN":
                return this.handleEnrollPin(session, input);

            case "ENROLL_AWAITING_PIN_CONFIRM":
                return this.handleEnrollPinConfirm(session, input);

            case "AWAITING_PIN":
                return this.handlePinEntry(session, input);

            case "MAIN_MENU":
                return this.handleMainMenu(session, input);

            default:
                await sessionRepository.deleteBySessionId(sessionId);
                return this.end("Something went wrong. Please try again.");

        }

    }

    /**
     * First request of a new session (AT always sends text=""
     * here). Resolves the phone number, then branches into
     * enrollment (Decision B1) or a normal PIN prompt.
     */
    async startSession(sessionId, phoneNumber) {

        const account =
            await enrollmentService.resolveAccount(phoneNumber);

        if (!account) {

            // No session was ever persisted - nothing to clean up.
            return this.end(
                "Sorry, we couldn't find an account linked to this number. Please visit a branch or contact support."
            );

        }

        const pinAlreadySet =
            await pinService.isSet(account.accountNumber);

        if (!pinAlreadySet) {

            const { code } =
                await enrollmentService.requestOtp(
                    account.accountNumber,
                    phoneNumber
                );

            await sessionRepository.create({
                sessionId,
                phoneNumber,
                accountNumber: account.accountNumber,
                state: "ENROLL_AWAITING_OTP"
            });

            // Same non-production convention as
            // transaction-service's transfer OTP: curl-testable
            // without a live Termii account, omitted once
            // NODE_ENV=production.
            const debugSuffix =
                config.isProduction ? "" : ` (code: ${code})`;

            return this.cont(
                `Welcome! Enter the verification code sent to your phone:${debugSuffix}`
            );

        }

        await sessionRepository.create({
            sessionId,
            phoneNumber,
            accountNumber: account.accountNumber,
            state: "AWAITING_PIN"
        });

        return this.cont("Enter your PIN:");

    }

    async handleEnrollOtp(session, input) {

        try {

            await enrollmentService.verifyOtp(
                session.accountNumber,
                input
            );

        } catch (error) {

            return this.handleEnrollOtpFailure(session, error);

        }

        await sessionRepository.update(session.sessionId, {
            state: "ENROLL_AWAITING_PIN"
        });

        return this.cont(
            `Verified! Choose a ${config.pin.length}-digit PIN:`
        );

    }

    /**
     * A wrong-but-not-yet-exhausted code re-prompts within the
     * same session (better UX than forcing a re-dial). An expired
     * code or exhausted attempts end the session outright, since
     * neither is recoverable without a fresh OTP - the user has
     * to dial in again to get one.
     */
    async handleEnrollOtpFailure(session, error) {

        if (
            error instanceof TooManyRequestsError ||
            (error instanceof ValidationError && error.message.includes("expired"))
        ) {

            await sessionRepository.deleteBySessionId(session.sessionId);

            return this.end(
                `${error.message} Please dial in again to request a new code.`
            );

        }

        if (error instanceof ValidationError) {

            return this.cont(error.message);

        }

        await sessionRepository.deleteBySessionId(session.sessionId);

        return this.end("Something went wrong verifying your code. Please try again.");

    }

    async handleEnrollPin(session, input) {

        if (!/^\d+$/.test(input) || input.length !== config.pin.length) {

            return this.cont(
                `PIN must be exactly ${config.pin.length} digits. Choose a ${config.pin.length}-digit PIN:`
            );

        }

        await sessionRepository.update(session.sessionId, {
            state: "ENROLL_AWAITING_PIN_CONFIRM",
            pendingPin: input
        });

        return this.cont("Re-enter your PIN to confirm:");

    }

    async handleEnrollPinConfirm(session, input) {

        if (input !== session.pendingPin) {

            await sessionRepository.deleteBySessionId(session.sessionId);

            return this.end(
                "PINs did not match. Please dial in again to retry."
            );

        }

        await enrollmentService.completeEnrollment(
            session.accountNumber,
            input
        );

        await sessionRepository.deleteBySessionId(session.sessionId);

        return this.end(
            "PIN set successfully. Please dial in again to use your PIN."
        );

    }

    async handlePinEntry(session, input) {

        try {

            await pinService.verify(session.accountNumber, input);

        } catch (error) {

            return this.handlePinFailure(session, error);

        }

        await sessionRepository.update(session.sessionId, {
            state: "MAIN_MENU"
        });

        return this.cont("1. Check Balance\n2. Mini Statement");

    }

    /**
     * Same shape as handleEnrollOtpFailure: a wrong-but-not-locked
     * PIN re-prompts in place (pin.service already tracks attempts
     * server-side, independent of this session), a lockout or
     * anything unexpected ends the session.
     */
    async handlePinFailure(session, error) {

        if (error instanceof ValidationError) {

            return this.cont(error.message);

        }

        await sessionRepository.deleteBySessionId(session.sessionId);

        return this.end(error.message || "Something went wrong. Please try again.");

    }

    async handleMainMenu(session, input) {

        if (input === "1") {

            const balance =
                await accountClient.getBalance(session.accountNumber);

            await sessionRepository.deleteBySessionId(session.sessionId);

            return this.end(
                `Balance\nAvailable: ${balance.currency} ${balance.availableBalance}\nLedger: ${balance.currency} ${balance.ledgerBalance}`
            );

        }

        if (input === "2") {

            const statement =
                await statementClient.getMiniStatement(session.accountNumber);

            await sessionRepository.deleteBySessionId(session.sessionId);

            return this.end(this.formatMiniStatement(statement));

        }

        await sessionRepository.deleteBySessionId(session.sessionId);

        return this.end("Invalid option.");

    }

    formatMiniStatement(statement) {

        if (!statement.transactions.length) {

            return "No recent transactions.";

        }

        const lines =
            statement.transactions
                .slice(-5)
                .map((transaction) =>
                    `${transaction.date} ${transaction.type === "CREDIT" ? "+" : "-"}${transaction.amount}`
                );

        return [
            "Recent transactions:",
            ...lines
        ].join("\n");

    }

    cont(message) {

        return { continueSession: true, message };

    }

    end(message) {

        return { continueSession: false, message };

    }

}

module.exports = new MenuService();
