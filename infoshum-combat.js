// «Найди источник»: the final fight, three phases of six health each.
// 1 «Море экранов»: a hall of monitors. In waves his face shows on many screens at once, but only one is real.
//   Yuri fights from inside: his amber face appears on nearby screens and points at the real one (the marker shows then).
//   A paw on the real screen smashes it; a paw on a fake brings data rain. The real one charges and fires a beam along
//   its tier. Every third wave Yuri holds him in the screen — no beam. After nine screens they fight over the huge
//   wall: Yuri's face and his alternate, the paw counts only while he is on it (three paws).
// 2 «Колосс»: he pulls the broken monitors into a colossus and fights with his hands. A fist follows Uma as a shadow
//   and slams down: a shockwave runs along the floor (jump), and the fist sticks — the monitor on its knuckles is the
//   weak spot. An arm sweeps low (jump) or high (crouch); the head's beam crawls after Uma. With both hands broken
//   he collapses and the head screen lies on the floor: a paw there takes two health. Three collapses.
// 3 «На свободе»: he bursts out of the head screen into the storm. Tentacles break out of the ground under Uma,
//   shards of headlines fly at her, and he rams along her island. Dodge the ram and he crashes, dizzy — a paw tears
//   a tentacle off. For the last blow Yuri holds him from a surviving screen.
import {rooms} from './level.js?v=0.21.5';
import {originalsFound} from './dimension-systems.js?v=0.21.5';
import {pitFall} from './pit-falls.js?v=0.21.5';
// Each «первоисточник» from the Dimension: his face stays longer in the screens.
export const SOURCE_NOISE_BONUS=12,SOURCE_CORE_BONUS=0,SOURCE_HINT=.8;
export const NOISE_TIME=60,INFOSHUM_HP=18,HIT_DAMAGE=2,PHASE_HP=6;
export const noiseDuration=g=>NOISE_TIME+SOURCE_NOISE_BONUS*originalsFound(g);
export const coreDamage=()=>HIT_DAMAGE;
export const revealHint=g=>Math.min(2.4,SOURCE_HINT*originalsFound(g));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const STAGE_ROOM=8;
export const FLOOR=474;
// ——— Phase 1: the sea of screens ———
// The heap (room-local x, y, w, look): tops of lying monitors; every other platform of the room hides.
export const WALL_ARENA={0:[0,474,1536,'floor'],1:[40,404,220,'lying'],6:[130,326,180,'side'],9:[340,256,150,'lying'],4:[400,430,130,'side'],16:[490,345,90,'side'],2:[560,390,416,'lying'],
 7:[600,300,336,'lying'],17:[956,345,90,'side'],5:[1006,430,130,'side'],10:[1046,256,150,'lying'],8:[1226,326,180,'side'],3:[1276,404,220,'lying']};
export const SCREEN_KINDS={tiny:{casing:'tiny1',w:56,hits:1},small:{casing:'small',w:80,hits:1},med:{casing:'med1',w:108,hits:1},large:{casing:'large1',w:140,hits:1},huge:{casing:'huge',w:600,hits:3}};
const CASING_H={tiny1:77/93,small:108/122,med1:146/178,large1:180/228,huge:209/674};
// The screens: size, the tier it stands on, the centre x; and the huge wall over the middle.
export const SCREEN_LAYOUT=[
 {kind:'tiny',on:1,cx:80},{kind:'tiny',on:1,cx:200},{kind:'small',on:6,cx:190},{kind:'tiny',on:6,cx:270},{kind:'med',on:9,cx:400},{kind:'large',on:0,cx:330},{kind:'small',on:4,cx:440},
 {kind:'small',on:16,cx:535},{kind:'tiny',on:2,cx:700},{kind:'tiny',on:2,cx:836},{kind:'tiny',on:7,cx:650},{kind:'tiny',on:7,cx:886},{kind:'small',on:17,cx:1001},{kind:'small',on:5,cx:1096},
 {kind:'med',on:10,cx:1136},{kind:'large',on:0,cx:1206},{kind:'tiny',on:8,cx:1260},{kind:'small',on:8,cx:1346},{kind:'tiny',on:3,cx:1320},{kind:'med',on:3,cx:1440},
 {kind:'huge',cx:768,top:76}
];
export const REAL_SCREENS=9,WALL_UNITS=REAL_SCREENS+3;
export const WAVE={opening:1.3,warn:.7,face:[1.7,1.5,1.3],charge:.9,fire:.7,rest:.8,early:.45,beam:520,yuri:[.25,.45,.65],hold:2.4,holdEvery:3,fakes:[4,5,6],giantWarn:1.1,giantFace:1.6,giantCharge:1.1,giantFire:.8,giantRest:1.3,giantHalf:18};
export const ARRIVE=1.6,ASSEMBLE=3.2,BREAKOUT=3;
// ——— Phase 2: the colossus ———
export const COL={intro:1.6,gap:[1.1,.85,.6],aim:[1.1,.95,.8],lock:.35,fall:.12,stuck:[2.8,2.6,2.4],lift:.45,fistHalf:58,track:340,shockSpeed:430,shockRange:520,
 sweepWarn:.85,sweepSpeed:640,sweepSpan:1300,beamCharge:1,beamTime:2.2,beamSpeed:118,beamHalf:30,collapse:3.8,rise:1.2,plan:['slam','sweep','slam','beam']};
// ——— Phase 3: free in the storm ———
export const FREE={enter:1.2,gap:[1,.8,.6],hoverY:120,tentWarn:.75,tentUp:.5,tentGap:.7,tentHalf:30,volleyMove:.7,volleyGap:.42,shardSpeed:420,ramPrep:.95,ramSpeed:780,crash:.35,dizzy:2.8,dizzyYuri:4.2,hit:.7,bounce:.7,plan:['tentacle','volley','ram']};
export const STORM_ISLANDS={0:[0,474,460,0],11:[520,474,530,0],12:[1110,474,426,0],1:[92,366,296,1],3:[1131,366,296,1],4:[411,413,165,0],5:[965,413,165,0],2:[617,332,300,1],9:[464,272,145,2],10:[961,272,145,2]};
function screenSize(kind){const k=SCREEN_KINDS[kind];return {w:k.w,h:Math.round(k.w*CASING_H[k.casing])};}
export function createScreens(room=STAGE_ROOM){
 const base=rooms[room].x;
 return SCREEN_LAYOUT.map((t,i)=>{const {w,h}=screenSize(t.kind),y=t.kind==='huge'?t.top:(WALL_ARENA[t.on]?.[1]??474)-h;
  return {index:i,kind:t.kind,on:t.on,x:base+t.cx-w/2,y,w,h,hp:SCREEN_KINDS[t.kind].hits,state:'off',timer:0,dir:1,point:1,shards:0,pop:0,role:null,cracked:false};});
}
export function createInfoshumNetwork(room=STAGE_ROOM){
 const tvs=createScreens(room);
 return {stage:'network',mode:'opening',timer:WAVE.opening,wave:0,broken:0,units:0,tvs,monitors:tvs,lastMonitorIndex:tvs.length-1,real:null,yuri:[],yuriOn:false,yuriTimer:0,hold:false,faces:[],built:false,
  transitionProgress:0,lastSwing:-1,noise:0,noiseTime:0,col:null,free:null,giantY:null};
}
export const screenUnits=()=>WALL_UNITS;
export const screenCenter=t=>({x:t.x+t.w/2,y:t.y+t.h/2});
const beamHalf=t=>Math.max(7,Math.round(t.h*.16));
// The beam of the real screen runs along its tier towards Uma; the huge wall's beam sweeps a whole tier of the room.
export function beamRect(t,n=null){
 if(t.kind==='huge'){const r=rooms[STAGE_ROOM],y=n?.giantY??300;return {x:r.x,y:y-WAVE.giantHalf,w:r.width,h:WAVE.giantHalf*2};}
 const c=screenCenter(t),h=beamHalf(t),x0=t.dir>0?t.x+t.w-4:t.x+4;return {x:t.dir>0?x0:x0-WAVE.beam,y:c.y-h,w:WAVE.beam,h:h*2};
}
export function monitorRect(m){return {x:m.x,y:m.y,w:m.w,h:m.h};}
export function glassRect(m){return {x:m.x+m.w*.2,y:m.y+m.h*.2,w:m.w*.6,h:m.h*.55};}
const LIVE=['face','charge','fire','held'],RANK={tiny:0,small:1,med:2,large:3};
const isOut=t=>t.state==='broken'||t.state==='crack';
export const realScreen=n=>{const t=n.tvs[n.real];return t&&t.role==='real'&&LIVE.includes(t.state)?t:null;};
// The room is rearranged per phase: shapes of [x, y, w, look]; every other platform of the room hides.
function reshape(g,shapes,key){
 const r=rooms[g.room];
 for(const p of g.platforms)if(p.room===g.room){
  const shape=shapes[p.index];p.bossHidden=!shape;p.infoshumStep=false;p.storm=undefined;p.heap=undefined;
  if(shape){p.x=r.x+shape[0];p.y=shape[1];p.w=shape[2];p.baseX=p.x;p.baseY=p.y;p.prevX=p.x;p.prevY=p.y;p.motion=null;p.dx=0;p.dy=0;if(key)p[key]=shape[3];}
 }
}
export function buildWall(g){const n=g.boss.network;if(n.built)return;n.built=true;reshape(g,WALL_ARENA,'heap');}
function endWave(n){for(const t of n.tvs)if(!isOut(t)){t.state='off';t.role=null;}n.yuriOn=false;n.yuri=[];}
function startWave(g){
 const n=g.boss.network,p=g.player,regular=n.tvs.filter(t=>t.kind!=='huge'&&!isOut(t)),huge=n.tvs.find(t=>t.kind==='huge');
 endWave(n);n.hold=false;let giant=false;
 if(n.broken>=REAL_SCREENS||!regular.length){if(isOut(huge))return;giant=true;huge.role='real';huge.state='yuri';n.real=huge.index;n.giantY=null;}
 else{
  const px=p.x+p.w/2,dist=(a,x)=>Math.abs(screenCenter(a).x-x),near=[...regular].sort((a,b)=>dist(a,px)-dist(b,px)),real=near[Math.floor(Math.random()*Math.min(4,near.length))];
  // The screens around the real one light up: Yuri takes the two biggest of them, his fakes take the rest.
  const count=WAVE.fakes[Math.min(2,Math.floor(n.broken/3))],rx=screenCenter(real).x,pool=regular.filter(t=>t!==real).sort((a,b)=>dist(a,rx)-dist(b,rx)).slice(0,count+2);
  const helpers=[...pool].sort((a,b)=>RANK[b.kind]-RANK[a.kind]||dist(a,rx)-dist(b,rx)).slice(0,2),fakes=pool.filter(t=>!helpers.includes(t));
  real.role='real';real.state='static';for(const t of fakes){t.role='fake';t.state='static';}
  for(const t of helpers){t.role='yuri';t.point=rx>=screenCenter(t).x?1:-1;}
  n.real=real.index;n.yuri=helpers.map(t=>t.index);n.hold=n.wave%WAVE.holdEvery===WAVE.holdEvery-1;
 }
 n.mode='warn';n.timer=giant?WAVE.giantWarn:WAVE.warn;n.wave++;n.faces=[n.real];
 g.emit('infoshumWave',{wave:n.wave,giant});
}
// His face is on the screens; Yuri needs a moment to find the real one.
function showFaces(g,instant=false){
 const n=g.boss.network,real=n.tvs[n.real],giant=real.kind==='huge',r=Math.min(2,Math.floor(n.broken/3));
 for(const t of n.tvs)if(!isOut(t)&&(t.role==='real'||t.role==='fake'))t.state='face';
 n.mode='face';n.timer=giant?WAVE.giantFace:WAVE.face[r]+revealHint(g)*.3;n.yuriOn=false;n.yuriTimer=giant||instant?0:Math.max(.1,WAVE.yuri[r]-revealHint(g)*.1);
 for(const i of n.yuri){const t=n.tvs[i];if(!isOut(t))t.state='glitch';}
 g.emit('infoshumReveal',{index:n.real,first:n.wave===1,giant});
 if(n.yuriTimer<=0)yuriFinds(g);
}
function yuriFinds(g){const n=g.boss.network;n.yuriOn=true;for(const i of n.yuri){const t=n.tvs[i];if(!isOut(t)&&t.role==='yuri')t.state='yuri';}const real=n.tvs[n.real],c=screenCenter(real);g.emit('yuriHint',{x:c.x,y:c.y});}
function beamHits(g){
 const n=g.boss.network,p=g.player;if(p.inv>0||p.dash>0)return;
 for(const t of n.tvs)if(t.state==='fire'&&overlap(p,beamRect(t,n))){g.hurt(false,screenCenter(t).x);return;}
}
function createRain(g){
 const p=g.player,x=p.x+p.w/2,s=g.platforms.find(s=>s.id===p.supportId),y=s?.y??474;
 for(const dx of[-38,-12,14,40])g.bolts.push({room:g.room,kind:'dataRain',infoshumAttack:'rain',visual:'infoshum',x:x+dx-6,y:Math.max(12,y-190),w:12,h:34,vx:0,vy:320,ttl:1.5,stopY:y+4});
 g.emit('bossCast',{boss:'infoshum',ability:'rain',x,y});
}
function stepScreens(g,dt){
 const b=g.boss,n=b.network,p=g.player;buildWall(g);b.state=['face','charge','held'].includes(n.mode)?'recover':'network';
 for(const t of n.tvs){t.shards=Math.max(0,t.shards-dt);t.pop=Math.max(0,t.pop-dt);if(t.state==='crack'){t.timer-=dt;if(t.timer<=0)t.state='broken';}}
 beamHits(g);const shown=n.tvs[n.real]||n.tvs[n.lastMonitorIndex],sc=screenCenter(shown);b.x=sc.x-b.w/2;b.y=sc.y-b.h/2;b.dir=1;
 if(n.mode==='face'&&!n.yuriOn){n.yuriTimer-=dt;if(n.yuriTimer<=0)yuriFinds(g);}
 n.timer-=dt;
 const huge=n.tvs.at(-1);
 // The real screen smashed (or he was driven off the wall): a short breath, then the next wave.
 if(LIVE.includes(n.mode)&&!realScreen(n)){const giant=n.broken>=REAL_SCREENS;endWave(n);n.mode='rest';n.timer=Math.min(n.timer,WAVE.early);if(giant&&!isOut(huge))huge.state='yuri';}
 if(n.timer>0)return;
 const real=n.tvs[n.real],giant=real?.kind==='huge';
 if(n.mode==='opening'||n.mode==='rest')startWave(g);
 else if(n.mode==='warn')showFaces(g);
 else if(n.mode==='face'){
  if(n.hold&&!giant){n.mode='held';n.timer=WAVE.hold;real.state='held';for(const t of n.tvs)if(t.role==='fake'&&!isOut(t)){t.state='off';t.role=null;t.pop=.3;}for(const i of n.yuri)if(!isOut(n.tvs[i]))n.tvs[i].state='hold';g.emit('yuriHold',{x:sc.x,y:sc.y});}
  else{n.mode='charge';n.timer=giant?WAVE.giantCharge:WAVE.charge;for(const t of n.tvs)if(!isOut(t)&&(t.role==='real'||t.role==='fake'))t.state='charge';if(giant)n.giantY=p.y+p.h/2;g.emit('infoshumWarning',{attack:giant?'giantBeam':'tvBeam'});}
 }
 else if(n.mode==='charge'){n.mode='fire';n.timer=giant?WAVE.giantFire:WAVE.fire;for(const t of n.tvs)if(t.role==='fake'&&!isOut(t)){t.state='off';t.role=null;t.pop=.3;}
  real.state='fire';real.dir=p.x+p.w/2>=sc.x?1:-1;g.emit('bossCast',{boss:'infoshum',ability:giant?'giantBeam':'tvBeam',x:sc.x,y:sc.y,kind:real.kind});}
 else{endWave(n);n.mode='rest';n.timer=giant?WAVE.giantRest:WAVE.rest;if(giant&&!isOut(huge))huge.state='yuri';}
}
// A paw on the real screen smashes it for good (the huge wall takes three, one per wave); a paw on a fake brings rain.
function hitScreen(g,t){
 const b=g.boss,n=b.network,c=screenCenter(t);t.hp--;n.units++;n.lastMonitorIndex=t.index;
 b.hp=Math.max(INFOSHUM_HP-PHASE_HP,+(INFOSHUM_HP-PHASE_HP*n.units/WALL_UNITS).toFixed(3));b.hurtTime=.35;t.shards=.45;
 g.emit('bossHit',{boss:'infoshum',x:c.x,y:c.y});
 if(t.hp>0){t.cracked=true;t.state='yuri';t.role=null;g.emit('infoshumScreenCrack',{index:t.index,cracked:true,x:c.x,y:c.y});return true;}
 t.state='crack';t.timer=.3;t.role=null;n.broken++;g.emit('infoshumScreenCrack',{index:t.index,broken:n.broken,x:c.x,y:c.y});
 if(t.kind==='huge')beginAssembly(g);
 return true;
}
function strikeScreens(g,paw){
 const n=g.boss.network,p=g.player;if(n.lastSwing===p.swing)return false;
 const real=realScreen(n);if(real&&overlap(paw,real)){n.lastSwing=p.swing;return hitScreen(g,real);}
 const fake=n.tvs.find(t=>t.role==='fake'&&['face','charge'].includes(t.state)&&overlap(paw,t));if(!fake)return false;
 n.lastSwing=p.swing;fake.state='off';fake.role=null;fake.pop=.35;const c=screenCenter(fake);createRain(g);g.emit('infoshumFakeHit',{x:c.x,y:c.y});return true;
}
// ——— The assembly: every monitor flies to the middle and snaps into the colossus ———
function beginAssembly(g){
 const b=g.boss,n=b.network;
 n.stage='assemble';n.mode='assemble';n.timer=ASSEMBLE;n.transitionProgress=0;
 b.phase=2;b.phaseName='Колосс';b.state='phaseChange';b.hp=INFOSHUM_HP-PHASE_HP;
 g.bolts=[];g.cuts=[];g.inks=[];g.enemies=g.enemies.filter(e=>e.bossOwnerId!=='infoshum');
 for(const t of n.tvs){t.state='broken';t.role=null;}
 g.player.inv=Math.max(g.player.inv,ASSEMBLE+1);
 g.emit('bossPhase',{boss:'infoshum',phase:2,name:'Колосс'});g.emit('infoshumAssemble',{x:rooms[g.room].x+768,y:200});
}
function landSafely(g,index,dx=45){
 const p=g.player,landing=g.platforms.find(s=>s.room===g.room&&s.index===index);
 Object.assign(p,{x:landing.x+dx,y:landing.y-p.h,vx:0,vy:0,grounded:true,supportId:landing.id,climbing:false});p.inv=Math.max(p.inv,2);
 g.safeTrail=[{platformId:landing.id,x:p.x,y:p.y}];g.updateCamera();
}
// ——— Phase 2 «Колосс» ———
const centre=g=>rooms[g.room].x+768;
function beginColossus(g){
 const b=g.boss,n=b.network;
 reshape(g,{0:[0,FLOOR,1536,'floor']},'heap');
 for(const key of ['fishes','soups','lifePickups'])if(Array.isArray(g[key]))g[key]=g[key].filter(o=>o.room!==g.room);
 n.stage='colossus';n.col={mode:'intro',timer:COL.intro,round:0,hands:{L:true,R:true},side:'R',step:0,fist:null,sweep:null,beam:null,shocks:[],dust:null,head:1,headTime:1.3,flash:0,lastSwing:-1};
 b.state='phaseChange';landSafely(g,0,440);g.emit('infoshumColossus',{x:centre(g),y:120});
}
const roundOf=a=>Math.min(2,a.round);
export function fistBox(f){return {x:f.x-36,y:FLOOR-70,w:72,h:56};}
export function headBox(g){const x=centre(g)+45;return {x:x-70,y:FLOOR-150,w:140,h:112};}
export function sweepBox(s){return {x:s.x-80,y:s.low?FLOOR-38:FLOOR-84,w:160,h:s.low?38:44};}
function idle(a){a.mode='idle';a.timer=COL.gap[roundOf(a)];}
function collapse(g){const a=g.boss.network.col;a.mode='collapse';a.timer=COL.collapse;a.fist=null;a.sweep=null;a.beam=null;a.shocks=[];a.flash=.3;a.head=3;const h=headBox(g);g.emit('infoshumCollapse',{x:h.x+h.w/2,y:h.y});g.emit('infoshumWeak',{x:h.x+h.w/2,y:h.y});}
function rise(a){a.mode='rise';a.timer=COL.rise;a.hands={L:true,R:true};a.head=1;a.headTime=COL.rise;a.flash=.3;}
function nextAttack(g){
 const n=g.boss.network,a=n.col,p=g.player,px=p.x+p.w/2,kind=COL.plan[a.step++%COL.plan.length];a.mode='attack';
 if(kind==='slam'){let side=a.side;if(!a.hands[side])side=side==='R'?'L':'R';a.side=side==='R'?'L':'R';a.fist={side,x:px,y:-240,state:'aim',timer:COL.aim[roundOf(a)],weak:false,lastSwing:-1};g.emit('infoshumWarning',{attack:'slam',x:px,y:FLOOR});}
 else if(kind==='sweep'){const dir=Math.random()<.5?1:-1;a.sweep={dir,low:Math.random()<.5,x:px-dir*COL.sweepSpan/2,state:'warn',timer:COL.sweepWarn,travel:0};g.emit('infoshumWarning',{attack:'sweep'});}
 else{a.beam={state:'charge',timer:COL.beamCharge,x:px};a.head=2;a.headTime=9;g.emit('infoshumWarning',{attack:'beam'});}
}
function stepFist(g,dt){
 const b=g.boss,a=b.network.col,f=a.fist,p=g.player,r=rooms[g.room],px=p.x+p.w/2;f.timer-=dt;
 if(f.state==='aim'){f.x=clamp(f.x+clamp(px-f.x,-COL.track*dt,COL.track*dt),r.x+70,r.end-70);if(f.timer<=0){f.state='lock';f.timer=COL.lock;}}
 else if(f.state==='lock'){if(f.timer<=0){f.state='fall';f.timer=COL.fall;}}
 else if(f.state==='fall'){f.y=-240*Math.max(0,f.timer)/COL.fall;if(f.timer<=0){
  f.y=0;f.state='stuck';f.timer=COL.stuck[roundOf(a)];f.weak=a.hands[f.side];a.dust={x:f.x,time:0};a.flash=.12;
  if(p.inv<=0&&p.dash===0&&Math.abs(px-f.x)<COL.fistHalf+p.w/2-8&&p.y+p.h>FLOOR-170)g.hurt(false,f.x);
  a.shocks.push({x:f.x-44,dir:-1,travel:0},{x:f.x+44,dir:1,travel:0});
  g.emit('boltImpact',{x:f.x,y:FLOOR,kind:'fist'});g.emit('bossCast',{boss:'infoshum',ability:'slam',x:f.x,y:FLOOR});if(f.weak)g.emit('infoshumWeak',{x:f.x,y:FLOOR-40});}}
 else if(f.state==='stuck'||f.state==='broken'){b.state='recover';if(f.timer<=0){f.state='lift';f.timer=COL.lift;}}
 else if(f.state==='lift'){f.y=-260*(1-Math.max(0,f.timer)/COL.lift);if(f.timer<=0){a.fist=null;if(!a.hands.L&&!a.hands.R)collapse(g);else idle(a);}}
}
function stepSweep(g,dt){
 const a=g.boss.network.col,s=a.sweep,p=g.player;s.timer-=dt;
 if(s.state==='warn'){if(s.timer<=0){s.state='go';g.emit('bossCast',{boss:'infoshum',ability:'sweep',x:s.x,y:FLOOR-40});}return;}
 const v=COL.sweepSpeed*dt;s.x+=s.dir*v;s.travel+=v;if(p.inv<=0&&p.dash===0&&overlap(p,sweepBox(s)))g.hurt(false,s.x);
 if(s.travel>=COL.sweepSpan){a.sweep=null;idle(a);}
}
function stepBeam(g,dt){
 const a=g.boss.network.col,m=a.beam,p=g.player,px=p.x+p.w/2;m.timer-=dt;
 if(m.state==='charge'){if(m.timer>.3)m.x=px;if(m.timer<=0){m.state='fire';m.timer=COL.beamTime;a.head=1;a.headTime=COL.beamTime;a.flash=.2;g.emit('bossCast',{boss:'infoshum',ability:'giantBeam',x:m.x,y:FLOOR});}return;}
 m.x+=clamp(px-m.x,-COL.beamSpeed*dt,COL.beamSpeed*dt);
 if(p.inv<=0&&p.dash===0&&Math.abs(px-m.x)<COL.beamHalf+p.w/2-6&&p.y+p.h>FLOOR-120)g.hurt(false,m.x);
 if(m.timer<=0){a.beam=null;a.head=0;idle(a);}
}
function stepColossus(g,dt){
 const b=g.boss,n=b.network,a=n.col,p=g.player;
 a.flash=Math.max(0,a.flash-dt);a.headTime=Math.max(0,a.headTime-dt);if(a.headTime<=0&&a.mode!=='collapse')a.head=0;
 if(a.dust){a.dust.time+=dt;if(a.dust.time>.45)a.dust=null;}
 b.x=centre(g)-b.w/2;b.y=120;
 for(const s of a.shocks){const v=COL.shockSpeed*dt;s.x+=s.dir*v;s.travel+=v;if(p.inv<=0&&p.dash===0&&overlap(p,{x:s.x-16,y:FLOOR-26,w:32,h:26}))g.hurt(false,s.x);}
 a.shocks=a.shocks.filter(s=>s.travel<COL.shockRange);
 a.timer-=dt;
 if(a.mode==='intro'){b.state='phaseChange';if(a.timer<=0)idle(a);return;}
 if(a.mode==='collapse'){b.state='recover';if(a.timer<=0)rise(a);return;}
 if(a.mode==='rise'){b.state='windup';if(a.timer<=0)idle(a);return;}
 b.state='windup';
 if(a.fist)stepFist(g,dt);else if(a.sweep)stepSweep(g,dt);else if(a.beam)stepBeam(g,dt);
 else if(a.mode==='idle'&&a.timer<=0)nextAttack(g);
}
function strikeColossus(g,paw){
 const b=g.boss,n=b.network,a=n.col,p=g.player,f=a.fist;if(a.lastSwing===p.swing)return false;
 if(f&&f.state==='stuck'&&f.weak&&overlap(paw,fistBox(f))){
  a.lastSwing=p.swing;a.hands[f.side]=false;f.weak=false;f.state='broken';f.timer=.5;b.hurtTime=.35;a.head=3;a.headTime=.7;a.flash=.2;
  g.emit('bossHit',{boss:'infoshum',x:f.x,y:FLOOR-40});g.emit('infoshumHandBroken',{side:f.side,x:f.x,y:FLOOR-40});return true;}
 if(a.mode==='collapse'&&overlap(paw,headBox(g))){
  a.lastSwing=p.swing;const h=headBox(g);b.hp=Math.max(PHASE_HP,b.hp-HIT_DAMAGE);b.hurtTime=.35;b.cooldown=.24;a.round++;
  g.emit('bossHit',{boss:'infoshum',x:h.x+h.w/2,y:h.y+h.h/2});g.emit('infoshumCoreHit',{x:h.x+h.w/2,y:h.y+h.h/2});
  if(b.hp<=PHASE_HP)beginBreakout(g);else rise(a);return true;}
 return false;
}
// ——— The breakout: he bursts out of the head screen ———
function beginBreakout(g){
 const b=g.boss,n=b.network,a=n.col;
 n.stage='breakout';n.mode='breakout';n.timer=BREAKOUT;n.transitionProgress=0;a.mode='collapse';a.fist=null;a.sweep=null;a.beam=null;a.shocks=[];g.bolts=[];
 b.phase=3;b.phaseName='На свободе';b.state='phaseChange';b.hp=PHASE_HP;g.player.inv=Math.max(g.player.inv,BREAKOUT+1);
 const h=headBox(g);g.emit('bossPhase',{boss:'infoshum',phase:3,name:'На свободе'});g.emit('infoshumRupture',{x:h.x+h.w/2,y:h.y});
}
// ——— Phase 3 «На свободе» ———
function beginFree(g){
 const b=g.boss,n=b.network,r=rooms[g.room];
 reshape(g,STORM_ISLANDS,'storm');landSafely(g,2,100);
 n.stage='free';n.free={mode:'enter',timer:FREE.enter,x:r.x+768,y:210,gy:FLOOR,hits:0,step:0,count:0,sub:0,tentacles:[],shards:[],yuri:false,flash:0,dir:1,rammed:false,lastSwing:-1};
 b.state='phaseChange';g.bolts=[];g.emit('infoshumFreed',{x:r.x+768,y:150});
}
function targetSurface(g){
 const p=g.player;
 const support=g.platforms.find(s=>s.id===p.supportId&&!s.bossHidden&&s.room===g.room);
 const surfaces=g.platforms.filter(s=>s.room===g.room&&!s.bossHidden&&p.x+p.w>s.x&&p.x<s.x+s.w);
 const below=surfaces.filter(s=>s.y>=p.y+p.h-6).sort((a,b)=>a.y-b.y)[0];
 const s=support||below||surfaces.sort((a,b)=>Math.abs(a.y-p.y-p.h)-Math.abs(b.y-p.y-p.h))[0]||g.platforms.find(s=>s.room===g.room&&!s.bossHidden);
 return {x:clamp(p.x+p.w/2,s.x+32,s.x+s.w-32),y:s.y,platformId:s.id,left:s.x,right:s.x+s.w};
}
export function ramBox(f){return {x:f.x-46,y:f.y-34,w:92,h:68};}
export function freeCoreBox(f){return {x:f.x-42,y:f.gy-64,w:84,h:64};}
function hover(f,gap){f.mode='hover';f.timer=gap;}
function nextFree(g){
 const b=g.boss,f=b.network.free,p=g.player,r=rooms[g.room],px=p.x+p.w/2,py=p.y+p.h/2,kind=FREE.plan[f.step++%FREE.plan.length];
 if(kind==='tentacle'){f.mode='tentacle';f.count=2+Math.min(2,f.hits);f.sub=0;}
 else if(kind==='volley'){const side=px-r.x<768?1:-1;f.mode='volley';f.timer=FREE.volleyMove;f.count=3;f.sub=0;f.from={x:f.x,y:f.y};f.tx=clamp(px+side*340,r.x+60,r.end-60);f.ty=clamp(py-6,70,440);f.dir=-side;}
 else{const s=targetSurface(g),fromLeft=px>=(s.left+s.right)/2;f.mode='ramPrep';f.timer=FREE.ramPrep;f.from={x:f.x,y:f.y};f.dir=fromLeft?1:-1;f.tx=fromLeft?s.left-180:s.right+180;f.ex=fromLeft?s.right-48:s.left+48;f.gy=s.y;f.ty=s.y-40;f.rammed=false;
  g.emit('infoshumWarning',{attack:'ram',x:f.tx,y:f.ty});}
}
function stepFree(g,dt){
 const b=g.boss,n=b.network,f=n.free,p=g.player,px=p.x+p.w/2,py=p.y+p.h/2,gap=FREE.gap[Math.min(2,f.hits)];
 f.flash=Math.max(0,f.flash-dt);
 for(const t of f.tentacles){t.time+=dt;if(t.state==='warn'&&t.time>=FREE.tentWarn){t.state='up';t.time=0;g.emit('boltImpact',{x:t.x,y:t.y,kind:'tentacle'});}
  if(t.state==='up'&&t.time<.3&&p.inv<=0&&p.dash===0&&Math.abs(px-t.x)<FREE.tentHalf+p.w/2-8&&p.y+p.h>t.y-90&&p.y<t.y+6)g.hurt(false,t.x);}
 f.tentacles=f.tentacles.filter(t=>!(t.state==='up'&&t.time>FREE.tentUp));
 for(const s of f.shards){s.x+=s.vx*dt;s.life-=dt;if(p.inv<=0&&p.dash===0&&overlap(p,{x:s.x-22,y:s.y-9,w:44,h:18}))g.hurt(false,s.x);}
 f.shards=f.shards.filter(s=>s.life>0);
 f.timer-=dt;const follow=()=>{f.x+=clamp(px-f.x,-140*dt,140*dt);f.y+=(FREE.hoverY+Math.sin(g.time*2)*8-f.y)*Math.min(1,dt*3);};
 const glide=total=>{const k=1-Math.max(0,f.timer)/total,e=k*k*(3-2*k);f.x=f.from.x+(f.tx-f.from.x)*e;f.y=f.from.y+(f.ty-f.from.y)*e;};
 if(f.mode==='enter'){b.state='phaseChange';f.y+=(FREE.hoverY-f.y)*Math.min(1,dt*2);if(f.timer<=0)hover(f,gap);}
 else if(f.mode==='hover'||f.mode==='hit'||f.mode==='bounce'){b.state='windup';follow();if(f.timer<=0){if(f.mode==='hover')nextFree(g);else hover(f,gap);}}
 else if(f.mode==='tentacle'){b.state='casting';follow();f.sub-=dt;
  if(f.sub<=0&&f.count>0){const s=targetSurface(g);f.tentacles.push({x:s.x,y:s.y,state:'warn',time:0});f.count--;f.sub=FREE.tentGap;g.emit('infoshumWarning',{attack:'tentacle',x:s.x,y:s.y});}
  if(f.count===0&&!f.tentacles.length)hover(f,gap);}
 else if(f.mode==='volley'){b.state='casting';
  if(f.timer>0)glide(FREE.volleyMove);else{f.x=f.tx;f.sub-=dt;f.y+=(clamp(py-6,70,440)-f.y)*Math.min(1,dt*4);
   if(f.sub<=0&&f.count>0){f.shards.push({x:f.x+f.dir*40,y:f.y,vx:f.dir*FREE.shardSpeed,life:2.4});f.count--;f.sub=FREE.volleyGap;g.emit('bossCast',{boss:'infoshum',ability:'shards',x:f.x,y:f.y});}
   if(f.count===0&&f.sub<=-.3)hover(f,gap);}}
 else if(f.mode==='ramPrep'){b.state='windup';glide(FREE.ramPrep);if(f.timer<=0){f.x=f.tx;f.y=f.ty;f.mode='ram';g.emit('bossCast',{boss:'infoshum',ability:'ram',x:f.x,y:f.y});}}
 else if(f.mode==='ram'){b.state='casting';f.x+=f.dir*FREE.ramSpeed*dt;
  if(!f.rammed&&p.inv<=0&&p.dash===0&&overlap(p,ramBox(f))){g.hurt(false,f.x);f.rammed=true;}
  if(f.dir>0?f.x>=f.ex:f.x<=f.ex){f.x=f.ex;if(f.rammed){f.mode='bounce';f.timer=FREE.bounce;}else{f.mode='crash';f.timer=FREE.crash;f.flash=.15;g.emit('boltImpact',{x:f.x,y:f.gy,kind:'crash'});}}}
 else if(f.mode==='crash'){b.state='recover';f.y=f.gy-34;if(f.timer<=0){f.mode='dizzy';f.yuri=b.hp<=HIT_DAMAGE;f.timer=f.yuri?FREE.dizzyYuri:FREE.dizzy;g.emit('infoshumWeak',{x:f.x,y:f.gy-40});if(f.yuri)g.emit('yuriHold',{x:f.x,y:f.gy-40,last:true});}}
 else if(f.mode==='dizzy'){b.state='recover';f.y=f.gy-34;if(f.timer<=0){f.yuri=false;hover(f,gap);}}
 b.x=f.x-b.w/2;b.y=f.y-b.h/2;
}
function strikeCore(g,paw){
 const b=g.boss,f=b.network.free,p=g.player;if(f.mode!=='dizzy'||f.lastSwing===p.swing||!overlap(paw,freeCoreBox(f)))return false;
 f.lastSwing=p.swing;b.hp=Math.max(0,b.hp-HIT_DAMAGE);b.hurtTime=.35;b.cooldown=.24;f.hits++;f.yuri=false;
 g.emit('bossHit',{boss:'infoshum',x:f.x,y:f.gy-34});g.emit('infoshumCoreHit',{x:f.x,y:f.gy-34});
 if(b.hp===0){b.x=f.x-b.w/2;b.y=f.gy-b.h+10;f.tentacles=[];f.shards=[];g.bossDefeated();return true;}
 f.mode='hit';f.timer=FREE.hit;f.flash=.2;return true;
}
export function corePoint(b){return {x:b.x+b.w/2,y:b.y+b.h/2+8};}
export function coreBox(b){const c=corePoint(b);return {x:c.x-34,y:c.y-34,w:68,h:68};}
export function headlineBoxes(){return [];}
// A fall between the storm islands returns Uma to the last island she stood on (and costs a heart).
export function infoshumFall(g){const n=g.boss?.network;if(g.room!==STAGE_ROOM||n?.stage!=='free')return false;return pitFall(g,STAGE_ROOM,s=>!s.bossHidden);}
export function stepInfoshum(g,dt,paw=null){
 const b=g.boss,n=b.network;if(!n||b.hp<=0)return;
 if(n.stage==='network'){stepScreens(g,dt);return;}
 if(n.stage==='assemble'){n.timer=Math.max(0,n.timer-dt);n.transitionProgress=1-n.timer/ASSEMBLE;if(n.timer===0)beginColossus(g);return;}
 if(n.stage==='colossus'){stepColossus(g,dt);return;}
 if(n.stage==='breakout'){n.timer=Math.max(0,n.timer-dt);n.transitionProgress=1-n.timer/BREAKOUT;n.col.flash=Math.max(0,n.col.flash-dt);if(n.timer===0)beginFree(g);return;}
 if(n.stage==='free')stepFree(g,dt);
}
export function strikeInfoshum(g,paw){
 const b=g.boss,n=b.network,p=g.player;if(!b.active||!n||p.attack<=0||b.hp<=0||g.mode!=='playing')return false;
 if(n.stage==='network')return strikeScreens(g,paw);
 if(n.stage==='colossus')return strikeColossus(g,paw);
 if(n.stage==='free')return strikeCore(g,paw);
 return false;
}
export function infoshumTargets(g){
 const b=g.boss,n=b.network;if(!n||b.hp<=0)return [];
 if(n.stage==='network'){const t=realScreen(n);return t&&n.yuriOn?[{id:'screen'+t.index,x:t.x,y:t.y,w:t.w,h:t.h}]:[];}
 if(n.stage==='colossus'){const a=n.col;if(a.fist?.state==='stuck'&&a.fist.weak)return [{id:'fist',...fistBox(a.fist)}];if(a.mode==='collapse')return [{id:'head',...headBox(g)}];}
 if(n.stage==='free'&&n.free?.mode==='dizzy')return [{id:'core',...freeCoreBox(n.free)}];
 return [];
}
// ——— Test and debugging helpers ———
const paws=g=>{const p=g.player;p.attack=.18;p.swing++;};
export function exposeInfoshum(g){const b=g.boss,n=b.network,p=g.player;b.cooldown=0;
 if(n.stage==='network'){buildWall(g);if(!realScreen(n)){startWave(g);showFaces(g,true);}else if(!n.yuriOn)yuriFinds(g);n.mode='face';n.timer=9;}
 else if(n.stage==='colossus'){const a=n.col;if(a.mode==='collapse')return;a.sweep=null;a.beam=null;a.shocks=[];if(!a.hands.L&&!a.hands.R){collapse(g);return;}
  a.mode='attack';a.fist={side:a.hands.R?'R':'L',x:clamp(p.x+p.w/2+70,rooms[g.room].x+120,rooms[g.room].end-120),y:0,state:'stuck',timer:COL.stuck[0],weak:true,lastSwing:-1};}
 else if(n.stage==='free'){const f=n.free,t=targetSurface(g);Object.assign(f,{mode:'dizzy',timer:FREE.dizzy,x:t.x,gy:t.y,y:t.y-34,yuri:b.hp<=HIT_DAMAGE});f.tentacles=[];f.shards=[];}
}
// Smash the real screen through the real mechanics (Uma beside it on its tier, one paw strike).
export function crackInfoshumScreen(g){
 const b=g.boss,n=b.network;if(n.stage!=='network')return false;exposeInfoshum(g);const t=realScreen(n);if(!t)return false;
 const p=g.player,s=g.platforms.find(s=>s.room===g.room&&s.index===(t.kind==='huge'?9:t.on));
 Object.assign(p,{x:t.kind==='huge'?s.x+s.w-p.w-2:t.x+t.w/2-p.w-4,y:s.y-48,h:48,vy:0,vx:0,grounded:true,supportId:s.id,dir:1});
 paws(g);return strikeInfoshum(g,{x:p.x+16,y:p.y-2,w:54,h:p.h+6});
}
// Smash the whole wall (nine real screens, then the huge one) — the colossus starts assembling.
export function smashWall(g){const n=g.boss.network;let k=0;while(n.stage==='network'&&k++<60){crackInfoshumScreen(g);for(const t of n.tvs)if(t.state==='crack')t.state='broken';}return n.stage;}
export function colossusInfoshum(g){const n=g.boss.network;if(n.stage==='network')smashWall(g);if(n.stage==='assemble'){n.timer=0;stepInfoshum(g,0);}if(n.stage==='colossus'&&n.col.mode==='intro')idle(n.col);return n.stage;}
// Break one hand: a stuck fist beside Uma, one paw on its knuckles.
export function breakHand(g){const n=g.boss.network;if(n.stage!=='colossus'||n.col.mode==='collapse')return false;exposeInfoshum(g);const a=n.col,f=a.fist;if(!f)return false;
 Object.assign(g.player,{x:f.x-70,y:FLOOR-48,h:48,vx:0,vy:0,grounded:true,dir:1});paws(g);const ok=strikeInfoshum(g,fistBox(f));a.fist=null;if(!a.hands.L&&!a.hands.R)collapse(g);else idle(a);return ok;}
// One whole round: both hands, the collapse, a paw on the head screen.
export function dropColossus(g){const n=g.boss.network;if(n.stage!=='colossus')return false;if(n.col.mode==='rise')idle(n.col);breakHand(g);breakHand(g);if(n.col.mode!=='collapse')return false;paws(g);return strikeInfoshum(g,headBox(g));}
// Drive the fight to the last phase.
export function freeInfoshum(g){const n=g.boss.network;colossusInfoshum(g);for(let k=0;k<3&&n.stage==='colossus';k++)dropColossus(g);if(n.stage==='breakout'){n.timer=0;stepInfoshum(g,0);}if(n.stage==='free'&&n.free.mode==='enter')hover(n.free,FREE.gap[0]);return n.stage;}
// The final blow through the real mechanics (he lies dizzy on Uma's island, one paw strike).
export function finishInfoshum(g){const b=g.boss,n=b.network;if(n.stage!=='free')freeInfoshum(g);b.hp=Math.min(b.hp,HIT_DAMAGE);exposeInfoshum(g);paws(g);return strikeInfoshum(g,freeCoreBox(n.free));}
