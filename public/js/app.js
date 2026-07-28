// ── BOOT ──
async function startApp(){
  document.getElementById('activation').style.display='none';
  const app=document.getElementById('app');
  app.style.display='flex';app.style.flexDirection='column';
  if(!isDemo) await refreshAll();
  if(isDemo) document.getElementById('demo-banner').style.display='block';
  renderGuruName();
  buildSurahSelect();updateSantriSelect();
  renderSantriList();renderRekap();renderSetoranGlobal();
}

function renderGuruName(){
  const el=document.getElementById('header-guru');
  el.textContent=state.guru||'';
}

// ── SETTINGS ──
async function saveSetting(){
  state.guru=document.getElementById('inp-guru').value.trim();
  renderGuruName();
  try{
    const { data: { user } } = await _supabase.auth.getUser();
    await _supabase.from('settings').upsert([
      { key:'guru', value:state.guru, user_id:user.id }
    ]);
  }catch(e){console.error('saveSetting',e)}
  closeModal('modal-setting');
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
