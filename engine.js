import {WIDTH,HEIGHT,WORLD,MAX_HEALTH,START_LIVES,WAKE_DURATION,rooms,platforms,ladders,spawns,createEnemies,createFish,createSoup,createNotebooks,LAST_ROOM,FINAL_X} from './level.js?v=0.10.1';
import {createBoss,stepBoss,damageBoss,stepProjectiles} from './boss.js?v=0.10.1';
import {stepEnemies,stepPortals} from './enemies.js?v=0.10.1';
import {scenes,evidence} from './story.js?v=0.10.1';
export {WIDTH,HEIGHT,WORLD,MAX_HEALTH,START_LIVES,WAKE_DURATION,platforms,ladders,ladder,rooms,LAST_ROOM,FINAL_X} from './level.js?v=0.10.1';
export function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
export function playerHeight(p,height){const feet=p.y+p.h;p.h=height;p.y=feet-height;}
export class Game {
 constructor({story=true}={}){this.overlap=overlap;this.storyEnabled=story;this.reset();}
 reset(){
  this.mode='ready';delete this.pausedFrom;this.time=0;this.fish=0;this.kills=0;this.health=MAX_HEALTH;this.lives=START_LIVES;this.respawnTime=0;this.camera=0;this.checkpoint=0;this.room=0;this.gateHint=-1;
  this.dialogue=null;this.seenScenes=new Set();this.evidence=[];this.truthFound=false;this.wakeTime=0;this.viewWidth=this.viewWidth||WIDTH;this.transition=null;
  this.trainingHintShown=false;this.tutorial={step:0,distance:0,jumped:false,climbed:0,complete:false};
  this.abilities={attack:false,dash:false,sneak:false};this.notebooks=createNotebooks();
  this.player={...spawns[0],w:34,h:48,vx:0,vy:0,dir:1,grounded:true,coyote:0,jumpBuffer:0,inv:0,hurtTime:0,attack:0,cooldown:0,climbing:false,climbTime:0,sneaking:false,sneakTime:0,swing:0,dash:0,dashCooldown:0,knock:0,powerTime:0};
  this.swallow=null;this.portals=[];this.portalSerial=0;this.soups=createSoup();this.enemies=createEnemies();this.fishes=createFish();this.boss=createBoss();
  this.relays=rooms.slice(1,-1).map((r,index)=>({x:r.x+651,y:platforms.find(p=>p.room===index+1&&p.index===2).y-110,w:88,h:110,hp:3,inv:0,lastSwing:-1,room:index+1}));this.bolts=[];this.events=[];
 }
 emit(type,data={}){this.events.push({type,...data});}
 unlockForRoom(room){
  for(const [id,first]of Object.entries({attack:1,dash:2,sneak:5}))if(room>=first&&!this.abilities[id]){this.abilities[id]=true;this.emit('ability',{id});}
 }
 start(){this.reset();this.mode=this.storyEnabled?'waking':'playing';this.emit('start');}
 finishWakeup(){if(this.mode!=='waking')return;this.wakeTime=WAKE_DURATION;this.mode='playing';this.openDialogue('intro');}
 openDialogue(id,after='playing',pages=scenes[id]?.pages){
  if(!this.storyEnabled||this.dialogue||this.seenScenes.has(id)||!pages?.length)return false;
  this.seenScenes.add(id);this.dialogue={id,page:0,after,pages};this.mode='dialogue';this.player.attack=0;this.player.vx=0;this.emit('dialogue',{id});return true;
 }
 advanceDialogue(skip=false){
  if(this.mode!=='dialogue'||!this.dialogue)return false;
  const d=this.dialogue,pages=d.pages||scenes[d.id]?.pages||[];if(!skip&&d.page+1<pages.length){d.page++;this.emit('dialogue',{id:d.id});return true;}
  this.dialogue=null;this.mode=d.after;this.player.inv=Math.max(this.player.inv,.65);
  if(d.next){this.mode='playing';this.openDialogue(d.next,'won');return true;}
  this.emit(this.mode==='won'?'won':'dialogueEnd',{id:d.id});return true;
 }
 checkNotebooks(){
  if(this.swallow)return false;
  const p=this.player,n=this.notebooks.find(n=>!n.taken&&n.room===this.room&&n.readyAt<=this.time&&Math.abs(p.x+p.w/2-n.x)<32&&Math.abs(p.y+p.h/2-n.y)<38);
  if(!n)return false;n.taken=true;if(n.unlock)this.abilities[n.unlock]=true;
  const pages=n.scenes.filter(id=>!this.seenScenes.has(id)).flatMap(id=>scenes[id].pages);
  n.scenes.forEach(id=>this.seenScenes.add(id));this.emit('notebook',{id:n.id,unlock:n.unlock,x:n.x,y:n.y});
  return this.openDialogue('notebook:'+n.id,'playing',pages);
 }
 completeChapter(room){
  const record=evidence[room-1];if(record&&!this.evidence.some(e=>e.room===room)){this.evidence.push({...record,room});this.emit('evidence',{room});}
  const note=this.notebooks.find(n=>n.relay&&n.room===room);if(note&&note.readyAt===Infinity)note.readyAt=this.time+.5;
 }
 finish(){this.truthFound=true;this.bolts=[];this.portals=[];if(this.openDialogue('truth','won')){this.dialogue.next='ending';this.emit('victory');}else{this.mode='won';this.emit('won');}}
 respawn(){this.swallow=null;Object.assign(this.player,{...spawns[this.checkpoint],h:48,vx:0,vy:0,grounded:true,inv:1.6,dash:0,dashCooldown:0,attack:0,climbing:false,sneaking:false,knock:0});this.bolts=[];this.updateCamera();}
 restoreCheckpoint(){
  const revealed=this.enemies.filter(e=>e.room===this.checkpoint&&e.type==='clickbait'&&e.revealed&&!e.dead);
  const local=createEnemies().filter(e=>e.room===this.checkpoint).map(e=>{
   const old=revealed.find(old=>e.type==='clickbait'&&old.platformIndex===e.platformIndex);
   return old?{...e,revealed:true,active:true,noticed:true,state:'patrol',timer:1,x:Math.max(e.origin,Math.min(e.end,old.x)),walkTime:old.walkTime}:e;
  });
  this.health=MAX_HEALTH;this.enemies=this.enemies.filter(e=>e.room!==this.checkpoint).concat(local);this.portals=[];this.boss=createBoss();this.dialogue=null;this.transition=null;this.respawn();this.room=this.checkpoint;this.mode='playing';this.emit('lifeRestored',{lives:this.lives});
 }
 retry(){this.start();}
 loseLife(reason='damage'){
  if(this.mode!=='playing')return;this.health=0;this.lives=Math.max(0,this.lives-1);this.swallow=null;this.player.hurtTime=.5;this.player.attack=0;this.player.sneaking=false;
  if(this.lives===0){this.mode='lost';this.emit('lost',{reason});}else{this.mode='respawning';this.respawnTime=1.1;this.emit('lifeLost',{lives:this.lives,reason});}
 }
 hurt(fall=false,sourceX=this.player.x+this.player.dir*50){
  const p=this.player;if(this.mode!=='playing'||(!fall&&(p.inv>0||p.dash>0)))return;
  this.health--;p.hurtTime=.5;p.sneaking=false;playerHeight(p,48);this.emit('hurt');if(this.health<=0){this.loseLife();return;}
  p.inv=1.25;p.vy=-170;p.knock=.15;p.vx=sourceX>p.x?-130:130;if(fall)this.respawn();
 }
 updateCamera(dt=0){const width=this.viewWidth||WIDTH,target=Math.max(0,Math.min(WORLD-width,this.player.x-width*.4));this.camera=dt>0?this.camera+(target-this.camera)*(1-Math.exp(-dt*8)):target;}
 push(dir,sourceX){const p=this.player;if(this.mode!=='playing'||p.dash>0)return;p.sneaking=false;playerHeight(p,48);p.knock=.26;p.vx=dir*380;p.vy=-55;p.climbing=false;this.emit('pushed',{x:sourceX,y:p.y});}
 hitEnemy(e,stomp=false,amount=null,{reflected=false}={}){
  if(e.inv>0||e.dead)return false;
  if(e.type==='informant'&&e.shieldBroken===0&&['windup','casting'].includes(e.state)&&!reflected){this.emit('blocked',{x:e.x,y:e.y});return false;}
  if(reflected)e.shieldBroken=3;
  e.hp-=amount??(!stomp&&this.player.powerTime>0?2:1);e.inv=.24;e.hurtTime=.28;e.state='recover';e.timer=.7;
  for(const portal of this.portals)if(portal.ownerId===e.id)portal.cancelled=true;
  this.emit('enemyHit',{x:e.x+24,y:e.y});if(e.hp<=0){e.dead=true;e.deathTime=.28;this.kills++;this.emit('pop',{x:e.x+24,y:e.y});}return true;
 }
 updateTutorial(dx,dy,jumped){
  if(this.room!==0||this.tutorial.complete)return;const q=this.tutorial,p=this.player;
  q.distance+=Math.abs(dx);if(jumped)q.jumped=true;if(p.climbing)q.climbed+=Math.max(0,-dy);
  if(q.step===0&&q.distance>=65){q.step=1;this.emit('lesson',{step:1});}
  if(q.step===1&&q.jumped&&p.grounded&&p.x>=264){q.step=2;this.emit('lesson',{step:2});}
  if(q.step===2&&q.climbed>=65&&p.grounded&&p.y+p.h<=246){q.step=3;q.complete=true;this.emit('lesson',{step:3});}
 }
 step(dt,input={}){
  if(this.mode==='respawning'){dt=Math.min(dt,1/30);this.respawnTime=Math.max(0,this.respawnTime-dt);this.player.hurtTime=Math.max(0,this.player.hurtTime-dt);if(this.respawnTime===0)this.restoreCheckpoint();return;}
  if(this.mode==='waking'){const before=this.wakeTime;this.wakeTime=Math.min(WAKE_DURATION,this.wakeTime+Math.min(dt,1/30));if(before<2.7&&this.wakeTime>=2.7)this.emit('infection');if(this.wakeTime>=WAKE_DURATION)this.finishWakeup();return;}
  if(this.mode!=='playing'||this.checkNotebooks())return;dt=Math.min(dt,1/30);this.time+=dt;
  if(this.transition){this.transition.time+=dt;if(this.transition.time>=this.transition.duration)this.transition=null;}
  const p=this.player,oldX=p.x,oldY=p.y,oldRoom=this.room;p.powerTime=Math.max(0,p.powerTime-dt);
  if(this.swallow){const captor=this.enemies.find(e=>e.id===this.swallow.enemyId);this.swallow.timer=Math.max(0,this.swallow.timer-dt);if(captor)captor.captureTime=1-this.swallow.timer/this.swallow.total;if(this.swallow.timer===0){if(captor){captor.captureTime=null;captor.attackFlash=0;}this.loseLife('clickbait');this.updateCamera();}return;}
  for(const key of ['inv','cooldown','attack','dash','dashCooldown','knock','hurtTime'])p[key]=Math.max(0,p[key]-dt);
  const keyboardAxis=(input.right?1:0)-(input.left?1:0),axis=keyboardAxis||Math.max(-1,Math.min(1,input.axisX||0));if(Math.abs(axis)>.05&&p.dash===0)p.dir=axis>0?1:-1;
  const ladder=ladders.find(l=>p.x+p.w>l.x&&p.x<l.x+l.w&&p.y+p.h>=l.y&&p.y<l.y+l.h);
  const useLadder=ladder&&(input.up||input.down)&&p.dash===0;
  const canAttack=input.attack&&this.abilities.attack,canDash=input.dash&&this.abilities.dash;
  p.sneaking=!!(this.abilities.sneak&&input.down&&p.grounded&&!useLadder&&p.dash===0&&p.knock===0&&p.attack===0&&!canAttack&&!input.jump&&!canDash);playerHeight(p,p.sneaking?26:48);
  p.coyote=p.grounded?.1:Math.max(0,p.coyote-dt);p.jumpBuffer=input.jump?.13:Math.max(0,p.jumpBuffer-dt);
  if(canDash&&p.dashCooldown===0){p.dash=.2;p.dashCooldown=1.5;p.climbing=false;this.emit('dash');}
  if(!p.knock)p.vx=p.dash>0?p.dir*430:axis*(p.sneaking?62:155);
  if(useLadder){p.climbing=true;p.vy=(input.down?1:-1)*110;p.jumpBuffer=0;p.vx=0;}else if(!ladder||axis||p.dash>0)p.climbing=false;
  let jumped=false;if(p.jumpBuffer>0&&(p.coyote>0||p.climbing)){p.vy=-500;p.grounded=false;p.coyote=0;p.jumpBuffer=0;p.climbing=false;jumped=true;this.emit('jump');}
  if(canAttack&&p.cooldown===0){p.attack=.19;p.cooldown=.36;p.swing++;this.emit('swat');}
  const prevBottom=p.y+p.h,belt=p.grounded&&p.dash===0&&!p.climbing?platforms.find(s=>s.belt&&Math.abs(s.y-prevBottom)<1&&p.x+p.w>s.x&&p.x<s.x+s.w)?.belt||0:0;
  if(!p.climbing)p.vy=Math.min(p.vy+(p.dash>0?150:1080)*dt,550);else if(!input.up&&!input.down)p.vy=0;
  p.x=Math.max(0,Math.min(WORLD-p.w,p.x+(p.vx+belt)*dt));p.y+=p.vy*dt;p.grounded=false;
  if(!this.tutorial.complete&&p.x+p.w>WIDTH-12){p.x=WIDTH-12-p.w;if(!this.trainingHintShown){this.trainingHintShown=true;this.emit('trainingGate');}}
  for(const relay of this.relays)if(relay.hp>0&&p.x+p.w>WIDTH*(relay.room+1)-12){p.x=WIDTH*(relay.room+1)-12-p.w;if(this.gateHint!==relay.room){this.gateHint=relay.room;this.emit('gate');}break;}
  if(ladder&&p.climbing){
   if(input.up&&p.y+p.h<=ladder.y+3){p.y=ladder.y-p.h;p.vy=0;p.grounded=true;p.climbing=false;}
   else if(input.down&&p.y+p.h>=ladder.y+ladder.h){p.y=ladder.y+ladder.h-p.h;p.vy=0;p.grounded=true;p.climbing=false;}
  }
  if(p.vy>=0&&!p.climbing)for(const s of platforms){if(p.x+p.w>s.x+1&&p.x<s.x+s.w-1&&prevBottom<=s.y+1&&p.y+p.h>=s.y){p.y=s.y-p.h;p.vy=0;p.grounded=true;}}
  if(p.y>HEIGHT+30){this.hurt(true);return;}
  if(p.climbing)p.climbTime+=Math.abs(p.y-oldY)/18;if(p.sneaking)p.sneakTime+=Math.abs(p.x-oldX)/14;
  this.room=Math.min(LAST_ROOM,Math.floor((p.x+p.w/2)/WIDTH));this.unlockForRoom(this.room);this.updateTutorial(p.x-oldX,p.y-oldY,jumped);
  if(this.room!==oldRoom){this.transition={from:oldRoom,to:this.room,time:0,duration:.85};this.emit('room',{room:this.room});}
  if(this.room>this.checkpoint){this.checkpoint=this.room;this.health=Math.min(MAX_HEALTH,this.health+1);this.emit('checkpoint',{room:this.room});}
  if(this.checkNotebooks()){this.updateCamera(dt);return;}
  const reach=p.powerTime>0?81:54,paw={x:p.dir>0?p.x+16:p.x-reach+18,y:p.y-2,w:reach,h:p.h+6};stepEnemies(this,dt,paw,prevBottom);stepPortals(this,dt);
  if(this.mode!=='playing'||this.swallow)return;
  for(const f of this.fishes)if(!f.taken&&Math.abs(p.x+17-f.x)<26&&Math.abs(p.y+p.h/2-f.y)<32){f.taken=true;this.fish++;if(this.fish%8===0){this.health=Math.min(MAX_HEALTH,this.health+1);this.emit('heal');}this.emit('fish',{x:f.x,y:f.y});}
  for(const soup of this.soups)if(!soup.taken&&Math.abs(p.x+17-soup.x)<27&&Math.abs(p.y+p.h/2-soup.y)<35){soup.taken=true;this.health=Math.min(MAX_HEALTH,this.health+1);p.powerTime=10;this.emit('soup',{x:soup.x,y:soup.y});}
  if(this.mode!=='playing'){this.updateCamera(dt);return;}
  for(const relay of this.relays){relay.inv=Math.max(0,relay.inv-dt);if(relay.hp>0&&p.attack>0&&relay.inv===0&&relay.lastSwing!==p.swing&&overlap(paw,relay)){relay.lastSwing=p.swing;if(this.enemies.some(e=>e.room===relay.room&&e.guardian&&!e.dead)){if(!relay.hint){relay.hint=true;this.emit('guardian');}this.emit('blocked',{x:relay.x,y:relay.y+45});continue;}relay.hp--;relay.inv=.35;this.emit('bossHit',{x:relay.x,y:relay.y+45});if(!relay.hp){this.emit('relay',{room:relay.room});this.completeChapter(relay.room);}}}
  if(this.mode!=='playing'){this.updateCamera(dt);return;}
  const b=this.boss;if(!b.active&&p.x>FINAL_X+470){b.active=true;b.state='recover';b.timer=1;b.noticeTime=.4;this.emit('bossStart');}
  if(b.active){p.x=Math.max(FINAL_X+302,p.x);stepBoss(this,dt);if(p.attack>0&&b.lastSwing!==p.swing&&overlap(paw,{x:b.x,y:b.y+60,w:b.w,h:b.h-60})){b.lastSwing=p.swing;if(!damageBoss(this,p.powerTime>0?2:1))this.emit('blocked',{x:b.x,y:b.y+45});}if(overlap(p,b))this.hurt(false,b.x);}
  if(this.mode==='playing')stepProjectiles(this,dt,paw);this.updateCamera(dt);
 }
}
