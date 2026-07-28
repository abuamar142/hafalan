// ── SUPABASE DATA HELPERS ──

async function loadSettings() {
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return;
  const { data } = await _supabase.from('settings').select('key, value').eq('user_id', user.id);
  if (data) {
    data.forEach(r => {
      if (r.key === 'lembaga') state.lembaga = r.value;
      if (r.key === 'guru') state.guru = r.value;
    });
  }
}

async function loadSantriList() {
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return;
  // Fetch students
  const { data: students } = await _supabase.from('students').select('*').eq('user_id', user.id);
  if (!students) { state.santri = []; return; }
  // Fetch memorization counts
  const studentIds = students.map(s => s.id);
  const { data: memos } = await _supabase.from('memorization').select('student_id, status').in('student_id', studentIds);
  // Compute hafal_count per student
  const hafalCounts = {};
  (memos || []).forEach(m => {
    if (m.status === 1) {
      hafalCounts[m.student_id] = (hafalCounts[m.student_id] || 0) + 1;
    }
  });
  state.santri = students.map(s => ({
    ...s,
    hafal_count: hafalCounts[s.id] || 0,
  }));
}

async function loadSetoranList() {
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return;
  // Fetch submissions with student names via join
  const { data: subs } = await _supabase
    .from('submissions')
    .select('*, students(nama)')
    .order('id', { ascending: false })
    .limit(999);
  if (!subs) { state.setoran = []; return; }
  state.setoran = subs.map(s => ({
    id: s.id,
    santri_id: s.student_id,
    santri_nama: s.students?.nama || '',
    surah_no: s.surah_no,
    nilai: s.nilai,
    catatan: s.catatan,
    tanggal: s.tanggal,
    jam: s.jam,
  }));
}

async function loadProfileSantri(id) {
  try {
    const { data: student } = await _supabase.from('students').select('*').eq('id', id).single();
    if (!student) { profileSantri = null; return; }
    // Fetch memorization
    const { data: memos } = await _supabase.from('memorization').select('surah_no, status').eq('student_id', id);
    const hafalan = {};
    (memos || []).forEach(m => { hafalan[m.surah_no] = m.status; });
    // Fetch submissions
    const { data: subs } = await _supabase.from('submissions').select('*').eq('student_id', id).order('id', { ascending: false }).limit(50);
    profileSantri = {
      ...student,
      hafalan,
      setoran: (subs || []).map(s => ({
        id: s.id,
        surah_no: s.surah_no,
        nilai: s.nilai,
        catatan: s.catatan,
        tanggal: s.tanggal,
        jam: s.jam,
      })),
    };
  } catch (e) { console.error('loadProfileSantri', e); profileSantri = null; }
}

async function refreshAll() {
  await Promise.all([loadSettings(), loadSantriList(), loadSetoranList()]);
}
