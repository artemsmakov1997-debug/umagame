import {phasePattern,stepBossPhase,phasePlans} from './boss-phases.js?v=0.17.0';
import {LAST_ROOM,platforms,rooms,surfaceAt} from './level.js?v=0.17.0';
import {solidSurfaces} from './terrain.js?v=0.17.0';
import {castInherited,summonPlaces,clearBossHelpers} from './boss-abilities.js?v=0.17.0';
import {releaseTether,handleFlyingContact} from './campaign-enemies.js?v=0.17.0';
import {stepEcho} from './echo-pull.js?v=0.17.0';
export {bossTroops} from './boss-abilities.js?v=0.17.0';
export const BOSS_HEALTH=32;
export const abilities=['volley','wave','rain','summon','echoPulse','staticRush','lure'];
export const bossPatterns={spreader:['scatter','summon','ink','copy','swoop'],agitator:['telecast','summon','pressure','alarm','broadcast'],manipulator:['ticker','summon','cut','splice','spotlight'],infoshum:abilities};
export const abilityNames={volley:'ЗАЛП',wave:'ВОЛНА',rain:'ДОЖДЬ',summon:'ПРИЗЫВ',scatter:'ГАЗЕТНЫЙ ДОЖДЬ',swoop:'ПИКИРОВАНИЕ',broadcast:'ЛОЗУНГИ',pressure:'НАПОР',spotlight:'РАМКА',cut:'РАЗРЕЗ',ink:'ЧЕРНИЛА',copy:'КОПИРОВАНИЕ',alarm:'ТРЕВОГА',telecast:'РАССЫЛКА',ticker:'ВБРОС',splice:'ПРИТЯГИВАНИЕ',echoPulse:'ЭХО',staticRush:'ПОМЕХА',lure:'ПРИМАНКА'};
const health={spreader:12,agitator:16,manipulator:18,infoshum:BOSS_HEALTH},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function bossDocksForRoom(room=LAST_ROOM,surfaces=platforms){const r=rooms[room],h=r?.boss==='infoshum'?136:76,w=r?.boss==='infoshum'?128:100;return[1,2,4].map(index=>{const s=surfaces.find(s=>s.room===room&&s.index===index);return{x:s.x+(s.w-w)/2,y:s.y-h,platformIndex:index};});}
export const bossDocks=bossDocksForRoom();
export function createBoss(room=LAST_ROOM){const r=rooms[room],id=r.boss||null,docks=r.arena?bossDocksForRoom(room):[],h=id==='infoshum'?136:76,w=id==='infoshum'?128:100,hp=health[id]||0;return{...(docks[1]||{x:r.x+100,y:180}),id,room,docks,dock:1,w,h,hp,maxHp:hp,phase:1,state:'idle',timer:0,turn:0,ability:null,targets:[],summonTargets:[],summonCursor:0,cooldown:0,hurtTime:0,noticeTime:0,lastSwing:-1,active:false,justMoved:false,castElapsed:0,dropTimer:0,dir:-1,shieldBroken:0,shots:0};}
export function bossShielded(g){return g.relays.some(d=>d.room===g.boss.room&&d.hp>0);}
function planBossCut(g){const b=g.boss,p=g.player,choices=g.platforms.filter(s=>s.room===g.room&&s.cuttable&&!g.cuts.some(c=>c.platformId===s.id)).sort((a,c)=>Math.abs(a.x+a.w/2-p.x)-Math.abs(c.x+c.w/2-p.x));for(const s of choices.slice(0,2)){const w=Math.min(88,s.w-88),localX=clamp(p.x+17-s.x-w/2,44,s.w-w-44);g.cuts.push({id:'boss-cut-'+(++g.tacticalSerial),ownerId:'boss:'+b.id,room:g.room,platformId:s.id,localX,w,phase:'warning',time:1.05,x:s.x+localX+w/2,y:s.y});g.emit('cutWarning',{x:s.x+localX,y:s.y,enemyType:'cutter'});}}
export function planAttack(g){
 const b=g.boss,p=g.player,r=rooms[g.room];b.justMoved=false;b.ability=phasePattern(b)[b.turn++%phasePattern(b).length];b.state='windup';b.timer=b.id==='spreader'?1:b.phase===1?1.05:.85;b.aim={x:p.x+p.w/2,y:p.y+p.h/2};b.dir=b.aim.x<b.x+b.w/2?-1:1;b.waveY=p.y+p.h-14;b.targets=[-125,0,125].map(dx=>clamp(b.aim.x+dx,r.x+35,r.end-35));b.summonTargets=summonPlaces(g,3);
 if(b.ability==='cut')planBossCut(g);
 if(b.ability==='telecast'){b.nextDock=b.docks.map((d,i)=>({i,distance:Math.abs(d.x-p.x)})).filter(d=>d.i!==b.dock).sort((a,c)=>a.distance-c.distance)[0]?.i??(b.dock+1)%3;}
 g.emit('bossWarning',{ability:b.ability,boss:b.id,x:b.x,y:b.y});
}
function paper(g,x,y,vx,vy,extra={}){g.bolts.push({room:g.room,kind:'paper',x,y,w:17,h:16,vx,vy,ttl:6,...extra});}
function aimed(g,kind,count=3){const b=g.boss,source={x:b.x+b.w/2,y:b.y+b.h*.55},angle=Math.atan2(b.aim.y-source.y,b.aim.x-source.x),offsets=count===4?[-.25,-.08,.08,.25]:[-.18,0,.18];for(const offset of offsets.slice(0,count))paper(g,source.x-8,source.y,Math.cos(angle+offset)*220,Math.sin(angle+offset)*220,{kind});}
export function castAttack(g){
 const b=g.boss,r=rooms[g.room],fast=b.phase>=2?1.15:1;b.castElapsed=0;b.dropTimer=0;b.shots=0;b.pressureHit=false;
 if(!castInherited(g,b.ability)){
  if(['volley','broadcast'].includes(b.ability))aimed(g,'paper',b.ability==='broadcast'?4:3);
  else if(b.ability==='wave'){for(const dir of [1,-1])g.bolts.push({room:g.room,kind:'wave',x:dir>0?r.x+12:r.end-44,y:b.waveY,w:32,h:12,vx:dir*260*fast,vy:0,ttl:7,fixedY:true});}
  else if(['rain','spotlight'].includes(b.ability))for(const x of b.targets)paper(g,x-8,12,0,335*fast,{kind:b.ability==='spotlight'?'frame':'rain',w:20,h:27,ttl:2});
  else if(b.ability==='swoop'||b.ability==='staticRush'){b.swoopFrom={x:b.x,y:b.y};b.swoopTo={x:clamp(b.aim.x-b.w/2,r.x+24,r.end-b.w-24),y:clamp(b.aim.y-b.h/2,70,400-b.h)};}
  else if(b.ability==='telecast'){b.telecastMoved=false;b.phased=false;g.emit('teleportOut',{x:b.x,y:b.y,enemyType:'informant'});}
  else if(b.ability==='echoPulse')paper(g,clamp(b.aim.x-20,r.x+24,r.end-64),clamp(b.aim.y-19,60,400),0,0,{kind:'echoOrb',type:'echo',id:'boss-echo-'+(++g.tacticalSerial),w:40,h:38,ttl:6,state:'windup',timer:.65,warpCooldown:0});
 }
 if(b.phase===3&&['swoop','telecast','cut','staticRush'].includes(b.ability))castInherited(g,b.id==='spreader'?'ink':b.id==='agitator'?'alarm':b.id==='manipulator'?'summon':'lure');
 b.state='casting';b.timer=b.ability==='splice'?5:['swoop','staticRush'].includes(b.ability)?.8:b.ability==='scatter'?1.5:b.ability==='telecast'?1.25:b.phase===1?1.15:.9;g.emit('bossCast',{ability:b.ability,boss:b.id,x:b.x,y:b.y});
}
function stepCast(g,b,dt){
 b.castElapsed+=dt;
 if(b.ability==='telecast'){b.phased=b.castElapsed>.12&&b.castElapsed<.5;if(!b.telecastMoved&&b.castElapsed>=.22){const d=b.docks[b.nextDock];if(!g.overlap({x:d.x-10,y:d.y-10,w:b.w+20,h:b.h+20},g.player)){Object.assign(b,d);b.dock=b.nextDock;}else g.emit('teleportAbort',{x:b.x,y:b.y});b.telecastMoved=true;g.emit('teleportIn',{x:b.x,y:b.y,enemyType:'informant'});}}
 if(b.ability==='scatter'){const r=rooms[g.room];b.x=clamp(b.x+Math.sin(g.time*1.7)*95*dt,r.x+25,r.end-b.w-25);b.y=clamp(b.y+Math.sin(g.time*3)*20*dt,65,310);b.dropTimer-=dt;if(b.dropTimer<=0){b.dropTimer=.3;paper(g,b.x+b.w/2,b.y+b.h*.75,-35,235,{ttl:2.4});paper(g,b.x+b.w/2+20,b.y+b.h*.75,35,235,{ttl:2.4});}}
 if(['swoop','staticRush'].includes(b.ability)){const t=clamp(b.castElapsed/.7,0,1),ease=t*t*(3-2*t);b.x=b.swoopFrom.x+(b.swoopTo.x-b.swoopFrom.x)*ease;b.y=b.swoopFrom.y+(b.swoopTo.y-b.swoopFrom.y)*ease;}
 if(['ticker','telecast'].includes(b.ability)&&b.castElapsed>=(b.ability==='telecast'?.55:0)+b.shots*.3&&b.shots<(b.ability==='ticker'?3:2)){b.shots++;if(b.ability==='ticker')paper(g,b.x+b.w/2,b.aim.y,b.dir*250,0,{kind:'ticker',w:40,h:10,ttl:4});else{const dx=b.aim.x-b.x-b.w/2,dy=b.aim.y-b.y-40,len=Math.hypot(dx,dy)||1;paper(g,b.x+b.w/2,b.y+40,dx/len*220,dy/len*220,{kind:'packet',w:16,h:12,ttl:5});}g.emit('enemyShot',{x:b.x,y:b.y,enemyType:b.ability==='ticker'?'injection':'informant'});}
 if(b.ability==='pressure'){
  const beam={x:b.dir>0?b.x+b.w-8:b.x-500,y:b.y+b.h-40,w:500,h:50};if(!b.pressureHit&&g.overlap(g.player,beam)){b.pressureHit=true;g.push(b.dir,b.x);}
  for(const e of g.enemies)if(e.type==='fakenews'&&e.room===g.room&&!e.dead&&Math.abs(e.x-b.x)<520)e.pressureTime=4;
 }
}
export function stepBoss(g,dt){
 const b=g.boss;if(!b.active||b.hp<=0||b.room!==g.room)return;const support=g.platforms.find(s=>s.room===b.room&&s.index===b.platformIndex);if(support&&b.state!=='shift'&&!['swoop','staticRush'].includes(b.ability)){b.x+=support.dx||0;b.y+=support.dy||0;}b.docks=bossDocksForRoom(b.room,g.platforms);
 b.cooldown=Math.max(0,b.cooldown-dt);b.hurtTime=Math.max(0,b.hurtTime-dt);b.noticeTime=Math.max(0,b.noticeTime-dt);b.shieldBroken=Math.max(0,b.shieldBroken-dt);if(b.noticeTime>0)return;if(stepBossPhase(g,dt))return;b.timer-=dt;
 if(b.state==='shift'){const next=b.docks[b.nextDock];if(['spreader','manipulator'].includes(b.id)){const t=clamp(1-b.timer/1.15,0,1);b.x=b.shiftFrom.x+(next.x-b.shiftFrom.x)*t;b.y=b.shiftFrom.y+(next.y-b.shiftFrom.y)*t-Math.sin(t*Math.PI)*(b.id==='spreader'?90:120);}else if(!b.shifted&&b.timer<=.56){Object.assign(b,next);b.dock=b.nextDock;b.shifted=true;g.emit('bossMove',{x:b.x,y:b.y,boss:b.id});}if(b.timer<=0){Object.assign(b,next);b.dock=b.nextDock;b.state='recover';b.timer=1.8;b.justMoved=true;}return;}
 if(b.state==='casting')stepCast(g,b,dt);if(b.timer>0)return;
 if(b.state==='windup')castAttack(g);else if(b.state==='casting'){if(b.ability==='splice')releaseTether(g,'boss:'+b.id);b.state='recover';b.timer=b.id==='spreader'?1.8:b.phase===1?1.7:1.4;}
 else if(b.turn>0&&b.turn%3===0&&!b.justMoved){b.state='shift';b.timer=1.15;b.shifted=false;b.nextDock=(b.dock+1)%3;b.shiftFrom={x:b.x,y:b.y};g.emit('bossShift',{x:b.docks[b.nextDock].x,y:b.docks[b.nextDock].y,boss:b.id});}else planAttack(g);
}
export function damageBoss(g,amount,reflected=false,sourceX=g.player.x+g.player.w/2){
 const b=g.boss;if(!b.active||b.hp<=0||b.cooldown>0||['shift','phaseChange'].includes(b.state)||b.phased||bossShielded(g))return false;
 if(b.id==='agitator'&&(sourceX-b.x-b.w/2)*b.dir>=-6&&!b.shieldBroken){if(reflected){b.shieldBroken=2;b.state='recover';b.timer=1.4;}else return false;}
 if(!reflected){const exposed=b.id==='spreader'?b.state==='recover'||b.ability!=='swoop':b.id==='agitator'?true:b.id==='manipulator'?b.state==='recover'||b.state==='casting'&&b.ability==='splice':b.state==='recover';if(!exposed)return false;}
 b.hp=Math.max(0,b.hp-amount);b.cooldown=.22;b.hurtTime=.28;releaseTether(g,'boss:'+b.id);for(const p of g.portals)if(p.ownerId==='boss:'+b.id)p.cancelled=true;g.emit('bossHit',{x:b.x+b.w/2,y:b.y+b.h-14,boss:b.id});if(b.hp===0){clearBossHelpers(g);g.bossDefeated();}return true;
}
export function bossContact(g){const b=g.boss,p=g.player;if(['shift','phaseChange'].includes(b.state)||b.phased||!g.overlap(p,b))return;const before=g.health;g.hurt(false,b.x);if(b.id==='infoshum'&&b.ability==='staticRush'&&b.state==='casting'&&g.mode==='playing'&&g.health<before){p.vx=(p.x>b.x?1:-1)*280;p.vy=150;p.knock=.24;p.grounded=false;g.emit('staticPush',{x:b.x,y:b.y});}}
export function stepProjectiles(g,dt,paw){
 for(const bolt of g.bolts){if(bolt.room!==undefined&&bolt.room!==g.room)continue;if(bolt.kind==='echoOrb'){bolt.id??='boss-echo-'+(++g.tacticalSerial);bolt.state??='windup';bolt.timer??=.65;bolt.warpCooldown=Math.max(0,(bolt.warpCooldown||0)-dt);bolt.vx=0;bolt.vy=0;stepEcho(g,bolt,dt);}bolt.ttl-=dt;bolt.x+=bolt.vx*dt;bolt.y+=bolt.vy*dt;
  if(bolt.kind==='wave'&&!bolt.fixedY)bolt.y=surfaceAt(bolt.x,g.platforms||platforms)-bolt.h;
  if(!bolt.friendly&&['paper','packet','frame','ticker'].includes(bolt.kind)&&g.player.attack>0&&g.overlap(paw,bolt)){bolt.friendly=true;const b=g.boss,owner=g.enemies.find(e=>!e.dead&&e.id===bolt.sourceId),target=owner?{x:owner.x+24,y:owner.y+14}:b.active?{x:b.x+b.w/2,y:b.y+b.h*.65}:{x:bolt.x-(Math.sign(bolt.vx)||g.player.dir)*300,y:bolt.y},dx=target.x-bolt.x,dy=target.y-bolt.y,len=Math.hypot(dx,dy)||1;bolt.vx=dx/len*350;bolt.vy=dy/len*350;bolt.ttl=7;g.emit('parry',{x:bolt.x,y:bolt.y});}
  if(bolt.friendly){if(g.boss.active&&g.boss.state!=='shift'&&!g.boss.phased&&g.overlap(bolt,g.boss)){if(!damageBoss(g,2,true,bolt.x+bolt.w/2-Math.sign(bolt.vx)*20))g.emit('blocked',{x:bolt.x,y:bolt.y});bolt.dead=true;}else for(const e of g.enemies)if(!e.dead&&!e.phased&&g.overlap(bolt,e)){g.hitEnemy(e,false,2,{reflected:true,sourceX:bolt.x+bolt.w/2-Math.sign(bolt.vx)*20});bolt.dead=true;break;}}
  else if(g.overlap(g.player,bolt)){if(bolt.kind==='echoOrb'){if(bolt.state==='pulling')handleFlyingContact(g,{...bolt,type:'echo'});}else{const safe=g.player.dash>0;g.hurt(false,bolt.x);if(bolt.push&&!safe&&g.mode==='playing')g.push(Math.sign(bolt.vx),bolt.x);bolt.dead=true;}}
 }
 const r=rooms[g.room];g.bolts=g.bolts.filter(v=>!v.dead&&v.ttl>0&&v.x>r.x-50&&v.x<r.end+50&&v.y<530&&(v.room===undefined||v.room===g.room)).slice(-90);
}
