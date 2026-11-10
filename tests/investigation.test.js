import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {layouts,rooms} from '../level.js';
import {scenes,relayClues} from '../story.js';
import {endingSlides} from '../finale.js';
import {createBoss,stepBoss,stepProjectiles} from '../boss.js';
import {strikeInfoshum,exposeInfoshum,crackInfoshumScreen} from '../infoshum-combat.js';

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

test('no chapter keeps transmitters; the Dimension still hides its «первоисточники»',()=>{
 const g=new Game({story:false});g.start();assert.equal(g.relays.length,0);assert.equal(g.originals.length,3);
});
test('reading a notebook adds the room\'s next clue, with no premature answer',()=>{
 const g=new Game({story:false});g.start();g.tutorial.complete=true;g.enemies=[];g.fishes=[];g.soups=[];
 const n=g.notebooks.find(n=>n.room===3);g.room=3;g.checkpoint=3;n.readyAt=0;const s=g.platforms.find(s=>s.room===3&&s.index===n.index);
 Object.assign(g.player,{x:n.x-17,y:n.y-24,grounded:true,supportId:s.id});g.checkNotebooks();
 assert.equal(g.clues.length,1);assert.equal(g.clues[0].room,3);assert.ok(!/создаёте меня|Всё начинается с нас/i.test(g.clues[0].text));
});
test('Infoshum gathers the colossus around the tower after six relays and three cracks in the big screen',()=>{
 const g=new Game({story:false});g.start();g.tutorial.complete=true;g.mode='playing';
 g.room=8;g.checkpoint=8;g.boss=createBoss(8);g.boss.active=true;
 const n=g.boss.network;assert.equal(n.relays.length,4);let k=0;
 while(n.stage==='network'&&k++<40){assert.equal(crackInfoshumScreen(g),true,'paw '+k);for(let i=0;i<25&&n.stage==='network';i++)stepBoss(g,1/60);}
 assert.equal(k,9,'two relays and a crack, three times');assert.equal(n.stage,'assemble');assert.equal(g.boss.hp,12);assert.ok(g.events.some(e=>e.type==='bossPhase'&&e.phase===2));
 for(let i=0;i<240;i++)stepBoss(g,1/60);
 assert.equal(n.stage,'colossus');assert.equal(g.boss.phase,2);
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
