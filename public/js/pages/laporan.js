// ── LAPORAN / PRINT ──
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
    <div class="lap-title">${state.lembaga||'SMA Islam Bunga Bangsa'}</div>
    <div class="lap-sub">${judul}${state.guru?' · '+state.guru:''}</div>
    <div class="lap-date">Dicetak: ${nowStr()}</div>
    ${sub?`<div class="lap-date">${sub}</div>`:''}
  </div>`;
}

async function cetakKolektif(){
  if(!state.santri.length){alert('Belum ada santri.');return}
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
