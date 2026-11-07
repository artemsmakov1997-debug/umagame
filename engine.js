import {strikeAgitator} from './agitator-combat.js?v=0.21.5';
import {beginBossDefeat,stepBossDefeat,skipBossDefeat} from './boss-defeat.js?v=0.21.5';
import {stepConclusion,advanceConclusion} from './conclusion.js?v=0.21.5';
import {signalProfile,stepSignalStory} from './signal.js?v=0.21.5';
import {beginChapterStory,advanceChapterStory} from './chapter-story.js?v=0.21.5';
import {createMapProps,createRoutePortals,stepMapProps,stepSection,stepLocationHazards,tryRouteShortcut} from './chapter-routes.js?v=0.21.5';
import {advanceOpening} from './prologue.js?v=0.21.5';
import {tryDrop} from './drop-through.js?v=0.21.5';
import {WIDTH,HEIGHT,WORLD,MAX_HEALTH,START_LIVES,MAX_LIVES,WAKE_DURATION,rooms,roomAt,chapters,platforms,ladders,spawns,createEnemies,createFish,createSoup,createNotebooks,createRelays,createLifePickups,LAST_ROOM,FINAL_X,PORTAL_ROOM,PORTAL_X} from './level.js?v=0.21.5';
import {createBoss,stepBoss,damageBoss,stepProjectiles,bossContact} from './boss.js?v=0.21.5';
import {strikeInfoshum} from './infoshum-combat.js?v=0.21.5';
import {stepEnemies,stepPortals} from './enemies.js?v=0.21.5';
import {cancelInformantTeleport} from './informant-teleport.js?v=0.21.5';
import {applyRelayEffect} from './chapter-systems.js?v=0.21.5';
import {applyLowCeilings} from './shelters.js?v=0.21.5';
import {createTutorial,stepTutorial} from './tutorial.js?v=0.21.5';
import {applyRoofWalls,roofFall,stepRoofs,placeAtRoofCheckpoint} from './roofs-systems.js?v=0.21.5';
import {stepStudio,studioFall,placeAtStudioCheckpoint} from './studio-systems.js?v=0.21.5';
import {stepNewsroom,newsroomRestore,placeAtNewsroomCheckpoint,resetNewsroom} from './newsroom-systems.js?v=0.21.5';
import {scenes,evidence,relayClues} from './story.js?v=0.21.5';
import {createWorldPlatforms,stepWorldPlatforms,alignEnemyToPlatform} from './world-platforms.js?v=0.21.5';
import {beginArenaEntry,stepArenaEntry} from './arena-entry.js?v=0.21.5';
import {solidSurfaces,stepTacticalTerrain} from './terrain.js?v=0.21.5';
import {cleanCopies} from './tactical-enemies.js?v=0.21.5';
import {wakePlayer,playerHorizontal,stepPlayerRest} from './player-rest.js?v=0.21.5';
import {beginFinale,advanceFinale} from './finale.js?v=0.21.5';
import {activateRoom,beginLocationTransition,stepLocationTransition,canLeaveRoom,remainingAntennas} from './room-transitions.js?v=0.21.5';
import {stepEchoWarp,stepTether,releaseTether} from './campaign-enemies.js?v=0.21.5';
import {stepEchoPull,releaseEchoPull} from './echo-pull.js?v=0.21.5';
import {recordEchoTrail,scatterEcho} from './echo-double.js?v=0.21.5';
export {WIDTH,HEIGHT,WORLD,MAX_HEALTH,START_LIVES,MAX_LIVES,WAKE_DURATION,ARENA_WIDTH,platforms,ladders,ladder,rooms,chapters,roomAt,LAST_ROOM,FINAL_X,PORTAL_ROOM,PORTAL_X} from './level.js?v=0.21.5';
export function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
export function playerHeight(p,height){const feet=p.y+p.h;p.h=height;p.y=feet-height;}
export class Game {
 constructor({story=true,cinematic=false,testingInvulnerable=false}={}){this.testingInvulnerable=testingInvulnerable;this.hintsEnabled=true;this.overlap=overlap;this.storyEnabled=story;this.cinematic=cinematic;this.reset();}
 reset(){
  this.mode='ready';delete this.pausedFrom;this.time=0;this.fish=0;this.kills=0;this.health=MAX_HEALTH;this.lives=START_LIVES;this.respawnTime=0;this.camera=0;this.checkpoint=0;this.room=0;this.gateHint=-1;
  this.dialogue=null;this.ending=null;this.conclusion=null;this.defeat=null;this.signal={...signalProfile(0),echoTime:0};this.finalScore=null;this.encounters={};this.seenScenes=new Set();this.evidence=[];this.clues=[];this.parries=0;this.truthFound=false;this.wakeTime=0;this.viewWidth=this.viewWidth||WIDTH;this.transition=null;this.loading=null;this.chapter=0;this.bossesDefeated=new Set();this.roomHistory=new Set([0]);this.visitedPlatforms=new Set(['0:0']);this.safeTrail=[];this.echoImmunity=0;this.echoWarp=null;this.tether=null;
  this.trainingHintShown=false;this.tutorial=createTutorial();
  this.abilities={attack:true,dash:true,sneak:true};this.notebooks=createNotebooks();
  this.platforms=createWorldPlatforms();this.platformClocks={};this.arenaEntered=false;this.arenaEntry=null;this.lifePickups=createLifePickups();
  this.player={...spawns[0],w:34,h:48,vx:0,vy:0,dir:1,grounded:true,supportId:'0:0',coyote:0,jumpBuffer:0,inv:0,hurtTime:0,attack:0,cooldown:0,climbing:false,climbTime:0,sneaking:false,sneakTime:0,swing:0,dash:0,dashCooldown:0,knock:0,frightTime:0,joyTime:0,lowSwat:false,powerTime:0,glueGrace:0,pulled:false};
  this.swallow=null;this.interlude=null;this.mapProps=createMapProps();this.routePortals=createRoutePortals();this.visitedSections=new Set();this.sectionTransition=null;this.routeUpHeld=false;this.echoPull=null;this.portals=[];this.portalSerial=0;this.soups=createSoup();this.enemies=createEnemies();this.fishes=createFish();this.boss=createBoss();
  this.relays=createRelays();this.censors=[];this.bolts=[];this.events=[];this.inks=[];this.cuts=[];this.tacticalSerial=0;
 }
 emit(type,data={}){this.events.push({type,...data});}
 unlockForRoom(){return this.abilities;}

 abandon(){this.mode='ready';delete this.pausedFrom;for(const key of ['dialogue','defeat','conclusion','ending','interlude','loading','arenaEntry','echoWarp','echoPull','tether','swallow'])this[key]=null;this.bolts=[];this.portals=[];this.inks=[];this.cuts=[];this.events=[];this.signal.echoTime=0;this.boss.active=false;Object.assign(this.player,{attack:0,dash:0,vx:0,vy:0,knock:0,climbing:false,pulled:false,echoPulled:false});}
 start(){this.reset();this.openingIndex=0;this.mode=this.storyEnabled?(this.cinematic?'prologue':'waking'):'playing';this.emit('start');}
 advanceInterlude(direction=1){return advanceChapterStory(this,direction);}
 advanceOpening(direction=1){return advanceOpening(this,direction);}
 enterArena(){return beginArenaEntry(this);}
 leaveRoom(){return beginLocationTransition(this);}
 finishWakeup(){if(this.mode!=='waking')return;this.wakeTime=WAKE_DURATION;this.mode='playing';this.openDialogue('intro');}
 openDialogue(id,after='playing',pages=scenes[id]?.pages){
  if(!this.storyEnabled||this.dialogue||this.seenScenes.has(id)||!pages?.length)return false;
  this.seenScenes.add(id);this.dialogue={id,page:0,after,pages,signal:signalProfile(this.room)};this.mode='dialogue';this.player.attack=0;this.player.vx=0;this.emit('dialogue',{id});return true;
 }
 advanceDialogue(skip=false){
  if(this.mode!=='dialogue'||!this.dialogue)return false;
  const d=this.dialogue,pages=d.pages||scenes[d.id]?.pages||[];if(!skip&&d.page+1<pages.length){if(d.id==='intro'&&d.page===0){d.catReply=true;this.emit('catMeow');}else d.catReply=false;d.page++;this.emit('dialogue',{id:d.id});return true;}
  this.dialogue=null;this.mode=d.after;this.player.inv=Math.max(this.player.inv,.65);
  if(d.next){this.mode='playing';this.openDialogue(d.next,'won');return true;}
  this.emit(this.mode==='won'?'won':'dialogueEnd',{id:d.id});return true;
 }
 checkNotebooks(){
  if(this.swallow)return false;
  const p=this.player,n=this.notebooks.find(n=>!n.taken&&n.room===this.room&&n.readyAt<=this.time&&Math.abs(p.x+p.w/2-n.x)<32&&Math.abs(p.y+p.h/2-n.y)<38);
  if(!n)return false;n.taken=true;if(n.unlock)this.abilities[n.unlock]=true;
  const pages=n.scenes.filter(id=>!this.seenScenes.has(id)).flatMap(id=>scenes[id]?.pages||[]);
  n.scenes.forEach(id=>this.seenScenes.add(id));this.emit('notebook',{id:n.id,unlock:n.unlock,x:n.x,y:n.y});
  return this.openDialogue('notebook:'+n.id,'playing',pages);
 }
 completeChapter(room){
  const r=rooms[room];if(!r?.arena)return;const record=evidence[r.chapter-1];
  if(record&&!this.evidence.some(e=>e.chapter===r.chapter)){this.evidence.push({...record,chapter:r.chapter,room});this.emit('evidence',{room,chapter:r.chapter});}
  const note=this.notebooks.find(n=>n.bossRecord&&n.room===room);if(note&&note.readyAt===Infinity)note.readyAt=this.time+.5;
 }
 bossDefeated(){return beginBossDefeat(this);}
 skipBossDefeat(){return skipBossDefeat(this);}
 advanceConclusion(skip=false){return advanceConclusion(this,skip);}
 resolveBossDefeat(){const b=this.boss;if(!b.id||this.bossesDefeated.has(b.id))return;this.bossesDefeated.add(b.id);b.active=false;this.bolts=[];this.emit('miniBossDefeated',{boss:b.id,x:b.x,y:b.y});if(b.id==='infoshum')this.finish();else{this.completeChapter(this.room);beginChapterStory(this);}}

 finish(){return beginFinale(this);}
 advanceEnding(direction=1){return advanceFinale(this,direction);}
 respawn(){releaseEchoPull(this);this.swallow=null;wakePlayer(this.player);Object.assign(this.player,{...spawns[this.checkpoint],h:48,vx:0,vy:0,grounded:true,supportId:this.checkpoint+':0',inv:1.6,dash:0,dashCooldown:0,attack:0,climbing:false,sneaking:false,knock:0,slipping:false,onInk:false,inkTime:0,slideTime:0});placeAtNewsroomCheckpoint(this);placeAtRoofCheckpoint(this);placeAtStudioCheckpoint(this);delete this.player.warpScale;this.bolts=[];this.updateCamera();}
 restoreCheckpoint(){
  const revealed=this.enemies.filter(e=>e.room===this.checkpoint&&e.type==='clickbait'&&e.revealed&&!e.dead);
  const local=createEnemies().filter(e=>e.room===this.checkpoint).map(e=>alignEnemyToPlatform(this,e)).map(e=>{const old=revealed.find(old=>e.type==='clickbait'&&old.platformIndex===e.platformIndex);return old?{...e,revealed:true,active:true,noticed:true,state:'patrol',timer:1,x:Math.max(e.origin,Math.min(e.end,old.x)),walkTime:old.walkTime}:e;});
  this.health=MAX_HEALTH;this.enemies=this.enemies.filter(e=>e.room!==this.checkpoint).concat(local);this.dialogue=null;this.arenaEntry=null;this.loading=null;const roofs=this.roofs,studio=this.studio;activateRoom(this,this.checkpoint,{heal:false});newsroomRestore(this);if(this.checkpoint===3&&roofs){this.roofs.checkpoint=roofs.checkpoint;placeAtRoofCheckpoint(this);}if(this.checkpoint===5&&studio){this.studio.checkpoint=studio.checkpoint;placeAtStudioCheckpoint(this);}this.mode='playing';this.emit('lifeRestored',{lives:this.lives});
 }
 retryLocation(){
  const index=this.checkpoint;if(index===1)resetNewsroom(this);for(const d of this.mapProps)if(d.room===index){d.hp=1;d.breakTime=0;d.lastSwing=-1;}for(const r of this.routePortals)if(r.room===index)r.cooldown=0;this.visitedSections=new Set([...this.visitedSections].filter(key=>!key.startsWith(index+':')));this.lives=START_LIVES;for(const d of this.relays)if(d.room===index){d.hp=1;d.breakTime=0;d.lastSwing=-1;}
  if(rooms[index].boss)this.bossesDefeated.delete(rooms[index].boss);
  if(index===3)this.roofs=null;if(index===5)this.studio=null;this.restoreCheckpoint();this.emit('locationRetry',{room:index});
 }

 retry(){this.start();}
 loseLife(reason='damage'){
  if(this.mode!=='playing')return;if(this.testingInvulnerable){this.swallow=null;this.respawn();this.emit('testRescue',{reason});return;}releaseEchoPull(this);wakePlayer(this.player);this.health=0;this.lives=Math.max(0,this.lives-1);this.swallow=null;this.player.hurtTime=.5;this.player.attack=0;this.player.sneaking=false;
  if(this.lives===0){this.mode='lost';this.emit('lost',{reason});}else{this.mode='respawning';this.respawnTime=1.1;this.emit('lifeLost',{lives:this.lives,reason});}
 }
 hurt(fall=false,sourceX=this.player.x+this.player.dir*50){
  const p=this.player;if(this.mode!=='playing')return;
  if(fall){this.loseLife('fall');return;}
  if(this.testingInvulnerable)return;
  if(p.dash>0)return;
  if(p.inv>0)return;
  wakePlayer(p);this.health--;p.hurtTime=.5;p.sneaking=false;playerHeight(p,48);this.emit('hurt');if(this.health<=0){this.loseLife();return;}
  p.inv=1.25;p.vy=-170;p.knock=.15;p.vx=sourceX>p.x?-130:130;
 }
 updateCamera(dt=0){const r=rooms[this.room],width=this.viewWidth||WIDTH,target=Math.max(r.x,Math.min(Math.max(r.x,r.end-width),this.player.x-width*.4));this.camera=dt>0?this.camera+(target-this.camera)*(1-Math.exp(-dt*8)):target;}

 push(dir,sourceX){const p=this.player;if(this.mode!=='playing'||p.dash>0)return;wakePlayer(p);p.sneaking=false;playerHeight(p,48);p.knock=.26;p.vx=dir*640;p.vy=-65;p.climbing=false;this.emit('pushed',{x:sourceX,y:p.y});}
 hitEnemy(e,stomp=false,amount=null,{reflected=false,sourceX=this.player.x+this.player.w/2}={}){
  if(e.inv>0||e.dead||e.phased||e.frozen)return false;
  if(e.type==='clickbait'||e.type==='copier'&&!['printing','recover'].includes(e.state)){
   e.guardFlash=.24;this.emit('blocked',{x:e.x+e.w/2,y:e.y,enemyType:e.type});return false;
  }
  if(e.type==='informant'&&e.shieldBroken===0&&['windup','casting'].includes(e.state)&&!reflected){this.emit('blocked',{x:e.x,y:e.y});return false;}
  if(reflected)e.shieldBroken=3;
  e.hp-=amount??(!stomp&&this.player.powerTime>0?2:1);e.inv=.24;e.hurtTime=.28;e.state='recover';e.timer=.7;
  if(e.type==='echo'&&e.kind!=='echoOrb'&&e.hp>0)scatterEcho(this,e);
  cancelInformantTeleport(e);releaseTether(this,e.id);if(this.echoPull?.ownerId===e.id)releaseEchoPull(this,true);
  for(const portal of this.portals)if(portal.ownerId===e.id)portal.cancelled=true;
  if(!stomp&&!reflected&&e.type==='fakenews'&&!e.jumpPhase&&!e.terrainFall)e.x=Math.max(e.origin,Math.min(e.end,e.x+this.player.dir*18));
  this.emit('enemyHit',{x:e.x+24,y:e.y,enemyType:e.type});if(e.hp<=0){e.dead=true;e.deathTime=.28;this.kills++;this.emit('pop',{x:e.x+24,y:e.y,enemyType:e.type});cleanCopies(this);}return true;
 }
 step(dt,input={}){
  if(this.mode==='bossDefeat'){stepBossDefeat(this,Math.min(dt,1/30));return;}
  if(this.mode==='conclusion'){stepConclusion(this,Math.min(dt,1/30));return;}
  if(this.mode==='echoWarp'){this.time+=Math.min(dt,1/30);stepEchoWarp(this,dt);return;}
  if(this.mode==='loading'){this.time+=Math.min(dt,1/30);stepLocationTransition(this,dt);return;}
  if(this.mode==='enteringArena'){this.time+=Math.min(dt,1/30);stepArenaEntry(this,dt);return;}
  if(this.mode==='respawning'){dt=Math.min(dt,1/30);this.respawnTime=Math.max(0,this.respawnTime-dt);this.player.hurtTime=Math.max(0,this.player.hurtTime-dt);if(this.respawnTime===0)this.restoreCheckpoint();return;}
  if(this.mode==='waking'){const before=this.wakeTime;this.wakeTime=Math.min(WAKE_DURATION,this.wakeTime+Math.min(dt,1/30));if(before<2.7&&this.wakeTime>=2.7)this.emit('infection');if(this.wakeTime>=WAKE_DURATION)this.finishWakeup();return;}
  if(this.mode!=='playing'||this.checkNotebooks())return;dt=Math.min(dt,1/30);this.time+=dt;stepSignalStory(this,dt);
  if(this.transition){this.transition.time+=dt;if(this.transition.time>=this.transition.duration)this.transition=null;}
  this.routeUpPressed=!!input.up&&!this.routeUpHeld;this.routeUpHeld=!!input.up;if(tryRouteShortcut(this))input={...input,up:false,jump:false};
  const p=this.player,oldX=p.x,oldY=p.y,oldRoom=this.room;p.powerTime=Math.max(0,p.powerTime-dt);
  if(this.swallow){const captor=this.enemies.find(e=>e.id===this.swallow.enemyId);this.swallow.timer=Math.max(0,this.swallow.timer-dt);if(captor)captor.captureTime=1-this.swallow.timer/this.swallow.total;if(this.swallow.timer===0){if(captor){captor.captureTime=null;captor.attackFlash=0;}this.loseLife('clickbait');this.updateCamera();}return;}
  stepWorldPlatforms(this,dt);
  stepTacticalTerrain(this,dt);
  for(const key of ['inv','cooldown','attack','dash','dashCooldown','knock','hurtTime','glueGrace','echoGrace','frightTime','joyTime'])p[key]=Math.max(0,(p[key]||0)-dt);
  const keyboardAxis=(input.right?1:0)-(input.left?1:0),axis=keyboardAxis||Math.max(-1,Math.min(1,input.axisX||0));if(Math.abs(axis)>.05&&p.dash===0)p.dir=axis>0?1:-1;
  const ladder=ladders.find(l=>p.x+p.w>l.x&&p.x<l.x+l.w&&p.y+p.h>=l.y&&p.y<l.y+l.h);
  let useLadder=ladder&&p.dash===0&&(input.up&&p.y+p.h>ladder.y+6||input.down&&p.y+p.h<ladder.y+ladder.h-1);
  const dropping=tryDrop(this,input,dt);if(dropping)useLadder=false;
  // ↓ + attack is a low paw swat from the sneak when there is nothing to drop through to (or a target is in reach).
  const lowSwat=!!(input.attack&&input.down&&!dropping&&!p.dropConsumed&&this.abilities.attack&&this.abilities.sneak&&p.grounded&&!useLadder);
  const canAttack=input.attack&&(!input.down||lowSwat)&&this.abilities.attack,canDash=input.dash&&this.abilities.dash;
  p.sneaking=!!((this.abilities.sneak&&input.down||p.forcedCrouch)&&p.grounded&&!useLadder&&p.dash===0&&p.knock===0&&(lowSwat||p.lowSwat&&p.attack>0||p.attack===0&&!canAttack)&&!input.jump&&!canDash);playerHeight(p,p.sneaking?26:48);
  p.coyote=p.grounded?.1:Math.max(0,p.coyote-dt);p.jumpBuffer=input.jump&&!input.down?.13:Math.max(0,p.jumpBuffer-dt);
  if(canDash&&p.dashCooldown===0){p.dash=.2;p.dashCooldown=1.5;p.climbing=false;p.knock=0;p.hurtTime=0;p.vy=0;this.emit('dash');}
  playerHorizontal(this,axis,dt);stepTether(this,dt);stepEchoPull(this,dt);
  if(useLadder){p.climbing=true;p.vy=(input.down?1:-1)*110;p.jumpBuffer=0;p.vx=0;}else if(!ladder||axis||p.dash>0)p.climbing=false;
  let jumped=false;if(p.jumpBuffer>0&&(p.coyote>0||p.climbing)){p.vy=-500;p.grounded=false;p.coyote=0;p.jumpBuffer=0;p.climbing=false;jumped=true;this.emit('jump');}
  if(canAttack&&p.cooldown===0){p.attack=.19;p.cooldown=.36;p.swing++;p.lowSwat=lowSwat;p.frightTime=0;p.joyTime=0;this.emit('swat',{low:lowSwat});}
  const prevBottom=p.y+p.h,carriedSupport=p.grounded?p.supportId:null,belt=p.grounded&&p.dash===0&&!p.climbing?this.platforms.find(s=>s.belt&&Math.abs(s.y-prevBottom)<1&&p.x+p.w>s.x&&p.x<s.x+s.w)?.belt||0:0;
  if(!p.climbing)p.vy=Math.min(p.vy+(p.dash>0?150:1080)*dt,550);else if(!input.up&&!input.down)p.vy=0;
  const bounds=rooms[this.room];p.x=Math.max(bounds.x+4,Math.min(bounds.end-p.w-4,p.x+(p.vx+belt)*dt));p.y+=p.vy*dt;p.grounded=false;p.supportId=null;

  if(!canLeaveRoom(this)&&p.x+p.w>bounds.end-18){p.x=bounds.end-18-p.w;if(this.gateHint!==this.room){this.gateHint=this.room;this.emit('gate',{remaining:remainingAntennas(this).length,boss:bounds.arena&&this.boss.hp>0});}}

  if(ladder&&p.climbing){
   if(input.up&&p.y+p.h<=ladder.y+3){p.y=ladder.y-p.h;p.vy=0;p.grounded=true;p.climbing=false;}
   else if(input.down&&p.y+p.h>=ladder.y+ladder.h){p.y=ladder.y+ladder.h-p.h;p.vy=0;p.grounded=true;p.climbing=false;}
  }
  if(p.vy>=0&&!p.climbing){const surface=solidSurfaces(this).filter(s=>!(p.dropTime>0&&s.id===p.dropId)&&p.x+p.w>s.x+1&&p.x<s.x+s.w-1&&prevBottom<=(s.id===carriedSupport?s.y:s.prevY)+1&&p.y+p.h>=s.y).sort((a,b)=>a.y-b.y)[0];if(surface){p.y=surface.y-p.h;p.vy=0;p.grounded=true;p.supportId=surface.id;}}
  applyLowCeilings(this,oldX);applyRoofWalls(this,oldX);
  if(p.y>HEIGHT+30){if(roofFall(this)||studioFall(this))return;this.hurt(true);return;}
  if(p.climbing)p.climbTime+=Math.abs(p.y-oldY)/18;if(p.sneaking)p.sneakTime+=Math.abs(p.x-oldX)/14;
  stepPlayerRest(this,input,dt);
  this.unlockForRoom(this.room);
  this.echoImmunity=Math.max(0,this.echoImmunity-dt);
  if(p.grounded&&p.supportId){this.visitedPlatforms.add(p.supportId);const last=this.safeTrail.at(-1);if(!last||Math.abs(last.x-p.x)>110||last.platformId!==p.supportId){this.safeTrail.push({platformId:p.supportId,x:p.x,y:p.y});this.safeTrail=this.safeTrail.slice(-80);}}
  if(this.checkNotebooks()){this.updateCamera(dt);return;}
  if(this.room===PORTAL_ROOM&&p.x+p.w>PORTAL_X-35&&p.vx>40&&!this.arenaEntered&&canLeaveRoom(this)){this.enterArena();this.updateCamera(dt);return;}
  if(this.room!==PORTAL_ROOM&&this.room<LAST_ROOM&&p.x+p.w>=bounds.end-20&&p.vx>40&&canLeaveRoom(this)){this.leaveRoom();this.updateCamera(dt);return;}

  // Highest point of the current flight: a long fall shows the frightened falling pose.
  p.peakY=p.grounded||p.climbing?p.y:Math.min(p.peakY??p.y,p.y);
  recordEchoTrail(this);
  const reach=p.powerTime>0?81:54,paw={x:p.dir>0?p.x+16:p.x-reach+18,y:p.y-2,w:reach,h:p.h+6};stepTutorial(this,dt,paw,oldX);stepRoofs(this,dt,paw,input);stepStudio(this,dt);stepMapProps(this,dt,paw);stepLocationHazards(this,dt);stepNewsroom(this,dt);stepSection(this,dt);
  stepEnemies(this,dt,paw,prevBottom);if(this.mode==='playing')stepPortals(this,dt);
  if(this.mode!=='playing'||this.swallow)return;
  for(const f of this.fishes)if(!f.taken&&Math.abs(p.x+17-f.x)<26&&Math.abs(p.y+p.h/2-f.y)<32){f.taken=true;this.fish++;if(this.fish%8===0){this.health=Math.min(MAX_HEALTH,this.health+1);this.emit('heal');}this.emit('fish',{x:f.x,y:f.y});}
  for(const life of this.lifePickups)if(!life.taken&&this.lives<MAX_LIVES&&Math.abs(p.x+17-life.x)<25&&Math.abs(p.y+p.h/2-life.y)<32){life.taken=true;this.lives++;this.emit('lifePickup',{x:life.x,y:life.y});}
  for(const soup of this.soups)if(!soup.taken&&Math.abs(p.x+17-soup.x)<27&&Math.abs(p.y+p.h/2-soup.y)<35){soup.taken=true;this.health=Math.min(MAX_HEALTH,this.health+1);p.powerTime=10;this.emit('soup',{x:soup.x,y:soup.y});}
  if(this.mode!=='playing'){this.updateCamera(dt);return;}
  for(const relay of this.relays){relay.breakTime=Math.max(0,relay.breakTime-dt);if(!relay.scripted&&relay.room!==8&&relay.hp>0&&p.attack>0&&relay.lastSwing!==p.swing&&overlap(paw,relay)){relay.lastSwing=p.swing;relay.hp=0;relay.breakTime=.65;p.joyTime=1.1;this.emit('dishBreak',{x:relay.x+relay.w/2,y:relay.y+25});this.emit('relay',{room:relay.room,id:relay.id});
    const effect=applyRelayEffect(this,relay),clue=relayClues[relay.room]?.[relay.ordinal];
    if(clue){this.clues.push({id:relay.id,room:relay.room,text:clue,effect});this.emit('clue',{room:relay.room,text:clue,effect,x:relay.x});}}}
  if(this.mode!=='playing'){this.updateCamera(dt);return;}
  const b=this.boss;
  if(b.active&&b.room===this.room&&b.hp>0){stepBoss(this,dt);if(b.id==='infoshum'&&b.network){strikeInfoshum(this,paw);}else if(b.id==='agitator'&&b.broadcast){strikeAgitator(this,paw);if(p.attack>0&&b.lastSwing!==p.swing&&overlap(paw,{x:b.x,y:b.y+b.h*.35,w:b.w,h:b.h*.65})){b.lastSwing=p.swing;damageBoss(this,p.powerTime>0?2:1);}}else if(p.attack>0&&b.lastSwing!==p.swing&&overlap(paw,{x:b.x,y:b.y+b.h*.35,w:b.w,h:b.h*.65})){b.lastSwing=p.swing;if(!damageBoss(this,p.powerTime>0?2:1))this.emit('blocked',{x:b.x,y:b.y});}bossContact(this);}
  if(this.mode==='playing')stepProjectiles(this,dt,paw);this.updateCamera(dt);
 }
}
