exports.health = (req, res) => {

    res.status(200).json({

        status: "ok",

        service: "kyc-service",

        version: "1.0.0"

    });

};