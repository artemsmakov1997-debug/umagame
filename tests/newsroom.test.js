import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,rooms} from '../engine.js';
import {enemy,createEnemies,createNotebooks,chapters} from '../level.js';
import {activateRoom,canLeaveRoom} from '../room-transitions.js';
import {stampInk} from '../tactical-enemies.js';
import {jumpTo} from './navigation.js';
import {PRESSES,PRESS_W,PRESS_WARN,PRESS_SLAM,PRESS_HOLD,CENSOR,CENSOR_SOURCES,CHECKPOINTS,BELT_SPEED,pressState,censorBox} from '../newsroom-systems.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
const R=rooms[1];
function ready(){
 const g=new Game({story:false,cinematic:true});g.start();g.tutorial.complete=true;activateRoom(g,1);g.mode='playing';
 g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.boss.active=false;g.testingInvulnerable=false;
 for(const type of ['fakenews','stamp','censor'])g.seenScenes.add('sighting:'+type);
 return g;
}
const place=(g,index,x)=>{const s=g.platforms.find(s=>s.id==='1:'+index);Object.assign(g.player,{x:R.x+x,y:s.y-48,vx:0,vy:0,grounded:true,supportId:s.id,inv:0});};
// Advance the shared clock to a given phase of one press.
const toPhase=(g,press,phase)=>{g.time=((phase-press.offset)%4.5+4.5)%4.5;};

test('the newsroom is one conveyor towards Uma with a few short catwalks and an exit that needs no nodes',()=>{
 const g=ready(),belt=g.platforms.find(s=>s.id==='1:0'),local=g.platforms.filter(s=>s.room===1);
 assert.equal(belt.x,R.x);assert.equal(belt.w,R.width);assert.equal(belt.belt,BELT_SPEED);assert.ok(BELT_SPEED<0,'runs right to left');
 assert.ok(local.length<=9);for(const s of local.slice(1))assert.ok(s.w<=130,'catwalks are short');
 assert.equal(g.relays.filter(d=>d.room===1).length,0);assert.equal(canLeaveRoom(g,1),true);
 assert.deepEqual(chapters.find(c=>c.room===1).monsters,['fakenews','stamp','censor']);
 assert.ok(createEnemies().filter(e=>e.room===1).every(e=>['fakenews','stamp'].includes(e.type)),'no Copier in the newsroom');
 assert.ok(PRESSES.length>=3&&PRESSES[0].x<768&&PRESSES.at(-1).x>1536,'presses stand along the whole location');
});

test('standing still, the belt carries Uma, monsters and Stamp ink back to the left',()=>{
 const g=ready();place(g,0,1000);const e=enemy('fakenews',1,1300,0,{active:true,spawnTime:0,state:'recover',timer:99});g.enemies=[e];
 const s=enemy('stamp',1,1200,0,{active:true});stampInk(g,s);const ink=g.inks[0],inkX=ink.localX,ux=g.player.x,ex=e.x;
 tick(g,60);assert.ok(g.player.x<ux-40);assert.ok(e.x<ex-30);assert.ok(ink.localX<inkX-40);
});

test('a press takes a whole life; its warning and raised head leave a fair window',()=>{
 const press=PRESSES[0];
 const safe=ready();place(safe,0,press.x+60);toPhase(safe,press,.5);tick(safe,1);assert.equal(safe.lives,3,'raised head is safe');assert.equal(safe.mode,'playing');
 const warn=ready();place(warn,0,press.x+60);toPhase(warn,press,PRESS_WARN+.2);tick(warn,1);assert.equal(warn.mode,'playing','the warning itself never hurts');
 const hit=ready();place(hit,0,press.x+60);hit.health=4;hit.player.inv=5;toPhase(hit,press,PRESS_SLAM+.1);tick(hit,1);
 assert.equal(hit.lives,2,'one whole life, even through invulnerability');assert.equal(hit.mode,'respawning');assert.ok(hit.events.some(e=>e.type==='pressHit'));
 assert.ok(PRESS_WARN>=2,'the head stays up long enough to run under it');assert.ok(PRESS_SLAM-PRESS_WARN>=.9,'about a second of warning');
});

test('a press spares Fakenews but still crushes other monsters and Censors under it',()=>{
 const press=PRESSES[1],g=ready();place(g,0,press.x-300);const e=enemy('fakenews',1,press.x+50,0,{active:true,spawnTime:0,state:'recover',timer:99});g.enemies=[e];
 g.censors=[{id:'c',source:0,x:R.x+press.x+100,phase:'stand',time:0,flash:0}];toPhase(g,press,PRESS_HOLD-.2);tick(g,1);
 assert.equal(e.dead,false);assert.equal(e.hp,2);assert.equal(g.kills,0);assert.equal(g.censors[0].phase,'retract');assert.ok(g.events.some(x=>x.type==='pressCrush'));
 const stamp=enemy('stamp',1,press.x+55,0,{active:true,spawnTime:0,state:'recover',timer:99});g.enemies.push(stamp);tick(g,1);assert.equal(stamp.dead,true);assert.equal(e.dead,false);
});

test('a Censor grows from the belt ahead of Uma after a harmless warning, rides towards her and hurts on touch',()=>{
 const g=ready(),source=R.x+CENSOR_SOURCES[0];Object.assign(g.player,{x:source-300});place(g,0,CENSOR_SOURCES[0]-300);g.time=.3;
 tick(g,1);assert.equal(g.censors.length,1);const c=g.censors[0];assert.equal(c.phase,'warn');assert.equal(censorBox(c).h,0,'the bulge cannot hurt');
 tick(g,Math.ceil((CENSOR.warn+CENSOR.grow)*60)+2);assert.equal(c.phase,'stand');assert.equal(censorBox(c).h,CENSOR.height);assert.ok(c.x<source,'rides the belt');
 assert.ok(CENSOR.height<100,'low enough to jump over');
 const h=ready();place(h,0,1200);h.censors=[{id:'c',source:0,x:h.player.x+h.player.w/2,phase:'stand',time:0,flash:0}];h.health=4;tick(h,1);assert.equal(h.health,3);assert.ok(h.censors[0].flash>0);
});

test('a Censor cannot be defeated by the paw',()=>{
 const g=ready();place(g,0,1200);const c={id:'c',source:0,x:g.player.x+60,phase:'stand',time:0,flash:0};g.censors=[c];g.player.dir=1;g.player.inv=99;
 tick(g,1,{attack:true});tick(g,10);assert.equal(g.censors.includes(c),true);assert.notEqual(c.phase,'retract');
});

test('catwalks are checkpoints: a lost life returns Uma to the furthest one reached',()=>{
 const g=ready();place(g,CHECKPOINTS[0],900);tick(g,2);assert.equal(g.newsroomCheckpoint,0);
 place(g,0,1700);g.health=1;g.player.inv=0;g.hurt(false,g.player.x+100);tick(g,90);
 assert.equal(g.mode,'playing');assert.equal(g.player.supportId,'1:'+CHECKPOINTS[0]);
 g.retryLocation();assert.equal(g.newsroomCheckpoint,null);
});

test('Yuri speaks once, at the very start of the newsroom',()=>{
 const notes=createNotebooks().filter(n=>n.room===1&&!n.bossRecord);assert.equal(notes.length,1);
 const [note]=notes;assert.ok(note.x-R.x<100);assert.deepEqual(note.scenes,['arrival1','fakenews','stamp','censor','press']);
});

test('the rightmost press is replaced by a reachable stationary Stamp platform',()=>{
 const g=ready(),s=g.platforms.find(s=>s.id==='1:7'),stamp=createEnemies().find(e=>e.inkStation&&e.platformIndex===7);
 assert.equal(PRESSES.length,3);assert.ok(!PRESSES.some(p=>p.x===2010));assert.deepEqual([s.x-R.x,s.y,s.w],[2010,260,124]);
 assert.equal(stamp.platformIndex,7);assert.equal(stamp.y+stamp.h,s.y);assert.equal(stamp.speed,0);assert.equal(stamp.source,undefined);assert.equal(stamp.inkPlatformId,'1:0');
 place(g,6,1880);assert.equal(jumpTo(g,1,7),true);
});

test('exactly two Stamps stand on the middle and final grounded stations, never on the belt',()=>{
 const g=ready(),stamps=createEnemies().filter(e=>e.room===1&&e.type==='stamp');assert.equal(stamps.length,2);
 assert.deepEqual(stamps.map(e=>e.platformIndex),[8,7]);assert.ok(stamps.every(e=>e.inkStation&&e.speed===0&&!e.source));
 for(const e of stamps){const s=g.platforms.find(s=>s.index===e.platformIndex&&s.room===1);assert.equal(e.y+e.h,s.y);assert.ok(e.x>=s.x&&e.x+e.w<=s.x+s.w);}
 place(g,3,980);assert.equal(jumpTo(g,1,8),true);
});

test('the two persistent ink streams leave clean walking gaps after prolonged operation',()=>{
 const g=ready();g.enemies=createEnemies().filter(e=>e.room===1&&e.type==='stamp');place(g,3,980);tick(g,60*60);
 const coverage=visual=>{const spans=g.inks.filter(i=>i.fly===0).map(i=>{const pad=visual?i.w*.1:0;return[Math.max(100,i.localX-pad),Math.min(1000,i.localX+i.w+pad)];}).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]);let end=100,dirty=0,gap=0;
  for(const[a,b]of spans){gap=Math.max(gap,a-end);dirty+=Math.max(0,b-Math.max(end,a));end=Math.max(end,b);}return{dirty:dirty/900,gap:Math.max(gap,1000-end)};};
 for(let sample=0;sample<30;sample++){
  tick(g,60);const floor=coverage(false),art=coverage(true);assert.ok(floor.dirty>.3&&floor.dirty<.65,JSON.stringify(floor));assert.ok(art.dirty<.75&&art.gap>=45,JSON.stringify(art));assert.ok(g.inks.length<=15);assert.ok(g.inks.every(i=>i.w===84&&i.persistent));
 }
 assert.ok(g.inks.length>8,'both streams persist beyond the former eight-blot cap');
});

test('the final ink station keeps casting from far away and belt ink survives drying',()=>{
 const g=ready(),stamp=createEnemies().find(e=>e.inkStation&&e.platformIndex===7);g.enemies=[stamp];place(g,3,980);const x=stamp.x;
 tick(g,180);assert.ok(g.inks.length>0);const first=g.inks[0],local=first.localX;assert.ok(first.persistent);assert.equal(first.platformId,'1:0');assert.equal(first.fly,0);
 tick(g,60*22);assert.equal(stamp.x,x);assert.ok(g.inks.includes(first));assert.equal(first.time,9);assert.ok(first.localX<local-950);assert.ok(g.inks.length>=3&&g.inks.length<=5);assert.ok(g.inks.every(i=>i.platformId==='1:0'));
 const frozen=JSON.stringify(g);g.mode='paused';const paused=JSON.stringify(g);tick(g,180);assert.equal(JSON.stringify(g),paused);g.mode='playing';assert.notEqual(frozen,paused);
 stamp.inv=0;g.hitEnemy(stamp);stamp.inv=0;g.hitEnemy(stamp);assert.ok(stamp.dead);assert.ok(g.inks.includes(first));const serial=g.tacticalSerial;
 tick(g,60*48);assert.ok(!g.inks.includes(first),'removed only after riding off the left belt edge');assert.equal(g.inks.length,0);assert.equal(g.tacticalSerial,serial,'a defeated Stamp stops producing ink');
});

test('ordinary off-belt ink still dries and the removed press no longer crushes Uma',()=>{
 const g=ready();place(g,0,2070);g.time=2.7;tick(g,1);assert.equal(g.lives,3);assert.equal(g.mode,'playing');
 const stamp=enemy('stamp',1,980,3,{active:true});stampInk(g,stamp);const ink=g.inks[0];assert.equal(ink.persistent,false);
 place(g,3,980);tick(g,60*10);assert.ok(!g.inks.includes(ink));
});
