import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,rooms} from '../engine.js';
import {enemy,createEnemies,createNotebooks,chapters} from '../level.js';
import {activateRoom,canLeaveRoom} from '../room-transitions.js';
import {stampInk} from '../tactical-enemies.js';
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
 assert.ok(local.length<=8);for(const s of local.slice(1))assert.ok(s.w<=130,'catwalks are short');
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

test('a press crushes monsters and Censors under it',()=>{
 const press=PRESSES[1],g=ready();place(g,0,press.x-300);const e=enemy('fakenews',1,press.x+50,0,{active:true,spawnTime:0,state:'recover',timer:99});g.enemies=[e];
 g.censors=[{id:'c',source:0,x:R.x+press.x+100,phase:'stand',time:0,flash:0}];toPhase(g,press,PRESS_HOLD-.2);tick(g,1);
 assert.equal(e.dead,true);assert.equal(g.censors[0].phase,'retract');assert.ok(g.events.some(x=>x.type==='pressCrush'));
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
 const g=ready();place(g,CHECKPOINTS[1],1500);tick(g,2);assert.equal(g.newsroomCheckpoint,1);
 place(g,0,1700);g.health=1;g.player.inv=0;g.hurt(false,g.player.x+100);tick(g,90);
 assert.equal(g.mode,'playing');assert.equal(g.player.supportId,'1:'+CHECKPOINTS[1]);
 g.retryLocation();assert.equal(g.newsroomCheckpoint,null);
});

test('Yuri speaks once, at the very start of the newsroom',()=>{
 const notes=createNotebooks().filter(n=>n.room===1&&!n.bossRecord);assert.equal(notes.length,1);
 const [note]=notes;assert.ok(note.x-R.x<100);assert.deepEqual(note.scenes,['arrival1','fakenews','stamp','censor','press']);
});
