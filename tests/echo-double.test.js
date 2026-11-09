import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom} from '../room-transitions.js';
import {enemy,rooms,createEnemies} from '../level.js';
import {ECHO_DELAY,ECHO_GAP,ECHO_SCATTER,trailAt,echoPose} from '../echo-double.js';
import {echoFrame} from '../echo-double-art.js';
// Эхо in «Измерение»: Uma's dark double replays her path a couple of seconds late.
const tick=(g,n,i={})=>{for(let k=0;k<n;k++)g.step(1/60,i);};
function ready(){const g=new Game({story:false});g.start();g.tutorial.complete=true;g.abilities={attack:true,dash:true,sneak:true};activateRoom(g,7);g.enemies=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.notebooks=[];g.player.inv=0;g.echoImmunity=0;return g;}
const double=(g,x=60)=>{const e=enemy('echo',7,x,0,{active:true,noticed:true,spawnTime:0,noticeTime:0});g.enemies.push(e);return e;};

test('the room records Uma\'s path and the double replays it exactly, two seconds late',()=>{
 const g=ready(),e=double(g);const start=g.player.x;
 tick(g,Math.round(ECHO_DELAY*60)+30,{right:true});
 const then=trailAt(g,g.time-ECHO_DELAY);assert.ok(then);assert.ok(Math.abs(e.x+e.w/2-(then.x+17))<1.5,'centred on the old position');assert.ok(Math.abs(e.y+e.h-(then.y+then.h))<1.5,'feet on the old feet');
 assert.equal(e.state,'chase');assert.ok(e.x>start&&e.x<g.player.x-150,'well behind Uma');assert.equal(e.dir,1);assert.equal(e.pose,'run');
});

test('standing still lets the double catch up: one heart, then it scatters for a while',()=>{
 const g=ready(),e=double(g);tick(g,40,{right:true});const health=g.health;
 for(let i=0;i<60*4&&g.health===health;i++)tick(g,1);
 assert.equal(g.health,health-1);assert.equal(e.state,'scatter');assert.ok(g.events.some(v=>v.type==='echoScatter'));
 const hits=g.events.filter(v=>v.type==='hurt').length;tick(g,Math.round((ECHO_SCATTER-.3)*60));assert.equal(g.events.filter(v=>v.type==='hurt').length,hits,'no touch while scattered');
});

test('a dash passes through the double; paw hits scatter it and the third ends it',()=>{
 const g=ready(),e=double(g);tick(g,30,{right:true});e.state='chase';Object.assign(e,{x:g.player.x,y:g.player.y+g.player.h-e.h});
 g.player.dash=.2;g.step(1/60,{});assert.equal(g.health,4);
 for(let k=1;k<=3;k++){e.inv=0;e.hurtTime=0;e.state='chase';assert.equal(g.hitEnemy(e),true);if(k<3){assert.equal(e.state,'scatter');assert.ok(e.scatterTime>2);}}
 assert.equal(e.dead,true);
});

test('the double copies poses: sneaking, swatting and jumping',()=>{
 assert.equal(echoPose({sneaking:true,grounded:true,vx:0,attack:0}),'crouch');assert.equal(echoPose({grounded:true,attack:.1,vx:0}),'swat');
 assert.equal(echoPose({grounded:false,attack:0,vx:0}),'air');assert.equal(echoPose({grounded:true,attack:0,vx:120}),'run');
 const g=ready(),e=double(g);tick(g,10,{right:true});tick(g,1,{jump:true,right:true});tick(g,Math.round(ECHO_DELAY*60)+8,{right:true});assert.equal(e.pose,'air');assert.equal(echoFrame(e),3);
 assert.equal(echoFrame({state:'scatter'}),7);assert.equal(echoFrame({state:'forming'}),6);assert.equal(echoFrame({pose:'crouch'}),5);
});

test('several doubles queue on the same trail, each a little further behind',()=>{
 const g=ready(),a=double(g,60);tick(g,5,{right:true});const b=double(g,70);tick(g,Math.round((ECHO_DELAY+ECHO_GAP)*60)+20,{right:true});
 assert.ok(Math.abs(b.delay-a.delay-ECHO_GAP)<1e-9);assert.ok(b.x<a.x-60,'the second double trails the first');
});

test('a jump in the trail (burrow, respawn) makes the double re-form instead of sliding',()=>{
 const g=ready(),e=double(g);tick(g,Math.round(ECHO_DELAY*60)+20,{right:true});assert.equal(e.state,'chase');
 g.player.x+=600;tick(g,Math.round(ECHO_DELAY*60)+2);assert.equal(e.state,'forming');
});

test('the dimension doubles start dormant (no portal on the map) with three hits each',()=>{
 const own=createEnemies().filter(e=>e.type==='echo');assert.ok(own.length>=2);
 for(const e of own){assert.equal(e.room,7);assert.equal(e.active,false);assert.equal(e.source,undefined);assert.equal(e.maxHp,3);}
});
