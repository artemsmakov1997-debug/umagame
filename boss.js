import {WORLD,LAST_ROOM,FINAL_X,ARENA_WIDTH,enemy,platforms,surfaceAt} from './level.js?v=0.13.0';
export const BOSS_HEALTH=32;
export const abilities=['volley','wave','rain','summon'];
export const abilityNames={volley:'ПРИЦЕЛЬНЫЙ ЗАЛП',wave:'ВОЛНА — ПРЫГАЙ!',rain:'БУМАЖНЫЙ ДОЖДЬ',summon:'ПРИЗЫВ ПОМЕХ'};
export const bossDocks=[1,2,4].map(index=>{const s=platforms.find(s=>s.room===LAST_ROOM&&s.index===index);return {x:s.x+(s.w-128)/2,y:s.y-136,platformIndex:index};});
export function createBoss(){return {...bossDocks[1],dock:1,w:128,h:136,hp:BOSS_HEALTH,maxHp:BOSS_HEALTH,phase:1,state:'idle',timer:0,turn:0,ability:null,targets:[],summonTargets:[],cooldown:0,hurtTime:0,noticeTime:0,lastSwing:-1,active:false,justMoved:false};}
function chooseSummons(g){
 const p=g.player,eligible=(g.platforms||platforms).filter(s=>s.room===LAST_ROOM&&s.w>=150).sort((a,b)=>Math.abs(a.x+a.w/2-p.x)+Math.abs(a.y-p.y-p.h)*.7-Math.abs(b.x+b.w/2-p.x)-Math.abs(b.y-p.y-p.h)*.7);
 return eligible.slice(0,2).map((s,i)=>{let x=Math.max(s.x+12,Math.min(s.x+s.w-60,p.x+(i?145:-145)));if(Math.abs(x-p.x)<70)x=p.x<s.x+s.w/2?s.x+s.w-60:s.x+12;return {x,y:s.y,index:s.index};});
}
export function planAttack(g){
 const b=g.boss,p=g.player;b.justMoved=false;b.ability=abilities[b.turn++%abilities.length];b.state='windup';b.timer=b.phase===1?.95:.7;
 b.aim={x:p.x+p.w/2,y:p.y+p.h/2};b.waveY=p.y+p.h-14;
 b.targets=[-120,0,120].map(dx=>Math.max(FINAL_X+35,Math.min(FINAL_X+ARENA_WIDTH-35,b.aim.x+dx)));b.summonTargets=chooseSummons(g);g.emit('bossWarning',{ability:b.ability});
}
export function castAttack(g){
 const b=g.boss,fast=b.phase===2?1.2:1,source={x:b.x+b.w/2,y:b.y+65};
 if(b.ability==='volley'){
  const angle=Math.atan2(b.aim.y-source.y,b.aim.x-source.x);
  for(const offset of [-.22,0,.22])g.bolts.push({kind:'paper',x:source.x-8,y:source.y,w:16,h:13,vx:Math.cos(angle+offset)*220*fast,vy:Math.sin(angle+offset)*220*fast,ttl:7});
 }else if(b.ability==='wave'){
  const y=b.waveY??g.player.y+g.player.h-14;
  for(const dir of [1,-1])g.bolts.push({kind:'wave',x:dir>0?FINAL_X+12:WORLD-44,y,w:32,h:12,vx:dir*245*fast,vy:0,ttl:6.5,fixedY:true});
 }else if(b.ability==='rain'){
  for(const x of b.targets)g.bolts.push({kind:'rain',x:x-8,y:20,w:17,h:26,vx:0,vy:320*fast,ttl:2});
 }else{
  const alive=g.enemies.filter(e=>e.minion&&!e.dead&&e.room===LAST_ROOM).length,targets=b.summonTargets.length?b.summonTargets:chooseSummons(g);
  for(let i=0;i<Math.min(2,3-alive,targets.length);i++){
   const type=b.phase===2&&i===1?'informant':'fakenews',hp=type==='informant'?2:1,t=targets[i];
   g.enemies.push(enemy(type,LAST_ROOM,t.x-FINAL_X,t.index,{id:'boss-minion-'+b.turn+'-'+i+'-'+g.time,minion:true,active:true,spawnTime:.65,speed:35,hp,maxHp:hp,dir:g.player.x<t.x?-1:1}));
  }
 }
 b.state='casting';b.timer=b.phase===1?1.1:.85;g.emit('bossCast',{ability:b.ability});
}
export function stepBoss(g,dt){
 const b=g.boss;if(!b.active||b.hp<=0)return;b.cooldown=Math.max(0,b.cooldown-dt);b.hurtTime=Math.max(0,b.hurtTime-dt);b.noticeTime=Math.max(0,b.noticeTime-dt);
 if(b.noticeTime>0)return;
 if(b.hp<=b.maxHp/2&&b.phase===1){b.phase=2;g.emit('bossPhase');}
 b.timer-=dt;
 if(b.state==='shift'){
  if(!b.shifted&&b.timer<=.56){Object.assign(b,bossDocks[b.nextDock]);b.dock=b.nextDock;b.shifted=true;g.emit('bossMove',{x:b.x,y:b.y});}
  if(b.timer<=0){b.state='recover';b.timer=1.8;b.justMoved=true;}return;
 }
 if(b.timer>0)return;
 if(b.state==='windup')castAttack(g);
 else if(b.state==='casting'){b.state='recover';b.timer=b.phase===1?1.8:1.5;}
 else if(b.turn>0&&b.turn%3===0&&!b.justMoved){b.state='shift';b.timer=1.15;b.shifted=false;b.nextDock=(b.dock+1)%bossDocks.length;g.emit('bossShift',{x:bossDocks[b.nextDock].x,y:bossDocks[b.nextDock].y});}
 else planAttack(g);
}
export function damageBoss(g,amount,reflected=false){
 const b=g.boss;if(!b.active||b.hp<=0||b.cooldown>0||b.state==='shift')return false;
 if(!reflected&&b.state!=='recover')return false;
 b.hp=Math.max(0,b.hp-amount);b.cooldown=.22;b.hurtTime=.28;g.emit('bossHit',{x:b.x+b.w/2,y:b.y+b.h-20});if(b.hp===0)g.finish();return true;
}
export function stepProjectiles(g,dt,paw){
 for(const bolt of g.bolts){
  bolt.ttl-=dt;bolt.x+=bolt.vx*dt;bolt.y+=bolt.vy*dt;
  if(bolt.kind==='wave'&&!bolt.fixedY)bolt.y=surfaceAt(bolt.x,g.platforms||platforms)-bolt.h;
  if(!bolt.friendly&&['paper','packet'].includes(bolt.kind)&&g.player.attack>0&&g.overlap(paw,bolt)){
   bolt.friendly=true;const b=g.boss,owner=g.enemies.find(e=>!e.dead&&e.id===bolt.sourceId),target=owner?{x:owner.x+24,y:owner.y+14}:{x:b.x+b.w/2,y:b.y+b.h*.65},dx=target.x-bolt.x,dy=target.y-bolt.y,len=Math.hypot(dx,dy)||1;
   bolt.vx=dx/len*350;bolt.vy=dy/len*350;bolt.ttl=7;g.emit('parry',{x:bolt.x,y:bolt.y});
  }
  if(bolt.friendly){if(g.boss.active&&g.boss.state!=='shift'&&g.overlap(bolt,g.boss)){damageBoss(g,2,true);bolt.dead=true;}else for(const e of g.enemies)if(!e.dead&&!e.phased&&g.overlap(bolt,e)){g.hitEnemy(e,false,2,{reflected:true,sourceX:bolt.x+bolt.w/2-Math.sign(bolt.vx)*20});bolt.dead=true;break;}}
  else if(g.overlap(g.player,bolt)){g.hurt(false,bolt.x);bolt.dead=true;}
 }
 g.bolts=g.bolts.filter(v=>!v.dead&&v.ttl>0&&v.x>-50&&v.x<WORLD+50&&v.y<530).slice(-80);
}
