import {rooms} from './level.js?v=0.21.5';
import {phasePlans} from './boss-phases.js?v=0.21.5';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// «Тираж»: the newspaper manta in three phases of two hits.
// 1 AIR «Ковровая бомбардировка»: two high passes drop tied bundles; tabletops catch them, a bundle that
//   reaches the floor bursts around itself (crouch under a table). Then he «collects the print run»:
//   leaflets stream from the floor up to him. Overloaded, he sinks low beside Uma — the opening.
// 2 GROUND «Рывок»: rolled into a tube he dashes at Uma and stops just past her, crashes and lies
//   flat and dizzy — the opening is always close to Uma.
// 3 SPEAR «Срочный выпуск»: he dives as a tube-spear at a marked spot and sticks in the surface.
// Servants (small paper rays) keep pestering throughout.
export const SPREADER_HP=6,PHASE_HP=2;
export const FLOOR_Y=416,FLY_Y=86,EDGE=18;
export const BOMB_PASSES=2,PASS_TIME=4,BUNDLE_SPACING=40,BUNDLE_FALL=380,BURST_RADIUS=34;
// Leaflets are gathered from the left ledge, both tabletops, the floor between them and the right ledge.
export const COLLECT_SOURCES=[76,250,432,614,788];
export const COLLECT=2.2,STREAM_SPEED=300,SINK=.6,HEAVY=2.6;
export const WINDUP=1.2,DASH_SPEED=560,OVERSHOOT=170,SKID=.35,STUN=2.2,DASHES=2;
export const AIM=.9,AIM_LOCK=.3,SPEAR_SPEED=720,STUCK=1.9,DIVES=3;
export const TURN=.9;
export const COVER_HOVER=300,SERVANT_RECOVER=1.3;
export const DASH_HITBOX={h:54};
export const SHELTERS=[1,2];
export const OPENINGS=['heavy','stunned','stuck'];
const edgeX=(g,side)=>{const r=rooms[g.boss.room];return side<0?r.x+EDGE:r.end-EDGE-g.boss.w;};
export function spreaderDeck(g){return g.platforms.find(s=>s.room===g.boss.room&&s.index===4);}
export function spreaderExposed(b){const f=b.fight;return !!f&&OPENINGS.includes(f.mode)&&!f.hitThisWindow;}
export function spreaderPhase(b){return b.hp>SPREADER_HP-PHASE_HP?'air':b.hp>SPREADER_HP-2*PHASE_HP?'ground':'spear';}
export const SERVANTS={air:2,ground:1,spear:1};
export function summonServants(g,cap=SERVANTS[spreaderPhase(g.boss)]??2){
 const b=g.boss,r=rooms[b.room],alive=g.enemies.filter(e=>e.bossOwnerId===b.id&&!e.dead),made=[];
 for(const [local,side] of [[b.x-110,-1],[b.x+b.w+35,1],[g.player.x-140,-1],[g.player.x+140,1]]){
  if(alive.length+made.length>=cap)break;
  const x=clamp(local,r.x+20,r.end-50),y=clamp(b.y+60,30,330);
  if(Math.hypot(x-g.player.x,y-g.player.y)<90||alive.concat(made).some(e=>Math.hypot(x-e.x,y-e.y)<50))continue;
  const e={id:'servant-'+(++g.tacticalSerial),type:'servant',name:'Прислужник',room:b.room,bossOwnerId:b.id,platformIndex:0,x,y,w:32,h:23,hp:1,maxHp:1,active:true,noticed:true,flying:true,dir:side,state:'patrol',flank:side,timer:.9,spawnTime:.6,arrivalDuration:.6,inv:0,hurtTime:0,lastSwing:-1,walkTime:0,deathTime:0};
  g.enemies.push(e);made.push(e);g.emit('servantSpawn',{x,y});
 }return made;
}
function fight(b){const phase=spreaderPhase(b);return b.fight??={phase,mode:'enter',timer:1,pass:0,passes:phase==='air'?BOMB_PASSES:1,dashes:0,dives:0,bundles:[],streams:[],shocks:[],bursts:[],dropDistance:0,hitThisWindow:false,from:null,to:null};}
function setMode(b,mode,timer){const f=b.fight;f.mode=mode;f.timer=timer;f.elapsed=0;f.from=null;if(OPENINGS.includes(mode))f.hitThisWindow=false;}
// The highest surface under x (a tabletop, a side ledge or the floor).
function surfaceAt(g,x){const b=g.boss,tops=g.platforms.filter(s=>s.room===b.room&&s.index>0&&!s.bossHidden&&x>s.x+4&&x<s.x+s.w-4);return tops.length?Math.min(...tops.map(s=>s.y)):FLOOR_Y;}
export function sinkSpot(g){
 const b=g.boss,p=g.player,r=rooms[b.room],px=p.x+p.w/2,feet=p.y+p.h,side=px<r.x+r.width/2?1:-1,places=[];
 for(const d of[110,170,70])for(const k of[side,-side]){const x=px+k*d-b.w/2;if(x>=r.x+EDGE&&x<=r.end-EDGE-b.w)places.push(x);}
 const x=places.find(x=>Math.abs(surfaceAt(g,x+b.w/2)-feet)<8)??places[0]??clamp(px-b.w/2,r.x+EDGE,r.end-EDGE-b.w);
 return{x,y:feet-b.h+6};
}
function sheltered(g){return !!g.player.forcedCrouch;}
// ——— Bundles, bursts, streams, shock leaflets ———
function dropBundle(g,b){const f=b.fight;f.bundles.push({x:b.x+b.w/2+Math.sin((f.bundles.length+1)*7.3)*4,y:b.y+b.h*.7,vy:120,id:(f.serial=(f.serial||0)+1)});f.dropFlash=.18;}
function burst(g,x,y,onTable){
 const f=g.boss.fight,p=g.player;f.bursts.push({x,y,t:0,table:onTable});if(onTable){const s=g.platforms.find(s=>s.room===g.boss.room&&SHELTERS.includes(s.index)&&x>s.x&&x<s.x+s.w);if(s)(f.litter??={})[s.index]=true;}g.emit('bundleBurst',{x,y});
 if(onTable||sheltered(g)||p.dash>0)return;
 if(Math.abs(p.x+p.w/2-x)<BURST_RADIUS+p.w/2&&p.y+p.h>y-60&&p.y<y+4){g.hurt(false,x);g.emit('leafletHit',{x,y});}
}
function stepProjectiles(g,dt){
 const b=g.boss,f=b.fight,p=g.player;f.dropFlash=Math.max(0,(f.dropFlash||0)-dt);
 for(const u of f.bundles){if(u.done)continue;u.vy=Math.min(BUNDLE_FALL,u.vy+700*dt);const ny=u.y+u.vy*dt,surface=surfaceAt(g,u.x);
  if(p.dash===0&&!u.hitUma&&Math.abs(p.x+p.w/2-u.x)<p.w/2+8&&ny>p.y&&u.y<p.y+p.h&&!sheltered(g)){u.hitUma=true;u.done=true;g.hurt(false,u.x);g.emit('leafletHit',{x:u.x,y:ny});continue;}
  if(ny>=surface){u.done=true;burst(g,u.x,surface,surface<FLOOR_Y);continue;}u.y=ny;}
 f.bundles=f.bundles.filter(u=>!u.done);
 for(const s of f.bursts)s.t+=dt;f.bursts=f.bursts.filter(s=>s.t<.5);
 for(const s of f.streams){s.t+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;if(!s.hit&&p.dash===0&&Math.abs(s.x-(p.x+p.w/2))<p.w/2+4&&s.y>p.y&&s.y<p.y+p.h){s.hit=true;g.hurt(false,s.x);}}
 f.streams=f.streams.filter(s=>s.t<s.life&&!s.hit);
 for(const s of f.shocks){s.t+=dt;s.x+=s.vx*dt;if(Math.abs(surfaceAt(g,s.x)-s.y)>2){s.t=9;continue;}if(!s.hit&&p.dash===0&&Math.abs(s.x-(p.x+p.w/2))<p.w/2+6&&p.y+p.h>s.y-14&&p.y+p.h<=s.y+4){s.hit=true;g.hurt(false,s.x);if(g.mode==='playing')g.push(Math.sign(s.vx),s.x);}}
 f.shocks=f.shocks.filter(s=>s.t<.55&&!s.hit);
}
function spawnStreams(g,dt){
 const b=g.boss,f=b.fight,r=rooms[b.room];f.streamClock=(f.streamClock||0)-dt;if(f.streamClock>0)return;f.streamClock=.14;
 const mouth={x:b.x+b.w/2,y:b.y+b.h*.6};
 for(const k of f.sources){const x=r.x+k,y=surfaceAt(g,x)-6,dx=mouth.x-x,dy=mouth.y-y,len=Math.hypot(dx,dy)||1;f.streams.push({x,y,vx:dx/len*STREAM_SPEED,vy:dy/len*STREAM_SPEED,t:0,life:len/STREAM_SPEED,frame:f.streams.length%6});}
}
// ——— The fight ———
function goNext(g){
 const b=g.boss,f=b.fight,phase=spreaderPhase(b);
 if(phase!==f.phase){f.phase=phase;b.phase=phase==='air'?1:phase==='ground'?2:3;g.emit('bossPhase',{boss:b.id,phase:b.phase,name:phasePlans.spreader[b.phase-1][0]});summonServants(g);}
 if(phase==='air'){f.passes=BOMB_PASSES;setMode(b,'enter',.8);}
 else if(phase==='ground'){f.dashes=0;setMode(b,'dive',.8);}
 else{f.dives=0;setMode(b,'ascend',.7);}
}
// Glide at a cruising speed with soft starts and stops; the mode lasts at least as long as the flight.
function glide(b,to,speed,min){const f=b.fight;if(!f.from){f.from={x:b.x,y:b.y};f.dur=Math.max(min,Math.hypot(to.x-b.x,to.y-b.y)/speed);f.timer=Math.max(f.timer,f.dur);}const k=clamp(f.elapsed/f.dur,0,1),e=k*k*(3-2*k);b.x=f.from.x+(to.x-f.from.x)*e;b.y=f.from.y+(to.y-f.from.y)*e;}
function fly(b,to,t){const f=b.fight;if(!f.from)f.from={x:b.x,y:b.y};const k=clamp(t,0,1),e=k*k*(3-2*k);b.x=f.from.x+(to.x-f.from.x)*e;b.y=f.from.y+(to.y-f.from.y)*e;}
export function stepSpreader(g,dt){
 const b=g.boss,f=fight(b),p=g.player,r=rooms[b.room],px=p.x+p.w/2;
 f.timer-=dt;f.elapsed=(f.elapsed||0)+dt;stepProjectiles(g,dt);b.phase=f.phase==='air'?1:f.phase==='ground'?2:3;b.phaseName=phasePlans.spreader[b.phase-1][0];
 if(!f.relaysCleared){f.relaysCleared=true;g.relays.filter(d=>d.room===b.room).forEach(d=>{d.hp=0;d.breakTime=.45;});summonServants(g);g.emit('bossPhase',{boss:b.id,phase:1,name:phasePlans.spreader[0][0]});}
 b.state=OPENINGS.includes(f.mode)?'recover':['windup','aim','collect'].includes(f.mode)?'windup':'casting';
 switch(f.mode){
  case 'enter':{if(f.side===undefined||f.elapsed<=dt)f.side=px<r.x+r.width/2?1:-1;glide(b,{x:edgeX(g,-f.side),y:FLY_Y},420,.8);b.dir=f.side;
   if(f.timer<=0){setMode(b,'bombing',PASS_TIME);f.startX=b.x;f.dropDistance=0;g.emit('bossWarning',{boss:b.id,ability:'rain',x:b.x,y:b.y});}return;}
  case 'bombing':{const endX=edgeX(g,f.side),u=clamp(f.elapsed/PASS_TIME,0,1),t=u-Math.sin(2*Math.PI*u)/(2*Math.PI),x=f.startX+(endX-f.startX)*t;f.dropDistance+=Math.abs(x-b.x);b.x=x;b.y=FLY_Y+Math.sin(f.elapsed*5)*6;b.dir=f.side;b.ability='rain';
   while(f.dropDistance>=BUNDLE_SPACING){f.dropDistance-=BUNDLE_SPACING;dropBundle(g,b);}
   if(f.timer<=0){f.passes--;if(f.passes>0){f.side*=-1;setMode(b,'turn',TURN);}else if(f.phase==='air'){setMode(b,'collect',COLLECT);f.sources=COLLECT_SOURCES;g.emit('bossWarning',{boss:b.id,ability:'collect',x:b.x,y:b.y});}else if(f.phase==='ground'){f.dashes=0;setMode(b,'dive',.8);}else{f.dives=0;setMode(b,'aim',AIM);}}return;}
  case 'turn':{if(f.turnX===undefined)f.turnX=b.x;const k=clamp(f.elapsed/TURN,0,1);b.dir=k<.5?-f.side:f.side;b.x=f.turnX-f.side*Math.sin(k*Math.PI)*36;b.y=FLY_Y-Math.sin(k*Math.PI)*30;if(f.timer<=0){b.x=f.turnX;b.y=FLY_Y;f.turnX=undefined;setMode(b,'bombing',PASS_TIME);f.startX=b.x;f.dropDistance=0;}return;}
  case 'collect':{glide(b,{x:r.x+r.width/2-b.w/2,y:FLY_Y+20},380,.6);spawnStreams(g,dt);if(f.timer<=0){f.streams=[];
    // Overloaded, he sinks beside Uma, onto the surface she stands on.
    f.sinkTo=sinkSpot(g);setMode(b,'sink',SINK);g.emit('spreaderOverload',{x:b.x,y:b.y});}return;}
  case 'sink':{fly(b,f.sinkTo,f.elapsed/SINK);b.dir=px<b.x+b.w/2?-1:1;if(f.timer<=0)setMode(b,'heavy',HEAVY);return;}
  case 'heavy':{b.dir=px<b.x+b.w/2?-1:1;if(f.timer<=0)setMode(b,'rise',.7);return;}
  case 'rise':{glide(b,{x:b.x,y:FLY_Y},260,.7);if(f.timer<=0)goNext(g);return;}
  case 'dive':{if(!f.diveTo){const far=px<r.x+r.width/2?1:-1;f.diveTo={x:edgeX(g,far),y:FLOOR_Y-b.h};f.dashDir=-far;}fly(b,f.diveTo,f.elapsed/.8);b.dir=f.dashDir;
   if(f.timer<=0){b.x=f.diveTo.x;b.y=f.diveTo.y;f.diveTo=null;setMode(b,'landed',.4);g.emit('bossLand',{boss:b.id,x:b.x,y:b.y});}return;}
  case 'landed':{if(f.timer<=0)beginWindup(g);return;}
  case 'windup':{b.dir=f.dashDir;if(f.timer<=0){f.dashTarget=clamp(px+f.dashDir*OVERSHOOT-b.w/2,r.x+EDGE,r.end-EDGE-b.w);if((f.dashTarget-b.x)*f.dashDir<60)f.dashTarget=clamp(b.x+f.dashDir*160,r.x+EDGE,r.end-EDGE-b.w);setMode(b,'dash',3);f.dashHit=false;g.emit('bossCast',{boss:b.id,ability:'dash',x:b.x,y:b.y});}return;}
  case 'dash':{b.ability='dash';b.x+=f.dashDir*DASH_SPEED*dt;f.trail=(f.trail||0)+dt;
   const box={x:b.x+8,y:FLOOR_Y-DASH_HITBOX.h,w:b.w-16,h:DASH_HITBOX.h};
   if(!f.dashHit&&p.dash===0&&g.overlap(p,box)){f.dashHit=true;g.hurt(false,b.x+b.w/2);if(g.mode==='playing')g.push(f.dashDir,b.x+b.w/2);}
   if(f.dashDir>0?b.x>=f.dashTarget:b.x<=f.dashTarget){b.x=f.dashTarget;f.dashes++;setMode(b,'crash',SKID);g.emit('spreaderCrash',{x:b.x+b.w/2,y:FLOOR_Y});}return;}
  case 'crash':{if(f.timer<=0)setMode(b,'stunned',STUN);return;}
  case 'stunned':{if(f.timer<=0){if(spreaderPhase(b)!=='ground'){setMode(b,'takeoff',.7);}else if(f.dashes<DASHES)beginWindup(g);else setMode(b,'takeoff',.7);}return;}
  case 'takeoff':{glide(b,{x:b.x,y:FLY_Y},300,.7);if(f.timer<=0){const phase=spreaderPhase(b);if(phase!==f.phase)goNext(g);else{f.passes=1;f.side=px<r.x+r.width/2?1:-1;setMode(b,'enter',.6);}}return;}
  case 'ascend':{glide(b,{x:b.x,y:FLY_Y},300,.7);if(f.timer<=0)setMode(b,'aim',AIM);return;}
  case 'aim':{const tx=clamp(px-b.w/2,r.x+EDGE,r.end-EDGE-b.w);if(f.timer>AIM_LOCK)b.x+=(tx-b.x)*Math.min(1,dt*6);b.y+=(FLY_Y-b.y)*Math.min(1,dt*6);f.aimX=b.x+b.w/2;f.aimY=surfaceAt(g,f.aimX);
   if(f.elapsed<=dt)g.emit('bossWarning',{boss:b.id,ability:'spear',x:f.aimX,y:f.aimY});if(f.timer<=0)setMode(b,'spear',2);return;}
  case 'spear':{b.y+=SPEAR_SPEED*dt;b.x=f.aimX-b.w/2;if(b.y+b.h>=f.aimY){b.y=f.aimY-b.h;f.dives++;
    if(p.dash===0&&Math.abs(px-f.aimX)<44&&Math.abs(p.y+p.h-f.aimY)<70){g.hurt(false,f.aimX);}
    for(const dir of[-1,1])f.shocks.push({x:f.aimX+dir*30,y:f.aimY,vx:dir*230,t:0});g.emit('spreaderImpact',{x:f.aimX,y:f.aimY});setMode(b,'stuck',STUCK);}return;}
  case 'stuck':{if(f.timer<=0)setMode(b,'pull',.45);return;}
  case 'pull':{glide(b,{x:b.x,y:FLY_Y},520,.45);if(f.timer<=0){if(spreaderPhase(b)!=='spear')goNext(g);else if(f.dives<DIVES)setMode(b,'aim',AIM);else{f.passes=1;f.side=px<r.x+r.width/2?1:-1;setMode(b,'enter',.6);}}return;}
 }
}
function beginWindup(g){const b=g.boss,f=b.fight,px=g.player.x+g.player.w/2;f.dashDir=px<b.x+b.w/2?-1:1;setMode(b,'windup',WINDUP);g.emit('bossWarning',{boss:b.id,ability:'dash',x:b.x,y:b.y});}
// Puts the boss into the opening of his current phase (tests and scripted scenes).
export function exposeSpreader(g){const b=g.boss,f=fight(b),phase=spreaderPhase(b);f.phase=phase;b.cooldown=0;
 if(phase==='air'){b.y=FLOOR_Y-b.h;setMode(b,'heavy',HEAVY);}else if(phase==='ground'){f.dashDir=f.dashDir||-1;b.y=FLOOR_Y-b.h;setMode(b,'stunned',STUN);}else{f.aimX=b.x+b.w/2;f.aimY=FLOOR_Y;b.y=FLOOR_Y-b.h;setMode(b,'stuck',STUCK);}return b;}
// One paw swing per opening; a powered paw deals 2.
export function damageSpreader(g,amount){
 const b=g.boss,f=b.fight;if(!b.active||b.hp<=0||!spreaderExposed(b))return false;
 const before=spreaderPhase(b);f.hitThisWindow=true;b.hp=Math.max(0,b.hp-Math.max(1,amount));b.hurtTime=.35;b.cooldown=.3;g.emit('bossHit',{x:b.x+b.w/2,y:b.y+b.h-14,boss:b.id});
 if(b.hp===0){f.bundles=[];f.streams=[];f.shocks=[];g.bolts=[];for(const e of g.enemies)if(e.bossOwnerId===b.id&&!e.dead){e.dead=true;e.hp=0;e.deathTime=.3;}g.bossDefeated();return true;}
 // A hit cuts the opening short; crossing a phase boundary moves straight on.
 f.timer=Math.min(f.timer,spreaderPhase(b)!==before?.35:.6);
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
