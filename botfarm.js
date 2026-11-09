import {enemy,rooms} from './level.js?v=0.21.5';
import {solidSurfaces} from './terrain.js?v=0.21.5';
// Ботоферма (Студия): a server rack that stamps out identical bots. In the studio it is sealed in a cage on the wall
// and cannot be hit; elsewhere it takes three paw hits. Its bots jump together on one shared beat, from platform to
// platform towards Uma; they hurt on contact and die from one hit. A bot that jumps onto a riser that goes dark falls.
// When the rack breaks, every bot it made hangs (grey, spinner) and falls apart.
export const BOT_BEAT=1.2,MAX_BOTS=3,PRINT_TIME=.6,PRINT_COOLDOWN=2.6,BOT_SPEED=78,BOT_HOP=44,FREEZE_TIME=.6;
// A real jump between platforms: take-off speed, gravity and the horizontal speed of the leap (≈70 px up, ≈80 px across).
export const BOT_JUMP={vy:-380,vx:112,gravity:1080};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// The shared hop: everyone crouches, jumps and lands at the same moment.
export function botHop(t){
 const k=((t%BOT_BEAT)+BOT_BEAT)%BOT_BEAT;
 if(k<.22)return {phase:'crouch',h:0};
 if(k<.78)return {phase:'air',h:Math.sin(Math.PI*(k-.22)/.56)*BOT_HOP};
 if(k<.92)return {phase:'land',h:0};
 return {phase:'idle',h:0};
}
export const botsOf=(g,farm)=>g.enemies.filter(e=>e.type==='bot'&&e.ownerId===farm.id&&!e.dead);
function printBot(g,farm){
 const s=g.platforms.find(s=>s.room===farm.room&&s.index===(farm.printOn??farm.platformIndex));if(!s)return;
 const side=g.player.x<farm.x?-1:1,x=clamp(farm.x+farm.w/2-14+side*24,s.x+4,s.x+s.w-32);
 g.botSerial=(g.botSerial||0)+1;
 const bot=enemy('bot',farm.room,x-rooms[farm.room].x,s.index,{id:'bot-'+g.botSerial,ownerId:farm.id,active:true,noticed:true,spawnTime:.4,w:28,h:28,dir:side});
 bot.y=s.y-bot.h;bot.origin=s.x+4;bot.end=s.x+s.w-bot.w-4;delete bot.source;bot.arrivalDuration=.4;bot.vx=0;bot.vy=0;bot.lastBeat=Math.floor(g.time/BOT_BEAT);
 g.enemies.push(bot);g.emit('botSpawn',{x:bot.x,y:bot.y,enemyType:'bot'});
}
export function stepBotfarm(g,e,dt,dx,dy){
 e.alarm=(e.noticed||e.range)&&Math.abs(dx)<(e.range||430)&&Math.abs(dy)<(e.range?320:200);
 if(e.state==='printing'){if(e.timer<=0){printBot(g,e);e.state='patrol';e.timer=PRINT_COOLDOWN;}return;}
 if(e.state==='recover'){if(e.timer<=0){e.state='patrol';e.timer=.9;}return;}
 if(e.timer<=0&&e.alarm&&botsOf(g,e).length<MAX_BOTS){e.state='printing';e.timer=PRINT_TIME;g.emit('botPrint',{x:e.x,y:e.y,enemyType:'botfarm'});}
}
// In the studio the bots only trust the fixed islands (trusses, dolly, cases): while Uma is past the edge of their
// island they make a long ballistic leap to the next fixed island towards her; otherwise they hop along it.
export const BOT_LEAP={vy:-600,maxReach:720};
function leapStudio(g,e,surfaces){
 const p=g.player,here=surfaces.find(s=>Math.abs(s.y-e.y-e.h)<3&&e.x+e.w>s.x+2&&e.x<s.x+s.w-2),cx=e.x+e.w/2,px=p.x+p.w/2,feet=e.y+e.h,G=BOT_JUMP.gravity;
 const fixed=surfaces.filter(s=>s.studio?.type==='fixed'&&s.studio.kind!=='flat'&&s!==here);
 let tx=null,ty=feet;
 const beyond=here&&(e.dir<0?px<here.x:px>here.x+here.w);
 if(beyond){const next=fixed.filter(s=>e.dir<0?s.x+s.w<cx:s.x>cx).sort((a,b)=>Math.abs(a.x+a.w/2-cx)-Math.abs(b.x+b.w/2-cx))[0];
  if(next&&Math.abs(next.x+next.w/2-cx)<BOT_LEAP.maxReach){tx=next.x+next.w/2+(Math.random()-.5)*Math.max(0,next.w-60);ty=next.y;}}
 if(tx===null&&here){tx=Math.max(here.x+e.w/2+4,Math.min(here.x+here.w-e.w/2-4,cx+Math.max(-60,Math.min(60,px-cx))));ty=here.y;}
 const vy=tx!==null&&Math.abs(tx-cx)>80?BOT_LEAP.vy:BOT_JUMP.vy,disc=vy*vy+2*G*(ty-feet),T=disc>0?(-vy+Math.sqrt(disc))/G:2*-vy/G;
 e.vx=tx===null?0:(tx-cx)/T;e.vy=vy;e.jumpPhase='air';e.hopPhase='air';
}
export function stepBot(g,e,dt,dx){
 const owner=g.enemies.find(o=>o.id===e.ownerId),s=g.platforms.find(s=>s.room===e.room&&s.index===e.platformIndex),base=s?s.y-e.h:e.y;
 if(!owner||owner.dead||owner.hp<=0){
  if(!e.frozen){e.frozen=true;e.timer=FREEZE_TIME;e.y=base;g.emit('botFreeze',{x:e.x,y:e.y,enemyType:'bot'});}
  else if(e.timer<=0){e.dead=true;e.hp=0;e.deathTime=.35;g.emit('copyDissolve',{x:e.x,y:e.y,enemyType:'bot'});}
  return;
 }
 const hop=botHop(g.time),beat=Math.floor(g.time/BOT_BEAT);e.hopPhase=e.jumpPhase==='air'?'air':hop.phase;
 const surfaces=solidSurfaces(g).filter(s=>s.room===e.room);
 if(e.jumpPhase==='air'){
  const feet=e.y+e.h;e.x+=e.vx*dt;e.vy=Math.min(560,e.vy+BOT_JUMP.gravity*dt);e.y+=e.vy*dt;
  const landed=e.vy>=0&&surfaces.filter(s=>e.x+e.w>s.x+2&&e.x<s.x+s.w-2&&feet<=(s.prevY??s.y)+1&&e.y+e.h>=s.y).sort((a,b)=>a.y-b.y)[0];
  if(landed){e.y=landed.y-e.h;e.platformIndex=landed.index;e.origin=landed.x+2;e.end=Math.max(e.origin,landed.x+landed.w-e.w-2);e.vx=0;e.vy=0;e.jumpPhase=null;e.hopPhase='land';g.emit('botLand',{x:e.x,y:e.y,enemyType:'bot'});}
  else if(e.y>520){e.dead=true;e.hp=0;e.deathTime=.28;g.emit('copyDissolve',{x:e.x,y:e.y,enemyType:'bot'});}
  return;
 }
 // Standing: if the floor under the bot vanished (a dark riser, a cut), it drops.
 if(!surfaces.some(s=>Math.abs(s.y-e.y-e.h)<3&&e.x+e.w>s.x+2&&e.x<s.x+s.w-2)){e.jumpPhase='air';e.vx=0;e.vy=40;return;}
 // On each beat every bot leaps towards Uma: across to the next platform when one is within reach, else on the spot.
 if(hop.phase==='air'&&e.lastBeat!==beat&&e.room===5){e.lastBeat=beat;if(e.noticed)e.dir=dx<0?-1:1;leapStudio(g,e,surfaces);return;}
 if(hop.phase==='air'&&e.lastBeat!==beat){e.lastBeat=beat;if(e.noticed)e.dir=dx<0?-1:1;
  // The longest leap that still lands on something: across a gap if it can, else a shorter hop to its own edge.
  const T=2*-BOT_JUMP.vy/BOT_JUMP.gravity,feet=e.y+e.h,reach=k=>{const x=e.x+e.w/2+e.dir*BOT_JUMP.vx*T*k;return surfaces.find(s=>x>s.x+4&&x<s.x+s.w-4&&s.y>feet-60&&s.y<feet+140);};
  const k=[1,.75,.5,.3].find(k=>reach(k)),target=k&&reach(k);
  e.vx=target&&Math.abs(dx)>12?e.dir*BOT_JUMP.vx*k:0;e.vy=BOT_JUMP.vy;e.jumpPhase='air';e.hopPhase='air';
 }
}
