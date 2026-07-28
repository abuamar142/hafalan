// ── SANTRI CRUD ──
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
