// ── BOOT ──
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

// ── SETTINGS ──
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

// ── INIT ──
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
