import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WIDTH,platforms,START_LIVES,MAX_HEALTH,WAKE_DURATION,rooms} from '../engine.js';
import {enemy} from '../level.js';
import {touchesBait} from '../enemies.js';
import {clickbaitAppearanceFrame} from '../monster-animation.js';
import {backgroundOffset,roomDarkness} from '../campaign-art.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function isolated(room=1,index=0,x=45){const g=new Game({story:false});g.start();g.abilities={attack:true,dash:true,sneak:true};g.tutorial.complete=true;g.enemies=[];g.fishes=[];g.soups=[];g.room=room;g.checkpoint=room;g.relays.filter(r=>r.room<room).forEach(r=>r.hp=0);const s=platforms.find(p=>p.room===room&&p.index===index);Object.assign(g.player,{x:room*WIDTH+x,y:s.y-48,inv:0,grounded:true});return g;}
function waitRespawn(g){for(let i=0;i<100&&g.mode==='respawning';i++)g.step(1/60);}
test('health and three lives are independent; normal damage consumes only hearts',()=>{
 const g=isolated();assert.equal(g.health,MAX_HEALTH);assert.equal(g.lives,START_LIVES);g.hurt();assert.equal(g.health,3);assert.equal(g.lives,3);assert.equal(g.mode,'playing');
});
test('losing all hearts consumes exactly one life and restores the checkpoint after a pause in combat',()=>{
 const g=isolated();g.completeChapter(1);g.relays[0].hp=0;g.player.powerTime=6;g.fish=7;g.health=1;const time=g.time;g.hurt();assert.equal(g.mode,'respawning');assert.equal(g.health,0);assert.equal(g.lives,2);tick(g,30,{right:true,attack:true});assert.equal(g.time,time);assert.equal(g.player.powerTime,6);waitRespawn(g);assert.equal(g.health,4);assert.equal(g.lives,2);assert.equal(g.room,1);assert.equal(g.evidence.length,1);assert.equal(g.relays[0].hp,0);assert.equal(g.fish,7);
});
test('the respawn transition freezes when Esc pauses the game',()=>{
 const g=isolated();g.health=1;g.hurt();tick(g,10);g.mode='paused';const before=JSON.stringify(g);tick(g,180);assert.equal(JSON.stringify(g),before);g.mode='respawning';waitRespawn(g);assert.equal(g.lives,2);assert.equal(g.health,4);
});
test('the third lost life ends the session; retry starts a new three-life game',()=>{
 const g=isolated();for(let remaining=2;remaining>=0;remaining--){g.health=1;g.player.inv=0;g.hurt();assert.equal(g.lives,remaining);if(remaining>0){assert.equal(g.mode,'respawning');waitRespawn(g);}else assert.equal(g.mode,'lost');}const before=JSON.stringify(g);tick(g,200,{attack:true,right:true});assert.equal(JSON.stringify(g),before);g.retry();assert.equal(g.health,4);assert.equal(g.lives,3);assert.equal(g.checkpoint,0);assert.equal(g.evidence.length,0);
});
test('fish and soup restore health but do not invent extra lives',()=>{
 const g=isolated();g.lives=2;g.health=1;g.fish=7;g.fishes=[{x:g.player.x+17,y:g.player.y+24,taken:false}];tick(g,1);assert.equal(g.health,2);assert.equal(g.lives,2);g.soups=[{x:g.player.x+17,y:g.player.y+24,taken:false}];tick(g,1);assert.equal(g.health,3);assert.equal(g.lives,2);
});
test('Clickbait waits for fish pickup, not mere approach, then bursts and grabs quickly',()=>{
 const g=isolated(2,1,295),e=enemy('clickbait',2,365,1,{active:true,noticed:true});g.enemies=[e];tick(g,45);assert.equal(e.state,'lure');assert.equal(e.revealed,false);g.player.x=WIDTH*2+365;assert.equal(touchesBait(g.player,e),true);tick(g,1);assert.equal(e.state,'emerge');assert.equal(g.fish,0);assert.equal(g.swallow,null);tick(g,11);assert.ok(g.swallow);assert.ok(g.swallow.total<.6);assert.equal(g.player.vx,0);assert.equal(e.revealed,true);
});
test('Clickbait emergence and capture advance through different jaw poses and freeze on pause',()=>{
 const g=isolated(2,1,365),e=enemy('clickbait',2,365,1,{active:true,noticed:true});g.enemies=[e];tick(g,1);const first=clickbaitAppearanceFrame(e);tick(g,4);assert.notEqual(clickbaitAppearanceFrame(e),first);g.mode='paused';const snapshot=JSON.stringify(g);tick(g,60);assert.equal(JSON.stringify(g),snapshot);g.mode='playing';tick(g,7);assert.ok(g.swallow);assert.equal(clickbaitAppearanceFrame(e),3);tick(g,12);assert.equal(clickbaitAppearanceFrame(e),4);
});
test('a lethal Clickbait grab consumes one life and cannot repeatedly damage a captured Uma',()=>{
 const g=isolated(2,1,365),e=enemy('clickbait',2,365,1,{active:true,noticed:true});g.enemies=[e];assert.equal(g.health,4);tick(g,45,{attack:false});assert.equal(g.mode,'respawning');assert.equal(g.lives,2);waitRespawn(g);assert.equal(g.health,4);assert.equal(g.lives,2);assert.equal(g.swallow,null);
});
test('a preemptive paw or dash can defeat the fish trap; it never grants a fish reward',()=>{
 for(const action of ['attack','dash']){const g=isolated(2,1,365),e=enemy('clickbait',2,365,1,{active:true,noticed:true});g.enemies=[e];tick(g,1,{[action]:true,right:true});tick(g,18,{right:true});assert.equal(g.swallow,null);assert.equal(g.health,4);assert.equal(g.fish,0);assert.equal(e.revealed,true);}
});
test('the opening is peaceful before the screen is infected, then darkens with one alarm and no combat',()=>{
 const g=new Game();g.start();assert.equal(rooms[0].theme,'cozy');assert.equal(g.player.y+g.player.h,305);tick(g,120);assert.equal(roomDarkness(g.wakeTime),0);tick(g,70);assert.equal(roomDarkness(g.wakeTime),1);assert.ok(g.enemies.every(e=>!e.active));assert.equal(g.events.filter(e=>e.type==='infection').length,1);tick(g,180);assert.equal(g.mode,'dialogue');assert.equal(g.wakeTime,WAKE_DURATION);
});
test('distant backgrounds move more slowly than the platforms and the calm room stays registered to its bed',()=>{
 const room=rooms[1],offsetA=backgroundOffset(room,room.x),offsetB=backgroundOffset(room,room.x+100);assert.ok(offsetB>offsetA);assert.ok(offsetB-offsetA<30);assert.equal(backgroundOffset(rooms[0],300),0);assert.equal(roomDarkness(0),0);assert.equal(roomDarkness(4),1);
});
