const { body } = require("../../../validators");

const AGENT_TYPES = [
    "SUPER_AGENT",
    "AGENT"
];

const BUSINESS_TYPES = [
    "SOLE_PROPRIETORSHIP",
    "LIMITED_LIABILITY",
    "PARTNERSHIP",
    "NGO",
    "OTHER"
];

module.exports = [

    body("agentType")
        .trim()
        .notEmpty()
        .withMessage("Agent type is required.")
        .isIn(AGENT_TYPES)
        .withMessage(
            `Agent type must be one of ${AGENT_TYPES.join(", ")}.`
        ),

    body("parentAgentId")
        .optional({ checkFalsy: true })
        .trim()
        .isMongoId()
        .withMessage("Parent agent ID must be a valid identifier."),

    body("businessName")
        .trim()
        .notEmpty()
        .withMessage("Business name is required."),

    body("tradingName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Trading name cannot be empty."),

    body("registrationNumber")
        .trim()
        .notEmpty()
        .withMessage("Registration number is required."),

    body("businessType")
        .trim()
        .notEmpty()
        .withMessage("Business type is required.")
        .isIn(BUSINESS_TYPES)
        .withMessage(
            `Business type must be one of ${BUSINESS_TYPES.join(", ")}.`
        ),

    body("contactName")
        .trim()
        .notEmpty()
        .withMessage("Contact name is required."),

    body("contactEmail")
        .trim()
        .notEmpty()
        .withMessage("Contact email is required.")
        .isEmail()
        .withMessage("Invalid contact email address.")
        .normalizeEmail(),

    body("contactPhone")
        .trim()
        .notEmpty()
        .withMessage("Contact phone is required.")
        .matches(/^[0-9]{10,15}$/)
        .withMessage("Invalid contact phone number."),

    body("address")
        .trim()
        .notEmpty()
        .withMessage("Address is required."),

    /**
     * Hierarchy shape rule: a SUPER_AGENT must not carry a
     * parentAgentId, an AGENT must supply one. Which parentAgentId
     * actually resolves to a super-agent is validated in
     * agent.service.js createApplication - a self-contained
     * lookup within agency-service's own repository, not
     * expressible here.
     */
    body().custom((value) => {

        if (value.agentType === "AGENT" && !value.parentAgentId) {

            throw new Error(
                "parentAgentId is required when agentType is AGENT."
            );

        }

        if (value.agentType === "SUPER_AGENT" && value.parentAgentId) {

            throw new Error(
                "parentAgentId must not be provided when agentType is SUPER_AGENT."
            );

        }

        return true;

    })

];
