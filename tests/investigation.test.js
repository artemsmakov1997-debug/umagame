import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {layouts,rooms} from '../level.js';
import {scenes,relayClues} from '../story.js';
import {endingSlides} from '../finale.js';
import {createBoss,stepBoss,stepProjectiles} from '../boss.js';
import {strikeInfoshum,exposeInfoshum,glassRect} from '../infoshum-combat.js';

test('monster origins remain a mystery until the full chain is shown in the epilogue',()=>{
 for(const id of ['intro','chapter1','chapter2','chapter3']){
  const words=scenes[id].pages.join(' ');
  assert.ok(!/создаёте меня каждый день|Всё начинается с нас|запустил цепную реакцию/i.test(words));
 }
 assert.equal(endingSlides.length,11);
 assert.match(endingSlides[1].text,/вспять/);
 assert.match(endingSlides[7].text,/разных людей/);
 assert.match(endingSlides.at(-1).text,/обнимает/);

});

test('each playable chapter has its own interactive devices and distinct boss arena',()=>{
 // The newsroom conveyor and the Dimension have no nodes (the Dimension hides «первоисточники» instead);
 // roofs and studio keep their interactive devices.
 const kinds={3:'broadcast',5:'edit'};
 assert.equal(new Game({story:false}).relays.filter(d=>d.room===1).length,0);
 {const d=new Game({story:false});d.start();assert.equal(d.relays.filter(r=>r.room===7).length,0);assert.equal(d.originals.length,3);}
 const g=new Game({story:false});g.start();
 for(const [room,type] of Object.entries(kinds)){
  const index=Number(room),devices=g.relays.filter(d=>d.room===index);
  assert.equal(devices.length,3);
  assert.ok(devices.every(d=>d.kind===type));
  assert.deepEqual(devices.map(d=>d.ordinal),[0,1,2]);
  assert.equal(relayClues[index].length,3);
 }
 assert.equal(new Set([2,4,6,8].map(room=>JSON.stringify(layouts[room]))).size,4);
 assert.ok(g.platforms.some(s=>s.room===8&&s.cuttable));
 assert.ok(g.platforms.filter(s=>s.room===4).every(s=>!s.motion));
});

test('destroying a signal node permanently adds a clue, with no premature answer',()=>{
 const g=new Game({story:false});g.start();g.tutorial.complete=true;
 g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];
 g.room=3;g.checkpoint=3;g.relays.filter(d=>d.room<3).forEach(d=>d.hp=0);
 const d=g.relays.find(d=>d.room===3),s=g.platforms.find(s=>s.room===3&&s.index===d.platformIndex);
 Object.assign(g.player,{x:d.x-10,y:s.y-48,h:48,dir:1,grounded:true,supportId:s.id,inv:0,cooldown:0,dash:0});
 g.step(1/60,{attack:true});
 assert.equal(d.hp,0);
 assert.equal(g.clues.length,1);
 assert.equal(g.clues[0].text,relayClues[3][d.ordinal]);
 assert.ok(g.events.some(e=>e.type==='clue'));
 g.loseLife();for(let i=0;i<75;i++)g.step(1/60);
 assert.equal(g.clues.length,1);
});

test('Infoshum enters the cable phase after three real screens are cracked',()=>{
 const g=new Game({story:false});g.start();g.tutorial.complete=true;g.mode='playing';
 g.room=8;g.checkpoint=8;g.boss=createBoss(8);g.boss.active=true;
 const n=g.boss.network;
 for(let k=0;k<3;k++){exposeInfoshum(g);const m=n.monitors.find(m=>m.face===0);g.player.attack=.18;g.player.swing++;assert.equal(strikeInfoshum(g,glassRect(m)),true);for(let i=0;i<70&&n.stage==='network';i++)stepBoss(g,1/60);}
 assert.equal(n.stage,'rupture');assert.ok(g.events.some(e=>e.type==='bossPhase'&&e.phase===2));
 for(let i=0;i<150;i++)stepBoss(g,1/60);
 assert.equal(n.stage,'free');assert.equal(g.boss.phase,2);assert.equal(n.monitors.reduce((s,m)=>s+m.cracks,0),3);
});

test('projectile deflections reward an active counterattack',()=>{
 const g=new Game({story:false});g.start();g.tutorial.complete=true;g.room=1;
 g.enemies=[];g.player.attack=.15;g.player.dashCooldown=1;
 g.bolts=[{room:1,kind:'paper',x:110,y:100,w:17,h:16,vx:0,vy:0,ttl:4}];
 stepProjectiles(g,1/60,{x:100,y:94,w:45,h:40});
 assert.equal(g.parries,1);
 assert.ok(g.player.dashCooldown<1);
 assert.ok(g.events.some(e=>e.type==='parry'));
});
