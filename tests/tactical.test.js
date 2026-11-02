import {rooms as campaignRooms} from '../level.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,WIDTH} from '../engine.js';
import {enemy,createEnemies,createNotebooks} from '../level.js';
import {stampInk,planCut,scanSource} from '../tactical-enemies.js';
import {solidSurfaces,inkAt} from '../terrain.js';
import {alertNearby} from '../enemies.js';
import {stepProjectiles} from '../boss.js';
import {restPose} from '../cat-animation.js';
import {chooseInformantLanding,teleportLandingClear} from '../informant-teleport.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input);};
const actor=(type,room,x,index,extra={})=>enemy(type,room,x,index,{active:true,noticed:true,...extra});
function setup(room=1,index=0,x=45){
 const g=new Game({story:false});g.start();g.abilities={attack:true,dash:true,sneak:true};g.tutorial.complete=true;g.room=g.checkpoint=room;g.enemies=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.notebooks=[];g.relays.forEach(d=>d.hp=0);
 const s=g.platforms.find(s=>s.room===room&&s.index===index);Object.assign(g.player,{x:campaignRooms[room].x+x,y:s.y-48,h:48,grounded:true,supportId:s.id,inv:0});return g;
}
test('new small enemies are introduced gradually, have their own notebooks and do not invade training',()=>{
 const roster=createEnemies();for(const [id,first]of [['censor',1],['copier',1],['cutter',5]]){assert.equal(Math.min(...roster.filter(e=>e.type===id).map(e=>e.room)),first);assert.ok(createNotebooks().some(n=>n.id===id));assert.ok(roster.filter(e=>e.type===id).every(e=>e.h===29&&e.w===48));}assert.ok(roster.every(e=>e.room>0));
});
test('Clickbait is immune to paws, stomps, soup damage and reflected projectiles from either side',()=>{
 const g=setup(2,1,295),e=actor('clickbait',2,365,1,{revealed:true,state:'patrol'});g.enemies=[e];g.player.powerTime=10;
 for(const sourceX of [e.x-60,e.x+100])for(const stomp of [false,true]){assert.equal(g.hitEnemy(e,stomp,99,{reflected:true,sourceX}),false);assert.equal(e.hp,e.maxHp);assert.equal(e.dead,false);}
 g.bolts=[{x:e.x,y:e.y,w:16,h:12,vx:0,vy:0,ttl:1,friendly:true,kind:'packet'}];stepProjectiles(g,.01,{x:0,y:0,w:0,h:0});assert.equal(e.hp,e.maxHp);assert.equal(g.kills,0);
});
test('Inflator armour rejects frontal paws and reflected packets but opens from behind in both directions',()=>{
 for(const dir of [-1,1]){const g=setup(),e=actor('inflator',1,125,0,{dir});g.enemies=[e];const center=e.x+e.w/2;assert.equal(g.hitEnemy(e,false,2,{sourceX:center+dir*80}),false);assert.equal(g.hitEnemy(e,true,2,{reflected:true,sourceX:center+dir*80}),false);assert.equal(e.hp,3);assert.equal(g.hitEnemy(e,false,1,{sourceX:center-dir*80}),true);assert.equal(e.hp,2);}
});
test('the strong forward blast carries Uma over a ledge while dash remains protected',()=>{
 const g=setup(3,9,165),e=actor('inflator',3,210,9,{state:'blast',timer:.23,dir:-1});g.enemies=[e];const x=g.player.x;tick(g,1);assert.equal(g.player.vx,-640);tick(g,16);assert.ok(g.player.x<x-120);assert.equal(g.health,4);
 const safe=setup(3,9,165);safe.enemies=[actor('inflator',3,210,9,{state:'blast',timer:.23,dir:-1})];tick(safe,1,{dash:true});assert.equal(safe.player.knock,0);assert.equal(safe.health,4);
});
test('Censor stamps a bounded patch on its actual platform, with warning and a finite lifetime',()=>{
 const g=setup(3,3,20),e=actor('censor',3,125,3,{timer:0,speed:0});g.enemies=[e];tick(g,1);assert.equal(e.state,'windup');assert.equal(g.inks.length,0);tick(g,32);assert.equal(g.inks.length,1);const ink=g.inks[0],s=g.platforms.find(s=>s.id===ink.platformId);assert.ok(ink.localX>=0&&ink.localX+ink.w<=s.w);g.enemies=[];tick(g,560);assert.equal(g.inks.length,0);
});
test('ink slows Fakenews patrols and lunges but does not slow Censor',()=>{
 const distance=(type,ink,state='patrol')=>{const g=setup(3,3,10),e=actor(type,3,140,3,{dir:1,timer:99,jumpCooldown:99,state});g.enemies=[e];if(ink)stampInk(g,actor('censor',3,140,3));const x=e.x;tick(g,12);return Math.abs(e.x-x);};
 assert.ok(distance('fakenews',true)<distance('fakenews',false)*.5);assert.ok(distance('fakenews',true,'lunge')<distance('fakenews',false,'lunge')*.5);assert.ok(Math.abs(distance('censor',true)-distance('censor',false))<.01);
});
test('Uma has real ink inertia after releasing movement and distinct slipping animation poses',()=>{
 const g=setup(3,3,105);stampInk(g,actor('censor',3,125,3));tick(g,20,{right:true});assert.ok(inkAt(g,g.player));assert.equal(g.player.slipping,true);const x=g.player.x,v=g.player.vx,first=restPose(g.player);tick(g,5);assert.ok(g.player.x>x+3);assert.ok(g.player.vx>0&&g.player.vx<v);assert.notEqual(restPose(g.player),first);tick(g,1,{dash:true});assert.equal(g.player.slipping,false);assert.equal(g.player.vx,430);
});
test('ink mutes Panicker and closes its existing portal before reinforcements appear',()=>{
 const g=setup(5,0,20),bell=actor('panicker',5,125,0,{state:'alarm',timer:99,speed:0});g.enemies=[bell];alertNearby(g,bell);stampInk(g,actor('censor',5,125,0));tick(g,70);assert.equal(bell.muffled,true);assert.equal(bell.state,'patrol');assert.equal(g.portals.length,0);assert.equal(g.enemies.length,1);assert.ok(g.events.some(e=>e.type==='alarmMuffled'));
});
test('ink and scan footprints stay attached to moving platforms and pause freezes them',()=>{
 const g=setup(5,0,20),c=actor('censor',5,365,1);stampInk(g,c);const ink=g.inks[0],s=g.platforms.find(s=>s.id===ink.platformId),x=s.x+ink.localX;tick(g,45);assert.notEqual(s.x+ink.localX,x);const state=JSON.stringify(g);g.mode='paused';const paused=JSON.stringify(g);tick(g,180);assert.equal(JSON.stringify(g),paused);assert.notEqual(state,paused);
});
function copierSetup(){const g=setup(4,0,45),c=actor('copier',4,420,1,{timer:0,speed:0,scanStart:18,scanW:145}),original=actor('fakenews',4,340,1,{speed:0,timer:999,jumpCooldown:999});g.enemies=[c,original];g.player.inv=999;return {g,c,original};}
test('Copier scans an original on its lit platform and prints a real one-health enemy with a warning',()=>{
 const {g,c,original}=copierSetup();assert.equal(scanSource(g,c),original);tick(g,1);assert.equal(c.state,'windup');tick(g,56);const copy=g.enemies.find(e=>e.copyOwnerId===c.id);assert.ok(copy);assert.equal(copy.type,'fakenews');assert.equal(copy.hp,1);assert.ok(copy.spawnTime>0);assert.ok(Math.abs(copy.x-g.player.x)>62);assert.equal(copy.copyOf,original.id);assert.ok(!g.enemies.some(other=>other!==copy&&!other.dead&&g.overlap(copy,other)));
});
test('moving the original off the scan patch prevents duplication and copies cannot copy themselves',()=>{
 const {g,c,original}=copierSetup();tick(g,1);original.x=campaignRooms[4].x+460;tick(g,60);assert.equal(g.enemies.filter(e=>e.copyOwnerId).length,0);assert.equal(c.state,'printing');original.x=campaignRooms[4].x+340;original.copyOwnerId=c.id;assert.equal(scanSource(g,c),null);
});
test('Copier remains vulnerable periodically even with an empty scanner or a full copy limit',()=>{
 const {g,c,original}=copierSetup();g.enemies=[c];assert.equal(g.hitEnemy(c),false);tick(g,58);assert.equal(c.state,'printing');assert.equal(g.hitEnemy(c),true);assert.equal(c.hp,2);assert.equal(g.enemies.some(e=>e.id===original.id),false);
});
test('copies are capped and destroying their Copier dissolves every owned duplicate immediately',()=>{
 const {g,c}=copierSetup();tick(g,1500);const copies=g.enemies.filter(e=>e.copyOwnerId===c.id&&!e.dead);assert.equal(copies.length,2);assert.ok(g.enemies.filter(e=>e.copyOwnerId&&!e.dead).length<=3);c.state='printing';c.inv=0;assert.equal(g.hitEnemy(c,false,99),true);assert.ok(copies.every(e=>e.dead));
});
test('Montager warns before removing only a middle span; permanent supports and antenna roofs survive',()=>{
 const g=setup(5,1,365),e=actor('cutter',5,655,2,{timer:99,speed:0});g.enemies=[e];assert.equal(planCut(g,e),true);const cut=g.cuts[0],s=g.platforms.find(s=>s.id===cut.platformId);assert.equal(s.index,1);assert.ok(cut.localX>=44&&s.w-cut.localX-cut.w>=44);tick(g,100);assert.equal(cut.phase,'warning');assert.equal(solidSurfaces(g).filter(p=>p.id===s.id).length,1);tick(g,10);assert.equal(cut.phase,'gap');const pieces=solidSurfaces(g).filter(p=>p.id===s.id);assert.equal(pieces.length,2);assert.equal(pieces.reduce((sum,p)=>sum+p.w,0),s.w-cut.w);assert.ok(!g.platforms.find(s=>s.id==='5:11').cuttable);
});
test('the same temporary cut drops Uma and a Fakenews through actual collision geometry',()=>{
 const g=setup(5,1,365),e=actor('cutter',5,655,2,{timer:99,speed:0}),fake=actor('fakenews',5,365,1,{timer:999,speed:0,jumpCooldown:999});g.enemies=[e,fake];g.player.inv=999;planCut(g,e);const s=g.platforms.find(s=>s.id===g.cuts[0].platformId);let catFell=false,fakeFell=false;for(let i=0;i<140;i++){tick(g,1);catFell||=g.player.y+g.player.h>s.y+15;fakeFell||=fake.y+fake.h>s.y+15;}assert.ok(catFell);assert.ok(fakeFell);assert.ok(g.events.some(e=>e.type==='enemyFall'));tick(g,170);assert.equal(g.cuts.length,0);assert.equal(solidSurfaces(g).filter(p=>p.id===s.id).length,1);
});
test('a paw interrupts the pending cut; moving cut markers follow the actual platform',()=>{
 const g=setup(5,1,365),e=actor('cutter',5,655,2,{timer:99,speed:0});g.enemies=[e];planCut(g,e);const cut=g.cuts[0],x=cut.x;tick(g,30);assert.notEqual(cut.x,x);assert.equal(g.hitEnemy(e),true);tick(g,1);assert.equal(g.cuts.length,0);
});
test('Informant refuses to teleport into a newly cut hole',()=>{
 const g=setup(5,1,365),e=actor('informant',5,150,0),m=actor('cutter',5,655,2,{timer:99});g.enemies=[e,m];planCut(g,m);const cut=g.cuts[0],s=g.platforms.find(s=>s.id===cut.platformId);cut.phase='gap';cut.time=3;const x=s.x+cut.localX+20;assert.equal(teleportLandingClear(g,e,{x,y:s.y-e.h,index:s.index}),false);const target=chooseInformantLanding(g,e);if(target)assert.ok(solidSurfaces(g).some(s=>s.index===target.index&&target.x>=s.x&&target.x+e.w<=s.x+s.w));
});
test('checkpoint recovery clears local ink, cuts and copies and preserves collected life stocks',()=>{
 const {g,c}=copierSetup();g.lives=2;stampInk(g,actor('censor',4,340,1));g.cuts=[{room:4,platformId:'4:1',phase:'gap',time:2,localX:60,w:80}];g.enemies.push(actor('fakenews',4,350,1,{copyOwnerId:c.id}));g.loseLife();tick(g,70);assert.equal(g.mode,'playing');assert.equal(g.inks.length,0);assert.equal(g.cuts.length,0);assert.ok(g.enemies.every(e=>!e.copyOwnerId));assert.equal(g.lives,1);
});
test('Uma curls up only after thirty seconds and breathes through two distinct curled poses',()=>{
 const g=setup();tick(g,1799);assert.ok(!g.player.sleeping);tick(g,8);assert.equal(g.player.sleeping,true);assert.equal(restPose(g.player),0);tick(g,50);const pose=restPose(g.player);assert.equal(pose,1);tick(g,84);assert.equal(restPose(g.player),2);assert.equal(g.health,4);
});
test('any control wakes Uma immediately without delaying movement, jump, paw or dash',()=>{
 for(const input of [{right:true},{jump:true},{attack:true},{dash:true},{down:true}]){const g=setup();tick(g,1850);assert.equal(g.player.sleeping,true);const x=g.player.x;tick(g,1,input);assert.equal(g.player.sleeping,false);assert.equal(g.player.idleTime,0);if(input.right)assert.ok(g.player.x>x);if(input.jump)assert.ok(g.player.vy<0);if(input.attack)assert.ok(g.player.attack>0);if(input.dash)assert.ok(g.player.dash>0);}
});
test('damage wakes the sleeping cat and pause does not count toward the thirty seconds',()=>{
 const g=setup();tick(g,1850);g.hurt();assert.equal(g.player.sleeping,false);assert.equal(g.health,3);const p=setup();tick(p,1200);p.mode='paused';tick(p,2400);assert.ok(!p.player.sleeping);p.mode='playing';tick(p,500);assert.ok(!p.player.sleeping);tick(p,120);assert.equal(p.player.sleeping,true);
});
