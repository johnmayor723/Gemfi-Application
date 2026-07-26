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

module.exports = {

    generate

};
