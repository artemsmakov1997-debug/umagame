import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js';
import {activateRoom,beginLocationTransition} from '../room-transitions.js';
import {stepBoss,damageBoss,bossShielded} from '../boss.js';
import {stepStudioPlatforms,studioDock,exposeManipulator,castBeam,beamLive,TRACK_Y,craneTip,dollyBox,manipulatorExposed,STRIPS,DECOYS,FRAME,FRAME_LOCK,SCISSORS_AIM,CUT_GAP,MANIPULATOR_HP} from '../manipulator-combat.js';
import {solidSurfaces} from '../terrain.js';
import {jumpTo} from './navigation.js';
import {rooms} from '../level.js';
import {routeInfo} from '../route-transition-art.js';
function ready(){const g=new Game({story:false,cinematic:true,testingInvulnerable:true});g.start();activateRoom(g,6);g.enemies=[];g.notebooks=[];g.fishes=[];g.soups=[];g.lifePickups=[];g.boss.noticeTime=0;return g;}
function ticks(g,n){for(let i=0;i<n;i++)g.step(1/60,{});}
test('all three permanent camera docks are reachable through ordinary jumps',()=>{
 const g=ready();g.boss.active=false;
 for(const index of[6,7,1,9,10,2,10,9,1,7,6,17,3])assert.ok(jumpTo(g,6,index),'studio platform '+index);
 assert.ok(g.platforms.filter(s=>s.room===6).every(s=>!s.motion));
});
test('a live chase crosses the entire active arena without falling, using the permanent docks to wait for return',()=>{
 const g=ready();
 for(const [look,route]of[[[6,7],[6,7,1]],[[9,10],[9,10,2]],[[10,9],[10,9,1]],[[7,6,17],[7,6,17,3]]]){
  let waited=0;
  for(;waited<4000;waited++){const next=look.map(index=>g.platforms.find(s=>s.id==='6:'+index));if(next.every(s=>s.studioPhase==='solid'&&s.studioTimer>2.6)&&['park','overheat','raise'].includes(g.boss.studio.mode))break;g.step(1/60);}
  assert.ok(waited<4000,'route must reopen');for(const index of route)assert.ok(jumpTo(g,6,index),'active chase '+index);
 }
 assert.equal(g.events.filter(e=>e.type==='testRescue').length,0);
});
test('standing on a hologram warns, removes its actual collision, then restores it',()=>{
 const g=ready(),s=g.platforms.find(s=>s.id==='6:7');Object.assign(g.player,{x:s.x+10,y:s.y-48,grounded:true,supportId:s.id});
 stepStudioPlatforms(g,1/60);assert.equal(s.studioPhase,'warning');assert.ok(solidSurfaces(g).includes(s));
 for(let i=0;i<43;i++)stepStudioPlatforms(g,1/60);assert.equal(s.studioPhase,'gap');assert.ok(!solidSurfaces(g).includes(s));
 g.player.grounded=false;for(let i=0;i<95;i++)stepStudioPlatforms(g,1/60);assert.equal(s.studioPhase,'solid');assert.ok(solidSurfaces(g).includes(s));
});
test('the camera never removes all holographic routes together',()=>{const g=ready();g.player.grounded=false;for(let i=0;i<2400;i++){stepStudioPlatforms(g,1/60);assert.ok(g.platforms.filter(s=>s.room===6&&['gap','forming'].includes(s.studioPhase)).length<=2);}});
test('three chapter maps use the right landmarks, transfer once and respect pause',()=>{
 for(const [room,to,fromIndex,toIndex]of[[2,3,0,1],[4,5,1,2],[6,7,2,3]]){
  const g=ready();activateRoom(g,room);g.relays.forEach(d=>d.hp=0);g.bossesDefeated.add(g.boss.id);assert.ok(beginLocationTransition(g,to));assert.deepEqual(routeInfo(g.loading),{from:fromIndex,to:toIndex,step:fromIndex});
  g.mode='paused';const before=JSON.stringify(g);ticks(g,90);assert.equal(JSON.stringify(g),before);g.mode='loading';ticks(g,120);assert.equal(g.room,to);assert.equal(g.mode,'playing');assert.equal(g.events.filter(e=>e.type==='locationReady').length,1);
 }
});
test('Spreader has no shield and an arena of floor, two shelters and two side ledges',()=>{const g=ready();activateRoom(g,2);assert.equal(bossShielded(g),false);const s=g.platforms.filter(s=>s.room===2);assert.equal(s.length,5);assert.equal(s.filter(p=>p.shelter).length,2);});


const mode=g=>g.boss.studio.phase+':'+g.boss.studio.mode;
function until(g,target,max=60*40){for(let i=0;i<max&&mode(g)!==target;i++)stepBoss(g,1/60);return mode(g);}
function next(g,target){for(let i=0;i<60*20&&mode(g)===target;i++)stepBoss(g,1/60);return until(g,target);}
const at=(g,index,dx=20,h=48)=>{const s=g.platforms.find(s=>s.id==='6:'+index);Object.assign(g.player,{x:s.x+dx,y:s.y-h,h,grounded:true,supportId:s.id,vx:0,vy:0,inv:0,dash:0});return s;};
const toPhase=(g,phase)=>{const b=g.boss;b.hp=MANIPULATOR_HP-(phase-1)*6;b.studio.phase=phase;b.studio.mode=phase===2?'detach':'transform';b.studio.timer=.5;};
function phases(g){const seen=[];let last='';return (n,stop)=>{for(let i=0;i<n&&!(stop&&seen.includes(stop));i++){stepBoss(g,1/60);stepStudioPlatforms(g,1/60);const m=mode(g);if(m!==last){seen.push(m);last=m;}}return seen;};}

test('panorama: the crane raises, rolls to the end, aims, pans across, parks by Uma and the camera smokes on a dock',()=>{
 const g=ready();at(g,4,200);const run=phases(g),seen=run(60*20,'1:overheat');
 assert.deepEqual(seen.slice(0,7),['1:intro','1:raise','1:roll','1:aim','1:pan','1:park','1:overheat']);
 const b=g.boss,s=studioDock(g,b.studio.dock);assert.equal(b.y+b.h,s.y);assert.ok(manipulatorExposed(b));
 // The tip of the crane holds the camera above the dock.
 const tip=craneTip(b.studio.crane);assert.ok(Math.abs(tip.x-(b.x+b.w/2))<1);assert.ok(tip.y<b.y);
});

test('the pan beam stops on the first surface: a dock casts a safe shadow, the open floor is hit, Shift protects',()=>{
 for(const [where,dash,expected] of [['open',0,1],['open',.3,0],['shadow',0,0]]){
  const g=ready();g.testingInvulnerable=false;at(g,4,200);until(g,'1:pan');const n=g.boss.studio,docks=[1,2,3].map(i=>g.platforms.find(s=>s.id==='6:'+i));let placed=false;const h=g.health;
  for(let i=0;i<60*8&&n.mode==='pan';i++){
   const beam=castBeam(g),live=beamLive(n),dir=g.boss.dir,k=1/Math.tan(36*Math.PI/180);
   if(where==='shadow'){
    // Under a dock the ray is cut off: stand right below the point where it meets the dock, in its shadow.
    if(live&&docks.includes(beam.surface)&&beam.x2>beam.surface.x+50&&beam.x2<beam.surface.x+beam.surface.w-50){const y=beam.y2+60,x=beam.x2+dir*(y-beam.y2)*k;Object.assign(g.player,{x:x-17,y:y-48,h:48,grounded:false,vy:0,inv:0});placed=true;}
    else Object.assign(g.player,{x:g.platforms.find(s=>s.id==='6:0').x+5,y:-200,inv:g.player.inv});
   }else if(!placed&&live&&beam.surface?.id==='6:4'){Object.assign(g.player,{x:beam.x2-17,y:beam.y2-48,h:48,grounded:true,supportId:'6:4',inv:0,dash});placed=true;}
   else if(!placed)Object.assign(g.player,{x:0,y:-300});
   g.player.dash=dash;stepBoss(g,1/60);}
  assert.ok(placed||where==='shadow',where);assert.equal(h-g.health>0?1:0,expected,where+dash);
 }
});

test('the pan beam fires in bursts with closed-shutter gaps',()=>{
 const g=ready();at(g,4,200);until(g,'1:pan');const states=new Set();for(let i=0;i<60*3;i++){stepBoss(g,1/60);if(mode(g)==='1:pan')states.add(beamLive(g.boss.studio));}assert.deepEqual([...states].sort(),[false,true]);
});

test('studio platforms the beam touches burn out and come back',()=>{
 const g=ready();at(g,4,200);until(g,'1:pan');const burned=new Set();
 for(let i=0;i<60*7&&mode(g)==='1:pan';i++){stepBoss(g,1/60);stepStudioPlatforms(g,1/60);for(const s of g.platforms)if(s.room===6&&s.studioPlatform&&s.studioPhase==='gap')burned.add(s.index);}
 assert.ok(burned.size>=2,String([...burned]));
 for(let i=0;i<60*4;i++)stepStudioPlatforms(g,1/60);assert.ok([...burned].every(i=>g.platforms.find(s=>s.id==='6:'+i).studioPhase!=='forming'));
});

test('the crane is scenery: its rolling dolly never hurts Uma',()=>{
 const g=ready();g.testingInvulnerable=false;at(g,0,10);until(g,'1:roll');const c=g.boss.studio.crane,h=g.health;
 for(let i=0;i<60*3&&mode(g)==='1:roll';i++){Object.assign(g.player,{x:c.x-17,y:TRACK_Y-48,inv:0});stepBoss(g,1/60);}
 assert.equal(g.health,h);
});

test('stop-frame: the viewfinder follows Uma, locks, then snaps; stepping out after the lock is safe',()=>{
 for(const [leave,expected] of [[false,1],[true,0]]){
  const g=ready();g.testingInvulnerable=false;toPhase(g,2);at(g,4,200);until(g,'2:frame');const n=g.boss.studio,h=g.health;
  for(let i=0;i<60*3&&n.mode==='frame';i++){if(leave&&n.timer<FRAME_LOCK-.05&&!n.left){g.player.x+=80;n.left=true;}stepBoss(g,1/60);}
  assert.equal(mode(g),'2:snap');assert.equal(h-g.health,expected,String(leave));
 }
 const g=ready();toPhase(g,2);at(g,4,200);const seen=phases(g)(60*12,'2:develop');
 assert.deepEqual(seen.slice(0,8),['2:detach','2:warp','2:frame','2:snap','2:frame','2:snap','2:eject','2:develop']);assert.ok(manipulatorExposed(g.boss));assert.ok(FRAME>=1.4);
});

test('scissors cut the film strip Uma stands on; it falls away and comes back taped',()=>{
 const g=ready();toPhase(g,2);until(g,'2:frame');const s=at(g,14,40),n=g.boss.studio;n.scissorsClock=0;
 for(let i=0;i<3;i++){stepBoss(g,1/60);stepStudioPlatforms(g,1/60);}assert.equal(n.scissors.index,14);
 for(let i=0;i<Math.ceil(SCISSORS_AIM*60)+2;i++){stepBoss(g,1/60);stepStudioPlatforms(g,1/60);}assert.equal(s.studioPhase,'gap');assert.ok(!solidSurfaces(g).includes(s));
 for(let i=0;i<Math.ceil((CUT_GAP+.5)*60);i++)stepStudioPlatforms(g,1/60);assert.equal(s.studioPhase,'solid');assert.equal(n.taped[14],true);
});

test('projector: three strips become shadowless fakes, never the route to the projector or under Uma; the lamp goes dark',()=>{
 const g=ready();toPhase(g,3);const under=at(g,7,20);const seen=phases(g)(60*8,'3:dark');
 assert.deepEqual(seen.slice(0,5),['3:transform','3:project','3:charge','3:beam','3:dark']);
 const n=g.boss.studio,fakes=g.platforms.filter(s=>s.room===6&&s.intangible).map(s=>s.index);
 assert.equal(fakes.length,3);assert.deepEqual(fakes.sort(),[...n.fakes].sort());assert.ok(!fakes.includes(under.index));assert.equal(n.decoys.length,3);assert.ok(n.decoys.every(i=>i<DECOYS.length));
 for(const i of fakes)assert.ok(!solidSurfaces(g).some(s=>s.id==='6:'+i));assert.ok(manipulatorExposed(g.boss));
 const route={0:[6,7,13,14],1:[14,9,10,15,11,12],2:[6,17,8]}[n.dock];assert.ok(fakes.every(i=>!route.includes(i)));
});

test('the projector laser hurts at lens height; dropping below it or Shift protects',()=>{
 for(const [where,expected] of [['level',1],['below',0],['dash',0]]){
  const g=ready();g.testingInvulnerable=false;toPhase(g,3);at(g,4,200);until(g,'3:beam');const beam=g.boss.studio.beam;
  Object.assign(g.player,{x:beam.x+beam.w/2-17,y:where==='below'?beam.y+40:beam.y-20,inv:0,dash:where==='dash'?.3:0});const h=g.health;stepBoss(g,1/60);assert.equal(h-g.health,expected,where);
 }
});

test('six hits through the three openings: 3 damage each, two per phase, then the original interlude',()=>{
 const g=ready(),b=g.boss;assert.equal(b.hp,18);at(g,4,200);const names=[];
 for(const target of ['1:overheat','1:overheat','2:develop','2:develop','3:dark','3:dark']){assert.equal(next(g,target),target);names.push(b.phaseName);assert.equal(damageBoss(g,2),true);assert.equal(damageBoss(g,1),false);}
 assert.deepEqual(names,['Панорама','Панорама','Стоп-кадр','Стоп-кадр','Проектор','Проектор']);
 assert.equal(g.mode,'bossDefeat');assert.equal(g.bolts.length,0);g.storyEnabled=true;g.skipBossDefeat();assert.equal(g.mode,'interlude');assert.equal(g.interlude.boss,'manipulator');
});

test('no hit outside an opening; exposeManipulator opens the current phase',()=>{
 const g=ready();at(g,4,200);until(g,'1:pan');assert.equal(damageBoss(g,1),false);
 for(const [hp,m] of [[18,'1:overheat'],[12,'2:develop'],[6,'3:dark']]){const h=ready();h.boss.hp=hp;exposeManipulator(h);assert.equal(mode(h),m);assert.ok(manipulatorExposed(h.boss));}
});

test('pause freezes the fight and the floors, and retry restores the arena',()=>{
 const g=ready();toPhase(g,3);ticks(g,90);g.mode='paused';const before=JSON.stringify(g);ticks(g,120);assert.equal(JSON.stringify(g),before);
 g.mode='playing';g.retryLocation();g.boss.noticeTime=0;assert.ok(g.platforms.filter(s=>s.room===6).every(s=>s.studioPhase==='solid'&&!s.intangible));assert.equal(g.boss.hp,18);assert.equal(g.boss.studio.phase,1);assert.equal(bossShielded(g),false);
});
