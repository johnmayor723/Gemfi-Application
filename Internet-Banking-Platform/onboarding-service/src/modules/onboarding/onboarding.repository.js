const OnboardingRequest = require("./onboarding.model");

class OnboardingRepository {

    /**
     * Create a new onboarding request.
     */
    async create(data) {

        return OnboardingRequest.create(data);

    }

    /**
     * Find by MongoDB id.
     */
    async findById(id) {

        return OnboardingRequest.findById(id);

    }

    /**
     * Find by subdomain, regardless of status.
     */
    async findBySubdomain(subdomain) {

        return OnboardingRequest.findOne({ subdomain });

    }

    /**
     * Find an active tenant by subdomain - used by the public
     * branding endpoint.
     */
    async findActiveBySubdomain(subdomain) {

        return OnboardingRequest.findOne({

            subdomain,

            status: "active"

        });

    }

    /**
     * Check whether a subdomain is already taken.
     */
    async existsBySubdomain(subdomain) {

        return OnboardingRequest.exists({ subdomain });

    }

    /**
     * List, optionally filtered by status, newest first.
     */
    async findAll({ status } = {}) {

        const filter = status ? { status } : {};

        return OnboardingRequest.find(filter)
            .sort({ createdAt: -1 });

    }

    /**
     * Update by id, returning the updated document.
     */
    async update(id, data) {

        return OnboardingRequest.findByIdAndUpdate(

            id,

            data,

            {

                new: true,

                runValidators: true

            }

        );

    }

}

module.exports = new OnboardingRepository();
