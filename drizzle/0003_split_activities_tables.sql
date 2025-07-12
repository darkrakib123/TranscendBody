CREATE TABLE "global_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" varchar NOT NULL,
	"time_of_day" varchar,
	"is_custom" boolean DEFAULT false NOT NULL,
	"difficulty" varchar(10) DEFAULT 'easy' NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "demo_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" varchar NOT NULL,
	"time_of_day" varchar,
	"is_custom" boolean DEFAULT false NOT NULL,
	"difficulty" varchar(10) DEFAULT 'easy' NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
CREATE INDEX "IDX_global_activities_title_category" ON "global_activities" USING btree ("title","category");
CREATE INDEX "IDX_demo_activities_title_category" ON "demo_activities" USING btree ("title","category"); 