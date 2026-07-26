# Internet Banking Platform Architecture

Version: 1.0.0

---

# Overview

The Internet Banking Platform is a collection of independent microservices 
built on Node.js and MongoDB that provide digital banking functionality 
while integrating with Apache Fineract through dedicated internal 
services.

The platform is designed around the following principles:

- Microservice Architecture
- Service Independence
- REST Communication
- Security First
- High Maintainability
- Consistent Coding Standards
- Production Readiness

Each microservice owns its own database collections and business logic.

No service may directly access another service's database.

All communication between services must occur through REST APIs.

---

# Existing Services

The following services already exist.

## Account Service

Responsibilities

- External Account Number Mapping
- Account Lookup
- Account Ownership Validation
- Client Mapping
- Fineract Account Resolution

Status

Production Ready

---

## Auth Service

Responsibilities

- Registration
- Login
- JWT Authentication
- Refresh Tokens
- Password Management
- Session Management

Status

Implementation Complete (Pending Testing)

---

## Banking Template

Purpose

This is the canonical template for every new microservice.

No new service should create its own architecture.

Every future service must be created by cloning this template.

---

# Future Services

Services will be implemented in this order.

1. Beneficiary Service

2. Transfer Service

3. Notification Service

4. Transaction Service

5. Statement Service

6. Profile Service

7. Device Service

8. Audit Service

9. Reporting Service

10. Administration Service

---

# Standard Service Structure

Every service must follow exactly this structure.

```
src/

    config/

    controllers/

    errors/

    integrations/

    middleware/

    modules/

    responses/

    routes/

    utils/

    validators/

    server.js
```

---

# Standard Module Structure

Every module must contain

```
module.model.js

module.repository.js

module.service.js

module.controller.js

module.validator.js

module.routes.js
```

No exceptions.

---

# Layer Responsibilities

## Controllers

Controllers are responsible for

- Reading Request
- Calling Service
- Returning Response

Controllers must never

- Query MongoDB
- Call Mongoose
- Contain Business Logic

---

## Services

Services contain

All Business Logic.

Services may

- Validate Business Rules
- Call Repositories
- Call Other Services
- Generate Tokens
- Generate OTPs

Services must never

- Return HTTP Responses

---

## Repositories

Repositories are responsible only for

MongoDB Operations

Repositories may

- Query Collections
- Update Documents
- Delete Documents

Repositories must never

- Call HTTP APIs
- Generate Tokens
- Validate Business Rules

---

## Models

Models define

MongoDB Schemas

Indexes

Relationships

Nothing else.

---

# API Response Standard

Every successful response must follow

```json
{
    "success": true,
    "message": "Operation completed successfully.",
    "data": {},
    "meta": {
        "timestamp": ""
    }
}
```

Errors are handled centrally.

Controllers should never manually build error responses.

---

# Authentication Flow

```
Login

↓

Validate User

↓

Verify Password

↓

Issue Access Token

↓

Issue Refresh Token

↓

Return Tokens
```

---

# Registration Flow

```
Enrollment

↓

Validate Account Ownership

↓

Generate Email OTP

↓

Generate SMS OTP

↓

Verify Both OTPs

↓

Create Username

↓

Create Password

↓

Create Auth User

↓

Issue Access Token

↓

Issue Refresh Token
```

---

# Refresh Token Flow

```
Receive Refresh Token

↓

Validate

↓

Rotate Refresh Token

↓

Generate New Access Token

↓

Return New Tokens
```

---

# Logout Flow

```
Receive Refresh Token

↓

Revoke Refresh Token

↓

Logout Complete
```

---

# Password Reset Flow

```
Forgot Password

↓

Generate OTP

↓

Verify OTP

↓

Reset Password

↓

Invalidate Sessions

↓

Login Again
```

---

# Service Communication

Every service communicates through REST.

Example

```
Transfer Service

↓

Account Service

↓

Notification Service

↓

Transaction Service
```

No service may directly access another service's MongoDB collections.

---

# Security Standards

Every service must implement

Helmet

CORS

Rate Limiting

Mongo Sanitization

HPP Protection

JWT Authentication

Refresh Token Rotation

Argon2 Password Hashing

Request Validation

Centralized Error Handling

Audit Logging

---

# Logging

Every service must use

Pino

Morgan (Development)

Sensitive information must never be logged.

Never log

Passwords

JWTs

Refresh Tokens

OTP Codes

Secret Keys

---

# Validation

All incoming requests must use

express-validator

Validation belongs in validators.

Business validation belongs in services.

---

# Error Handling

Every service must use centralized error middleware.

Never wrap controllers with try/catch unless required.

Throw custom errors from services.

---

# Environment Variables

Every endpoint, secret and integration URL must come from environment 
variables.

Never hardcode

URLs

Secrets

JWT Keys

Timeouts

Credentials

---

# Database

Each microservice owns its own MongoDB collections.

No shared collections.

No shared repositories.

---

# REST Standards

Use

GET

POST

PUT

PATCH

DELETE

appropriately.

Avoid action-based URLs.

Example

Good

```
POST /auth/login

POST /auth/register

GET /beneficiaries

POST /transfers
```

Avoid

```
POST /loginUser

POST /makeTransferNow
```

---

# Naming Standards

Files

lowercase

kebab-case

Classes

PascalCase

Variables

camelCase

Constants

UPPER_SNAKE_CASE

---

# Code Standards

Use CommonJS.

Use async/await.

Never use callbacks.

Never use TypeScript.

Never use placeholders.

Never leave TODO comments.

Always return complete files.

Never regenerate an entire service when only one file changes.

Modify only the required files.

---

# Testing

Every service must include

Jest

Supertest

mongodb-memory-server

Test

Happy Paths

Validation Failures

Authentication Failures

Authorization Failures

Repository Failures

Edge Cases

---

# Internent Banking Template

The Internet Banking Template is the canonical implementation for infrastructure.

Every new service must be created from the Banking Template.

Do not redesign middleware.

Do not redesign logging.

Do not redesign configuration.

Do not redesign routing.

Implement only business logic.

---

# Source of Truth

When implementing or modifying any service, the following precedence 
applies:

1. ARCHITECTURE.md (this document)
2. Banking Template
3. Existing Production Services (Account Service and Auth Service)

If there is any conflict, follow the highest-precedence item unless 
explicitly instructed otherwise.

No deviations from this architecture are permitted without explicit 
approval.
