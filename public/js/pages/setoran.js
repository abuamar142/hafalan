// ── SETORAN CRUD ──
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
      jam,
      guru_id: currentUser?.id || null
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
