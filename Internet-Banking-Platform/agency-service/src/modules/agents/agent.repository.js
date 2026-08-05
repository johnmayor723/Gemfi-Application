const Agent = require("./agent.model");

class AgentRepository {

    /**
     * Create a new agent application.
     */
    async create(data) {

        return Agent.create(data);

    }

    /**
     * Find by Mongo _id.
     */
    async findById(id) {

        return Agent.findById(id);

    }

    /**
     * List agents, optionally filtered by status/agentType/
     * parentAgentId.
     */
    async find(filter) {

        return Agent.find(filter)
            .sort({
                createdAt: -1
            });

    }

    /**
     * Update by Mongo _id.
     */
    async updateById(id, update) {

        return Agent.findByIdAndUpdate(

            id,

            update,

            {
                new: true,
                runValidators: true
            }

        );

    }

}

module.exports = new AgentRepository();
