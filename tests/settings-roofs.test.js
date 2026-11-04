import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {rooms,enemy} from '../level.js';
import {handleFlyingContact} from '../campaign-enemies.js';
import {activateRoom} from '../room-transitions.js';
import {solidSurfaces} from '../terrain.js';
import {jumpTo,walkTo,antennaRoutes} from './navigation.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function ready(protectedMode=false){const g=new Game({story:false,testingInvulnerable:protectedMode});g.start();activateRoom(g,3);g.enemies=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.notebooks=[];return g;}
test('temporary protection covers ordinary damage, capture and a real fall, without removing platform hazards',()=>{
 const g=ready(true);g.health=2;g.hurt();assert.equal(g.health,2);g.loseLife('clickbait');assert.equal(g.lives,3);assert.equal(g.mode,'playing');
 Object.assign(g.player,{y:rooms[3].height+35,grounded:false});tick(g,1);assert.equal(g.lives,3);assert.equal(g.health,2);assert.equal(g.player.supportId,'3:0');assert.ok(g.events.some(e=>e.type==='testRescue'&&e.reason==='fall'));
 g.start();assert.equal(g.testingInvulnerable,true);g.testingInvulnerable=false;g.start();assert.equal(g.testingInvulnerable,false);
});
test('disabling protection restores full stock loss on falling, even during dash invulnerability',()=>{
 const g=ready(true);g.testingInvulnerable=false;Object.assign(g.player,{y:rooms[3].height+35,grounded:false,dash:.2,inv:99});g.health=3;tick(g,1);assert.equal(g.lives,2);assert.equal(g.mode,'respawning');tick(g,70);assert.equal(g.health,4);assert.equal(g.mode,'playing');assert.equal(g.room,3);
});
test('a fragile roof warns, actually drops its passenger, freezes in pause and then returns',()=>{
 const g=ready(true),s=g.platforms.find(s=>s.id==='3:3');Object.assign(g.player,{x:s.x+40,y:s.y-48,grounded:true,supportId:s.id});tick(g,25);assert.ok(s.collapseCharge>.35);assert.ok(solidSurfaces(g).some(p=>p.id===s.id));tick(g,20);assert.ok(s.collapseTime>2);assert.ok(!solidSurfaces(g).some(p=>p.id===s.id));tick(g,8);assert.ok(g.player.y+48>s.y+5);
 g.mode='paused';const time=s.collapseTime;tick(g,60);assert.equal(s.collapseTime,time);g.mode='playing';Object.assign(g.player,{x:rooms[3].x+40,y:252,grounded:true,supportId:'3:0'});tick(g,150);assert.equal(s.collapseTime,0);assert.ok(solidSurfaces(g).some(p=>p.id===s.id));
});
test('all mandatory roof antennas can be reached and broken with real jumps on the new moving route',()=>{
 const g=ready();let broken=0;for(const index of antennaRoutes[3]){assert.ok(jumpTo(g,3,index),'reachable roof '+index);const d=g.relays.find(d=>d.room===3&&d.platformIndex===index&&d.hp);if(!d)continue;const s=g.platforms.find(s=>s.room===3&&s.index===index);assert.ok(walkTo(g,Math.max(s.x+4,d.x-37)));g.player.dir=1;g.player.cooldown=0;g.step(1/60,{attack:true});assert.equal(d.hp,0);broken++;}assert.equal(broken,g.relays.filter(d=>d.room===3).length);
});

test('Echo still transfers the protected cat but never consumes the last stock or reports a false lost life',()=>{const g=ready(true),e=enemy('echo',3,40,0,{active:true,noticed:true});g.lives=1;g.player.inv=0;g.echoImmunity=0;Object.assign(e,{x:g.player.x,y:g.player.y});handleFlyingContact(g,e);assert.equal(g.mode,'echoWarp');tick(g,50);assert.equal(g.lives,1);assert.equal(g.mode,'playing');assert.ok(g.events.some(e=>e.type==='testRescue'&&e.reason==='echo'));assert.ok(!g.events.some(e=>e.type==='lifeLost'||e.type==='lost'));});
