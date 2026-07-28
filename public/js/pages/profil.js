// ── PROFILE ──
async function openProfil(id){
  try {
    activeSantriId=id;
    await loadProfileSantri(id);
    if(!profileSantri){console.warn('openProfil: profileSantri null');return}
    document.getElementById('profil-nama-header').textContent=profileSantri.nama;
    document.getElementById('profil-screen').style.display='block';
    document.getElementById('app').style.display='none';
    renderProfilStats();renderPJuzGrid();renderPSetoran();
  } catch(e) { console.error('openProfil error:', e); }
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
