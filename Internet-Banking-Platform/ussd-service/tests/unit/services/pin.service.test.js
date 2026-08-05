const db =
    require("../../helpers/database");

const pinService =
    require("../../../src/modules/pin/pin.service");

describe("Pin Service", () => {

    beforeAll(async () => {

        await db.connect();

    });

    beforeEach(async () => {

        await db.clearDatabase();

    });

    afterAll(async () => {

        await db.closeDatabase();

    });

    test("isSet is false before a PIN is ever set", async () => {

        expect(
            await pinService.isSet("8011122233")
        ).toBe(false);

    });

    test("set() then isSet() is true, and the raw PIN is never stored", async () => {

        await pinService.set("8011122233", "1234");

        expect(
            await pinService.isSet("8011122233")
        ).toBe(true);

    });

    test("rejects a non-4-digit PIN", async () => {

        await expect(
            pinService.set("8011122233", "12")
        ).rejects.toThrow("must be exactly 4 digits");

        await expect(
            pinService.set("8011122233", "abcd")
        ).rejects.toThrow("must be exactly 4 digits");

    });

    test("verify() succeeds with the correct PIN and resets attempts", async () => {

        await pinService.set("8011122233", "1234");

        await expect(
            pinService.verify("8011122233", "1234")
        ).resolves.toBe(true);

    });

    test("verify() throws NotFoundError when no PIN has been set", async () => {

        await expect(
            pinService.verify("8099999999", "1234")
        ).rejects.toThrow("No PIN is set");

    });

    test("verify() with a wrong PIN increments attempts and reports remaining tries", async () => {

        await pinService.set("8011122233", "1234");

        await expect(
            pinService.verify("8011122233", "0000")
        ).rejects.toThrow("2 attempts remaining");

        await expect(
            pinService.verify("8011122233", "0000")
        ).rejects.toThrow("1 attempt remaining");

    });

    test("locks out after PIN_MAX_ATTEMPTS (3) consecutive failures", async () => {

        await pinService.set("8011122233", "1234");

        await expect(pinService.verify("8011122233", "0000")).rejects.toThrow();
        await expect(pinService.verify("8011122233", "0000")).rejects.toThrow();

        await expect(
            pinService.verify("8011122233", "0000")
        ).rejects.toThrow("Locked for");

        // Even the correct PIN is refused while locked.
        await expect(
            pinService.verify("8011122233", "1234")
        ).rejects.toThrow("temporarily locked");

    });

    test("set() (change PIN) clears any prior lockout", async () => {

        await pinService.set("8011122233", "1234");

        await expect(pinService.verify("8011122233", "0000")).rejects.toThrow();
        await expect(pinService.verify("8011122233", "0000")).rejects.toThrow();
        await expect(pinService.verify("8011122233", "0000")).rejects.toThrow("Locked for");

        await pinService.set("8011122233", "5678");

        await expect(
            pinService.verify("8011122233", "5678")
        ).resolves.toBe(true);

    });

});
