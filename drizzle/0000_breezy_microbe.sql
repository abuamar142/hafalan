CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "classes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "group_teachers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"teacher_name" varchar,
	CONSTRAINT "group_teachers_group_id_teacher_id_key" UNIQUE("group_id","teacher_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"class_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memorization" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"surah_no" integer NOT NULL,
	"status" integer DEFAULT 0,
	CONSTRAINT "memorization_student_id_surah_no_key" UNIQUE("student_id","surah_no")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"group_id" integer,
	"nama" text NOT NULL,
	"color" text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"surah_no" integer NOT NULL,
	"nilai" text DEFAULT '',
	"catatan" text DEFAULT '',
	"waktu" timestamp with time zone,
	"guru_id" integer,
	"guru_name" varchar,
	"ayat_start" integer DEFAULT 1,
	"ayat_end" integer,
	"updated_at" timestamp with time zone,
	"updated_by" integer,
	"updated_by_name" varchar
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "group_teachers" ADD CONSTRAINT "group_teachers_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_teachers" ADD CONSTRAINT "group_teachers_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memorization" ADD CONSTRAINT "memorization_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_guru_id_users_id_fk" FOREIGN KEY ("guru_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_memorization_student_id" ON "memorization" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_students_group_id" ON "students" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_student_id" ON "submissions" USING btree ("student_id");