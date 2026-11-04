import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {enemy,createEnemies,rooms} from '../level.js';
import {activateRoom} from '../room-transitions.js';
import {handleFlyingContact} from '../campaign-enemies.js';
import {stepEchoPull} from '../echo-pull.js';
import {sourcePosition} from '../enemy-arrival-art.js';
import {castAttack,stepProjectiles} from '../boss.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function ready(room=7){const g=new Game({story:false});g.start();g.tutorial.complete=true;activateRoom(g,room);g.enemies=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.notebooks=[];g.boss.active=false;g.player.inv=0;g.echoImmunity=0;return g;}
function trap(g){const e=enemy('echo',g.room,185,0,{active:true,noticed:true});g.enemies=[e];return e;}
test('every ordinary encounter has a persistent, grounded source; Clickbait keeps its bait',()=>{
 const g=ready(),roster=createEnemies();
 for(const e of roster){if(e.type==='clickbait'){assert.equal(e.source,undefined);continue;}assert.ok(e.source,e.type);assert.equal(e.active,false);const pos=sourcePosition(g,e),s=g.platforms.find(p=>p.room===e.room&&p.index===e.source.platformIndex);assert.ok(pos.x>=s.x&&pos.x<=s.x+s.w);assert.equal(pos.y,s.y-(e.type==='echo'?81:0));}
 assert.equal(roster.find(e=>e.type==='fakenews').source.kind,'bin');assert.equal(roster.find(e=>e.type==='informant').source.kind,'receiver');assert.equal(roster.find(e=>e.type==='injection').source.kind,'printer');assert.equal(roster.find(e=>e.type==='static').source.kind,'screen');
});
test('a source rides its platform and stays behind after its monster moves away',()=>{
 const g=ready(5),e=enemy('injection',5,360,1),s=g.platforms.find(s=>s.id==='5:1'),before=sourcePosition(g,e);s.x+=48;s.y-=12;e.x+=130;e.platformIndex=2;assert.deepEqual(sourcePosition(g,e),{x:before.x+48,y:before.y-12});
});
test('emerging enemies stay still and cannot hurt or be attacked during their arrival',()=>{
 const g=ready(1),e=createEnemies()[0];g.enemies=[e];g.player.x=rooms[1].x+95;tick(g,1);assert.equal(e.active,true);assert.ok(e.spawnTime>0);const x=e.x,y=e.y;Object.assign(g.player,{x:e.x,y:e.y-19,inv:0});tick(g,20,{attack:true});assert.equal(g.health,4);assert.equal(e.hp,e.maxHp);assert.equal(e.x,x);assert.equal(e.y,y);assert.ok(e.spawnTime>0);
});
test('Echo warns and pulls Uma into itself without chasing; a real Shift dash cancels the pull',()=>{
 const g=ready(),e=trap(g),position={x:e.x,y:e.y},x=g.player.x;tick(g,30);assert.equal(e.state,'windup');assert.equal(g.echoPull,null);assert.equal(g.player.x,x);tick(g,17);assert.equal(e.state,'pulling');assert.equal(g.echoPull.ownerId,e.id);assert.ok(g.player.x>x);assert.deepEqual({x:e.x,y:e.y},position);tick(g,1,{dash:true});assert.equal(g.echoPull,null);assert.equal(g.player.echoPulled,false);assert.ok(g.player.echoGrace>1.5);assert.ok(g.player.dash>0);assert.equal(g.lives,3);assert.equal(e.state,'recover');tick(g,15);assert.equal(g.echoPull,null);assert.deepEqual({x:e.x,y:e.y},position);
});
test('a paw strike breaks suction, and entering another location clears it',()=>{
 const g=ready(),e=trap(g);e.state='pulling';e.timer=3;g.echoPull={ownerId:e.id};stepEchoPull(g,1/60);assert.equal(g.player.echoPulled,true);assert.equal(g.hitEnemy(e),true);assert.equal(g.echoPull,null);assert.equal(g.player.echoPulled,false);g.echoPull={ownerId:e.id};activateRoom(g,8);assert.equal(g.echoPull,null);assert.equal(g.player.echoGrace,0);
});
test('a trap outside a narrow phone viewport cannot begin an unseen pull',()=>{
 const g=ready(),e=trap(g);g.viewWidth=160;tick(g,30);assert.equal(e.state,'patrol');assert.equal(g.echoPull,null);g.player.x=rooms[7].x+150;g.updateCamera();tick(g,1);assert.equal(e.state,'windup');
});
test('the last stock is consumed exactly at transfer; pausing freezes it and the game ends once',()=>{
 const g=ready(),e=trap(g);g.lives=1;Object.assign(e,{x:g.player.x,y:g.player.y});handleFlyingContact(g,e);tick(g,10);assert.equal(g.lives,1);g.mode='paused';const time=g.echoWarp.time;tick(g,100);assert.equal(g.echoWarp.time,time);assert.equal(g.lives,1);g.mode='echoWarp';tick(g,30);assert.equal(g.lives,0);assert.equal(g.mode,'lost');assert.equal(g.events.filter(e=>e.type==='lost').length,1);assert.equal(g.echoWarp,null);
});
test('boss Echo fields warn, remain stationary, share the dash escape and expire cleanly',()=>{
 const g=ready(8);g.boss.ability='echoPulse';g.boss.aim={x:g.player.x+180,y:g.player.y};castAttack(g);const e=g.bolts[0],from={x:e.x,y:e.y};g.player.inv=100;for(let i=0;i<30;i++)stepProjectiles(g,1/60,{x:0,y:0,w:0,h:0});assert.deepEqual({x:e.x,y:e.y},from);e.state='pulling';e.timer=3;g.player.inv=0;g.echoPull={ownerId:e.id};g.player.dash=.2;stepEchoPull(g,1/60);assert.equal(g.echoPull,null);assert.ok(g.player.echoGrace>0);g.player.dash=0;g.player.echoGrace=0;e.state='pulling';g.echoPull={ownerId:e.id};e.ttl=.001;stepProjectiles(g,1/60,{x:0,y:0,w:0,h:0});stepEchoPull(g,1/60);assert.equal(g.echoPull,null);assert.equal(g.bolts.length,0);
});
