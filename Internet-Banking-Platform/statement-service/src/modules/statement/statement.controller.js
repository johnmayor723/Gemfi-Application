const service = require("./statement.service");

const { success } = require("../../responses/api.response");

/**
 * Generate Statement
 */
const generate = async (req, res) => {

    const {
        accountNumber,
        startDate,
        endDate,
        format
    } = req.query;

    const result =
        await service.generate(req.user, {
            accountNumber,
            startDate,
            endDate,
            format:
                format === "csv" ? "csv" : "json"
        });

    if (result.format === "csv") {

        res.setHeader("Content-Type", "text/csv");

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="statement-${accountNumber}.csv"`
        );

        return res.status(200).send(result.content);

    }

    return success(res, {
        message: "Statement generated successfully.",
        data: result.content
    });

};

/**
 * Generate Statement (internal caller)
 *
 * Same as generate(), for callers gated by internalAuth instead
 * of a customer JWT (e.g. ussd-service). Always JSON - CSV export
 * only makes sense for the customer-facing download.
 */
const generateForInternalCaller = async (req, res) => {

    const {
        accountNumber,
        startDate,
        endDate,
        limit
    } = req.query;

    const result =
        await service.generateForInternalCaller({
            accountNumber,
            startDate,
            endDate,
            limit:
                limit ? Number(limit) : undefined
        });

    return success(res, {
        message: "Statement generated successfully.",
        data: result
    });

};

module.exports = {

    generate,

    generateForInternalCaller

};
