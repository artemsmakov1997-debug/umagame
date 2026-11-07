import {enemy,rooms} from './level.js?v=0.21.5';
// Ботоферма (Студия): a server rack that stamps out identical bots. The rack never moves and never hurts on touch;
// it takes three paw hits. Its bots hop together on one shared beat towards Uma, hurt on contact and die from one hit.
// When the rack breaks, every bot it made hangs (grey, spinner) and falls apart.
export const BOT_BEAT=1.2,MAX_BOTS=3,PRINT_TIME=.6,PRINT_COOLDOWN=2.6,BOT_SPEED=78,BOT_HOP=44,FREEZE_TIME=.6;
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
 const s=g.platforms.find(s=>s.room===farm.room&&s.index===farm.platformIndex);if(!s)return;
 const side=g.player.x<farm.x?-1:1,x=clamp(farm.x+farm.w/2-14+side*24,s.x+4,s.x+s.w-32);
 g.botSerial=(g.botSerial||0)+1;
 const bot=enemy('bot',farm.room,x-rooms[farm.room].x,farm.platformIndex,{id:'bot-'+g.botSerial,ownerId:farm.id,active:true,noticed:true,spawnTime:.4,w:28,h:28,dir:side});
 bot.y=s.y-bot.h;bot.origin=s.x+4;bot.end=s.x+s.w-bot.w-4;delete bot.source;bot.arrivalDuration=.4;
 g.enemies.push(bot);g.emit('botSpawn',{x:bot.x,y:bot.y,enemyType:'bot'});
}
export function stepBotfarm(g,e,dt,dx,dy){
 e.alarm=e.noticed&&Math.abs(dx)<430&&Math.abs(dy)<200;
 if(e.state==='printing'){if(e.timer<=0){printBot(g,e);e.state='patrol';e.timer=PRINT_COOLDOWN;}return;}
 if(e.state==='recover'){if(e.timer<=0){e.state='patrol';e.timer=.9;}return;}
 if(e.timer<=0&&e.alarm&&botsOf(g,e).length<MAX_BOTS){e.state='printing';e.timer=PRINT_TIME;g.emit('botPrint',{x:e.x,y:e.y,enemyType:'botfarm'});}
}
export function stepBot(g,e,dt,dx){
 const owner=g.enemies.find(o=>o.id===e.ownerId),s=g.platforms.find(s=>s.room===e.room&&s.index===e.platformIndex),base=s?s.y-e.h:e.y;
 if(!owner||owner.dead||owner.hp<=0){
  if(!e.frozen){e.frozen=true;e.timer=FREEZE_TIME;e.y=base;g.emit('botFreeze',{x:e.x,y:e.y,enemyType:'bot'});}
  else if(e.timer<=0){e.dead=true;e.hp=0;e.deathTime=.35;g.emit('copyDissolve',{x:e.x,y:e.y,enemyType:'bot'});}
  return;
 }
 const hop=botHop(g.time);e.hopPhase=hop.phase;
 if(hop.phase==='air'){if(e.noticed)e.dir=dx<0?-1:1;e.x=clamp(e.x+e.dir*BOT_SPEED*dt,e.origin,e.end);}
 e.y=base-hop.h;
}
