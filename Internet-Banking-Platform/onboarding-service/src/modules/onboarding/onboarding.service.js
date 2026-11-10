const crypto = require("node:crypto");

const repository = require("./onboarding.repository");

const {
    client: fineractClient,
    tenantProvisioner
} = require("../../integrations/fineract");

const mailClient = require("../../integrations/mail/mail.client");

const { CLASSES: CHART_OF_ACCOUNTS } = require("./chart-of-accounts.seed");

const { app: config, logger } = require("../../config");

/**
 * NGN first - every GemFi tenant is a Nigerian MFB - plus the other major
 * currencies a cross-border-capable bank is likely to need. USD is already
 * selected by default on a fresh Fineract tenant; included here anyway so
 * this list is the tenant's complete, final selection, not an add-on to an
 * assumed default.
 */
const MAJOR_CURRENCY_CODES = [
    "NGN",
    "USD",
    "EUR",
    "GBP",
    "KES",
    "ZAR",
    "JPY",
    "CNY",
    "INR"
];

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

        const request = await repository.create({

            companyName: payload.companyName,

            contactEmail: payload.contactEmail,

            contactPhone: payload.contactPhone,

            contactAddress: payload.contactAddress || null,

            logo: logo || null,

            primaryColor: payload.primaryColor,

            secondaryColor: payload.secondaryColor,

            subdomain,

            submittedBy,

            tier: payload.tier || "starter",

            institutionType: payload.institutionType || "bank",

            status: "pending"

        });

        await this._sendWelcomeEmail(request);

        return request;

    }

    /**
     * ======================================================
     * Welcome Email
     * ----------------------------------------------------------
     * Best-effort: the application is already saved by the
     * time this runs, so a mail-service hiccup shouldn't fail
     * the submission itself - it's logged and swallowed.
     * ======================================================
     */
    async _sendWelcomeEmail(request) {

        try {

            await mailClient.sendOnboardingWelcome({

                companyName: request.companyName,

                email: request.contactEmail,

                referenceId: request._id.toString(),

                statusUrl: `${config.mail.statusUrlBase}/${request._id}`

            });

        } catch (error) {

            logger.warn(

                {
                    error: { message: error.message },
                    requestId: request._id.toString()
                },

                "Failed to send onboarding welcome email."

            );

        }

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
     *
     * Also doubles as the Gateway's tenant-resolution source:
     * fineractTenantIdentifier lets the Gateway map a Host header
     * straight to a Fineract tenant without a second endpoint -
     * the frontend branding consumers simply ignore the extra
     * field.
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

            secondaryColor: request.secondaryColor,

            fineractTenantIdentifier: request.fineractTenantIdentifier,

            tier: request.tier,

            institutionType: request.institutionType

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

        /**
         * Every other field here is a one-time setup detail, locked once
         * a tenant goes live. Tier is different - it's an ongoing
         * subscription plan a tenant can upgrade/downgrade at any time,
         * not something that only makes sense before approval - so a
         * tier-only update is allowed regardless of status.
         */
        const payloadKeys = Object.keys(payload);
        const isTierOnlyChange =
            payloadKeys.length > 0 &&
            payloadKeys.every((key) => key === "tier");

        if (request.status !== "pending" && !isTierOnlyChange) {

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
            "chartOfAccountsConfirmed",
            "tier",
            "institutionType"
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

    /**
     * ======================================================
     * Admin: Enable / Disable
     * ----------------------------------------------------------
     * Toggles an already-provisioned tenant between active and
     * disabled. This is GEMFI's own status table, not Fineract's
     * - disabling never touches the underlying Fineract tenant,
     * it only flips the flag every request checks.
     * ======================================================
     */
    async setStatus(id, admin, status) {

        const request = await this.getById(id);

        if (request.status !== "active" && request.status !== "disabled") {

            throw new ConflictError(
                `Cannot change status of a request that is ${request.status}.`
            );

        }

        if (request.status === status) {

            throw new ConflictError(
                `Tenant is already ${status}.`
            );

        }

        return repository.update(id, {

            status,

            reviewedBy: admin.username,

            reviewedAt: new Date()

        });

    }

    /**
     * ======================================================
     * Admin: Approve
     * ----------------------------------------------------------
     * The real provisioning step: creates the Fineract tenant,
     * seeds its chart of accounts and roles, then flips this
     * request to active. Each stage is sequential and each
     * failure surfaces exactly which stage broke - there's no
     * automatic rollback of an already-created Fineract tenant,
     * since half-provisioning is recoverable (retry approve
     * again once the underlying issue is fixed; the Fineract-side
     * steps are safe to repeat) but silently deleting a tenant's
     * schema on a later-stage failure is not a step to take
     * without a human looking at it first.
     * ======================================================
     */
    async approve(id, admin) {

        const request = await this.getById(id);

        if (request.status !== "pending") {

            throw new ConflictError(
                `Cannot approve a request that is already ${request.status}.`
            );

        }

        if (!request.chartOfAccountsConfirmed) {

            throw new BusinessRuleError(
                "Chart of accounts must be confirmed before approval."
            );

        }

        const fineractTenantIdentifier =
            request.subdomain.replace(/-/g, "_");

        if (!tenantProvisioner.isValidIdentifier(fineractTenantIdentifier)) {

            throw new BusinessRuleError(
                "Subdomain cannot be turned into a valid Fineract tenant identifier."
            );

        }

        await tenantProvisioner.provisionTenant(

            fineractTenantIdentifier,

            request.companyName

        );

        /**
         * The new tenant's schema is empty until this first
         * authenticated call runs Liquibase migration.
         */
        await fineractClient.warmUp(fineractTenantIdentifier);

        /**
         * A fresh Fineract tenant only has USD selected by default -
         * every GemFi tenant needs NGN at minimum (Nigerian MFBs), plus a
         * handful of other major currencies so a tenant isn't blocked on
         * a manual Fineract config step before they can even pick a
         * currency for their first product.
         */
        await fineractClient.enableCurrencies(
            fineractTenantIdentifier,
            MAJOR_CURRENCY_CODES
        );

        await this._seedChartOfAccounts(fineractTenantIdentifier);

        await this._seedRoles(fineractTenantIdentifier, request.roles);

        return repository.update(id, {

            status: "active",

            fineractTenantIdentifier,

            reviewedBy: admin.username,

            reviewedAt: new Date()

        });

    }

    /**
     * ======================================================
     * Seed Chart Of Accounts
     * ----------------------------------------------------------
     * 1 header + 4 detail accounts per class. Headers are
     * created first since detail accounts reference their
     * header's resourceId as parentId.
     * ======================================================
     */
    async _seedChartOfAccounts(tenantIdentifier) {

        for (const glClass of CHART_OF_ACCOUNTS) {

            const header = await fineractClient.createGLAccount(

                tenantIdentifier,

                {

                    name: glClass.header,

                    glCode: glClass.code,

                    type: glClass.type,

                    usage: 2,

                    manualEntriesAllowed: true

                }

            );

            for (const [code, name] of glClass.details) {

                await fineractClient.createGLAccount(

                    tenantIdentifier,

                    {

                        name,

                        glCode: code,

                        type: glClass.type,

                        usage: 1,

                        manualEntriesAllowed: true,

                        parentId: header.resourceId

                    }

                );

            }

        }

    }

    /**
     * ======================================================
     * Seed Roles
     * ----------------------------------------------------------
     * Names only, no permissions yet - exact permission grants
     * per role are a still-open item in the onboarding plan.
     * ======================================================
     */
    async _seedRoles(tenantIdentifier, roles) {

        for (const role of roles) {

            await fineractClient.createRole(

                tenantIdentifier,

                {

                    name: role,

                    description: `Standard ${role} role, seeded at tenant onboarding.`

                }

            );

        }

    }

    /**
     * ======================================================
     * Admin: resolve an active tenant's Fineract identifier
     * ----------------------------------------------------------
     * Shared guard for the remote user/role management endpoints below -
     * only a fully-provisioned, active tenant has a real Fineract schema
     * to manage users/roles on.
     * ======================================================
     */
    async _requireActiveFineractTenant(id) {

        const request = await this.getById(id);

        if (request.status !== "active" || !request.fineractTenantIdentifier) {

            throw new BusinessRuleError(
                "This tenant has not been provisioned yet."
            );

        }

        return request.fineractTenantIdentifier;

    }

    /**
     * ======================================================
     * Admin: List tenant users
     * ----------------------------------------------------------
     * Lets GemFi staff manage a tenant's Fineract users remotely from the
     * admin console - the tenant's own portal only exposes this to
     * Enterprise-tier tenants (self-service); everyone else gets it done
     * for them from here.
     * ======================================================
     */
    async listTenantUsers(id) {

        const tenantIdentifier = await this._requireActiveFineractTenant(id);

        return fineractClient.listUsers(tenantIdentifier);

    }

    /**
     * ======================================================
     * Admin: Create a tenant user
     * ======================================================
     */
    async createTenantUser(id, payload) {

        const tenantIdentifier = await this._requireActiveFineractTenant(id);

        return fineractClient.createUser(tenantIdentifier, payload);

    }

    /**
     * ======================================================
     * Admin: List tenant roles
     * ----------------------------------------------------------
     * Backs the role picker alongside listTenantUsers/createTenantUser.
     * ======================================================
     */
    async listTenantRoles(id) {

        const tenantIdentifier = await this._requireActiveFineractTenant(id);

        return fineractClient.listRoles(tenantIdentifier);

    }

}

module.exports = new OnboardingService();
