import {WORLD,LAST_ROOM,enemy,platforms,rooms,surfaceAt} from './level.js?v=0.14.0';
import {solidSurfaces} from './terrain.js?v=0.14.0';
export const BOSS_HEALTH=32;
export const abilities=['volley','wave','rain','summon'];
export const bossPatterns={spreader:['scatter','swoop','scatter'],agitator:['broadcast','pressure','posters'],manipulator:['spotlight','cut','frames'],infoshum:abilities};
export const abilityNames={volley:'ПРИЦЕЛЬНЫЙ ЗАЛП',wave:'ВОЛНА — ПРЫГАЙ!',rain:'БУМАЖНЫЙ ДОЖДЬ',summon:'ПРИЗЫВ ПОМЕХ',scatter:'ГАЗЕТНЫЙ ДОЖДЬ',swoop:'ПИКИРОВАНИЕ',broadcast:'ПОТОК ЛОЗУНГОВ',pressure:'НАЖИМ ЭФИРА',posters:'НАВЯЗЧИВЫЙ ПОВТОР',spotlight:'ВЫБОР КАДРА',cut:'ВЫРВАННЫЙ КОНТЕКСТ',frames:'МОНТАЖНАЯ ОЧЕРЕДЬ'};
const health={spreader:12,agitator:16,manipulator:18,infoshum:BOSS_HEALTH};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function bossDocksForRoom(room=LAST_ROOM){
 const r=rooms[room],h=r?.boss==='infoshum'?136:76,w=r?.boss==='infoshum'?128:100;
 return [1,2,4].map(index=>{const s=platforms.find(s=>s.room===room&&s.index===index);return{x:s.x+(s.w-w)/2,y:s.y-h,platformIndex:index};});
}
export const bossDocks=bossDocksForRoom();
export function createBoss(room=LAST_ROOM){
 const r=rooms[room],id=r.boss||null,docks=r.arena?bossDocksForRoom(room):[],h=id==='infoshum'?136:76,w=id==='infoshum'?128:100,hp=health[id]||0;
 return {...(docks[1]||{x:r.x+100,y:180}),id,room,docks,dock:1,w,h,hp,maxHp:hp,phase:1,state:'idle',timer:0,turn:0,ability:null,targets:[],summonTargets:[],cooldown:0,hurtTime:0,noticeTime:0,lastSwing:-1,active:false,justMoved:false,castElapsed:0,dropTimer:0};
}
export function bossShielded(g){return g.relays.some(d=>d.room===g.boss.room&&d.hp>0);}
function chooseSummons(g){
 const p=g.player,eligible=solidSurfaces(g).filter(s=>s.room===g.room&&s.w>=150).sort((a,b)=>Math.abs(a.x+a.w/2-p.x)+Math.abs(a.y-p.y-p.h)*.7-Math.abs(b.x+b.w/2-p.x)-Math.abs(b.y-p.y-p.h)*.7);
 return eligible.slice(0,2).map((s,i)=>{let x=clamp(p.x+(i?155:-155),s.x+12,s.x+s.w-60);if(Math.abs(x-p.x)<70)x=p.x<s.x+s.w/2?s.x+s.w-60:s.x+12;return{x,y:s.y,index:s.index};});
}
function planBossCut(g){
 const b=g.boss,p=g.player,choices=g.platforms.filter(s=>s.room===g.room&&s.cuttable&&!g.cuts.some(c=>c.platformId===s.id)).sort((a,c)=>Math.abs(a.x+a.w/2-p.x)-Math.abs(c.x+c.w/2-p.x));
 for(const s of choices.slice(0,2)){const w=Math.min(88,s.w-88),localX=clamp(p.x+17-s.x-w/2,44,s.w-w-44);g.cuts.push({id:'boss-cut-'+(++g.tacticalSerial),ownerId:'boss:'+b.id,room:g.room,platformId:s.id,localX,w,phase:'warning',time:.95,x:s.x+localX+w/2,y:s.y});g.emit('cutWarning',{x:s.x+localX,y:s.y,enemyType:'cutter'});}
}
export function planAttack(g){
 const b=g.boss,p=g.player,r=rooms[g.room],pattern=bossPatterns[b.id];b.justMoved=false;b.ability=pattern[b.turn++%pattern.length];b.state='windup';b.timer=b.id==='spreader'?1:b.phase===1?.95:.75;
 b.aim={x:p.x+p.w/2,y:p.y+p.h/2};b.waveY=p.y+p.h-14;
 b.targets=[-125,0,125].map(dx=>clamp(b.aim.x+dx,r.x+35,r.end-35));b.summonTargets=chooseSummons(g);
 if(b.ability==='cut')planBossCut(g);
 g.emit('bossWarning',{ability:b.ability,boss:b.id,x:b.x,y:b.y});
}
function paper(g,x,y,vx,vy,extra={}){g.bolts.push({room:g.room,kind:'paper',x,y,w:17,h:16,vx,vy,ttl:6,...extra});}
export function castAttack(g){
 const b=g.boss,r=rooms[g.room],fast=b.phase===2?1.15:1,source={x:b.x+b.w/2,y:b.y+b.h*.55};b.castElapsed=0;
 if(['volley','frames','broadcast'].includes(b.ability)){
  const angle=Math.atan2(b.aim.y-source.y,b.aim.x-source.x),offsets=b.ability==='broadcast'?[-.25,-.08,.08,.25]:[-.24,0,.24];
  for(const offset of offsets)paper(g,source.x-8,source.y,Math.cos(angle+offset)*220*fast,Math.sin(angle+offset)*220*fast,{kind:b.ability==='frames'?'frame':'paper'});
 }else if(['wave','pressure'].includes(b.ability)){
  const y=b.waveY??g.player.y+g.player.h-14;for(const dir of [1,-1])g.bolts.push({room:g.room,kind:'wave',x:dir>0?r.x+12:r.end-44,y,w:32,h:12,vx:dir*260*fast,vy:0,ttl:7,fixedY:true,push:b.ability==='pressure'});
 }else if(['rain','spotlight','posters'].includes(b.ability)){
  for(const x of b.targets)paper(g,x-8,12,0,335*fast,{kind:b.ability==='spotlight'?'frame':'rain',w:20,h:27,ttl:2});
 }else if(b.ability==='summon'){
  const alive=g.enemies.filter(e=>e.minion&&!e.dead&&e.room===g.room).length,targets=b.summonTargets;
  for(let i=0;i<Math.min(2,3-alive,targets.length);i++){const type=b.phase===2&&i===1?'echo':'static',t=targets[i];g.enemies.push(enemy(type,g.room,t.x-r.x,t.index,{id:'boss-minion-'+b.turn+'-'+i+'-'+g.time,minion:true,active:true,noticed:true,spawnTime:.65,hp:1,maxHp:1,dir:g.player.x<t.x?-1:1}));}
 }else if(b.ability==='scatter'){b.dropTimer=0;}
 else if(b.ability==='swoop'){b.swoopFrom={x:b.x,y:b.y};b.swoopTo={x:clamp(b.aim.x-b.w/2,r.x+24,r.end-b.w-24),y:clamp(b.aim.y-b.h/2,70,375-b.h)};}
 b.state='casting';b.timer=b.ability==='swoop'?.75:b.ability==='scatter'?1.35:b.phase===1?1.05:.8;g.emit('bossCast',{ability:b.ability,boss:b.id,x:b.x,y:b.y});
}
export function stepBoss(g,dt){
 const b=g.boss;if(!b.active||b.hp<=0||b.room!==g.room)return;
 b.cooldown=Math.max(0,b.cooldown-dt);b.hurtTime=Math.max(0,b.hurtTime-dt);b.noticeTime=Math.max(0,b.noticeTime-dt);if(b.noticeTime>0)return;
 if(b.hp<=b.maxHp/2&&b.phase===1){b.phase=2;g.emit('bossPhase',{boss:b.id});}
 b.timer-=dt;
 if(b.state==='shift'){
  const next=b.docks[b.nextDock];
  if(b.id==='spreader'){const t=clamp(1-b.timer/1.15,0,1);b.x=b.shiftFrom.x+(next.x-b.shiftFrom.x)*t;b.y=b.shiftFrom.y+(next.y-b.shiftFrom.y)*t-Math.sin(t*Math.PI)*90;}
  else if(!b.shifted&&b.timer<=.56){Object.assign(b,next);b.dock=b.nextDock;b.shifted=true;g.emit('bossMove',{x:b.x,y:b.y,boss:b.id});}
  if(b.timer<=0){Object.assign(b,next);b.dock=b.nextDock;b.state='recover';b.timer=1.8;b.justMoved=true;}return;
 }
 if(b.state==='casting'){
  b.castElapsed+=dt;
  if(b.ability==='scatter'){const r=rooms[g.room];b.x=clamp(b.x+Math.sin(g.time*1.7)*75*dt,r.x+25,r.end-b.w-25);b.y=clamp(b.y+Math.sin(g.time*3)*20*dt,65,310);b.dropTimer-=dt;if(b.dropTimer<=0){b.dropTimer=.25;paper(g,b.x+b.w/2,b.y+b.h*.75,-35,235,{ttl:2.4});paper(g,b.x+b.w/2+20,b.y+b.h*.75,35,235,{ttl:2.4});}}
  if(b.ability==='swoop'){const t=clamp(b.castElapsed/.65,0,1),ease=t*t*(3-2*t);b.x=b.swoopFrom.x+(b.swoopTo.x-b.swoopFrom.x)*ease;b.y=b.swoopFrom.y+(b.swoopTo.y-b.swoopFrom.y)*ease;}
 }
 if(b.timer>0)return;
 if(b.state==='windup')castAttack(g);
 else if(b.state==='casting'){b.state='recover';b.timer=b.id==='spreader'?1.8:b.phase===1?1.7:1.4;}
 else if(b.turn>0&&b.turn%3===0&&!b.justMoved){b.state='shift';b.timer=1.15;b.shifted=false;b.nextDock=(b.dock+1)%b.docks.length;b.shiftFrom={x:b.x,y:b.y};g.emit('bossShift',{x:b.docks[b.nextDock].x,y:b.docks[b.nextDock].y,boss:b.id});}
 else planAttack(g);
}
export function damageBoss(g,amount,reflected=false){
 const b=g.boss;if(!b.active||b.hp<=0||b.cooldown>0||b.state==='shift'||bossShielded(g))return false;
 if(!reflected&&b.state!=='recover')return false;
 b.hp=Math.max(0,b.hp-amount);b.cooldown=.22;b.hurtTime=.28;g.emit('bossHit',{x:b.x+b.w/2,y:b.y+b.h-14,boss:b.id});if(b.hp===0)g.bossDefeated();return true;
}
export function stepProjectiles(g,dt,paw){
 for(const bolt of g.bolts){
  if(bolt.room!==undefined&&bolt.room!==g.room)continue;bolt.ttl-=dt;bolt.x+=bolt.vx*dt;bolt.y+=bolt.vy*dt;
  if(bolt.kind==='wave'&&!bolt.fixedY)bolt.y=surfaceAt(bolt.x,g.platforms||platforms)-bolt.h;
  if(!bolt.friendly&&['paper','packet','frame','ticker'].includes(bolt.kind)&&g.player.attack>0&&g.overlap(paw,bolt)){
   bolt.friendly=true;const b=g.boss,owner=g.enemies.find(e=>!e.dead&&e.id===bolt.sourceId),target=owner?{x:owner.x+24,y:owner.y+14}:b.active?{x:b.x+b.w/2,y:b.y+b.h*.65}:{x:bolt.x-(Math.sign(bolt.vx)||g.player.dir)*300,y:bolt.y},dx=target.x-bolt.x,dy=target.y-bolt.y,len=Math.hypot(dx,dy)||1;
   bolt.vx=dx/len*350;bolt.vy=dy/len*350;bolt.ttl=7;g.emit('parry',{x:bolt.x,y:bolt.y});
  }
  if(bolt.friendly){if(g.boss.active&&g.boss.state!=='shift'&&g.overlap(bolt,g.boss)){if(!damageBoss(g,2,true))g.emit('blocked',{x:bolt.x,y:bolt.y});bolt.dead=true;}else for(const e of g.enemies)if(!e.dead&&!e.phased&&g.overlap(bolt,e)){g.hitEnemy(e,false,2,{reflected:true,sourceX:bolt.x+bolt.w/2-Math.sign(bolt.vx)*20});bolt.dead=true;break;}}
  else if(g.overlap(g.player,bolt)){const safe=g.player.dash>0;g.hurt(false,bolt.x);if(bolt.push&&!safe&&g.mode==='playing')g.push(Math.sign(bolt.vx),bolt.x);bolt.dead=true;}
 }
 const r=rooms[g.room];g.bolts=g.bolts.filter(v=>!v.dead&&v.ttl>0&&v.x>r.x-50&&v.x<r.end+50&&v.y<530&&(v.room===undefined||v.room===g.room)).slice(-90);
}
