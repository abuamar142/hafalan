import {
  bigserial,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core'

// ── Users (pengganti auth.users Supabase) ──────────────────────
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ── Classes (jenjang kelas) ────────────────────────────────────
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ── Groups (kelompok halaqah) ──────────────────────────────────
export const groups = pgTable('groups', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  classId: integer('class_id').references(() => classes.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ── Group ↔ Teacher ────────────────────────────────────────────
export const groupTeachers = pgTable(
  'group_teachers',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    groupId: integer('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    teacherId: integer('teacher_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    teacherName: varchar('teacher_name'),
  },
  (t) => [unique('group_teachers_group_id_teacher_id_key').on(t.groupId, t.teacherId)],
)

// ── Students (santri) ──────────────────────────────────────────
export const students = pgTable(
  'students',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    groupId: integer('group_id').references(() => groups.id, {
      onDelete: 'restrict',
    }),
    nama: text('nama').notNull(),
    color: text('color').default(''),
  },
  (t) => [index('idx_students_group_id').on(t.groupId)],
)

// ── Memorization (hafalan per surah) ───────────────────────────
export const memorization = pgTable(
  'memorization',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    studentId: integer('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    surahNo: integer('surah_no').notNull(),
    status: integer('status').default(0),
  },
  (t) => [
    unique('memorization_student_id_surah_no_key').on(t.studentId, t.surahNo),
    index('idx_memorization_student_id').on(t.studentId),
  ],
)

// ── Submissions (setoran) ──────────────────────────────────────
export const submissions = pgTable(
  'submissions',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    studentId: integer('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    surahNo: integer('surah_no').notNull(),
    nilai: text('nilai').default(''),
    catatan: text('catatan').default(''),
    waktu: timestamp('waktu', { withTimezone: true }),
    guruId: integer('guru_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    guruName: varchar('guru_name'),
    ayatStart: integer('ayat_start').default(1),
    ayatEnd: integer('ayat_end'),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
    updatedBy: integer('updated_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    updatedByName: varchar('updated_by_name'),
  },
  (t) => [index('idx_submissions_student_id').on(t.studentId)],
)
