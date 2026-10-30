import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,platforms,ladder,HEIGHT} from '../engine.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function standing(g,x=45,index=0){Object.assign(g.player,{x,y:platforms[index].y-g.player.h,vy:0,grounded:true});}
test('lands on illustrated desk, jumps and returns without drift',()=>{const g=new Game();g.start();tick(g,10);assert.equal(g.player.y+g.player.h,platforms[0].y);const x=g.player.x;g.step(1/60,{jump:true});assert.ok(g.player.vy<0);tick(g,65);assert.equal(g.player.y+g.player.h,platforms[0].y);assert.equal(g.player.x,x);});
test('pause freezes physics and timer',()=>{const g=new Game();g.start();g.mode='paused';const before=JSON.stringify(g);tick(g,60,{right:true});assert.equal(JSON.stringify(g),before);});
test('checkpoint only activates after landing on center desk; fall respawns there',()=>{const g=new Game();g.start();g.enemies=[];standing(g,340,4);tick(g,1);assert.equal(g.checkpoint,0);standing(g,340,1);tick(g,1);assert.equal(g.checkpoint,1);g.player.y=HEIGHT+50;tick(g,1);assert.equal(g.lives,2);assert.equal(g.player.x,330);assert.ok(g.player.inv>0);});
test('fish only collected once',()=>{const g=new Game();g.start();const f=g.fishes[0];Object.assign(g.player,{x:f.x-17,y:f.y-24});tick(g,1);assert.equal(g.fish,1);tick(g,1);assert.equal(g.fish,1);});
test('paw kills nearby crawler before contact',()=>{const g=new Game();g.start();const e=g.enemies[0];standing(g,e.x-48);tick(g,1,{attack:true});assert.ok(e.dead);assert.equal(g.kills,1);assert.equal(g.lives,3);});
test('stomping an enemy bounces Uma upward',()=>{const g=new Game();g.start();const e=g.enemies[0];Object.assign(g.player,{x:e.x,y:e.y-g.player.h-1,vy:150});tick(g,2);assert.ok(e.dead);assert.ok(g.player.vy<0);});
test('damage grants invulnerability; last life loses; restart resets state',()=>{const g=new Game();g.start();g.hurt();g.hurt();assert.equal(g.lives,2);g.player.inv=0;g.hurt();g.player.inv=0;g.hurt();assert.equal(g.mode,'lost');g.start();assert.equal(g.mode,'playing');assert.equal(g.lives,3);assert.equal(g.fish,0);assert.equal(g.boss.hp,5);});
test('boss needs five separate attacks and winning ends timer',()=>{const g=new Game();g.start();standing(g,g.boss.x-47,2);for(let i=0;i<5;i++){g.player.inv=10;tick(g,45,{attack:true});}assert.equal(g.boss.hp,0);assert.equal(g.mode,'won');const time=g.clock;tick(g,60);assert.equal(g.clock,time);});
test('timer expires into loss',()=>{const g=new Game();g.start();g.clock=.01;tick(g,1);assert.equal(g.mode,'lost');});
test('illustrated main route is traversable with running jumps and paw',()=>{const g=new Game();g.start();let jumped=false;for(let i=0;i<5000&&g.mode==='playing';i++){
 const p=g.player,s=platforms.find(s=>Math.abs(p.y+p.h-s.y)<1&&p.x+p.w>s.x&&p.x<s.x+s.w);
 let doJump=false;if(p.grounded&&s&&p.x>s.x+s.w-50&&s.x<302){doJump=!jumped;jumped=true;}else if(!p.grounded)jumped=false;
 g.step(1/60,{right:p.x<g.boss.x-47,jump:doJump,attack:true});
 }assert.equal(g.mode,'won');assert.ok(g.lives>0);});
test('right ladder connects floor to the monitor desk in both directions',()=>{const g=new Game();g.start();g.enemies=[];g.boss.hp=0;standing(g,ladder.x,6);tick(g,130,{up:true});assert.equal(g.player.y+g.player.h,ladder.y);tick(g,70,{down:true});assert.ok(g.player.y+g.player.h>ladder.y+80);tick(g,100,{up:true});assert.equal(g.player.y+g.player.h,ladder.y);});
test('jump buffer permits a jump requested just before landing',()=>{const g=new Game();g.start();g.player.y=253;g.player.vy=40;g.player.grounded=false;g.player.coyote=0;g.step(1/60,{jump:true});tick(g,4);assert.ok(g.player.vy<0);});
