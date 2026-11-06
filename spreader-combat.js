import {rooms} from './level.js?v=0.21.5';
import {phasePlans} from './boss-phases.js?v=0.21.5';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// Распространитель: two phases that repeat until he falls.
// 1. AIR — carpet bombing. He crosses the arena high up twice, laying a continuous carpet of leaflets.
//    Tabletops stop leaflets: crouch under a shelter (only a crouched Uma fits beneath).
// 2. GROUND — he dives to the far edge and makes two straight dashes along the floor.
//    Before and after each dash he stops: those pauses are the only moments he can be hit (one hit each).
//    Climb a shelter and jump over him; servants keep pestering in both phases.
export const SPREADER_HP=4;
export const FLOOR_Y=416,FLY_Y=86,EDGE=18;
export const BOMB_PASSES=2,PASS_TIME=4.2,LEAFLET_SPACING=26,LEAFLET_FALL=250;
export const WINDUP=1.5,DASH_SPEED=560,SKID=.35,STUN=2.1,DASHES=2;
export const COVER_HOVER=300,SERVANT_RECOVER=1.3;
export const DASH_HITBOX={h:60};
export const SHELTERS=[1,2];

export function spreaderDeck(g){return g.platforms.find(s=>s.room===g.boss.room&&s.index===4);}
// Kept for compatibility: the ceiling feeders of the old arena are gone.
export function spreaderExposed(b){const f=b.fight;return !!f&&(f.mode==='windup'||f.mode==='stunned')&&!f.hitThisWindow;}

export const SERVANTS={air:2,ground:1};
export function summonServants(g,cap=SERVANTS[g.boss.fight?.phase]??2){
 const b=g.boss,r=rooms[b.room],alive=g.enemies.filter(e=>e.bossOwnerId===b.id&&!e.dead),made=[];
 for(const [local,side] of [[b.x-110,-1],[b.x+b.w+35,1],[g.player.x-140,-1],[g.player.x+140,1]]){
  if(alive.length+made.length>=cap)break;
  const x=clamp(local,r.x+20,r.end-50),y=clamp(b.fight?.phase==='ground'?g.player.y-80:b.y+60,30,330);
  if(Math.hypot(x-g.player.x,y-g.player.y)<90||alive.concat(made).some(e=>Math.hypot(x-e.x,y-e.y)<50))continue;
  const e={id:'servant-'+(++g.tacticalSerial),type:'servant',name:'Прислужник',room:b.room,bossOwnerId:b.id,platformIndex:0,x,y,w:32,h:23,hp:1,maxHp:1,active:true,noticed:true,flying:true,dir:side,state:'patrol',flank:side,timer:.9,spawnTime:.6,arrivalDuration:.6,inv:0,hurtTime:0,lastSwing:-1,walkTime:0,deathTime:0};
  g.enemies.push(e);made.push(e);g.emit('servantSpawn',{x,y});
 }return made;
}

function fight(b){return b.fight??={phase:'air',mode:'enter',timer:1,pass:0,dashes:0,leaflets:[],dropDistance:0,hitThisWindow:false,from:null,to:null};}
function setMode(b,mode,timer){const f=b.fight;f.mode=mode;f.timer=timer;f.elapsed=0;if(mode==='windup'||mode==='stunned')f.hitThisWindow=false;}
const edgeX=(g,side)=>{const r=rooms[g.boss.room];return side<0?r.x+EDGE:r.end-EDGE-g.boss.w;};

function dropLeaflet(g,b){
 const f=b.fight,n=f.dropSerial=(f.dropSerial||0)+1,jitter=Math.sin(n*12.9898)*43758.5453%1,x=b.x+b.w/2+jitter*5;
 f.leaflets.push({x,y:b.y+b.h*.6,vy:LEAFLET_FALL*.6,sway:n*2.4,frame:n%6,landed:0,hit:false});
}
function stepLeaflets(g,dt){
 const b=g.boss,f=b.fight,p=g.player,shelters=g.platforms.filter(s=>s.room===b.room&&SHELTERS.includes(s.index));
 for(const l of f.leaflets){
  if(l.landed){l.landed+=dt;continue;}
  l.vy=Math.min(LEAFLET_FALL,l.vy+420*dt);const ny=l.y+l.vy*dt;l.x+=Math.sin(g.time*6+l.sway)*18*dt;
  const top=shelters.find(s=>l.x>s.x+2&&l.x<s.x+s.w-2&&l.y<=s.y&&ny>=s.y);
  if(top){l.y=top.y;l.landed=.001;continue;}
  if(ny>=FLOOR_Y){l.y=FLOOR_Y;l.landed=.001;continue;}
  l.y=ny;
  if(!l.hit&&p.dash===0&&l.x>p.x+3&&l.x<p.x+p.w-3&&l.y>p.y+2&&l.y<p.y+p.h){l.hit=true;l.landed=.001;g.hurt(false,l.x);g.emit('leafletHit',{x:l.x,y:l.y});}
 }
 f.leaflets=f.leaflets.filter(l=>!l.landed||l.landed<.55);
}

export function stepSpreader(g,dt){
 const b=g.boss,f=fight(b),p=g.player,r=rooms[b.room];
 f.timer-=dt;f.elapsed=(f.elapsed||0)+dt;stepLeaflets(g,dt);b.phase=f.phase==='air'?1:2;b.phaseName=phasePlans.spreader[b.phase-1][0];
 if(!f.relaysCleared){f.relaysCleared=true;g.relays.filter(d=>d.room===b.room).forEach(d=>{d.hp=0;d.breakTime=.45;});}
 if(f.mode==='enter'){
  if(!f.from){f.from={x:b.x,y:b.y};f.enterTime=f.timer;f.side=p.x+p.w/2<r.x+r.width/2?1:-1;f.to={x:edgeX(g,-f.side),y:FLY_Y};summonServants(g);g.emit('bossPhase',{boss:b.id,phase:1,name:'Ковровая бомбардировка'});}
  const t=clamp(f.elapsed/(f.enterTime||1),0,1);b.x=f.from.x+(f.to.x-f.from.x)*t;b.y=f.from.y+(f.to.y-f.from.y)*t;b.state='moving';b.dir=f.side;
  if(f.timer<=0){setMode(b,'bombing',PASS_TIME);f.pass=0;f.dropDistance=0;f.startX=b.x;g.emit('bossWarning',{boss:b.id,ability:'rain',x:b.x,y:b.y});}
  return;
 }
 if(f.mode==='bombing'){
  const startX=f.startX,endX=edgeX(g,f.side),t=clamp(f.elapsed/PASS_TIME,0,1),x=startX+(endX-startX)*t;
  f.dropDistance+=Math.abs(x-b.x);b.x=x;b.y=FLY_Y+Math.sin(f.elapsed*5)*6;b.state='casting';b.ability='rain';b.dir=f.side;
  while(f.dropDistance>=LEAFLET_SPACING){f.dropDistance-=LEAFLET_SPACING;dropLeaflet(g,b);}
  if(f.timer<=0){f.pass++;if(f.pass<BOMB_PASSES){f.side*=-1;f.startX=b.x;setMode(b,'turn',.7);}else setMode(b,'dive',.8);}
  return;
 }
 if(f.mode==='turn'){b.state='moving';b.dir=f.side;if(f.timer<=0){setMode(b,'bombing',PASS_TIME);f.dropDistance=0;}return;}
 if(f.mode==='dive'){
  // Land at the edge farther from Uma, then dash towards the other edge.
  if(!f.diveFrom){f.diveFrom={x:b.x,y:b.y};const farSide=p.x+p.w/2<r.x+r.width/2?1:-1;f.diveTo={x:edgeX(g,farSide),y:FLOOR_Y-b.h};f.dashDir=-farSide;}
  const t=clamp(f.elapsed/.8,0,1);b.x=f.diveFrom.x+(f.diveTo.x-f.diveFrom.x)*t;b.y=f.diveFrom.y+(f.diveTo.y-f.diveFrom.y)*t*t;b.state='moving';b.dir=f.dashDir;
  if(f.timer<=0){f.diveFrom=null;f.phase='ground';f.dashes=0;b.x=f.diveTo.x;b.y=f.diveTo.y;summonServants(g);g.emit('bossPhase',{boss:b.id,phase:2,name:'Рывок'});setMode(b,'landed',.4);}
  return;
 }
 if(f.mode==='landed'){b.state='recover';if(f.timer<=0){setMode(b,'windup',WINDUP);g.emit('bossWarning',{boss:b.id,ability:'dash',x:b.x,y:b.y});}return;}
 if(f.mode==='windup'){b.state='windup';b.dir=f.dashDir;if(f.timer<=0){setMode(b,'dash',2);g.emit('bossCast',{boss:b.id,ability:'dash',x:b.x,y:b.y});}return;}
 if(f.mode==='dash'){
  const target=edgeX(g,f.dashDir);b.state='casting';b.ability='dash';b.x+=f.dashDir*DASH_SPEED*dt;
  const box={x:b.x+8,y:FLOOR_Y-DASH_HITBOX.h,w:b.w-16,h:DASH_HITBOX.h};
  if(!f.dashHit&&p.dash===0&&g.overlap(p,box)){f.dashHit=true;g.hurt(false,b.x+b.w/2);if(g.mode==='playing')g.push(f.dashDir,b.x+b.w/2);}
  if(f.dashDir>0?b.x>=target:b.x<=target){b.x=target;f.dashHit=false;f.dashes++;setMode(b,'skid',SKID);}
  return;
 }
 if(f.mode==='skid'){b.state='recover';if(f.timer<=0)setMode(b,'stunned',STUN);return;}
 if(f.mode==='stunned'){
  b.state='recover';
  if(f.timer<=0){if(f.dashes<DASHES){f.dashDir*=-1;setMode(b,'windup',WINDUP);g.emit('bossWarning',{boss:b.id,ability:'dash',x:b.x,y:b.y});}else setMode(b,'takeoff',.8);}
  return;
 }
 if(f.mode==='takeoff'){
  b.state='moving';const t=clamp(f.elapsed/.8,0,1);b.y=FLOOR_Y-b.h-(FLOOR_Y-b.h-FLY_Y)*t;
  if(f.timer<=0){f.phase='air';f.from=null;setMode(b,'enter',.6);}
 }
}

// Puts the boss into a stun on the floor where it stands (tests and scripted scenes).
export function exposeSpreader(g){const b=g.boss,f=fight(b);f.phase='ground';f.dashDir=f.dashDir||-1;b.y=FLOOR_Y-b.h;setMode(b,'stunned',STUN);return b;}

// One paw swing per vulnerable pause (before and after each dash); a powered paw deals 2.
export function damageSpreader(g,amount){
 const b=g.boss,f=b.fight;if(!b.active||b.hp<=0||!spreaderExposed(b))return false;
 f.hitThisWindow=true;b.hp=Math.max(0,b.hp-Math.max(1,amount));b.hurtTime=.35;b.cooldown=.3;g.emit('bossHit',{x:b.x+b.w/2,y:b.y+b.h-14,boss:b.id});
 if(b.hp===0){f.leaflets=[];g.bolts=[];for(const e of g.enemies)if(e.bossOwnerId===b.id&&!e.dead){e.dead=true;e.hp=0;e.deathTime=.3;}g.bossDefeated();}
 return true;
}

export function stepServant(g,e,dt,paw){
 if(e.dead){e.deathTime=Math.max(0,e.deathTime-dt);return;}if(e.spawnTime>0){e.spawnTime=Math.max(0,e.spawnTime-dt);return;}
 e.inv=Math.max(0,e.inv-dt);e.timer-=dt;e.walkTime+=dt;const p=g.player,r=rooms[e.room],dx=p.x+p.w/2-e.x-e.w/2,dy=p.y+12-e.y;
 if(e.state==='patrol'){const covered=!!p.forcedCrouch;e.dir=dx<0?-1:1;e.x+=clamp(dx+e.flank*(covered?90:65),-80,80)*dt;e.y+=clamp((covered?COVER_HOVER:p.y-38)-e.y,-65,65)*dt;if(!covered&&Math.abs(dx)<120&&Math.abs(dy)<75&&e.timer<=0){e.state='windup';e.timer=.5;e.aimX=p.x;e.aimY=p.y;}}
 else if(e.state==='windup'&&e.timer<=0){const len=Math.hypot(e.aimX-e.x,e.aimY-e.y)||1;e.vx=(e.aimX-e.x)/len*225;e.vy=(e.aimY-e.y)/len*225;e.state='lunge';e.timer=.3;e.contactHit=false;}
 else if(e.state==='lunge'){e.x+=e.vx*dt;e.y+=e.vy*dt;if(e.timer<=0){e.state='recover';e.timer=SERVANT_RECOVER;}}
 else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=.7;}
 e.x=clamp(e.x,r.x+5,r.end-e.w-5);e.y=clamp(e.y,15,390);
 if(p.attack>0&&e.lastSwing!==p.swing&&g.overlap(paw,e)){e.lastSwing=p.swing;g.hitEnemy(e);}
 if(!e.dead&&e.state==='lunge'&&!e.contactHit&&g.overlap(p,e)&&!p.dash&&(p.inv===0||g.testingInvulnerable)){
  e.contactHit=true;g.hurt(false,e.x);const dir=Math.sign(e.vx)||e.dir;g.push(dir,e.x);p.vx=dir*180;p.vy=70;p.knock=.23;p.grounded=false;
 }
}
