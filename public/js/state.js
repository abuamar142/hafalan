// ── STATE ──
let state={lembaga:"SMA Islam Bunga Bangsa",guru:"",santri:[],setoran:[]};
let isDemo=false,activeSantriId=null,activeJuz=null;
let profileSantri=null;
let currentUser=null;

// ── HELPERS ──
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
