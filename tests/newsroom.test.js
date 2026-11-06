import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,rooms} from '../engine.js';
import {enemy,createEnemies} from '../level.js';
import {activateRoom} from '../room-transitions.js';
import {PRESS,blockCalm,machineActive,newsroomNodes} from '../chapter-routes.js';
import {RESPAWN_DELAY,machinePhase} from '../newsroom-systems.js';
import {scanSource} from '../tactical-enemies.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
const R=rooms[1];
function ready(){
 const g=new Game({story:false,cinematic:true});g.start();g.tutorial.complete=true;activateRoom(g,1);g.mode='playing';
 g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.boss.active=false;
 for(const type of ['fakenews','copier','censor'])g.seenScenes.add('sighting:'+type);g.encounters={1:{types:{fakenews:{time:-99},copier:{time:-99},censor:{time:-99}}}};
 return g;
}
const stand=(g,index,x)=>{const s=g.platforms.find(s=>s.id==='1:'+index);Object.assign(g.player,{x:R.x+x,y:s.y-48,vx:0,vy:0,grounded:true,supportId:s.id,inv:999});};
const roster=id=>structuredClone(createEnemies().find(e=>e.id===id));
// Run until the shared machine rhythm reaches `phase` of a section.
function untilPhase(g,section,phase){for(let i=0;i<400&&Math.abs(machinePhase(g.time,section)-phase)>.02;i++)tick(g,1);}

test('a working node returns fallen monsters of its block; a broken node calms the block for good',()=>{
 const g=ready(),e=roster('fakenews-1-150-0');assert.ok(e,'block-one Fakenews in the roster');
 g.enemies=[e];stand(g,2,480);Object.assign(e,{active:true,dead:true,hp:0,deathTime:0});
 tick(g,Math.ceil(RESPAWN_DELAY*60)+30);const back=g.enemies.find(x=>x.id===e.id);
 assert.equal(back.dead,false,'returned from its source');assert.ok(g.events.some(x=>x.type==='enemyReturn'));
 const g2=ready(),e2=roster(e.id);g2.enemies=[e2];stand(g2,2,480);Object.assign(e2,{active:true,dead:true,hp:0,deathTime:0});
 newsroomNodes(g2)[0].hp=0;assert.equal(blockCalm(g2,1,0),true);tick(g2,Math.ceil(RESPAWN_DELAY*60)*2);
 assert.equal(g2.enemies.find(x=>x.id===e.id).dead,true,'calm block keeps it gone');
});

test('a monster never returns right next to Uma',()=>{
 const g=ready(),e=roster('fakenews-1-150-0');g.enemies=[e];stand(g,0,170);Object.assign(e,{active:true,dead:true,hp:0,deathTime:0});
 tick(g,Math.ceil(RESPAWN_DELAY*60)+60);assert.equal(g.enemies.find(x=>x.id===e.id).dead,true);
});

test('the press crushes monsters on the belt in rhythm; a broken controller or a calm block stops it',()=>{
 for(const stop of [null,'control','node']){
  const g=ready(),e=enemy('fakenews',1,PRESS.x+50,13,{active:true,spawnTime:0,timer:99,state:'recover'});g.enemies=[e];stand(g,8,780);
  if(stop==='control')g.mapProps.find(d=>d.room===1&&d.section===1).hp=0;if(stop==='node')newsroomNodes(g)[1].hp=0;
  untilPhase(g,1,1.1);assert.equal(e.dead,false);untilPhase(g,1,1.5);
  assert.equal(e.dead,stop===null,'press stop='+stop);assert.equal(machineActive(g,1,1),stop===null);
  if(!stop)assert.ok(g.events.some(x=>x.type==='pressCrush'));
 }
});

test('the catwalk above the press is safe for everyone',()=>{
 const g=ready(),e=enemy('fakenews',1,1040,9,{active:true,spawnTime:0,timer:99,state:'recover'});g.enemies=[e];stand(g,8,780);
 untilPhase(g,1,2.1);assert.equal(e.dead,false);
});

test('the belt carries monsters toward the press',()=>{
 const g=ready(),e=enemy('fakenews',1,900,13,{active:true,spawnTime:0,timer:99,state:'recover'});g.enemies=[e];stand(g,8,780);
 const x=e.x;tick(g,60);assert.ok(e.x>x+15,'carried right');
});

test('server floor discharges stun grounded monsters once per pulse',()=>{
 const g=ready(),e=enemy('censor',1,1536+300,24,{active:true,spawnTime:0,timer:0,state:'patrol'});g.enemies=[e];stand(g,17,1830);
 untilPhase(g,2,1.3);assert.equal(e.state,'recover');assert.ok(g.events.some(x=>x.type==='enemyShock'));assert.equal(e.dead,false);
});

test('after losing a life Uma returns to the deck of the furthest calmed node',()=>{
 const g=ready();g.testingInvulnerable=false;const nodes=newsroomNodes(g);nodes[0].hp=0;nodes[1].hp=0;stand(g,16,1650);g.player.inv=0;
 g.health=1;g.hurt(false,g.player.x+100);tick(g,90);assert.equal(g.mode,'playing');assert.equal(g.player.supportId,'1:12');
 const g2=ready();stand(g2,2,350);g2.health=1;g2.player.inv=0;g2.testingInvulnerable=false;g2.hurt(false,g2.player.x+100);tick(g2,90);assert.equal(g2.player.supportId,'1:0','no node broken: start of the location');
});

test('a checkpoint keeps calmed blocks calm but brings back the working ones',()=>{
 const g=ready();g.testingInvulnerable=false;g.enemies=createEnemies();for(const e of g.enemies)if(e.room===1){e.dead=true;e.hp=0;e.deathTime=0;}
 newsroomNodes(g)[0].hp=0;stand(g,12,1500);g.player.inv=0;g.health=1;g.hurt(false,g.player.x+100);tick(g,90);
 const local=g.enemies.filter(e=>e.room===1),first=local.filter(e=>e.x<R.x+768),later=local.filter(e=>e.x>=R.x+768);
 assert.ok(first.length&&first.every(e=>e.dead),'calm block stays clear');assert.ok(later.every(e=>!e.dead),'working blocks are restored');
});

test('the exit Copier prints a copy of a floor Censor',()=>{
 const g=ready(),c=roster(createEnemies().find(e=>e.room===1&&e.type==='copier'&&e.x>R.x+1536).id),censor=enemy('censor',1,2100,24,{active:true,spawnTime:0});
 Object.assign(c,{active:true,spawnTime:0});g.enemies=[c,censor];assert.equal(scanSource(g,c)?.id,censor.id);
});
