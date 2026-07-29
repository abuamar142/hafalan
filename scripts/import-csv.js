#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

// ── Config ──
const DOCS = path.join(__dirname, '..', 'docs')
const OUT = path.join(__dirname, 'import.sql')

/**
 * Mapping: class → [teacher, groupName][]
 * Each class has exactly 4 teacher sections (all 3 CSVs verified).
 */
const TEACHER_GROUPS = {
  'X': [
    ['Ustadzah Eral', 'Hamka'],
    ['Ustadz Khalid', 'Rasyid Rida'],
    ['Ustadz Sabilal', 'Borobudur'],
    ['Ustadz Septian', 'Ottoman'],
  ],
  'XI': [
    ['Ustadz Khalid', 'Istiqlal'],
    ['Ustadzah Eral', 'Kartini'],
    ['Ustadz Sabilal', 'Wahid Hasyim'],
    ['Ustadz Septian', 'Ciputra'],
  ],
  'XII': [
    ['Ustadz Khalid', 'Ibnu Sina'],
    ['Ustadz Sabilal', 'Karamah'],
    ['Ustadzah Eral', 'Taj Mahal'],
    ['Ustadz Septian', 'Munajat'],
  ],
}

/**
 * Normalize teacher name to a canonical key for settings lookup.
 */
function teacherKey(raw) {
  return raw
    .replace(/^Ustadz(ah)?\s*/i, '')
    .trim()
}

/**
 * Parse a single CSV file into sections.
 * Each section = { teacher, group, students[] }
 * Kelas X column format: No,Nama Siswa,Kelas (group),Juz,Surah,Hal/Ayat,Tingkat,Hal
 * Kelas XI format: No,Nama Siswa,Kelas (empty),Juz,Surah,Hal/Ayat,Tingkat,Hal
 * Kelas XII format: No.,Nama,Kelas (empty),Juz,Surah,Hal/Ayat,Tingkat,Hal
 */
function parseCSV(filePath, classLabel, groups) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const lines = raw.split('\n').map(l => l.trim())

  const sections = []
  let currentSection = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line || line.startsWith('"PENGLOMPOKKAN') || line.startsWith('PENGLOMPOKKAN') ||
        line.includes('KELAS') || line.includes('TAHUN') || line.startsWith(',,,Juli') ||
        line.startsWith(',,,')) {
      continue
    }

    // Detect teacher header: "Ustadz" or "Ustadzah"
    if (/^Ustadz(ah)?\s/i.test(line)) {
      // Extract name before first comma (ignore trailing commas from CSV)
      const teacherName = line.replace(/^Ustadz(ah)?\s*/i, '').split(',')[0].trim()

      // Next line should be the group header + course info
      let groupName = ''
      if (i + 1 < lines.length) {
        // The group line format: "GroupName,,,Tahfidzul..."
        const groupLine = lines[i + 1]
        if (groupLine && !groupLine.startsWith('No')) {
          groupName = groupLine.split(',')[0].trim()
        }
      }

      if (currentSection) {
        sections.push(currentSection)
      }

      currentSection = {
        teacher: teacherName,
        group: groupName,
        students: [],
      }
      continue
    }

    // Detect table header row -> skip it
    if (/^No[.,]?\s*(Nama|Nama Siswa)/i.test(line)) {
      continue
    }

    // Detect stat/summary rows (start with ",," or ",Juz" or "Total")
    if (line.startsWith(',,') || line.startsWith(',Juz') || line.startsWith('Total')) {
      continue
    }

    // Student rows
    if (currentSection) {
      const cols = parseCSVLine(line)

      // Skip empty rows or rows that are clearly not students
      if (cols.length < 2) continue
      const no = cols[0].trim()
      const nama = cols[1]?.trim()
      if (!no || !nama || !/^\d+$/.test(no.replace(/[.*]/g, ''))) continue

      // For Kelas X, the "Kelas" column (col[2]) may have explicit group name
      let studentGroup = ''
      if (cols.length >= 3) {
        studentGroup = (cols[2] || '').trim()
      }

      // If explicit group name provided, use it; otherwise fallback to section's group
      const resolvedGroup = studentGroup || currentSection.group

      currentSection.students.push({
        nama,
        groupName: resolvedGroup,
      })
    }
  }

  // Push last section
  if (currentSection) {
    sections.push(currentSection)
  }

  return sections
}

/**
 * Parse a single CSV line respecting quoted fields.
 */
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

/**
 * Escape a string for SQL single-quote literals.
 */
function sq(s) {
  return "'" + (s || '').replace(/'/g, "''").trim() + "'"
}

// ── Main ──

const files = {
  'X': path.join(DOCS, 'Kelas X.csv'),
  'XI': path.join(DOCS, 'kelas XI.csv'),
  'XII': path.join(DOCS, 'kelas XII.csv'),
}

let sql = ''
sql += '-- ========================================\n'
sql += '-- CSV Import: Hafalan Student Data\n'
sql += '-- Generated: ' + new Date().toISOString() + '\n'
sql += '-- Run via: migrate.sh (psql) or Supabase SQL editor\n'
sql += '-- ========================================\n\n'
sql += 'BEGIN;\n\n'

// ── Step 1: Insert classes ──
sql += '-- ── Classes ──\n'
sql += 'INSERT INTO classes (id, name) VALUES\n'
const classIds = { X: 1, XI: 2, XII: 3 }
sql += "  (1, 'X'),\n"
sql += "  (2, 'XI'),\n"
sql += "  (3, 'XII');\n\n"

// ── Step 2: Build group data per class ──
// groupId counter
let groupId = 1
const allStudents = []
const groupRecords = [] // { id, name, class_id }
const groupTeachers = [] // { group_id, teacher }

for (const [classLabel, groups] of Object.entries(TEACHER_GROUPS)) {
  const csvFile = files[classLabel]
  if (!fs.existsSync(csvFile)) {
    console.error(`WARN: ${csvFile} not found, skipping`)
    continue
  }

  const sections = parseCSV(csvFile, classLabel, groups)

  // Map teacher name to group for this class
  const teacherToGroup = {}
  for (const [t, g] of groups) {
    const key = teacherKey(t)
    teacherToGroup[key] = g
  }

  // Kelas X has explicit groups in student rows, so we need to detect all group names used
  // For XI and XII, all students use the section's default group
  const usedGroups = new Set()

  for (const sec of sections) {
    const secGroup = teacherToGroup[teacherKey(sec.teacher)] || sec.group
    usedGroups.add(secGroup)
    for (const s of sec.students) {
      usedGroups.add(s.groupName)
    }
  }

  // Create group records
  const classId = classIds[classLabel]
  for (const gName of usedGroups) {
    // Check if we already created this group for this class
    const exists = groupRecords.find(r => r.name === gName && r.class_id === classId)
    if (exists) continue

    groupRecords.push({
      id: groupId++,
      name: gName,
      class_id: classId,
    })
  }

  // Process students
  for (const sec of sections) {
    const secGroup = teacherToGroup[teacherKey(sec.teacher)] || sec.group
    for (const s of sec.students) {
      const grp = groupRecords.find(r => r.name === s.groupName && r.class_id === classId)
      if (!grp) {
        console.error(`ERROR: Group "${s.groupName}" not found in class ${classLabel} for student ${s.nama}`)
        continue
      }
      allStudents.push({ ...s, classId, groupId: grp.id })
    }
  }

  // Map teachers to groups for this class
  for (const sec of sections) {
    const tKey = teacherKey(sec.teacher)
    const grpName = teacherToGroup[tKey]
    if (!grpName) {
      console.error(`WARN: No group mapped for teacher "${sec.teacher}" in class ${classLabel}`)
      continue
    }
    const grp = groupRecords.find(r => r.name === grpName && r.class_id === classId)
    if (!grp) {
      console.error(`ERROR: Group "${grpName}" not found in groupRecords for class ${classLabel}`)
      continue
    }
    // Check if already added
    const exists = groupTeachers.find(gt => gt.group_id === grp.id && gt.teacher === tKey)
    if (!exists) {
      groupTeachers.push({ group_id: grp.id, teacher: tKey })
    }
  }
}

// ── Step 3: Insert groups ──
sql += '-- ── Groups ──\n'
sql += 'INSERT INTO groups (id, name, class_id) VALUES\n'
const groupLines = groupRecords.map(g =>
  `  (${g.id}, ${sq(g.name)}, ${g.class_id})`
)
sql += groupLines.join(',\n') + ';\n\n'

// ── Step 4: Insert settings (teacher names) ──
sql += '-- ── Settings (guru names) ──\n'
sql += "INSERT INTO settings (key, value, user_id) VALUES\n"
const uniqueTeachers = [...new Set(groupTeachers.map(gt => gt.teacher))]
const teacherLines = uniqueTeachers.map(t =>
  `  ('guru', ${sq(t)}, '')`
)
sql += teacherLines.join(',\n') + ';\n\n'

// ── Step 5: Insert group_teachers ──
sql += '-- ── Group Teachers ──\n'
sql += 'INSERT INTO group_teachers (group_id, teacher_id) VALUES\n'
const gtLines = groupTeachers.map(gt =>
  `  (${gt.group_id}, ${sq(gt.teacher)})`
)
sql += gtLines.join(',\n') + ';\n\n'

// ── Step 6: Insert students ──
sql += '-- ── Students ──\n'
sql += 'INSERT INTO students (id, group_id, nama, color) VALUES\n'
const colorPalette = [
  '#1D9E75', '#E8A317', '#4A90D9', '#9B59B6',
  '#E74C3C', '#2ECC71', '#F39C12', '#3498DB',
  '#1ABC9C', '#E67E22', '#9B59B6', '#34495E',
  '#16A085', '#C0392B', '#2980B9', '#8E44AD',
]
const studentLines = allStudents.map((s, i) => {
  const colorIdx = i % colorPalette.length
  return `  (${i + 1}, ${s.groupId}, ${sq(s.nama)}, ${sq(colorPalette[colorIdx])})`
})
sql += studentLines.join(',\n') + ';\n\n'

sql += '-- ── Update sequences ──\n'
sql += `SELECT setval('classes_id_seq', (SELECT MAX(id) FROM classes));\n`
sql += `SELECT setval('groups_id_seq', (SELECT MAX(id) FROM groups));\n`
sql += `SELECT setval('students_id_seq', (SELECT MAX(id) FROM students));\n\n`

sql += 'COMMIT;\n'

// ── Write output ──
fs.writeFileSync(OUT, sql)
console.log(`✅ SQL written to ${OUT}`)
console.log(`   Classes: 3`)
console.log(`   Groups: ${groupRecords.length}`)
console.log(`   Teachers: ${uniqueTeachers.length}`)
console.log(`   Group-Teachers: ${groupTeachers.length}`)
console.log(`   Students: ${allStudents.length}`)
