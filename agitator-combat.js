// «Слова становятся вещами»: the Agitator fight in three phases of six health each.
// 1 «Лозунг»: from the mast deck he fires a slogan. Its letters slam into the roof as blocks and
//   build a staircase to him. Then his megaphone overheats: climb the letters and strike.
//   A flying letter can be batted back into him.
// 2 «Митинг»: he jumps down. Placards climb out of hatches and march to the beat. On «УРА!»
//   he turns to the crowd: his back is open.
// 3 «Прямой эфир»: from an antenna tower he blows gusts across the roof with Сенсации in them.
//   Hide behind chimneys, climb the ladder and hit the screen; he then leaps to the other tower.
import {rooms} from './level.js?v=0.21.5';
import {FLOOR_Y,MAST_X,MAST_DECK,LETTER,SLOGAN,LETTER_FRAMES,SLOT_ORDER,HATCHES,TOWERS,CHIMNEYS,AGI,slotRect} from './agitator-map.js?v=0.21.5';
export const AGITATOR_HP=18,PHASE_HP=6,HIT_DAMAGE=2,BEAT=60/132;
export const SLOGAN_TIMES={rest:1.1,windup:.9,gap:.26,flight:.62,overheat:4,crumble:.5,blastWarn:.55,stun:1.1,burst:.4};
export const RALLY_TIMES={spawn:2.3,max:4,step:22,ura:5.4,uraWarn:.55,uraHold:2.5,swingWarn:.45,swing:.3,stomp:6.5,speed:46,stun:.9};
export const AIR_TIMES={calm:2.6,warn:.8,gust:1.7,wind:120,deckWarn:.6,swingWarn:.45,swing:.3,stun:.7,jump:1.4,bird:255};
export const BOSS_W=88,BOSS_H=140;
const X0=()=>rooms[4].x,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export const SHELTERS=[...CHIMNEYS,{x:MAST_X-46,w:92,h:150,mast:true}];
export function createBroadcastFight(){
 return {stage:'slogan',mode:'rest',timer:1.4,side:'left',fired:0,letters:[],placards:[],birds:[],fx:[],hatches:HATCHES.map(()=>0),mast:'standing',tower:1,
  wind:{phase:'calm',timer:AIR_TIMES.calm},blast:0,deckTime:0,spawnTimer:1,uraTimer:RALLY_TIMES.ura,stompTimer:RALLY_TIMES.stomp,beatClock:0,beat:0,walkTime:0,serial:0,jump:null,swingDir:1};
}
// World-space helpers.
export function mastStand(){return {x:X0()+MAST_X-BOSS_W/2,y:MAST_DECK.y-BOSS_H};}
export function towerStand(i){return {x:X0()+TOWERS[i].stand,y:TOWERS[i].deck.y-BOSS_H};}
export function towerDeckId(i){return '4:'+AGI.towers[i];}
export function windDir(n){return n.tower===0?1:-1;}
export function placeAgitator(b){Object.assign(b,mastStand(),{w:BOSS_W,h:BOSS_H,dir:-1});}
function slotId(side,i){return '4:'+(AGI.slots[side]+i);}
function fx(n,kind,x,y,life=.6,extra={}){n.fx.push({kind,x,y,age:0,life,...extra});}
function hurtUma(g,x,push=0){const before=g.health;g.hurt(false,x);if(push&&g.mode==='playing'&&g.health<before)g.push(push,x);}
// Letter slots and the mast deck exist only while their phase needs them.
export function syncAgitatorPlatforms(g){
 const n=g.boss?.broadcast;if(g.room!==4&&!g.platforms.some(s=>s.room===4))return;
 for(const s of g.platforms){if(s.room!==4)continue;
  if(s.index===AGI.mast)s.bossHidden=!n||n.mast!=='standing';
  else if(s.index>=AGI.slots.left){const side=s.index>=AGI.slots.right?'right':'left',i=s.index-AGI.slots[side];
   const l=n?.letters.find(l=>l.side===side&&l.slot===i&&(l.state==='block'||l.state==='crumble'&&l.time<.3));s.bossHidden=!l;}
 }
}
export function agitatorHitbox(b){return {x:b.x+6,y:b.y+16,w:b.w-12,h:b.h-20};}
// Whether a strike from sourceX can hurt him right now.
export function agitatorOpen(g,sourceX=g.player.x+g.player.w/2){
 const b=g.boss,n=b.broadcast;if(!n||b.hp<=0||b.cooldown>0)return false;
 if(n.stage==='slogan')return n.mode==='overheat';
 if(n.stage==='rally')return n.mode==='ura'&&(sourceX-(b.x+b.w/2))*b.dir<0;
 if(n.stage==='air')return !['jump','stun'].includes(n.mode);
 return false;
}
// Test and debugging helper: put him in the opening of his current phase.
export function exposeAgitator(g){const n=g.boss.broadcast;g.boss.cooldown=0;if(n.stage==='slogan'){n.mode='overheat';n.timer=SLOGAN_TIMES.overheat;}else if(n.stage==='rally'){n.mode='ura';n.timer=RALLY_TIMES.uraHold;g.boss.dir=g.player.x+17<g.boss.x+g.boss.w/2?1:-1;}else if(n.stage==='air')n.mode='idle';}
export function damageAgitator(g,amount=HIT_DAMAGE,sourceX){
 const b=g.boss,n=b.broadcast;if(!b.active||!n||b.hp<=0||g.mode!=='playing')return false;
 if(!agitatorOpen(g,sourceX)){b.guardFlash=.24;g.emit('blocked',{x:b.x+b.w/2,y:b.y+40});return false;}
 const before=b.hp;b.hp=Math.max(0,b.hp-Math.max(HIT_DAMAGE,amount));b.cooldown=.5;b.hurtTime=.35;
 g.emit('bossHit',{boss:b.id,x:b.x+b.w/2,y:b.y+b.h/2});fx(n,'burst',b.x+b.w/2,b.y+60,.45);
 if(!b.hp){clearArena(g);g.bossDefeated();return true;}
 const threshold=AGITATOR_HP-PHASE_HP*b.phase;
 if(b.hp<=threshold&&before>threshold)beginTransition(g);
 else if(n.stage==='slogan'){n.mode='burst';n.timer=SLOGAN_TIMES.burst;crumbleLetters(n);fx(n,'explosion',b.x+b.w/2+b.dir*58,b.y+78,.55);}
 else if(n.stage==='rally'){n.mode='stun';n.timer=RALLY_TIMES.stun;n.uraTimer=RALLY_TIMES.ura*.8;fx(n,'stars',b.x+b.w/2,b.y+8,RALLY_TIMES.stun);}
 else if(n.stage==='air'){n.mode='stun';n.timer=AIR_TIMES.stun;n.wind={phase:'calm',timer:AIR_TIMES.calm};n.birds=[];fx(n,'stars',b.x+b.w/2,b.y+8,AIR_TIMES.stun);}
 return true;
}
function clearArena(g){const n=g.boss.broadcast;n.letters=[];n.placards=[];n.birds=[];g.bolts=[];syncAgitatorPlatforms(g);}
function crumbleLetters(n){for(const l of n.letters)if(l.state==='block'||l.state==='fly'){l.state='crumble';l.time=0;}}
function beginTransition(g){
 const b=g.boss,n=b.broadcast;b.phase++;b.state='phaseChange';g.bolts=[];g.player.inv=Math.max(g.player.inv,2);n.blast=0;
 if(b.phase===2){n.stage='leap';n.mode='crack';n.timer=.4;crumbleLetters(n);}
 else{n.stage='climb';n.mode='crack';n.timer=.6;for(const p of n.placards)if(p.state!=='broken'){p.state='knocked';p.time=0;}}
 g.emit('bossPhase',{boss:b.id,phase:b.phase,name:b.phase===2?'Митинг':'Прямой эфир'});
}
function startJump(g,to,duration,arc){const b=g.boss,n=b.broadcast;n.jump={from:{x:b.x,y:b.y},to,time:0,duration,arc};n.mode='jump';b.dir=to.x>b.x?1:-1;g.emit('bossShift',{boss:b.id,x:to.x,y:to.y});}
function stepJump(g,dt){const b=g.boss,n=b.broadcast,j=n.jump;j.time=Math.min(j.duration,j.time+dt);const t=j.time/j.duration;b.x=lerp(j.from.x,j.to.x,t);b.y=lerp(j.from.y,j.to.y,t)-Math.sin(t*Math.PI)*j.arc;
 if(t>=1){b.x=j.to.x;b.y=j.to.y;n.jump=null;fx(n,'dust',b.x+b.w/2,b.y+b.h-8,.6);fx(n,'rings',b.x+b.w/2,b.y+b.h-4,.5);g.emit('bossLand',{boss:b.id,x:b.x+b.w/2,y:b.y+b.h});return true;}return false;}
// ——— Phase 1 «Лозунг» ———
function fireLetter(g){
 const b=g.boss,n=b.broadcast,i=n.fired++,slot=slotRect(n.side,i),ch=SLOGAN[i],x0=X0();
 const from={x:b.x+b.w/2+b.dir*62,y:b.y+70},to={x:x0+slot.cx,y:slot.y+LETTER/2};
 n.letters.push({id:++n.serial,ch,frame:LETTER_FRAMES[ch],side:n.side,slot:i,state:'fly',time:0,from,to,x:from.x,y:from.y,lastSwing:-1});
 g.emit('bossCast',{boss:b.id,ability:'slogan',x:from.x,y:from.y});
}
function letterBox(l){return {x:l.x-LETTER/2,y:l.y-LETTER/2,w:LETTER,h:LETTER};}
function stepLetters(g,dt,paw){
 const b=g.boss,n=b.broadcast,p=g.player;
 for(const l of n.letters){l.time+=dt;
  if(l.state==='fly'){const t=Math.min(1,l.time/SLOGAN_TIMES.flight);l.x=lerp(l.from.x,l.to.x,t);l.y=lerp(l.from.y,l.to.y,t)-Math.sin(t*Math.PI)*110;
   if(paw&&p.attack>0&&l.lastSwing!==p.swing&&overlap(paw,letterBox(l))){l.lastSwing=p.swing;l.state='back';l.time=0;g.parries=(g.parries||0)+1;g.emit('parry',{x:l.x,y:l.y,kind:'letter',visual:'agitator'});continue;}
   if(overlap(p,letterBox(l))&&p.dash===0){hurtUma(g,l.x);l.state='crumble';l.time=0;continue;}
   if(t>=1){l.state='block';l.time=0;l.x=l.to.x;l.y=l.to.y;g.emit('letterLand',{x:l.x,y:l.y+LETTER/2,ch:l.ch});fx(n,'dust',l.x,l.y+LETTER/2,.4,{small:true});
    if(overlap(p,{x:l.x-LETTER/2,y:l.y-LETTER/2,w:LETTER,h:LETTER-8})&&p.dash===0)hurtUma(g,l.x,p.x+17<l.x?-1:1);}
  }
  else if(l.state==='back'){const tx=b.x+b.w/2,ty=b.y+60,dx=tx-l.x,dy=ty-l.y,len=Math.hypot(dx,dy)||1,step=430*dt;
   if(len<=Math.max(28,step)){l.state='crumble';l.time=0;
    // A batted-back letter knocks him out of any slogan pose, overheated or not.
    if(n.stage==='slogan'&&!['burst','stun'].includes(n.mode)&&b.cooldown<=0&&b.hp>0){const mode=n.mode;n.mode='overheat';if(!damageAgitator(g,HIT_DAMAGE,l.x))n.mode=mode;else if(n.stage==='slogan'&&n.mode==='burst'){n.mode='stun';n.timer=SLOGAN_TIMES.stun;fx(n,'stars',b.x+b.w/2,b.y+8,SLOGAN_TIMES.stun);}}}
   else{l.x+=dx/len*step;l.y+=dy/len*step;}
  }
 }
 n.letters=n.letters.filter(l=>!(l.state==='crumble'&&l.time>SLOGAN_TIMES.crumble));
}
function onMastDeck(g){const p=g.player;return p.grounded&&p.supportId==='4:'+AGI.mast;}
function stepSlogan(g,dt,paw){
 const b=g.boss,n=b.broadcast,p=g.player;Object.assign(b,mastStand());
 if(!['burst','stun'].includes(n.mode))b.dir=p.x+17<b.x+b.w/2?-1:1;
 stepLetters(g,dt,paw);
 // Standing next to him while the megaphone is cool gets Uma blown off the deck.
 if(onMastDeck(g)&&!['overheat','burst','stun'].includes(n.mode)){if(!n.blast){n.blast=SLOGAN_TIMES.blastWarn;g.emit('bossWarning',{boss:b.id,ability:'blast',x:b.x,y:b.y});}}
 if(n.blast){n.blast=Math.max(0,n.blast-dt);if(!n.blast){fx(n,'wave',b.x+b.w/2+b.dir*70,b.y+72,.5,{dir:b.dir});g.emit('broadcastPush',{x:p.x,y:p.y});if(Math.abs(p.x+17-(b.x+b.w/2))<170&&p.y+p.h>b.y&&p.y<b.y+b.h+10)g.push(p.x+17<b.x+b.w/2?-1:1,b.x+b.w/2);}}
 n.timer-=dt;if(n.timer>0&&n.mode!=='volley')return;
 if(n.mode==='rest'){n.mode='windup';n.timer=SLOGAN_TIMES.windup;n.side=p.x+17<X0()+MAST_X?'left':'right';n.fired=0;g.emit('bossWarning',{boss:b.id,ability:'slogan',x:b.x,y:b.y});}
 else if(n.mode==='windup'){n.mode='volley';n.timer=0;}
 else if(n.mode==='volley'){if(n.timer<=0&&n.fired<SLOGAN.length){fireLetter(g);n.timer=SLOGAN_TIMES.gap;}
  if(n.fired>=SLOGAN.length&&!n.letters.some(l=>l.state==='fly')){n.mode='overheat';n.timer=SLOGAN_TIMES.overheat;g.emit('agitatorOverheat',{x:b.x+b.w/2,y:b.y+70});}}
 else if(n.mode==='overheat'||n.mode==='stun'){n.mode='cool';n.timer=SLOGAN_TIMES.crumble;crumbleLetters(n);if(n.letters.length)g.emit('lettersCrumble',{x:b.x,y:b.y});}
 else if(n.mode==='burst'){n.mode='stun';n.timer=SLOGAN_TIMES.stun;fx(n,'stars',b.x+b.w/2,b.y+8,SLOGAN_TIMES.stun);}
 else{n.mode='rest';n.timer=SLOGAN_TIMES.rest;}
}
// ——— Phase 2 «Митинг» ———
const PLACARD_W=40,PLACARD_H=58;
function spawnPlacard(g){
 const b=g.boss,n=b.broadcast,p=g.player,x0=X0(),px=p.x+17,hatch=HATCHES.map((x,i)=>({x:x0+x,i})).sort((a,c)=>Math.abs(c.x-px)-Math.abs(a.x-px))[0];
 n.hatches[hatch.i]=1.2;n.placards.push({id:++n.serial,x:hatch.x-PLACARD_W/2,y:FLOOR_Y-PLACARD_H,w:PLACARD_W,h:PLACARD_H,dir:px<hatch.x?-1:1,kind:n.serial%3,state:'rise',time:0,hop:0,lastSwing:-1});
 g.emit('placardRise',{x:hatch.x,y:FLOOR_Y});
}
function stepPlacards(g,dt,paw,beatNow){
 const n=g.boss.broadcast,p=g.player,x0=X0(),ura=n.stage==='rally'&&n.mode==='ura';
 for(const c of n.placards){c.time+=dt;
  if(c.state==='rise'){if(c.time>=.5){c.state='march';c.time=0;}continue;}
  if(c.state==='knocked'){if(c.time>=.4){c.state='broken';c.time=0;}continue;}
  if(c.state==='broken')continue;
  if(beatNow){c.hop=1;c.hopFrom=c.x;}
  if(c.hop>0){c.hop=Math.max(0,c.hop-dt/.3);const t=1-c.hop;if(!ura)c.x=c.hopFrom+c.dir*RALLY_TIMES.step*t;c.lift=Math.sin(t*Math.PI)*(ura?26:9);}else c.lift=0;
  if(c.x<x0+190||c.x+c.w>x0+1346){c.dir*=-1;c.x=clamp(c.x,x0+190,x0+1346-c.w);c.hopFrom=c.x;}
  const box={x:c.x,y:c.y-(c.lift||0),w:c.w,h:c.h};
  if(paw&&p.attack>0&&c.lastSwing!==p.swing&&overlap(paw,box)){c.lastSwing=p.swing;knock(g,c);continue;}
  const feet=p.y+p.h;if(p.vy>0&&feet<=box.y+16&&feet>=box.y-4&&p.x+p.w>box.x+4&&p.x<box.x+box.w-4){p.vy=-360;p.grounded=false;knock(g,c);g.emit('stomp',{x:c.x+c.w/2,y:box.y});continue;}
  if(p.dash===0&&overlap(p,box))hurtUma(g,c.x+c.w/2,p.x+17<c.x+c.w/2?-1:1);
 }
 n.placards=n.placards.filter(c=>!(c.state==='broken'&&c.time>.7));
}
// Placards and gust birds keep coming, so they do not add to the kill score.
function knock(g,c){c.state='knocked';c.time=0;g.emit('enemyHit',{x:c.x+c.w/2,y:c.y,enemyType:'placard'});}
function stepRally(g,dt,paw,beatNow){
 const b=g.boss,n=b.broadcast,p=g.player,x0=X0(),px=p.x+17,cx=b.x+b.w/2,front=(px-cx)*b.dir;
 b.y=FLOOR_Y-BOSS_H;stepPlacards(g,dt,paw,beatNow);
 n.spawnTimer-=dt;if(n.spawnTimer<=0){n.spawnTimer=RALLY_TIMES.spawn;if(n.placards.filter(c=>c.state!=='broken').length<RALLY_TIMES.max)spawnPlacard(g);}
 n.timer-=dt;
 if(n.mode==='walk'){
  b.dir=px<cx?-1:1;n.uraTimer-=dt;n.stompTimer-=dt;
  if(Math.abs(px-cx)>150){b.x=clamp(b.x+b.dir*RALLY_TIMES.speed*dt,x0+200,x0+1336-b.w);n.walkTime+=dt;}
  if(n.uraTimer<=0){n.mode='uraWarn';n.timer=RALLY_TIMES.uraWarn;g.emit('bossWarning',{boss:b.id,ability:'ura',x:b.x,y:b.y});}
  else if(Math.abs(px-cx)<125&&Math.abs(p.y+p.h-(b.y+b.h))<70){n.mode='swingWarn';n.timer=RALLY_TIMES.swingWarn;n.swingDir=b.dir;g.emit('bossWarning',{boss:b.id,ability:'swing',x:b.x,y:b.y});}
  else if(n.stompTimer<=0&&Math.abs(px-cx)>260){n.mode='stomp';n.timer=.5;g.emit('bossWarning',{boss:b.id,ability:'stomp',x:b.x,y:b.y});}
 }
 else if(n.mode==='uraWarn'&&n.timer<=0){n.mode='ura';n.timer=RALLY_TIMES.uraHold;b.dir=px<cx?1:-1;g.emit('bossCast',{boss:b.id,ability:'ura',x:cx,y:b.y});fx(n,'burst',cx,b.y+20,.4,{cyan:true});}
 else if(n.mode==='ura'&&n.timer<=0){n.mode='walk';n.uraTimer=RALLY_TIMES.ura;}
 else if(n.mode==='swingWarn'&&n.timer<=0){n.mode='swing';n.timer=RALLY_TIMES.swing;const hit={x:n.swingDir>0?b.x+b.w-14:b.x-102,y:b.y+54,w:116,h:86};g.emit('bossCast',{boss:b.id,ability:'swing',x:cx,y:b.y});if(overlap(p,hit)&&p.dash===0)hurtUma(g,cx,n.swingDir);}
 else if(n.mode==='swing'&&n.timer<=0){n.mode='walk';}
 else if(n.mode==='stomp'&&n.timer<=0){n.mode='land';n.timer=.35;n.stompTimer=RALLY_TIMES.stomp;fx(n,'rings',cx,FLOOR_Y-4,.5);fx(n,'dust',cx,FLOOR_Y-8,.5);
  for(const dir of[-1,1])g.bolts.push({room:4,kind:'wave',visual:'agitator',x:cx+dir*50-16,y:FLOOR_Y-12,w:32,h:12,vx:dir*250,vy:0,ttl:4,fixedY:true});g.emit('bossCast',{boss:b.id,ability:'stomp',x:cx,y:FLOOR_Y});}
 else if(n.mode==='land'&&n.timer<=0)n.mode='walk';
 else if(n.mode==='stun'&&n.timer<=0)n.mode='walk';
}
// ——— Phase 3 «Прямой эфир» ———
export function sheltered(g){
 const n=g.boss.broadcast,p=g.player,x0=X0(),px=p.x+p.w/2,feet=p.y+p.h,t=TOWERS[n.tower],dir=windDir(n);
 if(px>=x0+t.x&&px<=x0+t.x+t.w)return true;
 return SHELTERS.some(c=>{const left=x0+c.x,right=left+c.w,top=FLOOR_Y-c.h;if(feet<top+10)return false;return dir>0?px>=right-8&&px<=right+70:px<=left+8&&px>=left-70;});
}
function spawnBirds(g){const n=g.boss.broadcast,t=TOWERS[n.tower],dir=windDir(n),x=X0()+(dir>0?t.x+t.w:t.x);for(const [y,delay] of[[FLOOR_Y-60,0],[FLOOR_Y-150,.45]])n.birds.push({x:x-(dir>0?0:34)-dir*delay*AIR_TIMES.bird,y,w:34,h:20,dir,state:'fly',time:0,lastSwing:-1});g.emit('sensationWarning',{x,y:FLOOR_Y-60});}
function stepBirds(g,dt,paw){
 const n=g.boss.broadcast,p=g.player,x0=X0();
 for(const s of n.birds){s.time+=dt;if(s.state!=='fly')continue;s.x+=s.dir*AIR_TIMES.bird*dt;
  const inArena=s.x>x0+190&&s.x+s.w<x0+1346;
  if(inArena&&SHELTERS.some(c=>overlap(s,{x:x0+c.x,y:FLOOR_Y-c.h,w:c.w,h:c.h}))){s.state='burst';s.time=0;g.emit('boltImpact',{x:s.x+17,y:s.y+10,kind:'sensation'});continue;}
  if(paw&&p.attack>0&&s.lastSwing!==p.swing&&overlap(paw,s)){s.lastSwing=p.swing;s.state='burst';s.time=0;g.emit('enemyHit',{x:s.x+17,y:s.y,enemyType:'sensation'});continue;}
  if(p.dash===0&&p.inv<=0&&overlap(p,s)){s.state='burst';s.time=0;hurtUma(g,s.x+17,s.dir);g.emit('sensationHit',{x:s.x+17,y:s.y});}
 }
 n.birds=n.birds.filter(s=>(s.state==='fly'&&s.x>x0-60&&s.x<x0+1600)||s.state==='burst'&&s.time<.35);
}
function stepAir(g,dt,paw){
 const b=g.boss,n=b.broadcast,p=g.player,dir=windDir(n);stepBirds(g,dt,paw);
 if(n.mode==='jump'){if(stepJump(g,dt)){n.mode='idle';n.wind={phase:'calm',timer:1.6};n.deckTime=0;}return;}
 Object.assign(b,towerStand(n.tower));
 if(n.mode==='stun'){n.timer-=dt;if(n.timer<=0){n.tower=1-n.tower;startJump(g,towerStand(n.tower),AIR_TIMES.jump,140);}return;}
 b.dir=dir;
 // Wind cycle.
 const w=n.wind;w.timer-=dt;
 if(w.timer<=0){if(w.phase==='calm'){w.phase='warn';w.timer=AIR_TIMES.warn;g.emit('gustWarning',{x:p.x,y:p.y});}else if(w.phase==='warn'){w.phase='gust';w.timer=AIR_TIMES.gust;spawnBirds(g);g.emit('bossCast',{boss:b.id,ability:'gust',x:b.x,y:b.y});}else{w.phase='calm';w.timer=AIR_TIMES.calm;}}
 if(w.phase==='gust'&&p.dash===0&&!p.climbing&&!sheltered(g)){p.x+=dir*AIR_TIMES.wind*dt;const r=rooms[4];p.x=clamp(p.x,r.x,r.end-p.w);}
 // Uma reached his deck: a warned swing of the megaphone.
 const onDeck=p.grounded&&p.supportId===towerDeckId(n.tower);n.deckTime=onDeck?n.deckTime+dt:0;
 if(n.mode==='idle'&&n.deckTime>AIR_TIMES.deckWarn){n.mode='swingWarn';n.timer=AIR_TIMES.swingWarn;g.emit('bossWarning',{boss:b.id,ability:'swing',x:b.x,y:b.y});}
 else if(n.mode==='swingWarn'){n.timer-=dt;if(n.timer<=0){n.mode='swing';n.timer=AIR_TIMES.swing;const hit={x:dir>0?b.x+b.w-14:b.x-110,y:b.y+40,w:124,h:110};g.emit('bossCast',{boss:b.id,ability:'swing',x:b.x,y:b.y});if(overlap(p,hit)&&p.dash===0)hurtUma(g,b.x+b.w/2,dir);}}
 else if(n.mode==='swing'){n.timer-=dt;if(n.timer<=0){n.mode='idle';n.deckTime=0;}}
}
// ——— Transitions ———
function stepTransition(g,dt){
 const b=g.boss,n=b.broadcast,p=g.player,x0=X0();
 stepLetters(g,dt,null);stepPlacards(g,dt,null,false);stepBirds(g,dt,null);
 if(n.mode==='jump'){if(stepJump(g,dt)){if(n.stage==='leap'){n.stage='rally';n.mode='walk';n.timer=0;n.spawnTimer=.8;n.uraTimer=RALLY_TIMES.ura*.75;n.stompTimer=RALLY_TIMES.stomp;}else{n.stage='air';n.mode='idle';n.wind={phase:'calm',timer:2};n.placards=[];}b.state='recover';}return;}
 n.timer-=dt;if(n.timer>0)return;
 if(n.stage==='leap'){n.mast='bent';syncAgitatorPlatforms(g);g.emit('mastBend',{x:x0+MAST_X,y:MAST_DECK.y});fx(n,'sparks',x0+MAST_X-30,MAST_DECK.y+90,.7);const away=p.x+17<x0+MAST_X?1:-1;startJump(g,{x:x0+MAST_X-BOSS_W/2+away*190,y:FLOOR_Y-BOSS_H},1.1,90);}
 else{n.tower=p.x+17<x0+768?1:0;startJump(g,towerStand(n.tower),1.4,170);}
}
export function stepAgitator(g,dt,paw=null){
 const b=g.boss,n=b.broadcast;if(!n||b.hp<=0)return;
 b.guardFlash=Math.max(0,(b.guardFlash||0)-dt);
 for(const f of n.fx)f.age+=dt;n.fx=n.fx.filter(f=>f.age<f.life);
 for(let i=0;i<n.hatches.length;i++)n.hatches[i]=Math.max(0,n.hatches[i]-dt);
 n.beatClock+=dt;const beat=Math.floor(n.beatClock/BEAT),beatNow=beat!==n.beat;n.beat=beat;
 if(n.stage==='slogan'){b.state=n.mode==='overheat'?'recover':n.mode==='windup'?'windup':'casting';stepSlogan(g,dt,paw);}
 else if(n.stage==='rally'){b.state=n.mode==='ura'?'recover':['uraWarn','swingWarn','stomp'].includes(n.mode)?'windup':'casting';stepRally(g,dt,paw,beatNow);}
 else if(n.stage==='air'){b.state=n.mode==='jump'?'shift':n.mode==='swingWarn'?'windup':'recover';stepAir(g,dt,paw);}
 else stepTransition(g,dt);
 syncAgitatorPlatforms(g);
}
// Paw strikes on the robot himself.
export function strikeAgitator(g,paw){
 const b=g.boss,n=b.broadcast,p=g.player;if(!n||p.attack<=0||g.mode!=='playing'||b.hp<=0||b.lastSwing===p.swing)return false;
 if(n.mode==='jump'||['leap','climb'].includes(n.stage)||!overlap(paw,agitatorHitbox(b)))return false;
 b.lastSwing=p.swing;return damageAgitator(g,p.powerTime>0?3:HIT_DAMAGE,p.x+p.w/2);
}
// Highlighted hit areas: the whole body while overheated, his back on «УРА!», the screen on the tower.
export function agitatorTargets(g){
 const b=g.boss,n=b.broadcast;if(!n||b.hp<=0||!b.active)return [];
 if(n.stage==='slogan'&&n.mode==='overheat')return [{id:'agitator',...agitatorHitbox(b)}];
 if(n.stage==='rally'&&n.mode==='ura')return [{id:'agitator-back',x:b.dir>0?b.x+4:b.x+b.w/2,y:b.y+40,w:b.w/2-4,h:b.h-48}];
 if(n.stage==='air'&&!['jump','stun'].includes(n.mode))return [{id:'agitator-screen',x:b.x+18,y:b.y+12,w:b.w-36,h:52}];
 return [];
}
