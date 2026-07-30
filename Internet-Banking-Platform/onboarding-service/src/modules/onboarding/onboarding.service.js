const crypto = require("node:crypto");

const repository = require("./onboarding.repository");

const {
    NotFoundError,
    ConflictError,
    BusinessRuleError
} = require("../../errors");

/**
 * Derive a URL-safe subdomain from a company name:
 * lowercase, non-alphanumeric runs collapsed to a single
 * hyphen, leading/trailing hyphens trimmed. Collisions get a
 * short random suffix appended - slugification/collision
 * rules are flagged as still-open in the plan, this is a
 * working default, not a final policy.
 */
function slugify(companyName) {

    const base = companyName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    if (!base) {

        throw new BusinessRuleError(
            "Company name must contain at least one letter or digit."
        );

    }

    return base;

}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function assertValidColors(primaryColor, secondaryColor) {

    if (!HEX_COLOR.test(primaryColor)) {

        throw new BusinessRuleError(
            "primaryColor must be a 6-digit hex color, e.g. #5B4A8F."
        );

    }

    if (!HEX_COLOR.test(secondaryColor)) {

        throw new BusinessRuleError(
            "secondaryColor must be a 6-digit hex color, e.g. #E3DDF0."
        );

    }

}

class OnboardingService {

    /**
     * ======================================================
     * Submit
     * ----------------------------------------------------------
     * Shared by both the public client-facing submission and
     * the admin blank-start path - only submittedBy differs.
     * ======================================================
     */
    async submit(payload, submittedBy, logo) {

        assertValidColors(payload.primaryColor, payload.secondaryColor);

        let subdomain = slugify(payload.companyName);

        if (await repository.existsBySubdomain(subdomain)) {

            subdomain = `${subdomain}-${crypto.randomBytes(2).toString("hex")}`;

        }

        return repository.create({

            companyName: payload.companyName,

            contactEmail: payload.contactEmail,

            contactPhone: payload.contactPhone,

            contactAddress: payload.contactAddress || null,

            logo: logo || null,

            primaryColor: payload.primaryColor,

            secondaryColor: payload.secondaryColor,

            subdomain,

            submittedBy,

            status: "pending"

        });

    }

    /**
     * ======================================================
     * Client Status Check
     * ----------------------------------------------------------
     * Deliberately returns a narrow view - a prospective
     * client checking on their own submission doesn't need
     * (and shouldn't see) internal review fields.
     * ======================================================
     */
    async getPublicStatus(id) {

        const request = await repository.findById(id);

        if (!request) {

            throw new NotFoundError(
                "Onboarding request not found."
            );

        }

        return {

            id: request._id,

            companyName: request.companyName,

            subdomain: request.subdomain,

            status: request.status,

            rejectionReason: request.rejectionReason

        };

    }

    /**
     * ======================================================
     * Branding
     * ----------------------------------------------------------
     * Public, read-only. Only ever returns data for an active
     * tenant - pending/rejected/disabled all 404, same as an
     * unknown subdomain, so this can't be used to probe the
     * pending queue.
     * ======================================================
     */
    async getBranding(subdomain) {

        const request = await repository.findActiveBySubdomain(subdomain);

        if (!request) {

            throw new NotFoundError(
                "No active tenant for this subdomain."
            );

        }

        return {

            companyName: request.companyName,

            logoUrl: request.logo
                ? `/onboarding/requests/${request._id}/logo`
                : null,

            primaryColor: request.primaryColor,

            secondaryColor: request.secondaryColor

        };

    }

    /**
     * ======================================================
     * Logo
     * ----------------------------------------------------------
     * Public - the logo itself carries no sensitive data, and
     * gating it behind auth would defeat the point of serving
     * it to the portal/connect apps at boot.
     * ======================================================
     */
    async getLogo(id) {

        const request = await repository.findById(id);

        if (!request || !request.logo) {

            throw new NotFoundError(
                "Logo not found."
            );

        }

        return request.logo;

    }

    /**
     * ======================================================
     * Admin: List
     * ======================================================
     */
    async list(status) {

        return repository.findAll({ status });

    }

    /**
     * ======================================================
     * Admin: Detail
     * ======================================================
     */
    async getById(id) {

        const request = await repository.findById(id);

        if (!request) {

            throw new NotFoundError(
                "Onboarding request not found."
            );

        }

        return request;

    }

    /**
     * ======================================================
     * Admin: Edit
     * ----------------------------------------------------------
     * Extends/corrects a request before approval. Deliberately
     * does not allow changing status here - approve/reject are
     * their own dedicated actions with their own side effects.
     * ======================================================
     */
    async update(id, payload) {

        const request = await this.getById(id);

        if (request.status !== "pending") {

            throw new ConflictError(
                `Cannot edit a request that is already ${request.status}.`
            );

        }

        if (payload.primaryColor || payload.secondaryColor) {

            assertValidColors(

                payload.primaryColor || request.primaryColor,

                payload.secondaryColor || request.secondaryColor

            );

        }

        const updates = {};

        [
            "companyName",
            "contactEmail",
            "contactPhone",
            "contactAddress",
            "primaryColor",
            "secondaryColor",
            "roles",
            "chartOfAccountsConfirmed"
        ].forEach((field) => {

            if (payload[field] !== undefined) {

                updates[field] = payload[field];

            }

        });

        return repository.update(id, updates);

    }

    /**
     * ======================================================
     * Admin: Reject
     * ======================================================
     */
    async reject(id, admin, reason) {

        const request = await this.getById(id);

        if (request.status !== "pending") {

            throw new ConflictError(
                `Cannot reject a request that is already ${request.status}.`
            );

        }

        return repository.update(id, {

            status: "rejected",

            reviewedBy: admin.username,

            reviewedAt: new Date(),

            rejectionReason: reason || null

        });

    }

}

module.exports = new OnboardingService();
