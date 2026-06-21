-- Migrate primary keys from BIGINT to UUID.
-- Safe when tables are empty (drop + recreate).

ALTER TABLE "timeline_gallery" DROP CONSTRAINT IF EXISTS "timeline_gallery_experience_id_fkey";

DROP TABLE IF EXISTS "timeline_gallery";
DROP TABLE IF EXISTS "timeline_experiences";
DROP TABLE IF EXISTS "feedbacks";
DROP TABLE IF EXISTS "projects";

CREATE TABLE "feedbacks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "company" TEXT,
    "comment" TEXT,
    "job_title" TEXT,
    "avatar" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "category" "ProjectCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "client" TEXT,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "timeline_experiences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "start_year" INTEGER NOT NULL,
    "end_year" INTEGER,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_experiences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "timeline_gallery" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "experience_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_gallery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "feedbacks_name_key" ON "feedbacks"("name");

ALTER TABLE "timeline_gallery" ADD CONSTRAINT "timeline_gallery_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "timeline_experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
