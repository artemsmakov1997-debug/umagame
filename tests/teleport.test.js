import {rooms as campaignRooms} from '../level.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WIDTH,platforms} from '../engine.js';
import {enemy} from '../level.js';
import {stepProjectiles} from '../boss.js';
import {chooseInformantLanding,beginInformantTeleport,TELEPORT_PHASES,TELEPORT_COOLDOWN} from '../informant-teleport.js';
import {monitorPoint,MENU_GLASS} from '../menu-monitor.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
function stand(g,index=2,x=604){const s=platforms.find(s=>s.room===7&&s.index===index);Object.assign(g.player,{x:campaignRooms[7].x+x,y:s.y-48,h:48,vx:0,vy:0,grounded:true,climbing:false,inv:0});}
function ready(){const g=new Game({story:false});g.start();g.abilities={attack:true,dash:true,sneak:true};g.tutorial.complete=true;g.room=7;g.checkpoint=7;g.relays.filter(r=>r.room<7).forEach(r=>r.hp=0);g.fishes=[];g.soups=[];g.platforms=g.platforms.filter(s=>s.room!==5||s.index<7);for(const s of g.platforms)if(s.room===7)s.motion=null;stand(g);const e=enemy('informant',7,365,1,{active:true,noticed:true,teleportCooldown:0});g.enemies=[e];return{g,e};}
function phase(g,e,name){for(let i=0;i<180&&e.teleport?.phase!==name;i++)g.step(1/60);assert.equal(e.teleport?.phase,name);}
function finish(g,e){for(let i=0;i<180&&e.teleport;i++)g.step(1/60);assert.equal(e.teleport,null);}
test('Informant selects Uma’s actual platform, keeps space and chooses a landing inside its edges',()=>{
 const{g,e}=ready(),target=chooseInformantLanding(g,e),s=platforms.find(s=>s.room===7&&s.index===2);assert.equal(target.index,2);assert.equal(target.y+e.h,s.y);assert.ok(target.x>=s.x+8);assert.ok(target.x+e.w<=s.x+s.w-8);assert.ok(Math.abs(target.x+24-(g.player.x+17))>=60);assert.equal(g.overlap(g.player,{...target,w:e.w,h:e.h}),false);
});
test('teleport animates charge, disappearance, transit and appearance before resuming ranged AI',()=>{
 const{g,e}=ready(),oldX=e.x;tick(g,1);assert.equal(e.teleport.phase,'charge');assert.equal(e.x,oldX);phase(g,e,'out');assert.equal(e.x,oldX);phase(g,e,'blink');assert.equal(e.phased,true);assert.equal(e.x,oldX);phase(g,e,'in');assert.notEqual(e.x,oldX);assert.equal(e.platformIndex,2);assert.equal(e.y+e.h,g.platforms.find(s=>s.room===e.room&&s.index===e.platformIndex).y);assert.equal(e.phased,true);assert.equal(g.bolts.length,0);finish(g,e);assert.equal(e.phased,false);assert.equal(e.state,'recover');assert.equal(e.teleportCooldown,TELEPORT_COOLDOWN);for(let i=0;i<150&&e.state!=='windup';i++)tick(g,1);assert.equal(e.state,'windup');for(let i=0;i<150&&g.events.filter(e=>e.type==='enemyShot').length<2;i++)tick(g,1);assert.equal(g.events.filter(e=>e.type==='enemyShot').length,2);
});
test('every teleport phase freezes in pause, including immunity and destination reservation',()=>{
 for(const name of Object.keys(TELEPORT_PHASES)){const{g,e}=ready();tick(g,1);phase(g,e,name);g.mode='paused';const snapshot=JSON.stringify(g);tick(g,100,{attack:true,right:true});assert.equal(JSON.stringify(g),snapshot);g.mode='playing';finish(g,e);assert.equal(e.platformIndex,2);}
});
test('a paw hit during antenna charge cancels teleport, damages once and leaves a recovery window',()=>{
 const{g,e}=ready();tick(g,1);const x=e.x;assert.equal(g.hitEnemy(e),true);assert.equal(e.hp,2);assert.equal(e.teleport,null);assert.equal(e.phased,false);assert.equal(e.teleportCooldown,2);assert.equal(e.state,'recover');tick(g,50);assert.equal(e.x,x);assert.equal(e.platformIndex,1);assert.equal(g.hitEnemy({...e,inv:.2}),false);
});
test('a vanished Informant cannot deal contact damage, take a paw hit or absorb a reflected packet',()=>{
 const{g,e}=ready();tick(g,1);phase(g,e,'blink');const hp=e.hp,health=g.health;assert.equal(g.hitEnemy(e),false);assert.equal(e.hp,hp);g.bolts=[{kind:'packet',sourceId:e.id,x:e.x,y:e.y,w:16,h:12,vx:0,vy:0,ttl:2,friendly:true}];stepProjectiles(g,1/60,{x:0,y:0,w:0,h:0});assert.equal(g.bolts.length,1);assert.equal(e.hp,hp);Object.assign(g.player,{x:e.x,y:e.y,h:29,grounded:true});tick(g,1);assert.equal(g.health,health);
});
test('walking into the marked destination makes teleport abort, rather than appearing inside Uma',()=>{
 const{g,e}=ready();tick(g,1);const from={x:e.x,y:e.y,index:e.platformIndex},target={...e.teleport.target};phase(g,e,'blink');Object.assign(g.player,{x:target.x,y:target.y+e.h-48,h:48,grounded:true});phase(g,e,'in');assert.equal(e.teleport.cancelled,true);assert.equal(e.x,from.x);assert.equal(e.y,from.y);assert.equal(e.platformIndex,from.index);finish(g,e);assert.ok(g.events.some(e=>e.type==='teleportAbort'));
});
test('teleport locks a warned target and cooldown prevents repeated blinking after Uma changes platforms',()=>{
 const{g,e}=ready();tick(g,1);const target={...e.teleport.target};stand(g,0,50);finish(g,e);assert.equal(e.x,target.x);assert.equal(e.platformIndex,target.index);tick(g,120);assert.equal(e.teleport,null);assert.ok(e.teleportCooldown>2);for(let i=0;i<400&&!e.teleport;i++)tick(g,1);assert.ok(e.teleport);assert.equal(e.teleport.target.index,0);
});
test('Informant keeps walking and shooting on the same platform, and waits for Uma to land before choosing',()=>{
 const{g,e}=ready();stand(g,1,330);assert.equal(chooseInformantLanding(g,e),null);tick(g,1);assert.equal(e.teleport,null);assert.equal(e.moving,true);stand(g);g.player.grounded=false;assert.equal(chooseInformantLanding(g,e),null);assert.equal(beginInformantTeleport(g,e),false);g.player.grounded=true;assert.equal(beginInformantTeleport(g,e),true);
});
test('two Informants reserve different landing slots; neither can materialize on the other',()=>{
 const{g,e}=ready();assert.equal(beginInformantTeleport(g,e),true);const other=enemy('informant',7,130,0,{active:true,noticed:true,teleportCooldown:0});g.enemies.push(other);const target=chooseInformantLanding(g,other);if(target){assert.equal(g.overlap({...target,w:other.w+20,h:other.h},{...e.teleport.target,w:e.w,h:e.h}),false);}
});
test('a lost life clears local teleport state; inactive or out-of-room enemies never start teleporting',()=>{
 const{g,e}=ready();e.active=false;e.trigger=700;tick(g,20);assert.equal(e.teleport,null);e.room=6;e.active=true;tick(g,20);assert.equal(e.teleport,null);e.room=7;tick(g,1);assert.ok(e.teleport);g.health=1;g.player.inv=0;g.hurt();tick(g,75);assert.equal(g.room,7);assert.ok(g.enemies.filter(e=>e.room===7).every(e=>!e.teleport&&!e.phased));
});
test('menu eyes are registered inside the glass; corner mapping preserves the painted monitor geometry',()=>{
 for(const[u,v,i]of[[0,0,0],[1,0,1],[1,1,2],[0,1,3]])assert.deepEqual(monitorPoint(u,v),MENU_GLASS[i]);for(const u of[.2,.42,.58,.8])for(const v of[.39,.58]){const[x,y]=monitorPoint(u,v);assert.ok(x>MENU_GLASS[0][0]&&x<MENU_GLASS[1][0]);assert.ok(y>527&&y<674);}
});
