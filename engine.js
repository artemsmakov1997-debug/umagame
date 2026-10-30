import {WIDTH,HEIGHT,WORLD,MAX_HEALTH,rooms,platforms,ladders,spawns,createEnemies,createFish} from './level.js?v=0.3.0';
import {createBoss,stepBoss,damageBoss,stepProjectiles} from './boss.js?v=0.3.0';
export {WIDTH,HEIGHT,WORLD,MAX_HEALTH,platforms,ladders,ladder,rooms} from './level.js?v=0.3.0';
export function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
export class Game {
 constructor(){this.overlap=overlap;this.reset();}
 reset(){
  this.mode='ready';this.time=0;this.clock=420;this.fish=0;this.kills=0;this.lives=MAX_HEALTH;this.camera=0;this.checkpoint=0;this.room=0;this.gateHint=-1;
  this.player={...spawns[0],w:34,h:48,vx:0,vy:0,dir:1,grounded:true,coyote:0,jumpBuffer:0,inv:0,attack:0,cooldown:0,climbing:false,swing:0,dash:0,dashCooldown:0,knock:0};
  this.enemies=createEnemies();this.fishes=createFish();this.boss=createBoss();this.relays=[0,1].map(room=>({x:room*WIDTH+651,y:165,w:88,h:110,hp:3,inv:0,lastSwing:-1,room}));this.bolts=[];this.events=[];
 }
 emit(type,data={}){this.events.push({type,...data});}
 start(){this.reset();this.mode='playing';this.emit('start');}
 respawn(){Object.assign(this.player,{...spawns[this.checkpoint],vx:0,vy:0,inv:1.6,dash:0,dashCooldown:0,attack:0,climbing:false,knock:0});this.bolts=[];this.updateCamera();}
 retry(){if(this.mode!=='lost'||this.checkpoint===0){this.start();return;}this.lives=MAX_HEALTH;this.clock=Math.max(120,this.clock);this.enemies=this.enemies.filter(e=>e.room!==this.checkpoint).concat(createEnemies().filter(e=>e.room===this.checkpoint));this.boss=createBoss();this.respawn();this.mode='playing';this.emit('retry');}
 hurt(fall=false,sourceX=this.player.x+this.player.dir*50){
  const p=this.player;if(this.mode!=='playing'||(!fall&&(p.inv>0||p.dash>0)))return;
  this.lives--;this.emit('hurt');if(this.lives<=0){this.mode='lost';this.emit('lost');return;}
  p.inv=1.25;p.vy=-170;p.knock=.15;p.vx=sourceX>p.x?-130:130;if(fall)this.respawn();
 }
 updateCamera(){this.camera=Math.max(0,Math.min(WORLD-WIDTH,this.player.x-WIDTH*.4));}
 hitEnemy(e,stomp=false){
  if(e.inv>0)return;if(e.armor&&!stomp&&e.state!=='recover'){this.emit('blocked',{x:e.x+24,y:e.y});return;}
  if(stomp)e.armor=false;e.hp--;e.inv=.24;e.state='recover';e.timer=.6;
  this.emit('enemyHit',{x:e.x+24,y:e.y});if(e.hp<=0){e.dead=true;this.kills++;this.emit('pop',{x:e.x+24,y:e.y});}
 }
 stepEnemies(dt,paw,prevBottom){
  const p=this.player;
  for(const e of this.enemies){
   if(e.dead)continue;e.inv=Math.max(0,e.inv-dt);
   const near=Math.abs(e.x-p.x)<460;e.timer-=dt;
   if(e.flying){
    e.x+=e.dir*e.speed*dt;e.y=e.baseY+Math.sin(this.time*2.4)*14;
    if(near&&e.timer<=0){e.state='windup';e.timer=.65;} // A short visible flash precedes the aimed shot.
    if(e.state==='windup'&&e.timer<=.05){const dx=p.x-e.x,dy=p.y+24-e.y,len=Math.hypot(dx,dy)||1;this.bolts.push({kind:'paper',x:e.x+15,y:e.y+12,w:16,h:13,vx:dx/len*145,vy:dy/len*145,ttl:4});e.state='patrol';e.timer=2.5;}
   }else if(e.type==='charger'||e.type==='guard'){
    if(e.state==='patrol'&&near&&Math.abs(p.x-e.x)<190&&Math.abs(p.y+48-e.y-29)<60){e.state='windup';e.timer=.7;e.dir=p.x<e.x?-1:1;}
    else if(e.state==='windup'&&e.timer<=0){e.state='lunge';e.timer=.38;}
    else if(e.state==='lunge'&&e.timer<=0){e.state='recover';e.timer=.7;}
    else if(e.state==='recover'&&e.timer<=0)e.state='patrol';
    if(e.state==='patrol'||e.state==='lunge')e.x+=e.dir*(e.state==='lunge'?235:e.speed)*dt;
   }else e.x+=e.dir*e.speed*dt;
   if(e.x<e.origin||e.x>e.end){e.dir*=-1;e.x=Math.max(e.origin,Math.min(e.end,e.x));if(e.state==='lunge'){e.state='recover';e.timer=.7;}}
   if(p.attack>0&&e.lastSwing!==p.swing&&overlap(paw,e)){e.lastSwing=p.swing;this.hitEnemy(e);}
   if(!e.dead&&overlap(p,e)){if(p.vy>0&&prevBottom<e.y+12){this.hitEnemy(e,true);p.vy=-330;}else this.hurt(false,e.x);}
  }
 }
 step(dt,input={}){
  if(this.mode!=='playing')return;dt=Math.min(dt,1/30);this.time+=dt;this.clock=Math.max(0,this.clock-dt);
  if(this.clock===0){this.mode='lost';this.emit('lost');return;}
  const p=this.player;
  for(const key of ['inv','cooldown','attack','dash','dashCooldown','knock'])p[key]=Math.max(0,p[key]-dt);
  p.coyote=p.grounded?.1:Math.max(0,p.coyote-dt);p.jumpBuffer=input.jump?.13:Math.max(0,p.jumpBuffer-dt);
  const axis=(input.right?1:0)-(input.left?1:0);if(axis&&p.dash===0)p.dir=axis;
  if(input.dash&&p.dashCooldown===0){p.dash=.2;p.dashCooldown=1.5;p.climbing=false;this.emit('dash');}
  if(!p.knock)p.vx=p.dash>0?p.dir*430:axis*155;
  const ladder=ladders.find(l=>p.x+p.w>l.x&&p.x<l.x+l.w&&p.y+p.h>=l.y&&p.y<l.y+l.h);
  if(ladder&&(input.up||input.down)&&p.dash===0){p.climbing=true;p.vy=(input.down?1:-1)*110;p.jumpBuffer=0;}else if(!ladder||axis||p.dash>0)p.climbing=false;
  if(p.jumpBuffer>0&&(p.coyote>0||p.climbing)){p.vy=-500;p.grounded=false;p.coyote=0;p.jumpBuffer=0;p.climbing=false;this.emit('jump');}
  if(input.attack&&p.cooldown===0){p.attack=.19;p.cooldown=.36;p.swing++;this.emit('swat');}
  const prevBottom=p.y+p.h;
  if(!p.climbing)p.vy=Math.min(p.vy+(p.dash>0?150:1080)*dt,550);else if(!input.up&&!input.down)p.vy=0;
  p.x=Math.max(0,Math.min(WORLD-p.w,p.x+p.vx*dt));p.y+=p.vy*dt;p.grounded=false;
  for(const relay of this.relays)if(relay.hp>0&&p.x+p.w>WIDTH*(relay.room+1)-12){p.x=WIDTH*(relay.room+1)-12-p.w;if(this.gateHint!==relay.room){this.gateHint=relay.room;this.emit('gate');}break;}
  if(ladder&&p.climbing&&input.up&&p.y+p.h<=ladder.y+3){p.y=ladder.y-p.h;p.vy=0;p.grounded=true;p.climbing=false;}
  if(p.vy>=0&&!p.climbing)for(const s of platforms){if(p.x+p.w>s.x+1&&p.x<s.x+s.w-1&&prevBottom<=s.y+1&&p.y+p.h>=s.y){p.y=s.y-p.h;p.vy=0;p.grounded=true;}}
  if(p.y>HEIGHT+30){this.hurt(true);return;}
  this.room=Math.min(2,Math.floor((p.x+p.w/2)/WIDTH));
  if(this.room>this.checkpoint){this.checkpoint=this.room;this.lives=Math.min(MAX_HEALTH,this.lives+1);this.emit('checkpoint',{room:this.room});}
  const paw={x:p.dir>0?p.x+16:p.x-36,y:p.y-2,w:54,h:54};this.stepEnemies(dt,paw,prevBottom);
  if(this.mode!=='playing')return;
  for(const f of this.fishes)if(!f.taken&&Math.abs(p.x+17-f.x)<26&&Math.abs(p.y+24-f.y)<32){f.taken=true;this.fish++;if(this.fish%8===0){this.lives=Math.min(MAX_HEALTH,this.lives+1);this.emit('heal');}this.emit('fish',{x:f.x,y:f.y});}
  for(const relay of this.relays){relay.inv=Math.max(0,relay.inv-dt);if(relay.hp>0&&p.attack>0&&relay.inv===0&&relay.lastSwing!==p.swing&&overlap(paw,relay)){relay.lastSwing=p.swing;if(this.enemies.some(e=>e.room===relay.room&&e.guardian&&!e.dead)){if(!relay.hint){relay.hint=true;this.emit('guardian');}this.emit('blocked',{x:relay.x,y:relay.y+45});continue;}relay.hp--;relay.inv=.35;this.emit('bossHit',{x:relay.x,y:relay.y+45});if(!relay.hp)this.emit('relay',{room:relay.room});}}
  const b=this.boss;
  if(!b.active&&p.x>WIDTH*2+470){b.active=true;b.state='recover';b.timer=1;this.emit('bossStart');}
  if(b.active){p.x=Math.max(WIDTH*2+302,p.x);stepBoss(this,dt);if(p.attack>0&&b.lastSwing!==p.swing&&overlap(paw,{x:b.x,y:b.y+60,w:b.w,h:b.h-60})){b.lastSwing=p.swing;if(!damageBoss(this,1))this.emit('blocked',{x:b.x,y:b.y+45});}if(overlap(p,b))this.hurt(false,b.x);}
  if(this.mode==='playing')stepProjectiles(this,dt,paw);this.updateCamera();
 }
}
