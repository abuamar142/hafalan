// ── NAVIGATION ──
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
    document.getElementById('inp-guru').value=state.guru||'';
  }
}
function closeModal(id){document.getElementById(id).style.display='none';}
