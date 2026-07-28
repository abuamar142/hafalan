// ── REKAP ──
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
