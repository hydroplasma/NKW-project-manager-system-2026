-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openId" TEXT,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TEACHER',
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "termNumber" INTEGER NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "academicYearId" TEXT NOT NULL,
    CONSTRAINT "Semester_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME,
    "location" TEXT NOT NULL DEFAULT '',
    "ownerName" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "academicYearId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Activity_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Activity_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CippQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dimension" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "CippEvaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "userId" TEXT,
    "respondentName" TEXT NOT NULL DEFAULT 'ผู้ประเมิน',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CippEvaluation_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CippEvaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CippAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    CONSTRAINT "CippAnswer_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "CippEvaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CippAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CippQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SatisfactionQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "SatisfactionResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "userId" TEXT,
    "respondentName" TEXT NOT NULL DEFAULT 'ผู้ตอบแบบประเมิน',
    "suggestion" TEXT NOT NULL DEFAULT '',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SatisfactionResponse_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SatisfactionResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SatisfactionAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    CONSTRAINT "SatisfactionAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "SatisfactionResponse" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SatisfactionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SatisfactionQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "passRate" REAL NOT NULL DEFAULT 0,
    "satisfactionLevel" REAL NOT NULL DEFAULT 0,
    "budgetApproved" REAL NOT NULL DEFAULT 0,
    "budgetSpent" REAL NOT NULL DEFAULT 0,
    "strengths" TEXT NOT NULL DEFAULT '',
    "challenges" TEXT NOT NULL DEFAULT '',
    "recommendations" TEXT NOT NULL DEFAULT '',
    "updatedById" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityReport_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityReport_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApprovalSignature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "fullName" TEXT NOT NULL DEFAULT '',
    "signaturePath" TEXT NOT NULL DEFAULT '',
    "signedAt" DATETIME,
    "decision" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "ApprovalSignature_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ActivityReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "reportId" TEXT,
    "path" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityImage_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityImage_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ActivityReport" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_openId_key" ON "User"("openId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_year_key" ON "AcademicYear"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_academicYearId_termNumber_key" ON "Semester"("academicYearId", "termNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_code_key" ON "Activity"("code");

-- CreateIndex
CREATE INDEX "Activity_startsAt_idx" ON "Activity"("startsAt");

-- CreateIndex
CREATE INDEX "Activity_visibility_status_idx" ON "Activity"("visibility", "status");

-- CreateIndex
CREATE INDEX "Activity_academicYearId_semesterId_idx" ON "Activity"("academicYearId", "semesterId");

-- CreateIndex
CREATE INDEX "CippQuestion_dimension_sortOrder_idx" ON "CippQuestion"("dimension", "sortOrder");

-- CreateIndex
CREATE INDEX "CippEvaluation_activityId_submittedAt_idx" ON "CippEvaluation"("activityId", "submittedAt");

-- CreateIndex
CREATE INDEX "CippEvaluation_userId_idx" ON "CippEvaluation"("userId");

-- CreateIndex
CREATE INDEX "CippAnswer_questionId_idx" ON "CippAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "CippAnswer_evaluationId_questionId_key" ON "CippAnswer"("evaluationId", "questionId");

-- CreateIndex
CREATE INDEX "SatisfactionResponse_activityId_submittedAt_idx" ON "SatisfactionResponse"("activityId", "submittedAt");

-- CreateIndex
CREATE INDEX "SatisfactionResponse_userId_idx" ON "SatisfactionResponse"("userId");

-- CreateIndex
CREATE INDEX "SatisfactionAnswer_questionId_idx" ON "SatisfactionAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "SatisfactionAnswer_responseId_questionId_key" ON "SatisfactionAnswer"("responseId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityReport_activityId_key" ON "ActivityReport"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalSignature_reportId_role_key" ON "ApprovalSignature"("reportId", "role");

-- CreateIndex
CREATE INDEX "ActivityImage_activityId_displayOrder_idx" ON "ActivityImage"("activityId", "displayOrder");
