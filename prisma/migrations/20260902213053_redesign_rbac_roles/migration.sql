/*
  Warnings:

  - The `role` column on the `TeamInvitation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `TeamMember` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('OWNER', 'USER');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "TeamInvitation" DROP COLUMN "role",
ADD COLUMN     "role" "TeamRole" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "TeamMember" DROP COLUMN "role",
ADD COLUMN     "role" "TeamRole" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "systemRole" "SystemRole" NOT NULL DEFAULT 'USER';

-- DropEnum
DROP TYPE "Role";
