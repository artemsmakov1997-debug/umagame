import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {activateRoom} from '../room-transitions.js';import {createEnemies,rooms} from '../level.js';import {openingSlides} from '../prologue.js';
const tick=(g,n,i={})=>{for(let k=0;k<n;k++)g.step(1/60,i);};
function ready(){const g=new Game({story:false});g.start();g.tutorial.complete=true;activateRoom(g,1);g.enemies=[];g.notebooks=[];g.soups=[];g.fishes=[];return g;}
test('opening has four ordered scenes, freezes play, supports back and leads into waking',()=>{const g=new Game({cinematic:true});g.start();assert.equal(g.mode,'prologue');tick(g,200,{right:true,attack:true});assert.equal(g.time,0);assert.equal(g.openingIndex,0);g.advanceOpening(-1);assert.equal(g.openingIndex,0);for(let n=0;n<3;n++){g.advanceOpening();assert.equal(g.openingIndex,n+1);}assert.match(openingSlides[3].text,/Юрия затягивает/);g.advanceOpening(-1);assert.equal(g.openingIndex,2);g.advanceOpening();g.advanceOpening();assert.equal(g.mode,'waking');g.mode='paused';g.advanceOpening();assert.equal(g.mode,'paused');});
test('down plus attack drops exactly one platform, even while held; lower floors still catch Uma',()=>{const g=ready();tick(g,70,{down:true,attack:true});assert.equal(g.player.supportId,'1:29');assert.equal(g.player.y+g.player.h,474);assert.equal(g.player.swing,0);assert.equal(g.health,4);assert.equal(g.events.filter(e=>e.type==='dropThrough').length,1);tick(g,1);tick(g,70,{down:true,jump:true});assert.equal(g.player.supportId,'1:3');assert.equal(g.player.y+g.player.h,950);});
test('the last floor cannot be dropped through and an ordinary jump still works',()=>{const g=ready();Object.assign(g.player,{y:952,supportId:'1:5',grounded:true});tick(g,30,{down:true,jump:true});assert.equal(g.player.y+g.player.h,1000);assert.equal(g.events.filter(e=>e.type==='dropThrough').length,0);tick(g,1);tick(g,1,{jump:true});assert.ok(g.player.vy<0);});
test('first species introduction is shown without freezing the game or requiring a notebook',()=>{
 const g=new Game({cinematic:true});g.start();while(g.mode==='prologue')g.advanceOpening();
 g.finishWakeup();g.advanceDialogue(true);g.tutorial.complete=true;activateRoom(g,1);
 g.enemies=[createEnemies()[0]];g.notebooks=[];g.player.x=rooms[1].x+95;
 tick(g,1);assert.equal(g.dialogue,null);assert.equal(g.mode,'playing');
 assert.ok(g.seenScenes.has('sighting:fakenews'));
 assert.ok(g.events.some(e=>e.type==='enemyIntroduction'&&e.enemyType==='fakenews'));
 assert.equal(g.enemies[0].active,true);
 const previous=g.time;tick(g,120,{attack:true});assert.ok(g.time>previous);
});
test('a summoned species also receives a nonblocking first-sighting hint',async()=>{
 const {enemy}=await import('../level.js');const g=ready();g.storyEnabled=true;g.cinematic=true;
 g.enemies=[enemy('clickbait',1,365,1,{active:true,spawnTime:.6})];
 tick(g,1);assert.equal(g.dialogue,null);assert.equal(g.mode,'playing');
 assert.ok(g.seenScenes.has('sighting:clickbait'));
 assert.ok(g.events.some(e=>e.type==='enemyIntroduction'&&e.enemyType==='clickbait'));
});
