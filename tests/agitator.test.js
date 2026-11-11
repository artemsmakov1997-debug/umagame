import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {activateRoom} from '../room-transitions.js';import {rooms,ladders} from '../level.js';
import {stepBoss,damageBoss} from '../boss.js';
import {SLOGAN_TIMES,RALLY_TIMES,AIR_TIMES,AGITATOR_HP,BEAT,exposeAgitator,sheltered,towerStand,towerDeckId,agitatorTargets} from '../agitator-combat.js';
import {AGI,MAST_X,FLOOR_Y,TOWERS,CHIMNEYS,SLOGAN} from '../agitator-map.js';
import {jumpTo,walkTo,supportOf} from './navigation.js';
const X0=rooms[4].x;
function ready(testing=true){const g=new Game({story:false,cinematic:true,testingInvulnerable:testing});g.start();activateRoom(g,4);g.enemies=[];g.notebooks=[];g.fishes=[];g.lifePickups=[];g.soups=[];g.boss.noticeTime=0;g.player.inv=0;return g;}
function tick(g,n,input={}){for(let i=0;i<n;i++)g.step(1/60,input);}
function until(g,cond,max=1200,input={}){for(let i=0;i<max&&!cond();i++)g.step(1/60,typeof input==='function'?input():input);return cond();}
function place(g,x,surface='4:0'){const s=g.platforms.find(s=>s.id===surface);Object.assign(g.player,{x,y:s.y-48,h:48,vx:0,vy:0,grounded:true,supportId:s.id,knock:0,attack:0,cooldown:0,climbing:false,inv:0});g.updateCamera();}
function swingAt(g,targetX){const p=g.player;p.dir=targetX<p.x+17?-1:1;p.cooldown=0;p.attack=0;g.step(1/60,{attack:true});tick(g,14);}
// Phase 1: wait at the foot of the left staircase, climb the letters while they land, strike the overheated robot.
function climbAndStrike(g){
 const n=g.boss.broadcast;place(g,X0+392);
 assert.ok(until(g,()=>n.mode==='volley'),'a slogan starts');assert.equal(n.side,'left');
 for(const index of[AGI.slots.left+3,AGI.slots.left+6,AGI.slots.left+8]){assert.ok(until(g,()=>!g.platforms.find(s=>s.id==='4:'+index).bossHidden,300),'letter block '+index+' lands');assert.ok(jumpTo(g,4,index,400),'climb onto block '+index);}
 assert.ok(until(g,()=>n.mode==='overheat',300));assert.ok(jumpTo(g,4,AGI.mast,300),'jump from the letters onto the mast deck');
 const hp=g.boss.hp;until(g,()=>Math.abs(g.player.x+17-(g.boss.x+g.boss.w/2))<70,120,()=>({right:true}));swingAt(g,g.boss.x+g.boss.w/2);return hp-g.boss.hp;
}
test('the arena keeps no consoles or antennas; the mast deck, towers with real ladders and chimneys are its pieces',()=>{
 const g=ready();assert.equal(g.relays.filter(d=>d.room===4).length,0);assert.ok(!('antennas' in g.boss.broadcast));
 const visible=g.platforms.filter(s=>s.room===4&&!s.bossHidden).map(s=>s.index);assert.deepEqual(visible,[0,1,2,3,4,5,6,7],'letter slots wait hidden');
 assert.equal(ladders.filter(l=>l.room===4).length,2);assert.equal(g.boss.hp,AGITATOR_HP);
});
test('«Лозунг»: the letters of the slogan fly as real projectiles, land bottom-up as climbable blocks and crumble after the window',()=>{
 const g=ready(),n=g.boss.broadcast;place(g,X0+392);assert.ok(until(g,()=>n.mode==='windup'));assert.equal(n.side,'left','the staircase is built on Uma’s side');
 assert.ok(until(g,()=>n.letters.length>0,200));assert.ok(n.letters.every(l=>l.state==='fly'));
 assert.ok(until(g,()=>n.mode==='overheat',400));assert.equal(n.letters.filter(l=>l.state==='block').length,SLOGAN.length);assert.equal(n.letters.map(l=>l.ch).join(''),SLOGAN);
 const slots=g.platforms.filter(s=>s.room===4&&s.index>=AGI.slots.left&&s.index<AGI.slots.right);assert.ok(slots.every(s=>!s.bossHidden));
 assert.ok(until(g,()=>n.mode==='cool',60*SLOGAN_TIMES.overheat+5));tick(g,40);assert.ok(slots.every(s=>s.bossHidden),'the stairs crumble when the window closes');
});
test('climbing the letters with ordinary jumps reaches the mast in time; only the overheated robot takes damage',()=>{
 const g=ready(),b=g.boss,n=b.broadcast;place(g,X0+MAST_X-160,'4:'+AGI.mast);b.cooldown=0;n.mode='rest';n.timer=9;n.blast=0;swingAt(g,b.x+b.w/2);assert.equal(b.hp,AGITATOR_HP,'a cool megaphone blocks the paw');
 const g2=ready();assert.equal(climbAndStrike(g2),2);assert.ok(['burst','stun'].includes(g2.boss.broadcast.mode));
});
test('standing next to the cool megaphone gets Uma blown off the mast deck after a warning',()=>{
 const g=ready(),b=g.boss,n=b.broadcast;n.mode='rest';n.timer=9;place(g,b.x-60,'4:'+AGI.mast);const warned=[];
 for(let i=0;i<60&&g.player.knock<=0;i++){g.step(1/60,{});for(const e of g.events)if(e.type==='bossWarning'&&e.ability==='blast')warned.push(g.time);g.events=[];}
 assert.ok(warned.length===1,'warned once');assert.ok(g.player.knock>0,'pushed');assert.ok(g.player.vx<0,'away from the robot');
});
test('a letter batted back with the paw flies into the robot and stuns him',()=>{
 const g=ready(),b=g.boss,n=b.broadcast;place(g,X0+392);assert.ok(until(g,()=>n.letters.some(l=>l.state==='fly'),300));
 const l=n.letters.find(l=>l.state==='fly');Object.assign(g.player,{x:l.x-50,y:l.y-24,dir:1,attack:0,cooldown:0});g.player.grounded=false;g.step(1/60,{attack:true});
 assert.equal(l.state,'back');assert.ok(until(g,()=>l.state!=='back',120));assert.equal(b.hp,AGITATOR_HP-2);assert.equal(n.mode,'stun');
});
test('a flying letter hurts on contact; Shift passes through it',()=>{
 for(const dash of[0,.25]){const g=ready(false),n=g.boss.broadcast;n.mode='volley';n.timer=0;n.fired=0;n.side='left';g.step(1/60,{});const l=n.letters[0];Object.assign(g.player,{x:l.x-17,y:l.y-24,inv:0,dash});g.player.grounded=false;const h=g.health;stepBoss(g,1/60);assert.equal(g.health,dash?h:h-1);}
});
test('two openings end «Лозунг»: the mast bends, the deck disappears and he lands on the roof for «Митинг»',()=>{
 const g=ready(),b=g.boss,n=b.broadcast;for(let i=0;i<2;i++){exposeAgitator(g);b.cooldown=0;assert.ok(damageBoss(g,2,false,b.x-20));if(i<1)tick(g,90);}
 assert.equal(b.hp,8);assert.equal(b.phase,2);assert.equal(n.stage,'leap');assert.ok(until(g,()=>n.stage==='rally',240));
 assert.equal(n.mast,'bent');assert.ok(g.platforms.find(s=>s.id==='4:'+AGI.mast).bossHidden);assert.equal(b.y+b.h,FLOOR_Y);
});
function rally(g){const b=g.boss,n=b.broadcast;b.hp=8;b.phase=2;n.stage='rally';n.mode='walk';n.mast='bent';n.letters=[];b.y=FLOOR_Y-b.h;b.x=X0+900;n.spawnTimer=99;n.uraTimer=99;n.stompTimer=99;return n;}
test('«Митинг»: placards climb from a hatch and march to the beat; a stomp or a paw breaks them, contact hurts',()=>{
 const g=ready(false),n=rally(g);place(g,X0+250);n.spawnTimer=0;g.step(1/60,{});assert.equal(n.placards.length,1);const c=n.placards[0];assert.equal(c.state,'rise');assert.equal(c.dir,-1,'they march towards Uma');
 const x=c.x;tick(g,Math.round(60*(0.5+BEAT*4)));assert.equal(c.state,'march');assert.ok(c.x<x-50,'four beats of hops');
 // Stomp from above.
 Object.assign(g.player,{x:c.x+3,y:c.y-60,vy:300,grounded:false,supportId:null,inv:0});for(let i=0;i<20&&c.state==='march';i++)g.step(1/60,{});assert.equal(c.state,'knocked');assert.ok(g.player.vy<0,'bounce');
 // Contact.
 n.placards=[];n.spawnTimer=0;g.step(1/60,{});const d=n.placards[0];d.state='march';place(g,d.x-10);g.player.inv=0;const h=g.health;g.step(1/60,{});assert.equal(g.health,h-1);
});
test('on «УРА!» he turns to the crowd: a paw on his back hurts him, a paw on his front is blocked',()=>{
 const g=ready(),b=g.boss,n=rally(g);place(g,b.x-120);n.uraTimer=0;assert.ok(until(g,()=>n.mode==='ura',90));assert.equal(b.dir,1,'facing away from Uma');assert.equal(agitatorTargets(g)[0].id,'agitator-back');
 place(g,b.x-30);swingAt(g,b.x+b.w/2);assert.equal(b.hp,6);assert.equal(n.mode,'stun');
 const f=ready(),fb=f.boss,fn=rally(f);place(f,fb.x-120);fn.uraTimer=0;assert.ok(until(f,()=>fn.mode==='ura',90));place(f,fb.x+fb.w+10);swingAt(f,fb.x+fb.w/2);assert.equal(fb.hp,8,'his chest is not an opening');
});
test('close in front he swings the megaphone after a warning; far away he stomps shock waves along the roof',()=>{
 const g=ready(false),b=g.boss,n=rally(g);place(g,b.x-80);g.player.inv=0;const h=g.health;assert.ok(until(g,()=>n.mode==='swingWarn',30));assert.equal(g.health,h,'warned first');until(g,()=>n.mode==='walk',60);assert.equal(g.health,h-1);
 const s=ready(),sn=rally(s);place(s,s.boss.x-500);sn.stompTimer=0;assert.ok(until(s,()=>s.bolts.filter(v=>v.kind==='wave').length===2,90));
});
function air(g,tower=1){const b=g.boss,n=b.broadcast;b.hp=4;b.phase=3;n.stage='air';n.mode='idle';n.tower=tower;n.mast='bent';n.placards=[];n.letters=[];n.wind={phase:'calm',timer:99};Object.assign(b,towerStand(tower));return n;}
test('«Прямой эфир»: gusts blow an exposed Uma away from the tower; chimneys, the tower itself and Shift shelter her',()=>{
 const g=ready(),n=air(g,1);place(g,X0+600);n.wind={phase:'gust',timer:1};const x=g.player.x;tick(g,30);assert.ok(g.player.x<x-40,'pushed towards the far side');
 const c=CHIMNEYS[2];place(g,X0+c.x-40);assert.ok(sheltered(g));n.wind={phase:'gust',timer:1};const sx=g.player.x;tick(g,30);assert.ok(Math.abs(g.player.x-sx)<2,'behind a chimney');
 place(g,X0+c.x+c.w/2-17,'4:'+AGI.chimneys[2]);assert.equal(sheltered(g),false,'standing on top is exposed');
 place(g,X0+TOWERS[1].ladder-17);assert.ok(sheltered(g),'at the foot of his tower');
});
test('every gust carries three Сенсации at different heights; chimneys burst them',()=>{
 const g=ready(false),n=air(g,1);place(g,X0+300);n.wind={phase:'warn',timer:0};g.step(1/60,{});assert.equal(n.birds.length,3);assert.equal(new Set(n.birds.map(s=>s.y)).size,3);assert.ok(n.birds.every(s=>s.dir===-1));
 tick(g,240);assert.ok(n.birds.every(s=>s.state==='burst')||n.birds.length===0,'the tall chimney on the right stops the low one');
});
test('phase 2: when Uma is far away or up high a sound wave from the megaphone flies to her',()=>{
 const g=ready(false),b=g.boss,n=rally(g);n.shoutTimer=0;place(g,X0+300);const h=g.health;
 assert.ok(until(g,()=>n.mode==='shoutWarn',60));assert.ok(until(g,()=>n.shouts.length>0,60));const w=n.shouts[0];assert.ok(w.vx<0);
 assert.ok(until(g,()=>g.health<h,240),'the wave reaches her');
});
test('phase 2: every second ranged attack is a placard thrown in an arc; it hurts, breaks on the floor and a paw smashes it',()=>{
 const g=ready(false),b=g.boss,n=rally(g);place(g,X0+300);n.shots=1;n.shoutTimer=0;
 assert.ok(until(g,()=>n.shouts.some(w=>w.kind==='placard'),120));const w=n.shouts.find(w=>w.kind==='placard');assert.ok(w.vy<0,'thrown upwards first');
 const h=g.health;assert.ok(until(g,()=>g.health<h||w.state==='burst',200));assert.equal(w.state,'burst');
 // Uma steps aside: it smashes on the floor instead.
 const f=ready(false),m=rally(f);place(f,X0+300);m.shots=1;m.shoutTimer=0;assert.ok(until(f,()=>m.shouts.some(w=>w.kind==='placard'),120));const q=m.shouts.find(w=>w.kind==='placard');place(f,X0+40);
 const hp=f.health;assert.ok(until(f,()=>q.state==='burst',200));assert.equal(f.health,hp);assert.ok(f.events.some(e=>e.type==='boltImpact'&&e.kind==='placard'));
 // A paw in its way smashes it.
 const k=ready(false),r=rally(k);place(k,X0+300);r.shots=1;r.shoutTimer=0;assert.ok(until(k,()=>r.shouts.some(w=>w.kind==='placard'),120));const z=r.shouts.find(w=>w.kind==='placard');
 Object.assign(z,{x:k.player.x+50,y:k.player.y+20,vx:-60,vy:0});k.player.dir=1;k.player.cooldown=0;k.step(1/60,{attack:true});tick(k,3);assert.equal(z.state,'burst');assert.equal(k.health,4);
});
test('the tower ladder is climbed with ↑; on the deck a paw on the screen sends him leaping to the other tower',()=>{
 const g=ready(),b=g.boss,n=air(g,1),t=TOWERS[1];place(g,X0+t.ladder-17);assert.ok(until(g,()=>g.player.grounded&&g.player.supportId===towerDeckId(1),300,{up:true}),'climb the ladder');
 swingAt(g,b.x+b.w/2);assert.equal(b.hp,2);assert.equal(n.mode,'stun');assert.ok(until(g,()=>n.mode==='idle'&&n.tower===0,200));assert.deepEqual({x:b.x,y:b.y},towerStand(0));
});
test('lingering on his deck draws a warned megaphone swing',()=>{
 const g=ready(false),b=g.boss,n=air(g,1),t=TOWERS[1];place(g,X0+t.ladder-17,towerDeckId(1));g.player.inv=0;const h=g.health;assert.ok(until(g,()=>n.mode==='swingWarn',60));assert.equal(g.health,h);until(g,()=>n.mode==='idle',60);assert.equal(g.health,h-1);
});
test('nine real hits finish the fight and lead into the chapter story',()=>{
 const g=ready(),b=g.boss,n=b.broadcast;let guard=0;
 while(b.hp>0&&guard++<40){until(g,()=>['slogan','rally','air'].includes(n.stage)&&n.mode!=='jump',400);exposeAgitator(g);b.cooldown=0;damageBoss(g,2,false,n.stage==='rally'?b.x+b.w/2-b.dir*60:b.x);tick(g,5);}
 assert.equal(g.mode,'bossDefeat');assert.ok(g.events.some(e=>e.type==='bossPhase'&&e.phase===3));g.storyEnabled=true;g.skipBossDefeat();assert.equal(g.mode,'interlude');assert.equal(g.interlude.boss,'agitator');
});
test('pause freezes every phase; retry restores phase one with a standing mast',()=>{
 for(const stage of['slogan','rally','air']){const g=ready(),n=g.boss.broadcast;if(stage==='rally')rally(g);if(stage==='air')air(g);g.mode='paused';const before=JSON.stringify(g.boss);tick(g,90,{attack:true});assert.equal(JSON.stringify(g.boss),before);g.mode='playing';
  g.retryLocation();assert.equal(g.boss.broadcast.stage,'slogan');assert.equal(g.boss.broadcast.mast,'standing');assert.equal(g.boss.hp,AGITATOR_HP);assert.ok(!g.platforms.find(s=>s.id==='4:'+AGI.mast).bossHidden);}
});
test('revisiting the cleared arena shows the bent mast and no robot',()=>{const g=ready();g.bossesDefeated.add('agitator');activateRoom(g,4);assert.equal(g.boss.active,false);assert.equal(g.boss.broadcast.mast,'bent');assert.ok(g.platforms.find(s=>s.id==='4:'+AGI.mast).bossHidden);});
