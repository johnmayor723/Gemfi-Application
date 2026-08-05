const PinCredential = require("./pin.model");

class PinRepository {

    async findByAccountNumber(accountNumber) {

        return PinCredential.findOne({
            accountNumber
        });

    }

    async existsByAccountNumber(accountNumber) {

        const count =
            await PinCredential.countDocuments({
                accountNumber
            });

        return count > 0;

    }

    /**
     * Create or replace the PIN credential for an account -
     * covers both first-time enrollment and a later change-PIN
     * flow. Always clears attempts/lockedUntil, since setting a
     * new PIN should never inherit a prior lockout.
     */
    async upsert(accountNumber, pinHash) {

        return PinCredential.findOneAndUpdate(
            { accountNumber },
            {
                accountNumber,
                pinHash,
                attempts: 0,
                lockedUntil: null,
                setAt: new Date()
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

    }

    async incrementAttempts(id) {

        return PinCredential.findByIdAndUpdate(
            id,
            { $inc: { attempts: 1 } },
            { new: true }
        );

    }

    async lock(id, lockedUntil) {

        return PinCredential.findByIdAndUpdate(
            id,
            { lockedUntil },
            { new: true }
        );

    }

    async resetAttempts(id) {

        return PinCredential.findByIdAndUpdate(
            id,
            { attempts: 0, lockedUntil: null },
            { new: true }
        );

    }

}

module.exports = new PinRepository();
