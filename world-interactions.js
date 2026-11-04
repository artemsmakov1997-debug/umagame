import {createPartitions,stepStudio} from './studio-systems.js?v=0.22.0';
import {redirectInformant,redirectMarkedSignal} from './informant-teleport.js?v=0.22.0';
import {enemy,rooms} from './level.js?v=0.22.0';
import {addTemporarySurface} from './world-geometry.js?v=0.22.0';
const near=(a,b,r)=>Math.abs(a.x-b.x)<r&&Math.abs(a.y-b.y)<620;
export function createInteractiveWorld(g){
 g.generators=[];g.devices=[];g.decoys=[];g.inkGates=[];g.gusts=[];g.echoTraces=[];g.motionHistory=[];g.motionClock=0;g.eventSeen=new Set();g.chapterEvent=null;g.arenaState=null;g.alarmBudgets={};createPartitions(g);
 for(const r of rooms){if(!r.multiStorey)continue;if(!r.arena){const index=r.index===5?14:r.index===7?17:14,s=g.platforms.find(s=>s.room===r.index&&s.index===index);g.generators.push({id:'generator-'+r.index,room:r.index,platformIndex:index,x:s.x+s.w/2-28,y:s.y-58,w:56,h:58,kind:{newsroom:'printer',roofs:'receiver',studio:'reel',noise:'rift'}[r.theme],hp:1,budget:3,emitted:0,cooldown:7,lastSwing:-1,blocked:0});}
 else for(const [i,index]of[9,12].entries()){const s=g.platforms.find(s=>s.room===r.index&&s.index===index);g.devices.push({id:'arena-device-'+r.index+'-'+i,room:r.index,platformIndex:index,x:s.x+s.w/2-24,y:s.y-62,w:48,h:62,kind:r.theme==='newsroom'?'press':r.theme==='roofs'?'transmitter':r.theme==='studio'?'console':'anchor',hp:1,jammed:0,lastSwing:-1,blocked:0});}
 }
}
export function deviceHit(g,d,{reflected=false}={}){if(d.kind==='receiver')for(const e of g.enemies)if(e.room===g.room&&e.type==='informant')redirectInformant(g,e);if(d.blocked>0){d.blocked=0;g.emit('inkCleared',{x:d.x,y:d.y});return true;}if(d.jammed>0)return false;
 if(d.kind==='press'||d.kind==='transmitter'||d.kind==='console'||d.kind==='anchor'){d.jammed=reflected?5:3;const b=g.boss;b.shieldBroken=Math.max(b.shieldBroken,3);if(g.arenaState)g.arenaState.exposure=Math.max(g.arenaState.exposure,reflected?4:2.5);g.emit('mechanismChanged',{kind:d.kind,x:d.x,y:d.y,reflected});}
 else{d.hp=0;d.disabled=true;g.emit('generatorOff',{x:d.x,y:d.y});}return true;
}
export function hitWorldDevice(g,bolt){for(const d of [...g.generators,...g.devices])if(d.room===g.room&&d.hp&&g.overlap(bolt,d))return deviceHit(g,d,{reflected:true});return false;}
export function stepDevices(g,dt,paw){redirectMarkedSignal(g,paw);
 for(const d of [...g.generators,...g.devices]){if(d.room!==g.room)continue;const support=g.platforms.find(s=>s.room===d.room&&s.index===d.platformIndex);if(support){d.x=support.x+support.w/2-d.w/2;d.y=support.y-d.h;}d.jammed=Math.max(0,(d.jammed||0)-dt);d.blocked=Math.max(0,(d.blocked||0)-dt);
  if(d.hp&&g.player.attack>0&&d.lastSwing!==g.player.swing&&g.overlap(paw,d)){d.lastSwing=g.player.swing;deviceHit(g,d);}
  if(!d.budget||!d.hp||d.blocked>0)continue;d.cooldown-=dt;
  if(d.cooldown<=0&&d.emitted<d.budget&&Math.hypot(g.player.x-d.x,g.player.y-d.y)<550&&!g.enemies.some(e=>e.generatorId===d.id&&!e.dead)&&g.enemies.filter(e=>e.active&&!e.dead&&e.room===g.room).length<3){
   d.cooldown=9;d.emitted++;const type={printer:'fakenews',receiver:'informant',reel:'injection',rift:'static'}[d.kind],s=support,x=Math.max(s.x+8,Math.min(s.x+s.w-58,d.x));if(Math.abs(x-g.player.x)<80&&Math.abs(s.y-g.player.y-g.player.h)<100){d.cooldown=1;d.emitted--;continue;}
   const e=enemy(type,d.room,x-rooms[d.room].x,s.index,{id:'generated-'+d.id+'-'+d.emitted,active:true,noticed:true,spawnTime:.8,generatorId:d.id});e.y=s.y-(e.flying?100:e.h);g.enemies.push(e);g.emit('generatorSpawn',{x:d.x,y:d.y});
  }
 }
 for(const gate of g.inkGates){gate.time-=dt;if(g.player.attack>0&&g.overlap(paw,gate))gate.time=0;}g.inkGates=g.inkGates.filter(i=>i.time>0);
 for(const decoy of g.decoys){decoy.time-=dt;const owner=g.enemies.find(e=>e.id===decoy.ownerId);if(!owner||owner.dead)decoy.time=0;}g.decoys=g.decoys.filter(d=>d.time>0);
}
export function copyDecoy(g,e){if(g.decoys.some(d=>d.ownerId===e.id)||g.decoys.length>=2)return;const s=g.platforms.find(s=>s.room===e.room&&s.index===e.platformIndex);if(!s)return;g.decoys.push({ownerId:e.id,room:e.room,x:Math.max(s.x+10,Math.min(s.x+s.w-55,e.x+e.dir*74)),y:s.y-48,w:34,h:48,time:6});g.emit('paperDecoy',{x:e.x,y:e.y});}
export function distractionTarget(g,e){return g.decoys.filter(d=>d.ownerId!==e.id&&d.room===e.room&&Math.hypot(d.x-e.x,d.y-e.y)<310).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0]||g.player;}
export function stepSynergies(g,dt=1/60){stepStudio(g,dt);for(const e of g.enemies){if(e.room!==g.room||e.dead)continue;const source=g.generators.find(d=>d.room===e.room&&near(d,e,450));e.powered=!source||source.hp>0;e.sensation=e.type==='fakenews'&&(g.enemies.some(c=>c.type==='copier'&&c!==e&&c.active&&!c.dead&&c.powered!==false&&near(c,e,400))||source?.hp>0)?1.35:1;}}
export function silenceNetwork(g,relay){for(const p of g.portals)if(p.room===relay.room&&Math.abs(p.x-relay.x)<650)p.cancelled=true;for(const d of g.generators)if(d.room===relay.room&&Math.abs(d.x-relay.x)<650){d.hp=0;d.disabled=true;}for(const e of g.enemies)if(e.room===relay.room&&Math.abs(e.x-relay.x)<650){e.alert=0;e.sensation=1;e.pressureTime=0;if(e.type==='panicker'){e.networkSilenced=true;e.state='recover';e.timer=3;e.alarmCooldown=10;}if(e.type==='copier')e.powered=false;}for(const s of g.platforms)if(s.room===relay.room&&s.belt&&Math.abs(s.x-relay.x)<700)s.belt=0;}
export function blockWithInk(g,e){const d=[...g.generators,...g.devices,...g.mapProps].filter(d=>d.room===e.room&&d.hp&&Math.hypot(d.x-e.x,d.y-e.y)<160)[0];if(d)d.blocked=3.5;const room=rooms[e.room];if(!room.multiStorey)return;const x=room.x+Math.round((e.x-room.x)/768)*768;if(x>room.x+100&&Math.abs(x-e.x)<200&&!g.inkGates.some(i=>Math.abs(i.x-x)<10))g.inkGates.push({room:e.room,x:x-12,y:e.y+e.h-64,w:24,h:64,time:3.5,kind:'ink'});}
export function stepChapterEvent(g,dt){if(!g.cinematic||!rooms[g.room].multiStorey||rooms[g.room].arena)return;const r=rooms[g.room],local=g.player.x-r.x;if(!g.chapterEvent&&local>900&&!g.eventSeen.has(g.room)){g.eventSeen.add(g.room);g.chapterEvent={room:g.room,type:r.theme,time:0,duration:26,startX:g.player.x,chaserX:g.player.x-240};g.emit('worldEvent',{theme:r.theme});}const e=g.chapterEvent;if(!e)return;if(e.room!==g.room){g.chapterEvent=null;return;}e.time+=dt;if(e.type==='newsroom'){e.chaserX+=82*dt;if(g.overlap(g.player,{x:e.chaserX-58,y:800,w:112,h:137}))g.hurt(false,e.chaserX);}
 if(e.pulse){e.pulse.age+=dt;if(e.pulse.age>=1.1&&e.pulse.age<1.4&&g.overlap(g.player,e.pulse)){g.hurt(false,e.pulse.x);if(g.player.dash===0&&!g.player.knock)g.push(g.player.x>e.pulse.x?1:-1,e.pulse.x);}if(e.pulse.age>1.5)e.pulse=null;}
 if(e.type==='roofs'&&Math.floor(e.time/4)!==e.lastPulse){e.lastPulse=Math.floor(e.time/4);const s=g.platforms.find(s=>s.room===g.room&&s.index===(e.lastPulse%2?17:25));if(s)e.pulse={x:s.x+s.w/2-40,y:s.y-96,w:80,h:96,age:0};if(s&&g.gusts.length<3)g.gusts.push({ownerId:'overload-'+e.lastPulse,room:g.room,x:s.x,y:s.y-550,w:120,h:560,vx:0,vy:-460,vertical:true,time:2});}
 if(e.time>=e.duration){g.chapterEvent=null;g.emit('worldEventEnd');}}

export function resetInteractiveRoom(g,room){
 for(const d of [...g.generators,...g.devices])if(d.room===room)Object.assign(d,{hp:1,disabled:false,emitted:0,cooldown:7,jammed:0,blocked:0,lastSwing:-1});
 const owners=new Set(g.enemies.filter(e=>e.room===room).map(e=>e.id));for(const id of Object.keys(g.alarmBudgets))if(owners.has(id))delete g.alarmBudgets[id];
 for(const w of g.partitions)if(w.room===room)w.open=false;
 for(const s of g.platforms)if(s.room===room){s.collapseTime=0;s.collapseCharge=0;}
 g.eventSeen.delete(room);g.chapterEvent=null;
}
