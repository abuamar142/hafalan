// ── NAVIGATION ──
function showTab(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  ['santri','rekap','setoran-tab','laporan'].forEach((t,i)=>{
    if(t===id)document.querySelectorAll('.nav-tab')[i].classList.add('active');
  });
  if(id==='setoran-tab'){
    const n=new Date(),p=v=>String(v).padStart(2,'0');
    document.getElementById('inp-waktu').value=`${n.getFullYear()}-${p(n.getMonth()+1)}-${p(n.getDate())}T${p(n.getHours())}:${p(n.getMinutes())}`;
  }
}
function showModal(id){
  document.getElementById(id).style.display='flex';
  if(id==='modal-setting'){
    document.getElementById('inp-guru').value=state.guru||'';
  }
}
function closeModal(id){document.getElementById(id).style.display='none';}
