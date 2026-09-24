# Task Management System

A modular, backend-first Task Management System built with **NestJS, TypeScript, PostgreSQL, Prisma, JWT, Passport, Redis, Socket.IO, Cloudinary, and Nodemailer**.

The system is designed around teams, members, granular permissions, task groups, tasks, comments, attachments, authentication, refresh-token sessions, public sharing, auditability, caching, and real-time communication.

## Table of Contents

- [Overview](#overview)
- [Key Capabilities](#key-capabilities)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Architecture Principles](#architecture-principles)
- [Project Structure](#project-structure)
- [Application Modules](#application-modules)
- [Authentication and Authorization](#authentication-and-authorization)
- [Multi-Device Session Management](#multi-device-session-management)
- [Role-Based Access Control](#role-based-access-control)
- [Team Management](#team-management)
- [Task Groups](#task-groups)
- [Tasks](#tasks)
- [Task Assignment](#task-assignment)
- [Comments](#comments)
- [Attachments](#attachments)
- [Public Sharing](#public-sharing)
- [Audit Logging](#audit-logging)
- [Caching and Redis](#caching-and-redis)
- [Real-Time Infrastructure](#real-time-infrastructure)
- [Email Infrastructure](#email-infrastructure)
- [Cloudinary Integration](#cloudinary-integration)
- [Validation and Error Handling](#validation-and-error-handling)
- [Database Design](#database-design)
- [Prisma and Database Migrations](#prisma-and-database-migrations)
- [API Documentation](#api-documentation)
- [Environment Configuration](#environment-configuration)
- [Installation and Setup](#installation-and-setup)
- [Running the Application](#running-the-application)
- [Build and Verification](#build-and-verification)
- [Testing](#testing)
- [Development Workflow](#development-workflow)
- [Authentication Flow](#authentication-flow)
- [Refresh Token Rotation Flow](#refresh-token-rotation-flow)
- [Multi-Device Authentication Flow](#multi-device-authentication-flow)
- [API Route Overview](#api-route-overview)
- [Security Considerations](#security-considerations)
- [Current Implementation Status](#current-implementation-status)
- [Conclusion](#conclusion)

# Overview

The Task Management System is a backend application intended to provide a structured environment for managing:

- Users
- Teams
- Team memberships
- Team roles
- Granular permissions
- Team invitations
- Task groups
- Tasks
- Task assignments
- Comments
- Nested comments
- Comment likes
- File attachments
- Public task and task-group sharing
- Authentication
- OAuth authentication
- Refresh-token sessions
- Multi-device sessions
- Audit logs
- Redis-based caching
- Real-time communication

The backend follows a modular NestJS architecture and uses Prisma as the database access layer over PostgreSQL.

The system is designed so that the frontend can consume the backend through REST APIs while real-time functionality can be provided through the existing Socket.IO infrastructure.

# Key Capabilities

## Authentication

The system supports:

- Email/password authentication
- JWT access tokens
- Refresh tokens
- Refresh-token hashing
- Refresh-token rotation
- Refresh-session persistence
- Refresh-session revocation
- Session expiration
- Device identification
- IP address tracking
- Google OAuth
- GitHub OAuth
- Authenticated user endpoint
- Logout functionality

## Authorization

The authorization system supports:

- System-level roles
- Team-level roles
- Feature-based permissions
- Permission-based guards
- Role-based guards
- Team membership validation

System roles:

- `OWNER`
- `USER`

Team roles:

- `ADMIN`
- `MEMBER`

## Team Management

Teams provide the organizational boundary for task management.

Supported functionality includes:

- Team creation
- Team lookup
- Team members
- Team roles
- Member role updates
- Team invitations
- Invitation acceptance
- Team-level permissions

## Task Management

The task system supports:

- Task creation
- Task retrieval
- Task updates
- Task deletion
- Task status
- Task priority
- Due dates
- Task assignments
- Multiple assignees
- Task groups
- Public task sharing

Task statuses:

- `TODO`
- `IN_PROGRESS`
- `REVIEW`
- `DONE`

## Collaboration

The system provides collaborative functionality through:

- Comments
- Nested comments
- Comment likes
- Attachments
- Real-time infrastructure
- Public sharing
- Audit logs

# Technology Stack

| Technology | Purpose |
|---|---|
| NestJS | Backend application framework |
| TypeScript | Application programming language |
| PostgreSQL | Relational database |
| Prisma | ORM and database access layer |
| JWT | Access-token authentication |
| Passport | Authentication strategies |
| bcrypt | Password hashing |
| Redis | Cache/session-related infrastructure |
| Socket.IO | Real-time communication |
| Cloudinary | File storage |
| Nodemailer | Email delivery |
| Swagger | API documentation |
| Jest | Testing |
| Supertest | HTTP/API testing |
| Docker | Development/deployment support |
| ESLint | Code quality |
| Prettier | Code formatting |

# System Architecture

The application follows a modular layered architecture.

The general request flow is:

```text
Client
  |
  v
Controller
  |
  v
Guard / Validation
  |
  v
Service
  |
  v
Repository
  |
  v
Prisma
  |
  v
PostgreSQL
````

External services are integrated where required:

```text
                         +------------------+
                         |     Frontend     |
                         +--------+---------+
                                  |
                                  v
                         +------------------+
                         |    NestJS API    |
                         +--------+---------+
                                  |
              +-------------------+-------------------+
              |                   |                   |
              v                   v                   v
        Authentication       Authorization        Validation
              |                   |                   |
              +-------------------+-------------------+
                                  |
                                  v
                              Services
                                  |
                                  v
                            Repositories
                                  |
                                  v
                               Prisma
                                  |
                                  v
                            PostgreSQL


External Infrastructure:

NestJS
  |
  +---- Redis
  |
  +---- Cloudinary
  |
  +---- SMTP / Nodemailer
  |
  +---- Socket.IO
  |
  +---- Google OAuth
  |
  +---- GitHub OAuth
```

# Architecture Principles

The backend follows several important architectural principles.

## Modular Design

Each major business domain is separated into its own NestJS module.

Examples:

* Auth
* Users
* Teams
* Task Groups
* Tasks
* Comments
* Attachments
* Mail
* Cloudinary
* Realtime
* Cache

This keeps the codebase maintainable and allows individual domains to evolve independently.

## Controller Layer

Controllers are responsible for:

* Receiving HTTP requests
* Validating route parameters
* Receiving DTOs
* Applying guards
* Calling services
* Returning service responses

Controllers should not contain business logic.

## Service Layer

Services contain business logic.

Examples:

* Authentication logic
* Token generation
* Team management
* Task creation
* Permission validation
* Sharing logic
* Attachment processing

## Repository Layer

Repositories isolate database access from business logic.

The intended flow is:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Prisma
    ↓
PostgreSQL
```

This makes database access easier to maintain and test.

# Project Structure

The main source structure is organized approximately as follows:

```text
src/
│
├── app.module.ts
├── main.ts
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── controllers/
│   ├── dto/
│   ├── guards/
│   ├── interfaces/
│   ├── repositories/
│   └── strategies/
│
├── users/
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   ├── controllers/
│   └── dto/
│
├── teams/
│   ├── teams.module.ts
│   ├── controllers/
│   ├── decorators/
│   ├── dto/
│   ├── guards/
│   ├── repositories/
│   └── services/
│
├── task-groups/
│   ├── task-groups.module.ts
│   ├── controllers/
│   ├── dto/
│   ├── repositories/
│   └── services/
│
├── tasks/
│   ├── tasks.module.ts
│   ├── controllers/
│   ├── dto/
│   ├── repositories/
│   └── services/
│
├── comments/
│   ├── comments.module.ts
│   ├── controllers/
│   ├── dto/
│   ├── repositories/
│   └── services/
│
├── attachments/
│   ├── attachments.module.ts
│   ├── controllers/
│   ├── repositories/
│   └── services/
│
├── cloudinary/
│   ├── cloudinary.module.ts
│   └── cloudinary.service.ts
│
├── mail/
│   ├── mail.module.ts
│   └── mail.service.ts
│
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
└── common/
    ├── cache/
    ├── config/
    ├── enums/
    ├── pipes/
    ├── realtime/
    ├── realtime-contract/
    └── utils/
```

# Application Modules

The root application module currently wires the major application modules together.

The application includes:

* `PrismaModule`
* `UsersModule`
* `AuthModule`
* `MailModule`
* `TeamsModule`
* `TaskGroupsModule`
* `TasksModule`
* `CloudinaryModule`
* `AttachmentsModule`
* `CommentsModule`
* `CacheModule`
* `RealtimeModule`

# Authentication and Authorization

Authentication is implemented using JWT and Passport.

The authentication system supports:

```text
Local Login
    |
    +---- Access Token
    |
    +---- Refresh Token
              |
              v
        RefreshSession
```

OAuth authentication is supported through:

* Google
* GitHub

## Local Authentication

The login process is:

```text
POST /auth/login
        |
        v
Validate email/password
        |
        v
Find user
        |
        v
Compare password using bcrypt
        |
        v
Create refresh session
        |
        v
Create JWT access token
        |
        v
Return access + refresh tokens
```

## Password Security

Passwords are never stored in plaintext.

Passwords are hashed using `bcrypt`.

The authentication service compares the provided password against the stored password hash.

# JWT Access Tokens

The JWT contains information such as:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "systemRole": "USER",
  "sessionId": "refresh-session-id"
}
```

The `sessionId` associates the access token with the refresh session that created it.

This enables session-aware authentication.

# Refresh Tokens

Refresh tokens are randomly generated using cryptographically secure random bytes.

The raw refresh token is returned to the client.

Only its SHA-256 hash is stored in PostgreSQL.

The process is:

```text
Generate refresh token
        |
        v
Hash token using SHA-256
        |
        v
Store token hash
        |
        v
Return raw token to client
```

The raw refresh token is never stored in the database.

# Refresh Token Rotation

Refresh tokens are rotated when they are used.

The existing refresh session is atomically consumed.

The session is marked as revoked.

A new refresh session is then created.

This prevents the same refresh token from being successfully reused concurrently.

The repository uses an atomic update operation to ensure that only one request can successfully consume a refresh session.

# Multi-Device Session Management

The system supports independent refresh sessions for different devices.

Each refresh session can contain:

```text
deviceId
ipAddress
expiresAt
revokedAt
userId
tokenHash
```

The Prisma model contains:

```text
RefreshSession
├── id
├── tokenHash
├── userId
├── deviceId
├── ipAddress
├── expiresAt
├── revokedAt
└── createdAt
```

Both `deviceId` and `ipAddress` are optional at the database level.

Indexes are maintained for:

* `userId`
* `deviceId`
* `expiresAt`

This allows the same user to maintain independent authenticated sessions.

For example:

```text
User
 |
 +---- Device A
 |       |
 |       +---- RefreshSession A
 |
 +---- Device B
         |
         +---- RefreshSession B
```

Revoking one refresh session does not automatically revoke another independent refresh session.

# Role-Based Access Control

Authorization is implemented at multiple levels.

## System Roles

The system defines:

```text
OWNER
USER
```

## Team Roles

Teams define:

```text
ADMIN
MEMBER
```

## Permission Model

The permission architecture is:

```text
Feature
   |
   +---- Permission
             |
             +---- TeamMemberPermission
                       |
                       +---- TeamMember
```

The database therefore separates:

* Features
* Permissions
* Team members
* Team-specific permission assignments

Examples of permission keys used by the task system include:

```text
task:create
task:view
task:update
task:assign
task:delete

task_group:create
task_group:view
task_group:update
task_group:delete
```

## Guards

The authorization system uses:

* `JwtAuthGuard`
* `RolesGuard`
* `PermissionsGuard`

Decorators are used to declare required permissions and roles.

Example:

```text
@Permissions('task:create')
```

or:

```text
@Roles(TeamRole.ADMIN)
```

# Team Management

Teams act as the primary organizational boundary.

A team contains:

* Team information
* Members
* Roles
* Permissions
* Invitations
* Task groups

The team membership relation ensures that a user can belong to multiple teams.

A user/team pair is unique.

## Team Endpoints

The implemented team controller includes operations such as:

```text
POST   /teams
GET    /teams/:teamId
PATCH  /teams/:teamId/members/:memberId/role
```

Team endpoints require JWT authentication.

Role-sensitive operations use the team role guard.

# Team Invitations

The system includes a dedicated team invitation model.

An invitation contains:

```text
id
email
role
tokenHash
teamId
expiresAt
acceptedAt
createdAt
```

Invitation tokens are stored as hashes.

The invitation system includes controllers for:

* Creating invitations
* Accepting invitations

# Task Groups

Task groups organize tasks inside teams.

The relationship is:

```text
Team
 |
 +---- TaskGroup
          |
          +---- Task
          +---- Task
          +---- Task
```

Task groups support:

* Creation
* Retrieval
* Update
* Deletion
* Public sharing
* Share revocation

## Task Group Endpoints

Implemented route patterns include:

```text
POST   /teams/:teamId/task-groups
GET    /teams/:teamId/task-groups
GET    /teams/:teamId/task-groups/:groupId
PATCH  /teams/:teamId/task-groups/:groupId
DELETE /teams/:teamId/task-groups/:groupId

POST   /teams/:teamId/task-groups/:groupId/share
DELETE /teams/:teamId/task-groups/:groupId/share
```

These endpoints are protected by JWT authentication and permission guards.

# Tasks

Tasks belong to task groups.

A task contains:

```text
id
title
description
status
priority
groupId
dueDate
shareTokenHash
shareExpiresAt
isPublic
createdAt
updatedAt
```

## Task Status

The supported task statuses are:

```text
TODO
IN_PROGRESS
REVIEW
DONE
```

## Task Endpoints

Implemented route patterns include:

```text
POST   /teams/:teamId/task-groups/:groupId/tasks

GET    /teams/:teamId/task-groups/:groupId/tasks

GET    /teams/:teamId/task-groups/:groupId/tasks/:taskId

PATCH  /teams/:teamId/task-groups/:groupId/tasks/:taskId

DELETE /teams/:teamId/task-groups/:groupId/tasks/:taskId

PUT    /teams/:teamId/task-groups/:groupId/tasks/:taskId/assignees

POST   /teams/:teamId/task-groups/:groupId/tasks/:taskId/share

DELETE /teams/:teamId/task-groups/:groupId/tasks/:taskId/share
```

Each operation requires the relevant permission.

# Task Assignment

Tasks support multiple assignees.

The relationship is:

```text
Task
 |
 +---- TaskAssignee
          |
          +---- User
```

The same user can be assigned to multiple tasks.

A task can also have multiple users assigned to it.

The task assignment relation uses a composite primary key:

```text
(taskId, userId)
```

# Comments

The system includes a dedicated comments module.

Comments belong to tasks and users.

The database supports nested comments through a self-referencing relationship.

The structure is:

```text
Task
 |
 +---- Comment
        |
        +---- Comment
        |      |
        |      +---- Comment
        |
        +---- Comment
```

Comments support:

* Task-level comments
* Nested replies
* Comment authors
* Comment likes

# Comment Likes

Users can like comments.

The relation prevents the same user from liking the same comment multiple times through:

```text
unique(commentId, userId)
```

# Attachments

Tasks support file attachments.

An attachment contains:

```text
id
url
publicId
mimeType
size
taskId
createdAt
```

The application uses Cloudinary for external file storage.

The database stores the Cloudinary URL and public identifier required for file management.

## Attachment Endpoints

Implemented route patterns include:

```text
POST   /teams/:teamId/task-groups/:groupId/tasks/:taskId/attachments

GET    /teams/:teamId/task-groups/:groupId/tasks/:taskId/attachments

GET    /teams/:teamId/task-groups/:groupId/tasks/:taskId/attachments/:attachmentId

DELETE /teams/:teamId/task-groups/:groupId/tasks/:taskId/attachments/:attachmentId
```

Uploads use multipart form data with the field:

```text
file
```

# Public Sharing

Tasks and task groups support public sharing.

Both models contain:

```text
shareTokenHash
shareExpiresAt
isPublic
```

The system therefore supports shareable resources without exposing the original private authentication/session tokens.

Sharing can be:

* Created
* Revoked
* Expiration-controlled

# Audit Logging

The database includes an `AuditLog` model.

An audit entry contains:

```text
id
action
entityType
entityId
userId
details
createdAt
```

The `details` field is stored as JSON.

This provides a foundation for tracking important system changes and user actions.

# Caching and Redis

Redis is integrated through a dedicated cache module.

The Redis service supports:

* Get
* Set
* Delete
* Optional TTL

Configuration defaults to:

```text
Host: localhost
Port: 6379
```

Optional password support is also available.

The cache abstraction is:

```text
Application
    |
    v
CacheService
    |
    v
RedisService
    |
    v
Redis
```

# Real-Time Infrastructure

The application contains a dedicated realtime module based on:

* NestJS WebSockets
* Socket.IO
* Realtime contracts
* Gateway infrastructure

The realtime infrastructure is initialized during application startup.

The system is structured to support task-related real-time communication without mixing realtime infrastructure into the REST controllers.

# Email Infrastructure

Email functionality is separated into its own mail module.

Nodemailer is used for SMTP-based email delivery.

The system configuration supports:

* SMTP host
* SMTP port
* SMTP security
* SMTP username
* SMTP password
* Sender address

The authentication flow also includes a login security alert email.

# Cloudinary Integration

Cloudinary is used for file storage.

The Cloudinary service configures:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Uploads use:

```text
folder: task-management
resource_type: auto
```

The service supports:

* File upload
* File deletion

The resource type is determined when deleting a file.

# Validation and Error Handling

The application uses NestJS `ValidationPipe` globally.

The current configuration enables:

```text
whitelist: true
forbidNonWhitelisted: true
transform: true
```

This means:

* Unknown request properties are rejected.
* DTO validation is enforced.
* Request transformation is enabled.

For example, if a DTO does not define:

```text
ipAddress
```

but the client sends it, the API can reject the request with:

```text
property ipAddress should not exist
```

This behavior helps prevent accidental or unauthorized request properties.

# Database Design

The project uses PostgreSQL with Prisma.

The current Prisma schema contains the following main entities:

```text
User
OAuthAccount

Team
TeamMember
TeamInvitation

Feature
Permission
TeamMemberPermission

TaskGroup
Task
TaskAssignee

Comment
CommentLike

Attachment

AuditLog

RefreshSession
```

# Database Relationships

The major relationships are:

```text
User
 |
 +---- TeamMember ---- Team
 |
 +---- TaskAssignee ---- Task
 |
 +---- Comment
 |
 +---- AuditLog
 |
 +---- RefreshSession
 |
 +---- OAuthAccount
```

Task structure:

```text
Team
 |
 +---- TaskGroup
          |
          +---- Task
                 |
                 +---- TaskAssignee ---- User
                 |
                 +---- Comment
                 |
                 +---- Attachment
```

Authorization structure:

```text
Feature
 |
 +---- Permission
          |
          +---- TeamMemberPermission
                    |
                    +---- TeamMember
```

# Prisma and Database Migrations

Prisma is used as the ORM.

The schema is located at:

```text
prisma/schema.prisma
```

Migrations are stored under:

```text
prisma/migrations/
```

## Check Migration Status

```bash
npx prisma migrate status
```

## Create and Apply a Development Migration

```bash
npx prisma migrate dev --name <migration_name>
```

Example:

```bash
npx prisma migrate dev --name add_device_info_to_refresh_sessions
```

## Generate Prisma Client

```bash
npx prisma generate
```

## Prisma Studio

To inspect the database visually:

```bash
npx prisma studio
```

## Migration Recovery

If a development migration fails and has not been deployed to production, Prisma can mark it as rolled back:

```bash
npx prisma migrate resolve --rolled-back "<migration_name>"
```

After correcting the schema/migration state, the migration can be regenerated or reapplied according to the database state.

Always verify migration status before attempting destructive operations.

# API Documentation

Swagger is enabled.

After starting the application, Swagger is available at:

```text
http://localhost:3000/api
```

The Swagger configuration exposes:

```text
Title:
Task Management API

Version:
1.0
```

Bearer JWT authentication is also configured in Swagger.

Use the access token as:

```text
Authorization: Bearer <access-token>
```

# Environment Configuration

Create a `.env` file in the project root.

The following environment variables are supported by the current application configuration.

## Application

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Database

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/task_management
```

## JWT

```env
JWT_SECRET=your_secure_jwt_secret
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
```

## Google OAuth

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

## GitHub OAuth

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

## SMTP

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=your_sender@example.com
```

## Redis

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

Redis defaults to:

```text
Host: localhost
Port: 6379
```

## Cloudinary

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

# Installation and Setup

## 1. Clone the Repository

```bash
git clone <repository-url>
cd task-management
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create:

```text
.env
```

and configure the required variables.

## 4. Start PostgreSQL

Make sure PostgreSQL is running and the database configured in `DATABASE_URL` exists.

## 5. Start Redis

Make sure Redis is running.

Default configuration:

```text
localhost:6379
```

## 6. Apply Prisma Migrations

For a development database:

```bash
npx prisma migrate dev
```

## 7. Generate Prisma Client

```bash
npx prisma generate
```

## 8. Start the Development Server

```bash
npm run start:dev
```

# Running the Application

## Development

```bash
npm run start:dev
```

## Standard Start

```bash
npm run start
```

## Production

First build:

```bash
npm run build
```

Then:

```bash
npm run start:prod
```

# Build and Verification

Before considering a change complete, the project should be compiled.

Run:

```bash
npm run build
```

A successful build confirms that the TypeScript/NestJS application compiles successfully.

# Testing

The project is configured with Jest.

## Run Tests

```bash
npm test
```

## Watch Tests

```bash
npm run test:watch
```

## Coverage

```bash
npm run test:cov
```

## End-to-End Tests

```bash
npm run test:e2e
```

# Code Formatting

The project uses Prettier.

Run:

```bash
npm run format
```

# Linting

Run:

```bash
npm run lint
```

# Development Workflow

A recommended development flow is:

```text
1. Pull latest changes
        |
        v
2. Review current branch/status
        |
        v
3. Modify schema if required
        |
        v
4. Update Prisma migration
        |
        v
5. Implement repository changes
        |
        v
6. Implement service/business logic
        |
        v
7. Update controller/DTO/guards
        |
        v
8. Run Prisma generation
        |
        v
9. Run build
        |
        v
10. Test affected endpoints
        |
        v
11. Verify database state
        |
        v
12. Commit changes
```

Useful commands:

```bash
git status
git pull
npm install
npx prisma generate
npx prisma migrate status
npm run build
npm test
```

# Authentication Flow

## Local Login

```text
Client
  |
  | POST /auth/login
  | email
  | password
  | deviceId
  |
  v
AuthController
  |
  v
AuthService
  |
  +---- Find user
  |
  +---- bcrypt password comparison
  |
  +---- Generate refresh token
  |
  +---- Hash refresh token
  |
  +---- Create RefreshSession
  |
  +---- Generate JWT access token
  |
  v
Client
```

The client receives:

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<refresh-token>"
}
```

# Refresh Token Rotation Flow

```text
Client
  |
  | refreshToken
  v
POST /auth/refresh
  |
  v
Hash refresh token
  |
  v
Find RefreshSession
  |
  +---- Does not exist?
  |         |
  |         +---- 401
  |
  +---- Revoked?
  |         |
  |         +---- 401
  |
  +---- Expired?
  |         |
  |         +---- 401
  |
  v
Atomically consume session
  |
  +---- Already consumed?
  |         |
  |         +---- 401
  |
  v
Create new RefreshSession
  |
  v
Generate new JWT
  |
  v
Return new access + refresh tokens
```

# Multi-Device Authentication Flow

A user can authenticate from multiple devices.

For example:

```text
User
 |
 +----------------------+
 |                      |
 v                      v
Device A              Device B
 |                      |
 v                      v
Session A              Session B
 |                      |
 v                      v
RefreshSession A       RefreshSession B
```

Each session contains its own:

```text
deviceId
ipAddress
tokenHash
expiresAt
revokedAt
```

This allows session-level control instead of treating every login for a user as one shared session.

# API Route Overview

## Authentication

```text
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me

GET /auth/google
GET /auth/google/callback

GET /auth/github
GET /auth/github/callback
```

## Teams

```text
POST  /teams
GET   /teams/:teamId
PATCH /teams/:teamId/members/:memberId/role
```

## Task Groups

```text
POST   /teams/:teamId/task-groups
GET    /teams/:teamId/task-groups
GET    /teams/:teamId/task-groups/:groupId
PATCH  /teams/:teamId/task-groups/:groupId
DELETE /teams/:teamId/task-groups/:groupId

POST   /teams/:teamId/task-groups/:groupId/share
DELETE /teams/:teamId/task-groups/:groupId/share
```

## Tasks

```text
POST   /teams/:teamId/task-groups/:groupId/tasks
GET    /teams/:teamId/task-groups/:groupId/tasks
GET    /teams/:teamId/task-groups/:groupId/tasks/:taskId
PATCH  /teams/:teamId/task-groups/:groupId/tasks/:taskId
DELETE /teams/:teamId/task-groups/:groupId/tasks/:taskId

PUT    /teams/:teamId/task-groups/:groupId/tasks/:taskId/assignees

POST   /teams/:teamId/task-groups/:groupId/tasks/:taskId/share
DELETE /teams/:teamId/task-groups/:groupId/tasks/:taskId/share
```

## Attachments

```text
POST   /teams/:teamId/task-groups/:groupId/tasks/:taskId/attachments

GET    /teams/:teamId/task-groups/:groupId/tasks/:taskId/attachments

GET    /teams/:teamId/task-groups/:groupId/tasks/:taskId/attachments/:attachmentId

DELETE /teams/:teamId/task-groups/:groupId/tasks/:taskId/attachments/:attachmentId
```

# Security Considerations

The backend implements several security-oriented mechanisms.

## Password Hashing

Passwords are protected using bcrypt.

## Refresh Token Hashing

Refresh tokens are never stored in plaintext.

Only SHA-256 hashes are persisted.

## Refresh Token Rotation

Refresh sessions are atomically consumed to reduce replay/reuse risk.

## Session Revocation

Sessions contain:

```text
revokedAt
```

which allows individual sessions to be revoked.

## Token Expiration

Refresh sessions contain:

```text
expiresAt
```

and expired refresh sessions are rejected.

## Request Validation

Global validation rejects unknown request properties.

This prevents clients from silently sending unsupported fields.

## Authorization Guards

Protected resources use JWT authentication and, where applicable:

```text
RolesGuard
PermissionsGuard
```

# Database Entity Summary

| Entity               | Purpose                             |
| -------------------- | ----------------------------------- |
| User                 | Application users                   |
| OAuthAccount         | External OAuth identities           |
| Team                 | Team/workspace                      |
| TeamMember           | User/team membership                |
| TeamInvitation       | Team invitation workflow            |
| Feature              | Permission feature grouping         |
| Permission           | Granular permission                 |
| TeamMemberPermission | Team-specific permission assignment |
| TaskGroup            | Task organization                   |
| Task                 | Individual task                     |
| TaskAssignee         | Task/user assignment                |
| Comment              | Task comments                       |
| CommentLike          | Comment likes                       |
| Attachment           | Task file attachments               |
| AuditLog             | System activity/audit information   |
| RefreshSession       | Refresh-token session tracking      |

# Current Implementation Status

The current backend repository contains the implemented foundation for:

* NestJS modular architecture
* PostgreSQL database
* Prisma ORM
* User management
* Local authentication
* JWT authentication
* Refresh-token authentication
* Refresh-token hashing
* Refresh-token rotation
* Refresh-session revocation
* Multi-device session tracking
* Device ID tracking
* IP address tracking
* Google OAuth
* GitHub OAuth
* Team management
* Team roles
* Team invitations
* Feature/permission model
* Role guards
* Permission guards
* Task groups
* Tasks
* Task assignments
* Public task sharing
* Public task-group sharing
* Comments
* Nested comments
* Comment likes
* Attachments
* Cloudinary integration
* Audit-log data model
* Redis caching infrastructure
* Socket.IO/realtime infrastructure
* Email infrastructure
* Swagger API documentation
* Prisma migrations
* Jest testing infrastructure

# Module Completion Status

The project has been developed progressively as an assessment project.

The implemented modules and supporting infrastructure are present in the current repository.

The project still has a **Module 5 pending** according to the current project allocation/status.

Module 5 should therefore **not be treated as completed functionality** in the frontend implementation or API integration until its requirements are finalized and implemented.

The frontend should be built against the currently implemented API surface and should keep Module 5 functionality isolated until its backend requirements are available.

# Frontend Integration Expectations

The backend is designed to support a frontend application through REST APIs and realtime communication.

The frontend should consume:

```text
Authentication APIs
Team APIs
Invitation APIs
Permission APIs
Task Group APIs
Task APIs
Assignment APIs
Comment APIs
Attachment APIs
Sharing APIs
Realtime APIs
```

Authentication should maintain:

```text
Access Token
Refresh Token
Current User
Current Session
```

The frontend should also understand that a user can have multiple active sessions/devices.

# Recommended Frontend Application Areas

The API architecture naturally maps to frontend areas such as:

```text
Authentication
    |
    +---- Login
    +---- Register
    +---- Google Login
    +---- GitHub Login
    +---- Session handling

Application
    |
    +---- Dashboard
    |
    +---- Teams
    |       |
    |       +---- Members
    |       +---- Roles
    |       +---- Permissions
    |       +---- Invitations
    |
    +---- Task Groups
    |       |
    |       +---- Tasks
    |              |
    |              +---- Assignees
    |              +---- Comments
    |              +---- Attachments
    |              +---- Sharing
    |
    +---- Activity / Audit
    |
    +---- User Profile
```

These frontend areas should be treated as integration targets rather than assumptions about the final UI design.

# API Integration Guidelines

When integrating the frontend:

## Authentication

Store authentication state securely according to the final frontend architecture.

The access token should be sent using:

```text
Authorization: Bearer <access-token>
```

## Refresh

When an access token expires:

```text
Client
  |
  v
API returns 401
  |
  v
Call /auth/refresh
  |
  v
Receive new access + refresh tokens
  |
  v
Retry original request
```

If refresh fails:

```text
Clear authentication state
Redirect to login
```

## Permissions

Frontend UI can use permissions to conditionally display actions, but backend authorization remains the source of truth.

For example:

```text
task:create
task:view
task:update
task:assign
task:delete
```

The frontend should never rely solely on hidden buttons as a security mechanism.

# Important Development Notes

## Do Not Modify Applied Migrations Arbitrarily

Once a migration has been applied, its migration history should be treated carefully.

If a development migration fails:

```bash
npx prisma migrate status
```

should be checked first.

Do not immediately use:

```bash
npx prisma migrate reset
```

unless destroying the development database is acceptable.

## Keep Prisma Schema and Migrations in Sync

Whenever the Prisma schema changes:

```bash
npx prisma migrate dev --name <migration_name>
```

should normally be used during development.

After migration:

```bash
npx prisma generate
```

can be run to regenerate the Prisma Client.

# Development Commands Reference

## Install

```bash
npm install
```

## Development Server

```bash
npm run start:dev
```

## Build

```bash
npm run build
```

## Production

```bash
npm run start:prod
```

## Tests

```bash
npm test
```

## Test Watch

```bash
npm run test:watch
```

## Test Coverage

```bash
npm run test:cov
```

## E2E Tests

```bash
npm run test:e2e
```

## Format

```bash
npm run format
```

## Lint

```bash
npm run lint
```

## Prisma Generate

```bash
npx prisma generate
```

## Prisma Migration Status

```bash
npx prisma migrate status
```

## Prisma Development Migration

```bash
npx prisma migrate dev --name <migration_name>
```

## Prisma Studio

```bash
npx prisma studio
```

# Repository Architecture Summary

At a high level, the project can be understood as:

```text
                         TASK MANAGEMENT SYSTEM
                                  |
              +-------------------+-------------------+
              |                   |                   |
              v                   v                   v
        Authentication       Authorization       Collaboration
              |                   |                   |
              |                   |                   +---- Comments
              |                   |                   +---- Attachments
              |                   |                   +---- Realtime
              |                   |
              |                   +---- System Roles
              |                   +---- Team Roles
              |                   +---- Permissions
              |
              +---- Local Login
              +---- Google OAuth
              +---- GitHub OAuth
              +---- JWT
              +---- Refresh Sessions
              +---- Multi-device Sessions

                                  |
                                  v

                              Teams
                                |
                +---------------+---------------+
                |                               |
                v                               v
          Team Members                    Invitations
                |
                v
          Permissions
                |
                v
           Task Groups
                |
                v
              Tasks
                |
       +--------+---------+
       |        |         |
       v        v         v
   Assignees Comments Attachments
                         |
                         v
                     Cloudinary

                                  |
                                  v

                           PostgreSQL
                              Prisma
                                |
                                v
                              Redis
```

# Current Backend Position

The backend has reached a stage where the implemented API and infrastructure can serve as the foundation for the frontend application.

The next major integration stage is:

```text
Backend
   |
   v
Frontend Implementation
   |
   v
API Integration
   |
   v
End-to-End Testing
   |
   v
Final Project Integration
```

The frontend implementation should be based on the actual backend contracts documented through the API and Swagger rather than inventing unsupported backend functionality.

Module 5 remains outside the completed implementation and should be integrated only after its backend requirements are finalized.

# Conclusion

The Task Management System is structured as a modular NestJS backend with PostgreSQL/Prisma persistence and supporting infrastructure for authentication, authorization, teams, tasks, collaboration, file storage, caching, email, and realtime communication.

The architecture separates:

```text
HTTP Layer
    ↓
Guards / Validation
    ↓
Controllers
    ↓
Services
    ↓
Repositories
    ↓
Prisma
    ↓
PostgreSQL
```

while external infrastructure is handled through dedicated modules:

```text
Redis
Cloudinary
SMTP
Socket.IO
Google OAuth
GitHub OAuth
```

This version is intentionally written as **one document from top to bottom**—no sections need to be moved around or merged afterward. I also kept Module 5 explicitly marked as pending instead of pretending we implemented something that the current repository does not establish. The actual repo confirms the current module wiring, Prisma entities, authentication/session implementation, environment configuration, Swagger setup, and route structure used above.    


