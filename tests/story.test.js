import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WIDTH,WORLD,LAST_ROOM,FINAL_X,rooms,platforms} from '../engine.js';
import {enemy,createEnemies} from '../level.js';
import {scenes,evidence} from '../story.js';
import {damageBoss,castAttack,stepBoss} from '../boss.js';
import {wakePose,hurtPose,emotionFrames} from '../cat-animation.js';
import {monsterReaction} from '../monster-animation.js';
import {stickVector} from '../touch-controls.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function stand(g,room,index=2,x=604){const s=platforms.find(p=>p.room===room&&p.index===index);Object.assign(g.player,{x:room*WIDTH+x,y:s.y-48,vx:0,vy:0,grounded:true});g.room=room;}
function ready(){const g=new Game();g.start();g.finishWakeup();g.advanceDialogue(true);g.enemies=[];return g;}
test('five distinct chapters introduce the approved monsters in order',()=>{
 assert.equal(rooms.length,5);assert.equal(new Set(rooms.map(r=>r.theme)).size,5);
 const enemies=createEnemies();for(const [type,first]of [['infonoise',0],['clickbait',1],['headline',2],['panicker',3]])assert.equal(Math.min(...enemies.filter(e=>e.type===type).map(e=>e.room)),first);
 assert.ok(enemies.filter(e=>e.room===0).every(e=>e.type==='infonoise'));assert.equal(WORLD,WIDTH*5);
});
test('the wake-up shows sleep, yawn and surprise while monsters infect screens safely',()=>{
 const g=new Game();g.start();assert.equal(g.mode,'waking');const p={...g.player},timer=g.enemies[0].timer;
 assert.equal(wakePose(.2).name,'sleep');assert.equal(wakePose(1.8).name,'yawn');assert.equal(wakePose(3.5).name,'surprise');assert.equal(emotionFrames.length,8);
 tick(g,260,{right:true,jump:true,attack:true});assert.equal(g.mode,'dialogue');assert.equal(g.dialogue.id,'intro');assert.equal(g.wakeTime,4.2);assert.equal(g.clock,900);assert.equal(g.enemies[0].timer,timer);assert.equal(g.player.x,p.x);assert.equal(g.player.y,p.y);assert.equal(g.player.swing,0);assert.equal(g.events.filter(e=>e.type==='infection').length,3);
});
test('two short intro pages freeze simulation and keep Yuri lost with a clear new objective',()=>{
 const g=new Game();g.start();g.finishWakeup();assert.equal(scenes.intro.pages.length,2);assert.match(scenes.intro.pages.join(' '),/не знаю, где я/);assert.match(scenes.intro.pages.join(' '),/Найди Источник шума/);
 for(const scene of Object.values(scenes))for(const page of scene.pages)assert.ok(page.length<=130,page);
 const before=JSON.stringify(g);tick(g,120,{right:true,jump:true,attack:true,dash:true});assert.equal(JSON.stringify(g),before);
 g.advanceDialogue();assert.equal(g.dialogue.page,1);g.advanceDialogue();assert.equal(g.mode,'playing');assert.equal(g.clock,900);assert.equal(g.player.x,45);
 assert.match(scenes.arrival4.pages[0],/не знаю, где нахожусь/);assert.ok(!('people'in g));
});
test('pausing during wake-up or a dialogue preserves the exact scene and frame',()=>{
 const g=new Game();g.start();tick(g,60);g.pausedFrom=g.mode;g.mode='paused';const before=JSON.stringify(g);tick(g,90);assert.equal(JSON.stringify(g),before);
 g.mode=g.pausedFrom;tick(g,10);assert.ok(g.wakeTime>1);g.finishWakeup();g.advanceDialogue();g.mode='paused';tick(g,100);assert.equal(g.dialogue.page,1);
 g.start();assert.equal(g.pausedFrom,undefined);assert.equal(g.evidence.length,0);assert.equal(g.mode,'waking');
});
test('unknown monsters stay dormant until introduced; detection happens before the attack',()=>{
 const g=new Game();g.start();g.finishWakeup();g.advanceDialogue(true);const e=g.enemies[0],timer=e.timer;tick(g,100);assert.equal(e.timer,timer);assert.equal(g.bolts.length,0);
 Object.assign(g.player,{x:90,y:255,inv:0});const clock=g.clock;tick(g,1);assert.equal(g.dialogue.id,'infonoise');assert.equal(g.clock,clock);tick(g,100);assert.equal(g.bolts.length,0);
 g.advanceDialogue(true);tick(g,1);assert.ok(e.noticeTime>0);assert.equal(e.timer,timer);tick(g,25);assert.ok(e.timer<timer);assert.equal(e.noticeTime,0);assert.ok(g.seenScenes.has('infonoise'));
});
test('later chapters are frozen while Uma is elsewhere',()=>{
 const g=new Game({story:false});g.start();const later=g.enemies.filter(e=>e.room>0).map(e=>[e.id,e.x,e.timer,e.state]);tick(g,20);assert.deepEqual(g.enemies.filter(e=>e.room>0).map(e=>[e.id,e.x,e.timer,e.state]),later);
});
test('a first encounter interrupts play before Clickbait reveals or swallows Uma',()=>{
 const g=ready();g.relays[0].hp=0;stand(g,1,1,310);g.seenScenes.add('arrival1');g.enemies=[enemy('clickbait',1,365,1)];tick(g,1);assert.equal(g.dialogue.id,'clickbait');assert.equal(g.swallow,null);assert.equal(g.enemies[0].state,'lure');g.advanceDialogue(true);tick(g,1);assert.equal(g.enemies[0].state,'windup');tick(g,1);assert.ok(g.enemies[0].noticeTime>0);
});
test('a cleared relay adds one evidence record and explains its link to the source',()=>{
 const g=ready();stand(g,0);g.relays[0].hp=1;g.step(1/60,{attack:true});assert.equal(g.relays[0].hp,0);assert.deepEqual(g.evidence,[{...evidence[0],room:0}]);assert.equal(g.dialogue.id,'chapter0');g.completeChapter(0);assert.equal(g.evidence.length,1);
});
test('evidence, completed scenes and open gates survive checkpoint retry',()=>{
 const g=ready();g.relays[0].hp=0;g.completeChapter(0);g.advanceDialogue(true);g.checkpoint=1;stand(g,1);g.seenScenes.add('arrival1');g.relays[1].hp=1;g.step(1/60,{attack:true});assert.equal(g.dialogue.id,'chapter1');assert.equal(g.evidence.length,2);
 g.advanceDialogue(true);g.lives=1;g.player.inv=0;g.hurt();assert.equal(g.mode,'lost');g.retry();assert.equal(g.mode,'playing');assert.equal(g.dialogue,null);assert.equal(g.relays[1].hp,0);assert.equal(g.evidence.length,2);assert.ok(g.seenScenes.has('intro')&&g.seenScenes.has('chapter1'));
});
test('chapter arrival is delivered once and takes no gameplay time',()=>{
 const g=ready();g.relays[0].hp=0;stand(g,1,0,45);const clock=g.clock;tick(g,1);assert.equal(g.dialogue.id,'arrival1');assert.equal(g.clock,clock);g.advanceDialogue(true);tick(g,1);assert.equal(g.dialogue,null);
});
test('soup explanation freezes its buff while reading',()=>{
 const g=ready();stand(g,0,0,45);g.lives=2;g.soups=[{x:62,y:279,taken:false}];tick(g,1);assert.equal(g.dialogue.id,'soup');assert.equal(g.lives,3);assert.equal(g.player.powerTime,10);tick(g,180);assert.equal(g.player.powerTime,10);g.advanceDialogue(true);tick(g,60);assert.ok(Math.abs(g.player.powerTime-9)<.01);
});
test('printing-house belts move Uma and preserve jump control',()=>{
 const g=ready();g.relays.slice(0,2).forEach(r=>r.hp=0);g.seenScenes.add('arrival2');stand(g,2,1,325);const x=g.player.x;tick(g,30);assert.ok(g.player.x>x+9&&g.player.x<x+11);g.step(1/60,{jump:true});assert.ok(g.player.vy<0);
});
test('noticing and taking damage select distinct monster poses; hits interrupt attacks',()=>{
 const g=new Game({story:false});g.start();g.soups=[];g.fishes=[];stand(g,0,0,45);const e=enemy('infonoise',0,125,0,{timer:10});g.enemies=[e];tick(g,1);assert.equal(monsterReaction(e.type,g.time,e).kind,'notice');const x=e.x;tick(g,10);assert.equal(e.x,x);
 tick(g,20);assert.equal(monsterReaction(e.type,g.time,e).kind,'run');g.hitEnemy(e);assert.equal(monsterReaction(e.type,g.time,e).kind,'hit');assert.equal(e.state,'recover');assert.ok(e.hurtTime>0);const hitX=e.x;tick(g,8);assert.equal(e.x,hitX);
 e.inv=0;g.hitEnemy(e,false,99);assert.equal(e.dead,true);assert.ok(e.deathTime>0);tick(g,20);assert.equal(e.deathTime,0);
 for(const type of ['infonoise','clickbait','headline','panicker','source']){const run=monsterReaction(type,0,{moving:true,state:'patrol'}),step=monsterReaction(type,.1,{moving:true,state:'patrol',walkTime:.1}),notice=monsterReaction(type,0,{noticeTime:.2}),hit=monsterReaction(type,0,{noticeTime:.2,hurtTime:.1});assert.notDeepEqual(run.box,step.box);assert.notDeepEqual(notice.box,hit.box);assert.equal(hit.kind,'hit');}
});
test('Uma has a two-stage hurt reaction including the last heart, protected hits do not restart it',()=>{
 const g=new Game({story:false});g.start();g.enemies=[];g.player.inv=0;g.hurt();assert.equal(g.player.hurtTime,.5);assert.equal(hurtPose(.5),6);assert.equal(hurtPose(.1),7);tick(g,18);assert.ok(g.player.hurtTime<.26);const time=g.player.hurtTime;g.hurt();assert.equal(g.player.hurtTime,time);tick(g,31);g.lives=1;g.player.inv=0;g.hurt();assert.equal(g.mode,'lost');assert.equal(g.player.hurtTime,.5);
});
test('joystick has a radial dead zone, clamps diagonals and produces proportional movement',()=>{
 assert.deepEqual(stickVector(3,2),{x:0,y:0});assert.deepEqual(stickVector(100,0),{x:1,y:0});assert.ok(Math.abs(Math.hypot(...Object.values(stickVector(100,100)))-1)<1e-8);const half=stickVector(28.8,0).x;assert.ok(Math.abs(half-.5)<1e-8);
 const g=new Game({story:false});g.start();g.enemies=[];const x=g.player.x;tick(g,12,{axisX:half});assert.ok(Math.abs(g.player.x-x-15.5)<.001);tick(g,1,{axisX:-1});assert.equal(g.player.dir,-1);g.step(1/60,{axisX:-1,right:true});assert.equal(g.player.dir,1);
 g.viewWidth=300;g.player.x=WORLD-50;g.updateCamera();assert.equal(g.camera,WORLD-300);
});
test('Source retains its full encounter without rescue-dependent assistance',()=>{
 const g=ready();g.boss.active=true;g.boss.ability='summon';castAttack(g);assert.equal(g.enemies.length,2);g.boss.state='casting';g.boss.timer=0;stepBoss(g,1/60);assert.equal(g.boss.state,'recover');assert.equal(g.boss.timer,1.35);g.lives=2;g.boss.hp=12;stepBoss(g,1/60);assert.equal(g.lives,2);
});
test('Source defeat reveals human negligence before returning to the newsroom',()=>{
 const g=ready();g.relays.forEach(r=>r.hp=0);g.seenScenes.add('arrival4');stand(g,LAST_ROOM);g.step(1/60);assert.equal(g.boss.active,true);assert.equal(g.dialogue.id,'source');g.advanceDialogue(true);
 g.boss.hp=1;g.boss.cooldown=0;g.boss.state='recover';assert.equal(damageBoss(g,1),true);assert.equal(g.dialogue.id,'truth');assert.equal(g.truthFound,true);assert.equal(g.mode,'dialogue');assert.equal(scenes.truth.pages.length,3);assert.match(scenes.truth.pages.join(' '),/халатности/);assert.match(scenes.truth.pages.join(' '),/просмотров и реакций/);
 const clock=g.clock;tick(g,100);assert.equal(g.clock,clock);g.advanceDialogue();g.advanceDialogue();g.advanceDialogue();assert.equal(g.dialogue.id,'ending');assert.equal(g.mode,'dialogue');g.advanceDialogue(true);assert.equal(g.mode,'won');assert.ok(g.events.some(e=>e.type==='won'));
 g.start();assert.equal(g.mode,'waking');assert.equal(g.truthFound,false);assert.equal(g.evidence.length,0);
});
test('skipping the reveal still reaches the ending and cannot reopen the boss fight',()=>{
 const g=ready();g.boss.hp=1;g.boss.active=true;g.boss.state='recover';damageBoss(g,1);g.advanceDialogue(true);assert.equal(g.dialogue.id,'ending');g.advanceDialogue(true);assert.equal(g.mode,'won');tick(g,90,{right:true,attack:true});assert.equal(g.boss.hp,0);
});
test('the complete five-chapter route and all four records are reachable by normal movement',()=>{
 const g=new Game();g.start();g.finishWakeup();g.enemies=[];let jumped=false;
 for(let i=0;i<5000&&g.player.x<FINAL_X+380&&g.mode!=='lost';i++){
  if(g.mode==='dialogue'){g.advanceDialogue(true);continue;}
  const p=g.player,s=platforms.find(s=>Math.abs(p.y+p.h-s.y)<1&&p.x+p.w>s.x&&p.x<s.x+s.w);let jump=false;
  if(p.grounded&&s&&p.x>s.x+s.w-50&&(s.index===0||s.index===1)){jump=!jumped;jumped=true;}else if(!p.grounded)jumped=false;
  g.step(1/60,{right:true,jump,attack:true});
 }
 assert.ok(g.player.x>FINAL_X+375);assert.equal(g.relays.filter(r=>r.hp===0).length,4);assert.deepEqual(g.evidence.map(e=>e.id),evidence.map(e=>e.id));assert.equal(g.checkpoint,LAST_ROOM);assert.ok(g.lives>0);
 for(const key of ['intro','chapter0','chapter1','chapter2','chapter3','arrival1','arrival2','arrival3','arrival4'])assert.ok(g.seenScenes.has(key),key);
});
