'use server'

import { asc, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  classes,
  groups,
  memorization,
  students,
  submissions,
} from '@/lib/db/schema'

export async function getPublicClassesAction() {
  return db
    .select({ id: classes.id, nama: classes.name })
    .from(classes)
    .orderBy(asc(classes.name))
}

export async function getPublicGroupsAction(kelasId: number) {
  return db
    .select({ id: groups.id, nama: groups.name })
    .from(groups)
    .where(eq(groups.classId, kelasId))
    .orderBy(asc(groups.name))
}

export async function getPublicStudentsAction(groupId: number) {
  return db
    .select({ id: students.id, nama: students.nama, color: students.color })
    .from(students)
    .where(eq(students.groupId, groupId))
    .orderBy(asc(students.nama))
}

export async function getPublicStudentReportAction(studentId: number) {
  const [row] = await db
    .select({
      id: students.id,
      nama: students.nama,
      color: students.color,
      groupId: groups.id,
      groupName: groups.name,
      classId: classes.id,
      className: classes.name,
    })
    .from(students)
    .leftJoin(groups, eq(students.groupId, groups.id))
    .leftJoin(classes, eq(groups.classId, classes.id))
    .where(eq(students.id, studentId))
    .limit(1)

  if (!row) throw new Error('Santri tidak ditemukan')

  const subs = await db
    .select()
    .from(submissions)
    .where(eq(submissions.studentId, studentId))
    .orderBy(desc(submissions.waktu))

  const memos = await db
    .select({ surahNo: memorization.surahNo, status: memorization.status })
    .from(memorization)
    .where(eq(memorization.studentId, studentId))

  return {
    student: {
      id: row.id,
      nama: row.nama,
      color: row.color,
      group: row.groupId
        ? {
            id: row.groupId,
            nama: row.groupName || '',
            class: row.classId
              ? { id: row.classId, nama: row.className || '' }
              : null,
          }
        : null,
    },
    submissions: subs.map((s) => ({
      id: s.id,
      student_id: s.studentId,
      surah_no: s.surahNo,
      nilai: s.nilai || '',
      catatan: s.catatan || '',
      waktu: s.waktu ? s.waktu.toISOString() : '',
      ayat_start: s.ayatStart,
      ayat_end: s.ayatEnd,
      guru_nama: s.guruName,
      updated_at: s.updatedAt ? s.updatedAt.toISOString() : null,
      updated_by_name: s.updatedByName,
    })),
    memorizations: memos.map((m) => ({
      surah_no: m.surahNo,
      status: m.status ?? 0,
    })),
  }
}
