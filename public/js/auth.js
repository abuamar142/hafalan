// ── AUTH ──
async function checkAuth(){
  const { data: { session } } = await _supabase.auth.getSession();
  if(session?.user){
    currentUser=session.user;
    return true;
  }
  return false;
}

function showLogin(){
  document.getElementById('auth-login').style.display='block';
  document.getElementById('auth-register').style.display='none';
  document.getElementById('auth-err').style.display='none';
}

function showRegister(){
  document.getElementById('auth-login').style.display='none';
  document.getElementById('auth-register').style.display='block';
  document.getElementById('reg-err').style.display='none';
}

function showAuthErr(id,msg){
  const el=document.getElementById(id);
  el.textContent=msg;el.style.display='block';
}

async function doLogin(){
  const email=document.getElementById('auth-email').value.trim();
  const pass=document.getElementById('auth-pass').value;
  if(!email||!pass){showAuthErr('auth-err','Email dan password wajib diisi');return}
  try{
    const { data, error } = await _supabase.auth.signInWithPassword({email,password:pass});
    if(error)throw error;
    currentUser=data.user;
    isDemo=false;
    startApp();
  }catch(e){showAuthErr('auth-err',e.message||'Email atau password salah')}
}

async function doRegister(){
  const name=document.getElementById('reg-name').value.trim();
  const email=document.getElementById('reg-email').value.trim();
  const pass=document.getElementById('reg-pass').value;
  if(!name||!email||!pass){showAuthErr('reg-err','Semua field wajib diisi');return}
  if(pass.length<6){showAuthErr('reg-err','Password minimal 6 karakter');return}
  try{
    const { data, error } = await _supabase.auth.signUp({email,password:pass,options:{data:{name}}});
    if(error)throw error;
    currentUser=data.user;
    isDemo=false;
    startApp();
  }catch(e){showAuthErr('reg-err',e.message||'Gagal mendaftar')}
}

async function doLogout(){
  await _supabase.auth.signOut();
  currentUser=null;
  document.getElementById('app').style.display='none';
  document.getElementById('activation').style.display='flex';
  showLogin();
}

// ── DEMO MODE ──
async function mulaiDemo(){
  document.getElementById('demo-note').style.display='block';
  isDemo=true;
  try{
    const { data: { user } } = await _supabase.auth.getUser();
    if(!user){alert('Silakan masuk atau daftar terlebih dahulu');return}
    const { data: existing } = await _supabase.from('students').select('id').eq('user_id',user.id).limit(1);
    if(existing && existing.length > 0){
      await refreshAll();
      startApp();
      return;
    }
    await importDemoData(user.id);
    await refreshAll();
  }catch(e){console.error('mulaiDemo',e)}
  startApp();
}

async function importDemoData(userId){
  const studentMap = {};
  for(const s of DEMO_STATE.santri){
    const newId = Date.now() + Math.floor(Math.random()*1000);
    studentMap[s.id] = newId;
    await _supabase.from('students').insert({
      id: newId,
      user_id: userId,
      nama: s.nama,
      kelas: s.kelas || '',
      usia: s.usia || '',
      color: s.color || ''
    });
    if(s.hafalan){
      const memos = Object.entries(s.hafalan).map(([surahNo, status])=>({
        student_id: newId,
        surah_no: parseInt(surahNo),
        status: status
      }));
      if(memos.length) await _supabase.from('memorization').insert(memos);
    }
  }
  if(DEMO_STATE.guru){
    await _supabase.from('settings').upsert([
      { key:'guru', value: DEMO_STATE.guru||'', user_id: userId }
    ]);
  }
  for(const sub of DEMO_STATE.setoran){
    const mappedStudentId = studentMap[sub.santri_id];
    if(mappedStudentId){
      await _supabase.from('submissions').insert({
        id: sub.id,
        student_id: mappedStudentId,
        surah_no: sub.surah_no,
        nilai: sub.nilai || '',
        catatan: sub.catatan || '',
        tanggal: sub.tanggal || '',
        jam: sub.jam || ''
      });
    }
  }
}
