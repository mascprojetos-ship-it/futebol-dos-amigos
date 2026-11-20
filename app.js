(function(){
'use strict';
var HEAD='<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Futebol dos Amigos</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet">';
var COLORS=[{n:'Vermelho',c:'#C84345',t:'#ffffff',e:'🔴'},{n:'Verde',c:'#2A9D5B',t:'#06110a',e:'🟢'},{n:'Amarelo',c:'#B59A5A',t:'#17130b',e:'🟡'},{n:'Azul',c:'#496B8D',t:'#fff',e:'🔵'},{n:'Branco',c:'#DDE4DD',t:'#111',e:'⚪'},{n:'Preto',c:'#26302A',t:'#fff',e:'⚫'}];
var POS=[['','Qualquer'],['G','Goleiro'],['Z','Zagueiro'],['L','Lateral'],['V','Volante'],['MA','Meia atacante'],['A','Atacante']];
var POSSHORT={Z:'Zag',G:'Gol',L:'Lat',V:'Vol',MA:'MAt',A:'Ata'};
var POSIDX={G:0,Z:1,L:2,V:3,MA:4,A:5};
var POSMIGRATE={D:'L',M:'V'};
var DRAFT_KEY='fda-rascunho-v1',LOCAL_KEY='fda-local-v1';
var ART=null;
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fmt(v){return (Math.round(v*10)/10).toString().replace('.',',');}
function uid(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);}
function norm(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function lsGet(k){try{var v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function lsDel(k){try{localStorage.removeItem(k);}catch(e){}}

var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
function monthKey(d){d=new Date(d);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
function monthLabel(k,cap){var p=String(k).split('-');var s=MESES[(+p[1]||1)-1]+' de '+p[0];return cap?s.charAt(0).toUpperCase()+s.slice(1):s;}
function monthName(k){var p=String(k).split('-');return MESES[(+p[1]||1)-1];}
function shiftMonth(k,n){var p=k.split('-');return monthKey(new Date(+p[0],+p[1]-1+n,1));}
function curMonthKey(){return dateBR(nextGame()).slice(0,7);}
function monthTeams(k){var m=S.meses&&S.meses[k];return m&&m.teams&&m.teams.length>=2&&m.teams[0].length&&m.teams[1].length?m.teams:null;}
function monthEnded(k){var p=k.split('-');return Date.now()>new Date(+p[0],+p[1],1).getTime();}
function findByName(n){n=norm(n||'');if(!n)return null;for(var i=0;i<S.players.length;i++)if(norm(S.players[i].name)===n)return S.players[i];return null;}
function rid(g,id){if(/^n:/.test(id)){var p=findByName((g&&g.names&&g.names[id])||id.slice(2));return p?p.id:id;}return id;}
function normMeses(raw,seen){var o={};if(!raw||typeof raw!=='object')return o;
  Object.keys(raw).forEach(function(k){if(!/^\d{4}-\d{2}$/.test(k))return;var m=raw[k]||{};
    var teams=(Array.isArray(m.teams)?m.teams:[]).slice(0,6).map(function(t){return (Array.isArray(t)?t:[]).map(String).filter(function(id){return seen[id];});});
    o[k]={teams:teams,campeao:(m.campeao===0||m.campeao===1)?m.campeao:null,
      titulares:teams.map(function(team,i){return (Array.isArray(m.titulares&&m.titulares[i])?m.titulares[i]:[]).filter(function(id){return team.includes(id);}).slice(0,11);})};});
  return o;}
function defaults(){return {meses:{},seedSeen:[],posts:[],info:defInfo(),v:4,savedAt:0,players:[],present:[],settings:{teams:2,gk:true,rot:'forte',lookback:4,shareStars:false,starters:11,arrival:false},history:[],current:null};}
function defInfo(){return {redes:{instagram:'https://www.instagram.com/futeboldosamigoseresenha',tiktok:'https://www.tiktok.com/@futebolamigosdebel',facebook:'https://www.facebook.com/share/1CmbB5RWsz/'},fields:defFields(),fieldId:'imperial',name:'Futebol dos Amigos',kickoff:'06:00',arrival:'05:40',feeDay:10,logo:'',notices:[
  {id:'n1',text:'Pelada todo domingo. Bola rolando às 6h00.'},
  {id:'n2',text:'Chegue até as 5h40 para garantir a titularidade.'},
  {id:'n3',text:'Mensalidade em dia: pagamento até o dia 10 de cada mês.'}],festa:FESTA_11};}
var FESTA_11={date:'2026-11-22',deadline:'2026-11-15',local:'Espaço Casa de Pedra em Xavantes (próximo ao campo do Imperial)',pix:'0e1e4a25-fdd3-49c3-b94b-5c0cf172e067',family:200,individual:100};
var DAY_IN_BRAZIL=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'});
function dateBR(value){return DAY_IN_BRAZIL.format(value==null?new Date():new Date(value));}
function validDay(s){
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return '';
  var day=new Date(s+'T12:00:00Z');
  return Number.isFinite(day.getTime())&&day.toISOString().slice(0,10)===s?s:'';
}
function noticeDay(n){
  if(n.expires)return n.expires;
  var m=n.text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  return m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):'';
}
function noticeCurrent(n){var expiry=noticeDay(n);return !/(festa|camisa).*100 anos/i.test(n.text)&&(!expiry||expiry>=dateBR());}
function defFields(){return [
  {id:'imperial',name:'Campo do Imperial',bairro:'Xavante, Belford Roxo',principal:true,maps:'https://maps.google.com/?cid=1535000346773440182',photo:''},
  {id:'municipal',name:'Campo do Municipal',bairro:'Santa Maria, Belford Roxo',principal:false,maps:'https://maps.google.com/?cid=1335929745765286090',photo:''}];}
function validMaps(value){
  try{
    var url=new URL(value);
    return url.protocol==='https:'&&!url.username&&!url.password&&(
      ['maps.google.com','maps.app.goo.gl'].includes(url.hostname)||
      (['google.com','www.google.com','goo.gl'].includes(url.hostname)&&/^\/maps(?:\/|$)/.test(url.pathname))
    );
  }catch(error){return false;}
}
function normFields(arr){
  var d=defFields();if(!Array.isArray(arr)||!arr.length)return d;
  return arr.filter(function(x){return x&&x.id;}).slice(0,6).map(function(x){return {id:String(x.id).slice(0,30),name:String(x.name||'Campo').slice(0,50),bairro:String(x.bairro||'').slice(0,80),principal:!!x.principal,
    maps:validMaps(x.maps)?String(x.maps).slice(0,300):'',
    photo:(typeof x.photo==='string'&&/^data:image\/(jpeg|png|webp);base64,/.test(x.photo)&&x.photo.length<420000)?x.photo:''};});
}
function curField(){var F=S.info.fields;for(var i=0;i<F.length;i++)if(F[i].id===S.info.fieldId)return F[i];return F[0];}
function fieldById(id){var F=S.info.fields;for(var i=0;i<F.length;i++)if(F[i].id===id)return F[i];return null;}
function normTime(t,def){return /^([01]\d|2[0-3]):[0-5]\d$/.test(t||'')?t:def;}
function normInfo(i){
  var d=defInfo();if(!i||typeof i!=='object')return d;
  var fl=normFields(i.fields),rd=i.redes&&typeof i.redes==='object'?i.redes:d.redes,okR=function(u,dom){return typeof u==='string'&&new RegExp('^https://([a-z0-9-]+\\.)*'+dom+'/','i').test(u.trim())?u.trim().slice(0,300):'';};
  var fixture=i.proximoJogo||{},fixtureDay=validDay(fixture.date),fixtureTime=normTime(fixture.kickoff,'');
  var proximoJogo=fixtureDay&&fixtureTime&&fl.some(function(f){return f.id===fixture.campo;})?
    {date:fixtureDay,kickoff:fixtureTime,arrival:normTime(fixture.arrival,''),campo:fixture.campo}:null;
  return {proximoJogo:proximoJogo,descricao:typeof i.descricao==='string'?i.descricao.trim().slice(0,180):'',redes:{instagram:okR(rd.instagram,'instagram\\.com'),tiktok:okR(rd.tiktok,'tiktok\\.com'),facebook:okR(rd.facebook,'(facebook\\.com|fb\\.com|fb\\.me)')},fields:fl,fieldId:(fl.some(function(x){return x.id===i.fieldId;})?i.fieldId:fl[0].id),name:(typeof i.name==='string'&&i.name.trim()?i.name.trim().slice(0,40):d.name),kickoff:normTime(i.kickoff,d.kickoff),arrival:normTime(i.arrival,d.arrival),
    feeDay:Math.min(28,Math.max(1,parseInt(i.feeDay,10)||d.feeDay)),
    logo:(typeof i.logo==='string'&&/^data:image\/(png|jpeg|webp);base64,/.test(i.logo)&&i.logo.length<260000)?i.logo:'',
    festa:i.festa&&i.festa.date===FESTA_11.date?i.festa:FESTA_11,
    notices:Array.isArray(i.notices)?i.notices.filter(function(n){return n&&typeof n.text==='string';}).map(function(n){return {id:String(n.id||uid()),text:n.text.slice(0,240),expires:validDay(n.expires)};}).slice(0,30):d.notices};
}
function clampStar(x){x=Number(x);if(!isFinite(x))return 3;return Math.min(5,Math.max(0.5,Math.round(x*2)/2));}
function normalize(raw){
  var d=defaults();if(!raw||typeof raw!=='object')return d;
  var seen={};
  d.players=(Array.isArray(raw.players)?raw.players:[]).filter(function(p){return p&&typeof p.name==='string'&&p.name.trim();}).map(function(p){
    var id=String(p.id||uid());if(seen[id])id=uid();seen[id]=1;
    var pos=POSMIGRATE[p.pos]||p.pos;
    var ph=(typeof p.photo==='string'&&/^data:image\/(jpeg|png|webp);base64,/.test(p.photo)&&p.photo.length<90000)?p.photo:'';
    var nu=parseInt(p.num,10);return {id:id,name:p.name.trim().slice(0,30),stars:clampStar(p.stars),pos:POSIDX[pos]!==undefined?pos:'',photo:ph,num:(nu>0&&nu<100)?nu:0};
  });
  d.present=(Array.isArray(raw.present)?raw.present:[]).map(String).filter(function(id,i,a){return seen[id]&&a.indexOf(id)===i;});
  var s=raw.settings||{};
  d.settings={teams:Math.min(6,Math.max(2,parseInt(s.teams,10)||2)),gk:s.gk!==false,rot:['off','normal','forte'].indexOf(s.rot)>=0?s.rot:'normal',lookback:Math.min(8,Math.max(1,parseInt(s.lookback,10)||4)),shareStars:!!s.shareStars,starters:Math.min(11,Math.max(3,parseInt(s.starters,10)||11)),arrival:false};
  d.history=(Array.isArray(raw.history)?raw.history:[]).filter(function(h){return h&&Array.isArray(h.teams);}).map(normGame).sort(function(a,b){return b.date-a.date;}).slice(0,1500);
  var c=raw.current;
  if(c&&Array.isArray(c.teams)&&c.teams.length>=2){d.current={teams:c.teams.map(function(t){return (Array.isArray(t)?t:[]).map(String).filter(function(id){return seen[id];});}),date:Number(c.date)||Date.now(),confirmed:!!c.confirmed,histId:c.histId?String(c.histId):null,gameDate:Number(c.gameDate)||0,campo:c.campo?String(c.campo).slice(0,30):'',roles:normRoles(c.roles,seen),order:(Array.isArray(c.order)?c.order.map(String).filter(function(id){return seen[id];}):[])};}
  d.info=normInfo(raw.info);
  d.posts=normPosts(raw.posts);
  d.meses=normMeses(raw.meses,seen);
  d.seedSeen=(Array.isArray(raw.seedSeen)?raw.seedSeen:[]).map(String).slice(0,500);
  if(d.current&&d.current.confirmed&&!raw.meses&&d.current.teams.length>=2){var mk=monthKey(d.current.gameDate||d.current.date);if(!d.meses[mk])d.meses[mk]={teams:d.current.teams.map(function(t){return t.slice();}),campeao:null};d.current.month=mk;}
  if(d.current)d.current.month=(raw.current&&/^\d{4}-\d{2}$/.test(raw.current.month||''))?raw.current.month:(d.current.month||monthKey(d.current.gameDate||d.current.date));
  var vt=raw.votacao||{};d.votacao={rodada:vt.rodada?String(vt.rodada).slice(0,40):null,aberta:!!vt.aberta&&!!vt.rodada};
  d.savedAt=Number(raw.savedAt)||0;
  return d;
}
function cnum(v,max){v=parseInt(v,10);return isFinite(v)&&v>0?Math.min(max,v):0;}
function normRoles(r,seen){var o={};if(r&&typeof r==='object')Object.keys(r).forEach(function(id){if(seen[id]&&r[id]==='R')o[id]='R';});return o;}
function normGame(h){
  var g={roles:(function(){var o={};if(h.roles&&typeof h.roles==='object')Object.keys(h.roles).forEach(function(id){if(h.roles[id]==='R')o[String(id)]='R';});return o;})(),campo:h.campo?String(h.campo).slice(0,30):'',id:String(h.id||uid()),date:Number(h.date)||Date.now(),teams:h.teams.map(function(t){return (Array.isArray(t)?t:[]).map(String);}),stats:{},names:{},cheia:h.cheia?String(h.cheia):null,murcha:h.murcha?String(h.murcha):null,sumula:!!h.sumula};
  var all={};g.teams.forEach(function(t){t.forEach(function(id){all[id]=1;});});
  g.sem=(Array.isArray(h.sem)?h.sem:[]).map(String).filter(function(id,i,a){return !all[id]&&a.indexOf(id)===i;});g.sem.forEach(function(id){all[id]=1;});
  var st=h.stats&&typeof h.stats==='object'?h.stats:{};
  Object.keys(st).forEach(function(id){if(!all[id])return;var s=st[id]||{};var o={g:cnum(s.g,30),a:cnum(s.a,30),y:cnum(s.y,2),r:cnum(s.r,1),pen:cnum(s.pen,30),fal:cnum(s.fal,30),og:cnum(s.og,30)};if(o.pen+o.fal>o.g)o.g=o.pen+o.fal;if(o.g||o.og||o.a||o.y||o.r)g.stats[id]=o;});
  var nm=h.names&&typeof h.names==='object'?h.names:{},semTimes=!Object.keys(all).length;
  Object.keys(nm).forEach(function(id){if((all[id]||semTimes)&&typeof nm[id]==='string')g.names[id]=nm[id].slice(0,30);});
  if(semTimes){g.cheia=g.cheia?String(g.cheia).slice(0,60):null;g.murcha=g.murcha?String(g.murcha).slice(0,60):null;}
  else{if(g.cheia&&!all[g.cheia]&&!/^n:/.test(g.cheia))g.cheia=null;if(g.murcha&&!all[g.murcha]&&!/^n:/.test(g.murcha))g.murcha=null;Object.keys(nm).forEach(function(id){if(/^n:/.test(id)&&typeof nm[id]==='string')g.names[id]=nm[id].slice(0,30);});}
  var pl=h.placar&&typeof h.placar==='object'?h.placar:null;
  g.placar=(pl&&isFinite(parseInt(pl.v,10))&&isFinite(parseInt(pl.g,10)))?{v:Math.min(50,Math.max(0,parseInt(pl.v,10))),g:Math.min(50,Math.max(0,parseInt(pl.g,10)))}:null;
  g.live=h.live===true;
  g.liveOps=(Array.isArray(h.liveOps)?h.liveOps:[]).filter(function(id){return typeof id==='string';}).slice(-200);
  g.liveGoals=(Array.isArray(h.liveGoals)?h.liveGoals:[]).filter(function(goal){
    return goal&&typeof goal.id==='string'&&['v','g'].includes(goal.side)&&['normal','pen','fal','contra'].includes(goal.kind);
  }).slice(-200).map(function(goal){
    return {id:goal.id.slice(0,80),side:goal.side,kind:goal.kind,player:typeof goal.player==='string'?goal.player.slice(0,80):'',
      undone:goal.undone===true,locked:goal.locked===true};
  });
  g.obs=typeof h.obs==='string'?h.obs.slice(0,2000):'';
  g.resenha={};
  ['cheia','murcha'].forEach(function(k){var item=h.resenha&&h.resenha[k];if(item&&item.atleta===g[k]&&typeof item.motivo==='string')g.resenha[k]={atleta:item.atleta,motivo:item.motivo.slice(0,180)};});
  g.voiceEntries=Array.isArray(h.voiceEntries)?h.voiceEntries.filter(function(x){return typeof x==='string';}).slice(-20):[];
  g.vencedor=(h.vencedor===0||h.vencedor===1||h.vencedor===-1)?h.vencedor:null;g.valida=h.valida!==false;
  g.adv=typeof h.adv==='string'?h.adv.replace(/\s+/g,' ').trim().slice(0,40):'';
  /* cobertura: o que foi REGISTRADO de verdade (ausência de registro nunca vira zero).
     Jogos antigos sem 'cob': tinham súmula => gols, assistências, pênaltis e cartões eram conhecidos; falta não existia => desconhecida. */
  var cb=(h.cob&&typeof h.cob==='object')?h.cob:null,legado=!!h.sumula||Object.keys(g.stats).length>0,tem=Object.keys(all).length>0;
  g.cob={e:cb?!!cb.e:tem,g:cb?!!cb.g:legado,a:cb?!!cb.a:legado,p:cb?!!cb.p:legado,f:cb?!!cb.f:false,o:!!cb?.o||Object.values(g.stats).some(function(s){return s.og>0;}),c:cb?!!cb.c:legado};
  if(!cb)Object.keys(g.stats).forEach(function(id){var s=g.stats[id];if(s.g)g.cob.g=true;if(s.a)g.cob.a=true;if(s.pen)g.cob.p=true;if(s.fal)g.cob.f=true;if(s.y||s.r)g.cob.c=true;});
  var jr=h.juri&&typeof h.juri==='object'?h.juri:{},vl=[];
  if(Array.isArray(jr.votos))vl=jr.votos;
  else if(jr.votos&&typeof jr.votos==='object')vl=Object.keys(jr.votos).map(function(id){return {nome:(g.names[id]||id),cheia:jr.votos[id].cheia,murcha:jr.votos[id].murcha};});
  var seenV={};
  var dsp=jr.desempate&&typeof jr.desempate==='object'?jr.desempate:{};
  g.juri={desempate:{cheia:(dsp.cheia&&all[dsp.cheia])?String(dsp.cheia):'',murcha:(dsp.murcha&&all[dsp.murcha])?String(dsp.murcha):''},final:!!jr.final,votos:vl.filter(function(v){return v&&typeof v.nome==='string'&&v.nome.trim();}).map(function(v){return {nome:v.nome.trim().slice(0,30),cheia:(v.cheia&&all[v.cheia])?String(v.cheia):'',murcha:(v.murcha&&all[v.murcha])?String(v.murcha):''};}).filter(function(v){var k=norm(v.nome);if(seenV[k])return false;seenV[k]=1;return v.cheia||v.murcha;}).slice(0,5)};
  return g;
}

var S=normalize(null);
var CFG=window.FDA_CONFIG||{},SITE=window.FDA_MODE==='diretoria'?'diretoria':'publico',SB=null,rowVersion=0;
var mode='readonly',dirty=false,retried=false,editRevision=0;
var ui={role:'',loading:true,fatal:null,login:false,loginErr:'',loginBusy:false,user:'',confirmLogout:false,preview:false,offline:false,photoSheet:null,postDraft:null,lightbox:null,openOrders:null,tabTouched:false,editGame:null,editPlayer:null,photoFor:null,photoMenu:null,period:'all',tab:S.players.length?'sorteio':'avisos',sel:null,recover:null,busy:false,toast:'',confirmDel:null,confirmClear:false,copyText:null,bulkMsg:'',showStars:true,restoreOpen:false};

function byId(id){for(var i=0;i<S.players.length;i++)if(S.players[i].id===id)return S.players[i];return null;}
function change(){editRevision++;dirty=true;lsSet(DRAFT_KEY,{base:S.savedAt,state:S});render();}
var toastTimer=null;
function toast(msg){ui.toast=msg;render();clearTimeout(toastTimer);toastTimer=setTimeout(function(){ui.toast='';render();},3200);}

/* ---------- persistência ---------- */
function applyDraft(){
  var draft=lsGet(DRAFT_KEY);
  if(!draft||!draft.state)return;
  if(draft.base===S.savedAt){var b=S.savedAt;S=normalize(draft.state);S.savedAt=b;dirty=true;}
  else ui.recover=draft;
}
function configured(){if(CFG.url)CFG.url=String(CFG.url).trim().replace(/\/rest\/v1\/?$/,'').replace(/\/+$/,'');if(CFG.chave)CFG.chave=String(CFG.chave).trim();var local=(location.hostname==='127.0.0.1'||location.hostname==='localhost')&&/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(CFG.url);return CFG.url&&CFG.chave&&(local||/^https:\/\//.test(CFG.url))&&CFG.chave.indexOf('COLE-AQUI')<0;}
function localSnapshotRequested(){return (location.hostname==='127.0.0.1'||location.hostname==='localhost')&&new URLSearchParams(location.search).get('snapshot')==='1';}
function loadSnapshot(){
  return fetch('/dados-iniciais.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('Snapshot indisponível');return r.json();}).then(function(d){
    return fetch('/novembro-2026.json').then(function(r){if(!r.ok)throw new Error('Escalação indisponível');return r.json();}).then(function(nov){
      var ids=new Set(d.players.map(function(p){return p.id;}));
      d.players=d.players.concat(nov.players.filter(function(p){return !ids.has(p.id);}));
      d.meses=Object.assign({},d.meses,{'2026-11':{teams:nov.teams,campeao:null}});
      return d;
    });
  }).then(function(d){
    S=normalize(d);S.savedAt=0;rowVersion=0;dirty=false;mode='readonly';ui.role='public';ui.loading=false;ui.fatal=null;ui.offline=true;
    if(!ui.tabTouched)ui.tab='avisos';return applySeeds(false).then(render);
  }).catch(function(){ui.loading=false;ui.fatal='Não consegui abrir a cópia local dos dados. Tente novamente.';render();});
}
function openDirectorSession(session,quiet){
  if(!session||!session.user||!session.user.email){
    ui.manageAccess=false;
    mode='readonly';
    ui.login=true;
    ui.loading=false;
    render();
    return;
  }
  return SB.from('fda_diretoria').select('*').ilike('email',session.user.email.replace(/[\\_%]/g,'\\$&')).limit(1).maybeSingle().then(function(result){
    if(result.error||!result.data){
      ui.manageAccess=false;
      mode='readonly';
      ui.login=true;
      ui.loading=false;
      ui.loginErr=result.error?'Não consegui confirmar o acesso. Tente novamente.':'Esta conta não está cadastrada na diretoria.';
      render();
      return;
    }
    ui.login=false;
    ui.manageAccess=result.data.pode_gerenciar_acessos===true;
    ui.user=session.user.email;
    if(!ui.livePending)restoreLivePending();
    return load(quiet);
  },function(){
    ui.manageAccess=false;
    mode='readonly';
    ui.login=true;
    ui.loading=false;
    ui.loginErr='Sem conexão para confirmar o acesso. Tente novamente.';
    render();
  });
}
function init(){
  if(SITE==='publico'&&localSnapshotRequested()){loadSnapshot();return;}
  if(!configured()){ui.fatal='O site ainda não foi configurado. Falta colocar o endereço e a chave do banco de dados no arquivo config.js.';render();return;}
  if(SITE==='diretoria'){
    if(!window.supabase||!window.supabase.createClient){ui.fatal='Não consegui carregar o sistema. Verifique a internet e recarregue a página.';render();return;}
    SB=window.supabase.createClient(CFG.url,CFG.chave);
    SB.auth.getSession().then(function(r){return openDirectorSession(r&&r.data&&r.data.session);},function(){return openDirectorSession(null);});
  }else{
    mode='readonly';ui.role='public';load();
    setInterval(function(){
      if(S.history.some(function(g){return g.live;})||Date.now()-lastPublicRefresh>=5000)refreshPublic();
    },1500);
    window.addEventListener('online',refreshPublic);
  }
  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState!=='visible'||dirty||ui.login||ui.postDraft||ui.editGame||ui.fatal||ui.loading)return;
    if(SITE==='diretoria'){
      SB.auth.getSession().then(function(result){
        return openDirectorSession(result&&result.data&&result.data.session,true);
      },function(){return openDirectorSession(null,true);});
    }else refreshPublic();
  });
}
function explainErr(e){
  var code=String(e.code||''),msg=String(e.message||''),det=' (código: '+(code||'?')+(msg?' · '+msg.slice(0,120):'')+')';
  if(code==='PGRST116')return 'O banco existe, mas está sem a linha de dados. Rode de novo o arquivo configurar-banco.sql no SQL Editor do Supabase.'+det;
  if(code==='PGRST205'||code==='42P01'||/does not exist|Could not find the table/i.test(msg))return 'O banco de dados ainda não foi preparado. Rode o arquivo configurar-banco.sql no SQL Editor do Supabase e depois toque em Tentar de novo.'+det;
  if(code==='42501'||/permission denied/i.test(msg))return 'O banco recusou a leitura (permissão). Rode de novo o arquivo configurar-banco.sql inteiro no SQL Editor.'+det;
  if(/api key|apikey|jwt|No API key/i.test(msg)||code==='401'||code==='PGRST301')return 'A chave do Supabase no config.js não foi aceita. Confira se é a chave publishable (sb_publishable_…).'+det;
  if(/fetch|network|Load failed/i.test(msg))return 'Não consegui falar com o banco. Verifique a internet ou o endereço do projeto no config.js.'+det;
  return 'Não consegui carregar os dados agora. Toque em Tentar de novo.'+det;
}
/* Sementes (publicações e rodadas que acompanham o site). O visitante só baixa o arquivo grande quando o índice leve (novidades-ids.json) mostra algo ainda não gravado no banco. */
function applySeeds(persist){
  if(persist||S.seedSeen.length===0)return seedsRun(persist);
  return fetch('/novidades-ids.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}).then(function(ix){
    if(!ix||!Array.isArray(ix.ids))return;
    if(ix.ids.every(function(k){return S.seedSeen.indexOf(k)>=0;}))return;
    return seedsRun(false);
  });
}
function seedsRun(persist){
  return fetch('/novidades.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}).then(function(sd){
    if(!sd)return;var seen=S.seedSeen,added=0;
    (sd.posts||[]).forEach(function(p){var k='post:'+p.id;if(seen.indexOf(k)>=0)return;seen.push(k);if(S.posts.some(function(x){return x.id===p.id;}))return;S.posts.push(normPosts([p])[0]);added++;});
    S.posts=normPosts(S.posts);
    Object.keys(sd.meses||{}).forEach(function(mk){var k='mes:'+mk;if(seen.indexOf(k)>=0)return;seen.push(k);var m=sd.meses[mk];if(!S.meses[mk])S.meses[mk]={teams:[],campeao:null};if(S.meses[mk].campeao===null&&(m.campeao===0||m.campeao===1)){S.meses[mk].campeao=m.campeao;added++;}});
    (sd.rodadas||[]).forEach(function(r){var k='rod:'+r.id;if(seen.indexOf(k)>=0)return;seen.push(k);
      if(S.history.some(function(g){return g.id===r.id||isoDate(new Date(g.date))===isoDate(new Date(r.date));}))return;
      var nm={},res=function(n){if(!n)return null;var p=findByName(n);if(p){nm[p.id]=p.name;return p.id;}var id='n:'+n;nm[id]=n;return id;};
      var g=normGame({id:r.id,date:r.date,teams:[[],[]],names:{},campo:r.campo||'imperial',stats:{},obs:r.obs||'',vencedor:r.vencedor,valida:r.valida});
      g.cheia=res(r.cheia);g.murcha=res(r.murcha);g.names=nm;g.sumula=true;g.juri={final:false,votos:[]};
      S.history.push(g);S.history.sort(function(a,b){return b.date-a.date;});added++;});
    (sd.patches||[]).forEach(function(pt){var k='patch:'+pt.id;if(seen.indexOf(k)>=0)return;seen.push(k);
      var res=function(n){var alts=String(n).split('|'),p=null;for(var i=0;i<alts.length&&!p;i++)p=findByName(alts[i]);return p;};
      if(pt.post){var po=S.posts.filter(function(x){return x.id===pt.post;})[0];if(po){if(pt.body)po.body=pt.body;if(pt.title)po.title=pt.title;added++;}return;}
      var g=S.history.filter(function(x){return x.id===pt.rodada||(pt.date&&isoDate(new Date(x.date))===pt.date);})[0];if(!g)return;
      if(pt.placar)g.placar={v:pt.placar.v,g:pt.placar.g};
      if(pt.times)[pt.times.vermelho||[],pt.times.verde||[]].forEach(function(lst,ti){lst.forEach(function(n){var p=res(n);if(p&&g.teams[ti].indexOf(p.id)<0&&g.teams[1-ti].indexOf(p.id)<0){g.teams[ti].push(p.id);g.names[p.id]=p.name;}});});
      if(pt.stats)Object.keys(pt.stats).forEach(function(n){var p=res(n);if(!p)return;var s=pt.stats[n];g.stats[p.id]={g:s.g||0,a:s.a||0,y:s.y||0,r:s.r||0,pen:s.pen||0,fal:s.fal||0};});
      if(pt.stats){g.cob.g=g.cob.a=g.cob.p=g.cob.c=true;}
      if(pt.cheia){var pc=res(pt.cheia);if(pc)g.cheia=pc.id;}
      if(pt.obs)g.obs=pt.obs;g.sumula=true;added++;});
    if(added&&persist){change();save();toast('Atualizado: '+added+' novidade'+(added>1?'s':'')+' de setembro (jornal, rodadas e súmula).');}
    else render();
  });
}
/* A leitura pública usa apenas a chave publicável, mesmo neste navegador quando há sessão da diretoria. */
async function pubFetch(columns){
  var options={cache:'no-store',headers:{apikey:CFG.chave,Accept:'application/vnd.pgrst.object+json'}};
  if(typeof AbortSignal!=='undefined'&&AbortSignal.timeout)options.signal=AbortSignal.timeout(10000);
  var response=await fetch(CFG.url+'/rest/v1/fda_estado?select='+(columns||'dados,versao')+'&id=eq.1',options);
  var row=await response.json();
  return response.ok&&row&&typeof row==='object'?{data:row,error:null}:{data:null,error:{code:String(response.status)}};
}
function fetchRow(){
  return SITE==='diretoria'?SB.from('fda_estado').select('dados,versao').eq('id',1).single():pubFetch();
}
var publicRefreshBusy=false,lastPublicRefresh=0,lastVideoRefresh=0;
function publicVideoOpen(){return !!document.querySelector('.video-card video,.video-card iframe');}
async function refreshPublic(){
  if(SITE!=='publico'||localSnapshotRequested()||publicRefreshBusy||ui.loading||document.hidden||publicVideoOpen())return;
  publicRefreshBusy=true;lastPublicRefresh=Date.now();
  try{
    var check=await pubFetch('versao');
    if(!check.error&&Number.isInteger(check.data?.versao)&&(ui.offline||check.data.versao>rowVersion)&&!publicVideoOpen())await load(true);
  }catch(error){
    // A falha temporária não substitui os dados que já estavam na tela.
  }finally{
    if(['tv','lances'].includes(ui.tab)&&!publicVideoOpen()&&Date.now()-lastVideoRefresh>=20000){
      lastVideoRefresh=Date.now();loadVideoLibrary(true);
    }
    publicRefreshBusy=false;
  }
}
function load(quiet){
  if(!quiet){ui.loading=true;render();}
  return fetchRow().then(function(r){
    if(quiet&&SITE==='diretoria'&&(dirty||ui.livePanel||ui.busy||ui.voting||ui.postDraft||ui.editGame||ui.videoDraft||ui.videoSaving||ui.accessForm||ui.tab==='configuracoes'))return;
    if(r.error){if(SITE==='publico'){if(!quiet)return loadSnapshot();return;}ui.loading=false;if(!quiet){ui.fatal=explainErr(r.error);}render();return;}
    var row=r.data||{};
    if(quiet&&(row.versao<rowVersion||(row.versao===rowVersion&&!ui.offline)))return;
    if(SITE==='publico'&&(!row.dados||(quiet&&publicVideoOpen()))){if(!quiet)return loadSnapshot();return;}
    rowVersion=row.versao||0;
    if(!row.dados&&SITE==='diretoria')return importInitial();
    S=normalize(row.dados);S.savedAt=rowVersion;dirty=false;ui.loading=false;ui.fatal=null;ui.offline=false;
    if(SITE==='diretoria'){mode='shared';ui.role='editor';applyDraft();if(!quiet)applySeeds(true);}
    else{if(!ui.tabTouched)ui.tab='avisos';if(!quiet)applySeeds(false);}
    render();
  },function(err){if(SITE==='publico'){if(!quiet)return loadSnapshot();return;}ui.loading=false;ui.fatal=explainErr({message:String(err&&err.message||err)});render();});
}
function importInitial(){
  return fetch('/dados-iniciais.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}).then(function(d){
    S=normalize(d);S.savedAt=rowVersion;mode='shared';ui.role='editor';ui.loading=false;dirty=true;render();
    toast('Primeiro acesso: trouxe os dados do app antigo. Salvando…');save();
  });
}
function doLogin(){
  var em=(document.getElementById('lgEmail')||{}).value||'',pw=(document.getElementById('lgSenha')||{}).value||'';
  em=em.trim();ui.lgEmail=em;if(!em||!pw){ui.loginErr='Preencha o e-mail e a senha.';render();return;}
  ui.loginBusy=true;ui.loginErr='';render();
  SB.auth.signInWithPassword({email:em,password:pw}).then(function(r){
    ui.loginBusy=false;
    if(r.error){ui.loginErr=/invalid/i.test(r.error.message||'')?'E-mail ou senha incorretos.':'Não consegui entrar agora. Tente de novo em instantes.';render();return;}
    return openDirectorSession(r.data&&r.data.session);
  },function(){ui.loginBusy=false;ui.loginErr='Sem conexão. Verifique a internet.';render();});
}
function doLogout(){if(dirty){ui.confirmLogout=!ui.confirmLogout;if(ui.confirmLogout){render();return;}}SB.auth.signOut().then(function(){location.reload();},function(){location.reload();});}
function writeState(state,version){
  return SB.from('fda_estado').update({dados:state,versao:version+1,atualizado_em:new Date().toISOString()}).eq('id',1).eq('versao',version).select('versao');
}
function save(){
  if(!dirty||ui.busy||ui.liveBusy)return Promise.resolve();
  if(mode!=='shared'||!SB){toast('Só a diretoria pode salvar.');return Promise.resolve();}
  var next=JSON.parse(JSON.stringify(S));delete next.savedAt;
  var savingRevision=editRevision;
  ui.busy=true;render();
  return writeState(next,rowVersion).then(function(r){
    ui.busy=false;
    if(r.error){toast(/permission|policy|42501|JWT/i.test((r.error.message||'')+(r.error.code||''))?'Seu usuário não tem permissão para salvar. Fale com o organizador.':'Não deu para salvar agora. Suas alterações continuam aqui. Tente de novo.');render();return;}
    if(!r.data||!r.data.length){lsSet(DRAFT_KEY,{base:rowVersion,state:S});toast('Outra pessoa da diretoria salvou antes. Vou recarregar e oferecer recuperar suas mudanças.');setTimeout(function(){location.reload();},2200);return;}
    rowVersion=r.data[0].versao;
    S.savedAt=rowVersion;
    dirty=editRevision!==savingRevision;
    if(dirty){
      lsSet(DRAFT_KEY,{base:rowVersion,state:S});
      toast('Versão salva. Há alterações mais recentes para salvar.');
    }else{
      lsDel(DRAFT_KEY);
      toast('Salvo! Todo mundo já vê a versão nova.');
    }
  },function(){ui.busy=false;toast('Sem conexão. Suas alterações continuam aqui. Tente salvar de novo.');render();});
}

/* ---------- métricas ---------- */
var PORD={G:0,Z:1,L:2,V:3,MA:4,A:5,'':6};
function currentTeams(){
  if(!S.current)return null;
  return S.current.teams.map(function(t){return t.map(byId).filter(Boolean).sort(function(a,b){return (PORD[a.pos]-PORD[b.pos])||(b.stars-a.stars)||a.name.localeCompare(b.name,'pt-BR');});});
}
function isRes(p){return !!(S.current&&S.current.roles&&S.current.roles[p.id]==='R');}
function metrics(teams){
  var full=teams;teams=teams.map(function(t){var x=t.filter(function(p){return !isRes(p);});return x.length?x:t;});
  var maxSize=Math.max.apply(null,teams.map(function(t){return t.length;}));
  var ts=teams.map(function(t){var s=t.reduce(function(a,p){return a+p.stars;},0);var avg=t.length?s/t.length:0;return {sum:s,avg:avg,adj:avg*maxSize,n:t.length,gk:t.filter(function(p){return p.pos==='G';}).length};});
  var adj=ts.map(function(x){return x.adj;});
  var diff=Math.max.apply(null,adj)-Math.min.apply(null,adj);
  var pm=S.current&&S.current.month?shiftMonth(S.current.month,-1):null,prev=pm&&monthTeams(pm)?{teams:S.meses[pm].teams}:null;
  var rep=0,total=0;
  if(prev){
    var same={};prev.teams.forEach(function(t,ti){t.forEach(function(id){same[id]=ti;});});
    full.forEach(function(t){for(var a=0;a<t.length;a++)for(var b=a+1;b<t.length;b++){if(same[t[a].id]!==undefined&&same[t[b].id]!==undefined){total++;if(same[t[a].id]===same[t[b].id])rep++;}}});
  }
  return {ts:ts,diff:diff,prev:prev,rep:rep,total:total};
}
function balanceLabel(d){if(d<=0.5)return 'Muito equilibrado';if(d<=1)return 'Equilibrado';if(d<=2)return 'Leve vantagem';return 'Desequilibrado — confira as notas';}

/* ---------- ações ---------- */
function validateDraw(n,T){
  if(n<4)return 'Marque pelo menos 4 jogadores presentes.';
  if(n<2*T)return 'Com '+n+' presentes dá para no máximo '+Math.floor(n/2)+' times.';
  return '';
}
function snakeDraft(players,count){
  var teams=Array.from({length:count},function(){return [];});
  players.slice().sort(function(a,b){return Number(b.pos==='G')-Number(a.pos==='G')||ratingOrder(a,b);}).forEach(function(player,i){
    var pick=i%count, reverse=Math.floor(i/count)%2===1;
    teams[reverse?count-1-pick:pick].push(player);
  });
  return teams;
}
function ratingOrder(a,b){return b.stars-a.stars||(PORD[a.pos]??6)-(PORD[b.pos]??6)||a.name.localeCompare(b.name,'pt-BR')||a.id.localeCompare(b.id);}
function doDraw(auto){
  if(!canEditUi())return;
  var pres=S.players.filter(function(p){return S.present.indexOf(p.id)>=0;});
  var err=validateDraw(pres.length,S.settings.teams);if(err){toast(err);return;}
  var T=S.settings.teams,roles={},order=S.present.slice();
  if(S.settings.arrival){var slots=T*S.settings.starters,tit={},cnt=0;
    if(S.settings.gk){var gks=order.filter(function(id){var p=byId(id);return p&&p.pos==='G';}).slice(0,T);gks.forEach(function(id){tit[id]=1;cnt++;});}
    order.forEach(function(id){if(cnt>=slots||tit[id])return;var p=byId(id);if(S.settings.gk&&p&&p.pos==='G')return;tit[id]=1;cnt++;});
    order.forEach(function(id){if(!tit[id])roles[id]='R';});}
  var mk=ui.sortMes||curMonthKey();
  var teams=snakeDraft(pres,T);
  S.current={teams:teams.map(function(t){return t.map(function(p){return p.id;});}),date:Date.now(),confirmed:false,histId:null,roles:roles,order:order,month:mk};
  ui.sel=null;change();
  if(!auto)setTimeout(function(){var el=document.getElementById('result');if(el)el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});},30);
}
var drawTimer=null;
function updateDrawPresence(){
  clearTimeout(drawTimer);
  var month=ui.sortMes||curMonthKey();
  if(monthTeams(month)){change();return;}
  if(S.current&&S.current.month===month&&!S.current.confirmed)S.current=null;
  change();
  if(validateDraw(S.present.length,S.settings.teams))return;
  drawTimer=setTimeout(function(){
    if(canEditUi()&&ui.tab==='sorteio'&&(ui.sortMes||curMonthKey())===month&&!monthTeams(month))doDraw(true);
  },300);
}
function confirmDraw(){
  if(!canEditUi()||!S.current)return;
  var mk=S.current.month||ui.sortMes||curMonthKey(),old=S.meses[mk];
  S.meses[mk]={teams:S.current.teams.map(function(t){return t.slice();}),campeao:old?old.campeao:null};
  S.current.confirmed=true;S.current.month=mk;
  change();save();
}
function addPlayer(name,stars,pos){
  name=String(name||'').replace(/\s+/g,' ').trim().slice(0,30);
  if(!name)return 'empty';
  var nn=norm(name);
  if(S.players.some(function(p){return norm(p.name)===nn;}))return 'dup';
  var p={id:uid(),name:name,stars:clampStar(stars==null?3:stars),pos:pos||'',photo:'',num:0};
  S.players.push(p);S.present.push(p.id);return 'ok';
}
function parseBulk(text){
  var added=0,dup=0;
  String(text).split(/\r?\n/).forEach(function(l){
    l=l.replace(/[✅✔☑👍⚽️\u200d]/gu,'').replace(/^\s*\d{1,2}\s*[\.\)\-–:]\s*/,'').trim();
    if(!l)return;
    var m=l.match(/^(.*?)[\s;,\-–]+([0-5](?:[.,]5)?)\s*★?$/);
    var name=m?m[1]:l,st=m?parseFloat(m[2].replace(',','.')):3;
    if(st<0.5)st=0.5;
    var r=addPlayer(name,st,'');if(r==='ok')added++;else if(r==='dup')dup++;
  });
  return {added:added,dup:dup};
}
function copy(text){
  function fallback(){ui.copyText=text;render();var ta=document.getElementById('copyta');if(ta){ta.focus();ta.select();}}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){toast('Copiado! É só colar no grupo.');},fallback);}else fallback();
}
function shareText(){
  var withStars=S.settings.shareStars&&canEditUi();
  var teams=currentTeams();if(!teams)return '';
  var d=new Date(S.current.date).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'});
  var m=metrics(teams),cf=curField(),lines=['⚽ '+S.info.name+' — times de '+d,'📍 '+cf.name+(cf.principal?'':' (mudança de campo!)'),'⏰ Em cada time, os '+S.settings.starters+' primeiros a chegar começam jogando.',''];
  teams.forEach(function(t,i){
    var col=COLORS[i%COLORS.length];
    lines.push(col.e+' *'+col.n+'*'+(withStars?' (média '+fmt(m.ts[i].avg)+'★)':''));
    var tit=t.filter(function(p){return !isRes(p);}),res=t.filter(isRes),ord=S.current.order||[];res.sort(function(a,b){return ord.indexOf(a.id)-ord.indexOf(b.id);});
    if(res.length)lines.push('_Titulares_');
    tit.forEach(function(p){lines.push('• '+p.name+(p.pos==='G'?' (gol)':'')+(withStars?' '+fmt(p.stars)+'★':''));});
    if(res.length){lines.push('_Reservas_');res.forEach(function(p,i){lines.push((i+1)+'º '+p.name+(withStars?' '+fmt(p.stars)+'★':''));});}
    lines.push('');
  });
  return lines.join('\n').trim();
}

/* ---------- render ---------- */
function starsHTML(v,pid){
  var pct=v/5*100;
  var h='<span class="stars'+(pid?' edit':'')+'" role="'+(pid?'group':'img')+'" aria-label="'+fmt(v)+' estrelas"><span class="s-bg" aria-hidden="true">★★★★★</span><span class="s-fg" aria-hidden="true" style="width:'+pct+'%">★★★★★</span>';
  if(pid){h+='<span class="s-hits">';for(var k=1;k<=5;k++)h+='<button type="button" data-act="star" data-id="'+pid+'" data-k="'+k+'" aria-label="'+k+' estrela'+(k>1?'s':'')+'"></button>';h+='</span>';}
  return h+'</span>';
}
function loginView(){
  return '<div class="card center-card"><h2>Área da diretoria</h2><p class="hint">Entre com o e-mail e a senha que o organizador cadastrou para você.</p>'+
  '<label class="field"><span>E-mail</span><input id="lgEmail" type="email" autocomplete="username" inputmode="email" value="'+esc(ui.lgEmail||'')+'"></label>'+
  '<label class="field"><span>Senha</span><input id="lgSenha" type="password" autocomplete="current-password"></label>'+
  (ui.loginErr?'<p class="warn">'+esc(ui.loginErr)+'</p>':'')+
  '<button type="button" class="btn primary wide" data-act="login"'+(ui.loginBusy?' disabled':'')+'>'+(ui.loginBusy?'Entrando…':'Entrar')+'</button>'+
  '<p class="hint" style="margin-top:14px"><a href="/">Voltar ao site do clube</a></p></div>';
}
var ICONS={
 instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor"/></svg>',
 tiktok:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.5 3c.4 2.3 1.9 3.8 4 4v3.2c-1.5 0-2.9-.4-4-1.2v6.4c0 3.3-2.6 5.6-5.6 5.6s-5.6-2.4-5.6-5.4c0-3.2 2.8-5.7 6.1-5.4v3.3c-1.4-.3-2.8.8-2.8 2.2 0 1.2 1 2.2 2.3 2.2s2.3-1 2.3-2.4V3h3.3z"/></svg>',
 facebook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v7h4v-7H16l.5-4h-3V8.8c0-.5.3-.8.5-.8z"/></svg>'};
var REDES=[['instagram','Instagram'],['tiktok','TikTok'],['facebook','Facebook']];
function socialHTML(cls){
  var R=S.info.redes||{},items=REDES.filter(function(r){return R[r[0]];});
  if(!items.length)return '';
  return '<div class="social '+cls+'">'+items.map(function(r){return '<a class="soc soc-'+r[0]+'" href="'+esc(R[r[0]])+'" target="_blank" rel="noopener noreferrer" aria-label="'+r[1]+' do '+esc(S.info.name)+'">'+ICONS[r[0]]+(cls==='foot'?'<span>'+r[1]+'</span>':'')+'</a>';}).join('')+'</div>';
}
var CREDITO={nome:'Michel Alessandro',frase:'Criação de sites personalizados para times, negócios e projetos.',insta:'@michel.comercial',instaUrl:'https://www.instagram.com/michel.comercial/',email:'M14comercial@gmail.com'};
function creditHTML(){var C=CREDITO;return '<div class="credit"><p class="credit-n">Desenvolvido por <strong>'+esc(C.nome)+'</strong></p><p class="credit-f">'+esc(C.frase)+'</p>'+
  '<p class="credit-l"><a href="'+esc(C.instaUrl)+'" target="_blank" rel="noopener noreferrer" aria-label="Instagram de '+esc(C.nome)+', desenvolvedor do site (abre em nova aba)">'+esc(C.insta)+'</a>'+
  '<a href="mailto:'+esc(C.email)+'" aria-label="Enviar e-mail para '+esc(C.nome)+'">'+esc(C.email)+'</a></p></div>';}
function footerHTML(){return '<footer class="foot-wrap"><p class="foot-t">Siga o '+esc(S.info.name)+'</p>'+socialHTML('foot')+'<p class="credit-l"><a href="/diretoria/">Área da diretoria</a></p><p class="foot-s">'+esc((curField()||{}).name||'')+' · '+esc((curField()||{}).bairro||'')+'</p>'+creditHTML()+'</footer>';}
function header(bare){
  var dn=new Date(),dl=dn.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'}),dsh=dn.toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});
  var hd='<header class="top fda-top">'+
    '<div class="top-in"><img class="logo" src="'+esc(S.info.logo||'/escudo.png')+'" alt=""><div class="brand"><h1>'+esc(S.info.name)+'</h1><p class="sub"><span class="d-l">'+esc(dl)+'</span><span class="d-s">'+esc(dsh)+'</span></p></div></div>'+
    (bare?'':'<button type="button" class="header-action" data-act="tab" data-tab="jogadores" aria-label="Encontrar perfil de atleta"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/></svg></button>')+'</header>';
  if(bare)return hd;
  return hd+'<nav class="tabs" id="fda-nav" tabindex="-1" aria-label="Seções do site">'+
  tab('avisos','','Clube')+tab('tv','','FDA TV')+tab('jogadores','','Elenco & Scouts')+tab('times','','Times')+tab('lances','','Resenha & Lances')+
  (canEditUi()?tab('elenco','','Editar elenco')+tab('jogos','','Súmulas')+tab('configuracoes','','Configurações')+tab('sorteio','','Sorteio')+tab('votacao','','Votação')+(ui.manageAccess?tab('acessos','','Acessos'):''):'')+
  (SITE==='diretoria'?'<a class="director-tab" href="/">Site do clube</a></nav>':'<a class="director-tab" href="/diretoria/"><svg class="ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">'+NAV_ICONS.diretoria+'</svg><span class="tl">Diretoria</span></a></nav>');
}
var NAV_ICONS={
  elenco:'<circle cx="12" cy="8" r="3"/><path d="M6 20v-3a6 6 0 0 1 12 0v3"/>',
  configuracoes:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
  tv:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="m9 3 3 3 3-3m-1 7-4 2.5 4 2.5z"/>',
  lances:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m10 8 6 4-6 4z"/>',
  diretoria:'<path d="M5 9V7a7 7 0 0 1 14 0v2"/><rect x="4" y="9" width="16" height="12" rx="2"/><path d="M12 13v4"/>',
  avisos:'<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  jornal:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/>',
  ranking:'<path d="M8 21h8m-4-5v5M8 3h8v7a4 4 0 0 1-8 0V3Zm0 3H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4"/>',
  sorteio:'<path d="m8 4-5 3 2 5 3-1v9h8v-9l3 1 2-5-5-3c0 4-8 4-8 0Z"/>',
  times:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14M3 9h3v6H3m18-6h-3v6h3"/><circle cx="12" cy="12" r="2.5"/>',
  jogos:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 10h16m-12 5h8"/>',
  jogadores:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m3-15a3 3 0 0 1 0 6m0 3a5 5 0 0 1 3 4v2"/>',
  votacao:'<rect x="4" y="9" width="16" height="12" rx="2"/><path d="m8 7 4-4 4 4m-8 7 3 3 5-5"/>'
};
function tab(id,icon,label){
  return '<button type="button"'+(ui.tab===id?' aria-current="page"':'')+' data-act="tab" data-tab="'+id+'">'+
    '<svg class="ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(NAV_ICONS[id]||NAV_ICONS.diretoria)+'</svg><span class="tl">'+label+'</span></button>';
}

function viewJogadores(){
  if(!canEditUi()){
    if(!S.players.length)return '<p class="empty">Elenco ainda não cadastrado.</p>';
    var L2=S.players.slice().sort(function(a,b){return (PORD[a.pos]-PORD[b.pos])||a.name.localeCompare(b.name,'pt-BR');});
    var h2='<section class="card"><div class="row-between"><h2>Elenco</h2><span class="meta">'+S.players.length+' atletas</span></div><ul class="roster pub">';
    L2.forEach(function(p){h2+='<li>'+avatarBtn(p,48)+'<span class="nm"><button type="button" class="nmb" data-act="perfil" data-id="'+p.id+'">'+esc(p.name)+(p.num?' <small class="nnum">#'+p.num+'</small>':'')+'</button></span>'+(p.pos?'<span class="pos">'+POS.filter(function(o){return o[0]===p.pos;})[0][1]+'</span>':'')+'</li>';});
    return h2+'</ul></section>';
  }
  var pv='<button type="button" class="btn wide" data-act="preview" style="margin-bottom:12px">Ver como os atletas veem</button>';
  var h='<header class="portal-heading"><h2>Editar elenco</h2></header>'+pv+'<section class="card"><h2>Adicionar jogador</h2><div class="addrow"><input id="newname" type="text" maxlength="30" aria-label="Nome ou apelido" placeholder="Nome ou apelido" autocomplete="off"><select id="newpos" aria-label="Posição">'+POS.map(function(p){return '<option value="'+p[0]+'">'+p[1]+'</option>';}).join('')+'</select><button type="button" class="btn primary" data-act="add">Adicionar</button></div>'+
  '<details class="bulk"'+(S.players.length?'':' open')+'><summary>Colar a lista do grupo</summary><p class="hint">Um nome por linha. Pode colocar a nota no fim: <em>Pedro 4</em> ou <em>Lucas;3,5</em>. Sem nota, entra com 3 estrelas. Numeração da lista do WhatsApp é ignorada.</p><textarea id="bulk" rows="6" placeholder="1. João 4&#10;2. Marcão 3,5&#10;3. Beto"></textarea><button type="button" class="btn" data-act="bulk">Adicionar todos</button>'+(ui.bulkMsg?'<p class="ok">'+esc(ui.bulkMsg)+'</p>':'')+'</details></section>';
  if(!S.players.length){h+='<p class="empty">Nenhum jogador ainda. Adicione a turma acima — dá para colar a lista inteira de uma vez.</p>';return h;}
  var list=S.players.slice().sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR');});
  var avg=S.players.reduce(function(a,p){return a+p.stars;},0)/S.players.length;
  h+='<section class="card"><div class="row-between"><h2>Elenco</h2><span class="meta">'+S.players.length+' jogadores, média '+fmt(avg)+'★</span></div><p class="hint">Toque nas estrelas para dar a nota (tocar de novo na mesma tira meia). Toque no círculo para colocar ou trocar a foto.</p><ul class="roster">';
  list.forEach(function(p){
    var del=ui.confirmDel===p.id;
    h+='<li>'+avatarBtn(p,44)+'<input class="pname" type="text" maxlength="30" value="'+esc(p.name)+'" data-act="rename" data-id="'+p.id+'" aria-label="Nome"><input class="pnum" type="number" min="1" max="99" inputmode="numeric" value="'+(p.num||'')+'" placeholder="Nº" data-act="pnum" data-id="'+p.id+'" aria-label="Número da camisa de '+esc(p.name)+'"><div class="pctl">'+starsHTML(p.stars,p.id)+'<span class="snum">'+fmt(p.stars)+'</span><select data-act="pos" data-id="'+p.id+'" aria-label="Posição de '+esc(p.name)+'">'+POS.map(function(o){return '<option value="'+o[0]+'"'+(o[0]===p.pos?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select><button type="button" class="del'+(del?' sure':'')+'" data-act="del" data-id="'+p.id+'" aria-label="Remover '+esc(p.name)+'">'+(del?'Remover?':'✕')+'</button></div></li>';
  });
  h+='</ul></section>';
  h+='<section class="card"><h2>Backup</h2><p class="hint">Guarde uma cópia da lista e do histórico (por exemplo, no seu WhatsApp) para restaurar se precisar.</p><div class="btnrow"><button type="button" class="btn" data-act="backup">Copiar backup</button><button type="button" class="btn" data-act="restoreToggle">Restaurar backup</button></div>'+
  (ui.restoreOpen?'<textarea id="restore" rows="4" placeholder="Cole aqui o backup"></textarea><button type="button" class="btn" data-act="restore">Substituir pela cópia colada</button>':'')+'</section>';
  return h;
}

function viewSorteio(){
  if(!canEditUi()){
    return teamsBlock(false);
  }
  var mkS=ui.sortMes||curMonthKey();ui.sortMes=mkS;
  if(monthTeams(mkS)&&(!S.current||S.current.month!==mkS))S.current={teams:S.meses[mkS].teams.map(function(t){return t.slice();}),date:Date.now(),confirmed:true,month:mkS,roles:{},order:[]};
  if(!monthTeams(mkS)&&S.current&&S.current.month!==mkS)S.current=null;
  var cm=curMonthKey(),opts=[shiftMonth(cm,-2),shiftMonth(cm,-1),cm,shiftMonth(cm,1)];if(opts.indexOf(mkS)<0)opts.push(mkS);
  var head='<section class="card mes-card"><h2>🗓️ Times do mês</h2><p class="hint">O sorteio vale para o <strong>mês inteiro</strong>: os mesmos times jogam todos os domingos. No mês seguinte, um sorteio novo, bem diferente do anterior.</p><label class="field"><span>Mês</span><select data-act="sortMes">'+opts.map(function(k){return '<option value="'+k+'"'+(k===mkS?' selected':'')+'>'+monthLabel(k,true)+(monthTeams(k)?' ✔':'')+(k===cm?' (atual)':'')+'</option>';}).join('')+'</select></label>'+
    (monthTeams(mkS)?'<p class="ok">✔ Times de '+monthName(mkS)+' já confirmados.'+(S.current&&!S.current.confirmed?' Há mudanças ainda não confirmadas.':'')+'</p>':'<p class="meta">Os times de '+monthName(mkS)+' ainda não foram sorteados.</p>')+'</section>';
  if(!S.players.length)return head+'<p class="empty">Cadastre os jogadores primeiro. <button type="button" class="link" data-act="tab" data-tab="jogadores">Ir para Jogadores</button></p>';
  var n=S.present.length,T=S.settings.teams;
  var list=S.players.slice().sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR');});
  var h=head+'<section class="card"><div class="row-between"><h2>'+(S.settings.arrival?'Ordem de chegada':'Quem joga no mês')+'</h2><span class="meta">'+n+' de '+S.players.length+'</span></div>'+(S.settings.arrival?'<p class="hint">Toque nos nomes <strong>na ordem em que forem chegando</strong>. Os primeiros '+(S.settings.teams*S.settings.starters)+' são titulares ('+S.settings.starters+' por time); quem chegar depois fica de reserva. Goleiro presente é sempre titular (um por time).</p>':'')+'<div class="btnrow tight"><button type="button" class="btn sm" data-act="all">Marcar todos</button><button type="button" class="btn sm" data-act="none">Desmarcar todos</button></div><div class="chips">';
  var slotsN=S.settings.teams*S.settings.starters;
  list.forEach(function(p){var ix=S.present.indexOf(p.id),on=ix>=0,isR=S.settings.arrival&&ix>=slotsN;h+='<button type="button" class="chip'+(isR?' reserva':'')+'" aria-pressed="'+on+'" data-act="presence" data-id="'+p.id+'">'+(on&&S.settings.arrival?'<span class="cn">'+(ix+1)+'º</span>':'')+esc(p.name)+(p.pos==='G'?' <small>gol</small>':'')+'</button>';});
  if(S.settings.arrival&&n){var nt=Math.min(n,slotsN);h+='</div><p class="meta" style="margin-top:10px">'+nt+' titular'+(nt>1?'es':'')+(n>slotsN?' · '+(n-slotsN)+' reserva'+(n-slotsN>1?'s':''):' · faltam '+(slotsN-n)+' para fechar os titulares')+'</p><div>';}
  h+='</div></section>';
  var base=n>=T?Math.floor(n/T):0,ext=n%T;
  var err=validateDraw(n,T);
  h+='<section class="card"><h2>Formato</h2><div class="setting"><span>Times</span><div class="stepper"><button type="button" data-act="teams" data-d="-1" aria-label="Menos times"'+(T<=2?' disabled':'')+'>−</button><output>'+T+'</output><button type="button" data-act="teams" data-d="1" aria-label="Mais times"'+(T>=6?' disabled':'')+'>+</button></div></div>';
  if(!err&&!S.settings.arrival)h+='<p class="hint">'+(ext?ext+' equipe(s) com '+(base+1)+' atletas e '+(T-ext)+' com '+base+'.':T+' times de '+base+' jogadores.')+' O Snake Draft alterna a ordem dos times por faixa de estrelas.</p>';
  h+='<div class="setting"><span>Jogadores em campo por time</span><div class="stepper"><button type="button" data-act="starters" data-d="-1" aria-label="Menos titulares"'+(S.settings.starters<=3?' disabled':'')+'>−</button><output>'+S.settings.starters+'</output><button type="button" data-act="starters" data-d="1" aria-label="Mais titulares"'+(S.settings.starters>=11?' disabled':'')+'>+</button></div></div>';
  h+='<p class="hint">No domingo, os '+S.settings.starters+' primeiros de cada time a chegar começam jogando. Por isso o sorteio equilibra o elenco inteiro de cada time.</p>';
  h+=(err?'<p class="warn">'+esc(err)+'</p>':'')+'<button type="button" class="btn draw" data-act="draw"'+(err?' disabled':'')+'>'+(S.current?'Sortear de novo':'Sortear times de '+monthName(ui.sortMes||curMonthKey()))+'</button></section>';
  h+=viewResult();
  if(monthTeams(mkS))h+='<section class="card"><h2>Campinho confirmado de '+esc(monthName(mkS))+'</h2>'+campoHTML(monthTeamObjs(monthTeams(mkS)),{},mkS)+'</section>';
  return h;
}

function viewResult(){
  var teams=currentTeams();if(!teams||!teams.length)return '';
  var m=metrics(teams);
  var when=new Date(S.current.date).toLocaleString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  var ed=canEditUi(),stars=ed&&ui.showStars;
  var h='<section id="result" class="result"><div class="row-between"><h2>Times '+(S.current.confirmed?'confirmados':'sorteados')+'</h2>'+(ed?'<label class="mini"><input type="checkbox" data-act="showStars"'+(ui.showStars?' checked':'')+'> notas</label>':'')+'</div>';
  if(ed)h+='<div class="balance"><div class="bal-big">'+fmt(m.diff)+'<span>★</span></div><div><strong>'+balanceLabel(m.diff)+'</strong><p>Diferença de força entre os times'+(m.prev&&m.total?'. '+Math.round((m.total-m.rep)/m.total*100)+'% das duplas são novas em relação ao time de '+monthName(shiftMonth(S.current.month,-1)):'')+'.</p></div></div>';
  h+='<p class="note-arr">⏰ Em cada time, os '+S.settings.starters+' primeiros a chegar começam jogando. Quem chegar depois entra na sequência.</p>';
  h+=(ed?'<p class="hint">Toque em um jogador e depois em outro de outro time para trocar os dois.</p>':'')+'<div class="teams">';
  teams.forEach(function(t,i){
    var col=COLORS[i%COLORS.length],ts=m.ts[i];
    var tit=t.filter(function(p){return !isRes(p);}),res=t.filter(isRes);
    var ord=(S.current.order||[]);res.sort(function(a,b){return ord.indexOf(a.id)-ord.indexOf(b.id);});
    h+='<article class="team" style="--bib:'+col.c+';--bibt:'+col.t+'"><header>'+teamArt('shirt',i)+'<span class="bibname">'+col.n+'</span><span class="bibstat">'+tit.length+(res.length?' + '+res.length+' res.':' jog')+(stars?' · média '+fmt(ts.avg)+'★':'')+'</span></header>';
    var row=function(p,label){var sel=ui.sel===p.id;return '<li><button type="button" class="pl'+(sel?' sel':'')+'" data-act="'+(ed?'pick':'noop')+'" data-id="'+p.id+'" aria-pressed="'+sel+'">'+(label?'<span class="rn">'+label+'</span>':'')+kitAvatar(p,26,i)+'<span class="nm">'+esc(p.name)+'</span>'+(p.pos?'<span class="pos">'+POSSHORT[p.pos]+'</span>':'')+(stars?'<span class="sv">'+fmt(p.stars)+'★</span>':'')+'</button></li>';};
    if(res.length)h+='<p class="grp">Titulares</p>';
    h+='<ol>'+tit.map(function(p){return row(p,'');}).join('')+'</ol>';
    if(res.length)h+='<p class="grp res">Reservas <small>entram nessa ordem</small></p><ol>'+res.map(function(p,i){return row(p,(i+1)+'º');}).join('')+'</ol>';
    h+='</article>';
    [].forEach(function(p){
      var sel=ui.sel===p.id;
      h+='<li><button type="button" class="pl'+(sel?' sel':'')+'" data-act="'+(ed?'pick':'noop')+'" data-id="'+p.id+'" aria-pressed="'+sel+'"><span class="nm">'+esc(p.name)+'</span>'+(p.pos?'<span class="pos">'+POSSHORT[p.pos]+'</span>':'')+(stars?'<span class="sv">'+fmt(p.stars)+'★</span>':'')+'</button></li>';
    });
    h+='</ol></article>';
  });
  h+='</div><div class="btnrow"><button type="button" class="btn" data-act="share">Copiar para o WhatsApp</button>'+(S.current.confirmed||!ed?'':'<button type="button" class="btn primary" data-act="confirm"'+(ui.busy?' disabled':'')+'>Confirmar e salvar</button>')+'</div>';
  if(ed)h+='<label class="mini"><input type="checkbox" data-act="shareStars"'+(S.settings.shareStars?' checked':'')+'> incluir as notas no texto do grupo</label>';
  if(ed&&!S.current.confirmed)h+='<p class="hint">Confirmar guarda o sorteio no histórico e alimenta o rodízio das próximas semanas.</p>';
  return h+'</section>';
}

function avatar(p,size){
  var nm=p?p.name:'?';
  if(p&&p.photo)return '<img class="av" src="'+esc(p.photo)+'" alt="" width="'+size+'" height="'+size+'" style="width:'+size+'px;height:'+size+'px" decoding="async" data-avatar-name="'+esc(nm)+'">';
  var ini=nm.split(' ').filter(Boolean).slice(0,2).map(function(w){return w[0];}).join('').toUpperCase();
  var hsh=0;for(var i=0;i<nm.length;i++)hsh=(hsh*31+nm.charCodeAt(i))%360;
  return '<span class="av ini" style="width:'+size+'px;height:'+size+'px;font-size:'+Math.round(size*0.4)+'px;--h:'+hsh+'" aria-hidden="true">'+esc(ini||'?')+'</span>';
}
function filePick(label,target,cls){
  return '<span class="filepick '+cls+'">'+label+'<input type="file" accept="image/*" data-pickfor="'+esc(target)+'" aria-label="'+esc(label.replace(/<[^>]+>/g,''))+'"></span>';
}
function pasteZone(target){return '<div class="pastezone" contenteditable="true" data-pastefor="'+esc(target)+'" role="textbox" aria-label="Colar foto aqui">Não abriu a galeria? Copie a foto no celular, toque aqui e escolha <b>Colar</b>.</div>';}
function avatarBtn(p,size,id){
  var pid=id||(p&&p.id);var real=pid&&byId(pid);
  if(!real)return avatar(p,size);
  var ed=canEditUi();
  if(!ed&&!real.photo)return avatar(real,size);
  return '<button type="button" class="avbtn" data-act="photoSheet" data-id="'+pid+'" aria-label="'+(ed?'Foto de '+esc(real.name)+' (trocar)':'Ver foto de '+esc(real.name))+'">'+avatar(real,size)+(ed?'<span class="avcam" aria-hidden="true">📷</span>':'')+'</button>';
}
function gameName(g,id){var p=byId(rid(g,id));return p?p.name:(g.names[id]||(/^n:/.test(id)?id.slice(2):'Ex-jogador'));}
function personOf(g,id){var p=byId(rid(g,id));return p||{name:g.names[id]||(/^n:/.test(id)?id.slice(2):'Ex-jogador'),photo:''};}
var directorTabs=['sorteio','votacao','elenco','configuracoes','acessos'];
function canEditUi(){return mode==='shared'&&!ui.preview;}
function winner(g){if(g.live||g.valida===false)return null;if(g.placar)return g.placar.v>g.placar.g?0:g.placar.g>g.placar.v?1:-1;return (g.vencedor===0||g.vencedor===1||g.vencedor===-1)?g.vencedor:null;}
function placarTxt(g){if(g.valida===false)return '⚪ Passeio: jogo não valeu';if(!g.placar){var v0=winner(g);return v0===null?'':(v0===-1?'Empate (sem placar registrado)':'🏆 '+TNc(g,v0).n+' venceu (sem placar registrado)');}var w=winner(g);if(g.adv)return '🟢 Futebol dos Amigos '+g.placar.v+' x '+g.placar.g+' '+g.adv+(w===-1?' · empate':w===0?' · 🏆 vitória':' · derrota');return '🔴 Vermelho '+g.placar.v+' x '+g.placar.g+' Verde 🟢'+(w===-1?' · empate':' · 🏆 '+COLORS[w].n+' campeão');}
var CRITERIOS=[
 ['🧤','Goleiro','Defesas difíceis, saídas seguras do gol, organizou a defesa, pegou pênalti.','Frangos, saídas erradas que viraram gol, reclamou mais do que defendeu.'],
 ['🛡️','Zagueiros e laterais','Desarmes limpos, antecipações, cobertura dos companheiros, saída de bola sem errar.','Erro que virou gol, deixou o atacante passar fácil, faltas desnecessárias, cartão bobo.'],
 ['🧠','Volantes e meias','Passes certos, assistências, marcação no meio, fez o time jogar.','Perdeu muitas bolas, sumiu do jogo, prendeu demais a bola, não voltou para marcar.'],
 ['⚽','Atacantes','Gols, assistências, lances que decidiram o jogo, deu trabalho para a defesa.','Perdeu gol feito, muito individualista, não passou a bola, fominha.'],
 ['🤝','Para todos','Raça, espírito de equipe, fair play, chegou no horário.','Briga, catimba, reclamação o jogo todo, falta de respeito.']];
function criteriosHTML(open){
  return '<details class="card crit"'+(open?' open':'')+'><summary>📋 Critérios para votar</summary><p class="hint">É pelada, então vale o bom senso. Use como guia:</p>'+
   CRITERIOS.map(function(c){return '<div class="crit-i"><h3>'+c[0]+' '+c[1]+'</h3><p><strong>🏆 Bola cheia:</strong> '+c[2]+'</p><p><strong>🎈 Bola murcha:</strong> '+c[3]+'</p></div>';}).join('')+
   '<p class="hint">Bola murcha é brincadeira de pelada: é sobre o jogo do dia, nunca sobre a pessoa.</p></details>';
}
function juriGame(){if(ui.juriGame)return findGame(ui.juriGame);for(var i=0;i<S.history.length;i++){var g=S.history[i];if(g.teams.some(function(t){return t.length;}))return g;}return S.history[0]||null;}
function gamePlayers(g){var ids=[];g.teams.forEach(function(t){t.forEach(function(id){ids.push(id);});});return ids.map(function(id){return {id:id,name:gameName(g,id)};}).sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR');});}
function apurar(g,tp){
  var c={},n=0;g.juri.votos.forEach(function(v){if(v[tp]){c[v[tp]]=(c[v[tp]]||0)+1;n++;}});
  var ks=Object.keys(c).sort(function(a,b){return (c[b]-c[a])||gameName(g,a).localeCompare(gameName(g,b),'pt-BR');});
  if(!ks.length)return {n:0,c:c,ks:ks,win:null,tie:[]};
  var topv=c[ks[0]],tie=ks.filter(function(k){return c[k]===topv;});
  return {n:n,c:c,ks:ks,win:tie.length===1?ks[0]:null,tie:tie.length>1?tie:[]};
}
function apurHTML(g,tp,label,withTie){
  var a=apurar(g,tp);if(!a.n)return '';
  var nv=g.juri.votos.length;
  var h='<div class="apur"><p class="apur-t">'+label+'</p><ol class="apur-l">';
  a.ks.forEach(function(k,i){var v=a.c[k];var isW=g[tp]===k;
    var byTie=isW&&g.juri.desempate&&g.juri.desempate[tp]===k;
    h+='<li'+(isW?' class="win"':'')+'><span class="nm">'+esc(gameName(g,k))+(isW?' <span class="wtag">'+(tp==='cheia'?'🏆':'🎈')+'</span>':'')+(byTie?' <small class="dtag">desempate</small>':'')+'</span><span class="rv">'+v+'<small> voto'+(v>1?'s':'')+(v===nv&&nv>1?' · unânime':'')+'</small></span></li>';});
  h+='</ol>';
  if(withTie&&a.tie.length){
    var chosen=g[tp]&&a.tie.indexOf(g[tp])>=0?g[tp]:'',pick=(ui.tb&&ui.tb[tp])||chosen,other=tp==='cheia'?g.murcha:g.cheia,otherPick=ui.tb&&ui.tb[tp==='cheia'?'murcha':'cheia'];
    h+='<div class="tie'+(chosen&&!(ui.tb&&ui.tb[tp])?' done':'')+'"><p class="tie-t">⚖️ Deu empate no '+(tp==='cheia'?'bola cheia':'bola murcha')+'! '+(chosen&&!(ui.tb&&ui.tb[tp])?'Desempatado: <strong>'+esc(gameName(g,chosen))+'</strong>. Toque em outro nome para trocar.':'Toque em quem vai ser eleito:')+'</p><div class="tie-b">'+
      a.tie.map(function(k){var blocked=(other===k||otherPick===k)&&!(tp==='cheia'?false:false);return '<button type="button" class="tiebtn'+(pick===k?' on':'')+'" data-act="tiePick" data-k="'+tp+'" data-id="'+k+'" aria-pressed="'+(pick===k)+'"'+(blocked?' disabled title="Já é o '+(tp==='cheia'?'bola murcha':'bola cheia')+'"':'')+'>'+avatar(personOf(g,k),44)+'<span>'+esc(gameName(g,k))+'</span><small>'+a.c[k]+' voto'+(a.c[k]>1?'s':'')+'</small></button>';}).join('')+'</div></div>';
  }
  return h+'</div>';
}
/* ===== VOTAÇÃO: jogos que ainda não foram registrados (domingo passado, hoje/próximo e o seguinte) ===== */
function upcomingVoteDates(){
  var now=new Date(),t0=new Date(now.getFullYear(),now.getMonth(),now.getDate()),out=[],reg=function(iso){return S.history.some(function(g){return isoDate(new Date(g.date))===iso;});};
  var thisOrNext=new Date(t0);thisOrNext.setDate(thisOrNext.getDate()+((7-t0.getDay())%7));
  var ds=[];if(t0.getDay()!==0){var ls=new Date(t0);ls.setDate(ls.getDate()-t0.getDay());ds.push(ls);}   /* domingo passado, se esqueceram de registrar */
  ds.push(thisOrNext);var nx=new Date(thisOrNext);nx.setDate(nx.getDate()+7);ds.push(nx);
  ds.forEach(function(d){var iso=isoDate(d);if(!reg(iso))out.push({iso:iso,d:d,mk:iso.slice(0,7),t:monthTeams(iso.slice(0,7))});});
  return out;
}
function upcomingVoteHTML(){
  var U=upcomingVoteDates();if(!U.length)return '';
  var h='<section class="card up"><h2>📅 Próximos jogos</h2><p class="hint">O jogo do dia já vem com os times do mês. Toque em <strong>Iniciar votação</strong>, tire quem não foi (✕) e vote. Nada vai para o site antes do primeiro voto ser salvo.</p>';
  U.forEach(function(u){
    var lbl=u.d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'}),hoje=isoDate(new Date())===u.iso;
    h+='<div class="upg"><div class="upg-i"><strong>'+esc(lbl.charAt(0).toUpperCase()+lbl.slice(1))+(hoje?' · hoje':'')+'</strong><small>'+(u.t?'Times de '+monthName(u.mk)+': 🔴 '+u.t[0].length+' x '+u.t[1].length+' 🟢':'Os times de '+monthName(u.mk)+' ainda não foram cadastrados (aba Sorteio).')+'</small></div>'+
      '<button type="button" class="btn primary" data-act="vStart" data-date="'+u.iso+'"'+(u.t?'':' disabled')+'>Iniciar votação</button></div>';
  });
  return h+'</section>';
}
function resetVote(){ui.tb={};ui.vCheia='';ui.vMurcha='';ui.confirmFin=false;}
async function castVote(rodada){
  if(!canEditUi()||ui.voting||ui.busy)return;
  var craque=ui.vCheia, bola_murcha=ui.vMurcha;
  if(!craque||!bola_murcha||craque===bola_murcha){toast('Escolha dois atletas diferentes.');return;}
  ui.voting=true;
  render();
  try{
    if(dirty)await save();
    if(dirty)return;
    var result=await SB.rpc('fda_registrar_voto',{rodada:rodada,craque:craque,bola_murcha:bola_murcha,versao_esperada:rowVersion});
    if(result.error){
      if(result.error.code==='40001'){await load();toast('A rodada foi atualizada. Confira os candidatos e tente novamente.');}
      else if(result.error.code==='23505')toast('Esta conta já votou nesta rodada.');
      else toast(result.error.code==='22023'?result.error.message:'O voto não foi gravado. Confira sua conta e tente novamente.');
      return;
    }
    resetVote();
    await load();
    toast('Seu voto foi registrado.');
  }catch(error){toast('A conexão caiu. Reabra a rodada para conferir o voto.');}
  finally{ui.voting=false;render();}
}
function viewVotacao(){
  if(!canEditUi())return '';
  var current=monthKey(juriGame()?.date||Date.now()),summary=monthStandings(current);
  var upH='<section class="card month-vote-summary"><h2>Votação &amp; Mês</h2><p>'+esc(monthLabel(current,true))+'</p><dl>'+
    '<div><dt>Jogos válidos</dt><dd>'+summary.jogos+'</dd></div><div><dt>Vitórias do Vermelho</dt><dd>'+summary.w[0]+'</dd></div>'+
    '<div><dt>Vitórias do Verde</dt><dd>'+summary.w[1]+'</dd></div><div><dt>Empates</dt><dd>'+summary.e+'</dd></div></dl></section>'+upcomingVoteHTML();
  if(!S.history.length)return upH+'<p class="empty">A votação aparece depois da primeira pelada confirmada no Sorteio.</p>'+criteriosHTML(false);
  var g=juriGame();if(!g)return upH;
  var gd=function(x){return new Date(x.date).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});};
  var V=g.juri.votos,fin=g.juri.final,h=upH+'<section class="card"><h2>🗳️ Votação da rodada</h2><p class="hint">Só a diretoria vê esta aba. Cada votante escolhe o <strong>bola cheia (craque)</strong> e o <strong>bola murcha</strong>. Até 5 votantes.</p>';
  if(S.history.length>1)h+='<label class="field"><span>Pelada</span><select data-act="juriGame">'+S.history.slice(0,12).map(function(x){return '<option value="'+x.id+'"'+(x.id===g.id?' selected':'')+'>'+esc(gd(x))+(x.juri.final?' · finalizada':'')+'</option>';}).join('')+'</select></label>';
  else h+='<p class="meta">Pelada de '+esc(gd(g))+'</p>';
  h+='<p class="meta">Votos computados: <strong>'+V.length+' de 5</strong> · Um voto por conta autenticada.</p>';
  if(!fin){
    if(V.length<5){
      h+='<div class="vform">';
      h+='<p class="hint">Selecione um atleta para cada prêmio e confirme seu voto.</p>';
      var nIn=gameRoster(g).length,outL=(ui.vOutL&&ui.vOutL[g.id])||[];
      h+='<div class="vlist-h"><span><strong>'+nIn+'</strong> atletas na lista</span><button type="button" class="chip" data-act="vConf" data-g="'+g.id+'" aria-pressed="'+!!g.cob.e+'">'+(g.cob.e?'✓ Lista de presentes conferida':'Marcar lista como conferida')+'</button></div><p class="hint">Quem não foi? Toque no <strong>✕</strong> para tirar da lista antes de votar.</p>';
      if(outL.length)h+='<div class="vout"><span>Tirados:</span>'+outL.map(function(o){return '<button type="button" class="chip" data-act="vBack" data-g="'+g.id+'" data-id="'+o.id+'" aria-label="Voltar '+esc(gameName(g,o.id))+' para a lista">↩ '+esc(gameName(g,o.id))+'</button>';}).join('')+'</div>';
      g.teams.forEach(function(t,ti){var col=TNc(g,ti);
        h+='<div class="vteam" style="--bib:'+col.c+';--bibt:'+col.t+'"><div class="vteam-h">'+col.e+' '+col.n+'</div>';
        t.map(function(id){return {id:id,name:gameName(g,id)};}).sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR');}).forEach(function(p){
          var ch=ui.vCheia===p.id,mu=ui.vMurcha===p.id;
          h+='<div class="vrow"><span class="nm">'+avatar(personOf(g,p.id),30)+' '+esc(p.name) + '</span>'+
            '<button type="button" class="vck cheia'+(ch?' on':'')+'" data-act="vPick" data-k="cheia" data-id="'+p.id+'" aria-pressed="'+ch+'" aria-label="Bola cheia: '+esc(p.name)+'"' + '>🏆</button>'+
            '<button type="button" class="vck murcha'+(mu?' on':'')+'" data-act="vPick" data-k="murcha" data-id="'+p.id+'" aria-pressed="'+mu+'" aria-label="Bola murcha: '+esc(p.name)+'"' + '>🎈</button>'+
            '<button type="button" class="vck vx" data-act="vOut" data-g="'+g.id+'" data-id="'+p.id+'" aria-label="Tirar '+esc(p.name)+' da lista (não foi)">✕</button></div>';});
        h+='</div>';});
      h+='<div class="vsum">🏆 '+(ui.vCheia?esc(gameName(g,ui.vCheia)):'—')+' · 🎈 '+(ui.vMurcha?esc(gameName(g,ui.vMurcha)):'—')+'</div>';
      h+='<button type="button" class="btn primary wide" data-act="vSave" data-g="'+esc(g.id)+'"'+(ui.voting?' disabled':'')+'>Registrar meu voto</button></div>';
    }else h+='<p class="ok">Os 5 votos foram computados. Agora é só finalizar.</p>';
    if(V.length){
      h+='<button type="button" class="btn wide fin" data-act="vFinal" data-g="'+g.id+'">'+(ui.confirmFin?'Toque de novo para finalizar com '+V.length+' voto'+(V.length>1?'s':''):'✅ Finalizar votação ('+V.length+' voto'+(V.length>1?'s':'')+')')+'</button>';
      if(V.length<3)h+='<p class="hint">O combinado são 3 votantes. Dá para finalizar com menos, se precisar.</p>';
    }
  }else{
    var pend=['cheia','murcha'].filter(function(tp){var a=apurar(g,tp);return a.tie.length&&!(g[tp]&&a.tie.indexOf(g[tp])>=0);}),picks=ui.tb&&(ui.tb.cheia||ui.tb.murcha);
    h+='<div class="resbox"><h3>Resultado</h3>'+apurHTML(g,'cheia','🏆 Bola cheia (craque)',true)+apurHTML(g,'murcha','🎈 Bola murcha',true)+
      (pend.length||picks?'<button type="button" class="btn primary wide tiesave" data-act="tieSave" data-g="'+g.id+'"'+(pend.some(function(tp){return !(ui.tb&&ui.tb[tp]);})?' disabled':'')+'>✅ Salvar desempate</button>'+(pend.length?'<p class="hint">Falta desempatar: '+pend.map(function(tp){return tp==='cheia'?'bola cheia':'bola murcha';}).join(' e ')+'. O resultado só é publicado depois disso.</p>':''):'')+'<p class="hint">Resultado publicado: já aparece no Ranking e em Jogos para todo mundo.</p><div class="btnrow"><button type="button" class="btn" data-act="vAnnounce" data-g="'+g.id+'">Copiar resultado para o WhatsApp</button><button type="button" class="btn" data-act="vReopen" data-g="'+g.id+'">Reabrir votação</button></div></div>';
  }
  h+='</section>'+criteriosHTML(false);
  return h;
}
function resultText(g){
  var d=new Date(g.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),L=['🗳️ *Votação — '+S.info.name+' ('+d+')*',''],nv=g.juri.votos.length;
  [['cheia','🏆 Bola cheia (craque)'],['murcha','🎈 Bola murcha']].forEach(function(x){var a=apurar(g,x[0]);if(!a.n)return;L.push('*'+x[1]+':* '+(g[x[0]]?gameName(g,g[x[0]])+(g.juri.desempate&&g.juri.desempate[x[0]]===g[x[0]]?' (desempate)':''):'a definir (empate)'));a.ks.forEach(function(k){L.push('• '+gameName(g,k)+' — '+a.c[k]+' voto'+(a.c[k]>1?'s':'')+(a.c[k]===nv&&nv>1?' (unânime)':''));});L.push('');});
  L.push('Votaram: '+g.juri.votos.map(function(v){return v.nome;}).join(', '));
  return L.join('\n');
}
function cobHTML(g){
  return '<div class="cob"><p class="grp" style="margin:12px 0 4px">Dados registrados nesta rodada</p><p class="hint" style="margin:0 0 8px">Marque só o que foi registrado de verdade. O que ficar desmarcado aparece como <strong>sem registro</strong> e nunca vira zero nas estatísticas.</p><div class="chips">'+COBK.map(function(k){return '<button type="button" class="chip" data-act="cob" data-g="'+g.id+'" data-k="'+k[0]+'" aria-pressed="'+(!!g.cob[k[0]])+'">'+k[1]+'</button>';}).join('')+'</div></div>';
}
function addPlayerHTML(g){
  var opts=S.players.slice().sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR');}).map(function(p){return '<option value="'+esc(p.name)+'">';}).join('');
  return '<div class="addp"><p class="grp" style="margin:14px 0 4px">Adicionar atleta que jogou</p><div class="addrow"><input id="gpName" type="text" list="gpList" maxlength="30" placeholder="Nome do atleta" autocomplete="off"><select id="gpTeam" aria-label="Time do atleta">'+(g.adv?'<option value="0">Futebol dos Amigos</option>':'<option value="0">Vermelho</option><option value="1">Verde</option>')+'<option value="s">Sem time informado</option></select><button type="button" class="btn primary" data-act="gAddP" data-g="'+g.id+'">Adicionar</button></div><datalist id="gpList">'+opts+'</datalist><p class="hint">Se o nome não estiver no Elenco (atleta antigo), ele entra só pelo nome, sem criar cadastro.</p></div>';
}
function gameSummary(g){
  var go=0,as=0,y=0,r=0;Object.keys(g.stats).forEach(function(id){var s=g.stats[id];go+=s.g;as+=s.a;y+=s.y;r+=s.r;});
  return {g:go,a:as,y:y,r:r};
}
function statLine(s){if(!s)return '';var o=[];if(s.g)o.push('⚽'+s.g+(s.pen?' (🎯'+s.pen+' pên.)':'')+(s.fal?' (🌀'+s.fal+' falta)':''));if(s.og)o.push(s.og+' contra');if(s.a)o.push('👟'+s.a);if(s.y)o.push('🟨'+(s.y>1?s.y:''));if(s.r)o.push('🟥');return o.join(' ');}
function lastSunday(){var d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-d.getDay());return d;}
function isoDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function rodadaForm(){
  var dv=ui.rodDate||dateBR(),mk=dv.slice(0,7),t=monthTeams(mk);
  var exists=S.history.some(function(g){return dateBR(g.date)===dv;});
  return '<section class="card rod"><h2>➕ Registrar rodada</h2><p class="hint">Registre a partida para lançar gols ou acompanhar o placar ao vivo.</p>'+
    '<label class="field"><span>Data do jogo</span><input type="date" id="rodDate" data-act="rodDate" value="'+dv+'" max="'+isoDate(new Date(Date.now()+7*864e5))+'"></label>'+
    (t?'<p class="ok">Times de '+monthName(mk)+': 🔴 '+t[0].length+' x '+t[1].length+' 🟢</p>':'<p class="warn">Os times de '+monthName(mk)+' não estão cadastrados. A rodada será registrada só com os destaques (placar, craque e bola murcha). Para lançar gols, cadastre os times do mês na aba Sorteio.</p>')+
    '<label class="field"><span>Adversário (opcional, só se foi contra outro time)</span><input type="text" id="rodAdv" maxlength="40" placeholder="Deixe vazio para Vermelho x Verde"></label>'+
    (exists?'<p class="warn">Já existe uma rodada registrada nesse dia.</p>':'')+
    '<button type="button" class="btn primary wide" data-act="rodAdd"'+(exists?' disabled':'')+'>Registrar rodada de '+dv.split('-').reverse().slice(0,2).join('/')+'</button></section>';
}
/* ===== HISTÓRICO: importar / exportar planilha CSV ===== */
var CSVH=['data','adversario','placar_vermelho','placar_verde','campo','valida','atleta','time','gols','assistencias','gols_penalti','gols_falta','amarelos','vermelhos','craque','bola_murcha','observacoes','gols_contra'];
var HSYN={data:['data','dia','date'],adversario:['adversario','oponente'],placar_vermelho:['placar_vermelho','placar_fda','placar_a'],placar_verde:['placar_verde','placar_adversario','placar_b'],campo:['campo','local'],valida:['valida','vale','conta_no_campeonato'],atleta:['atleta','jogador','nome'],time:['time','equipe','lado'],gols:['gols','gol'],assistencias:['assistencias','assistencia','assist'],gols_penalti:['gols_penalti','penalti','penaltis','gols_de_penalti'],gols_falta:['gols_falta','falta','faltas','gols_de_falta'],gols_contra:['gols_contra','gol_contra','contra'],amarelos:['amarelos','amarelo','cartao_amarelo'],vermelhos:['vermelhos','cartao_vermelho'],craque:['craque','bola_cheia'],bola_murcha:['bola_murcha','murcha'],observacoes:['observacoes','obs','notas']};
var CSVMODELO='# MODELO DO HISTÓRICO DO FUTEBOL DOS AMIGOS. Linhas que começam com # são ignoradas.\n# Uma linha por atleta em cada jogo. O separador é ponto e vírgula (;).\n# CÉLULA VAZIA = NÃO INFORMADO (sem registro). O número 0 significa zero de verdade.\n# time: vermelho, verde, fda (jogo contra adversário) ou vazio (time não informado).\n# Jogo contra adversário: preencha "adversario"; placar_vermelho = gols do FDA e placar_verde = gols do adversário.\n# valida: sim ou nao (nao = passeio, não conta no campeonato do mês). craque e bola_murcha: sim.\n# Para um jogo sem lista de atletas, deixe a coluna "atleta" vazia e preencha só os dados do jogo.\n# Exemplo (apague o # para usar):\n# 04/10/2026;;2;1;imperial;sim;Nome do Atleta;vermelho;2;1;1;0;0;0;sim;;Observação do jogo\n'+CSVH.join(';')+'\n';
function parseCSV(t){
  t=String(t||'').replace(/^\uFEFF/,'');
  var m=t.split(/\r\n|\n|\r/).filter(function(l){return l.trim()&&l.trim().charAt(0)!=='#';})[0]||'';
  var sc=(m.match(/;/g)||[]).length,cc=(m.match(/,/g)||[]).length,tc=(m.match(/\t/g)||[]).length,d=(tc>sc&&tc>cc)?'\t':(sc>=cc?';':',');
  var rows=[],row=[],f='',q=false,i=0,start=true;
  var push=function(){row.push(f);f='';if(row.some(function(x){return x.trim()!=='';}))rows.push(row);row=[];};
  while(i<t.length){
    var c=t.charAt(i);
    if(start&&!q&&c==='#'){while(i<t.length&&t.charAt(i)!=='\n'&&t.charAt(i)!=='\r')i++;continue;}
    start=false;
    if(q){if(c==='"'){if(t.charAt(i+1)==='"'){f+='"';i++;}else q=false;}else f+=c;}
    else if(c==='"'&&f==='')q=true;
    else if(c===d){row.push(f);f='';}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&t.charAt(i+1)==='\n')i++;push();start=true;}
    else f+=c;
    i++;
  }
  if(f!==''||row.length)push();
  return rows;
}
function parseDataBR(s){
  s=String(s||'').trim();var m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})$/),y,mo,d;
  if(m){d=+m[1];mo=+m[2];y=+m[3];if(y<100)y+=2000;}
  else{m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;y=+m[1];mo=+m[2];d=+m[3];}
  var dt=new Date(y,mo-1,d,6,0);if(dt.getFullYear()!==y||dt.getMonth()!==mo-1||dt.getDate()!==d||y<2000)return null;return dt;
}
function simNao(v){v=norm(String(v||''));return /^(sim|s|x|1|true|verdadeiro)$/.test(v)?true:(/^(nao|n|0|false|falso)$/.test(v)?false:null);}
function buildImport(rows,opt){
  var R={games:[],err:[],warn:[],unk:{},nrows:0,reconhecidos:0};
  if(!rows.length){R.err.push('O arquivo está vazio.');return R;}
  var H=rows[0].map(function(h){var k=norm(h).replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');for(var c in HSYN)if(HSYN[c].indexOf(k)>=0)return c;return null;});
  if(H.indexOf('data')<0){R.err.push('Não achei a coluna "data" na primeira linha (cabeçalho). Use o modelo para conferir os nomes das colunas.');return R;}
  rows[0].forEach(function(h,i){if(H[i]===null&&String(h).trim())R.warn.push('Coluna "'+String(h).trim()+'" não é reconhecida e foi ignorada.');});
  var by={},order=[];
  rows.slice(1).forEach(function(r,ri){
    var o={};H.forEach(function(k,i){if(k)o[k]=(r[i]===undefined?'':String(r[i])).trim();});R.nrows++;var ln=ri+2;
    var dt=parseDataBR(o.data);if(!dt){R.err.push('Linha '+ln+': data inválida "'+(o.data||'')+'". Use dd/mm/aaaa.');return;}
    var key=isoDate(dt);if(!by[key]){by[key]={dt:dt,key:key,rows:[]};order.push(key);}by[key].rows.push({o:o,ln:ln});
  });
  var NUM=[['gols','g'],['assistencias','a'],['gols_penalti','pen'],['gols_falta','fal'],['gols_contra','og'],['amarelos','y'],['vermelhos','r']];
  order.sort().forEach(function(key){
    var G=by[key],lbl=p2(G.dt.getDate())+'/'+p2(G.dt.getMonth()+1)+'/'+G.dt.getFullYear(),ex=S.history.some(function(g){return isoDate(new Date(g.date))===key;});
    var first=function(k){for(var i=0;i<G.rows.length;i++)if(G.rows[i].o[k])return G.rows[i].o[k];return '';};
    var adv=first('adversario').slice(0,40),pv=first('placar_vermelho'),pg=first('placar_verde'),campo=first('campo'),vl=first('valida'),obs=first('observacoes').slice(0,2000);
    var ath=[],seen={},errs0=R.err.length;
    G.rows.forEach(function(rw){
      var o=rw.o;if(!o.atleta)return;var nm=o.atleta.replace(/\s+/g,' ').slice(0,30),k=norm(nm);
      if(seen[k]){R.err.push('Linha '+rw.ln+': o atleta "'+nm+'" aparece duas vezes em '+lbl+'.');return;}seen[k]=1;
      var tm=norm(o.time||''),ti;
      if(!tm)ti='s';else if(adv&&/^(fda|amigos|futebol dos amigos|nos|nosso)$/.test(tm))ti=0;else if(!adv&&tm==='vermelho')ti=0;else if(!adv&&tm==='verde')ti=1;else{R.err.push('Linha '+rw.ln+': time "'+o.time+'" inválido'+(adv?' (em jogo contra adversário use "fda" ou deixe vazio)':' (use vermelho, verde ou deixe vazio)')+'.');ti='s';}
      var vals={};NUM.forEach(function(n){var s=o[n[0]];if(s===undefined||s===''){vals[n[1]]=null;return;}if(!/^\d+$/.test(s)){R.err.push('Linha '+rw.ln+': "'+s+'" em '+n[0]+' não é um número inteiro.');vals[n[1]]=null;return;}vals[n[1]]=Math.min(30,parseInt(s,10));});
      ath.push({nm:nm,ti:ti,vals:vals,cq:simNao(o.craque)===true,mu:simNao(o.bola_murcha)===true,ln:rw.ln});
    });
    if(R.err.length>errs0)return;
    var cov={};
    [['g',['g']],['a',['a']],['p',['pen']],['f',['fal']],['o',['og']],['c',['y','r']]].forEach(function(c){
      var cells=0,filled=0;ath.forEach(function(a){c[1].forEach(function(k){cells++;if(a.vals[k]!==null)filled++;});});
      var ok=ath.length>0&&(opt.lenient?filled>0:filled===cells);cov[c[0]]=ok;
      if(ath.length&&filled>0&&!ok)R.warn.push(lbl+': '+({g:'gols',a:'assistências',p:'gols de pênalti',f:'gols de falta',o:'gols contra',c:'cartões'})[c[0]]+' preenchidos só para alguns atletas. O jogo ficou "sem registro" desse dado e os números foram ignorados (preencha 0 para quem não teve, ou marque a opção de células vazias = 0).');
    });
    var teams=[[],[]],sem=[],stats={},names={},cheia=null,murcha=null,mapped=0;
    ath.forEach(function(a){
      var real=findByName(a.nm),id=real?real.id:'n:'+a.nm;names[id]=real?real.name:a.nm;
      if(real){mapped++;R.reconhecidos++;}else R.unk[a.nm]=1;
      if(a.ti==='s')sem.push(id);else teams[a.ti].push(id);
      var s={g:0,a:0,y:0,r:0,pen:0,fal:0};
      if(cov.g)s.g=a.vals.g||0;if(cov.a)s.a=a.vals.a||0;if(cov.p)s.pen=a.vals.pen||0;if(cov.f)s.fal=a.vals.fal||0;if(cov.o)s.og=a.vals.og||0;if(cov.c){s.y=Math.min(2,a.vals.y||0);s.r=Math.min(1,a.vals.r||0);}
      if(s.pen+s.fal>s.g&&cov.g){R.warn.push(lbl+': '+a.nm+' tem pênaltis + faltas maior que os gols; os gols foram ajustados.');}
      if(s.g||s.og||s.a||s.y||s.r||s.pen||s.fal)stats[id]=s;
      if(a.cq){if(cheia)R.warn.push(lbl+': mais de um craque marcado; valeu o primeiro.');else cheia=id;}
      if(a.mu){if(murcha)R.warn.push(lbl+': mais de uma bola murcha marcada; valeu a primeira.');else murcha=id;}
    });
    var placar=null;
    if(pv!==''||pg!==''){if(/^\d+$/.test(pv)&&/^\d+$/.test(pg))placar={v:Math.min(50,+pv),g:Math.min(50,+pg)};else R.warn.push(lbl+': placar incompleto ou inválido; ignorado.');}
    var fid='';if(campo){var cn=norm(campo),F=S.info.fields.filter(function(f){return f.id===cn||norm(f.name).indexOf(cn)>=0;})[0];if(F)fid=F.id;else R.warn.push(lbl+': campo "'+campo+'" não encontrado; ficou sem campo.');}
    if(placar&&cov.g&&!adv&&ath.length&&ath.every(function(a){return a.ti!=='s';})){var sg=[0,0];ath.forEach(function(a){sg[a.ti]+=(a.vals.g||0);if(cov.o)sg[1-a.ti]+=(a.vals.og||0);});if(sg[0]!==placar.v||sg[1]!==placar.g)R.warn.push(lbl+': os gols dos atletas ('+sg[0]+' x '+sg[1]+') não batem com o placar ('+placar.v+' x '+placar.g+'). Pode haver gol contra ou gol faltando.');}
    var obj={id:uid(),date:G.dt.getTime(),teams:teams,sem:sem,stats:stats,names:names,placar:placar,obs:obs,adv:adv,valida:simNao(vl)!==false,campo:fid,cheia:cheia,murcha:murcha,sumula:!!(cov.g||cov.a||cov.p||cov.f||cov.o||cov.c),cob:{e:ath.length>0,g:!!cov.g,a:!!cov.a,p:!!cov.p,f:!!cov.f,o:!!cov.o,c:!!cov.c}};
    if(ex)R.warn.push(lbl+': já existe uma rodada nesta data. Ela será ignorada (para corrigir, edite a súmula existente).');
    R.games.push({key:key,lbl:lbl,status:ex?'dup':'nova',n:ath.length,mapped:mapped,adv:adv,placar:placar,cob:obj.cob,obj:obj});
  });
  if(!R.games.length&&!R.err.length)R.err.push('Nenhuma linha de jogo encontrada.');
  return R;
}
function csvCell(v){v=v==null?'':String(v);return /[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}
function exportCSV(){
  var out=[CSVH.join(';')];
  S.history.slice().sort(function(a,b){return a.date-b.date;}).forEach(function(g){
    var d=new Date(g.date),dmy=p2(d.getDate())+'/'+p2(d.getMonth()+1)+'/'+d.getFullYear(),ros=gameRoster(g),tOf={};
    g.teams.forEach(function(t,i){t.forEach(function(id){tOf[id]=i;});});
    var base=[dmy,g.adv||'',g.placar?g.placar.v:'',g.placar?g.placar.g:'',g.campo||'',g.valida===false?'nao':'sim'];
    var tw=function(id){var i=tOf[id];if(i===undefined)return '';return g.adv?'fda':(i===0?'vermelho':'verde');};
    if(!ros.length){out.push(base.concat(['','','','','','','','','','',g.obs||'','']).map(csvCell).join(';'));return;}
    ros.forEach(function(id,ix){var s=g.stats[id]||{g:0,a:0,pen:0,fal:0,y:0,r:0},v=function(cv,x){return cv?x:'';};
      out.push(base.concat([gameName(g,id),tw(id),v(g.cob.g,s.g),v(g.cob.a,s.a),v(g.cob.p,s.pen||0),v(g.cob.f,s.fal||0),v(g.cob.c,s.y),v(g.cob.c,s.r),g.cheia===id?'sim':'',g.murcha===id?'sim':'',ix===0?(g.obs||''):'',v(g.cob.o,s.og||0)]).map(csvCell).join(';'));});
  });
  return '\uFEFF'+out.join('\r\n')+'\r\n';
}
function downloadText(name,text,mime){var b=new Blob([text],{type:(mime||'text/csv')+';charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(u);a.remove();},600);}
function impPreview(R,act){act=act||'impApply';
  var novas=R.games.filter(function(g){return g.status==='nova';}),dups=R.games.length-novas.length,unk=Object.keys(R.unk);
  var h='<div class="imp-res" role="region" aria-label="Conferência do arquivo">';
  h+='<p class="imp-sum"><strong>'+novas.length+'</strong> jogo'+(novas.length===1?'':'s')+' novo'+(novas.length===1?'':'s')+(dups?' · '+dups+' já existe'+(dups>1?'m':'')+' (ignorado'+(dups>1?'s':'')+')':'')+' · '+R.reconhecidos+' atleta'+(R.reconhecidos===1?'':'s')+' reconhecido'+(R.reconhecidos===1?'':'s')+(unk.length?' · <strong>'+unk.length+' fora do Elenco</strong>':'')+'</p>';
  if(R.err.length)h+='<div class="warn" role="alert"><strong>Corrija antes de importar:</strong><ul class="imp-l">'+R.err.slice(0,12).map(function(e){return '<li>'+esc(e)+'</li>';}).join('')+(R.err.length>12?'<li>…e mais '+(R.err.length-12)+' erro(s).</li>':'')+'</ul></div>';
  if(unk.length)h+='<p class="unkn" role="note">Atletas fora do Elenco (entram só pelo nome, sem criar cadastro): '+unk.slice(0,12).map(esc).join(', ')+(unk.length>12?' e mais '+(unk.length-12):'')+'.</p>';
  if(R.warn.length)h+='<details class="rules-d"><summary>'+R.warn.length+' aviso'+(R.warn.length>1?'s':'')+' (não impedem a importação)</summary><ul>'+R.warn.slice(0,25).map(function(e){return '<li>'+esc(e)+'</li>';}).join('')+(R.warn.length>25?'<li>…e mais '+(R.warn.length-25)+'.</li>':'')+'</ul></details>';
  if(R.games.length){h+='<ul class="imp-g">';R.games.slice(0,40).forEach(function(g){
    h+='<li class="'+g.status+'"><b>'+g.lbl+'</b><span>'+(g.adv?'vs '+esc(g.adv)+' · ':'')+(g.placar?g.placar.v+' x '+g.placar.g+' · ':'')+g.n+' atleta'+(g.n===1?'':'s')+'</span><span class="imp-c">'+COBK.map(function(k){return '<i class="'+(g.cob[k[0]]?'ok':'no')+'" title="'+k[1]+(g.cob[k[0]]?': registrado':': sem registro')+'">'+k[1].replace('Gols de ','').charAt(0)+(g.cob[k[0]]?'✓':'–')+'</i>';}).join('')+'</span>'+(g.status==='dup'?'<em>já existe</em>':'')+'</li>';});
    if(R.games.length>40)h+='<li><span>…e mais '+(R.games.length-40)+' jogos.</span></li>';
    h+='</ul><p class="hint">Legenda: E escalação · G gols · A assistências · P pênaltis · F faltas · C cartões. ✓ registrado, – sem registro.</p>';}
  h+='<div class="btnrow"><button type="button" class="btn primary" data-act="'+act+'"'+(R.err.length||!novas.length?' disabled':'')+'>Importar '+novas.length+' jogo'+(novas.length===1?'':'s')+'</button></div></div>';
  return h;
}
/* ===== IMPORTAR SÚMULAS (modo fácil): um bloco de texto por jogo, vários jogos de uma vez ===== */
var SUMKEYS={'data':'data','vermelho':'pv','placar vermelho':'pv','verde':'pg','placar verde':'pg','gols do vermelho':'gv','gols vermelho':'gv','gol do vermelho':'gv','artilheiros do vermelho':'gv','gols do verde':'gg','gols verde':'gg','gol do verde':'gg','artilheiros do verde':'gg','assistencias':'as','assistencia':'as','assist':'as','bola cheia':'ch','craque':'ch','bola murcha':'mu','bola mocha':'mu','murcha':'mu','escalacao do vermelho':'ev','escalacao vermelho':'ev','time vermelho':'ev','escalacao do verde':'eg','escalacao verde':'eg','time verde':'eg','adversario':'adv','vale no campeonato':'vale','valendo':'vale','vale':'vale','campo':'campo','observacoes':'obs','observacao':'obs','obs':'obs'};
function sumKey(k){k=norm(String(k||'').replace(/\([^)]*\)/g,'')).replace(/[?:]/g,'').replace(/\s+/g,' ').trim();return SUMKEYS[k]||null;}
function sumModeloTxt(){
  var blk=function(n){return ['JOGO '+n,'Data: ','Vermelho: ','Verde: ','Gols do Vermelho: ','Gols do Verde: ','Assistências: ','Bola cheia: ','Bola murcha: ','Escalação do Vermelho (opcional): ','Escalação do Verde (opcional): ','Adversário (opcional): ','Vale no campeonato? (sim/não): ','Observações: ',''].join('\n');};
  var t=['# MODELO DE SÚMULAS DO FUTEBOL DOS AMIGOS (modo fácil). Linhas com # são ignoradas.',
  '# Preencha um bloco por jogo (este modelo tem 10). Blocos sem "Data" são ignorados. Pode apagar os que não usar ou copiar mais blocos.',
  '# Vermelho e Verde = o PLACAR (só o número). Escreva os nomes depois dos dois pontos, separados por vírgula.',
  '# Gols: nome e depois o número de gols. Ex.: Gols do Verde: M14 2 (pênalti), Kaio, Serrote (falta)',
  '#   (pênalti) ou (falta) sozinho vale para todos os gols daquele item. Com número vale só para aquela quantidade: M14 3 (1 pênalti, 1 falta)',
  '#   Se o time não fez gol, escreva "nenhum". Se NÃO SOUBER, deixe a linha em branco: fica "sem registro" (não vira zero).',
  '# Bola cheia = craque. Bola murcha = pior da rodada. A escalação é opcional (sem ela, a presença não é contada).',
  '# Jogo contra outro time: preencha Adversário; em "Vermelho" vão os gols do Futebol dos Amigos e em "Verde" os do adversário.',
  '#',
  '# EXEMPLO (já preenchido; apague o # para usar):',
  '# JOGO 1','# Data: 27/09/2026','# Vermelho: 1','# Verde: 3','# Gols do Vermelho: Bezerrinho','# Gols do Verde: M14 2 (pênalti), Kaio','# Assistências: M14','# Bola cheia: M14','# Bola murcha: Serrote','',''];
  for(var i=1;i<=10;i++)t.push(blk(i));
  return t.join('\n');
}
/* "M14 2 (pênalti), Serrote" -> itens */
function sumSplit(v){
  var out=[],cur='',d=0;v=String(v||'');
  for(var i=0;i<v.length;i++){var ch=v.charAt(i);if(ch==='(')d++;if(ch===')')d=Math.max(0,d-1);if((ch===','||ch===';')&&d===0){out.push(cur);cur='';}else cur+=ch;}
  out.push(cur);return out.map(function(x){return x.trim();}).filter(Boolean);
}
function sumNone(v){return /^(nenhum|nenhuma|ninguem|zero|nao teve|sem gols?|sem assistencias?|-|0)$/.test(norm(String(v||'').trim()));}
/* um item: nome, quantidade e sinalizadores de pênalti/falta */
function sumItem(s){
  var rest=s.replace(/\(([^)]*)\)/g,function(_,x){return ' '+x+' ';}),pen=null,fal=null,penAll=false,falAll=false;
  var contra=/\b(?:gol\s+)?contra\b/i.test(rest);
  if(contra)rest=rest.replace(/\b(?:gol\s+)?contra\b/gi,' ');
  rest=rest.replace(/(?:(?:^|\s)(\d+)\s+)?(p[eêé]nalti(?:s)?|pen|falta(?:s)?)\b/gi,function(_,n,t){var isP=/^p/i.test(t);if(isP){if(n)pen=(pen||0)+parseInt(n,10);else penAll=true;}else{if(n)fal=(fal||0)+parseInt(n,10);else falAll=true;}return ' ';});
  rest=rest.replace(/[,;]+/g,' ').replace(/\s+/g,' ').replace(/[-–—:]+$/,'').trim();
  return {rest:rest,pen:pen,fal:fal,penAll:penAll,falAll:falAll,contra:contra};
}
function sumName(rest){ /* nome + quantidade opcional ("M14 2", "Kaio x2"); nome conhecido tem prioridade */
  if(findByName(rest))return {name:rest,n:null};
  var m=rest.match(/^(.*?)(?:\s+x?\s*(\d+)\s*x?)?$/i);return {name:(m[1]||'').trim(),n:m[2]?parseInt(m[2],10):null};
}
function looseFind(n){
  var p=findByName(n);if(p)return {p:p,how:'exato'};
  var k=norm(n),c=k.length>=3?S.players.filter(function(x){return norm(x.name).indexOf(k)===0;}):[];
  return c.length===1?{p:c[0],how:'parcial'}:null;
}
function parseSumulas(text){
  var lines=String(text||'').replace(/^\uFEFF/,'').split(/\r\n|\n|\r/),blocks=[],cur=null,last=null,unk=[];
  lines.forEach(function(raw,i){
    var L=raw.trim();if(!L||L.charAt(0)==='#')return;
    if(/^(jogo|partida|rodada)\s*\d*\s*[:.\-]?\s*$/i.test(norm(L))){cur={ln:i+1,f:{}};blocks.push(cur);last=null;return;}
    var m=L.match(/^([^:]{1,70}):\s*(.*)$/);
    if(m){var k=sumKey(m[1]);
      if(k){if(k==='data'&&cur&&cur.f.data!==undefined&&cur.f.data!==''){cur=null;}if(!cur){cur={ln:i+1,f:{}};blocks.push(cur);}cur.f[k]=((cur.f[k]?cur.f[k]+', ':'')+m[2].trim());last=k;return;}
      unk.push('Linha '+(i+1)+': campo "'+m[1].trim()+'" não reconhecido (ignorado).');return;}
    if(cur&&last)cur.f[last]=(cur.f[last]?cur.f[last]+', ':'')+L;
  });
  return {blocks:blocks,unk:unk};
}
function buildSumulas(text){
  var R={games:[],err:[],warn:[],unk:{},nrows:0,reconhecidos:0},P=parseSumulas(text);R.warn=R.warn.concat(P.unk);
  var datas={};
  P.blocks.forEach(function(b){
    var f=b.f,vazio=Object.keys(f).every(function(k){return !String(f[k]||'').trim();});if(vazio)return;
    var ln='Jogo da linha '+b.ln,dt=null;
    if(!String(f.data||'').trim()){R.err.push(ln+': falta a data.');return;}
    dt=parseDataBR(f.data);if(!dt){R.err.push(ln+': data inválida "'+f.data+'". Use dd/mm/aaaa (com o ano).');return;}
    var key=isoDate(dt),lbl=p2(dt.getDate())+'/'+p2(dt.getMonth()+1)+'/'+dt.getFullYear();ln='Jogo de '+lbl;
    if(datas[key]){R.err.push(ln+': duas súmulas com a mesma data.');return;}datas[key]=1;
    var errs0=R.err.length;
    /* placar */
    var pv=String(f.pv||'').trim(),pg=String(f.pg||'').trim(),placar=null;
    if(pv||pg){var a=pv.match(/^(\d+)\b/),c=pg.match(/^(\d+)\b/);if(a&&c)placar={v:Math.min(50,+a[1]),g:Math.min(50,+c[1])};else R.err.push(ln+': o placar precisa dos dois números (Vermelho e Verde).');}
    var adv=String(f.adv||'').replace(/\s+/g,' ').trim().slice(0,40);
    var mt=monthTeams(key.slice(0,7)),teamOfMonth={};if(mt)mt.forEach(function(t,i){t.forEach(function(id){teamOfMonth[id]=i;});});
    var teams=[[],[]],sem=[],names={},stats={},team={};   /* team[id]=0|1 */
    var resolve=function(n){var r=looseFind(n),id;
      if(r){id=r.p.id;names[id]=r.p.name;R.reconhecidos++;if(r.how==='parcial')R.warn.push(ln+': "'+n+'" foi entendido como '+r.p.name+'.');}
      else{id='n:'+n.slice(0,30);names[id]=n.slice(0,30);R.unk[n]=1;}
      return id;};
    var place=function(id,t){if(team[id]===undefined&&sem.indexOf(id)<0){if(t===0||t===1){team[id]=t;teams[t].push(id);}else sem.push(id);}else if((t===0||t===1)&&team[id]!==undefined&&team[id]!==t)R.err.push(ln+': '+names[id]+' está nos dois times.');};
    var stat=function(id){return stats[id]||(stats[id]={g:0,a:0,y:0,r:0,pen:0,fal:0});};
    /* escalação (opcional) */
    var ev=sumSplit(f.ev),eg=sumSplit(f.eg);
    ev.forEach(function(n){place(resolve(n),0);});eg.forEach(function(n){place(resolve(n),1);});
    /* gols */
    var gl=[['gv',0],['gg',1]],provG=[false,false];
    gl.forEach(function(x){var raw=String(f[x[0]]||'').trim();if(!raw)return;provG[x[1]]=true;if(sumNone(raw))return;
      sumSplit(raw).forEach(function(it){var s=sumItem(it),nm=sumName(s.rest);if(!nm.name){R.err.push(ln+': item de gol sem nome em "'+it+'".');return;}
        var g=nm.n!==null?nm.n:Math.max(1,(s.pen||0)+(s.fal||0),(s.penAll?1:0),(s.falAll?1:0)),pen=s.penAll?g:(s.pen||0),fal=s.falAll?g:(s.fal||0);
        if(pen+fal>g){R.err.push(ln+': "'+it+'": pênalti + falta passam do total de gols. Separe em itens (ex.: Nome (pênalti), Nome (falta)).');return;}
        var id=resolve(nm.name);place(id,s.contra?1-x[1]:x[1]);var s0=stat(id);
        if(s.contra)s0.og=(s0.og||0)+g;else{s0.g+=g;s0.pen+=pen;s0.fal+=fal;}});});
    /* assistências */
    var provA=false;
    (function(){var raw=String(f.as||'').trim();if(!raw)return;provA=true;if(sumNone(raw))return;
      sumSplit(raw).forEach(function(it){var s=sumItem(it),nm=sumName(s.rest);if(!nm.name)return;var id=resolve(nm.name);
        if(team[id]===undefined&&sem.indexOf(id)<0)place(id,teamOfMonth[id]);stat(id).a+=(nm.n!==null?nm.n:1);});})();
    /* bola cheia e bola murcha */
    var pick=function(k,label){var raw=String(f[k]||'').trim();if(!raw||sumNone(raw))return null;var n=sumSplit(raw)[0];if(sumSplit(raw).length>1)R.warn.push(ln+': mais de um nome em '+label+'; valeu o primeiro.');var id=resolve(sumName(sumItem(n).rest).name);if(team[id]===undefined&&sem.indexOf(id)<0)place(id,teamOfMonth[id]);return id;};
    var cheia=pick('ch','Bola cheia'),murcha=pick('mu','Bola murcha');
    if(R.err.length>errs0)return;
    /* cobertura: só vale o que foi realmente informado */
    var completo=function(t){return provG[t]||(placar&&(t===0?placar.v:placar.g)===0);};
    var cg=completo(0)&&completo(1);
    if(!cg&&(provG[0]||provG[1])){R.warn.push(ln+': só os gols de um dos times foram informados. Os gols desta rodada ficaram "sem registro" (escreva "nenhum" se um time não fez gol).');}
    if(!cg)Object.keys(stats).forEach(function(id){stats[id].g=0;stats[id].pen=0;stats[id].fal=0;});
    if(cg&&placar){var sg=[0,0];Object.keys(stats).forEach(function(id){if(team[id]!==undefined){sg[team[id]]+=stats[id].g;sg[1-team[id]]+=stats[id].og||0;}});
      if(sg[0]!==placar.v||sg[1]!==placar.g)R.warn.push(ln+': os artilheiros somam '+sg[0]+' x '+sg[1]+' e o placar é '+placar.v+' x '+placar.g+'. Pode ter gol contra ou artilheiro faltando.');}
    if(!cg&&placar&&!provG[0]&&!provG[1]&&(placar.v+placar.g)>0)R.warn.push(ln+': sem artilheiros informados, então os gols ficam "sem registro".');
    Object.keys(stats).forEach(function(id){var s=stats[id];if(!(s.g||s.og||s.a||s.pen||s.fal))delete stats[id];});
    var fid='',cp=String(f.campo||'').trim();if(cp){var cn=norm(cp),F=S.info.fields.filter(function(x){return x.id===cn||norm(x.name).indexOf(cn)>=0;})[0];if(F)fid=F.id;else R.warn.push(ln+': campo "'+cp+'" não encontrado; ficou sem campo.');}
    var cob={e:ev.length>0&&eg.length>0,g:cg,a:provA,p:cg,f:cg,o:Object.values(stats).some(function(s){return s.og>0;}),c:false};
    var ex=S.history.some(function(g){return isoDate(new Date(g.date))===key;});
    if(ex)R.warn.push(ln+': já existe uma rodada nesta data. Ela será ignorada (para corrigir, edite a súmula existente).');
    var obj={id:uid(),date:dt.getTime(),teams:teams,sem:sem,stats:stats,names:names,placar:placar,obs:String(f.obs||'').slice(0,2000),adv:adv,valida:simNao(f.vale)!==false,campo:fid,cheia:cheia,murcha:murcha,sumula:true,cob:cob};
    R.games.push({key:key,lbl:lbl,status:ex?'dup':'nova',n:teams[0].length+teams[1].length+sem.length,mapped:0,adv:adv,placar:placar,cob:cob,obj:obj});
  });
  R.games.sort(function(a,b){return a.key<b.key?-1:1;});
  if(!R.games.length&&!R.err.length)R.err.push('Nenhum jogo preenchido. Preencha pelo menos a data de um jogo.');
  return R;
}
function sumImportHTML(){
  var I=ui.sum||{};
  return '<section class="card imp"><h2>📝 Importar súmulas (modo fácil)</h2><p class="hint">Preencha um bloco por jogo: placar, artilheiros (com pênalti e falta), assistências, bola cheia e bola murcha. O modelo já vem com <strong>10 jogos</strong> e dá para colar quantos quiser de uma vez. O que ficar em branco vira <strong>sem registro</strong> (nunca zero). Nada é salvo até você tocar em <strong>Salvar</strong>.</p>'+
    '<div class="btnrow"><button type="button" class="btn sm" data-act="sumModelo">Baixar modelo (10 jogos)</button></div>'+
    '<label class="field"><span>Arquivo preenchido (.txt)</span><input id="sumFile" type="file" accept=".txt,text/plain" data-act="sumFile"></label>'+
    '<label class="field"><span>…ou cole as súmulas aqui</span><textarea id="sumText" rows="8" data-act="sumText" placeholder="JOGO 1&#10;Data: 04/10/2026&#10;Vermelho: 2&#10;Verde: 1&#10;Gols do Vermelho: M14 2 (pênalti)&#10;Gols do Verde: Serrote&#10;Assistências: Kaio&#10;Bola cheia: M14&#10;Bola murcha: Serrote">'+esc(I.text||'')+'</textarea></label>'+
    '<div class="btnrow"><button type="button" class="btn primary" data-act="sumCheck">Conferir súmulas</button></div>'+(I.res?impPreview(I.res,'sumApply'):'')+'</section>';
}

function histImportHTML(){
  var I=ui.imp||{};
  return '<section class="card imp"><h2>📥 Histórico: importar e exportar</h2><p class="hint">Cadastre rodadas antigas por planilha (CSV). O que não for informado fica como <strong>sem registro</strong> e nunca vira zero. Nada é salvo até você tocar em <strong>Salvar</strong>.</p>'+
    '<div class="btnrow"><button type="button" class="btn sm" data-act="impModelo">Baixar modelo (CSV)</button><button type="button" class="btn sm" data-act="impExport">Exportar histórico atual (CSV)</button></div>'+
    '<label class="field"><span>Arquivo da planilha (.csv)</span><input id="impFile" type="file" accept=".csv,text/csv,text/plain" data-act="impFile"></label>'+
    '<label class="field"><span>…ou cole o conteúdo da planilha aqui</span><textarea id="impText" rows="5" data-act="impText" placeholder="data;adversario;placar_vermelho;placar_verde;...">'+esc(I.text||'')+'</textarea></label>'+
    '<label class="mini"><input type="checkbox" class="sw" id="impLen" data-act="impLen"'+(I.lenient?' checked':'')+'><span>Minha planilha lista só quem marcou: considerar células vazias como 0 nas colunas preenchidas</span></label>'+
    '<div class="btnrow"><button type="button" class="btn primary" data-act="impCheck">Conferir arquivo</button></div>'+(I.res?impPreview(I.res):'')+'</section>';
}

var VOICE_NUMBERS={zero:0,um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12};
var voiceRecognition=null;
function parseVoice(text,game){
  var words=norm(text).replace(/\s+/g,' ').trim(),out={score:null,goals:{},awards:{},warnings:[]};
  var options=gameRoster(game).map(function(id){return {id:id,name:gameName(game,id),key:norm(gameName(game,id))};});
  function resolve(candidate){
    var key=norm(candidate).replace(/\b(camisa|numero)\s+\d+$/,'').replace(/\s+/g,' ').trim();
    var matches=options.filter(function(p){return p.key===key;});
    if(!matches.length)matches=options.filter(function(p){return p.key.split(' ')[0]===key;});
    if(matches.length===1)return matches[0];
    out.warnings.push((matches.length?'Nome ambíguo: ':'Atleta fora da súmula: ')+candidate);
    return null;
  }
  if(/\bgols?\s+contra\b/.test(words))out.warnings.push('Registre gols contra no campo Gols contra da súmula para separar do total de gols a favor.');
  var number='(?:\\d{1,2}|'+Object.keys(VOICE_NUMBERS).join('|')+')';
  var numeric=function(x){return VOICE_NUMBERS[x]??Number(x);};
  var score=words.match(new RegExp('\\b(vermelho|verde)\\s+('+number+')\\s*(?:a|x|×|-)\\s*('+number+')\\s+(vermelho|verde)\\b'));
  if(score&&score[1]!==score[4]&&numeric(score[2])<=50&&numeric(score[3])<=50){
    out.score=score[1]==='vermelho'?{v:numeric(score[2]),g:numeric(score[3])}:{g:numeric(score[2]),v:numeric(score[3])};
  }
  var goals=new RegExp('\\b('+number+')\\s*(?:gols?\\s*)?(?:d[oa]s?|de)\\s+(.+?)(?=\\s+e\\s+(?:mais\\s+)?'+number+'\\s|\\bbola (?:cheia|murcha)\\b|[,.!;]|$)','g');
  for(var hit of words.matchAll(goals)){
    var player=resolve(hit[2]),count=numeric(hit[1]);
    if(player&&count>0&&count<=30)out.goals[player.id]=(out.goals[player.id]||0)+count;
  }
  var prizes=String(text).matchAll(/\bbola\s+(cheia|murcha)\s+(?:foi\s+)?(?:para\s+(?:o\s+|a\s+)?|pro\s+|pra\s+|do\s+|da\s+)?(.+?)(?=\s*(?:[,;.!]\s*)?(?:\be\s+)?\bbola\s+(?:cheia|murcha)\b|[;.!]|$)/giu);
  for(var prize of prizes){
    var parts=prize[2].trim().replace(/^(?:jogador|jogadora)\s+/i,'').split(/\s+(?:porque|que|por ter)\s+/i);
    var award=resolve(parts[0].replace(/[, ]+$/,''));
    if(award)out.awards[prize[1].toLowerCase()]={atleta:award.id,motivo:(parts[1]||'').trim().slice(0,180)};
  }
  if(out.awards.cheia&&out.awards.murcha&&out.awards.cheia.atleta===out.awards.murcha.atleta)out.warnings.push('Selecione atletas diferentes para os dois prêmios.');
  return out;
}
function voicePanel(game){
  var draft=ui.voice&&ui.voice.game===game.id?ui.voice:null,result=draft&&draft.result;
  var h='<section class="voice-panel"><h4>Súmula falada</h4><button type="button" class="btn" data-act="voiceStart" data-g="'+esc(game.id)+'">'+
    (draft&&draft.listening?'Parar gravação':'🎙️ Ditar Súmula e Resenha por Áudio')+'</button>'+
    '<label class="field"><span>Transcrição para revisar</span><textarea id="voice-transcript" rows="3" maxlength="1600" placeholder="Vermelho 4 a 2 Verde. Dois gols do Magaiver…">'+esc(draft?draft.text:'')+'</textarea></label>'+
    '<button type="button" class="btn sm" data-act="voiceParse" data-g="'+esc(game.id)+'">Interpretar transcrição</button>';
  if(result){
    var lines=[];
    if(result.score)lines.push('Placar: Vermelho '+result.score.v+' × '+result.score.g+' Verde');
    Object.keys(result.goals).forEach(function(id){lines.push('+'+result.goals[id]+' gol(s): '+gameName(game,id));});
    Object.keys(result.awards).forEach(function(k){var a=result.awards[k];lines.push((k==='cheia'?'Bola Cheia: ':'Bola Murcha: ')+gameName(game,a.atleta)+(a.motivo?' · '+a.motivo:''));});
    h+='<ul class="voice-review">'+lines.concat(result.warnings).map(function(line){return '<li>'+esc(line)+'</li>';}).join('')+'</ul>'+
      (lines.length&&!result.warnings.length?'<button type="button" class="btn primary sm" data-act="voiceApply" data-g="'+esc(game.id)+'">Aplicar à súmula</button>':'<p class="hint">Ajuste a transcrição antes de aplicar.</p>');
  }
  return h+'</section>';
}
function startVoice(game){
  if(!canEditUi()||!game)return;
  if(voiceRecognition){voiceRecognition.stop();return;}
  var Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){toast('Este navegador não oferece ditado. Cole ou digite a transcrição.');return;}
  var field=document.getElementById('voice-transcript');
  var draft={game:game.id,text:field?field.value.trim():'',listening:true};
  var base=draft.text,recognition=new Recognition();
  ui.voice=draft;voiceRecognition=recognition;
  recognition.lang='pt-BR';recognition.continuous=true;recognition.interimResults=false;
  recognition.onresult=function(event){
    var fragments=Array.from(event.results).filter(function(r){return r.isFinal;}).map(function(r){return r[0].transcript;});
    draft.text=[base].concat(fragments).join(' ').trim().slice(0,1600);
    var input=document.getElementById('voice-transcript');
    if(input&&ui.editGame===game.id)input.value=draft.text;
  };
  recognition.onend=function(){voiceRecognition=null;draft.listening=false;render();};
  recognition.onerror=function(){toast('O ditado não recebeu áudio. Você ainda pode revisar ou colar a transcrição.');};
  try{recognition.start();render();}catch(error){voiceRecognition=null;draft.listening=false;toast('Não consegui iniciar o microfone.');}
}
async function applyVoice(game){
  var draft=ui.voice;
  if(!canEditUi()||!game||!draft||draft.game!==game.id||draft.listening)return;
  var field=document.getElementById('voice-transcript');
  if(!field||field.value.trim()!==draft.text){toast('Interprete a transcrição atual antes de aplicar.');return;}
  var bytes=new TextEncoder().encode(norm(draft.text).replace(/\s+/g,' ').trim());
  if(!window.crypto?.subtle){toast('Abra a prévia local ou use HTTPS para aplicar a súmula falada.');return;}
  var hash=await window.crypto.subtle.digest('SHA-256',bytes);
  var entry=Array.from(new Uint8Array(hash),function(b){return b.toString(16).padStart(2,'0');}).join('');
  if(ui.voice!==draft||ui.editGame!==game.id)return;
  game.voiceEntries=game.voiceEntries||[];
  if(game.voiceEntries.includes(entry)){toast('Esta transcrição já foi aplicada à rodada.');return;}
  var result=parseVoice(draft.text,game);
  if(result.warnings.length||(!result.score&&!Object.keys(result.goals).length&&!Object.keys(result.awards).length))return;
  var cheia=result.awards.cheia?.atleta||game.cheia,murcha=result.awards.murcha?.atleta||game.murcha;
  if(cheia&&cheia===murcha){toast('A súmula ficaria com o mesmo atleta nos dois prêmios.');return;}
  if(Object.keys(result.goals).some(function(id){return (game.stats[id]?.g||0)+result.goals[id]>30;})){toast('Confira a quantidade de gols.');return;}
  if(result.score){game.placar=result.score;game.valida=true;game.vencedor=null;}
  Object.entries(result.goals).forEach(function([id,n]){var stats=game.stats[id]||{g:0,a:0,y:0,r:0,pen:0,fal:0,og:0};stats.g+=n;game.stats[id]=stats;game.cob.g=true;});
  game.resenha=game.resenha||{};
  Object.entries(result.awards).forEach(function([kind,award]){game[kind]=award.atleta;game.resenha[kind]=award;});
  game.voiceEntries.push(entry);
  game.sumula=true;ui.voice=null;change();toast('Súmula preenchida. Confira e toque em Salvar.');
}
function liveTeamLabel(game,side){
  if(!game.adv)return side==='v'?'Vermelho':'Verde';
  return side==='v'?S.info.name:game.adv;
}
function scoreFromStats(game){
  return Object.fromEntries(['v','g'].map(function(side,i){
    var goals=(game.teams[i]||[]).reduce(function(sum,id){return sum+(game.stats[id]?.g||0);},0)+
      (game.teams[1-i]||[]).reduce(function(sum,id){return sum+(game.stats[id]?.og||0);},0);
    return [side,Math.min(50,goals)];
  }));
}
function lockLiveGoals(game){game.liveGoals.forEach(function(goal){goal.locked=true;});}
function liveScorerOptions(game,side,kind){
  var team=side==='v'?0:1;
  if(kind==='contra')team=1-team;
  return '<option value="">Sem autor identificado</option>'+ (game.teams[team]||[]).slice().sort(function(a,b){
    return gameName(game,a).localeCompare(gameName(game,b),'pt-BR');
  }).map(function(id){return '<option value="'+esc(id)+'">'+esc(gameName(game,id))+'</option>';}).join('');
}
function liveGoalLabel(game,goal){
  return (goal.player?gameName(game,goal.player):'Sem autor identificado')+
    ({pen:' · pênalti',fal:' · falta',contra:' · contra'}[goal.kind]||'');
}
function livePanelHTML(game){
  var id=esc(game.id),disabled=(ui.liveBusy||ui.busy||dirty||!!ui.livePending)?' disabled':'';
  var goals=game.liveGoals.filter(function(goal){return !goal.undone;});
  var last=goals.filter(function(goal){return !goal.locked;}).at(-1),side=ui.liveSide||'v';
  var h='<section class="card live-editor" aria-labelledby="live-title">'+
    '<button class="btn sm" type="button" data-act="liveBack">Voltar às súmulas</button>'+
    '<h2 id="live-title">Placar ao vivo</h2><p class="hint">'+esc(dateBR(game.date).split('-').reverse().join('/'))+'</p>'+
    (game.placar?scoreboardHTML(game):'');
  if(dirty)h+='<p class="hint">Salve as alterações pendentes para usar o placar ao vivo.</p>';
  if(ui.liveError)h+='<p class="warn" role="status">'+esc(ui.liveError)+'</p>';
  if(ui.liveBusy)h+='<p class="hint" role="status">Enviando ao site…</p>';
  if(ui.livePending&&!ui.liveBusy)h+='<button class="btn" type="button" data-act="liveRetry">Tentar enviar de novo</button>';
  if(!game.live)return h+'<button class="btn primary" type="button" data-act="liveStart" data-id="'+id+'"'+disabled+'>Iniciar placar ao vivo</button></section>';
  h+='<form data-form="live-goal" data-game="'+id+'"><div class="grid2">'+
    '<label class="field">Gol para<select name="side" data-act="liveForm"><option value="v"'+(side==='v'?' selected':'')+'>'+esc(liveTeamLabel(game,'v'))+'</option><option value="g"'+(side==='g'?' selected':'')+'>'+esc(liveTeamLabel(game,'g'))+'</option></select></label>'+
    '<label class="field">Tipo de gol<select name="kind" data-act="liveForm"><option value="normal">Normal</option><option value="pen">Pênalti</option><option value="fal">Falta</option><option value="contra">Contra</option></select></label></div>'+
    '<label class="field">Quem fez o gol?<select name="scorer">'+liveScorerOptions(game,side,'normal')+'</select></label>'+
    '<button class="btn primary wide" type="submit"'+disabled+'>Registrar gol</button></form>';
  if(goals.length)h+='<ol class="live-goals" aria-label="Últimos gols">'+goals.slice(-6).reverse().map(function(goal){
    return '<li><strong>'+esc(liveTeamLabel(game,goal.side))+'</strong><span>'+nameLink({name:liveGoalLabel(game,goal)},rid(game,goal.player))+'</span></li>';
  }).join('')+'</ol>';
  return h+'<div class="btnrow">'+(last?'<button class="btn" type="button" data-act="liveUndo" data-id="'+id+'" data-goal="'+esc(last.id)+'"'+disabled+'>Desfazer último gol</button>':'')+
    '<button class="btn" type="button" data-act="liveEnd" data-id="'+id+'"'+disabled+'>Encerrar partida</button></div></section>';
}
function submitLiveGoal(form){
  var data=new FormData(form),side=data.get('side');
  ui.liveSide=side;
  commitLive(form.dataset.game,{type:'goal',side:side,kind:data.get('kind'),player:data.get('scorer')});
}
function liveGoalChange(game,goal,sign){
  var side=goal.side,score=game.placar||scoreFromStats(game),next=score[side]+sign;
  if(next<0||next>50)return 'O placar precisa ficar entre 0 e 50.';
  if(goal.player){
    var stat=Object.assign({g:0,a:0,y:0,r:0,pen:0,fal:0,og:0},game.stats[goal.player]);
    if(goal.kind==='contra')stat.og+=sign;
    else {
      stat.g+=sign;
      if(goal.kind!=='normal')stat[goal.kind]+=sign;
    }
    if(stat.g<0||stat.g>30||stat.og<0||stat.og>30||stat.pen<0||stat.fal<0||stat.pen+stat.fal>stat.g)return 'Confira os gols do atleta na súmula.';
    if(stat.g||stat.og||stat.a||stat.y||stat.r)game.stats[goal.player]=stat;else delete game.stats[goal.player];
    markCob(game,{normal:'g',contra:'og'}[goal.kind]||goal.kind);
  }
  game.placar=Object.assign({},score,{[side]:next});game.sumula=true;
  return '';
}
async function refreshLiveDirector(){
  if(!ui.livePanel||ui.liveRefreshing||ui.liveBusy||ui.livePending||ui.busy||dirty||document.hidden||!canEditUi()||!SB)return;
  if(document.activeElement?.closest('form[data-form="live-goal"]'))return;
  ui.liveRefreshing=true;
  var id=ui.livePanel;
  try{
    var r=await fetchRow();
    if(!r.error&&r.data?.versao>rowVersion&&ui.livePanel===id&&!ui.liveBusy&&!ui.livePending&&!dirty){
      S=normalize(r.data.dados);S.savedAt=rowVersion=r.data.versao;render();
    }
  }catch(error){}finally{ui.liveRefreshing=false;}
}
setInterval(refreshLiveDirector,2500);
function applyLiveAction(state,game,action){
  if(action.type==='start'){
    if(state.history.some(function(g){return g.id!==game.id&&g.live;}))return 'Encerre a outra partida ao vivo primeiro.';
    game.live=true;game.placar=game.placar||scoreFromStats(game);
    return '';
  }
  if(!game.live)return 'O placar desta partida já foi encerrado.';
  if(action.type==='end'){game.live=false;game.sumula=true;return '';}
  if(action.type==='undo'){
    var last=game.liveGoals.filter(function(g){return !g.undone&&!g.locked;}).at(-1);
    if(!last||last.id!==action.id)return 'O último gol mudou. Confira a lista para desfazer.';
    var error=liveGoalChange(game,last,-1);
    if(!error)last.undone=true;
    return error;
  }
  if(action.type!=='goal'||!['v','g'].includes(action.side)||!['normal','pen','fal','contra'].includes(action.kind))return 'Confira os dados do gol.';
  var team=action.side==='v'?0:1;
  if(action.kind==='contra')team=1-team;
  if(action.player&&!(game.teams[team]||[]).includes(action.player))return 'Escolha um atleta do time indicado.';
  var newGoal={id:action.request,side:action.side,kind:action.kind,player:action.player,undone:false,locked:false};
  var issue=liveGoalChange(game,newGoal,1);
  if(!issue)game.liveGoals=game.liveGoals.concat(newGoal).slice(-200);
  return issue;
}
function restoreLivePending(){
  try{
    var pending=JSON.parse(sessionStorage.getItem('fda-gol-pendente')||'null');
    if(pending?.user===ui.user&&pending.action?.request)ui.livePending=pending;
  }catch(error){}
}
function retainLivePending(pending){
  ui.livePending=pending;
  try{
    if(pending)sessionStorage.setItem('fda-gol-pendente',JSON.stringify(pending));
    else sessionStorage.removeItem('fda-gol-pendente');
  }catch(error){}
}
async function commitLive(gameId,action){
  if(!canEditUi()||!SB||ui.busy||ui.liveBusy||dirty)return;
  action.request=action.request||crypto.randomUUID();
  ui.liveBusy=true;ui.liveError='';
  retainLivePending({game:gameId,action:action,user:ui.user});
  render();
  try{
    for(var attempt=0;attempt<4;attempt++){
      var result=await fetchRow();
      if(result.error||!result.data?.dados)throw Error('read');
      var row=result.data,raw=row.dados,base=raw.history.find(function(g){return g.id===gameId;});
      if(!base){
        ui.liveError='Partida não encontrada.';retainLivePending(null);return;
      }
      var game=normGame(base);
      if(!game.liveOps.includes(action.request)){
        var issue=applyLiveAction(raw,game,action);
        if(issue){
          S=normalize(raw);S.savedAt=rowVersion=row.versao;
          ui.liveError=issue;retainLivePending(null);return;
        }
        var patch={live:game.live,placar:game.placar,stats:game.stats,cob:game.cob,sumula:game.sumula,
          liveGoals:game.liveGoals,liveOps:game.liveOps.concat(action.request).slice(-200)};
        Object.assign(base,patch);
        var write=await writeState(raw,row.versao);
        if(write.error)throw Error('write');
        if(!write.data?.length)continue;
        row.versao=write.data[0].versao;
      }
      S=normalize(raw);S.savedAt=rowVersion=row.versao;
      retainLivePending(null);return;
    }
  }catch(error){
    // O identificador fica disponível para repetir um envio cujo retorno se perdeu.
  }finally{
    if(ui.livePending)ui.liveError='Não foi possível confirmar o envio. Tente novamente para conferir.';
    ui.liveBusy=false;render();
  }
}

var STAT_FIELDS=[['g','Gols',30],['og','Gols contra',30],['pen','Gols de pênalti',30],['fal','Gols de falta',30],['a','Assistências',30],['y','Amarelos',2],['r','Vermelhos',1]];
function applyMatchForm(form){
  var game=findGame(form.dataset.game),data=new FormData(form),day=validDay(data.get('date')),field=data.get('field');
  if(!game||game.live||!day||!(field===''||fieldById(field)))return;
  if(S.history.some(function(item){return item!==game&&dateBR(item.date)===day;})){toast('Já existe uma partida nessa data.');return;}
  var red=data.get('v'),green=data.get('g');
  if((red==='')!==(green==='')){toast('Preencha os gols dos dois lados.');return;}
  if(day!==dateBR(game.date))game.date=new Date(day+'T12:00:00-03:00').getTime();
  game.campo=field;
  game.placar=red===''?null:{v:cnum(red,50),g:cnum(green,50)};lockLiveGoals(game);
  game.sumula=true;
  S.history.sort(function(a,b){return b.date-a.date;});
  change();
}
function applyPlayerStats(form){
  var game=findGame(form.dataset.game),id=form.dataset.player;
  if(!game||game.live||!gameRoster(game).includes(id))return;
  var values=new FormData(form),stats={},previous=game.stats[id]||{};
  STAT_FIELDS.forEach(function([key,,max]){stats[key]=cnum(values.get(key),max);});
  if(stats.pen+stats.fal>stats.g){toast('Os gols de pênalti e de falta precisam caber no total de gols.');return;}
  var delta=stats.g-Number(previous.g||0),ownDelta=stats.og-Number(previous.og||0),team=gameTeamIndex(game,id);
  if((delta||ownDelta)&&team>=0&&team<2){
    var score=game.placar||scoreFromStats(game),side=team===0?'v':'g',opponent=side==='v'?'g':'v';
    var next=score[side]+delta,other=score[opponent]+ownDelta;
    if(next<0||next>50||other<0||other>50){toast('Confira o placar antes de ajustar os gols deste atleta.');return;}
    game.placar=Object.assign({},score,{[side]:next,[opponent]:other});lockLiveGoals(game);
  }
  if(stats.pen!==Number(previous.pen||0)||stats.fal!==Number(previous.fal||0))lockLiveGoals(game);
  STAT_FIELDS.forEach(function([key]){if(stats[key]!==Number(previous[key]||0))markCob(game,key);});
  if(stats.g||stats.og||stats.a||stats.y||stats.r)game.stats[id]=stats;else delete game.stats[id];
  game.sumula=true;change();
  if((delta||ownDelta)&&(team<0||team>1))toast('Os gols foram registrados no perfil. Informe o time na súmula para vinculá-los ao placar.');
}
function viewJogos(){
  if(canEditUi()&&ui.livePanel){
    var match=findGame(ui.livePanel);
    if(match)return livePanelHTML(match);
  }
  if(!S.history.length&&canEditUi())return rodadaForm()+'<p class="empty">Nenhuma rodada registrada ainda.</p>'+sumImportHTML()+histImportHTML();
  if(!S.history.length)return '<p class="empty">Nenhuma pelada salva ainda. Sorteie os times e toque em <strong>Confirmar e salvar</strong>. Depois é aqui que você lança gols, assistências, cartões, bola cheia e bola murcha.</p>';
  var h='',ed=canEditUi(),lastM=null;
  if(ed)h+=rodadaForm();
  S.history.forEach(function(g){
    var gm=dateBR(g.date).slice(0,7);if(gm!==lastM){lastM=gm;var ms=monthStandings(gm);h+='<h2 class="mes-h">'+monthLabel(gm,true)+(ms.jogos?'<small class="mes-sc">vitórias no mês: 🔴 '+ms.w[0]+' x '+ms.w[1]+' 🟢'+(ms.e?' · '+ms.e+' empate'+(ms.e>1?'s':''):'')+'</small>':'')+'</h2>';}
    var d=new Date(g.date).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit',year:'2-digit',timeZone:'America/Sao_Paulo'});
    var open=ui.editGame===g.id&&!g.live,sm=gameSummary(g),scoreGoals=g.placar?g.placar.v+g.placar.g:sm.g;
    var gf=g.campo&&fieldById(g.campo);
    h+='<section class="card hist'+(open?' open':'')+'"><div class="row-between"><h3>'+esc(d)+(gf?'<small class="gcampo">📍 '+esc(gf.name.replace(/^Campo d[oa] /,''))+'</small>':'')+'</h3>'+(ed?'<button type="button" class="del'+(ui.confirmDel===g.id?' sure':'')+'" data-act="delHist" data-id="'+g.id+'" aria-label="Apagar pelada">'+(ui.confirmDel===g.id?'Apagar?':'✕')+'</button>':'')+'</div>';
    if(g.placar)h+=scoreboardHTML(g);
    if(ed)h+='<div class="btnrow"><button class="btn'+(g.live?' primary':'')+'" type="button" data-act="liveOpen" data-id="'+esc(g.id)+'">'+(g.live?'Registrar gol ao vivo':'Placar ao vivo')+'</button></div>';
    if(g.obs&&!open)h+='<p class="obs">📝 '+esc(g.obs).replace(/\n/g,'<br>')+'</p>';
    if(ed&&g.juri&&g.juri.final&&g.juri.votos.length&&!open)h+='<details class="vres"><summary>Apuração ('+g.juri.votos.length+' votos)</summary>'+apurHTML(g,'cheia','Bola cheia (craque)',false)+apurHTML(g,'murcha','Bola murcha',false)+'</details>';
    var ros=gameRoster(g);
    if(g.cheia||g.murcha||sm.g||sm.a||ros.length||g.adv){
      h+='<div class="gsum">';
      if(g.cheia)h+='<span class="tag cheia">Bola cheia (craque): '+nameLink(personOf(g,g.cheia),rid(g,g.cheia))+'</span>';
      if(g.murcha)h+='<span class="tag murcha">Bola murcha: '+nameLink(personOf(g,g.murcha),rid(g,g.murcha))+'</span>';
      if(ros.length){if(g.cob.g)h+='<span class="tag">'+scoreGoals+' gol'+(scoreGoals===1?'':'s')+(g.cob.a&&sm.a?', '+sm.a+' assist.':'')+(g.cob.c&&sm.y+sm.r?', '+(sm.y+sm.r)+' cart.':'')+'</span>';else h+='<span class="tag unk">Gols não registrados</span>';}
      if(g.adv)h+='<span class="tag">contra '+esc(g.adv)+'</span>';
      h+='</div>';
    }
    if(!open){
      if(ros.length&&!g.cob.e)h+='<p class="hint">Escalação completa sem registro.</p>';
      h+='<div class="hteams">';
      g.teams.forEach(function(t,i){if(!t.length)return;var col=TNc(g,i);h+='<div class="hteam" style="--bib:'+col.c+'"><strong>'+col.n+'</strong> '+t.map(function(id){var s=statLine(g.stats[id]);return nameLink(personOf(g,id),rid(g,id))+(s?' <span class="sl">'+s+'</span>':'');}).join(', ')+'</div>';});
      if(g.sem.length)h+='<div class="hteam" style="--bib:#475569"><strong>Sem time informado</strong> '+g.sem.map(function(id){var s=statLine(g.stats[id]);return nameLink(personOf(g,id),rid(g,id))+(s?' <span class="sl">'+s+'</span>':'');}).join(', ')+'</div>';
      h+='</div>';
      if(ed&&!g.live)h+='<button type="button" class="btn sm" data-act="editGame" data-id="'+g.id+'" style="margin-top:10px">'+(g.sumula||sm.g||g.cheia?'Editar súmula':'Lançar súmula')+'</button>';
    }else{
      h+=voicePanel(g);
      var pv=g.placar||{v:'',g:''};
      h+='<form class="placar-ed admin-form" data-form="match" data-game="'+esc(g.id)+'"><h4>Dados da partida</h4>'+
        '<div class="grid2"><label class="field">Data<input name="date" type="date" required value="'+dateBR(g.date)+'"></label>'+
        '<label class="field">Campo<select name="field"><option value="">Sem registro</option>'+fieldOptions(g.campo)+'</select></label></div>'+
        '<div class="grid2">'+[[0,'v'],[1,'g']].map(function([team,key]){
          return '<label class="field">Gols · '+esc(TNc(g,team).n)+'<input name="'+key+'" type="number" min="0" max="50" inputmode="numeric" value="'+pv[key]+'"></label>';
        }).join('')+'</div><div class="btnrow"><button class="btn primary sm" type="submit">Aplicar dados da partida</button>'+
        (g.placar?'<button class="btn sm" type="button" data-act="placarClear" data-g="'+esc(g.id)+'">Limpar placar</button>':'')+'</div></form>';
      h+='<label class="field"><span>Sem placar? Resultado</span><select data-act="vencedor" data-g="'+g.id+'"><option value=""'+(g.valida&&g.vencedor===null?' selected':'')+'>Usar o placar acima</option><option value="0"'+(g.valida&&g.vencedor===0?' selected':'')+'>'+TNc(g,0).e+' '+TNc(g,0).n+' venceu</option><option value="1"'+(g.valida&&g.vencedor===1?' selected':'')+'>'+TNc(g,1).e+' '+TNc(g,1).n+' venceu</option><option value="-1"'+(g.valida&&g.vencedor===-1?' selected':'')+'>Empate</option><option value="nv"'+(!g.valida?' selected':'')+'>⚪ Passeio: não valeu</option></select></label>';
      h+='<label class="field"><span>Adversário (deixe vazio se foi Vermelho x Verde)</span><input type="text" maxlength="40" data-act="adv" data-g="'+g.id+'" value="'+esc(g.adv||'')+'" placeholder="Ex.: Time do Bairro"></label>';
      h+=cobHTML(g);
      h+='<p class="hint">Toque no jogador para lançar gols, pênaltis, faltas, assistências e cartões.</p>';
      g.teams.concat(g.sem.length?[g.sem]:[]).forEach(function(t,i){
        if(!t.length&&g.adv&&i===1)return;
        var col=i<g.teams.length?TNc(g,i):{c:'#475569',n:'Sem time informado'};
        h+='<div class="steam" style="--bib:'+col.c+'"><div class="steam-h">'+esc(col.n)+'</div>';
        t.forEach(function(id){
          var s=g.stats[id]||{g:0,a:0,y:0,r:0,pen:0,fal:0},p=personOf(g,id),sel=ui.editPlayer===id;
          h+='<button type="button" class="srow'+(sel?' sel':'')+'" data-act="editPlayer" data-id="'+id+'" aria-expanded="'+sel+'">'+avatar(p,32)+'<span class="nm">'+esc(p.name)+'</span><span class="sl">'+statLine(s)+'</span></button>';
          if(sel){
            h+='<form class="spanel" data-form="stats" data-game="'+esc(g.id)+'" data-player="'+esc(id)+'"><div class="grid2">'+STAT_FIELDS.map(function([key,label,max]){
              return '<label class="field">'+label+'<input name="'+key+'" required type="number" inputmode="numeric" min="0" max="'+max+'" value="'+(s[key]||0)+'"></label>';
            }).join('')+'</div><div class="btnrow"><button type="submit" class="btn primary sm">Aplicar números</button>'+
            '<button type="button" class="btn sm danger" data-act="gDelP" data-g="'+esc(g.id)+'" data-id="'+esc(id)+'">Remover da rodada</button></div></form>';
          }
        });
        h+='</div>';
      });
      h+=addPlayerHTML(g);
      var poolIds=gameRoster(g);if(!poolIds.length)poolIds=S.players.map(function(p){return p.id;}).sort(function(a,b){return gameName(g,a).localeCompare(gameName(g,b),'pt-BR');});
      [g.cheia,g.murcha].forEach(function(x){if(x&&poolIds.indexOf(x)<0&&poolIds.indexOf(rid(g,x))<0)poolIds.unshift(x);});
      var opts=function(cur){var o='<option value="">Ninguém</option>';poolIds.forEach(function(id){o+='<option value="'+id+'"'+(cur===id||rid(g,cur||'')===id?' selected':'')+'>'+esc(gameName(g,id))+'</option>';});return o;};
      h+='<div class="setting"><span>🏆 Bola cheia</span><select data-act="cheia" data-g="'+g.id+'">'+opts(g.cheia)+'</select></div>';
      h+='<div class="setting"><span>🎈 Bola murcha</span><select data-act="murcha" data-g="'+g.id+'">'+opts(g.murcha)+'</select></div>';
      h+='<label class="field"><span>📝 Notas da partida</span><textarea rows="4" maxlength="2000" data-act="obs" data-g="'+g.id+'" placeholder="Como foi o jogo, lances marcantes, lesões, recados…">'+esc(g.obs||'')+'</textarea></label>';
      h+='<div class="btnrow"><button type="button" class="btn primary" data-act="closeGame" data-id="'+g.id+'">Concluir súmula</button></div>';
    }
    h+='</section>';
  });
  if(ed)h+=sumImportHTML()+histImportHTML();
  if(ed)h+='<button type="button" class="btn danger'+(ui.confirmClear?' sure':'')+'" data-act="clearHist">'+(ui.confirmClear?'Toque de novo para apagar tudo':'Apagar todo o histórico')+'</button>';
  return h;
}
function gamesInPeriod(){
  var now=new Date();
  return S.history.filter(function(g){if(ui.period==='all')return true;var d=new Date(g.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
}
/* ===== MODELO DE DADOS v2 ===== */
var COBK=[['e','Escalação'],['g','Gols'],['o','Gols contra'],['a','Assistências'],['p','Gols de pênalti'],['f','Gols de falta'],['c','Cartões']];
/* nome/cor do lado i da partida (jogo contra adversário: lado 0 = Futebol dos Amigos) */
function TNc(g,i){if(g.adv)return i===0?{n:'Futebol dos Amigos',c:'#00E676',t:'#03140b',e:'🟢'}:{n:g.adv,c:'#64748B',t:'#fff',e:'⚪'};return COLORS[i%COLORS.length];}
function markCob(g,k){
  g.cob[{pen:'p',fal:'f',og:'o',y:'c',r:'c'}[k]||k]=true;
  if(k==='pen'||k==='fal')g.cob.g=true;
}
function gameRoster(g){var o=[];g.teams.forEach(function(t){t.forEach(function(id){o.push(id);});});g.sem.forEach(function(id){o.push(id);});return o;}
function rosterGames(games){return games.filter(function(g){return g.cob.e&&gameRoster(g).length;}).length;}
/* Estatísticas: cada número só considera as partidas em que aquele dado foi REGISTRADO.
   jG/jA/jP/jF/jC = quantas partidas do atleta têm gols/assist./pênaltis/faltas/cartões registrados (base das médias). */
function aggregate(games){
  var A={};
  var mk=function(k,p){return A[k]||(A[k]={id:k,p:p,j:0,g:0,og:0,a:0,y:0,r:0,c:0,m:0,pen:0,fal:0,w:0,e:0,l:0,jp:0,jG:0,jA:0,jP:0,jF:0,jO:0,jC:0});};
  games.forEach(function(g){
    var inT={};g.teams.forEach(function(t){t.forEach(function(id){inT[id]=1;});});
    var ros=gameRoster(g),inR={};ros.forEach(function(id){inR[id]=1;});
    ['cheia','murcha'].forEach(function(tp){var id0=g[tp];if(id0&&!inR[id0]){var k=rid(g,id0);mk(k,personOf(g,id0))[tp==='cheia'?'c':'m']++;}});
    ros.forEach(function(id){
      var x=mk(rid(g,id),personOf(g,id)),s=g.stats[id]||null;
      if(g.cob.e)x.j++;
      if(g.cob.g){x.jG++;if(s)x.g+=s.g;}
      if(g.cob.o){x.jO++;if(s)x.og+=s.og||0;}
      if(g.cob.a){x.jA++;if(s)x.a+=s.a;}
      if(g.cob.p){x.jP++;if(s)x.pen+=s.pen||0;}
      if(g.cob.f){x.jF++;if(s)x.fal+=s.fal||0;}
      if(g.cob.c){x.jC++;if(s){x.y+=s.y;x.r+=s.r;}}
      var wn=winner(g);if(wn!==null&&inT[id]){x.jp++;if(wn===-1)x.e++;else if(g.teams[wn].indexOf(id)>=0)x.w++;else x.l++;}
      if(g.cheia===id)x.c++;if(g.murcha===id)x.m++;
    });
  });
  return Object.keys(A).map(function(k){return A[k];});
}
function avgG(x){return x.jG>0?x.g/x.jG:null;}
function pctPres(x,pe){return pe>0?Math.round(x.j/pe*100):null;}
function top(list,key,n){
  return list.filter(function(x){return key(x)>0;}).sort(function(a,b){return (key(b)-key(a))||(a.j-b.j)||a.p.name.localeCompare(b.p.name,'pt-BR');}).slice(0,n);
}
function monthStandings(k){var w=[0,0],e=0,j=0,gols=[0,0];S.history.forEach(function(g){if(dateBR(g.date).slice(0,7)!==k||g.adv)return;var wn=winner(g);if(wn===null)return;j++;if(g.placar){gols[0]+=g.placar.v;gols[1]+=g.placar.g;}if(wn===-1)e++;else w[wn]++;});
  var m=S.meses[k],man=m&&(m.campeao===0||m.campeao===1)?m.campeao:null,lead=w[0]>w[1]?0:w[1]>w[0]?1:null;
  return {w:w,e:e,jogos:j,gols:gols,campeao:man!==null?man:(monthEnded(k)?lead:null),lider:lead,manual:man!==null};}
function campeoesHTML(ed){
  var ks=Object.keys(S.meses);S.history.forEach(function(g){var k=dateBR(g.date).slice(0,7);if(ks.indexOf(k)<0)ks.push(k);});
  ks.sort().reverse();
  var cur=curMonthKey(),h='<section class="card board"><h2>👑 Campeões do mês</h2>';
  var cs=monthStandings(cur);
  h+='<div class="mes-now"><p class="apur-t">'+monthLabel(cur,true)+' (em andamento)</p><div class="vs"><div style="--bib:'+COLORS[0].c+'"><strong>'+cs.w[0]+'</strong><span>vitórias do Vermelho</span></div><div class="vs-e"><strong>'+cs.e+'</strong><span>empates</span></div><div style="--bib:'+COLORS[1].c+'"><strong>'+cs.w[1]+'</strong><span>vitórias do Verde</span></div></div>'+
    '<p class="hint center">'+(cs.jogos?(cs.lider===null?'Mês empatado até agora.':'Líder: '+COLORS[cs.lider].e+' '+COLORS[cs.lider].n):'Nenhum placar lançado no mês ainda.')+'</p></div>';
  var past=ks.filter(function(k){return k!==cur;});
  if(past.length){h+='<ol class="rank camp">';past.forEach(function(k){var s=monthStandings(k),c=s.campeao;
    h+='<li><span class="nm">'+monthLabel(k,true)+(s.jogos?'<small>'+s.w[0]+' x '+s.w[1]+' em vitórias'+(s.e?', '+s.e+' empate'+(s.e>1?'s':''):'')+'</small>':'')+'</span>'+
      (ed?'<select data-act="campeao" data-k="'+k+'" aria-label="Campeão de '+monthLabel(k)+'"><option value="auto"'+(!s.manual?' selected':'')+'>Automático'+(s.lider!==null&&!s.manual?' ('+COLORS[s.lider].n+')':'')+'</option><option value="0"'+(s.manual&&c===0?' selected':'')+'>🔴 Vermelho</option><option value="1"'+(s.manual&&c===1?' selected':'')+'>🟢 Verde</option></select>':
      '<span class="champ">'+(c===null?'—':COLORS[c].e+' '+COLORS[c].n)+'</span>')+'</li>';});h+='</ol>';}
  if(ed)h+='<details class="addmes"><summary>Registrar campeão de um mês anterior</summary><div class="grid2"><label class="field"><span>Mês</span><input type="month" id="campMes" max="'+cur+'"></label><label class="field"><span>Campeão</span><select id="campTime"><option value="0">🔴 Vermelho</option><option value="1">🟢 Verde</option></select></label></div><button type="button" class="btn" data-act="campAdd">Salvar campeão</button></details>';
  return h+'</section>';
}
/* ===== RANKING: placar eletrônico, cards colecionáveis, retrospecto e pódio ===== */
function lastPlacarGame(includeAway){
  return S.history.find(function(game){return game.placar&&game.live;})||
    S.history.find(function(game){return game.placar&&(includeAway||!game.adv);})||null;
}
function lastAwardGame(){return S.history.find(function(game){return !game.live&&(game.cheia||game.murcha);})||null;}
function scoreboardHTML(g){
  var w=winner(g),sc=[g.placar.v,g.placar.g],order=(w===1)?[1,0]:[0,1];
  var d=new Date(g.date).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit',timeZone:'America/Sao_Paulo'}),gf=g.campo&&fieldById(g.campo);
  var labels=g.adv?[S.info.name,g.adv]:[COLORS[0].n,COLORS[1].n];
  var side=function(i){return '<div class="sbd-t'+(w===i?' win':'')+'" style="--bib:'+COLORS[i].c+'">'+(g.adv?(i===0?'<img class="logo" src="'+esc(S.info.logo||'/escudo.png')+'" alt="">':''):teamArt('shield',i))+'<span>'+esc(labels[i])+'</span><b>'+sc[i]+'</b></div>';};
  return '<section class="scoreboard" aria-label="Placar da partida"><div class="sbd-h"><span>Placar</span><span>'+esc(cap(d))+(gf?' · '+esc(gf.name.replace(/^Campo d[oa] /,'')):'')+'</span></div>'+
    '<div class="sbd-m">'+side(order[0])+'<div class="sbd-x">×</div>'+side(order[1])+'</div>'+
    '<div class="sbd-f">'+(g.live?'<span class="game-live">Ao vivo</span>':w===null?'Jogo que não valeu':w===-1?'Empate':'Vitória do <strong>'+esc((g.adv?'':'Time ')+labels[w])+'</strong>')+'</div></section>';
}
function statsTxt(g,id){var s=g.stats&&g.stats[id];if(!s)return '';var o=[];if(s.g)o.push(s.g+(s.g>1?' gols':' gol')+(s.pen?' ('+s.pen+' de pên.)':''));if(s.a)o.push(s.a+(s.a>1?' assistências':' assistência'));return o.join(' • ');}
function whyTxt(kind,g){
  var voice=g.resenha&&g.resenha[kind];
  if(voice&&voice.atleta===g[kind]&&voice.motivo)return voice.motivo;
  var best=null;S.posts.forEach(function(p){if(catOf(p)===kind&&Math.abs(p.date-g.date)<4*864e5&&(!best||Math.abs(p.date-g.date)<Math.abs(best.date-g.date)))best=p;});
  if(best&&best.body){var t=best.body.replace(/\s+/g,' ').trim();return t.length>150?t.slice(0,147).replace(/\s+\S*$/,'')+'…':t;}
  if(g.juri&&g.juri.final&&g.juri.votos.length){
    var tally=apurar(g,kind),votes=tally.c[g[kind]]||0;
    if(votes)return 'A comissão deu '+votes+' de '+g.juri.votos.length+' voto'+(g.juri.votos.length>1?'s':'')+' para este destaque.';
  }
  return '';
}
function collectCard(kind,g){
  var id=g[kind],isC=kind==='cheia';
  if(!id)return '<div class="award '+kind+'"><span class="ribbon">'+(isC?'Craque da rodada':'Bola murcha da rodada')+'</span><span class="al">Ainda não definido</span></div>';
  var p=personOf(g,id),st=statsTxt(g,id),why=whyTxt(kind,g);
  var team=gameTeamIndex(g,id);
  return '<article class="award award-poster '+kind+'"><span class="ribbon">'+(isC?'Craque da rodada':'Bola Murcha')+'</span>'+
    '<div class="poster-art"><div class="poster-athlete">'+avatarBtn(p,88)+teamArt('shirt',team)+'</div>'+clubArt(kind)+'</div>'+
    '<strong>'+nameLink(p,rid(g,id))+'</strong>'+(team>=0&&COLORS[team]?'<span class="stat">Time '+COLORS[team].n+'</span>':'')+
    (st?'<span class="stat">'+esc(st)+'</span>':'')+(why?'<p class="why">'+esc(why)+'</p>':'')+'</article>';
}
function gameTeamIndex(g,id){
  return (g.teams||[]).findIndex(function(team){
    return team.some(function(playerId){return rid(g,playerId)===rid(g,id);});
  });
}
function awardsTV(){
  var game=lastAwardGame();
  var slides=game?['cheia','murcha'].filter(function(kind){return game[kind];}).map(function(kind){return {kind:kind,game:game};}):[];
  if(!slides.length)return '';
  return '<section class="card fda-tv" aria-label="FDA TV"><div class="row-between"><h2>FDA TV</h2>'+
    (slides.length>1?'<div class="tv-controls"><button type="button" class="btn sm" data-act="tv-next">Próximo</button><button type="button" class="btn sm" data-act="tv-pause" aria-pressed="'+!!ui.tvPaused+'">Pausar rotação</button></div>':'')+'</div>'+
    slides.map(function(slide,i){
      var date=new Date(slide.game.date);
      return '<div data-tv-slide'+(i?' hidden':'')+'><time datetime="'+dateBR(date)+'">'+
        esc(date.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}))+'</time>'+collectCard(slide.kind,slide.game)+
        '<button type="button" class="btn sm poster-download" data-act="tv-download" data-g="'+esc(slide.game.id)+'" data-k="'+slide.kind+'">Baixar cartaz</button></div>';
    }).join('')+'</section>';
}
function rotateAwards(){
  var slides=Array.from(document.querySelectorAll('[data-tv-slide]'));
  if(slides.length<2)return;
  var current=slides.findIndex(function(slide){return !slide.hidden;});
  slides.forEach(function(slide,i){slide.hidden=i!==(current+1)%slides.length;});
}
function posterImage(src){
  return new Promise(function(resolve){
    if(!src){resolve(null);return;}
    var img=new Image();
    img.crossOrigin='anonymous';
    img.onload=function(){resolve(img);};
    img.onerror=function(){resolve(null);};
    img.src=src;
  });
}
async function downloadAwardPoster(game,kind){
  if(!game||!['cheia','murcha'].includes(kind)||!game[kind])return;
  var person=personOf(game,game[kind]);
  var team=gameTeamIndex(game,game[kind]);
  var [art,photo,logo]=await Promise.all([prepareClubArt(),posterImage(person.photo),posterImage('/escudo.png')]);
  if(!art?.[kind]){toast('Não consegui carregar o troféu. Tente novamente.');return;}
  var canvas=document.createElement('canvas');
  canvas.width=1080;
  canvas.height=1350;
  var ctx=canvas.getContext('2d');
  if(!ctx){toast('Este navegador não conseguiu montar o cartaz.');return;}
  var gold=kind==='cheia'?'#f3ce78':'#93edb0';
  var background=ctx.createLinearGradient(0,0,1080,1350);
  background.addColorStop(0,'#203328');
  background.addColorStop(1,'#101211');
  ctx.fillStyle=background;
  ctx.fillRect(0,0,1080,1350);
  ctx.strokeStyle=gold;
  ctx.lineWidth=4;
  ctx.strokeRect(28,28,1024,1294);
  if(logo)ctx.drawImage(logo,474,69,132,132);
  ctx.textAlign='center';
  function title(text,size,y,color){
    ctx.font='bold '+size+'px Arial, sans-serif';
    ctx.fillStyle=color;
    ctx.fillText(text,540,y,950);
  }
  title('JORNAL DO FUTEBOL DOS AMIGOS',31,244,'#eef6ee');
  title('EDIÇÃO ESPECIAL DA PELADA',25,286,'#c9d7ce');
  var subject=whyTxt(kind,game),headline=subject?subject.replace(/[.!?]+$/,''):(kind==='cheia'?'Destaque em campo':'A resenha da rodada');
  title(kind==='cheia'?'CRAQUE DA RODADA':'BOLA MURCHA',29,329,gold);
  title(headline.length>77?headline.slice(0,74)+'…':headline,45,387,'#f8faf7');
  var knownKit=team===0||team===1;
  if(knownKit)drawArt(team===0?'shirt-red':'shirt-green',184,650,382);
  var portraitY=knownKit?577:700, radius=knownKit?160:228;
  ctx.save();
  ctx.beginPath();
  ctx.arc(375,portraitY,radius,0,2*Math.PI);
  ctx.clip();
  ctx.fillStyle='#293e30';
  ctx.fillRect(375-radius,portraitY-radius,radius*2,radius*2);
  if(photo){
    var edge=Math.min(photo.naturalWidth,photo.naturalHeight);
    ctx.drawImage(photo,(photo.naturalWidth-edge)/2,(photo.naturalHeight-edge)/2,edge,edge,375-radius,portraitY-radius,radius*2,radius*2);
  }else{
    ctx.fillStyle=gold;
    ctx.font='bold 116px Arial, sans-serif';
    ctx.fillText(person.name.trim().split(/\s+/).slice(0,2).map(function(word){return word.charAt(0).toUpperCase();}).join(''),375,portraitY+38);
  }
  ctx.restore();
  function drawArt(key,x,y,width){
    var image=art[key].canvas;
    ctx.drawImage(image,x,y,width,width*image.height/image.width);
  }
  drawArt(kind,705,462,230);
  ctx.fillStyle='#101b17';ctx.fillRect(44,1087,992,219);
  title(person.name.toLocaleUpperCase('pt-BR'),56,1149,'#f8faf7');
  var bullets=[
    team>=0&&COLORS[team]?'Time '+COLORS[team].n:'Time não registrado',
    statsTxt(game,game[kind])||'Premiação da rodada',
    new Date(game.date).toLocaleDateString('pt-BR')
  ];
  title(bullets.map(function(item){return '• '+item;}).join('     '),25,1203,'#d5e3d8');
  title(game.placar?'VERMELHO '+game.placar.v+' × '+game.placar.g+' VERDE':'PLACAR NÃO REGISTRADO',32,1267,gold);
  downloadCanvas(canvas,'fda-'+kind+'-'+isoDate(new Date(game.date))+'.png');
}
function downloadCanvas(canvas,filename){
  canvas.toBlob(function(blob){
    if(!blob){toast('Não consegui salvar o cartaz.');return;}
    var url=URL.createObjectURL(blob);
    var link=document.createElement('a');
    link.href=url;
    link.download=filename;
    link.click();
    setTimeout(function(){URL.revokeObjectURL(url);},30000);
  });
}
async function downloadPlayerCard(player){
  if(!player)return;
  var teams=monthTeams(quickMonth()),team=teams?teams.findIndex(function(t){return t.includes(player.id);}):-1;
  var assets=await Promise.all([prepareClubArt().catch(function(){return null;}),posterImage(player.photo),posterImage('/escudo.png')]);
  var canvas=document.createElement('canvas');canvas.width=720;canvas.height=1000;
  var ctx=canvas.getContext('2d'),accent=team===0?'#ee777e':'#95eab3',photo=assets[1];
  ctx.fillStyle='#101a18';ctx.fillRect(0,0,720,1000);
  ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.strokeRect(24,24,672,952);
  if(assets[2])ctx.drawImage(assets[2],315,56,90,90);
  ctx.textAlign='center';ctx.fillStyle=accent;ctx.font='700 28px Arial';ctx.fillText('FUTEBOL DOS AMIGOS',360,184);
  if(assets[0]&&(team===0||team===1)){
    var shirt=assets[0][team===0?'shirt-red':'shirt-green'].canvas;
    ctx.drawImage(shirt,222,480,276,276*shirt.height/shirt.width);
  }
  ctx.save();ctx.beginPath();ctx.arc(360,360,147,0,Math.PI*2);ctx.clip();
  ctx.fillStyle='#233a30';ctx.fillRect(213,213,294,294);
  if(photo){
    var edge=Math.min(photo.naturalWidth,photo.naturalHeight);
    ctx.drawImage(photo,(photo.naturalWidth-edge)/2,(photo.naturalHeight-edge)/2,edge,edge,213,213,294,294);
  }else{
    ctx.fillStyle=accent;ctx.font='700 104px Arial';ctx.fillText(player.name.split(/\s+/).slice(0,2).map(function(n){return n[0];}).join('').toUpperCase(),360,390);
  }
  ctx.restore();
  ctx.fillStyle='#f8fbf7';ctx.font='700 49px Arial';ctx.fillText(player.name+(player.num?' #'+player.num:''),360,870,616);
  ctx.fillStyle=accent;ctx.font='700 25px Arial';ctx.fillText((POS.find(function(x){return x[0]===player.pos;})?.[1]||'Atleta')+'  ·  Nota '+fmt(player.stars),360,923,590);
  downloadCanvas(canvas,'fda-atleta-'+player.id.replace(/[^a-z0-9_-]/gi,'')+'.png');
}
/* ===== ESTATÍSTICAS v2: filtros, destaques com regra de "dados suficientes" e empate ===== */
var RK=[['destaques','Destaques'],['artilharia','Artilharia'],['assist','Assistências'],['penalti','Pênaltis'],['falta','Faltas'],['partidas','Partidas'],['presenca','Presença'],['todos','Todos']];
function fmt2(v){return v.toFixed(2).replace('.',',');}
function profileHash(id){return '#atleta='+encodeURIComponent(id);}
function profileFromURL(){return new URLSearchParams(location.hash.slice(1)).get('atleta');}
function nameLink(p,id){var real=id&&byId(id);return real?'<a class="nmb" href="'+profileHash(real.id)+'" data-act="perfil" data-id="'+esc(real.id)+'">'+esc(p.name)+'</a>':esc(p.name);}
window.addEventListener('popstate',function(){ui.perfil=profileFromURL();render();});
function board(title,items,key,unit,extra,emptyMsg){
  var h='<section class="card board"><h2>'+title+'</h2>';
  if(!items.length)return h+'<p class="hint">'+(emptyMsg||'Ninguém ainda.')+'</p></section>';
  h+='<ol class="rank">';
  var prev=null,pos=0;
  items.forEach(function(x,i){var v=key(x);if(v!==prev){pos=i+1;prev=v;}
    h+='<li><span class="rk">'+pos+'º</span>'+avatarBtn(x.p,36,x.id)+'<span class="nm">'+nameLink(x.p,x.id)+(extra?'<small>'+extra(x)+'</small>':'')+'</span><span class="rv">'+v+'<small>'+unit+'</small></span></li>';});
  return h+'</ol></section>';
}
function podiumHTML(agg){
  var t=top(agg,function(x){return x.g;},3);if(!t.length)return '';
  var ranks=[],prev=null,pos=0;t.forEach(function(x,i){if(x.g!==prev){pos=i+1;prev=x.g;}ranks.push(pos);});
  var h='<section class="card podium-card"><h2>Pódio da artilharia</h2><div class="podium">';
  [1,0,2].forEach(function(ix){var x=t[ix];if(!x){h+='<div class="pd pd-empty"></div>';return;}var r=ranks[ix];
    h+='<div class="pd pd-'+Math.min(r,3)+'"><div class="pd-av">'+avatarBtn(x.p,r===1?76:60,x.id)+'</div><b class="pd-n">'+nameLink(x.p,x.id)+'</b><span class="pd-g">'+x.g+'<small>'+(x.g>1?'gols':'gol')+'</small></span><div class="pd-step"><span>'+r+'º</span></div></div>';});
  return h+'</div></section>';
}
/* líderes de um indicador: devolve todos os empatados no topo (nunca escolhe um "líder" no empate) */
function leaders(list,key,min){
  var L=list.map(function(x){return {x:x,v:key(x)};}).filter(function(o){return o.v!==null&&isFinite(o.v)&&o.v>=min&&o.v>0;});
  if(!L.length)return null;
  var mx=Math.max.apply(null,L.map(function(o){return Math.round(o.v*1000);}))/1000;
  var w=L.filter(function(o){return Math.round(o.v*1000)/1000===mx;}).map(function(o){return o.x;}).sort(function(a,b){return a.p.name.localeCompare(b.p.name,'pt-BR');});
  return {v:mx,w:w};
}
function destaquesList(agg,games){
  var pe=rosterGames(games),gCov=games.filter(function(g){return g.cob.g&&gameRoster(g).length;}).length;
  return [
    ['⚽','Artilheiro',leaders(agg,function(x){return x.g;},1),function(v){return v;},'gols'],
    ['👟','Líder em assistências',leaders(agg,function(x){return x.a;},1),function(v){return v;},'assist.'],
    ['📈','Maior média de gols',gCov>=3?leaders(agg.filter(function(x){return x.jG>=3;}),avgG,0.01):null,fmt2,'gol/jogo'],
    ['🎯','Mais gols de pênalti',leaders(agg,function(x){return x.pen;},1),function(v){return v;},'pênaltis'],
    ['🌀','Mais gols de falta',leaders(agg,function(x){return x.fal;},1),function(v){return v;},'de falta'],
    ['🏟️','Mais partidas',pe>=3?leaders(agg,function(x){return x.j;},3):null,function(v){return v;},'jogos'],
    ['📅','Maior presença',pe>=4?leaders(agg.filter(function(x){return x.j>=1;}),function(x){return pctPres(x,pe);},1):null,function(v){return v;},'%']
  ].filter(function(c){return c[2];});
}
function dstHTML(agg,games){
  var C=destaquesList(agg,games);
  if(!C.length)return '<section class="card"><h2>Destaques</h2><p class="hint">Ainda não há dados suficientes para destaques. Eles aparecem conforme a diretoria registra gols, assistências e escalações.</p>'+dstRules()+'</section>';
  var h='<h2 class="sec-h2">Destaques</h2><div class="dst-grid">';
  C.forEach(function(c,i){
    var L=c[2],w=L.w,many=w.length>1,nm;
    if(w.length<=3)nm=w.map(function(x){return nameLink(x.p,x.id);}).join(' e ');else nm='Empate entre '+w.length+' atletas';
    h+='<div class="dst'+(i===0?' first':'')+'"><span class="dst-i" aria-hidden="true">'+c[0]+'</span><small>'+c[1]+'</small><b class="dst-v">'+c[3](L.v)+'<em>'+c[4]+'</em></b>'+(many?'<span class="dst-t">Empate</span>':'')+'<div class="dst-n">'+nm+'</div></div>';
  });
  return h+'</div>'+dstRules();
}
function dstRules(){return '<details class="rules-d"><summary>Quando um destaque aparece?</summary><ul><li>Artilheiro, assistências, pênaltis e faltas: a partir de 1.</li><li>Maior média de gols: mínimo de 3 partidas com gols registrados.</li><li>Mais partidas: mínimo de 3 partidas com escalação registrada.</li><li>Maior presença: mínimo de 4 partidas com escalação registrada.</li><li>Em caso de empate, aparecem todos os empatados (nunca um "líder" sorteado).</li><li>Partidas sem registro ficam fora do cálculo e <strong>nunca</strong> contam como zero.</li></ul></details>';}
function unkNote(games,k,label){
  var t=games.length,n=games.filter(function(g){return !g.cob[k];}).length;
  if(!n)return '';
  if(n===t)return '<p class="unkn" role="note">Ainda não há '+label+' registrados neste período.</p>';
  return '<p class="unkn" role="note">⚠ Em <b>'+n+' de '+t+'</b> partidas os dados de '+label+' não foram registrados. Elas ficam fora do cálculo, não contam como zero.</p>';
}
/* ===== PERFIL DO ATLETA ===== */
function gameProfileId(game,profile){
  var roster=gameRoster(game);
  return roster.includes(profile)?profile:roster.find(function(id){return rid(game,id)===profile;});
}
function playerGameLine(g,id){
  id=gameProfileId(g,id)||id;
  var ti=-1;g.teams.forEach(function(t,i){if(t.indexOf(id)>=0)ti=i;});
  var w=winner(g),res='';
  if(g.valida===false)res='<span class="pg-r n" title="Passeio">—</span>';
  else if(ti>=0&&w!==null)res=w===-1?'<span class="pg-r e">E</span>':(w===ti?'<span class="pg-r v">V</span>':'<span class="pg-r d">D</span>');
  else res='<span class="pg-r n" title="Resultado sem registro">—</span>';
  var s=g.stats[id]||null,bits=[];
  if(!g.cob.g&&!g.cob.a&&!g.cob.o)bits.push('<span class="tag unk">sem súmula</span>');
  else{if(g.cob.g)bits.push('<span class="tag">⚽ '+(s?s.g:0)+'</span>');if(g.cob.a&&s&&s.a)bits.push('<span class="tag">👟 '+s.a+'</span>');if(g.cob.p&&s&&s.pen)bits.push('<span class="tag">🎯 '+s.pen+'</span>');if(g.cob.f&&s&&s.fal)bits.push('<span class="tag">🌀 '+s.fal+'</span>');if(g.cob.c&&s&&(s.y||s.r))bits.push('<span class="tag">'+(s.y?'🟨'+(s.y>1?s.y:''):'')+(s.r?'🟥':'')+'</span>');}
  if(s?.og)bits.push('<span class="tag">'+s.og+(s.og===1?' gol contra':' gols contra')+'</span>');
  if(g.cheia===id)bits.push('<span class="tag cheia">craque</span>');if(g.murcha===id)bits.push('<span class="tag murcha">murcha</span>');
  var ds=dateBR(g.date).slice(2).split('-').reverse().join('/');
  return '<li>'+res+'<span class="pg-d">'+ds+(g.adv?'<small>vs '+esc(g.adv)+'</small>':'')+'</span><span class="pg-t">'+bits.join('')+'</span></li>';
}
function tile(label,val,sub,cls){return '<div class="pf-t'+(cls?' '+cls:'')+'"><small>'+label+'</small><b>'+val+'</b><span>'+sub+'</span></div>';}
function quickMonth(){
  return ui.tab==='sorteio'&&ui.sortMes&&monthTeams(ui.sortMes)?ui.sortMes:
    curMonthKey();
}
function quickPlayer(p){
  var month=quickMonth(),teams=monthTeams(month),index=teams?teams.findIndex(function(team){return team.includes(p.id);}):-1;
  return '<div class="quick-fields"><label class="field">Nome<input data-act="rename" data-id="'+esc(p.id)+'" value="'+esc(p.name)+'" maxlength="30"></label>'+
    '<label class="field">Nota<input type="number" min="0.5" max="5" step="0.5" data-act="quickRating" data-id="'+esc(p.id)+'" value="'+p.stars+'"></label>'+
    '<label class="field">Posição<select data-act="pos" data-id="'+esc(p.id)+'">'+POS.map(function(x){return '<option value="'+x[0]+'"'+(x[0]===p.pos?' selected':'')+'>'+esc(x[1])+'</option>';}).join('')+'</select></label>'+
    (teams?'<label class="field">Time de '+esc(monthName(month))+'<select data-act="quickTeam" data-month="'+month+'" data-id="'+esc(p.id)+'">'+
      '<option value="-1" disabled'+(index===-1?' selected':'')+'>Sem time</option>'+teams.map(function(_,i){return '<option value="'+i+'"'+(i===index?' selected':'')+'>'+COLORS[i%COLORS.length].n+'</option>';}).join('')+'</select></label>':'')+'</div>';
}
function quickTeamMove(id,month,target){
  if(!canEditUi()||!byId(id)||!Number.isInteger(target))return;
  var record=S.meses[month];
  if(!record||!record.teams[target]||record.teams[target].includes(id))return;
  if(record.teams.some(function(t){return t.length===1&&t.includes(id);})){toast('Cada time precisa manter pelo menos um atleta.');return;}
  record.teams=record.teams.map(function(team){return team.filter(function(pid){return pid!==id;});});
  record.teams[target].push(id);
  if(record.titulares)record.titulares=record.titulares.map(function(team){return team.filter(function(pid){return pid!==id;});});
  if(S.current&&S.current.confirmed&&S.current.month===month)S.current.teams=record.teams.map(function(team){return team.slice();});
  change();
}
function quickAdmin(){
  var player=byId(ui.quickPlayer);
  return '<section class="card quick-admin"><div class="btnrow"><button type="button" class="btn sm" data-act="inlineRoster" aria-expanded="'+!!ui.inlineRoster+'">Editar jogador</button>'+
    '<button type="button" class="btn sm" data-act="tab" data-tab="elenco">Cadastro de atletas</button><button type="button" class="btn sm" data-act="tab" data-tab="jogos">Lançar resultado</button>'+
    '<button type="button" class="btn sm" data-act="inlineNotice">Editar avisos</button></div>'+
    (ui.inlineRoster?'<label class="field">Atleta<select data-act="quickPick"><option value="">Selecione</option>'+S.players.slice().sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR');}).map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===ui.quickPlayer?' selected':'')+'>'+esc(p.name)+'</option>';}).join('')+'</select></label>'+(player?quickPlayer(player):''):'')+'</section>';
}
function viewPerfil(id){
  var p=byId(id);
  if(!p)return '<p class="empty">Atleta não encontrado.</p><button type="button" class="btn wide" data-act="perfilBack">← Voltar</button>';
  var all=S.history,x=aggregate(all).filter(function(a){return a.id===id;})[0]||{j:0,g:0,og:0,a:0,y:0,r:0,c:0,m:0,pen:0,fal:0,w:0,e:0,l:0,jp:0,jG:0,jA:0,jP:0,jF:0,jO:0,jC:0};
  var pe=rosterGames(all),pc=pctPres(x,pe),av=avgG(x);
  var un='—',sem='sem registro';
  var h='<div class="btnrow"><button type="button" class="btn sm" data-act="perfilBack">← Voltar</button><button type="button" class="btn sm" data-act="playerCard" data-id="'+esc(p.id)+'">Baixar card do atleta</button></div>'+
    (canEditUi()?quickPlayer(p):'');
  var confirmed=monthTeams(curMonthKey());
  var currentTeam=confirmed?confirmed.findIndex(function(t){return t.indexOf(id)>=0;}):-1;
  h+='<section class="pf-head"><div class="pf-av">'+avatarBtn(p,104)+'</div><div class="pf-id"><h2>'+esc(p.name)+'</h2><div class="pf-meta">'+(p.pos?pbHTML(p.pos)+'<span>'+POS.filter(function(o){return o[0]===p.pos;})[0][1]+'</span>':'<span>Posição não informada</span>')+(p.num?'<span class="pf-num">#'+p.num+'</span>':'')+'</div>'+teamArt('shirt',currentTeam)+(canEditUi()?'<span class="rating">★ '+fmt(p.stars)+' · avaliação técnica</span>':'')+'</div>'+
    (pc!==null?'<div class="ring" style="--p:'+pc+'" role="img" aria-label="Participação '+pc+'%"><b>'+pc+'%</b><span>participação</span></div>':'<div class="ring none"><b>—</b><span>participação</span></div>')+'</section>';
  h+='<div class="pf-grid">'+
    tile('Jogos',pe?x.j:un,pe?('de '+pe+' com escalação'):sem)+
    tile('Gols',x.jG?x.g:un,x.jG?('em '+x.jG+' jogo'+(x.jG>1?'s':'')+' com gols registrados'):sem,x.jG&&x.g?'hl':'')+
    tile('Gols contra',x.jO?x.og:un,x.jO?('em '+x.jO+' jogo'+(x.jO>1?'s':'')+' com registro'):sem)+
    tile('Média de gols',av!==null?fmt2(av):un,av!==null?'gol por jogo':sem)+
    tile('Assistências',x.jA?x.a:un,x.jA?('em '+x.jA+' jogo'+(x.jA>1?'s':'')):sem)+
    tile('Gols de pênalti',x.jP?x.pen:un,x.jP?('em '+x.jP+' jogo'+(x.jP>1?'s':'')):sem)+
    tile('Gols de falta',x.jF?x.fal:un,x.jF?('em '+x.jF+' jogo'+(x.jF>1?'s':'')):sem)+
    tile('Cartões',x.jC?(x.y+' 🟨 '+x.r+' 🟥'):un,x.jC?('em '+x.jC+' jogo'+(x.jC>1?'s':'')):sem)+
    tile('Craque / Murcha',x.c+' · '+x.m,'bola cheia · bola murcha')+
    tile('Vitórias',x.jp?x.w:un,x.jp?('em '+x.jp+' jogo'+(x.jp>1?'s':'')+' com resultado'):sem)+
  '</div>';
  /* gráfico leve: gols nos últimos jogos em que a atleta jogou e os gols foram registrados */
  var rec=all.filter(function(g){return g.cob.g&&gameProfileId(g,id);}).slice(0,10).reverse();
  if(rec.length>=2){var mx=Math.max(1,Math.max.apply(null,rec.map(function(g){return (g.stats[gameProfileId(g,id)]||{g:0}).g;})));
    h+='<section class="card"><h2>Gols por jogo</h2><p class="hint" style="margin-top:-4px">Últimos '+rec.length+' jogos com gols registrados</p><div class="spark" role="img" aria-label="Gols por jogo nas últimas '+rec.length+' partidas">'+rec.map(function(g){var n=(g.stats[gameProfileId(g,id)]||{g:0}).g,d=new Date(g.date);return '<div class="sp"><i style="height:'+Math.round(n/mx*100)+'%"></i><b>'+n+'</b><small>'+p2(d.getDate())+'/'+p2(d.getMonth()+1)+'</small></div>';}).join('')+'</div></section>';}
  var honors=all.filter(function(g){return (g.cheia&&rid(g,g.cheia)===id)||(g.murcha&&rid(g,g.murcha)===id);});
  if(honors.length)h+='<section class="card"><h2>Premiações</h2><div class="awards">'+honors.map(function(g){
    var kind=g.cheia&&rid(g,g.cheia)===id?'cheia':'murcha';
    return '<div><time datetime="'+isoDate(new Date(g.date))+'">'+esc(new Date(g.date).toLocaleDateString('pt-BR'))+'</time>'+collectCard(kind,g)+'</div>';
  }).join('')+'</div></section>';
  var mine=all.filter(function(g){return gameProfileId(g,id);}).slice(0,12);
  h+='<section class="card"><h2>Últimas partidas</h2>'+(mine.length?'<ul class="pg-l">'+mine.map(function(g){return playerGameLine(g,id);}).join('')+'</ul>':'<p class="hint">Nenhuma partida com escalação registrada.</p>')+'</section>';
  if(x.jG<x.j||pe<all.length)h+='<p class="unkn" role="note">Os números consideram só as partidas em que cada dado foi registrado. Onde aparece "—" ou "sem registro", a informação ainda não existe (não é zero).</p>';
  return h;
}

function viewRanking(){
  if(!S.history.length)return campeoesHTML(canEditUi())+'<p class="empty">O ranking de jogadores aparece depois da primeira rodada registrada.</p>';
  var f=RK.some(function(k){return k[0]===ui.rkf;})?ui.rkf:'destaques',show=function(k){return f==='todos'||f===k;};
  var games=gamesInPeriod(),last=S.history[0];
  var h='<div class="period" role="group" aria-label="Período"><button type="button" data-act="period" data-p="all" aria-pressed="'+(ui.period==='all')+'">Temporada geral</button><button type="button" data-act="period" data-p="month" aria-pressed="'+(ui.period==='month')+'">Este mês</button></div>';
  h+='<div class="catpick rkf" role="group" aria-label="Escolher estatística">'+RK.map(function(k){return '<button type="button" class="chip" data-act="rkf" data-k="'+k[0]+'" aria-pressed="'+(f===k[0])+'">'+k[1]+'</button>';}).join('')+'</div>';
  if(show('destaques')){
    var sg=lastPlacarGame();if(sg)h+=scoreboardHTML(sg);
    var aggL=aggregate([last]),art=top(aggL,function(x){return x.g;},1)[0];
    if(last.cheia||last.murcha)h+='<div class="awards">'+collectCard('cheia',last)+collectCard('murcha',last)+'</div>';
    if(last.juri&&last.juri.final&&last.juri.votos.length){var vc=apurar(last,'cheia'),vm=apurar(last,'murcha'),nv=last.juri.votos.length,vt=function(a,id){var v=a.c[id]||0;return v+' de '+nv+' voto'+(nv>1?'s':'')+(v===nv&&nv>1?', unânime':'');};
      h+='<p class="art">'+(last.cheia?'🏆 '+vt(vc,last.cheia):'')+(last.cheia&&last.murcha?' · ':'')+(last.murcha?'🎈 '+vt(vm,last.murcha):'')+'</p>';}
    if(last.placar)h+='<p class="art">'+esc(placarTxt(last))+'</p>';
    if(art&&last.cob.g)h+='<p class="art">⚽ Artilheiro do dia: <strong>'+esc(art.p.name)+'</strong> ('+art.g+' gol'+(art.g>1?'s':'')+')</p>';
  }
  if(!games.length)return h+'<p class="empty">Nenhuma pelada neste período ainda.</p>';
  var agg=aggregate(games),pe=rosterGames(games);
  h+='<p class="meta center">'+games.length+' pelada'+(games.length>1?'s':'')+' no período</p>';
  if(show('destaques')){
    h+=dstHTML(agg,games);
    h+=campeoesHTML(canEditUi());
    var tw=[0,0],te=0,tg=[0,0];games.forEach(function(g){var w=winner(g);if(w===null||g.adv)return;if(w===-1)te++;else tw[w]++;if(g.placar){tg[0]+=g.placar.v;tg[1]+=g.placar.g;}});
    var tot=tw[0]+tw[1]+te;
    if(tot>0){var p0=Math.round(tw[0]/tot*100),p1=Math.round(tw[1]/tot*100),pz=Math.max(0,100-p0-p1);
      h+='<section class="card board"><h2>Vermelho x Verde</h2><p class="hint" style="margin-top:-6px">Retrospecto dos confrontos no período</p><div class="retro-bar" role="img" aria-label="Vermelho '+p0+'%, empates '+pz+'%, Verde '+p1+'%"><i class="r" style="flex:'+tw[0]+'"></i><i class="e" style="flex:'+te+'"></i><i class="g" style="flex:'+tw[1]+'"></i></div>'+
        '<div class="retro-l"><div class="r"><b>'+p0+'%</b><span>Vermelho · '+tw[0]+' vit.</span></div><div><b>'+pz+'%</b><span>Empates · '+te+'</span></div><div class="g"><b>'+p1+'%</b><span>Verde · '+tw[1]+' vit.</span></div></div>'+
        (tg[0]+tg[1]>0?'<p class="hint center">Gols no período: Vermelho '+tg[0]+' x '+tg[1]+' Verde</p>':'')+'</section>';}
  }
  if(f==='destaques'){h+='<p class="hint center">Use os filtros acima para ver cada estatística completa.</p>';h+='<button type="button" class="btn wide" data-act="shareRank">Copiar resumo para o WhatsApp</button>';return h;}
  if(show('artilharia')){h+=unkNote(games,'g','gols')+podiumHTML(agg)+board('Artilharia',top(agg,function(x){return x.g;},15),function(x){return x.g;},' gols',function(x){return x.jG+' jogo'+(x.jG>1?'s':'')+' com gols registrados'+(avgG(x)!==null?' · média '+fmt2(avgG(x))+' gol/jogo':'');},'Nenhum gol registrado neste período.');}
  if(show('assist'))h+=unkNote(games,'a','assistências')+board('Assistências',top(agg,function(x){return x.a;},15),function(x){return x.a;},'',function(x){return x.jA+' jogo'+(x.jA>1?'s':'')+' com assistências registradas';},'Nenhuma assistência registrada neste período.');
  if(show('penalti'))h+=unkNote(games,'p','gols de pênalti')+board('🎯 Gols de pênalti',top(agg,function(x){return x.pen;},10),function(x){return x.pen;},'',null,'Nenhum gol de pênalti registrado neste período.');
  if(show('falta'))h+=unkNote(games,'f','gols de falta')+board('🌀 Gols de falta',top(agg,function(x){return x.fal;},10),function(x){return x.fal;},'',null,'Nenhum gol de falta registrado neste período.');
  if(show('partidas'))h+=(pe<games.length?'<p class="unkn" role="note">⚠ Em <b>'+(games.length-pe)+' de '+games.length+'</b> partidas a escalação não foi registrada. Elas ficam fora da contagem.</p>':'')+board('Partidas disputadas',top(agg,function(x){return x.j;},15),function(x){return x.j;},' jogos',function(x){var p=pctPres(x,pe);return p!==null?p+'% das '+pe+' partidas com escalação':'';},'Nenhuma escalação registrada neste período.');
  if(show('presenca')){
    var pl=agg.filter(function(x){return x.j>0;}).sort(function(a,b){return (pctPres(b,pe)-pctPres(a,pe))||(b.j-a.j)||a.p.name.localeCompare(b.p.name,'pt-BR');}).slice(0,15);
    h+=(pe<games.length?'<p class="unkn" role="note">⚠ Em <b>'+(games.length-pe)+' de '+games.length+'</b> partidas a escalação não foi registrada. A presença só considera as <b>'+pe+'</b> com escalação.</p>':'')+board('Presença',pl,function(x){return pctPres(x,pe);},'%',function(x){return x.j+' de '+pe+' partidas';},'Ainda não há escalações registradas neste período.');}
  if(f==='todos'){
    h+=board('🏅 Mais vitórias',top(agg,function(x){return x.w;},10),function(x){return x.w;},' vit.',function(x){return x.jp+' jogo'+(x.jp>1?'s':'')+' com placar · aproveitamento '+Math.round((x.w*3+x.e)/(x.jp*3)*100)+'%';});
    h+=board('🏆 Mais bola cheia (craque)',top(agg,function(x){return x.c;},5),function(x){return x.c;},'×',null);
    h+=board('🎈 Mais bola murcha',top(agg,function(x){return x.m;},5),function(x){return x.m;},'×',null);
    h+=unkNote(games,'c','cartões')+board('Cartões',top(agg,function(x){return x.y+x.r*2;},10),function(x){return x.y+x.r;},'',function(x){return (x.y?x.y+' amarelo'+(x.y>1?'s':''):'')+(x.y&&x.r?', ':'')+(x.r?x.r+' vermelho'+(x.r>1?'s':''):'');});
    h+='<button type="button" class="btn wide" data-act="shareRank">Copiar resumo para o WhatsApp</button>';
  }
  return h;
}
function award(cls,label,p){
  return '<div class="award '+cls+'">'+(p?avatarBtn(p,72):'<span class="av ini empty-av" style="width:72px;height:72px">?</span>')+'<span class="al">'+label+'</span><strong>'+(p?esc(p.name):'Não definido')+'</strong></div>';
}
function rankText(){
  var games=gamesInPeriod(),last=S.history[0],agg=aggregate(games);
  var L=['🏆 '+S.info.name+' — resumo da '+(ui.period==='all'?'temporada':'mês'),''];
  var d=new Date(last.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
  L.push('*Última pelada ('+d+')*');
  if(last.cheia)L.push('🏆 Bola cheia: '+gameName(last,last.cheia));
  if(last.murcha)L.push('🎈 Bola murcha: '+gameName(last,last.murcha));
  L.push('');
  function sec(t,list,key,u){if(!list.length)return;L.push('*'+t+'*');list.forEach(function(x,i){L.push((i+1)+'. '+x.p.name+' — '+key(x)+u);});L.push('');}
  if(last.placar)L.splice(3,0,placarTxt(last));
  sec('🏅 Mais vitórias',top(agg,function(x){return x.w;},3),function(x){return x.w;},' vitórias');
  sec('⚽ Artilharia',top(agg,function(x){return x.g;},5),function(x){return x.g;},' gols');
  sec('👟 Assistências',top(agg,function(x){return x.a;},3),function(x){return x.a;},'');
  sec('🏆 Bola cheia',top(agg,function(x){return x.c;},3),function(x){return x.c;},'×');
  sec('🎈 Bola murcha',top(agg,function(x){return x.m;},3),function(x){return x.m;},'×');
  sec('🎯 Gols de pênalti',top(agg,function(x){return x.pen;},3),function(x){return x.pen;},'');
  sec('🟨 Cartões',top(agg,function(x){return x.y+x.r*2;},3),function(x){return x.y+x.r;},'');
  return L.join('\n').trim();
}
function readPhoto(file){
  return new Promise(function(res,rej){
    if(!file||!/^image\//.test(file.type||'image/'))return rej('tipo');
    var fr=new FileReader();
    fr.onerror=function(){rej('ler');};
    fr.onload=function(){
      var img=new Image();
      img.onerror=function(){rej('ler');};
      img.onload=function(){
        try{var s=Math.min(img.naturalWidth,img.naturalHeight);if(!s)return rej('ler');
        var c=document.createElement('canvas');c.width=c.height=160;var x=c.getContext('2d');
        x.fillStyle='#fff';x.fillRect(0,0,160,160);
        x.drawImage(img,(img.naturalWidth-s)/2,(img.naturalHeight-s)/2*0.6,s,s,0,0,160,160);
        res(c.toDataURL('image/jpeg',0.72));}catch(e){rej('ler');}
      };
      img.src=fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function hm(t){var p=t.split(':');return p[0].replace(/^0/,'')+'h'+p[1];}
function nextGame(base){
  var now=base==null?Date.now():new Date(base).getTime(),day=dateBR(now);
  var sunday=new Date(day+'T'+S.info.kickoff+':00-03:00');
  var weekday=new Date(day+'T12:00:00Z').getUTCDay();
  sunday.setUTCDate(sunday.getUTCDate()+(7-weekday)%7);
  if(now>=sunday.getTime()+90*60000)sunday.setUTCDate(sunday.getUTCDate()+7);
  return sunday;
}
function upcomingFixture(){
  var now=Date.now(),I=S.info,fixture=I.proximoJogo,sunday=nextGame(now);
  if(fixture){
    var date=new Date(fixture.date+'T'+fixture.kickoff+':00-03:00');
    if(date<=sunday&&now<date.getTime()+90*60000)return {date:date,arrival:fixture.arrival,kickoff:fixture.kickoff,campo:fieldById(fixture.campo),extra:true};
  }
  return {date:sunday,arrival:I.arrival,kickoff:I.kickoff,campo:curField(),extra:false};
}
function nextDue(){
  var now=new Date(),day=S.info.feeDay;
  var d=new Date(now.getFullYear(),now.getMonth(),day,23,59);
  if(now>d)d=new Date(now.getFullYear(),now.getMonth()+1,day,23,59);
  return d;
}
function liveTeams(mk){
  mk=mk||curMonthKey();
  var t=monthTeams(mk);if(!t)return null;
  return {month:mk,teams:t,date:nextGame(),campo:curField()};
}
function monthTeamObjs(t){return t.map(function(x){return x.map(byId).filter(Boolean).sort(function(a,b){return (PORD[a.pos]-PORD[b.pos])||(b.stars-a.stars)||a.name.localeCompare(b.name,'pt-BR');});});}
/* ===== TIMES: escalação por setor e campinho tático ===== */
var SECT=[['G','🧤','Goleiros'],['D','🛡️','Defensores & Laterais'],['M','⚙️','Meio-Campo'],['A','⚡','Ataque']];
function sectOf(pos){return pos==='G'?'G':(pos==='Z'||pos==='L')?'D':(pos==='V'||pos==='MA')?'M':pos==='A'?'A':'X';}
function pbHTML(pos){return pos?'<span class="pb pb-'+sectOf(pos).toLowerCase()+'">'+POSSHORT[pos]+'</span>':'';}
function teamSectionsHTML(t,hitIds,team){
  var h='';
  SECT.concat([['X','📋','Sem posição definida']]).forEach(function(s){
    var ps=t.filter(function(p){return sectOf(p.pos)===s[0];});if(!ps.length)return;
    h+='<div class="sec"><div class="sec-t"><span aria-hidden="true">'+s[1]+'</span>'+s[2]+'<em>'+ps.length+'</em></div><ul>'+
      ps.map(function(p){return '<li'+(hitIds[p.id]?' class="me"':'')+'>'+kitAvatar(p,30,team)+'<span class="nm">'+nameLink(p,p.id)+'</span>'+pbHTML(p.pos)+'</li>';}).join('')+'</ul></div>';
  });
  return h;
}

function tacticalLineup(players,limit,preferred){
  var pools=['G','D','M','A'].map(function(key){return players.filter(function(p){return p.pos&&sectOf(p.pos)===key;}).sort(ratingOrder);});
  var slots=[1,4,3,3];
  var offset=0;
  while(slots.reduce(function(a,b){return a+b;},0)>limit){
    var lane=[1,3,2][offset++%3];
    if(slots[lane]>0)slots[lane]--;
  }
  var rows=pools.map(function(pool,i){
    return pool.slice().sort(function(a,b){return Number(preferred.includes(b.id))-Number(preferred.includes(a.id))||ratingOrder(a,b);}).slice(0,slots[i]);
  });
  var selected=new Set(rows.flat().map(function(p){return p.id;}));
  return {rows:rows,bench:players.filter(function(p){return !selected.has(p.id);}).sort(ratingOrder),slots:slots};
}
function swapTactical(month,index,reserveId,starterId){
  if(!canEditUi())return;
  var record=S.meses[month];
  if(!record||!record.teams[index])return;
  var team=record.teams[index].map(byId).filter(Boolean);
  var overrides=record.titulares||[];
  var tactical=tacticalLineup(team,S.settings.starters,overrides[index]||[]);
  var reserve=tactical.bench.find(function(p){return p.id===reserveId;});
  var starter=tactical.rows.flat().find(function(p){return p.id===starterId;});
  if(!reserve||!starter||sectOf(reserve.pos)!==sectOf(starter.pos)){toast('A troca precisa manter a posição no esquema.');return;}
  record.titulares=overrides;
  record.titulares[index]=tactical.rows.flat().map(function(p){return p.id===starterId?reserveId:p.id;});
  change();
}
function campoHTML(teams,hitIds,month){
  var i=ui.timeCampo===1?1:0,team=teams[i],col=COLORS[i];
  var record=S.meses[month],picked=record&&record.titulares&&record.titulares[i]||[];
  var tactical=tacticalLineup(team,S.settings.starters,picked),names=['Goleiro','Defesa','Meio-campo','Ataque'];
  var short=function(p){return p.name.split(/\s+/).slice(0,2).join(' ')+(p.num?' #'+p.num:'');};
  var rating=function(p){return '<span class="rating-chip">'+esc(fmt(p.stars))+'</span>';};
  var h='<div class="seg2" role="group" aria-label="Time no campinho">'+[0,1].map(function(k){return '<button type="button" data-act="timeCampo" data-i="'+k+'" aria-pressed="'+(k===i)+'">'+COLORS[k].n+' · '+teams[k].length+'</button>';}).join('')+'</div>';
  h+='<div class="tactical-frame"><div class="pitch-x tactical-pitch" style="--bib:'+col.c+'"><svg class="lines" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true"><rect x="4" y="4" width="92" height="142"/><path d="M4 75h92"/><circle cx="50" cy="75" r="13"/><rect x="25" y="4" width="50" height="21"/><rect x="25" y="125" width="50" height="21"/></svg>';
  [3,2,1,0].forEach(function(lane){
    var row=tactical.rows[lane];
    h+='<section class="tactical-lane" aria-label="'+names[lane]+'"><small>'+names[lane]+'</small><div class="tactical-nodes">'+row.map(function(p){
      return '<button type="button" class="tactical-player'+(hitIds[p.id]?' me':'')+'" data-act="perfil" data-id="'+esc(p.id)+'">'+teamArt('shirt',i)+'<strong>'+esc(short(p))+'</strong><span>'+esc(POSSHORT[p.pos]||'—')+' '+rating(p)+'</span></button>';
    }).join('')+(row.length<tactical.slots[lane]?'<span class="tactical-vacancy">'+(tactical.slots[lane]-row.length)+' vaga(s)</span>':'')+'</div></section>';
  });
  h+='</div><aside class="tactical-bench"><h3>Banco de reservas &amp; disponíveis</h3>';
  if(!tactical.bench.length)h+='<p class="hint">Sem atletas no banco.</p>';
  h+='<ul>'+tactical.bench.map(function(p){
    var options=tactical.rows.flat().filter(function(starter){return p.pos&&sectOf(p.pos)===sectOf(starter.pos);});
    return '<li>'+teamArt('shirt',i)+'<span>'+nameLink(p,p.id)+'<small>'+esc(POSSHORT[p.pos]||'Sem posição')+'</small></span>'+rating(p)+
      (canEditUi()&&options.length?'<select aria-label="Permutar '+esc(p.name)+' com titular" data-act="tacticalSwap" data-id="'+esc(p.id)+'" data-month="'+month+'" data-team="'+i+'"><option value="">Permutar com…</option>'+options.map(function(starter){return '<option value="'+esc(starter.id)+'">'+esc(starter.name)+'</option>';}).join('')+'</select>':'')+'</li>';
  }).join('')+'</ul></aside></div>';
  return h;
}
function teamsBlock(inAvisos){
  var current=curMonthKey();
  var selected=inAvisos?current:ui.publicTeamsMonth||current;
  var months=[current].concat(Object.keys(S.meses).filter(function(month){return month!==current&&monthTeams(month);}).sort().reverse());
  var picker=inAvisos?'':'<label class="field teams-month"><span>Mês da escalação</span><select data-act="publicTeamsMonth">'+
    months.map(function(month){return '<option value="'+esc(month)+'"'+(selected===month?' selected':'')+'>'+esc(monthLabel(month,true))+'</option>';}).join('')+'</select></label>';
  var L=liveTeams(selected);
  if(!L)return inAvisos?'':picker+'<p class="empty">A escalação de '+monthName(selected)+' ainda não foi publicada.</p>';
  var teams=monthTeamObjs(L.teams),q=norm(ui.findName||''),hits=[];
  if(q.length>=2)teams.forEach(function(t,i){t.forEach(function(p){if(norm(p.name).indexOf(q)>=0)hits.push({p:p,i:i});});});
  var d=L.date.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'});
  var h='<section class="card tweek" id="times-semana"><h2>Times de '+monthName(L.month)+'</h2>'+picker+
    (L.month===current?'<p class="tw-sub">Próximo jogo: '+esc(d)+' · '+esc(L.campo.name)+(L.campo.principal?'':' <strong class="warn-t">(mudança de campo)</strong>')+'</p>':'');
  h+='<label class="field find"><span>Ache seu nome</span><input id="findName" type="search" autocomplete="off" placeholder="Digite seu nome para achar seu time..." value="'+esc(ui.findName||'')+'"></label>';
  if(q.length>=2){
    if(!hits.length)h+='<p class="find-res none">Não achei esse nome. Confira a escrita ou fale com a diretoria.</p>';
    else if(hits.length===1){var c0=COLORS[hits[0].i%COLORS.length];h+='<p class="find-res" style="--bib:'+c0.c+'"><span aria-hidden="true">✅</span><span>'+esc(hits[0].p.name)+', você está escalado no time <strong>'+c0.n.toUpperCase()+'</strong>!</span></p>';}
    else h+='<p class="find-res" style="display:block">'+hits.slice(0,6).map(function(x){var c1=COLORS[x.i%COLORS.length];return esc(x.p.name)+': <strong>'+c1.n.toUpperCase()+'</strong>';}).join('<br>')+'</p>';
  }
  var hitIds={};hits.forEach(function(x){hitIds[x.p.id]=1;});
  if(inAvisos){
    h+='<div class="tw-grid">'+teams.map(function(t,i){var col=COLORS[i%COLORS.length];return '<div class="tw-team" style="--bib:'+col.c+';--bibt:'+col.t+'"><div class="tw-h">'+teamArt('shirt',i)+'<span>'+col.n+'</span><small>'+t.length+'</small></div><ul>'+t.map(function(p){return '<li'+(hitIds[p.id]?' class="me"':'')+'>'+kitAvatar(p,26,i)+'<span class="nm">'+nameLink(p,p.id)+'</span>'+(p.pos==='G'?'<span class="pb pb-g">GOL</span>':'')+'</li>';}).join('')+'</ul></div>';}).join('')+'</div>';
    if(!canEditUi())h+='<button type="button" class="btn wide primary" style="margin-top:14px" data-act="tab" data-tab="sorteio">Ver escalação completa e campinho tático →</button>';
  }else{
    var vw=ui.timesView==='lista'?'lista':'campo';
    h+='<div class="vtoggle" role="group" aria-label="Forma de visualizar os times"><button type="button" data-act="timesView" data-v="campo" aria-pressed="'+(vw==='campo')+'">Campinho tático</button><button type="button" data-act="timesView" data-v="lista" aria-pressed="'+(vw==='lista')+'">Lista completa</button></div>';
    if(vw==='lista')h+='<div class="tw-grid full">'+teams.map(function(t,i){var col=COLORS[i%COLORS.length];return '<article class="tw-team" style="--bib:'+col.c+';--bibt:'+col.t+'">'+lineupKit(t,i)+teamSectionsHTML(t,hitIds,i)+'</article>';}).join('')+'</div>';
    else h+=campoHTML(teams,hitIds,L.month);
  }
  h+='<p class="note-arr">📅 Os mesmos times jogam todos os domingos de '+monthName(L.month)+'. ⏰ Em cada time, os '+S.settings.starters+' primeiros a chegar começam jogando.</p></section>';
  return h;
}
/* ===== DARK STADIUM · auxiliares visuais ===== */
function cap(s){s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1);}
function p2(n){return String(n).padStart(2,'0');}
// A prancha fornece camisas, escudos e Bola Murcha. Bola Cheia tem arte própria.
var CLUB_ART={
  'shirt-red':[122,48,722,832],
  'shirt-green':[178,922,688,810],
  'shield-red':[962,105,532,700],
  'shield-green':[980,1071,508,646],
  cheia:[0,0,680,948],
  murcha:[1799,910,495,827]
};
var clubArtPromise;
var artUrls={cheia:"/assets/trofeu-craque.webp"};
function prepareClubArt(){
  if(clubArtPromise)return clubArtPromise;
  clubArtPromise=Promise.all([posterImage('/assets/fda-identidade.jpg'),posterImage(artUrls.cheia)]).then(function([sprite,craque]){
    if(!sprite)throw new Error('Prancha de ativos indisponível');
    return Promise.all(Object.entries(CLUB_ART).map(function(entry){
      var [key,[x,y,w,h]]=entry;
      var canvas=document.createElement('canvas');
      canvas.width=w;
      canvas.height=h;
      var ctx=canvas.getContext('2d',{willReadFrequently:true});
      if(key==='cheia'){
        if(!craque)return [key,null];
        ctx.drawImage(craque,0,0,w,h);
        return [key,{canvas:canvas}];
      }
      ctx.drawImage(sprite,x,y,w,h,0,0,w,h);
      // The red/green labels overlap the bounding boxes but never the fabric.
      if(key==='shirt-red')ctx.clearRect(0,382,142,h-382);
      if(key==='shirt-green')ctx.clearRect(0,0,32,178);
      var image=ctx.getImageData(0,0,w,h),pixels=image.data;
      var queue=new Int32Array(w*h),seen=new Uint8Array(w*h),head=0,tail=0;
      function visit(i){
        if(i<0||i>=w*h||seen[i])return;
        seen[i]=1;
        var p=i*4,r=pixels[p],g=pixels[p+1],b=pixels[p+2];
        if(pixels[p+3]&&!(Math.min(r,g,b)>183&&Math.max(r,g,b)-Math.min(r,g,b)<24))return;
        pixels[p+3]=0;
        queue[tail++]=i;
      }
      [0,w-1,(h-1)*w,h*w-1].forEach(visit);
      while(head<tail){
        var i=queue[head++],column=i%w;
        if(column>0)visit(i-1);
        if(column<w-1)visit(i+1);
        visit(i-w);
        visit(i+w);
      }
      ctx.putImageData(image,0,0);
      return new Promise(function(resolve,reject){
        canvas.toBlob(function(blob){
          if(!blob){reject(new Error('Não foi possível exportar '+key));return;}
          artUrls[key]=URL.createObjectURL(blob);
          resolve([key,{canvas:canvas}]);
        });
      });
    })).then(Object.fromEntries);
  });
  return clubArtPromise;
}
function clubArt(key){
  var crop=CLUB_ART[key];
  if(!crop)return '';
  var w=crop[2],h=crop[3],url=artUrls[key];
  return '<span aria-hidden="true" class="club-art art-'+key+'" style="--art-ratio:'+w+'/'+h+'">'+
    (url?'<img src="'+url+'" alt="" decoding="async">':'')+'</span>';
}
function teamArt(type,index){
  return index===0?clubArt(type+'-red'):index===1?clubArt(type+'-green'):'';
}
function kitAvatar(p,size,index){
  return '<span class="kit-avatar">'+avatar(p,size)+teamArt('shirt',index)+'</span>';
}
/* selo de status de cada time (campeão do mês, líder, invicto) */
function teamSeal(i){
  var cur=curMonthKey(),prev=shiftMonth(cur,-1),ps=monthStandings(prev);
  if(ps.campeao===i)return {t:'Campeão de '+monthName(prev),c:'gold'};
  var cs=monthStandings(cur);
  if(cs.lider===i)return {t:'Líder de '+monthName(cur),c:'green'};
  var st=0,gs=S.history.filter(function(g){return !g.adv&&winner(g)!==null;});
  for(var k=0;k<gs.length;k++){var w=winner(gs[k]);if(w===i||w===-1)st++;else break;}
  if(st>=3)return {t:'Invicto há '+st+' jogos',c:'green'};
  return {t:'Na disputa',c:''};
}
/* contagem regressiva */
function cdParts(fixture){var t=(fixture||upcomingFixture()).date.getTime()-Date.now();if(t<=0)return null;var s=Math.floor(t/1000);return {d:Math.floor(s/86400),h:Math.floor(s%86400/3600),m:Math.floor(s%3600/60),s:s%60};}
function countdownHTML(fixture){
  var c=cdParts(fixture);
  if(!c)return '<div class="live" role="status"><span class="live-dot"></span>Bola rolando agora!</div>';
  var box=function(k,v,l){return '<div class="cd"><b data-cd="'+k+'">'+p2(v)+'</b><span>'+l+'</span></div>';};
  return '<div class="cd-l">Faltam</div><div class="countdown" id="countdown" role="timer" aria-label="Faltam '+c.d+' dias, '+c.h+' horas e '+c.m+' minutos">'+box('d',c.d,'dias')+box('h',c.h,'horas')+box('m',c.m,'min')+box('s',c.s,'seg')+'</div>';
}
function tickCountdown(){
  var center=document.querySelector('.mc[data-kickoff]');
  if(!center)return;
  var fixture=upcomingFixture();
  if(center.dataset.kickoff!==String(fixture.date.getTime())){render();return;}
  var el=document.getElementById('countdown');
  if(!el)return;
  var c=cdParts(fixture);if(!c){render();return;}
  ['d','h','m','s'].forEach(function(k){var n=el.querySelector('[data-cd="'+k+'"]');var v=p2(c[k]);if(n&&n.textContent!==v)n.textContent=v;});
  el.setAttribute('aria-label','Faltam '+c.d+' dias, '+c.h+' horas e '+c.m+' minutos');
}
function resultScorersHTML(game,index){
  var side=index===0?'v':'g',items=[],total=0;
  (game.teams[index]||[]).forEach(function(id){
    var goals=game.stats[id]?.g||0;if(!goals)return;
    total+=goals;
    items.push('<span>'+nameLink(personOf(game,id),rid(game,id))+' <b>'+goals+'</b></span>');
  });
  (game.teams[1-index]||[]).forEach(function(id){
    var against=game.stats[id]?.og||0;if(!against)return;
    total+=against;
    items.push('<span>'+nameLink(personOf(game,id),rid(game,id))+' <b>'+against+' contra'+'</b></span>');
  });
  game.liveGoals.filter(function(goal){return !goal.undone&&!goal.player&&goal.kind==='contra'&&goal.side===side;}).forEach(function(){
    total++;items.push('<span>Gol contra sem autor identificado</span>');
  });
  var missing=game.placar[side]-total;
  if(missing>0)items.push('<span class="goal-unrecorded">'+missing+(missing===1?' gol sem autor identificado':' gols sem autor identificado')+'</span>');
  return items.join('')||'<span class="goal-unrecorded">Sem gols</span>';
}
function latestResultHTML(){
  var game=lastPlacarGame(true);if(!game)return '';
  var day=dateBR(game.date),label=game.live?'Jogo ao vivo':'Último jogo';
  return '<section class="latest-result" aria-label="'+label+'"><div class="result-head"><h2>'+label+'</h2><time datetime="'+day+'">'+
    esc(new Date(game.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric',timeZone:'America/Sao_Paulo'}))+'</time></div>'+scoreboardHTML(game)+
    '<div class="result-goals">'+['v','g'].map(function(side,index){
      return '<div class="goal-team '+(index===0?'red':'green')+'"><span>'+esc(liveTeamLabel(game,side))+'</span>'+resultScorersHTML(game,index)+'</div>';
    }).join('')+'</div></section>';
}
function weeklyHighlightsHTML(){
  var game=lastAwardGame();if(!game)return '';
  var day=dateBR(game.date),label=day.slice(5).split('-').reverse().join('/');
  return '<section class="card weekly-highlights" aria-labelledby="weekly-highlights-title"><div class="row-between"><h2 id="weekly-highlights-title">Destaques da rodada</h2><time datetime="'+day+'">'+label+'</time></div>'+
    '<div class="result-honors">'+['cheia','murcha'].map(function(kind){
      var id=game[kind],isC=kind==='cheia';
      return '<div class="honor-card honor-'+kind+'">'+clubArt(kind)+'<div><span>'+(isC?'Bola Cheia':'Bola Murcha')+'</span><strong>'+
        (id?nameLink(personOf(game,id),rid(game,id)):'A definir')+'</strong></div></div>';
    }).join('')+'</div></section>';
}
function matchCenter(){
  var fixture=upcomingFixture(),ng=fixture.date,live=!cdParts(fixture),campo=fixture.campo;
  var weekday=cap(ng.toLocaleDateString('pt-BR',{weekday:'long',timeZone:'America/Sao_Paulo'}));
  var st=live?'Bola rolando agora':'Próximo jogo • '+weekday+' '+esc(fixture.kickoff);
  var ds=dateBR(ng).slice(5).split('-').reverse().join('/');
  var h='<section class="mc" aria-label="Próximo jogo" data-kickoff="'+ng.getTime()+'"><div class="mc-status"><i></i>'+st+'</div>';
  if(fixture.extra){
    h+='<h2>'+ds+' · '+esc(campo.name)+'</h2><p>'+esc(campo.bairro)+'</p>';
    if(campo.maps)h+='<a class="btn" href="'+esc(campo.maps)+'" target="_blank" rel="noopener noreferrer">Como chegar</a>';
  }else{
    var s0=teamSeal(0),s1=teamSeal(1);
    h+='<div class="duel"><div class="side side-red">'+teamArt('shield',0)+'<div class="tn r">'+COLORS[0].n+'</div><span class="seal '+s0.c+'">'+esc(s0.t)+'</span></div>'+
      '<div class="vsb" aria-hidden="true"><b>VS</b><small>'+ds+'</small></div>'+
      '<div class="side side-green">'+teamArt('shield',1)+'<div class="tn g">'+COLORS[1].n+'</div><span class="seal '+s1.c+'">'+esc(s1.t)+'</span></div></div>';
  }
  return h+countdownHTML(fixture)+matchTimeline(fixture)+'</section>';
}
function matchTimeline(fixture){
  return '<div class="arena-timeline" aria-label="Horários da rodada">'+
    (fixture.arrival?'<span><b>'+esc(fixture.arrival)+'</b> Chegada</span><span aria-hidden="true">→</span>':'')+
    '<span><b>'+esc(fixture.kickoff)+'</b> Bola rolando</span></div>';
}
function lineupKit(players,index){
  var team=COLORS[index%COLORS.length],label=index<2?'Manto '+team.n:team.n;
  return '<div class="lineup-team'+(index===0?' lineup-red':index===1?' lineup-green':'')+'">'+teamArt('shirt',index)+
    '<div><strong>'+label+'</strong><span class="lineup-count">'+players.length+' atletas</span></div></div>';
}
function lineupBrief(){
  var month=curMonthKey(),teams=monthTeams(month);
  if(!teams)return '<section class="card lineup-brief"><h2>Escalação</h2><p class="meta">Aguardando confirmação da diretoria.</p></section>';
  return '<section class="card lineup-brief"><h2>Escalação de '+esc(monthName(month))+'</h2><p class="meta">Confirmada pela diretoria</p>'+
    teams.map(function(ids,index){return lineupKit(ids.map(byId).filter(Boolean),index);}).join('')+
    '<button type="button" class="btn wide" data-act="openLineup" data-month="'+month+'">Ver escalação completa</button></section>';
}
function viewAvisos(){
  var I=S.info,now=new Date(),ed=canEditUi();
  var due=nextDue(),dd=Math.round((new Date(due.getFullYear(),due.getMonth(),due.getDate())-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);
  var h='<section class="club-intro"><div><h2>O clube</h2><p>'+esc(I.descricao||('Domingos no '+curField().name+'.'))+'</p></div><div class="btnrow">'+
    '<button type="button" class="btn primary" data-act="tab" data-tab="tv">Assistir à FDA TV</button><button type="button" class="btn" data-act="tab" data-tab="lances">Ver os lances</button></div></section>'+
    '<div class="broadcast-grid">'+matchCenter()+lineupBrief()+'</div>'+latestResultHTML()+weeklyHighlightsHTML()+partyCard()+
    '<div class="btnrow"><button type="button" class="btn" data-act="tab" data-tab="jogos">Histórico de jogos</button><button type="button" class="btn" data-act="openJournal">Notícias do clube</button></div>'+fieldCard(ed)+pinnedTeaser();
  h+='<section class="card due'+(dd<=3?' soon':'')+'"><div><h2>Mensalidade</h2><p>Pagamento até o dia '+I.feeDay+' de cada mês.</p></div><div class="due-box"><span class="big">'+due.getDate()+'/'+String(due.getMonth()+1).padStart(2,'0')+'</span><span>'+(dd===0?'vence hoje':dd===1?'vence amanhã':'faltam '+dd+' dias')+'</span></div></section>';
  h+='<section class="card" id="notices-section"><h2>Avisos e regras</h2>';
  if(!I.notices.length)h+='<p class="hint">Nenhum aviso no momento.</p>';
  h+='<ul class="notices">';
  var active=I.notices.filter(noticeCurrent);
  active.forEach(function(n){
    if(ed)h+='<li><textarea class="ntext" rows="2" maxlength="240" data-act="notice" data-id="'+esc(n.id)+'" aria-label="Editar aviso">'+esc(n.text)+'</textarea><label class="field">Válido até<input type="date" data-act="noticeExpiry" data-id="'+esc(n.id)+'" value="'+esc(noticeDay(n))+'"></label><button type="button" class="del'+(ui.confirmDel===n.id?' sure':'')+'" data-act="delNotice" data-id="'+esc(n.id)+'" aria-label="Apagar aviso">'+(ui.confirmDel===n.id?'Apagar?':'✕')+'</button></li>';
    else h+='<li><span class="nb" aria-hidden="true">📌</span><span>'+esc(n.text)+'</span></li>';
  });
  h+='</ul>';
  if(active.length!==I.notices.length)h+='<details class="notice-history"><summary>Histórico de avisos</summary><ul>'+I.notices.filter(function(n){return !noticeCurrent(n)&&!/(festa|camisa).*100 anos/i.test(n.text);}).map(function(n){return '<li>'+esc(n.text)+'</li>';}).join('')+'</ul></details>';
  if(ed)h+='<div class="addrow one"><input id="newnotice" type="text" maxlength="240" placeholder="Novo aviso" autocomplete="off"><button type="button" class="btn primary" data-act="addNotice">Adicionar aviso</button></div>';
  h+='<button type="button" class="btn wide" data-act="shareAvisos" style="margin-top:12px">Copiar avisos para o WhatsApp</button></section>';
  return h;
}
function accessMessage(code){
  return {
    session:'Entre novamente para continuar.',
    forbidden:'Seu acesso não permite fazer essa alteração.',
    data:'Confira o e-mail e use uma senha de pelo menos 12 caracteres.',
    password:'Escolha uma senha mais forte.',
    exists:'Já existe uma conta com esse e-mail.',
    mismatch:'O e-mail da conta mudou no Supabase. Confira o cadastro.',
    unavailable:'Não foi possível concluir agora. Tente novamente.'
  }[code]||'Não foi possível concluir agora. Tente novamente.';
}
async function callAccess(body){
  try{
    var result=await SB.functions.invoke('diretoria-acessos',{body:body});
    if(!result.error)return result.data||{};
    var failure=await result.error.context?.json().catch(function(){return null;});
    return {error:accessMessage(failure?.code)};
  }catch(error){return {error:accessMessage('unavailable')};}
}
async function loadAccess(){
  if(!canEditUi()||!ui.manageAccess||ui.accessLoading)return;
  ui.accessLoading=true;ui.accessError='';
  var result=await callAccess({action:'list'});
  ui.accessLoading=false;
  ui.accessRows=Array.isArray(result.members)?result.members:null;
  ui.accessError=result.error||'';
  if(ui.tab==='acessos')render();
}
function viewAccess(){
  var form=ui.accessForm;
  var h='<header class="portal-heading"><h2>Acessos da diretoria</h2></header><section class="card admin-section">'+
    '<div class="row-between"><h3>Contas autorizadas</h3><button class="btn primary" type="button" data-act="accessNew">Criar acesso</button></div>';
  if(ui.accessLoading)h+='<p class="hint" role="status">Carregando acessos…</p>';
  if(ui.accessError)h+='<p class="warn" role="alert">'+esc(ui.accessError)+' <button class="link" type="button" data-act="accessRefresh">Recarregar</button></p>';
  if(ui.accessRows)h+='<ul class="admin-accounts">'+ui.accessRows.map(function(row){
    return '<li><div><strong>'+esc(row.email)+'</strong><small>'+(row.manager?'Administrador':row.active?'Editor':'Cadastro pendente')+'</small></div>'+
      (row.active&&!row.manager?'<button class="btn sm" type="button" data-act="accessReset" data-id="'+esc(row.email)+'">Redefinir senha</button>':'')+'</li>';
  }).join('')+'</ul>';
  h+='</section>';
  if(form){
    var reset=form.action==='reset';
    h+='<section class="card admin-section"><h3>'+(reset?'Redefinir senha':'Criar acesso')+'</h3><form id="access-editor">'+
      (reset?'<p>'+esc(form.email)+'</p>':'<label class="field">E-mail<input type="email" name="email" autocomplete="off" maxlength="254" required></label>')+
      '<label class="field">'+(reset?'Nova senha':'Senha inicial')+'<input name="password" type="password" minlength="12" maxlength="72" autocomplete="new-password" required></label>'+
      '<p class="hint">Use pelo menos 12 caracteres. Envie a senha à pessoa por um canal privado.</p>'+
      '<div class="btnrow"><button class="btn primary" type="submit">'+(reset?'Redefinir senha':'Criar acesso')+'</button><button class="btn" type="button" data-act="accessCancel">Cancelar</button></div>'+
      '<p class="hint" data-access-status role="status"></p></form></section>';
  }
  return h;
}
async function submitAccess(form){
  var target=ui.accessForm;
  if(!canEditUi()||!ui.manageAccess||!target||ui.accessBusy)return;
  var data=new FormData(form),email=target.email||String(data.get('email')||'').trim(),password=String(data.get('password')||'');
  var status=form.querySelector('[data-access-status]'),submit=form.querySelector('[type=submit]');
  if(password.trim().length<12||new TextEncoder().encode(password).length>72){status.textContent=accessMessage('data');return;}
  form.elements.password.value='';
  ui.accessBusy=true;submit.disabled=true;status.textContent='Salvando…';
  var result=await callAccess({action:target.action,email:email,password:password});
  ui.accessBusy=false;submit.disabled=false;
  if(result.error){status.textContent=result.error;return;}
  ui.accessForm=null;
  await loadAccess();
  toast(target.action==='create'?'Acesso criado.':'Senha redefinida.');
}
async function submitOwnPassword(form){
  if(!canEditUi()||!SB)return;
  var password=String(new FormData(form).get('password')||''),status=form.querySelector('[role=status]');
  if(password.trim().length<12||new TextEncoder().encode(password).length>72){status.textContent='Use uma senha entre 12 e 72 caracteres simples.';return;}
  var submit=form.querySelector('[type=submit]');
  form.reset();submit.disabled=true;
  try{
    var result=await SB.auth.updateUser({password:password});
    status.textContent=result.error?'Não foi possível alterar a senha. Entre novamente e tente com outra senha.':'Sua senha foi alterada.';
  }catch(error){status.textContent='Sem conexão. Tente novamente.';}
  finally{submit.disabled=false;}
}
function fieldOptions(selected){
  return S.info.fields.map(function(field){return '<option value="'+esc(field.id)+'"'+(selected===field.id?' selected':'')+'>'+esc(field.name)+'</option>';}).join('');
}
function viewSettings(){
  var I=S.info,fixture=I.proximoJogo||{};
  return '<header class="portal-heading"><h2>Configurações do site</h2></header>'+
    '<section class="card admin-section"><h3>Identidade</h3>'+
    '<label class="field">Nome do clube<input maxlength="40" value="'+esc(I.name)+'" data-act="info" data-k="name"></label>'+
    '<label class="field">Apresentação<textarea rows="2" maxlength="180" data-act="info" data-k="descricao">'+esc(I.descricao||'')+'</textarea></label>'+
    '<div class="btnrow"><img class="logo" src="'+esc(I.logo||'/escudo.png')+'" alt="Escudo atual">'+filePick('Trocar escudo','__logo__','btn')+
    (I.logo?'<button type="button" class="btn" data-act="logoDel">Restaurar original</button>':'')+'</div></section>'+
    '<section class="card admin-section"><h3>Jogo de domingo</h3><label class="field">Campo<select data-act="regularField">'+fieldOptions(I.fieldId)+'</select></label>'+
    '<div class="grid2"><label class="field">Chegada<input type="time" value="'+I.arrival+'" data-act="info" data-k="arrival"></label>'+
    '<label class="field">Horário do jogo<input type="time" value="'+I.kickoff+'" data-act="info" data-k="kickoff"></label></div></section>'+
    '<section class="card admin-section"><h3>Jogo fora da agenda</h3>'+
    '<form id="special-fixture"><div class="grid2"><label class="field">Data<input name="date" type="date" required value="'+(fixture.date||'')+'"></label>'+
    '<label class="field">Campo<select name="campo" required>'+fieldOptions(fixture.campo||I.fieldId)+'</select></label>'+
    '<label class="field">Chegada<input name="arrival" type="time" value="'+(fixture.arrival||'')+'"></label>'+
    '<label class="field">Horário do jogo<input name="kickoff" type="time" required value="'+(fixture.kickoff||'')+'"></label></div>'+
    '<div class="btnrow"><button class="btn" type="submit">Aplicar na agenda</button>'+
    (fixture.date?'<button class="btn" type="button" data-act="clearFixture">Remover da agenda</button>':'')+'</div></form></section>'+
    '<section class="card admin-section"><h3>Campos</h3>'+I.fields.map(function(field){
      return '<fieldset class="fset"><legend>'+esc(field.name)+'</legend>'+
        [['name','Nome',50],['bairro','Endereço',80],['maps','Link do Google Maps',300]].map(function([key,label,max]){
          return '<label class="field">'+label+'<input type="'+(key==='maps'?'url':'text')+'" maxlength="'+max+'" data-act="fieldEdit" data-k="'+key+'" data-id="'+esc(field.id)+'" value="'+esc(field[key])+'"></label>';
        }).join('')+filePick(field.photo?'Trocar foto':'Enviar foto','__field__'+field.id,'btn sm')+'</fieldset>';
    }).join('')+(I.fields.length<6?'<form id="add-field" class="addrow"><label class="field">Nome do novo campo<input name="name" maxlength="50" required></label><button type="submit" class="btn">Adicionar campo</button></form>':'')+'</section>'+
    '<section class="card admin-section"><h3>Redes sociais e mensalidade</h3>'+REDES.map(function(r){
      return '<label class="field">'+r[1]+'<input type="url" maxlength="300" value="'+esc(I.redes[r[0]]||'')+'" data-act="rede" data-k="'+r[0]+'"></label>';
    }).join('')+'<label class="field">Dia do pagamento<input type="number" min="1" max="28" inputmode="numeric" value="'+I.feeDay+'" data-act="info" data-k="feeDay"></label></section>'+
    '<section class="card admin-section"><h3>Minha senha</h3><form id="own-password"><label class="field">Nova senha<input type="password" name="password" autocomplete="new-password" minlength="12" maxlength="72" required></label>'+
    '<button class="btn" type="submit">Alterar minha senha</button><p class="hint" role="status"></p></form></section>';
}
function saveFixture(form){
  var value=new FormData(form),date=validDay(value.get('date')),kickoff=normTime(value.get('kickoff'),''),arrival=normTime(value.get('arrival'),''),campo=value.get('campo');
  if(!date||!kickoff||!fieldById(campo)){toast('Confira a data, o campo e o horário.');return;}
  if(arrival&&arrival>kickoff){toast('A chegada precisa ser antes do jogo.');return;}
  if(new Date(date+'T'+kickoff+':00-03:00').getTime()+90*60000<=Date.now()){toast('Escolha um jogo futuro.');return;}
  S.info.proximoJogo={date:date,kickoff:kickoff,arrival:arrival,campo:campo};change();
}
function partyCard(){
  var event=S.info.festa||FESTA_11,today=dateBR();
  if(today>event.date)return '';
  var open=today<=event.deadline;
  return '<section class="card party-card" aria-labelledby="party-title">'+
    '<a href="/assets/festa-11-anos.jpeg" class="party-image"><img src="/assets/festa-11-anos.jpeg" alt="Cartaz oficial da festa de 11 anos do Futebol dos Amigos em 22 de novembro de 2026" width="1254" height="1254"></a>'+
    '<div class="party-content"><span class="party-deadline">'+(open?'Pagamento até 15/11/2026':'Prazo de pagamento encerrado em 15/11/2026')+'</span>'+
    '<h2 id="party-title">Festa de 11 anos do Futebol dos Amigos</h2><p><time datetime="2026-11-22">22/11/2026</time> · Espaço com piscina, chopp e churrasco</p>'+
    '<p>'+esc(event.local)+'</p><div class="party-pricing"><strong>'+money(event.family)+' <small>Família</small></strong><strong>'+money(event.individual)+' <small>Individual / sozinho(a)</small></strong></div>'+
    (open?'<div class="party-pix"><code>'+esc(event.pix)+'</code><button type="button" class="btn" data-act="partyPix">'+(ui.partyCopied?'Chave PIX Copiada!':'Copiar Chave PIX')+'</button></div>':'')+'</div></section>';
}
function fieldCard(ed){
  var I=S.info,c=curField(),h='<section class="card field-card'+(c.principal?'':' alt')+'">';
  if(!c.principal)h+='<p class="alert">⚠️ Atenção: neste domingo o jogo é em outro campo!</p>';
  h+='<div class="fc-row">'+(c.photo?'<img class="fc-photo" src="'+c.photo+'" alt="Foto do '+esc(c.name)+'">':'<div class="fc-photo ph-empty" aria-hidden="true">🏟️</div>')+
    '<div class="fc-txt"><small>'+(c.principal?'Nosso campo':'Campo deste domingo')+'</small><h2>'+esc(c.name)+'</h2><p>📍 '+esc(c.bairro)+'</p></div></div>';
  if(c.maps)h+='<a class="btn wide primary" href="'+esc(c.maps)+'" target="_blank" rel="noopener noreferrer">🗺️ Como chegar (rota GPS) →</a>';
  if(ed){
    h+='<div class="field-pick"><p class="hint" style="margin:12px 0 6px">Onde é o jogo deste domingo? Toque para escolher:</p><div class="fp-btns">';
    I.fields.forEach(function(x){h+='<button type="button" class="fp'+(x.id===c.id?' on':'')+'" data-act="setField" data-id="'+x.id+'" aria-pressed="'+(x.id===c.id)+'"><strong>'+esc(x.name.replace(/^Campo d[oa] /,''))+'</strong><span>'+esc(x.bairro.split(',')[0])+'</span></button>';});
    h+='</div>'+filePick(c.photo?'📷 Trocar foto do '+esc(c.name):'📷 Colocar foto do '+esc(c.name),'__field__'+c.id,'btn sm wide')+'</div>';
  }
  return h+'</section>';
}
function avisosText(){
  var I=S.info,fixture=upcomingFixture(),campo=fixture.campo,active=I.notices.filter(noticeCurrent);
  var day=fixture.date.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',timeZone:'America/Sao_Paulo'});
  var L=['📣 *'+I.name+'*','','*Próximo jogo:* '+day];
  if(fixture.arrival)L.push('🕠 Chegada: '+hm(fixture.arrival));
  L.push('🕕 Bola rolando: '+hm(fixture.kickoff),'📍 Local: '+campo.name+(campo.bairro?' ('+campo.bairro+')':''));
  if(campo.maps)L.push('🗺️ Como chegar: '+campo.maps);
  L.push('💰 Mensalidade até o dia '+I.feeDay);
  if(active.length){L.push('','*Avisos*');active.forEach(function(n){L.push('📌 '+n.text);});}
  return L.join('\n');
}
function readLogo(file){
  return new Promise(function(res,rej){
    if(!file)return rej('tipo');
    var fr=new FileReader();fr.onerror=function(){rej('ler');};
    fr.onload=function(){var img=new Image();img.onerror=function(){rej('ler');};img.onload=function(){
      try{var W=img.naturalWidth,H=img.naturalHeight;if(!W||!H)return rej('ler');
      var sc=Math.min(1,240/Math.max(W,H)),w=Math.round(W*sc),h=Math.round(H*sc);
      var c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
      var u=c.toDataURL('image/png');if(u.length>250000)u=c.toDataURL('image/webp',0.85);if(u.indexOf('data:image/webp')!==0&&u.length>250000)u=c.toDataURL('image/jpeg',0.8);res(u);}catch(e){rej('ler');}};
      img.src=fr.result;};
    fr.readAsDataURL(file);
  });
}
/* ---------- jornal / novidades ---------- */
var SIZES=['PP','P','M','G','GG','XG','Infantil'];
function okImg(u,max){return typeof u==='string'&&/^data:image\/(jpeg|png|webp);base64,/.test(u)&&u.length<max;}
function normPosts(arr){
  return (Array.isArray(arr)?arr:[]).filter(function(p){return p&&typeof p==='object';}).map(function(p){
    var o={cat:(['noticia','jogo','comunicado','craque','murcha','campeao','resultado'].indexOf(p.cat)>=0?p.cat:'noticia'),id:String(p.id||uid()),date:Number(p.date)||Date.now(),kind:p.kind==='campanha'?'campanha':'noticia',
      title:String(p.title||'').slice(0,120),body:String(p.body||'').slice(0,6000),pinned:!!p.pinned,
      photos:(Array.isArray(p.photos)?p.photos:[]).filter(function(u){return okImg(u,420000);}).slice(0,6),
      links:(Array.isArray(p.links)?p.links:[]).filter(function(l){return l&&/^https?:\/\//i.test(l.url||'');}).map(function(l){return {url:String(l.url).slice(0,500),label:String(l.label||'').slice(0,60)};}).slice(0,4)};
    if(o.kind==='campanha'){
      o.price=Math.max(0,Math.round((Number(p.price)||0)*100)/100);
      o.deadline=/^\d{4}-\d{2}-\d{2}$/.test(p.deadline||'')?p.deadline:'';
      o.pix=String(p.pix||'').slice(0,80);
      o.orders=(Array.isArray(p.orders)?p.orders:[]).filter(function(x){return x&&String(x.name||'').trim();}).map(function(x){return {id:String(x.id||uid()),name:String(x.name).trim().slice(0,40),size:SIZES.indexOf(x.size)>=0?x.size:'',shirt:String(x.shirt||'').slice(0,20),paid:!!x.paid};}).slice(0,300);
    }
    return o;
  }).sort(function(a,b){return (b.pinned-a.pinned)||(b.date-a.date);}).slice(0,200);
}
function money(v){return 'R$ '+Number(v||0).toFixed(2).replace('.',',');}
function dlabel(iso){if(!iso)return '';var p=iso.split('-');return p[2]+'/'+p[1];}
function daysTo(iso){if(!iso)return null;var p=iso.split('-');var d=new Date(+p[0],+p[1]-1,+p[2]);var n=new Date();n=new Date(n.getFullYear(),n.getMonth(),n.getDate());return Math.round((d-n)/86400000);}
function stateSize(){try{return JSON.stringify(S).length;}catch(e){return 0;}}
var SIZE_LIMIT=9000000;
function bodyHTML(t){return esc(t).split(/\n{2,}/).map(function(par){return '<p>'+par.replace(/\n/g,'<br>')+'</p>';}).join('');}
function findPost(id){for(var i=0;i<S.posts.length;i++)if(S.posts[i].id===id)return S.posts[i];return null;}
function campaignBox(p,ed){
  var dd=daysTo(p.deadline),expired=dd!==null&&dd<0,h='<div class="camp'+(expired?' camp-expired':'')+'">';
  h+='<div class="camp-row"><div><span class="camp-price">'+money(p.price)+'</span>'+(p.deadline?'<span class="camp-dl'+(expired?' expired':dd<=2?' soon':'')+'">'+(expired?'Encerrada em ':'Pagar até ')+dlabel(p.deadline)+(dd!==null&&!expired?(dd>1?' · faltam '+dd+' dias':dd===1?' · amanhã':' · hoje'):'')+'</span>':'')+'</div></div>';
  if(!expired&&p.pix)h+='<div class="pix"><span>Pix</span><strong>'+esc(p.pix)+'</strong><button type="button" class="btn sm" data-act="copyPix" data-id="'+p.id+'">Copiar chave</button></div>';
  if(!expired)h+='<a class="btn wide primary" href="https://wa.me/?text='+encodeURIComponent('Quero a '+p.title+' ('+money(p.price)+').\nTamanho: \nNome na camisa: ')+'" target="_blank" rel="noopener noreferrer">Garantir minha camisa via WhatsApp</a><button type="button" class="btn wide" data-act="copyPedido" data-id="'+p.id+'">Ou copiar o pedido para colar no WhatsApp</button>';
  else h+='<p class="hint">Esta campanha foi mantida no histórico. Novos pedidos estão encerrados.</p>';
  var os=p.orders||[],paid=os.filter(function(o){return o.paid;}).length;
  if(!ed){var by0={};os.forEach(function(o){var k=o.size||'?';by0[k]=(by0[k]||0)+1;});return h+'<p class="hint">🛍️ '+os.length+' pedido'+(os.length===1?'':'s')+' até agora'+(os.length?' · por tamanho: '+Object.keys(by0).map(function(k){return k+' '+by0[k];}).join(', '):'')+'.</p></div>';}
  h+='<details class="orders"'+(ui.openOrders===p.id?' open':'')+'><summary data-act="toggleOrders" data-id="'+p.id+'">Pedidos ('+os.length+(os.length?', '+paid+' pago'+(paid===1?'':'s'):'')+')</summary>';
  if(os.length){
    h+='<ul class="olist">';
    os.forEach(function(o){
      h+='<li><span class="onm">'+esc(o.name)+'<small>'+(o.size?'Tam. '+o.size:'Sem tamanho')+(o.shirt?' · "'+esc(o.shirt)+'"':'')+'</small></span>'+
        (ed?'<button type="button" class="paid'+(o.paid?' on':'')+'" data-act="paid" data-id="'+p.id+'" data-o="'+o.id+'" aria-pressed="'+o.paid+'">'+(o.paid?'Pago':'A pagar')+'</button><button type="button" class="del'+(ui.confirmDel===o.id?' sure':'')+'" data-act="delOrder" data-id="'+p.id+'" data-o="'+o.id+'" aria-label="Apagar pedido">'+(ui.confirmDel===o.id?'Apagar?':'✕')+'</button>':'<span class="paid'+(o.paid?' on':'')+'">'+(o.paid?'Pago':'A pagar')+'</span>')+'</li>';
    });
    h+='</ul>';
    var by={};os.forEach(function(o){var k=o.size||'?';by[k]=(by[k]||0)+1;});
    h+='<p class="hint">Por tamanho: '+Object.keys(by).map(function(k){return k+' '+by[k];}).join(', ')+(ed?'. Arrecadado: '+money(paid*p.price)+' de '+money(os.length*p.price)+'.':'.')+'</p>';
  }else h+='<p class="hint">Nenhum pedido ainda.</p>';
  if(ed){
    h+='<div class="ordform"><input id="ordName" list="ordPlayers" type="text" maxlength="40" placeholder="Quem pediu"><datalist id="ordPlayers">'+S.players.map(function(pl){return '<option value="'+esc(pl.name)+'">';}).join('')+'</datalist>'+
      '<select id="ordSize" aria-label="Tamanho"><option value="">Tamanho</option>'+SIZES.map(function(s){return '<option>'+s+'</option>';}).join('')+'</select>'+
      '<input id="ordShirt" type="text" maxlength="20" placeholder="Nome na camisa"><button type="button" class="btn" data-act="addOrder" data-id="'+p.id+'">Anotar pedido</button></div>';
  }
  return h+'</details></div>';
}
var CATS={noticia:['📰','Notícia'],jogo:['🏟️','Jogo'],comunicado:['📢','Comunicado'],craque:['🏆','Craque da rodada'],murcha:['🎈','Bola murcha'],campeao:['👑','Campeão do mês'],resultado:['⚽','Resultado'],campanha:['🛍️','Novidade']};
function catOf(p){return p.kind==='campanha'?'campanha':p.cat;}
var PILL={todos:'Tudo',destaques:'Destaques',craque:'Craque',murcha:'Bola Murcha',campeao:'Campeão do Mês',noticia:'Notícias',jogo:'Jogos',resultado:'Resultados',comunicado:'Comunicados',campanha:'Novidades'};
var DEST=['craque','murcha','campeao'];
function catMatch(p,fc){return fc==='todos'||(fc==='destaques'?DEST.indexOf(catOf(p))>=0:catOf(p)===fc);}
/* data relativa: hoje, ontem, há 3 dias, há 2 semanas... */
function relDate(ts){
  var n=new Date(),d=new Date(ts),a=new Date(n.getFullYear(),n.getMonth(),n.getDate()),b=new Date(d.getFullYear(),d.getMonth(),d.getDate()),dd=Math.round((a-b)/864e5);
  if(dd<0)return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
  if(dd===0)return 'hoje';if(dd===1)return 'ontem';if(dd<7)return 'há '+dd+' dias';
  if(dd<30){var w=Math.floor(dd/7);return 'há '+w+' semana'+(w>1?'s':'');}
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
}
function postCard(p,ed){
  var hero=p.kind==='campanha',cat=catOf(p),full=new Date(p.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
  var h='<article class="post'+(hero?' campanha hero':'')+'" id="post-'+p.id+'">';
  if(hero)h+='<div class="hero-badge"><span aria-hidden="true">★</span>Novidade / Edição especial</div>';
  if(p.photos.length){
    h+='<div class="gallery n'+Math.min(p.photos.length,3)+'">';
    p.photos.forEach(function(u,i){h+='<button type="button" class="ph" data-act="openPhoto" data-id="'+p.id+'" data-i="'+i+'" aria-label="Ampliar foto '+(i+1)+'"><img src="'+u+'" alt="Foto '+(i+1)+' de '+esc(p.title||'publicação')+'"'+((hero||p.pinned)&&i===0?'':' loading="lazy"')+' decoding="async"></button>';});
    h+='</div>';
  }
  h+='<div class="post-in"><div class="kicker">'+(hero?'':'<span class="cat cat-'+cat+'">'+CATS[cat][0]+' '+CATS[cat][1]+'</span>')+(p.pinned?'<span class="pin">📌 Fixado</span>':'')+'<span class="when" title="'+esc(full)+'">'+relDate(p.date)+'</span><span class="by">Diretoria FDA</span></div><h2>'+esc(p.title||'Sem título')+'</h2>'+(p.body?'<div class="pbody">'+bodyHTML(p.body)+'</div>':'');
  if(p.links.length)h+='<div class="links">'+p.links.map(function(l){return '<a class="btn sm" href="'+esc(l.url)+'" target="_blank" rel="noopener noreferrer">▶ '+esc(l.label||'Ver vídeo')+'</a>';}).join('')+'</div>';
  if(p.kind==='campanha')h+=campaignBox(p,ed);
  if(ed)h+='<div class="btnrow"><button type="button" class="btn sm" data-act="editPost" data-id="'+p.id+'">Editar</button><button type="button" class="btn sm" data-act="copyPost" data-id="'+p.id+'">Copiar texto</button><button type="button" class="btn sm danger-t'+(ui.confirmDel===p.id?' sure':'')+'" data-act="delPost" data-id="'+p.id+'">'+(ui.confirmDel===p.id?'Toque de novo para apagar':'Apagar')+'</button></div>';
  else h+='<div class="btnrow"><button type="button" class="btn sm" data-act="copyPost" data-id="'+p.id+'">Copiar texto</button></div>';
  return h+'</div></article>';
}
/* ===== GALERIA: álbuns = publicações com fotos, por mês e por jogo/evento ===== */
/* ===== otimizar fotos já gravadas (diretoria) ===== */
function photoBytes(){var n=0;S.posts.forEach(function(p){p.photos.forEach(function(u){n+=u.length;});});return n;}
function mbTxt(n){return (n/1e6).toFixed(1).replace('.',',')+' MB';}
function optimizeUrl(u,maxSide,q){
  return new Promise(function(res){var im=new Image();im.onload=function(){try{var r=Math.min(1,maxSide/Math.max(im.width,im.height)),w=Math.round(im.width*r),h=Math.round(im.height*r),c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,w,h);x.drawImage(im,0,0,w,h);var o=c.toDataURL('image/webp',q);if(o.indexOf('data:image/webp')!==0)o=c.toDataURL('image/jpeg',q);res(o.length<u.length*0.9?o:u);}catch(e){res(u);}};im.onerror=function(){res(u);};im.src=u;});
}
function optimizePhotos(){
  if(ui.busy)return;var before=photoBytes();ui.busy=true;toast('Otimizando fotos…');
  var jobs=[];S.posts.forEach(function(p){p.photos.forEach(function(u,i){jobs.push(optimizeUrl(u,1000,0.72).then(function(o){p.photos[i]=o;}));});});
  Promise.all(jobs).then(function(){ui.busy=false;var after=photoBytes();change();toast('Fotos otimizadas: de '+mbTxt(before)+' para '+mbTxt(after)+'. Toque em Salvar para confirmar.');});
}
function albumCard(p){
  var n=p.photos.length,open=ui.albOpen===p.id,cat=catOf(p),show=open?p.photos:p.photos.slice(0,6),d=new Date(p.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
  var h='<article class="alb"><div class="alb-h"><span class="cat cat-'+cat+'">'+CATS[cat][0]+' '+CATS[cat][1]+'</span><h3>'+esc(p.title||'Sem título')+'</h3><small>'+d+' · '+n+' foto'+(n>1?'s':'')+'</small></div><div class="alb-g n'+(show.length>3?3:show.length)+'">';
  show.forEach(function(u,i){h+='<button type="button" class="ph" data-act="openPhoto" data-id="'+p.id+'" data-i="'+i+'" aria-label="Ampliar foto '+(i+1)+' de '+n+' do álbum '+esc(p.title||'')+'"><img src="'+u+'" alt="Foto '+(i+1)+' de '+n+' do álbum '+esc(p.title||'')+'" loading="lazy" decoding="async"></button>';});
  h+='</div>';
  if(n>6)h+='<button type="button" class="btn sm wide" data-act="albOpen" data-id="'+p.id+'" aria-expanded="'+open+'">'+(open?'Mostrar menos':'Ver todas as '+n+' fotos')+'</button>';
  return h+'</article>';
}
function viewGaleria(ed){
  var ps=S.posts.filter(function(p){return p.photos&&p.photos.length;}).sort(function(a,b){return b.date-a.date;}),groups={},order=[],tot=0;
  ps.forEach(function(p){tot+=p.photos.length;var k=monthKey(p.date);if(!groups[k]){groups[k]=[];order.push(k);}groups[k].push(p);});
  var h='<p class="meta center">'+tot+' foto'+(tot>1?'s':'')+' em '+ps.length+' álbum'+(ps.length>1?'s':'')+(ed?' · para adicionar fotos, crie uma publicação no Jornal':'')+'</p>';
  order.forEach(function(k){h+='<h2 class="mes-h">📷 '+monthLabel(k,true)+'</h2>';groups[k].forEach(function(p){h+=albumCard(p);});});
  return h;
}
function viewJornal(){
  var ed=canEditUi(),h='';
  if(ui.postDraft&&ed)return postEditor();
  h+=awardsTV();
  if(ed)h+='<button type="button" class="btn wide primary big-add" data-act="newPost">+ Nova publicação</button>';
  if(ed&&photoBytes()>250000)h+='<section class="card"><h2>Peso das fotos</h2><p class="hint">As fotos do Jornal ocupam <strong>'+mbTxt(photoBytes())+'</strong> e são baixadas por quem abre o site. Otimizar reduz o tamanho sem perda visual relevante e deixa o site mais rápido. Nada é salvo até você tocar em Salvar.</p><button type="button" class="btn wide" data-act="optPhotos"'+(ui.busy?' disabled':'')+'>Otimizar fotos do Jornal</button></section>';
  if(S.posts.some(function(p){return p.photos&&p.photos.length;}))h+='<div class="vtoggle" role="group" aria-label="Ver como"><button type="button" data-act="jView" data-v="pub" aria-pressed="'+(ui.jView!=='gal')+'">📰 Publicações</button><button type="button" data-act="jView" data-v="gal" aria-pressed="'+(ui.jView==='gal')+'">📷 Galeria</button></div>';
  if(ui.jView==='gal'&&S.posts.some(function(p){return p.photos&&p.photos.length;}))return h+viewGaleria(ed);
  if(!S.posts.length)return h+'<p class="empty">Nada publicado ainda. Aqui entram o jornal de cada domingo, as novidades e as fotos da galera.</p>';
  var fc=ui.jCat||'todos',fm=ui.jMes||'todos';
  var months=[];S.posts.forEach(function(p){var k=monthKey(p.date);if(months.indexOf(k)<0)months.push(k);});months.sort().reverse();
  var pills=['todos'].concat(['noticia','jogo','resultado','comunicado','destaques','craque','murcha','campeao','campanha'].filter(function(c){return S.posts.some(function(p){return catMatch(p,c);});}));
  h+='<div class="jfil"><div class="catpick" role="group" aria-label="Filtrar por tipo">'+pills.map(function(c){return '<button type="button" class="chip" data-act="jCat" data-k="'+c+'" aria-pressed="'+(fc===c)+'">'+PILL[c]+'</button>';}).join('')+'</div>'+
    '<label class="field"><span>📚 Edição</span><select data-act="jMes"><option value="todos">Todas as edições</option>'+months.map(function(k){return '<option value="'+k+'"'+(fm===k?' selected':'')+'>'+monthLabel(k,true)+'</option>';}).join('')+'</select></label></div>';
  var list=S.posts.filter(function(p){return catMatch(p,fc)&&(fm==='todos'||monthKey(p.date)===fm);});
  if(!list.length)return h+'<p class="empty">Nenhuma publicação com esse filtro.</p>';
  var pins=fc==='todos'&&fm==='todos'?list.filter(function(p){return p.pinned;}):[];
  pins.forEach(function(p){h+=postCard(p,ed);});
  var rest=list.filter(function(p){return pins.indexOf(p)<0;}).sort(function(a,b){return b.date-a.date;});
  var groups={},order=[];rest.forEach(function(p){var k=monthKey(p.date);if(!groups[k]){groups[k]=[];order.push(k);}groups[k].push(p);});
  order.forEach(function(k,i){
    var open=i===0||fm!=='todos'||fc!=='todos';
    if(open){h+='<h2 class="mes-h">📰 Edição de '+monthLabel(k)+'</h2>';groups[k].forEach(function(p){h+=postCard(p,ed);});}
    else{h+='<details class="arquivo"><summary>📚 Arquivo · '+monthLabel(k,true)+' ('+groups[k].length+' publicaç'+(groups[k].length>1?'ões':'ão')+')</summary>';groups[k].forEach(function(p){h+=postCard(p,ed);});h+='</details>';}
  });
  return h;
}
function postEditor(){
  var d=ui.postDraft,used=stateSize();
  var h='<section class="card editor"><h2>'+(d.isNew?'Nova publicação':'Editar publicação')+'</h2>';
  h+='<div class="period sm" role="group" aria-label="Tipo"><button type="button" data-act="pdKind" data-k="noticia" aria-pressed="'+(d.kind==='noticia')+'">Jornal</button><button type="button" data-act="pdKind" data-k="campanha" aria-pressed="'+(d.kind==='campanha')+'">Novidade com venda</button></div>';
  if(d.kind==='noticia')h+='<div class="field"><span>Categoria</span><div class="catpick">'+['noticia','jogo','comunicado','craque','murcha','campeao','resultado'].map(function(c){return '<button type="button" class="chip" data-act="pdCat" data-k="'+c+'" aria-pressed="'+(d.cat===c)+'">'+CATS[c][0]+' '+CATS[c][1]+'</button>';}).join('')+'</div></div>';
  h+='<label class="field"><span>Data da publicação</span><input type="date" id="pdDate" data-act="pdDate" value="'+isoDate(new Date(d.date))+'"></label>';
  h+='<label class="field"><span>Título</span><input type="text" maxlength="120" data-pd="title" value="'+esc(d.title)+'" placeholder="Ex.: Amarelo vira o jogo no fim"></label>';
  h+='<label class="field"><span>Texto</span><textarea rows="8" maxlength="6000" data-pd="body" placeholder="Conte como foi. Linha em branco separa parágrafos.">'+esc(d.body)+'</textarea></label>';
  if(d.kind==='noticia'&&S.history.length)h+='<button type="button" class="btn sm" data-act="draftFromGame">Preencher com os números da última pelada</button>';
  if(d.kind==='campanha'){
    h+='<div class="grid2"><label class="field"><span>Valor (R$)</span><input type="number" min="0" step="0.01" inputmode="decimal" data-pd="price" value="'+(d.price||'')+'"></label><label class="field"><span>Pagar até</span><input type="date" data-pd="deadline" value="'+(d.deadline||'')+'"></label></div>';
    h+='<label class="field"><span>Chave Pix</span><input type="text" maxlength="80" data-pd="pix" value="'+esc(d.pix||'')+'"></label>';
  }
  h+='<div class="field"><span>Fotos ('+d.photos.length+' de 6)</span><div class="thumbs">'+d.photos.map(function(u,i){return '<div class="thumb"><img src="'+u+'" alt=""><button type="button" data-act="pdPhotoDel" data-i="'+i+'" aria-label="Tirar foto">✕</button></div>';}).join('')+
    (d.photos.length<6?filePick('+ Foto','__post__','thumb add'):'')+'</div></div>';
  h+='<div class="field"><span>Vídeos (link do YouTube, Instagram, Google Drive…)</span>'+d.links.map(function(l,i){return '<div class="linkrow"><span>▶ '+esc(l.label||l.url)+'</span><button type="button" class="del" data-act="pdLinkDel" data-i="'+i+'" aria-label="Tirar vídeo">✕</button></div>';}).join('')+
    (d.links.length<4?'<div class="ordform"><input id="pdLinkUrl" type="url" placeholder="Cole o link do vídeo"><input id="pdLinkLabel" type="text" maxlength="60" placeholder="Nome (opcional)"><button type="button" class="btn" data-act="pdLinkAdd">Adicionar vídeo</button></div>':'')+'</div>';
  h+=pasteZone('__post__');
  h+='<label class="setting"><span>Fixar no topo e nos Avisos</span><input type="checkbox" class="sw" data-pdc="pinned"'+(d.pinned?' checked':'')+'></label>';
  h+='<p class="hint">Espaço usado: '+(used/1e6).toFixed(1).replace('.',',')+' MB de 9 MB. Cada foto ocupa cerca de 0,15 MB.</p>';
  h+='<div class="btnrow"><button type="button" class="btn primary" data-act="savePost">Publicar</button><button type="button" class="btn" data-act="cancelPost">Cancelar</button></div></section>';
  return h;
}
/* (viewJornal foi movida para o bloco do Jornal) */
function pinnedTeaser(){
  var pins=S.posts.filter(function(p){return p.pinned&&p.id!=='seed-festa-11-anos'&&noticeCurrent({text:p.title,expires:p.kind==='campanha'?p.deadline:''});});
  if(!pins.length)return '';
  return pins.map(function(p){
    var expired=p.kind==='campanha'&&daysTo(p.deadline)!==null&&daysTo(p.deadline)<0;
    return '<button type="button" class="teaser" data-act="goPost" data-id="'+p.id+'">'+(p.photos[0]?'<img src="'+p.photos[0]+'" alt="">':'')+'<span class="tt"><small>'+(p.kind==='campanha'?'Novidade':'Jornal')+'</small><strong>'+esc(p.title)+'</strong>'+(p.kind==='campanha'?'<span>'+money(p.price)+(p.deadline?' · '+(expired?'encerrada em ':'pagar até ')+dlabel(p.deadline):'')+'</span>':'')+'<span class="more">Ver detalhes</span></span></button>';
  }).join('');
}
function postText(p){
  var L=['📰 *'+p.title+'*',''];if(p.body)L.push(p.body,'');
  if(p.kind==='campanha'){L.push('💰 Valor: '+money(p.price));if(p.deadline)L.push('📅 Pagar até: '+dlabel(p.deadline));if(p.pix)L.push('🔑 Pix: '+p.pix);L.push('');}
  p.links.forEach(function(l){L.push('▶ '+(l.label?l.label+': ':'')+l.url);});
  return L.join('\n').trim();
}
function gameDraft(){
  var g=S.history[0];if(!g)return '';
  var d=new Date(g.date).toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'});
  var agg=aggregate([g]),L=['Resumo da pelada de '+d+'.',''];
  var gs=agg.filter(function(x){return x.g;}).sort(function(a,b){return b.g-a.g;});
  if(gs.length)L.push('Gols: '+gs.map(function(x){return x.p.name+(x.g>1?' ('+x.g+')':'');}).join(', ')+'.');
  var as=agg.filter(function(x){return x.a;}).sort(function(a,b){return b.a-a.a;});
  if(as.length)L.push('Assistências: '+as.map(function(x){return x.p.name+(x.a>1?' ('+x.a+')':'');}).join(', ')+'.');
  var cs=agg.filter(function(x){return x.y||x.r;});
  if(cs.length)L.push('Cartões: '+cs.map(function(x){return x.p.name+(x.r?' (vermelho)':' (amarelo)');}).join(', ')+'.');
  L.push('');
  if(g.cheia)L.push('🏆 Bola cheia: '+gameName(g,g.cheia)+'.');
  if(g.murcha)L.push('🎈 Bola murcha: '+gameName(g,g.murcha)+'.');
  return L.join('\n').trim();
}
function readBig(file){
  return new Promise(function(res,rej){
    if(!file)return rej('tipo');
    var fr=new FileReader();fr.onerror=function(){rej('ler');};
    fr.onload=function(){var img=new Image();img.onerror=function(){rej('ler');};img.onload=function(){
      try{var W=img.naturalWidth,H=img.naturalHeight;if(!W||!H)return rej('ler');
      var sc=Math.min(1,1100/Math.max(W,H)),w=Math.round(W*sc),h=Math.round(H*sc);
      var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);
      var q=0.72,u=c.toDataURL('image/jpeg',q);while(u.length>400000&&q>0.35){q-=0.1;u=c.toDataURL('image/jpeg',q);}res(u);}catch(e){rej('ler');}};
      img.src=fr.result;};
    fr.readAsDataURL(file);
  });
}
function openPost(id){ui.tab='lances';ui.lancesView='jornal';ui.tabTouched=true;render();setTimeout(function(){var el=document.getElementById('post-'+id);if(el)el.scrollIntoView({block:'start'});},30);}

function findGame(id){for(var i=0;i<S.history.length;i++)if(S.history[i].id===id)return S.history[i];return null;}

var VIDEO_CATEGORIES={lance:'Lance',gol:'Gol',resenha:'Resenha'};
var VIDEO_BUCKET='fda-videos';
var videoLibrary={items:null,busy:false,error:false};
function secureVideoLink(value){
  try{
    var url=new URL(value);
    return url.protocol==='https:'&&!url.username&&!url.password&&url.href.length<=500?url.href:'';
  }catch(e){return '';}
}
function youtubeId(link){
  if(!link)return '';
  var url=new URL(link),id='';
  if(url.hostname==='youtu.be')id=url.pathname.split('/')[1];
  if(['youtube.com','www.youtube.com','m.youtube.com'].includes(url.hostname)){
    id=url.pathname==='/watch'?url.searchParams.get('v'):url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
  }
  return /^[\w-]{11}$/.test(id||'')?id:'';
}
function loadVideoLibrary(force){
  if(videoLibrary.busy||(!force&&(videoLibrary.items||videoLibrary.error)))return;
  videoLibrary.busy=true;
  var wasError=videoLibrary.error,updated=false;
  return fetch(CFG.url+'/rest/v1/fda_videos?select=id,titulo,descricao,categoria,url,arquivo,criado_em&order=criado_em.desc,id.desc&limit=100',{cache:'no-store',headers:{apikey:CFG.chave}})
    .then(function(response){if(!response.ok)throw Error('Videoteca indisponível');return response.json();})
    .then(function(items){
      if(!Array.isArray(items))throw Error('Resposta inválida');
      updated=JSON.stringify(items)!==JSON.stringify(videoLibrary.items);
      videoLibrary.items=items;videoLibrary.error=false;
    })
    .catch(function(){videoLibrary.error=true;})
    .finally(function(){
      videoLibrary.busy=false;
      if((updated||wasError!==videoLibrary.error)&&!ui.videoSaving&&!ui.videoDraft&&!publicVideoOpen()&&['tv','lances'].includes(ui.tab))render();
    });
}
function videoItems(){
  var items=(videoLibrary.items||[]).slice();
  var seen=new Set(items.map(function(item){return secureVideoLink(item.url);}).filter(Boolean));
  S.posts.forEach(function(post){
    post.links.forEach(function(link,i){
      var url=secureVideoLink(link.url);
      if(!url||seen.has(url))return;
      seen.add(url);
      items.push({id:'post-'+post.id+'-'+i,titulo:link.label||post.title||'Vídeo do Jornal',descricao:'',categoria:post.cat==='murcha'?'resenha':'lance',url:url});
    });
  });
  return items;
}
function videoCard(item){
  var id=esc(item.id),link=secureVideoLink(item.url),youtube=youtubeId(link);
  var uploaded=/^[0-9a-f-]{36}\.(mp4|webm)$/.test(item.arquivo||'');
  var opened=ui.playVideo===item.id;
  var media=uploaded&&opened?'<video controls playsinline preload="metadata" src="'+esc(CFG.url+'/storage/v1/object/public/'+VIDEO_BUCKET+'/'+item.arquivo)+'"></video>':
    youtube&&opened?'<iframe src="https://www.youtube-nocookie.com/embed/'+youtube+'" title="'+esc(item.titulo)+'" allow="fullscreen; encrypted-media" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>':
    (uploaded||youtube?'<button class="video-cover" type="button" data-act="playVideo" data-id="'+id+'" aria-label="Assistir '+esc(item.titulo)+'"><span aria-hidden="true">▶</span>Assistir aqui</button>':
      (link?'<a class="video-cover" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">↗</span>Abrir vídeo original</a>':''));
  var managed=!item.id.startsWith('post-')&&canEditUi();
  return '<article class="card video-card">'+media+'<div class="video-copy"><small>'+esc(VIDEO_CATEGORIES[item.categoria]||'Lance')+'</small><h3>'+esc(item.titulo)+'</h3>'+
    (item.descricao?'<p>'+esc(item.descricao)+'</p>':'')+(opened?'<button type="button" class="btn sm" data-act="closeVideo">Fechar vídeo</button>':'')+(managed?'<div class="btnrow tight"><button type="button" class="btn sm" data-act="editVideo" data-id="'+id+'">Editar vídeo</button>'+
    '<button type="button" class="btn sm danger-t" data-act="removeVideo" data-id="'+id+'">'+(ui.confirmVideo===item.id?'Confirmar remoção':'Remover')+'</button></div>':'')+'</div></article>';
}
function videoEditor(){
  var d=ui.videoDraft||{};
  return '<form class="card video-editor" id="video-editor"><h3>'+(d.id?'Editar vídeo':'Publicar vídeo')+'</h3>'+
    '<label class="field">Título<input name="titulo" required maxlength="100" value="'+esc(d.titulo||'')+'"></label>'+
    '<label class="field">Descrição<textarea name="descricao" maxlength="400" rows="2">'+esc(d.descricao||'')+'</textarea></label>'+
    '<label class="field">Categoria<select name="categoria">'+Object.entries(VIDEO_CATEGORIES).map(function([key,label]){return '<option value="'+key+'"'+(d.categoria===key?' selected':'')+'>'+label+'</option>';}).join('')+'</select></label>'+
    (d.arquivo?'<p>Arquivo já publicado. Para substituir, cadastre outro vídeo.</p>':
      '<label class="field">Link do YouTube, Instagram ou outro vídeo<input name="url" type="url" maxlength="500" value="'+esc(d.url||'')+'"></label>')+
    (!d.id?'<label class="field">Ou envie um arquivo MP4 ou WebM de até 25 MB<input name="arquivo" type="file" accept="video/mp4,video/webm,.mp4,.webm"></label>':'')+
    '<div class="btnrow"><button class="btn primary" type="submit">'+(d.id?'Salvar vídeo':'Publicar na videoteca')+'</button><button class="btn" type="button" data-act="cancelVideo">Cancelar</button></div><p class="video-status" role="status"></p></form>';
}
async function publishVideo(form){
  if(!canEditUi()||!SB||!ui.videoDraft||ui.videoSaving)return;
  var values=new FormData(form),draft=ui.videoDraft,input=values.get('arquivo');
  var titulo=String(values.get('titulo')||'').trim(),descricao=String(values.get('descricao')||'').trim(),categoria=String(values.get('categoria')||'');
  var rawUrl=String(values.get('url')||'').trim(),url=secureVideoLink(rawUrl),arquivo=draft.arquivo||null,created=null;
  var file=input&&input.size?input:null,kind=file&&file.type;
  var status=form.querySelector('.video-status');
  if(!titulo||!VIDEO_CATEGORIES[categoria]){status.textContent='Preencha o título e a categoria.';return;}
  if(rawUrl&&!url){status.textContent='Use um link HTTPS completo.';return;}
  if(!arquivo&&Number(!!url)+Number(!!file)!==1){status.textContent='Escolha um arquivo ou informe um link.';return;}
  if(file&&(!['video/mp4','video/webm'].includes(kind)||file.size>26214400)){status.textContent='Envie MP4 ou WebM de até 25 MB.';return;}
  ui.videoSaving=true;status.textContent=file?'Enviando vídeo…':'Salvando…';
  form.querySelectorAll('button').forEach(function(button){button.disabled=true;});
  try{
    if(file){
      created=window.crypto.randomUUID()+(kind==='video/mp4'?'.mp4':'.webm');
      var upload=await SB.storage.from(VIDEO_BUCKET).upload(created,file,{contentType:kind,upsert:false});
      if(upload.error){created=null;throw upload.error;}
      arquivo=created;
    }
    var row={titulo:titulo,descricao:descricao,categoria:categoria,url:arquivo?null:url,arquivo:arquivo};
    var request=draft.id?SB.from('fda_videos').update(row).eq('id',draft.id):SB.from('fda_videos').insert(row);
    var result=await request.select('id').single();
    if(result.error)throw result.error;
    ui.videoDraft=null;created=null;
    loadVideoLibrary(true);
    toast(draft.id?'Vídeo atualizado.':'Vídeo publicado na videoteca.');
  }catch(err){
    if(created)try{await SB.storage.from(VIDEO_BUCKET).remove([created]);}catch(cleanup){}
    status.textContent='Não foi possível salvar o vídeo. Confira a conexão, o limite e sua permissão.';
  }finally{
    ui.videoSaving=false;
    form.querySelectorAll('button').forEach(function(button){button.disabled=false;});
  }
}
async function removeVideo(id){
  if(!canEditUi()||!SB||ui.videoSaving)return;
  var item=(videoLibrary.items||[]).find(function(v){return v.id===id;});
  if(!item)return;
  if(ui.confirmVideo!==id){ui.confirmVideo=id;render();return;}
  ui.videoSaving=true;
  try{
    var removed=await SB.from('fda_videos').delete().eq('id',id).select('id').single();
    if(removed.error)throw removed.error;
    var stored=item.arquivo?await SB.storage.from(VIDEO_BUCKET).remove([item.arquivo]):null;
    ui.confirmVideo=null;
    loadVideoLibrary(true);
    toast(stored&&stored.error?'Vídeo removido da lista. O arquivo ainda está no armazenamento.':'Vídeo removido.');
  }catch(error){toast('Não foi possível remover o vídeo.');}
  finally{ui.videoSaving=false;}
}
function viewLances(){
  var journal=ui.lancesView==='jornal',ed=canEditUi();
  var h='<header class="portal-heading"><h2>Resenha &amp; Lances</h2><p>Vídeos e notícias das rodadas.</p></header><div class="btnrow">'+
    '<button type="button" class="chip" data-act="lancesView" data-v="videos" aria-pressed="'+!journal+'">Vídeos</button>'+
    '<button type="button" class="chip" data-act="lancesView" data-v="jornal" aria-pressed="'+journal+'">Jornal</button></div>';
  if(journal)return h+viewJornal();
  if(ed)h+=ui.videoDraft?videoEditor():'<button class="btn primary" type="button" data-act="newVideo">Subir vídeo ou adicionar link</button>';
  var selected=ui.videoFilter||'todos';
  h+='<div class="catpick" role="group" aria-label="Tipos de vídeo">'+Object.entries({todos:'Todos',...VIDEO_CATEGORIES}).map(function([key,label]){return '<button type="button" class="chip" data-act="videoFilter" data-v="'+key+'" aria-pressed="'+(selected===key)+'">'+label+'</button>';}).join('')+'</div>';
  var items=videoItems().filter(function(item){return selected==='todos'||item.categoria===selected;});
  if(videoLibrary.error)h+='<p class="hint">A videoteca não respondeu. <button class="link" data-act="retryVideos">Tentar de novo</button></p>';
  return h+(items.length?'<div class="video-grid">'+items.map(videoCard).join('')+'</div>':
    '<p class="empty">'+(videoLibrary.busy?'Carregando vídeos…':'Nenhum vídeo nesta categoria.')+'</p>');
}
function viewTV(){
  var items=videoItems();
  var featured=items.find(function(item){return item.categoria==='gol';})||items[0];
  return '<section id="fda-screen" class="tv-screen"><header class="portal-heading"><div><h2>FDA TV</h2><p>Placar, destaques e vídeos da pelada.</p></div><button type="button" class="btn" data-act="tvFullscreen">Modo telão</button></header>'+
    latestResultHTML()+weeklyHighlightsHTML()+awardsTV()+(featured?'<h3>Em destaque</h3>'+videoCard(featured):'')+
    '<button type="button" class="btn" data-act="tab" data-tab="lances">Abrir videoteca</button></section>';
}
function scoutParticipation(games,month){
  var total=0,counts=new Map();
  games.forEach(function(game){
    if(!game.cob.e||game.adv||dateBR(game.date).slice(0,7)!==month||!game.teams[0]?.length||!game.teams[1]?.length)return;
    total++;
    var sides=game.teams.slice(0,2).map(function(team){return new Set(team.map(function(id){return rid(game,id);}));});
    sides.forEach(function(team,i){
      team.forEach(function(id){
        if(sides[1-i].has(id))return;
        var pair=counts.get(id)||[0,0];
        pair[i]++;
        counts.set(id,pair);
      });
    });
  });
  return {total:total,counts:counts};
}
function viewScouts(){
  var ed=canEditUi(),tab=ui.scoutView||'elenco';
  var h='<header class="portal-heading"><h2>Elenco &amp; Scouts</h2><p>'+S.players.length+' atletas cadastrados · '+S.history.length+' jogos no histórico</p></header><div class="btnrow">'+
    Object.entries({elenco:'Elenco',scout:'Comparar atletas',ranking:'Ranking',...(ed?{editar:'Editar elenco'}:{})}).map(function([key,label]){
      return '<button type="button" class="chip" data-act="scoutView" data-v="'+key+'" aria-pressed="'+(tab===key)+'">'+label+'</button>';
    }).join('')+'</div>';
  if(tab==='ranking')return h+viewRanking();
  if(tab==='editar'&&ed)return h+viewJogadores();
  var players=S.players.slice().sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR');});
  var stats=new Map(aggregate(S.history).map(function(row){return [row.id,row];}));
  var value=function(id,key,covered){var row=stats.get(id);return row&&(!covered||row[covered]>0)?row[key]:'—';};
  if(tab==='scout'){
    var ids=ui.compared||[];
    h+='<div class="card"><div class="grid2">'+[0,1].map(function(i){
      return '<label class="field">Atleta '+(i+1)+'<select data-act="comparePlayer" data-i="'+i+'"><option value="">Selecione</option>'+players.map(function(p){return '<option value="'+esc(p.id)+'"'+(ids[i]===p.id?' selected':'')+'>'+esc(p.name)+'</option>';}).join('')+'</select></label>';
    }).join('')+'</div>';
    if(byId(ids[0])&&byId(ids[1])&&ids[0]!==ids[1])h+='<div class="scout-data"><table><thead><tr><th scope="col">Estatística</th>'+ids.map(function(id){return '<th scope="col">'+esc(byId(id).name)+'</th>';}).join('')+'</tr></thead><tbody>'+
      [['Jogos','j'],['Gols','g','jG'],['Assistências','a','jA'],['Vitórias','w','jp'],['Bola Cheia','c'],['Bola Murcha','m']].map(function([label,key,coverage]){
        return '<tr><th scope="row">'+label+'</th>'+ids.map(function(id){return '<td>'+value(id,key,coverage)+'</td>';}).join('')+'</tr>';
      }).join('')+'</tbody></table></div><p class="hint">— indica dado sem registro.</p>';
    return h+'</div>';
  }
  var currentMonth=dateBR().slice(0,7), month=ui.scoutMonth||currentMonth;
  var months=Array.from(new Set([currentMonth].concat(Object.keys(S.meses),S.history.map(function(g){return dateBR(g.date).slice(0,7);}))));
  months.sort().reverse();
  var teams=monthTeams(month)||[],filter=ui.scoutPosition||'',query=norm(ui.scoutName||'');
  var participation=scoutParticipation(S.history,month);
  h+='<div class="scout-filters"><label class="field">Buscar atleta<input id="scout-name" type="search" value="'+esc(ui.scoutName||'')+'"></label><label class="field">Posição<select data-act="scoutPosition">'+
    POS.map(function([key,label]){return '<option value="'+key+'"'+(key===filter?' selected':'')+'>'+esc(key?label:'Todas')+'</option>';}).join('')+'</select></label>'+
    '<label class="field">Mês da escalação<select data-act="scoutMonth">'+months.map(function(key){return '<option value="'+key+'"'+(key===month?' selected':'')+'>'+esc(monthLabel(key,true))+'</option>';}).join('')+'</select></label></div>'+
    '<p class="scout-legend">'+(participation.total?
      'O preenchimento mostra a presença em '+participation.total+' '+(participation.total===1?'jogo com escalação registrada':'jogos com escalação registrada')+' no mês.':
      'O mês ainda não tem jogos com escalação registrada. A cor do card indica a escalação confirmada.')+'</p>';
  var filtered=players.filter(function(p){return (!filter||p.pos===filter)&&(!query||norm(p.name).includes(query));});
  return h+(filtered.length?'<div class="scout-grid">'+filtered.map(function(p){
    var t=teams.findIndex(function(team){return team.includes(p.id);});
    var [red,green]=participation.counts.get(p.id)||[0,0];
    var redFill=participation.total?red/participation.total*100:0;
    var greenFill=participation.total?green/participation.total*100:0;
    var teamLabel=t>=0?COLORS[t%COLORS.length].n:'Sem time confirmado';
    var side=t===0?' scout-red':t===1?' scout-green':'';
    return '<article class="card scout-card'+side+'" style="--red-fill:'+redFill+'%;--all-fill:'+(redFill+greenFill)+'%">'+
      '<header>'+kitAvatar(p,48,t)+'<div><h3>'+nameLink(p,p.id)+'</h3><small>'+esc(POSSHORT[p.pos]||'Posição sem registro')+(p.num?' · #'+p.num:'')+'</small></div></header>'+
      '<span class="scout-team-label">'+esc(teamLabel)+'</span>'+
      (participation.total?'<div class="scout-participation"><span><i class="scout-dot red"></i>Vermelho <b>'+red+'</b></span><span><i class="scout-dot green"></i>Verde <b>'+green+'</b></span>'+
        '<div class="scout-meter" aria-hidden="true"></div></div>':'')+
      '<dl aria-label="Estatísticas do histórico"><div><dt>Jogos</dt><dd>'+value(p.id,'j')+'</dd></div><div><dt>Gols</dt><dd>'+value(p.id,'g','jG')+'</dd></div><div><dt>Assist.</dt><dd>'+value(p.id,'a','jA')+'</dd></div></dl></article>';
  }).join('')+'</div>':'<p class="empty">Nenhum atleta encontrado.</p>');
}
function pageContent(){
  if(ui.perfil||profileFromURL())return viewPerfil(ui.perfil||profileFromURL());
  var views={avisos:viewAvisos,tv:viewTV,lances:viewLances,jogadores:viewScouts,ranking:viewRanking,jornal:viewJornal,jogos:viewJogos,times:function(){return teamsBlock(false);}};
  if(canEditUi()){
    views.elenco=viewJogadores;views.configuracoes=viewSettings;
    views.sorteio=viewSorteio;views.votacao=viewVotacao;
    if(ui.manageAccess)views.acessos=viewAccess;
  }
  return Object.hasOwn(views,ui.tab)?views[ui.tab]():viewAvisos();
}
function render(){
  if(ui.picking){ui.pendingRender=true;return;}
  var app=document.getElementById('app');if(!app)return;
  document.title=(SITE==='diretoria'?'Diretoria · ':'')+S.info.name;
  var active=document.activeElement,keep=active&&active.id&&active.type!=='file'&&active.type!=='password'&&active.closest&&active.closest('#app')&&(active.tagName==='INPUT'||active.tagName==='TEXTAREA')?{id:active.id,v:active.value,s:active.selectionStart}:null;
  if((!canEditUi()&&directorTabs.includes(ui.tab))||(ui.tab==='acessos'&&!ui.manageAccess))ui.tab='avisos';
  if(ui.fatal||ui.login||ui.loading){app.innerHTML=header(true)+'<main>'+(ui.fatal?'<div class="card center-card"><h2>Ops</h2><p>'+esc(ui.fatal)+'</p><button type="button" class="btn primary wide" data-act="retry">Tentar de novo</button></div>':ui.login?loginView():'<div class="loading" role="status"><span class="ball" aria-hidden="true">⚽</span>Carregando…</div>')+'</main>'+(ui.toast?'<div class="toast" role="status">'+esc(ui.toast)+'</div>':'');return;}
  var body=pageContent();
  var fullScore=canEditUi()&&ui.tab==='jogos'&&ui.livePanel&&!ui.perfil;
  var h='<a class="skip" href="#conteudo">Pular para o conteúdo</a>'+header(!!fullScore);
  if(ui.offline)h+='<div class="offline-note" role="status">'+
    (localSnapshotRequested()?'<span>Prévia local</span>':'<span>Exibindo a última cópia disponível.</span><button type="button" class="link" data-act="retry">Tentar sincronizar</button>')+'</div>';
  if(ui.recover)h+='<div class="banner"><span>Outra versão foi salva. Você pode copiar seu rascunho para consultar antes de refazer as alterações.</span><div class="btnrow tight"><button type="button" class="btn sm primary" data-act="recover">Copiar rascunho</button><button type="button" class="btn sm" data-act="discard">Descartar</button></div></div>';
  if(ui.preview)h+='<div class="banner"><span>Você está vendo o app como um atleta vê.</span><button type="button" class="btn sm primary" data-act="preview">Voltar ao modo diretoria</button></div>';
  else if(SITE==='diretoria'&&mode==='shared')h+='<div class="banner muted dir"><span>🔒 Área da diretoria'+(ui.user?' · '+esc(ui.user):'')+'</span><button type="button" class="link" data-act="logout">'+(ui.confirmLogout?'Há alterações não salvas. Toque de novo para sair mesmo assim':'Sair')+'</button></div>';
  else if(canEditUi()&&S.players.length&&ui.tab!=='avisos')h+='';
  h+='<main id="conteudo" tabindex="-1">'+(canEditUi()&&!fullScore?quickAdmin():'')+body+'</main>'+footerHTML();
  if(dirty&&canEditUi())h+='<div class="savebar"><span>Alterações não salvas</span><button type="button" class="btn primary" data-act="save"'+(ui.busy?' disabled':'')+'>'+(ui.busy?'Salvando…':mode==='local'?'Salvar neste aparelho':'Salvar')+'</button></div>';
  if(ui.copyText!=null)h+='<div class="modal" role="dialog" aria-modal="true" aria-label="Copiar texto"><div class="modal-in"><h2>Copie o texto</h2><p class="hint">O navegador bloqueou a cópia automática. Selecione e copie abaixo.</p><textarea id="copyta" rows="10" readonly>'+esc(ui.copyText)+'</textarea><button type="button" class="btn primary" data-act="closeCopy">Fechar</button></div></div>';
  if(ui.lightbox){var lp=findPost(ui.lightbox.id);var lu=lp&&lp.photos[ui.lightbox.i];if(lu)h+='<div class="modal lb" role="dialog" aria-modal="true" aria-label="Foto"><img src="'+lu+'" alt=""><div class="lbnav">'+(lp.photos.length>1?'<button type="button" class="btn" data-act="lbStep" data-d="-1">‹</button><span>'+(ui.lightbox.i+1)+' / '+lp.photos.length+'</span><button type="button" class="btn" data-act="lbStep" data-d="1">›</button>':'')+'<button type="button" class="btn primary" data-act="closePhoto">Fechar</button></div></div>';}
  if(ui.photoSheet){var sp=byId(ui.photoSheet);if(sp){var ed2=canEditUi();h+='<div class="modal" role="dialog" aria-modal="true" aria-label="Foto de '+esc(sp.name)+'"><div class="modal-in sheet">'+avatar(sp,160)+'<h2>'+esc(sp.name)+'</h2>'+(sp.pos?'<p class="hint">'+POS.filter(function(o){return o[0]===sp.pos;})[0][1]+'</p>':'')+
    (ed2?filePick(sp.photo?'📷 Trocar foto':'📷 Escolher foto',sp.id,'btn primary wide')+pasteZone(sp.id)+(sp.photo?'<button type="button" class="btn wide danger-t" data-act="photoDel" data-id="'+sp.id+'">Remover foto</button>':''):'')+
    '<button type="button" class="btn wide" data-act="closeSheet">Fechar</button></div></div>';}}
  if(ui.toast)h+='<div class="toast" role="status">'+esc(ui.toast)+'</div>';
  app.innerHTML=h;
  (function(){var tb=app.querySelector('.tabs');if(tb){var a=tb.querySelector('[aria-current="page"]');if(a)tb.scrollLeft=Math.max(0,a.offsetLeft-(tb.clientWidth-a.offsetWidth)/2);}})();
  Array.prototype.forEach.call(app.querySelectorAll('input[data-pickfor]'),function(el){el.addEventListener('change',onPick);});
  if(keep){var el=document.getElementById(keep.id);if(el){el.value=keep.v;el.focus();try{el.setSelectionRange(keep.s,keep.s);}catch(e){}}}
}

/* ---------- eventos ---------- */
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-act]');if(!b||b.disabled||ui.liveBusy)return;
  var a=b.dataset.act,id=b.dataset.id;
  if(['del','delHist','delNotice','delPost','delOrder','vDel'].indexOf(a)<0)ui.confirmDel=null;
  if(a!=='vFinal')ui.confirmFin=false;
  if(a!=='clearHist')ui.confirmClear=false;
  switch(a){
    case 'perfil':{
      if(b.tagName==='A'&&(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey))return;
      e.preventDefault();ui.perfil=id;ui.perfilFrom=window.scrollY;
      if(location.hash!==profileHash(id))history.pushState({fdaProfile:true},'',profileHash(id));
      render();window.scrollTo(0,0);break;}
    case 'perfilBack':ui.perfil=null;
      if(profileFromURL())history.replaceState(null,'',location.pathname+location.search);
      render();window.scrollTo(0,ui.perfilFrom||0);break;
    case 'tab':{
      var target=b.dataset.tab;
      if((!canEditUi()&&directorTabs.includes(target))||(target==='acessos'&&!ui.manageAccess))break;
      ui.perfil=null;if(profileFromURL())history.replaceState(null,'',location.pathname+location.search);
      if(target!=='jogos')ui.livePanel=null;
      ui.tab=target;ui.tabTouched=true;ui.sel=null;ui.editPlayer=null;ui.playVideo=null;
      if(target==='acessos'&&!ui.accessRows)loadAccess();
      if(['tv','lances'].includes(target))loadVideoLibrary(false);
      render();window.scrollTo(0,0);break;}
    case 'lancesView':ui.lancesView=b.dataset.v==='jornal'?'jornal':'videos';render();break;
    case 'openJournal':ui.tab='lances';ui.lancesView='jornal';ui.tabTouched=true;render();window.scrollTo(0,0);break;
    case 'videoFilter':ui.videoFilter=b.dataset.v;ui.playVideo=null;render();break;
    case 'retryVideos':loadVideoLibrary(true);render();break;
    case 'playVideo':ui.playVideo=id;render();break;
    case 'closeVideo':ui.playVideo=null;render();refreshPublic();break;
    case 'scoutView':ui.scoutView=b.dataset.v;render();break;
    case 'newVideo':if(canEditUi()){ui.videoDraft={};render();document.getElementById('video-editor')?.scrollIntoView({block:'nearest'});}break;
    case 'editVideo':if(canEditUi()){ui.videoDraft=(videoLibrary.items||[]).find(function(item){return item.id===id;});ui.tab='lances';ui.lancesView='videos';render();document.getElementById('video-editor')?.scrollIntoView({block:'nearest'});}break;
    case 'cancelVideo':if(!ui.videoSaving){ui.videoDraft=null;render();}break;
    case 'removeVideo':removeVideo(id);break;
    case 'tvFullscreen':{
      var screen=document.getElementById('fda-screen');
      if(!screen)break;
      if(document.fullscreenElement){document.exitFullscreen();break;}
      if(screen.requestFullscreen)screen.requestFullscreen().catch(function(){toast('Este navegador não permite o modo telão.');});
      else toast('O modo telão não está disponível neste navegador.');
      break;}
    case 'openLineup':ui.perfil=null;ui.tab='times';ui.tabTouched=true;ui.publicTeamsMonth=b.dataset.month;render();window.scrollTo(0,0);break;
    case 'partyPix':{
      var event=S.info.festa||FESTA_11;
      if(dateBR()>event.deadline)break;
      if(!navigator.clipboard?.writeText){copy(event.pix);break;}
      navigator.clipboard.writeText(event.pix).then(function(){ui.partyCopied=true;b.textContent='Chave PIX Copiada!';},function(){copy(event.pix);});break;}
    case 'voiceStart':startVoice(findGame(b.dataset.g));break;
    case 'voiceParse':{
      var game=findGame(b.dataset.g),input=document.getElementById('voice-transcript');
      if(!canEditUi()||!game||!input||voiceRecognition)break;
      var transcribed=input.value.trim().slice(0,1600);
      ui.voice={game:game.id,text:transcribed,result:parseVoice(transcribed,game)};
      render();break;}
    case 'voiceApply':applyVoice(findGame(b.dataset.g)).catch(function(){toast('Não foi possível aplicar a transcrição.');});break;
    case 'playerCard':downloadPlayerCard(byId(id)).catch(function(){toast('Não foi possível gerar o card.');});break;
    case 'inlineRoster':ui.inlineRoster=!ui.inlineRoster;render();break;
    case 'inlineNotice':if(canEditUi()){ui.perfil=null;ui.tab='avisos';render();document.getElementById('notices-section')?.scrollIntoView();}break;
    case 'tv-next':rotateAwards();break;
    case 'tv-pause':ui.tvPaused=!ui.tvPaused;b.setAttribute('aria-pressed',String(ui.tvPaused));break;
    case 'tv-download':downloadAwardPoster(findGame(b.dataset.g),b.dataset.k).catch(function(){toast('Não consegui gerar o cartaz. Tente novamente.');});break;
    case 'add':{var r=addPlayer(document.getElementById('newname').value,3,document.getElementById('newpos').value);
      if(r==='empty')toast('Digite o nome do jogador.');else if(r==='dup')toast('Já existe um jogador com esse nome.');else{document.getElementById('newname').value='';change();var nn=document.getElementById('newname');if(nn)nn.focus();}break;}
    case 'bulk':{var ta=document.getElementById('bulk');var res=parseBulk(ta?ta.value:'');ui.bulkMsg=res.added+' adicionado'+(res.added===1?'':'s')+(res.dup?', '+res.dup+' já estava'+(res.dup===1?'':'m')+' na lista':'')+'.';if(ta)ta.value='';if(res.added)change();else render();break;}
    case 'star':{var p=byId(id);if(!p)break;var k=+b.dataset.k;p.stars=p.stars===k?Math.max(0.5,k-0.5):k;change();break;}
    case 'del':{if(ui.confirmDel!==id){ui.confirmDel=id;render();break;}
      S.players=S.players.filter(function(p){return p.id!==id;});S.present=S.present.filter(function(x){return x!==id;});
      if(S.current){S.current.teams=S.current.teams.map(function(t){return t.filter(function(x){return x!==id;});});}
      ui.confirmDel=null;change();break;}
    case 'presence':{var i=S.present.indexOf(id);if(i>=0)S.present.splice(i,1);else S.present.push(id);updateDrawPresence();break;}
    case 'all':S.present=S.players.map(function(p){return p.id;});updateDrawPresence();break;
    case 'none':S.present=[];updateDrawPresence();break;
    case 'teams':S.settings.teams=Math.min(6,Math.max(2,S.settings.teams+(+b.dataset.d)));change();break;
    case 'starters':S.settings.starters=Math.min(11,Math.max(3,S.settings.starters+(+b.dataset.d)));change();break;
    case 'look':S.settings.lookback=Math.min(8,Math.max(1,S.settings.lookback+(+b.dataset.d)));change();break;
    case 'draw':clearTimeout(drawTimer);doDraw();break;
    case 'confirm':confirmDraw();break;
    case 'share':copy(shareText());break;
    case 'pick':{
      if(!ui.sel||ui.sel===id){ui.sel=ui.sel===id?null:id;render();break;}
      var ta2=-1,tb=-1;S.current.teams.forEach(function(t,ti){if(t.indexOf(ui.sel)>=0)ta2=ti;if(t.indexOf(id)>=0)tb=ti;});
      if(ta2<0||tb<0||ta2===tb){ui.sel=id;render();break;}
      var A=S.current.teams[ta2],B=S.current.teams[tb];A[A.indexOf(ui.sel)]=id;B[B.indexOf(id)]=ui.sel;
      ui.sel=null;S.current.confirmed=false;change();break;}
    case 'save':save();break;
    case 'recover':if(canEditUi()&&ui.recover)copy(JSON.stringify(ui.recover.state,null,2));break;
    case 'discard':ui.recover=null;lsDel(DRAFT_KEY);render();break;
    case 'delHist':{if(findGame(id)?.live){toast('Encerre a transmissão antes de apagar a partida.');break;}if(ui.confirmDel!==id){ui.confirmDel=id;render();break;}
      S.history=S.history.filter(function(h){return h.id!==id;});if(S.current&&S.current.histId===id){S.current.histId=null;S.current.confirmed=false;}ui.confirmDel=null;change();break;}
    case 'clearHist':if(!ui.confirmClear){ui.confirmClear=true;render();break;}S.history=[];if(S.current){S.current.confirmed=false;S.current.histId=null;}ui.confirmClear=false;change();break;
    case 'backup':copy(JSON.stringify({pelada:1,players:S.players,settings:S.settings,history:S.history}));break;
    case 'restoreToggle':ui.restoreOpen=!ui.restoreOpen;render();break;
    case 'restore':{var txt=(document.getElementById('restore')||{}).value||'';try{var raw=JSON.parse(txt);var nx=normalize(raw);if(!nx.players.length)throw 0;var bs=S.savedAt;nx.present=nx.players.map(function(p){return p.id;});S=nx;S.savedAt=bs;ui.restoreOpen=false;change();toast('Backup restaurado: '+S.players.length+' jogadores.');}catch(err){toast('Esse texto não é um backup válido desta página.');}break;}
    case 'closeCopy':ui.copyText=null;render();break;
    case 'pickFor':{var who=b.dataset.for;
      if(who==='__post__'&&stateSize()>SIZE_LIMIT){e.preventDefault();toast('Espaço cheio. Apague fotos antigas antes de colocar novas.');break;}
      ui.photoFor=who;var pin=document.getElementById('photoinput');if(pin)pin.value='';
      if(b.tagName!=='LABEL'&&pin)pin.click();break;}
    case 'retry':ui.fatal=null;init();break;
    case 'login':doLogin();break;
    case 'logout':doLogout();break;
    case 'preview':ui.preview=!ui.preview;ui.sel=null;ui.postDraft=null;ui.editGame=null;if(ui.preview&&!ui.tabTouched)ui.tab='ranking';render();window.scrollTo(0,0);break;
    case 'becomeEditor':mode='shared';ui.role='editor-try';toast('Modo diretoria ativado. Ao salvar, o sistema confere se você tem permissão de edição.');break;
    case 'photoSheet':ui.photoSheet=id;render();break;
    case 'closeSheet':ui.photoSheet=null;render();break;
    case 'photo':{var pp=byId(id);if(!pp)break;if(pp.photo&&ui.photoMenu!==id){ui.photoMenu=id;render();break;}ui.photoMenu=null;ui.photoFor=id;var fi=document.getElementById('photoinput');if(fi){fi.value='';fi.click();}break;}
    case 'photoPick':{ui.photoFor=id;var fi2=document.getElementById('photoinput');if(fi2){fi2.value='';fi2.click();}break;}
    case 'photoDel':{var pd=byId(id);if(pd){pd.photo='';}ui.photoSheet=null;change();break;}
    case 'editGame':ui.editGame=id;ui.editPlayer=null;render();break;
    case 'liveOpen':if(canEditUi()){ui.livePanel=ui.livePending?.game||id;ui.liveError=ui.livePending?'Confirme o lançamento pendente antes de continuar.':'';ui.editGame=null;render();window.scrollTo(0,0);refreshLiveDirector();}break;
    case 'liveBack':ui.livePanel=null;ui.liveError='';render();break;
    case 'liveStart':commitLive(id,{type:'start'});break;
    case 'liveEnd':commitLive(id,{type:'end'});break;
    case 'liveUndo':commitLive(id,{type:'undo',id:b.dataset.goal});break;
    case 'liveRetry':if(ui.livePending)commitLive(ui.livePending.game,ui.livePending.action);break;
    case 'closeGame':{if(voiceRecognition)voiceRecognition.stop();ui.editGame=null;ui.editPlayer=null;if(dirty)save();else render();break;}
    case 'editPlayer':ui.editPlayer=ui.editPlayer===id?null:id;render();break;
    case 'cob':{var gc2=findGame(b.dataset.g);if(!gc2)break;var ck2=b.dataset.k;gc2.cob[ck2]=!gc2.cob[ck2];gc2.sumula=true;change();toast(gc2.cob[ck2]?'Marcado como registrado. Quem não tem lançamento passa a contar como zero.':'Marcado como sem registro. Isso não entra como zero nas estatísticas.');break;}
    case 'gAddP':{var ga=findGame(b.dataset.g);if(!ga)break;var nmv=((document.getElementById('gpName')||{}).value||'').replace(/\s+/g,' ').trim().slice(0,30),tv=(document.getElementById('gpTeam')||{}).value;if(!nmv){toast('Digite o nome do atleta.');break;}
      var rp=findByName(nmv),nid=rp?rp.id:'n:'+nmv;if(gameRoster(ga).indexOf(nid)>=0){toast('Esse atleta já está na rodada.');break;}
      ga.names[nid]=rp?rp.name:nmv;if(tv==='s')ga.sem.push(nid);else{var ti=+tv===1?1:0;while(ga.teams.length<=ti)ga.teams.push([]);ga.teams[ti].push(nid);}
      ga.sumula=true;change();toast(nmv+(rp?'':' (atleta fora do Elenco)')+' adicionado à rodada.');break;}
    case 'gDelP':{var gd=findGame(b.dataset.g);if(!gd)break;gd.teams=gd.teams.map(function(t){return t.filter(function(x){return x!==id;});});gd.sem=gd.sem.filter(function(x){return x!==id;});delete gd.stats[id];if(gd.cheia===id)gd.cheia=null;if(gd.murcha===id)gd.murcha=null;ui.editPlayer=null;change();break;}
    case 'period':ui.period=b.dataset.p;render();break;
    case 'rodAdd':{var dv2=(document.getElementById('rodDate')||{}).value||ui.rodDate||dateBR();if(!validDay(dv2)){toast('Escolha a data do jogo.');break;}
      if(S.history.some(function(x){return dateBR(x.date)===dv2;})){toast('Já existe uma rodada nesse dia.');break;}
      var dt=new Date(dv2+'T12:00:00-03:00').getTime(),tm=monthTeams(dv2.slice(0,7)),nm2={};
      if(tm)tm.forEach(function(t){t.forEach(function(id){var p=byId(id);if(p)nm2[id]=p.name;});});
      var fixture=S.info.proximoJogo;
      var ng=normGame({id:uid(),date:dt,teams:tm?tm.map(function(t){return t.slice();}):[[],[]],names:nm2,campo:fixture?.date===dv2?fixture.campo:curField().id,stats:{},cob:{e:false},adv:((document.getElementById('rodAdv')||{}).value||'')});
      S.history.push(ng);S.history.sort(function(a,b){return b.date-a.date;});ui.editGame=ng.id;ui.rodDate='';change();save();toast('Rodada registrada. Agora lance o placar e os destaques.');break;}
    case 'campAdd':{var cmk=(document.getElementById('campMes')||{}).value,ctm=(document.getElementById('campTime')||{}).value;if(!/^\d{4}-\d{2}$/.test(cmk||'')){toast('Escolha o mês.');break;}
      if(!S.meses[cmk])S.meses[cmk]={teams:[],campeao:null};S.meses[cmk].campeao=+ctm;change();save();toast('Campeão de '+monthLabel(cmk)+' registrado.');break;}
    case 'placarClear':{var gq=findGame(b.dataset.g);if(canEditUi()&&gq&&!gq.live){gq.placar=null;lockLiveGoals(gq);change();}break;}
    case 'vStart':{var iso0=b.dataset.date;if(!/^\d{4}-\d{2}-\d{2}$/.test(iso0))break;if(S.history.some(function(x){return isoDate(new Date(x.date))===iso0;})){toast('Esse jogo já está registrado.');break;}
      var pq=iso0.split('-'),tq=monthTeams(iso0.slice(0,7));if(!tq){toast('Cadastre os times do mês na aba Sorteio primeiro.');break;}
      var nq={};tq.forEach(function(t){t.forEach(function(i2){var p9=byId(i2);if(p9)nq[i2]=p9.name;});});
      var gn=normGame({id:uid(),date:new Date(+pq[0],+pq[1]-1,+pq[2],6,0).getTime(),teams:tq.map(function(t){return t.slice();}),names:nq,campo:curField().id,stats:{},cob:{e:false,g:false,a:false,p:false,f:false,c:false}});
      S.history.push(gn);S.history.sort(function(a,b){return b.date-a.date;});ui.juriGame=gn.id;resetVote();change();toast('Jogo pronto. Tire quem não foi (✕) e faça a votação.');break;}
    case 'vOut':{var go=findGame(b.dataset.g);if(!go||go.juri.final)break;
      if(go.juri.votos.some(function(v){return v.cheia===id||v.murcha===id;})){toast('Esse atleta já recebeu voto. Edite ou apague o voto antes de tirá-lo da lista.');break;}
      var to=-1;go.teams.forEach(function(t,i2){if(t.indexOf(id)>=0)to=i2;});if(to<0)break;
      go.teams[to]=go.teams[to].filter(function(x){return x!==id;});delete go.stats[id];
      ui.vOutL=ui.vOutL||{};(ui.vOutL[go.id]=ui.vOutL[go.id]||[]).push({id:id,t:to});
      if(ui.vCheia===id)ui.vCheia='';if(ui.vMurcha===id)ui.vMurcha='';go.cob.e=true;go.sumula=true;change();break;}
    case 'vBack':{var gb=findGame(b.dataset.g);if(!gb)break;var L2=(ui.vOutL&&ui.vOutL[gb.id])||[],k2=-1;L2.forEach(function(o,i2){if(o.id===id)k2=i2;});if(k2<0)break;
      var ob=L2.splice(k2,1)[0];while(gb.teams.length<=ob.t)gb.teams.push([]);if(gameRoster(gb).indexOf(id)<0)gb.teams[ob.t].push(id);change();break;}
    case 'vConf':{var gc=findGame(b.dataset.g);if(!gc)break;gc.cob.e=!gc.cob.e;change();toast(gc.cob.e?'Lista conferida: a presença destes atletas passa a contar.':'Lista sem conferência: a presença não é contada.');break;}
    case 'vPick':{var k3=b.dataset.k;ui[k3==='cheia'?'vCheia':'vMurcha']=(ui[k3==='cheia'?'vCheia':'vMurcha']===id?'':id);
      if(ui.vCheia&&ui.vCheia===ui.vMurcha){if(k3==='cheia')ui.vMurcha='';else ui.vCheia='';toast('A mesma pessoa não pode ser bola cheia e bola murcha.');}render();break;}
    case 'vSave':castVote(b.dataset.g);break;
    case 'vFinal':{var gf=findGame(b.dataset.g);if(!gf||!gf.juri.votos.length)break;if(!ui.confirmFin){ui.confirmFin=true;render();break;}ui.confirmFin=false;
      var ac=apurar(gf,'cheia'),am=apurar(gf,'murcha');gf.cheia=ac.win||null;gf.murcha=am.win||null;
      if(gf.cheia&&gf.cheia===gf.murcha)gf.murcha=null;
      gf.juri.final=true;gf.sumula=true;resetVote();change();save();
      toast(ac.tie.length||am.tie.length?'Votação finalizada. Deu empate: toque no nome de quem vai ser eleito e salve o desempate.':'Votação finalizada! Resultado publicado no Ranking e em Jogos.');break;}
    case 'tiePick':{ui.tb=ui.tb||{};var tk=b.dataset.k,oth=tk==='cheia'?'murcha':'cheia',gt=juriGame();
      if(gt&&((ui.tb[oth]||gt[oth])===id)){toast('Essa pessoa já está como '+(oth==='cheia'?'bola cheia':'bola murcha')+'.');break;}
      ui.tb[tk]=id;render();break;}
    case 'tieSave':{var gT=findGame(b.dataset.g);if(!gT||!ui.tb)break;var msg=[];
      ['cheia','murcha'].forEach(function(tp){var id2=ui.tb[tp];if(!id2)return;var at=apurar(gT,tp);if(at.tie.indexOf(id2)<0)return;gT[tp]=id2;gT.juri.desempate[tp]=id2;msg.push((tp==='cheia'?'🏆 ':'🎈 ')+gameName(gT,id2));});
      if(gT.cheia&&gT.cheia===gT.murcha){gT.murcha=null;gT.juri.desempate.murcha='';}
      ui.tb={};gT.sumula=true;change();save();toast(msg.length?'Desempate salvo: '+msg.join(' · '):'Nada para salvar.');break;}
    case 'vReopen':{var gr=findGame(b.dataset.g);if(!gr)break;gr.juri.final=false;gr.juri.desempate={cheia:'',murcha:''};change();save();break;}
    case 'vAnnounce':{var ga2=findGame(b.dataset.g);if(ga2)copy(resultText(ga2));break;}
    case 'shareRank':copy(rankText());break;
    case 'shareAvisos':copy(avisosText());break;
    case 'sumModelo':downloadText('modelo-sumulas-fda.txt','\uFEFF'+sumModeloTxt().replace(/\n/g,'\r\n'),'text/plain');break;
    case 'sumCheck':{var st0=(document.getElementById('sumText')||{}).value||'';if(!st0.trim()){toast('Escolha o arquivo preenchido ou cole as súmulas.');break;}ui.sum={text:st0};ui.sum.res=buildSumulas(st0);render();break;}
    case 'sumApply':{var R3=ui.sum&&ui.sum.res;if(!R3||R3.err.length)break;var n3=0;R3.games.forEach(function(g){if(g.status!=='nova')return;S.history.push(normGame(g.obj));n3++;});S.history.sort(function(a,b){return b.date-a.date;});ui.sum=null;change();toast(n3+' súmula'+(n3===1?'':'s')+' importada'+(n3===1?'':'s')+'. Confira e toque em Salvar.');break;}
    case 'impModelo':downloadText('modelo-historico-fda.csv','\uFEFF'+CSVMODELO.replace(/\n/g,'\r\n'));break;
    case 'impExport':downloadText('historico-fda-'+isoDate(new Date())+'.csv',exportCSV());toast('Histórico exportado.');break;
    case 'impCheck':{var ta=(document.getElementById('impText')||{}).value||'';if(!ta.trim()){toast('Escolha um arquivo ou cole a planilha.');break;}ui.imp=ui.imp||{};ui.imp.text=ta;ui.imp.lenient=!!(document.getElementById('impLen')||{}).checked;ui.imp.res=buildImport(parseCSV(ta),{lenient:ui.imp.lenient});render();break;}
    case 'impApply':{var R2=ui.imp&&ui.imp.res;if(!R2||R2.err.length)break;var nn=0;R2.games.forEach(function(g){if(g.status!=='nova')return;S.history.push(normGame(g.obj));nn++;});S.history.sort(function(a,b){return b.date-a.date;});ui.imp=null;change();toast(nn+' jogo'+(nn===1?'':'s')+' importado'+(nn===1?'':'s')+'. Confira e toque em Salvar.');break;}
    case 'optPhotos':optimizePhotos();break;
    case 'jView':ui.jView=b.dataset.v==='gal'?'gal':'pub';render();break;
    case 'albOpen':ui.albOpen=ui.albOpen===id?null:id;render();break;
    case 'rkf':ui.rkf=b.dataset.k;render();break;
    case 'timesView':ui.timesView=b.dataset.v==='campo'?'campo':'lista';render();break;
    case 'timeCampo':ui.timeCampo=+b.dataset.i===1?1:0;render();break;
    case 'setField':{if(S.info.fieldId===id)break;S.info.fieldId=id;change();var nf=curField();toast(nf.principal?'Jogo voltou para o '+nf.name+'. Toque em Salvar.':'Jogo deste domingo no '+nf.name+'. Toque em Salvar e avise a galera.');break;}
    case 'goPost':openPost(id);break;
    case 'newPost':ui.postDraft={isNew:true,cat:'noticia',id:uid(),date:Date.now(),kind:'noticia',title:'',body:'',photos:[],links:[],pinned:false,price:0,deadline:'',pix:'',orders:[]};render();window.scrollTo(0,0);break;
    case 'editPost':{var ep=findPost(id);if(!ep)break;ui.postDraft=JSON.parse(JSON.stringify(ep));ui.postDraft.orders=ui.postDraft.orders||[];ui.postDraft.isNew=false;render();window.scrollTo(0,0);break;}
    case 'cancelPost':ui.postDraft=null;render();break;
    case 'jCat':ui.jCat=b.dataset.k;render();break;
    case 'pdCat':ui.postDraft.cat=b.dataset.k;render();break;
    case 'pdKind':ui.postDraft.kind=b.dataset.k;render();break;
    case 'pdPhoto':{if(stateSize()>SIZE_LIMIT){toast('Espaço cheio. Apague fotos antigas antes de colocar novas.');break;}ui.photoFor='__post__';var fp=document.getElementById('photoinput');if(fp){fp.value='';fp.click();}break;}
    case 'pdPhotoDel':ui.postDraft.photos.splice(+b.dataset.i,1);render();break;
    case 'pdLinkAdd':{var lu2=(document.getElementById('pdLinkUrl')||{}).value||'';lu2=lu2.trim();if(!/^https?:\/\/\S+$/i.test(lu2)){toast('Cole um link completo, começando com https://');break;}ui.postDraft.links.push({url:lu2,label:((document.getElementById('pdLinkLabel')||{}).value||'').trim().slice(0,60)});render();break;}
    case 'pdLinkDel':ui.postDraft.links.splice(+b.dataset.i,1);render();break;
    case 'draftFromGame':{var gd=gameDraft();ui.postDraft.body=ui.postDraft.body?ui.postDraft.body+'\n\n'+gd:gd;if(!ui.postDraft.title)ui.postDraft.title='Como foi o domingo';render();break;}
    case 'savePost':{var d=ui.postDraft;if(!d.title.trim()){toast('Dê um título para a publicação.');break;}
      if(d.kind==='campanha'&&!(Number(d.price)>0)){toast('Informe o valor.');break;}
      var clean=normPosts([d])[0];var old=findPost(d.id);if(old&&old.orders&&clean.kind==='campanha')clean.orders=old.orders;
      S.posts=normPosts([clean].concat(S.posts.filter(function(p){return p.id!==d.id;})));ui.postDraft=null;change();save();openPost(clean.id);break;}
    case 'delPost':{if(ui.confirmDel!==id){ui.confirmDel=id;render();break;}S.posts=S.posts.filter(function(p){return p.id!==id;});ui.confirmDel=null;change();break;}
    case 'copyPost':{var cp=findPost(id);if(cp)copy(postText(cp));break;}
    case 'copyPix':{var px=findPost(id);if(px)copy(px.pix);break;}
    case 'copyPedido':{var pp2=findPost(id);if(pp2)copy('Quero a '+pp2.title+' ('+money(pp2.price)+').\nTamanho: \nNome na camisa: ');break;}
    case 'toggleOrders':e.preventDefault();ui.openOrders=ui.openOrders===id?null:id;render();break;
    case 'addOrder':{var op=findPost(id);if(!op)break;var on=(document.getElementById('ordName').value||'').trim();if(!on){toast('Escreva quem fez o pedido.');break;}
      op.orders.push({id:uid(),name:on.slice(0,40),size:document.getElementById('ordSize').value,shirt:(document.getElementById('ordShirt').value||'').trim().slice(0,20),paid:false});ui.openOrders=id;change();break;}
    case 'paid':{var pq=findPost(id);if(!pq)break;pq.orders.forEach(function(o){if(o.id===b.dataset.o)o.paid=!o.paid;});ui.openOrders=id;change();break;}
    case 'delOrder':{var pr=findPost(id);if(!pr)break;var oid=b.dataset.o;if(ui.confirmDel!==oid){ui.confirmDel=oid;ui.openOrders=id;render();break;}pr.orders=pr.orders.filter(function(o){return o.id!==oid;});ui.confirmDel=null;ui.openOrders=id;change();break;}
    case 'openPhoto':ui.lightbox={id:id,i:+b.dataset.i};render();break;
    case 'lbStep':{var lp2=findPost(ui.lightbox.id);if(lp2){var n2=lp2.photos.length;ui.lightbox.i=(ui.lightbox.i+(+b.dataset.d)+n2)%n2;}render();break;}
    case 'closePhoto':ui.lightbox=null;render();break;
    case 'addNotice':{var ni=document.getElementById('newnotice');var tx=ni?ni.value.trim():'';if(!tx){toast('Escreva o aviso.');break;}S.info.notices.push({id:uid(),text:tx.slice(0,240)});ni.value='';change();break;}
    case 'delNotice':{if(ui.confirmDel!==id){ui.confirmDel=id;render();break;}S.info.notices=S.info.notices.filter(function(n){return n.id!==id;});ui.confirmDel=null;change();break;}
    case 'logo':{ui.photoFor='__logo__';var fl=document.getElementById('photoinput');if(fl){fl.value='';fl.click();}break;}
    case 'logoDel':if(canEditUi()){S.info.logo='';change();}break;
    case 'clearFixture':if(canEditUi()){S.info.proximoJogo=null;change();}break;
    case 'accessNew':
    case 'accessReset':if(canEditUi()&&ui.manageAccess&&!ui.accessBusy){
      ui.accessForm=a==='accessNew'?{action:'create'}:{action:'reset',email:id};render();
      document.querySelector('#access-editor input')?.focus();
      }break;
    case 'accessCancel':if(!ui.accessBusy){ui.accessForm=null;render();}break;
    case 'accessRefresh':loadAccess();break;
  }
});
document.addEventListener('change',function(e){
  var el=e.target,a=el.dataset&&el.dataset.act;if(!a||ui.liveBusy)return;
  if(a==='liveForm'){
    var form=el.form,game=findGame(ui.livePanel);
    if(game&&form)form.elements.scorer.innerHTML=liveScorerOptions(game,form.elements.side.value,form.elements.kind.value);
    return;
  }
  if(a==='scoutPosition'){ui.scoutPosition=el.value;render();return;}
  if(a==='scoutMonth'){ui.scoutMonth=el.value;render();return;}
  if(a==='comparePlayer'){ui.compared=ui.compared||['',''];ui.compared[+el.dataset.i]=el.value;render();return;}
  if(a==='tacticalSwap'){if(el.value)swapTactical(el.dataset.month,+el.dataset.team,el.dataset.id,el.value);return;}
  if(a==='noticeExpiry'){if(canEditUi()){var notice=S.info.notices.find(function(n){return n.id===el.dataset.id;});if(notice){notice.expires=validDay(el.value);change();}}return;}
  if(a==='quickPick'){if(canEditUi()){ui.quickPlayer=el.value;render();}return;}
  if(a==='quickRating'){var ratingPlayer=canEditUi()&&byId(el.dataset.id);if(ratingPlayer&&el.value!==''){ratingPlayer.stars=clampStar(el.value);change();}return;}
  if(a==='quickTeam'){quickTeamMove(el.dataset.id,el.dataset.month,Number(el.value));return;}
  if(a==='publicTeamsMonth'){ui.publicTeamsMonth=el.value;ui.timeCampo=0;ui.findName='';render();}
  else if(a==='rename'){var p=byId(el.dataset.id);if(!p)return;var v=el.value.replace(/\s+/g,' ').trim().slice(0,30);
    if(!v){el.value=p.name;toast('O nome não pode ficar vazio.');return;}
    if(S.players.some(function(q){return q.id!==p.id&&norm(q.name)===norm(v);})){el.value=p.name;toast('Já existe um jogador com esse nome.');return;}
    if(v!==p.name){p.name=v;change();}}
  else if(a==='pos'){var p2=byId(el.dataset.id);if(p2){p2.pos=el.value;change();}}
  else if(a==='pnum'){var p3=byId(el.dataset.id);if(p3){var nv2=parseInt(el.value,10);p3.num=(nv2>0&&nv2<100)?nv2:0;if(!p3.num)el.value='';change();}}
  else if(a==='cheia'||a==='murcha'){var g3=findGame(el.dataset.g);if(!g3)return;var v3=el.value||null;var other=a==='cheia'?g3.murcha:g3.cheia;
    if(v3&&v3===other){el.value=g3[a]||'';toast('A mesma pessoa não pode ser bola cheia e bola murcha.');return;}
    g3[a]=v3;g3.sumula=true;change();}
  else if(a==='notice'){var nn=S.info.notices.filter(function(n){return n.id===el.dataset.id;})[0];if(!nn)return;var tv=el.value.trim();if(!tv){el.value=nn.text;toast('Para tirar o aviso, use o ✕.');return;}if(tv!==nn.text){nn.text=tv.slice(0,240);change();}}
  else if(a==='rede'){var rk=el.dataset.k,rv=el.value.trim();var dom={instagram:/instagram\.com\//i,tiktok:/tiktok\.com\//i,facebook:/(facebook\.com|fb\.com|fb\.me)\//i}[rk];
    if(rv&&!(/^https:\/\//i.test(rv)&&dom.test(rv))){el.value=S.info.redes[rk]||'';toast('Cole o link completo do perfil, começando com https://');return;}
    S.info.redes[rk]=rv.slice(0,300);change();}
  else if(a==='regularField'){if(canEditUi()&&fieldById(el.value)){S.info.fieldId=el.value;change();}}
  else if(a==='fieldEdit'){var fe=canEditUi()&&fieldById(el.dataset.id);if(!fe)return;var fk=el.dataset.k,fv=el.value.trim();
    if(fk==='name'&&!fv){el.value=fe.name;toast('O nome do campo não pode ficar vazio.');return;}
    if(fk==='maps'&&fv&&!validMaps(fv)){el.value=fe.maps;toast('Cole o link completo do Google Maps, começando com https://');return;}
    fe[fk]=fv.slice(0,{maps:300,bairro:80,name:50}[fk]);change();}
  else if(a==='info'&&canEditUi()){var k=el.dataset.k,val=el.value;
    if(k==='name'){val=val.trim().slice(0,40);if(!val){el.value=S.info.name;toast('O nome não pode ficar vazio.');return;}}
    else if(k==='descricao'){val=val.trim().slice(0,180);}
    else if(k==='feeDay'){val=parseInt(val,10);if(!(val>=1&&val<=28)){el.value=S.info.feeDay;toast('Escolha um dia entre 1 e 28.');return;}}
    else if(!['arrival','kickoff'].includes(k)||!normTime(val,'')){el.value=S.info[k];return;}
    S.info[k]=val;change();}
  else if(a==='arrival'){S.settings.arrival=el.checked;change();}
  else if(a==='vencedor'){var gw=findGame(el.dataset.g);if(!gw)return;if(el.value==='nv'){gw.valida=false;gw.vencedor=null;}else{gw.valida=true;gw.vencedor=el.value===''?null:+el.value;}gw.sumula=true;change();}
  else if(a==='sumText'){ui.sum=ui.sum||{};ui.sum.text=el.value;ui.sum.res=null;}
  else if(a==='sumFile'){var fl2=el.files&&el.files[0];if(!fl2)return;var fr2=new FileReader();fr2.onload=function(){ui.sum=ui.sum||{};ui.sum.text=String(fr2.result||'');ui.sum.res=null;render();toast('Arquivo lido: '+fl2.name+'. Toque em Conferir súmulas.');};fr2.onerror=function(){toast('Não consegui ler o arquivo.');};fr2.readAsText(fl2,'utf-8');}
  else if(a==='impText'){ui.imp=ui.imp||{};ui.imp.text=el.value;ui.imp.res=null;}
  else if(a==='impLen'){ui.imp=ui.imp||{};ui.imp.lenient=el.checked;ui.imp.res=null;}
  else if(a==='impFile'){var fl=el.files&&el.files[0];if(!fl)return;var fr=new FileReader();fr.onload=function(){ui.imp=ui.imp||{};ui.imp.text=String(fr.result||'');ui.imp.res=null;render();toast('Arquivo lido: '+fl.name+'. Toque em Conferir arquivo.');};fr.onerror=function(){toast('Não consegui ler o arquivo.');};fr.readAsText(fl,'utf-8');}
  else if(a==='adv'){var gav=findGame(el.dataset.g);if(gav){gav.adv=el.value.replace(/\s+/g,' ').trim().slice(0,40);gav.sumula=true;change();}}
  else if(a==='obs'){var go=findGame(el.dataset.g);if(go){go.obs=el.value.slice(0,2000);go.sumula=true;change();}}
  else if(a==='rodDate'){ui.rodDate=el.value;render();}
  else if(a==='campeao'){var ck=el.dataset.k;if(!S.meses[ck])S.meses[ck]={teams:[],campeao:null};S.meses[ck].campeao=el.value==='auto'?null:+el.value;change();save();}
  else if(a==='pdDate'&&ui.postDraft){var pd=el.value.split('-');if(pd.length===3)ui.postDraft.date=new Date(+pd[0],+pd[1]-1,+pd[2],12).getTime();}
  else if(a==='jMes'){ui.jMes=el.value;render();}
  else if(a==='sortMes'){ui.sortMes=el.value;ui.sel=null;render();}
  else if(a==='juriGame'){ui.juriGame=el.value;resetVote();render();}
  else if(a==='desempate'){var gd2=findGame(el.dataset.g);if(!gd2)return;var ov=el.dataset.k==='cheia'?gd2.murcha:gd2.cheia;if(el.value&&el.value===ov){toast('A mesma pessoa não pode ser bola cheia e bola murcha.');el.value=gd2[el.dataset.k]||'';return;}gd2[el.dataset.k]=el.value||null;change();save();}
  else if(a==='gk'){S.settings.gk=el.checked;change();}
  else if(a==='rot'){S.settings.rot=el.value;change();}
  else if(a==='showStars'){ui.showStars=el.checked;render();}
  else if(a==='shareStars'){S.settings.shareStars=el.checked;change();}
});
function handleImage(f,pid){
  if(!f||!pid)return;
  if(f.type&&!/^image\//.test(f.type)){toast('Esse arquivo não é uma foto.');return;}
  toast('Carregando a foto…');
  if(pid==='__post__'){if(stateSize()>SIZE_LIMIT){toast('Espaço cheio. Apague fotos antigas antes.');return;}readBig(f).then(function(u){if(!ui.postDraft)return;if(ui.postDraft.photos.length>=6){toast('Máximo de 6 fotos por publicação.');return;}ui.postDraft.photos.push(u);toast('Foto adicionada.');render();},function(){toast('Não consegui abrir essa imagem. Tente outra foto.');});return;}
  if(pid.indexOf('__field__')===0){var fx=fieldById(pid.slice(9));readBig(f).then(function(u){if(!fx)return;fx.photo=u;change();toast('Foto do campo atualizada. Toque em Salvar.');},function(){toast('Não consegui abrir essa imagem. Tente outra.');});return;}
  if(pid==='__logo__'){readLogo(f).then(function(u){if(u.length>250000){toast('Imagem muito pesada. Tente uma versão menor.');return;}S.info.logo=u;change();toast('Escudo atualizado.');},function(){toast('Não consegui abrir essa imagem. Tente outra.');});return;}
  readPhoto(f).then(function(url){var p=byId(pid);if(!p)return;p.photo=url;ui.photoSheet=null;change();toast('Foto de '+p.name+' atualizada. Toque em Salvar.');},function(){toast('Não consegui abrir essa imagem. Tente outra foto.');});
}
function onPick(e){var el=e.target;ui.picking=false;var f=el.files&&el.files[0];handleImage(f,el.dataset.pickfor);if(ui.pendingRender){ui.pendingRender=false;render();}}
function onPaste(e){
  var el=e.target.closest?e.target.closest('[data-pastefor]'):null;if(!el)return;
  e.preventDefault();var items=(e.clipboardData&&e.clipboardData.items)||[],f=null;
  for(var i=0;i<items.length;i++){if(items[i].type&&items[i].type.indexOf('image/')===0){f=items[i].getAsFile();break;}}
  if(!f){toast('Não encontrei uma foto copiada. Copie a imagem (não o link) e cole de novo.');return;}
  handleImage(f,el.dataset.pastefor);
}
document.addEventListener('paste',onPaste);
document.addEventListener('beforeinput',function(e){if(e.target.dataset&&e.target.dataset.pastefor&&e.inputType!=='insertFromPaste')e.preventDefault();});
document.addEventListener('pointerdown',function(e){if(e.target.dataset&&e.target.dataset.pickfor)ui.picking=true;},true);
window.addEventListener('focus',function(){setTimeout(function(){if(ui.picking){ui.picking=false;if(ui.pendingRender){ui.pendingRender=false;render();}}},2500);});
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&(e.target.id==='lgSenha'||e.target.id==='lgEmail')){e.preventDefault();doLogin();}
  if(e.key==='Enter'&&e.target.id==='newnotice'){e.preventDefault();var bn=document.querySelector('[data-act="addNotice"]');if(bn)bn.click();}
  if(e.key==='Enter'&&e.target.id==='newname'){e.preventDefault();var btn=document.querySelector('[data-act="add"]');if(btn)btn.click();}if(e.key==='Escape'){if(ui.copyText!=null)ui.copyText=null;ui.lightbox=null;ui.photoSheet=null;render();}});
document.addEventListener('input',function(e){if(e.target.id==='findName'){ui.findName=e.target.value;render();return;}if(e.target.id==='scout-name'){ui.scoutName=e.target.value;render();return;}var k=e.target.dataset&&e.target.dataset.pd;if(k&&ui.postDraft)ui.postDraft[k]=e.target.value;});
document.addEventListener('submit',function(e){
  if(!canEditUi())return;
  var form=e.target,type=form.id||form.dataset.form;
  if(ui.liveBusy){e.preventDefault();return;}
  switch(type){
    case 'video-editor':e.preventDefault();publishVideo(form);break;
    case 'access-editor':e.preventDefault();submitAccess(form);break;
    case 'own-password':e.preventDefault();submitOwnPassword(form);break;
    case 'special-fixture':e.preventDefault();saveFixture(form);break;
    case 'match':e.preventDefault();applyMatchForm(form);break;
    case 'stats':e.preventDefault();applyPlayerStats(form);break;
    case 'live-goal':e.preventDefault();submitLiveGoal(form);break;
    case 'add-field':{
      e.preventDefault();
      var name=String(new FormData(form).get('name')||'').trim().slice(0,50);
      if(!name||S.info.fields.length>=6)return;
      if(S.info.fields.some(function(field){return norm(field.name)===norm(name);})){toast('Esse campo já existe.');return;}
      S.info.fields.push({id:uid(),name:name,bairro:'',maps:'',photo:'',principal:false});change();break;
    }
  }
});
document.addEventListener('change',function(e){var k=e.target.dataset&&e.target.dataset.pdc;if(k&&ui.postDraft)ui.postDraft[k]=e.target.checked;});
window.addEventListener('beforeunload',function(){if(dirty)lsSet(DRAFT_KEY,{base:S.savedAt,state:S});});

setInterval(tickCountdown,1000);
setInterval(function(){
  var tv=document.querySelector('.fda-tv');
  if(tv&&!ui.tvPaused&&!document.hidden&&!tv.matches(':focus-within, :hover')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)rotateAwards();
},9000);
document.addEventListener('error',function(event){
  var img=event.target;
  if(img instanceof HTMLImageElement&&img.hasAttribute('data-avatar-name')){
    img.outerHTML=avatar({name:img.dataset.avatarName},img.width||40);
  }
},true);
if(window.__TEST__)window.__fda={parseSumulas:parseSumulas,buildSumulas:buildSumulas,sumModeloTxt:sumModeloTxt,parseCSV:parseCSV,buildImport:buildImport,exportCSV:exportCSV,CSVMODELO:CSVMODELO,monthStandings:monthStandings,winner:winner,placarTxt:placarTxt,aggregate:aggregate,normGame:normGame,normalize:normalize,rosterGames:rosterGames,avgG:avgG,pctPres:pctPres,getS:function(){return S;},setS:function(x){S=normalize(x);}};
render();init();
prepareClubArt().then(function(){if(!ui.login&&!ui.loading&&!ui.fatal)render();}).catch(function(){console.warn('A prancha do FDA não pôde ser carregada.');});
})();

