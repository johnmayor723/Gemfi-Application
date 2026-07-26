# Internet Banking Platform

## Project Status

This project is already architected.

The following services are COMPLETE:

- Account Service
- Auth Service structure (implementation in progress)
- Enrollment Module
- OTP Module
- Refresh Token Module

Do NOT redesign any existing architecture.

Your responsibility is implementation only.

---

# Architecture

Every service follows exactly this structure.

src/

    config/

    controllers/

    middleware/

    integrations/

    modules/

    routes/

    validators/

    responses/

    errors/

Every module contains

module.model.js

module.repository.js

module.service.js

module.controller.js

module.validator.js

module.routes.js

Repositories only access MongoDB.

Controllers contain no business logic.

Services contain all business logic.

# Summary

Controllers

Only receive requests.

Only call services.

Only return responses.

Repositories

Only access MongoDB.

Never contain business logic.

Services

Contain all business logic.

Models

Contain schemas only.

---

# Coding Standards

Use CommonJS.

Use async/await.

Node.js only.

No TypeScript.

No snippets.

Always regenerate the ENTIRE file when modifying a file.

Never leave TODOs.

Never return placeholders.

Never redesign existing architecture.

Preserve comments and formatting.

---

# API Response

Every endpoint returns

{
    "success": true,
    "message": "",
    "data": {},
    "meta": {
        "timestamp": ""
    }
}

---

# Security

Use

Helmet

express-rate-limit

express-mongo-sanitize

hpp

JWT

Argon2

Refresh Tokens

Never store plaintext passwords.

---

# Service Communication

Microservices communicate only through REST.

Never access another service's database.

Never bypass service boundaries.

---

# Current Priority

Finish Auth Service.

After Auth Service passes testing, begin implementing remaining services 
using the Banking Template.

Do not create new architectures.

Reuse the Banking Template exactly.

-----

# Implementation 

Whenever asked to implement a feature

Step 1

Read every related file.

Step 2

Understand dependencies.

Step 3

Identify missing implementations.

Step 4

Implement.

Step 5

Check compilation.

Step 6

Suggest tests.

Never skip steps.

----------

# Modification 

When modifying a file

Never return snippets.

Always regenerate the complete file.

Preserve formatting.

Preserve comments.

Do not rename methods unless necessary.

Do not rename folders.

Do not redesign architecture.

---

# New Implementations

Every new microservice must be created from Banking Template.

Never invent folder structures.

Never invent middleware.

Never invent logging.

Never invent configuration.

Only implement business logic.

----

# Debugging 

When fixing bugs

Read every imported file.

Read every importing file.

Understand the entire execution flow.

Fix the root cause.

Never patch symptoms.

-----

# Code Review

Before returning code verify

No missing imports

No duplicate methods

No unused methods

No dead code

No circular dependencies

No inconsistent naming

No compilation issues

----

# Testing 

After completing a feature

Review

Validators

Routes

Controllers

Services

Repositories

Models

Environment Variables

Dependencies

Only then generate tests.


# Important !!!

Never optimise prematurely.

Never redesign working code.

Never change architecture without approval.

Never introduce new libraries without approval.

Never change public APIs without approval.

Never create placeholder code.

Never leave TODOs.

Never use pseudo-code.

Return production-ready code only.


# Defination of Done 

The code compiles without errors.

Imports are clean and there are no unused dependencies.

Validators, routes, controllers, services, repositories, and models are all consistent.

Configuration comes from environment variables.

Error handling follows the project standard.

New functionality includes or is accompanied by appropriate tests.

Existing architecture has not been altered without approval.

