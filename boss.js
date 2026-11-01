import {WIDTH,WORLD,LAST_ROOM,FINAL_X,enemy,surfaceAt} from './level.js?v=0.10.0';
export const BOSS_HEALTH=24;
export const abilities=['volley','wave','rain','summon'];
export const abilityNames={volley:'ПРИЦЕЛЬНЫЙ ЗАЛП',wave:'ВОЛНА — ПРЫГАЙ!',rain:'БУМАЖНЫЙ ДОЖДЬ',summon:'ПРИЗЫВ ПОМЕХ'};
export function createBoss(){return {x:FINAL_X+651,y:165,w:88,h:110,hp:BOSS_HEALTH,maxHp:BOSS_HEALTH,phase:1,state:'idle',timer:0,turn:0,ability:null,targets:[],cooldown:0,hurtTime:0,noticeTime:0,lastSwing:-1,active:false};}
export function planAttack(g){
 const b=g.boss,p=g.player;b.ability=abilities[b.turn++%abilities.length];b.state='windup';b.timer=b.phase===1?.95:.7;
 b.aim={x:p.x+p.w/2,y:p.y+p.h/2};
 b.targets=[-90,0,90].map(dx=>Math.max(FINAL_X+320,Math.min(WORLD-40,b.aim.x+dx)));
 g.emit('bossWarning',{ability:b.ability});
}
export function castAttack(g){
 const b=g.boss,fast=b.phase===2?1.2:1;
 if(b.ability==='volley'){
  const angle=Math.atan2(b.aim.y-220,b.aim.x-b.x);
  for(const offset of [-.22,0,.22])g.bolts.push({kind:'paper',x:b.x-12,y:220,w:16,h:13,vx:Math.cos(angle+offset)*205*fast,vy:Math.sin(angle+offset)*205*fast,ttl:5});
 }else if(b.ability==='wave'){
  g.bolts.push({kind:'wave',x:b.x-20,y:263,w:32,h:12,vx:-200*fast,vy:0,ttl:4});
 }else if(b.ability==='rain'){
  for(const x of b.targets)g.bolts.push({kind:'rain',x:x-8,y:68,w:17,h:26,vx:0,vy:300*fast,ttl:2});
 }else{
  const alive=g.enemies.filter(e=>e.minion&&!e.dead).length;
  for(let i=0;i<Math.min(2,3-alive);i++){const type=b.phase===2&&i===1?'informant':'fakenews',hp=type==='informant'?2:1;g.enemies.push(enemy(type,LAST_ROOM,i?550:380,i?2:1,{id:`boss-minion-${b.turn}-${i}-${g.time}`,minion:true,active:true,spawnTime:.6,speed:35,hp,maxHp:hp,dir:-1}));}
 }
 b.state='casting';b.timer=b.phase===1?1.1:.85;g.emit('bossCast',{ability:b.ability});
}
export function stepBoss(g,dt){
 const b=g.boss;if(!b.active||b.hp<=0)return;b.cooldown=Math.max(0,b.cooldown-dt);b.hurtTime=Math.max(0,b.hurtTime-dt);b.noticeTime=Math.max(0,b.noticeTime-dt);
 if(b.noticeTime>0)return;
 if(b.hp<=b.maxHp/2&&b.phase===1){b.phase=2;g.emit('bossPhase');}
 b.timer-=dt;if(b.timer>0)return;
 if(b.state==='windup')castAttack(g);else if(b.state==='casting'){b.state='recover';b.timer=b.phase===1?1.35:1;}else planAttack(g);
}
export function damageBoss(g,amount,reflected=false){
 const b=g.boss;if(!b.active||b.hp<=0||b.cooldown>0)return false;
 if(!reflected&&b.state!=='recover')return false;
 b.hp=Math.max(0,b.hp-amount);b.cooldown=.22;b.hurtTime=.28;g.emit('bossHit',{x:b.x,y:b.y+45});
 if(b.hp===0)g.finish();return true;
}
export function stepProjectiles(g,dt,paw){
 for(const bolt of g.bolts){
  bolt.ttl-=dt;bolt.x+=bolt.vx*dt;bolt.y+=bolt.vy*dt;
  if(bolt.kind==='wave')bolt.y=surfaceAt(bolt.x)-bolt.h;
  if(!bolt.friendly&&['paper','packet'].includes(bolt.kind)&&g.player.attack>0&&g.overlap(paw,bolt)){
   bolt.friendly=true;const b=g.boss,owner=g.enemies.find(e=>!e.dead&&e.id===bolt.sourceId),target=owner?{x:owner.x+24,y:owner.y+14}:{x:b.x+30,y:b.y+70},dx=target.x-bolt.x,dy=target.y-bolt.y,len=Math.hypot(dx,dy)||1;
   bolt.vx=dx/len*350;bolt.vy=dy/len*350;bolt.ttl=5;g.emit('parry',{x:bolt.x,y:bolt.y});
  }
  if(bolt.friendly){if(g.boss.active&&g.overlap(bolt,g.boss)){damageBoss(g,2,true);bolt.dead=true;}else for(const e of g.enemies)if(!e.dead&&g.overlap(bolt,e)){g.hitEnemy(e,false,2,{reflected:true});bolt.dead=true;break;}}
  else if(g.overlap(g.player,bolt)){g.hurt(false,bolt.x);bolt.dead=true;}
 }
 g.bolts=g.bolts.filter(v=>!v.dead&&v.ttl>0&&v.x>-50&&v.x<WORLD+50&&v.y<530).slice(-80);
}
