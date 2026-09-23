CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE TYPE "SystemRole" AS ENUM (
    'OWNER',
    'USER'
);


CREATE TYPE "TeamRole" AS ENUM (
    'ADMIN',
    'MEMBER'
);


CREATE TYPE "TaskStatus" AS ENUM (
    'TODO',
    'IN_PROGRESS',
    'REVIEW',
    'DONE'
);


CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "systemRole" "SystemRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "User_email_key"
        UNIQUE ("email")
);


CREATE TABLE "OAuthAccount" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthAccount_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "OAuthAccount_provider_providerId_key"
        UNIQUE ("provider", "providerId"),

    CONSTRAINT "OAuthAccount_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "User"("id")
        ON DELETE CASCADE
);


CREATE INDEX "OAuthAccount_userId_idx"
    ON "OAuthAccount"("userId");


CREATE TABLE "Team" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey"
        PRIMARY KEY ("id")
);


CREATE TABLE "TeamMember" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "userId" UUID NOT NULL,
    "teamId" UUID NOT NULL,

    CONSTRAINT "TeamMember_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "TeamMember_userId_teamId_key"
        UNIQUE ("userId", "teamId"),

    CONSTRAINT "TeamMember_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "User"("id")
        ON DELETE CASCADE,

    CONSTRAINT "TeamMember_teamId_fkey"
        FOREIGN KEY ("teamId")
        REFERENCES "Team"("id")
        ON DELETE CASCADE
);


CREATE INDEX "TeamMember_teamId_idx"
    ON "TeamMember"("teamId");


CREATE TABLE "TeamInvitation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "tokenHash" TEXT NOT NULL,
    "teamId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamInvitation_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "TeamInvitation_tokenHash_key"
        UNIQUE ("tokenHash"),

    CONSTRAINT "TeamInvitation_teamId_fkey"
        FOREIGN KEY ("teamId")
        REFERENCES "Team"("id")
        ON DELETE CASCADE
);


CREATE INDEX "TeamInvitation_email_idx"
    ON "TeamInvitation"("email");

CREATE INDEX "TeamInvitation_teamId_idx"
    ON "TeamInvitation"("teamId");

CREATE INDEX "TeamInvitation_expiresAt_idx"
    ON "TeamInvitation"("expiresAt");


CREATE TABLE "Feature" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "Feature_key_key"
        UNIQUE ("key")
);


CREATE TABLE "Permission" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "featureId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "Permission_key_key"
        UNIQUE ("key"),

    CONSTRAINT "Permission_featureId_fkey"
        FOREIGN KEY ("featureId")
        REFERENCES "Feature"("id")
        ON DELETE CASCADE
);


CREATE INDEX "Permission_featureId_idx"
    ON "Permission"("featureId");


CREATE TABLE "TeamMemberPermission" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "teamMemberId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMemberPermission_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "TeamMemberPermission_teamMemberId_permissionId_key"
        UNIQUE ("teamMemberId", "permissionId"),

    CONSTRAINT "TeamMemberPermission_teamMemberId_fkey"
        FOREIGN KEY ("teamMemberId")
        REFERENCES "TeamMember"("id")
        ON DELETE CASCADE,

    CONSTRAINT "TeamMemberPermission_permissionId_fkey"
        FOREIGN KEY ("permissionId")
        REFERENCES "Permission"("id")
        ON DELETE CASCADE
);


CREATE INDEX "TeamMemberPermission_teamMemberId_idx"
    ON "TeamMemberPermission"("teamMemberId");

CREATE INDEX "TeamMemberPermission_permissionId_idx"
    ON "TeamMemberPermission"("permissionId");


CREATE TABLE "TaskGroup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "teamId" UUID NOT NULL,
    "shareTokenHash" TEXT,
    "shareExpiresAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskGroup_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "TaskGroup_shareTokenHash_key"
        UNIQUE ("shareTokenHash"),

    CONSTRAINT "TaskGroup_teamId_fkey"
        FOREIGN KEY ("teamId")
        REFERENCES "Team"("id")
        ON DELETE CASCADE
);


CREATE INDEX "TaskGroup_teamId_idx"
    ON "TaskGroup"("teamId");


CREATE TABLE "Task" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "groupId" UUID NOT NULL,
    "dueDate" TIMESTAMP(3),
    "shareTokenHash" TEXT,
    "shareExpiresAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "Task_shareTokenHash_key"
        UNIQUE ("shareTokenHash"),

    CONSTRAINT "Task_groupId_fkey"
        FOREIGN KEY ("groupId")
        REFERENCES "TaskGroup"("id")
        ON DELETE CASCADE
);


CREATE INDEX "Task_groupId_idx"
    ON "Task"("groupId");

CREATE INDEX "Task_dueDate_idx"
    ON "Task"("dueDate");


CREATE TABLE "TaskAssignee" (
    "taskId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignee_pkey"
        PRIMARY KEY ("taskId", "userId"),

    CONSTRAINT "TaskAssignee_taskId_fkey"
        FOREIGN KEY ("taskId")
        REFERENCES "Task"("id")
        ON DELETE CASCADE,

    CONSTRAINT "TaskAssignee_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "User"("id")
        ON DELETE CASCADE
);


CREATE INDEX "TaskAssignee_userId_idx"
    ON "TaskAssignee"("userId");


CREATE TABLE "Comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "content" TEXT NOT NULL,
    "taskId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "Comment_taskId_fkey"
        FOREIGN KEY ("taskId")
        REFERENCES "Task"("id")
        ON DELETE CASCADE,

    CONSTRAINT "Comment_authorId_fkey"
        FOREIGN KEY ("authorId")
        REFERENCES "User"("id"),

    CONSTRAINT "Comment_parentId_fkey"
        FOREIGN KEY ("parentId")
        REFERENCES "Comment"("id")
        ON DELETE CASCADE
);


CREATE INDEX "Comment_taskId_idx"
    ON "Comment"("taskId");

CREATE INDEX "Comment_authorId_idx"
    ON "Comment"("authorId");

CREATE INDEX "Comment_parentId_idx"
    ON "Comment"("parentId");


CREATE TABLE "CommentLike" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLike_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "CommentLike_commentId_userId_key"
        UNIQUE ("commentId", "userId"),

    CONSTRAINT "CommentLike_commentId_fkey"
        FOREIGN KEY ("commentId")
        REFERENCES "Comment"("id")
        ON DELETE CASCADE,

    CONSTRAINT "CommentLike_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "User"("id")
        ON DELETE CASCADE
);


CREATE INDEX "CommentLike_commentId_idx"
    ON "CommentLike"("commentId");

CREATE INDEX "CommentLike_userId_idx"
    ON "CommentLike"("userId");


CREATE TABLE "Attachment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "taskId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "Attachment_taskId_fkey"
        FOREIGN KEY ("taskId")
        REFERENCES "Task"("id")
        ON DELETE CASCADE
);


CREATE INDEX "Attachment_taskId_idx"
    ON "Attachment"("taskId");


CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" UUID,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "AuditLog_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "User"("id")
);


CREATE INDEX "AuditLog_userId_idx"
    ON "AuditLog"("userId");

CREATE INDEX "AuditLog_entityType_entityId_idx"
    ON "AuditLog"("entityType", "entityId");


CREATE TABLE "RefreshSession" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tokenHash" TEXT NOT NULL,
    "userId" UUID NOT NULL,

    "deviceId" TEXT,
    "ipAddress" TEXT,


    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshSession_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "RefreshSession_tokenHash_key"
        UNIQUE ("tokenHash"),

    CONSTRAINT "RefreshSession_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "User"("id")
        ON DELETE CASCADE
);


CREATE INDEX "RefreshSession_userId_idx"
    ON "RefreshSession"("userId");

CREATE INDEX "RefreshSession_expiresAt_idx"
    ON "RefreshSession"("expiresAt");