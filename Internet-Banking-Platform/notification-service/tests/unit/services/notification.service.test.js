jest.mock("../../../src/modules/notification/notification.repository");
jest.mock("../../../src/modules/notification/email.provider");
jest.mock("../../../src/modules/notification/sms.provider");

const repository = require("../../../src/modules/notification/notification.repository");
const emailProvider = require("../../../src/modules/notification/email.provider");
const smsProvider = require("../../../src/modules/notification/sms.provider");

const notificationService = require("../../../src/modules/notification/notification.service");

const user = { userId: "user-1" };

describe("Notification Service", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("send", () => {

        test("EMAIL channel calls the email provider and logs SENT", async () => {

            emailProvider.send.mockResolvedValue({ success: true, provider: "GMAIL" });

            repository.create.mockImplementation(async (data) => ({ id: "notif-1", ...data }));

            const result = await notificationService.send({
                userId: "user-1",
                channel: "EMAIL",
                type: "TRANSFER_COMPLETED",
                recipient: "jane@example.com",
                subject: "Transfer complete",
                message: "Your transfer succeeded."
            });

            expect(emailProvider.send).toHaveBeenCalledWith({
                email: "jane@example.com",
                subject: "Transfer complete",
                message: "Your transfer succeeded."
            });

            expect(smsProvider.send).not.toHaveBeenCalled();
            expect(result.status).toBe("SENT");

        });

        test("SMS channel calls the SMS provider", async () => {

            smsProvider.send.mockResolvedValue({ success: true, provider: "TERMII" });
            repository.create.mockImplementation(async (data) => ({ id: "notif-2", ...data }));

            const result = await notificationService.send({
                userId: "user-1",
                channel: "SMS",
                type: "TRANSFER_COMPLETED",
                recipient: "08000000000",
                message: "Your transfer succeeded."
            });

            expect(smsProvider.send).toHaveBeenCalledWith({
                phoneNumber: "08000000000",
                message: "Your transfer succeeded."
            });

            expect(result.status).toBe("SENT");

        });

        test("logs FAILED without throwing when the provider fails", async () => {

            emailProvider.send.mockResolvedValue({
                success: false,
                provider: "GMAIL",
                error: "auth failed"
            });

            repository.create.mockImplementation(async (data) => ({ id: "notif-3", ...data }));

            const result = await notificationService.send({
                userId: "user-1",
                channel: "EMAIL",
                type: "TRANSFER_COMPLETED",
                recipient: "jane@example.com",
                message: "Your transfer succeeded."
            });

            expect(result.status).toBe("FAILED");
            expect(repository.create).toHaveBeenCalledWith(
                expect.objectContaining({ status: "FAILED", providerResponse: "auth failed" })
            );

        });

        test("rejects an invalid channel", async () => {

            await expect(
                notificationService.send({
                    userId: "user-1",
                    channel: "PUSH",
                    type: "TRANSFER_COMPLETED",
                    recipient: "jane@example.com",
                    message: "Hi"
                })
            ).rejects.toThrow("channel must be EMAIL or SMS");

        });

    });

    describe("markRead", () => {

        test("rejects marking someone else's notification read", async () => {

            repository.findById.mockResolvedValue({
                id: "notif-1",
                userId: "someone-else"
            });

            await expect(
                notificationService.markRead(user, "notif-1")
            ).rejects.toThrow("does not belong to you");

        });

        test("marks an owned notification read", async () => {

            repository.findById.mockResolvedValue({
                id: "notif-1",
                userId: "user-1"
            });

            repository.markRead.mockResolvedValue({
                id: "notif-1",
                isRead: true
            });

            const result = await notificationService.markRead(user, "notif-1");

            expect(result.isRead).toBe(true);

        });

    });

});
