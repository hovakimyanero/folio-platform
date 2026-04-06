-- CreateEnum
CREATE TYPE "UserLevel" AS ENUM ('NEWCOMER', 'RISING', 'ESTABLISHED', 'TOP', 'LEGEND');

-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('TEXT', 'HEADING', 'IMAGE', 'IMAGE_GALLERY', 'VIDEO', 'EMBED', 'QUOTE', 'DIVIDER', 'CODE', 'BEFORE_AFTER');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('VIEW', 'DWELL', 'SCROLL', 'PROFILE_CLICK', 'SHARE');

-- CreateEnum
CREATE TYPE "MarketplaceType" AS ENUM ('UI_KIT', 'TEMPLATE', 'ICON_SET', 'FONT', 'THREE_D_ASSET', 'MOCKUP', 'ILLUSTRATION', 'OTHER');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SAVE';
ALTER TYPE "NotificationType" ADD VALUE 'REPOST';
ALTER TYPE "NotificationType" ADD VALUE 'WEEKLY_PICK';
ALTER TYPE "NotificationType" ADD VALUE 'BADGE_EARNED';
ALTER TYPE "NotificationType" ADD VALUE 'LEVEL_UP';

-- AlterTable User (new columns)
ALTER TABLE "User" ADD COLUMN "headline" TEXT;
ALTER TABLE "User" ADD COLUMN "specialization" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "birthDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "experience" JSONB;
ALTER TABLE "User" ADD COLUMN "education" JSONB;
ALTER TABLE "User" ADD COLUMN "customBlocks" JSONB;
ALTER TABLE "User" ADD COLUMN "openToWork" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "openToHire" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "level" "UserLevel" NOT NULL DEFAULT 'NEWCOMER';
ALTER TABLE "User" ADD COLUMN "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "consistencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "featuredCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "isPro" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "proExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "profileTheme" JSONB;
ALTER TABLE "User" ADD COLUMN "customCTA" JSONB;

-- AlterTable Project (new columns)
ALTER TABLE "Project" ADD COLUMN "saveCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Project" ADD COLUMN "repostCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Project" ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "scheduledAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "Project" ADD COLUMN "linkOnly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "industry" TEXT;
ALTER TABLE "Project" ADD COLUMN "style" TEXT;

-- CreateTable ProjectBlock
CREATE TABLE "ProjectBlock" (
    "id" TEXT NOT NULL,
    "type" "BlockType" NOT NULL,
    "content" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable Tag
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable TagSubscription
CREATE TABLE "TagSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable CategorySubscription
CREATE TABLE "CategorySubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategorySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable Save
CREATE TABLE "Save" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Save_pkey" PRIMARY KEY ("id")
);

-- CreateTable Repost
CREATE TABLE "Repost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repost_pkey" PRIMARY KEY ("id")
);

-- CreateTable Badge
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "criteria" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable UserBadge
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable WeeklyPick
CREATE TABLE "WeeklyPick" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "curatorId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable UserInteraction
CREATE TABLE "UserInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable MarketplaceItem
CREATE TABLE "MarketplaceItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "cover" TEXT NOT NULL,
    "files" JSONB,
    "previews" JSONB,
    "type" "MarketplaceType" NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable MarketplacePurchase
CREATE TABLE "MarketplacePurchase" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplacePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable ProfileView
CREATE TABLE "ProfileView" (
    "id" TEXT NOT NULL,
    "viewedId" TEXT NOT NULL,
    "viewerIp" TEXT,
    "userId" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (User new indices)
CREATE INDEX "User_reputationScore_idx" ON "User"("reputationScore" DESC);
CREATE INDEX "User_level_idx" ON "User"("level");
CREATE INDEX "User_openToWork_idx" ON "User"("openToWork");

-- CreateIndex (Project new indices)
CREATE INDEX "Project_isDraft_idx" ON "Project"("isDraft");
CREATE INDEX "Project_scheduledAt_idx" ON "Project"("scheduledAt");

-- CreateIndex ProjectBlock
CREATE INDEX "ProjectBlock_projectId_idx" ON "ProjectBlock"("projectId");
CREATE INDEX "ProjectBlock_order_idx" ON "ProjectBlock"("order");

-- CreateIndex Tag
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
CREATE INDEX "Tag_slug_idx" ON "Tag"("slug");
CREATE INDEX "Tag_parentId_idx" ON "Tag"("parentId");
CREATE INDEX "Tag_useCount_idx" ON "Tag"("useCount" DESC);

-- CreateIndex TagSubscription
CREATE UNIQUE INDEX "TagSubscription_userId_tagId_key" ON "TagSubscription"("userId", "tagId");
CREATE INDEX "TagSubscription_userId_idx" ON "TagSubscription"("userId");

-- CreateIndex CategorySubscription
CREATE UNIQUE INDEX "CategorySubscription_userId_categoryId_key" ON "CategorySubscription"("userId", "categoryId");
CREATE INDEX "CategorySubscription_userId_idx" ON "CategorySubscription"("userId");

-- CreateIndex Save
CREATE UNIQUE INDEX "Save_userId_projectId_key" ON "Save"("userId", "projectId");
CREATE INDEX "Save_projectId_idx" ON "Save"("projectId");
CREATE INDEX "Save_userId_idx" ON "Save"("userId");

-- CreateIndex Repost
CREATE UNIQUE INDEX "Repost_userId_projectId_key" ON "Repost"("userId", "projectId");
CREATE INDEX "Repost_projectId_idx" ON "Repost"("projectId");
CREATE INDEX "Repost_userId_idx" ON "Repost"("userId");

-- CreateIndex Badge
CREATE UNIQUE INDEX "Badge_name_key" ON "Badge"("name");
CREATE UNIQUE INDEX "Badge_slug_key" ON "Badge"("slug");

-- CreateIndex UserBadge
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex WeeklyPick
CREATE UNIQUE INDEX "WeeklyPick_projectId_week_year_key" ON "WeeklyPick"("projectId", "week", "year");
CREATE INDEX "WeeklyPick_week_year_idx" ON "WeeklyPick"("week", "year");

-- CreateIndex UserInteraction
CREATE INDEX "UserInteraction_userId_createdAt_idx" ON "UserInteraction"("userId", "createdAt" DESC);
CREATE INDEX "UserInteraction_projectId_idx" ON "UserInteraction"("projectId");

-- CreateIndex MarketplaceItem
CREATE INDEX "MarketplaceItem_sellerId_idx" ON "MarketplaceItem"("sellerId");
CREATE INDEX "MarketplaceItem_type_idx" ON "MarketplaceItem"("type");
CREATE INDEX "MarketplaceItem_createdAt_idx" ON "MarketplaceItem"("createdAt" DESC);

-- CreateIndex MarketplacePurchase
CREATE UNIQUE INDEX "MarketplacePurchase_itemId_buyerId_key" ON "MarketplacePurchase"("itemId", "buyerId");
CREATE INDEX "MarketplacePurchase_buyerId_idx" ON "MarketplacePurchase"("buyerId");

-- CreateIndex ProfileView
CREATE INDEX "ProfileView_viewedId_idx" ON "ProfileView"("viewedId");
CREATE INDEX "ProfileView_createdAt_idx" ON "ProfileView"("createdAt");

-- AddForeignKey ProjectBlock
ALTER TABLE "ProjectBlock" ADD CONSTRAINT "ProjectBlock_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Tag (self-relation)
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey TagSubscription
ALTER TABLE "TagSubscription" ADD CONSTRAINT "TagSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TagSubscription" ADD CONSTRAINT "TagSubscription_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey CategorySubscription
ALTER TABLE "CategorySubscription" ADD CONSTRAINT "CategorySubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CategorySubscription" ADD CONSTRAINT "CategorySubscription_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Save
ALTER TABLE "Save" ADD CONSTRAINT "Save_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Save" ADD CONSTRAINT "Save_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Repost
ALTER TABLE "Repost" ADD CONSTRAINT "Repost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Repost" ADD CONSTRAINT "Repost_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey UserBadge
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey WeeklyPick
ALTER TABLE "WeeklyPick" ADD CONSTRAINT "WeeklyPick_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyPick" ADD CONSTRAINT "WeeklyPick_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey UserInteraction
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey MarketplaceItem
ALTER TABLE "MarketplaceItem" ADD CONSTRAINT "MarketplaceItem_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey MarketplacePurchase
ALTER TABLE "MarketplacePurchase" ADD CONSTRAINT "MarketplacePurchase_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MarketplaceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplacePurchase" ADD CONSTRAINT "MarketplacePurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey ProfileView
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewedId_fkey" FOREIGN KEY ("viewedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
