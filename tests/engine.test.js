import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,platforms} from '../engine.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function standing(g,x=60,index=0){Object.assign(g.player,{x,y:platforms[index].y-25,vy:0,grounded:true});}
test('lands on desk, jumps, lands again and cannot drift without input',()=>{const g=new Game();g.start();tick(g,30);assert.equal(g.player.y,190);const x=g.player.x;g.step(1/60,{jump:true});assert.ok(g.player.vy<0);tick(g,55);assert.equal(g.player.y,190);assert.equal(g.player.x,x);});
test('pause freezes physics and timer',()=>{const g=new Game();g.start();g.mode='paused';const before=JSON.stringify(g);tick(g,60,{right:true});assert.equal(JSON.stringify(g),before);});
test('fall costs one life and respawns at saved checkpoint',()=>{const g=new Game();g.start();standing(g,1150,5);tick(g,1);assert.equal(g.checkpoint,1);g.player.y=320;tick(g,1);assert.equal(g.lives,2);assert.equal(g.player.x,1150);assert.ok(g.player.inv>0);});
test('fish only collected once',()=>{const g=new Game();g.start();const f=g.fishes[0];Object.assign(g.player,{x:f.x-8,y:f.y-13});tick(g,1);assert.equal(g.fish,1);tick(g,1);assert.equal(g.fish,1);});
test('paw kills a nearby enemy and protects player',()=>{const g=new Game();g.start();const e=g.enemies[0];standing(g,e.x-23,1);tick(g,1,{attack:true});assert.ok(e.dead);assert.equal(g.kills,1);assert.equal(g.lives,3);});
test('stomping an enemy bounces Uma upward',()=>{const g=new Game();g.start();const e=g.enemies[0];Object.assign(g.player,{x:e.x,y:e.y-26,vy:150});tick(g,2);assert.ok(e.dead);assert.ok(g.player.vy<0);});
test('damage has invulnerability; last life loses; restart resets all state',()=>{const g=new Game();g.start();g.hurt();g.hurt();assert.equal(g.lives,2);g.player.inv=0;g.hurt();g.player.inv=0;g.hurt();assert.equal(g.mode,'lost');g.start();assert.equal(g.mode,'playing');assert.equal(g.lives,3);assert.equal(g.fish,0);assert.equal(g.boss.hp,5);});
test('boss requires five separate attacks, winning ends the timer',()=>{const g=new Game();g.start();standing(g,g.boss.x-23,10);for(let i=0;i<5;i++){g.player.inv=10;tick(g,45,{attack:true});}assert.equal(g.boss.hp,0);assert.equal(g.mode,'won');const time=g.clock;tick(g,60);assert.equal(g.clock,time);});
test('timer expires into loss',()=>{const g=new Game();g.start();g.clock=.01;tick(g,1);assert.equal(g.mode,'lost');});
test('complete main route is traversable with running jumps and paw',()=>{const g=new Game();g.start();let jumped=false;for(let i=0;i<10000&&g.mode==='playing';i++){
 const p=g.player,s=platforms.find(s=>Math.abs(p.y+p.h-s.y)<1&&p.x+p.w>s.x&&p.x<s.x+s.w);
 let doJump=false;if(p.grounded&&s&&p.x>s.x+s.w-22&&s.x<2210){doJump=!jumped;jumped=true;}else if(!p.grounded)jumped=false;
 g.step(1/60,{right:p.x<g.boss.x-23,jump:doJump,attack:true});
 }assert.equal(g.mode,'won');assert.ok(g.lives>0);});
