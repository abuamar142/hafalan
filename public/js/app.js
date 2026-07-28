// ── APPLICATION LOGIC ──

// ── STATE ────────────────────────────────────────────
let state={lembaga:"",guru:"",santri:[],setoran:[]};
let isDemo=false,activeSantriId=null,activeJuz=null;
let profileSantri=null;
let currentUser=null;

// ── AUTH ──────────────────────────────────────────────
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

// ── DEMO MODE ────────────────────────────────────────
async function mulaiDemo(){
  document.getElementById('demo-note').style.display='block';
  isDemo=true;
  // For demo, we still need a logged-in user
  // If not logged in, sign in with a demo approach:
  // Actually demo mode inserts data via Supabase client — user must be logged in first.
  // So demo mode only works when logged in. We just seed the data.
  try{
    const { data: { user } } = await _supabase.auth.getUser();
    if(!user){alert('Silakan masuk atau daftar terlebih dahulu');return}
    // Check if user already has data
    const { data: existing } = await _supabase.from('students').select('id').eq('user_id',user.id).limit(1);
    if(existing && existing.length > 0){
      // User already has data, just load it
      await refreshAll();
      startApp();
      return;
    }
    // Import DEMO_STATE into Supabase
    await importDemoData(user.id);
    await refreshAll();
  }catch(e){console.error('mulaiDemo',e)}
  startApp();
}

async function importDemoData(userId){
  // Insert students
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
    // Insert memorization
    if(s.hafalan){
      const memos = Object.entries(s.hafalan).map(([surahNo, status])=>({
        student_id: newId,
        surah_no: parseInt(surahNo),
        status: status
      }));
      if(memos.length) await _supabase.from('memorization').insert(memos);
    }
  }
  // Insert settings
  if(DEMO_STATE.lembaga || DEMO_STATE.guru){
    await _supabase.from('settings').upsert([
      { key:'lembaga', value: DEMO_STATE.lembaga||'', user_id: userId },
      { key:'guru', value: DEMO_STATE.guru||'', user_id: userId }
    ]);
  }
  // Insert submissions
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

async function startApp(){
  document.getElementById('activation').style.display='none';
  const app=document.getElementById('app');
  app.style.display='flex';app.style.flexDirection='column';
  if(!isDemo) await refreshAll();
  if(isDemo) document.getElementById('demo-banner').style.display='block';
  if(state.lembaga) document.getElementById('lembaga-name').textContent=state.lembaga;
  buildSurahSelect();updateSantriSelect();
  renderSantriList();renderRekap();renderSetoranGlobal();
}

// ── NAVIGATION ───────────────────────────────────────
function showTab(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  ['santri','rekap','setoran-tab','laporan'].forEach((t,i)=>{
    if(t===id)document.querySelectorAll('.nav-tab')[i].classList.add('active');
  });
}
function showModal(id){
  document.getElementById(id).style.display='flex';
  if(id==='modal-setting'){
    document.getElementById('inp-lembaga').value=state.lembaga||'';
    document.getElementById('inp-guru').value=state.guru||'';
  }
}
function closeModal(id){document.getElementById(id).style.display='none';}

// ── HELPERS ──────────────────────────────────────────
function getSantri(id){return state.santri.find(s=>s.id===id)}
function getJuzSurahs(j){return ALL_SURAHS.filter(s=>s.juz===j)}
function getPctFromCount(count){return Math.round(count/ALL_SURAHS.length*100)}
function getPct(s){return getPctFromCount(s.hafal_count||0)}
function getTotalHafal(s){return s.hafal_count||0}
function getJuzSurahsFromHafalan(hafalan,j){
  const ss=getJuzSurahs(j);
  return ss.length?Math.round(ss.filter(x=>(hafalan[x.no]||0)===1).length/ss.length*100):0;
}
function getJuzSelesaiFromHafalan(hafalan){
  return[...Array(30)].filter((_,i)=>getJuzSurahsFromHafalan(hafalan,i+1)===100).length;
}
function initials(n){return n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
function getColor(s,i){return s.color||AVATAR_COLORS[i%AVATAR_COLORS.length]}
function nowStr(){return new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}
function getSurahNama(no){
  const s=ALL_SURAHS.find(x=>x.no===no);
  return s?s.nama:'Surah '+no;
}

// ── SANTRI CRUD ──────────────────────────────────────
async function tambahSantri(){
  const nama=document.getElementById('inp-nama').value.trim();
  if(!nama){alert('Nama wajib diisi');return}
  try{
    const { data: { user } } = await _supabase.auth.getUser();
    const newId = Date.now();
    const count = state.santri.length;
    await _supabase.from('students').insert({
      id: newId,
      user_id: user.id,
      nama,
      kelas: document.getElementById('inp-kelas').value.trim(),
      usia: document.getElementById('inp-usia').value||'',
      color: AVATAR_COLORS[count % AVATAR_COLORS.length]
    });
    closeModal('modal-tambah');
    document.getElementById('inp-nama').value='';
    document.getElementById('inp-kelas').value='';
    document.getElementById('inp-usia').value='';
    await loadSantriList();
    renderSantriList();renderRekap();updateSantriSelect();
  }catch(e){alert('Gagal menyimpan: '+e.message)}
}

async function hapusSantriConfirm(){
  if(confirm('Hapus santri ini beserta seluruh data hafalannya?')){
    try{
      await _supabase.from('students').delete().eq('id',activeSantriId);
      closeProfil();
      await refreshAll();
      renderSantriList();renderRekap();updateSantriSelect();renderSetoranGlobal();
    }catch(e){alert('Gagal menghapus: '+e.message)}
  }
}

function renderSantriList(){
  const el=document.getElementById('santri-list');
  document.getElementById('jumlah-santri').textContent=state.santri.length+' santri terdaftar';
  if(!state.santri.length){el.innerHTML='<div class="empty">Belum ada santri.</div>';return}
  el.innerHTML=state.santri.map((s,i)=>{
    const pct=getPct(s);
    return`<div class="santri-item" onclick="openProfil(${s.id})">
      <div class="avatar" style="background:${getColor(s,i)}">${initials(s.nama)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:500">${s.nama}</div>
        <div style="font-size:11px;color:var(--tx3)">${s.kelas||'Tanpa kelas'}${s.usia?' · '+s.usia+' th':''} · ${getTotalHafal(s)} surah</div>
        <div class="progress-mini"><div class="progress-mini-fill" style="width:${pct}%;background:${getColor(s,i)}"></div></div>
      </div>
      <div style="font-size:13px;font-weight:500;color:${getColor(s,i)}">${pct}%</div>
    </div>`;
  }).join('');
}

// ── PROFILE ──────────────────────────────────────────
async function openProfil(id){
  activeSantriId=id;
  await loadProfileSantri(id);
  if(!profileSantri)return;
  document.getElementById('profil-nama-header').textContent=profileSantri.nama;
  document.getElementById('profil-screen').style.display='block';
  document.getElementById('app').style.display='none';
  renderProfilStats();renderPJuzGrid();renderPSetoran();
}
function closeProfil(){
  activeSantriId=null;profileSantri=null;
  document.getElementById('profil-screen').style.display='none';
  document.getElementById('app').style.display='flex';
  renderSantriList();renderRekap();
}
function renderProfilStats(){
  const s=profileSantri;
  const hafal=Object.values(s.hafalan||{}).filter(v=>v===1).length;
  const pct=getPctFromCount(hafal);
  const juzSelesai=getJuzSelesaiFromHafalan(s.hafalan||{});
  document.getElementById('p-hafal').textContent=hafal;
  document.getElementById('p-juz').textContent=juzSelesai;
  document.getElementById('p-pct').textContent=pct+'%';
  document.getElementById('p-bar').style.width=pct+'%';
}
function renderPJuzGrid(){
  const s=profileSantri,hafal=s.hafalan||{};
  const grid=document.getElementById('p-juz-grid');grid.innerHTML='';
  for(let j=1;j<=30;j++){
    const ss=getJuzSurahs(j);
    const hafalCount=ss.filter(x=>(hafal[x.no]||0)===1).length;
    const pct=ss.length?Math.round(hafalCount/ss.length*100):0;
    const hasAny=ss.some(x=>(hafal[x.no]||0)>0);
    const cls=pct===100?'hafal':pct>0||hasAny?'sebagian':'';
    grid.innerHTML+=`<div class="juz-btn ${cls}" onclick="openPJuz(${j})"><span class="juz-num">${j}</span><div class="juz-pct">${pct>0?pct+'%':''}</div></div>`;
  }
}
function openPJuz(juz){
  activeJuz=juz;
  const s=profileSantri,hafal=s.hafalan||{};
  document.getElementById('p-juz-grid-wrap').style.display='none';
  document.getElementById('p-juz-detail').style.display='block';
  document.getElementById('p-juz-title').textContent='Juz '+juz;
  const ss=getJuzSurahs(juz);
  const hafalCount=ss.filter(x=>(hafal[x.no]||0)===1).length;
  document.getElementById('p-juz-sub').textContent=`${hafalCount}/${ss.length} surah`;
  document.getElementById('p-surah-list').innerHTML=ss.map(x=>{
    const st=hafal[x.no]||0,cc=st===1?'hafal':st===2?'murajaah':'',ic=st===1?'✓':st===2?'↻':'';
    return`<div class="surah-item" onclick="toggleSurah(${x.no})">
      <div class="surah-check ${cc}">${ic}</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:500">${x.nama}</div><div style="font-size:11px;color:var(--tx3)">${x.ayat} ayat</div></div>
      <div style="font-size:16px;color:var(--tx2)">${x.arab}</div></div>`;
  }).join('');
}
function closePJuz(){
  activeJuz=null;
  document.getElementById('p-juz-grid-wrap').style.display='block';
  document.getElementById('p-juz-detail').style.display='none';
  renderPJuzGrid();renderProfilStats();
}
async function toggleSurah(no){
  const hafal=profileSantri.hafalan||{};
  const current=hafal[no]||0;
  const next=(current+1)%3;
  try{
    const { data: { user } } = await _supabase.auth.getUser();
    // Upsert memorization
    const { data: existing } = await _supabase.from('memorization')
      .select('id').eq('student_id',activeSantriId).eq('surah_no',no).maybeSingle();
    if(existing){
      await _supabase.from('memorization').update({status:next}).eq('id',existing.id);
    }else{
      await _supabase.from('memorization').insert({student_id:activeSantriId,surah_no:no,status:next});
    }
    await loadProfileSantri(activeSantriId);
    await loadSantriList();
    openPJuz(activeJuz);
  }catch(e){console.error('toggleSurah',e)}
}
function renderPSetoran(){
  const el=document.getElementById('p-setoran-list');
  const list=(profileSantri.setoran||[]);
  el.innerHTML=list.length?list.slice(0,15).map(x=>setoranCardHtml({
    id:x.id,
    santriNama:profileSantri.nama,
    surahNo:x.surah_no,
    surahNama:getSurahNama(x.surah_no),
    nilai:x.nilai,
    catatan:x.catatan,
    tanggal:x.tanggal,
    jam:x.jam
  },false)).join(''):'<div class="empty">Belum ada setoran</div>';
}

// ── SETORAN CRUD ─────────────────────────────────────
function buildSurahSelect(){
  const sel=document.getElementById('inp-surah-sel');
  ALL_SURAHS.forEach(s=>sel.innerHTML+=`<option value="${s.no}">${s.nama} (Juz ${s.juz})</option>`);
}
function updateSantriSelect(){
  ['inp-santri-sel','inp-lap-santri'].forEach(id=>{
    const sel=document.getElementById(id);if(!sel)return;
    sel.innerHTML='<option value="">-- Pilih Santri --</option>';
    state.santri.forEach(s=>sel.innerHTML+=`<option value="${s.id}">${s.nama}${s.kelas?' ('+s.kelas+')':''}</option>`);
  });
}
async function tambahSetoran(){
  const sid=parseInt(document.getElementById('inp-santri-sel').value);
  const sno=parseInt(document.getElementById('inp-surah-sel').value);
  if(!sid){alert('Pilih santri');return}if(!sno){alert('Pilih surah');return}
  const nilai=document.getElementById('inp-nilai').value;
  const catatan=document.getElementById('inp-catatan').value.trim();
  const wv=document.getElementById('inp-waktu').value;
  const wDate=wv?new Date(wv):new Date();
  const tanggal=wDate.toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
  const jam=wDate.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
  try{
    await _supabase.from('submissions').insert({
      id: Date.now(),
      student_id: sid,
      surah_no: sno,
      nilai,
      catatan,
      tanggal,
      jam
    });
    document.getElementById('inp-catatan').value='';
    await loadSetoranList();
    await loadSantriList();
    renderSetoranGlobal();renderSantriList();renderRekap();
  }catch(e){alert('Gagal menyimpan setoran: '+e.message)}
}
function setoranCardHtml(x,showSantri=true){
  return`<div class="setoran-card">
    <div class="setoran-head">
      <div class="setoran-surah">${showSantri&&x.santriNama?x.santriNama+' — ':''} ${x.surahNama}</div>
      <div class="setoran-date">${x.tanggal}${x.jam?' · '+x.jam:''}</div>
    </div>
    ${x.catatan?`<div class="setoran-note">${x.catatan}</div>`:''}
    <div class="nilai-badge">${x.nilai}</div>
  </div>`;
}
function renderSetoranGlobal(){
  const el=document.getElementById('setoran-history-global');
  el.innerHTML=state.setoran.length?state.setoran.slice(0,20).map(x=>setoranCardHtml({
    id:x.id,
    santriNama:x.santri_nama,
    surahNo:x.surah_no,
    surahNama:getSurahNama(x.surah_no),
    nilai:x.nilai,
    catatan:x.catatan,
    tanggal:x.tanggal,
    jam:x.jam
  },true)).join(''):'<div class="empty">Belum ada setoran</div>';
}

// ── REKAP ────────────────────────────────────────────
function renderRekap(){
  const sorted=[...state.santri].sort((a,b)=>getPct(b)-getPct(a));
  const el=document.getElementById('rekap-list');
  if(!sorted.length)el.innerHTML='<div class="empty">Belum ada santri</div>';
  else el.innerHTML=sorted.map((s,i)=>{
    const pct=getPct(s);
    const col=getColor(s,state.santri.indexOf(s));
    return`<div class="rekap-row">
      <div class="rekap-rank">${i+1}</div>
      <div class="rekap-nama">${s.nama}<div class="rekap-sub">${s.kelas||''}</div></div>
      <div class="rekap-bar"><div class="rekap-fill" style="width:${pct}%;background:${col}"></div></div>
      <div class="rekap-pct" style="color:${col}">${getTotalHafal(s)}</div>
    </div>`;
  }).join('');
  const avg=state.santri.length?Math.round(state.santri.reduce((a,s)=>a+getTotalHafal(s),0)/state.santri.length):0;
  document.getElementById('r-total').textContent=state.santri.length;
  document.getElementById('r-hafal').textContent=avg;
  document.getElementById('r-setoran').textContent=state.setoran.length;
}

// ── SETTINGS ─────────────────────────────────────────
async function saveSetting(){
  state.lembaga=document.getElementById('inp-lembaga').value.trim();
  state.guru=document.getElementById('inp-guru').value.trim();
  if(state.lembaga)document.getElementById('lembaga-name').textContent=state.lembaga;
  try{
    const { data: { user } } = await _supabase.auth.getUser();
    await _supabase.from('settings').upsert([
      { key:'lembaga', value:state.lembaga, user_id:user.id },
      { key:'guru', value:state.guru, user_id:user.id }
    ]);
  }catch(e){console.error('saveSetting',e)}
  closeModal('modal-setting');
}

async function resetData(){
  if(confirm('Hapus SEMUA data? Tidak bisa dibatalkan.')){
    try{
      const { data: { user } } = await _supabase.auth.getUser();
      // Delete all user's data
      const { data: students } = await _supabase.from('students').select('id').eq('user_id',user.id);
      if(students){
        const ids=students.map(s=>s.id);
        if(ids.length){
          await _supabase.from('submissions').delete().in('student_id',ids);
          await _supabase.from('memorization').delete().in('student_id',ids);
        }
        await _supabase.from('students').delete().eq('user_id',user.id);
      }
      await _supabase.from('settings').delete().eq('user_id',user.id);
      await refreshAll();
      closeModal('modal-setting');
      renderSantriList();renderRekap();renderSetoranGlobal();updateSantriSelect();
    }catch(e){alert('Gagal reset: '+e.message)}
  }
}

// ── LAPORAN / PRINT
function bukaLaporan(html){
  document.getElementById('print-content').innerHTML=html;
  document.getElementById('print-area').style.display='block';
  document.getElementById('app').style.display='none';
}
function tutupLaporan(){
  document.getElementById('print-area').style.display='none';
  document.getElementById('app').style.display='flex';
}
function lapHeader(judul,sub){
  return`<div class="lap-header">
    <div class="lap-logo">📖</div>
    <div class="lap-title">${state.lembaga||'Tracker Hafalan Al-Quran'}</div>
    <div class="lap-sub">${judul}${state.guru?' · '+state.guru:''}</div>
    <div class="lap-date">Dicetak: ${nowStr()}</div>
    ${sub?`<div class="lap-date">${sub}</div>`:''}
  </div>`;
}

async function cetakKolektif(){
  if(!state.santri.length){alert('Belum ada santri.');return}
  // Fetch full data for juz calculation
  let fullSantri={};
  try{
    const { data: { user } } = await _supabase.auth.getUser();
    const { data: students } = await _supabase.from('students').select('id').eq('user_id',user.id);
    const studentIds=(students||[]).map(s=>s.id);
    if(studentIds.length){
      const { data: memos } = await _supabase.from('memorization').select('student_id, surah_no, status').in('student_id',studentIds);
      (memos||[]).forEach(m=>{
        if(!fullSantri[m.student_id])fullSantri[m.student_id]={};
        fullSantri[m.student_id][m.surah_no]=m.status;
      });
    }
  }catch(e){/* fallback: juz column will show 0 */}
  const sorted=[...state.santri].sort((a,b)=>getPct(b)-getPct(a));
  const total=state.santri.length;
  const avgH=Math.round(state.santri.reduce((a,s)=>a+getTotalHafal(s),0)/total);
  const avgP=Math.round(state.santri.reduce((a,s)=>a+getPct(s),0)/total);
  const nilaiCount={};state.setoran.forEach(x=>{nilaiCount[x.nilai]=(nilaiCount[x.nilai]||0)+1});
  const html=`${lapHeader('Laporan Kolektif',`${total} santri · ${state.setoran.length} setoran`)}
    <div class="lap-section"><h2>Ringkasan Kelas</h2>
      <div class="lap-stats">
        <div class="lap-stat"><div class="lap-stat-num">${total}</div><div class="lap-stat-lbl">Total Santri</div></div>
        <div class="lap-stat"><div class="lap-stat-num">${avgH}</div><div class="lap-stat-lbl">Rata-rata Surah</div></div>
        <div class="lap-stat"><div class="lap-stat-num">${avgP}%</div><div class="lap-stat-lbl">Rata-rata Progress</div></div>
      </div></div>
    <div class="lap-section"><h2>Ranking Progress Santri</h2>
      <table class="lap-table"><thead><tr><th>#</th><th>Nama</th><th>Surah</th><th>Juz</th><th>Progress</th><th>Setoran</th></tr></thead>
      <tbody>${sorted.map((s,i)=>{
        const pct=getPct(s);
        const juz=getJuzSelesaiFromHafalan(fullSantri[s.id]||{});
        return`<tr>
        <td><span class="lap-rank">${i+1}</span></td>
        <td><strong>${s.nama}</strong><br><span style="font-size:11px;color:#888780">${s.kelas||'—'}</span></td>
        <td>${getTotalHafal(s)}</td><td>${juz}</td>
        <td><div class="lap-bar-wrap"><div class="lap-bar-fill" style="width:${pct}%"></div></div> ${pct}%</td>
        <td>${state.setoran.filter(x=>x.santri_id===s.id).length}</td></tr>`;}).join('')}
      </tbody></table></div>
    ${state.setoran.length?`<div class="lap-section"><h2>10 Setoran Terakhir</h2>
      ${state.setoran.slice(0,10).map(x=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #E1F5EE;font-size:12px">
        <div><strong>${x.santri_nama}</strong> — ${getSurahNama(x.surah_no)}</div>
        <div style="color:#888780;text-align:right">${x.tanggal}${x.jam?' · '+x.jam:''}
          <span style="background:#E1F5EE;color:#1D9E75;padding:1px 7px;border-radius:10px;margin-left:4px">${x.nilai}</span></div>
      </div>`).join('')}</div>`:''}`;
  bukaLaporan(html);setTimeout(()=>window.print(),400);
}

async function cetakIndividu(){
  const sid=parseInt(document.getElementById('inp-lap-santri').value);
  if(!sid){alert('Pilih santri terlebih dahulu');return}
  await loadProfileSantri(sid);
  if(!profileSantri){alert('Gagal memuat data santri');return}
  const s=profileSantri;
  const sListEntry=getSantri(sid);
  const idx=state.santri.indexOf(sListEntry);
  const col=getColor(sListEntry!={}?sListEntry:s,idx);
  const hafal=Object.values(s.hafalan||{}).filter(v=>v===1).length;
  const pct=getPctFromCount(hafal);
  const juz=getJuzSelesaiFromHafalan(s.hafalan||{});
  const setoranS=s.setoran||[];
  const juzCells=[...Array(30)].map((_,i)=>{
    const j=i+1;
    const ss=getJuzSurahs(j);
    const hc=ss.filter(x=>(s.hafalan[x.no]||0)===1).length;
    const p=ss.length?Math.round(hc/ss.length*100):0;
    const hasAny=ss.some(x=>(s.hafalan[x.no]||0)>0);
    const cls=p===100?'hafal':p>0||hasAny?'sebagian':'';
    return`<div class="lap-juz-cell ${cls}"><span class="lap-juz-num">${j}</span>${p>0?'<div style="font-size:9px">'+p+'%</div>':''}</div>`;
  }).join('');
  const surahHtml=[...Array(30)].map((_,i)=>{
    const list=getJuzSurahs(i+1).filter(x=>(s.hafalan[x.no]||0)===1);
    if(!list.length)return'';
    return`<div style="margin-bottom:8px"><div style="font-size:11px;font-weight:600;color:#1D9E75;margin-bottom:3px">Juz ${i+1}</div>
      ${list.map(x=>`<div style="font-size:12px;color:#5F5E5A;padding:2px 0">${x.nama}</div>`).join('')}</div>`;
  }).join('');
  const nilaiMap={};setoranS.forEach(x=>{nilaiMap[x.nilai]=(nilaiMap[x.nilai]||0)+1});
  const html=`${lapHeader('Laporan Individu','')}
    <div class="lap-individu">
      <div class="lap-ind-header">
        <div class="lap-ind-avatar" style="background:${col}">${initials(s.nama)}</div>
        <div>
          <div class="lap-ind-name">${s.nama}</div>
          <div class="lap-ind-meta">${s.kelas||'Tanpa kelas'}${s.usia?' · '+s.usia+' tahun':''}</div>
          <div class="lap-ind-meta" style="margin-top:4px">${hafal} surah · ${juz} juz · ${setoranS.length} setoran</div>
        </div>
        <div class="lap-ind-pct" style="color:${col}">${pct}%</div>
      </div>
      <div class="lap-section"><h2>Progress Per Juz</h2>
        <div style="background:#E1F5EE;border-radius:8px;height:12px;margin-bottom:14px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${col};border-radius:8px"></div></div>
        <div class="lap-juz-grid">${juzCells}</div>
        <div style="font-size:11px;color:#888780;margin-top:8px">
          <span style="background:#1D9E75;color:#fff;padding:2px 8px;border-radius:4px;margin-right:6px">Hafal</span>
          <span style="background:#FAEEDA;color:#BA7517;border:1px solid #BA7517;padding:2px 8px;border-radius:4px;margin-right:6px">Sebagian</span>
          <span style="background:#F1EFE8;color:#888780;border:1px solid #D3D1C7;padding:2px 8px;border-radius:4px">Belum</span>
        </div></div>
      ${surahHtml?`<div class="lap-section"><h2>Daftar Surah Dihafal</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${surahHtml}</div></div>`:''}
      ${setoranS.length?`<div class="lap-section"><h2>Riwayat Setoran (${setoranS.length})</h2>
        ${Object.keys(nilaiMap).length?`<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          ${Object.entries(nilaiMap).map(([k,v])=>`<div style="background:#E1F5EE;color:#1D9E75;padding:4px 10px;border-radius:20px;font-size:11px">${k}: ${v}x</div>`).join('')}</div>`:''}
        <table class="lap-table"><thead><tr><th>Surah</th><th>Nilai</th><th>Catatan</th><th>Waktu</th></tr></thead>
        <tbody>${setoranS.map(x=>`<tr>
          <td>${getSurahNama(x.surah_no)}</td>
          <td><span style="background:#E1F5EE;color:#1D9E75;padding:1px 7px;border-radius:10px;font-size:11px">${x.nilai}</span></td>
          <td style="font-size:11px;color:#5F5E5A">${x.catatan||'—'}</td>
          <td style="font-size:11px;white-space:nowrap">${x.tanggal}${x.jam?'<br>'+x.jam:''}</td>
        </tr>`).join('')}</tbody></table></div>`:''}
      <div style="margin-top:28px;padding-top:14px;border-top:1px solid #E1F5EE;display:flex;justify-content:space-between;font-size:12px;color:#888780">
        <div>Dicetak: ${nowStr()}</div>
        <div style="text-align:right">Ttd Ustadz/Ustadzah<br><br><br>__________________<br>${state.guru||'( )'}</div>
      </div>
    </div>`;
  bukaLaporan(html);setTimeout(()=>window.print(),400);
}

// ── INIT ─────────────────────────────────────────────
(async function init(){
  updateSantriSelect();
  const loggedIn=await checkAuth();
  if(loggedIn){
    startApp();
  }else{
    document.getElementById('activation').style.display='flex';
    showLogin();
  }
})();
