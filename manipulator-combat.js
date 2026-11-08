import {rooms} from './level.js?v=0.21.5';
import {phasePlans} from './boss-phases.js?v=0.21.5';
import {solidSurfaces} from './terrain.js?v=0.21.5';
// «Монтаж»: the Manipulator films the fight in three phases of two hits (each paw hit deals 3 of 18).
// 1 «Панорама»: the camera rides a crane that rolls along the dolly track behind the stage (it never hurts) and
//   pans a slanted beam across the stage in bursts. The beam stops on the first surface it meets: the permanent docks cast a safe shadow, the
//   studio platforms it touches burn out. After the pan the crane lowers the camera onto a dock: it smokes.
// 2 «Стоп-кадр»: the camera leaves the crane. A viewfinder follows Uma and snaps a stop-frame; scissors cut
//   the film-strip platforms. After two snaps the camera ejects its reel and stands open without it.
// 3 «Проектор»: the camera becomes a projector. It projects neon platforms; only the ones with a shadow are
//   real. A laser across the stage, then the lamp goes dark for a reel change — the opening.
export const MANIPULATOR_HP=18,HIT=3,PHASE_HP=6;
export const STUDIO_DOCKS=[1,2,3];
export const STRIPS=[6,7,8,9,10,11,12,13,14,15,16,17];
// The crane: dolly on the track at floor level, column, arm of ARM px from the pivot.
export const TRACK_Y=422,PIVOT_H=140,ARM=300,DOLLY={w:110,h:48},CLAW=66;
export const PAN_TIP_Y=40,BEAM_ANGLE=36*Math.PI/180,ROLL_SPEED=320,PAN_SPEED=220,AIM=1,OVERHEAT=2.6,LOWER=.7,RAISE=.6,TRACK_MARGIN=40;
export const FRAME=1.6,FRAME_LOCK=.45,SNAP=.55,VIEWFINDER=96,SNAPS=2,EJECT=.5,DEVELOP=2.4,WARP=.9;
export const SCISSORS_EVERY=2.6,SCISSORS_AIM=.9,CUT_GAP=2.2,MAX_CUTS=3;
export const PROJECT=1.4,CHARGE=1,BEAM=.7,DARK=2.4;
export const OPENINGS=['overheat','develop','dark'];
// Phase 3 decoys: projected platforms with no body (local x, y, width).
export const DECOYS=[[600,300,96],[1215,282,96],[880,170,100],[400,150,100],[1440,160,90],[1100,140,90]];
// Strips that keep each dock reachable stay real in phase 3.
const ROUTES={1:[6,7,13,14],2:[14,9,10,15,11,12],3:[6,17,8]};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function manipulatorPhase(b){return b.hp>MANIPULATOR_HP-PHASE_HP?1:b.hp>MANIPULATOR_HP-2*PHASE_HP?2:3;}
export function createStudioFight(){return {phase:1,mode:'intro',timer:1.2,elapsed:0,relocations:0,beam:null,snaps:0,dock:0,crane:null,viewfinder:null,photo:null,scissors:null,scissorsClock:SCISSORS_EVERY,cuts:{},taped:{},fakes:[],decoys:[],reel:0,hitThisWindow:false,scorches:[]};}
export function studioDock(g,index){return g.platforms.find(s=>s.room===6&&s.index===STUDIO_DOCKS[index]);}
export function manipulatorExposed(b){const n=b.studio;return !!n&&OPENINGS.includes(n.mode)&&!n.hitThisWindow;}
function setMode(g,mode,timer){const b=g.boss,n=b.studio;n.mode=mode;n.timer=timer;n.elapsed=0;if(OPENINGS.includes(mode))n.hitThisWindow=false;
 b.state=OPENINGS.includes(mode)?'recover':['aim','frame','charge','project'].includes(mode)?'windup':mode==='warp'?'shift':'casting';
 b.ability=mode==='pan'?'pan':mode==='snap'||mode==='frame'?'snap':mode==='beam'||mode==='charge'?'beam':null;b.phased=mode==='warp';}
function onDock(g,index){const b=g.boss,s=studioDock(g,index);b.studio.dock=index;b.platformIndex=s.index;b.x=s.x+(s.w-b.w)/2;b.y=s.y-b.h;}
function nearestDock(g){const px=g.player.x+g.player.w/2,py=g.player.y;let best=0,score=1e9;for(let i=0;i<3;i++){const s=studioDock(g,i),d=Math.abs(s.x+s.w/2-px)+Math.abs(s.y-py)*.6;if(d<score){score=d;best=i;}}return best;}
function nextDock(g){const n=g.boss.studio,px=g.player.x+g.player.w/2;
 // The next dock is the other one farther from Uma, so she has to cross the stage.
 const others=[0,1,2].filter(i=>i!==n.dock).sort((a,b)=>Math.abs(studioDock(g,b).x-px)-Math.abs(studioDock(g,a).x-px));return others[0];}

// ——— Crane geometry ———
export function cranePivot(c){return {x:c.x,y:TRACK_Y-PIVOT_H};}
export function craneTip(c){const p=cranePivot(c);return {x:p.x+c.dir*ARM*Math.cos(c.angle),y:p.y-ARM*Math.sin(c.angle)};}
const angleFor=tipY=>Math.asin(clamp((TRACK_Y-PIVOT_H-tipY)/ARM,-1,1));
export const PAN_ANGLE=angleFor(PAN_TIP_Y);
function hangCamera(g){const b=g.boss,c=b.studio.crane,t=craneTip(c);b.x=t.x-b.w/2;b.y=t.y+CLAW;b.dir=c.dir;}
export function dollyBox(c){return {x:c.x-DOLLY.w/2,y:TRACK_Y-DOLLY.h,w:DOLLY.w,h:DOLLY.h};}
function parkFor(g,index){const b=g.boss,r=rooms[6],s=studioDock(g,index),tipY=s.y-b.h-CLAW,a=angleFor(tipY),reach=ARM*Math.cos(a),cx=s.x+s.w/2;
 const dir=cx-reach>=r.x+TRACK_MARGIN?1:-1;return {x:clamp(cx-dir*reach,r.x+TRACK_MARGIN,r.end-TRACK_MARGIN),dir,angle:a};}
function panStart(g){const n=g.boss.studio,c=n.crane,r=rooms[6],reach=ARM*Math.cos(PAN_ANGLE);
 const fromLeft=Math.abs(c.x-r.x)<Math.abs(c.x-r.end),dir=fromLeft?1:-1;
 return {from:fromLeft?r.x+TRACK_MARGIN:r.end-TRACK_MARGIN,to:fromLeft?r.end-TRACK_MARGIN-reach:r.x+TRACK_MARGIN+reach,dir};}
function moveCrane(c,target,dt,speed){const d=target.x-c.x,step=speed*dt;c.x=Math.abs(d)<=step?target.x:c.x+Math.sign(d)*step;const da=target.angle-c.angle;c.angle+=clamp(da,-1.4*dt,1.4*dt);return Math.abs(d)<=step&&Math.abs(da)<.01;}
// The beam leaves the lens at BEAM_ANGLE below the horizon and stops on the first surface it meets.
// The lens of the tilted camera pose (camera sheet frame 5), so the beam leaves exactly where the painted beam starts.
export function lensPoint(g){const b=g.boss;return {x:b.x+b.w/2+b.dir*16,y:b.y+b.h-51};}
// The pan beam fires in bursts: while the shutter is closed Uma can slip past it.
export const BURST=.8,SHUTTER=.55;
export function beamLive(n){return n.mode==='pan'&&(n.elapsed%(BURST+SHUTTER))<BURST;}
export function castBeam(g){
 const b=g.boss,l=lensPoint(g),dx=b.dir*Math.cos(BEAM_ANGLE),dy=Math.sin(BEAM_ANGLE);let best=(480-l.y)/dy,hit=null;
 for(const s of solidSurfaces(g)){if(s.room!==6||s.y<=l.y+1)continue;const t=(s.y-l.y)/dy,x=l.x+dx*t;if(x>=s.x&&x<=s.x+s.w&&t<best){best=t;hit=s;}}
 return {x1:l.x,y1:l.y,x2:l.x+dx*best,y2:l.y+dy*best,surface:hit};
}
// Segment against a box (Liang–Barsky), the box grown by the beam's half-thickness.
export function segmentHits(seg,box,pad=5){
 let t0=0,t1=1;const dx=seg.x2-seg.x1,dy=seg.y2-seg.y1,x0=box.x-pad,x1=box.x+box.w+pad,y0=box.y-pad,y1=box.y+box.h+pad;
 for(const [p,q] of [[-dx,seg.x1-x0],[dx,x1-seg.x1],[-dy,seg.y1-y0],[dy,y1-seg.y1]]){if(p===0){if(q<0)return false;continue;}const r=q/p;if(p<0){if(r>t1)return false;if(r>t0)t0=r;}else{if(r<t0)return false;if(r<t1)t1=r;}}
 return true;
}

// ——— Phase 3 reels ———
function shuffleReel(g){
 const n=g.boss.studio,p=g.player,keep=new Set(ROUTES[STUDIO_DOCKS[n.dock]]||[]),pool=STRIPS.filter(i=>!keep.has(i)&&!(p.grounded&&p.supportId==='6:'+i));n.reel++;
 const pick=(list,k)=>{const out=[],a=[...list];for(let i=0;i<k&&a.length;i++){const j=Math.floor(((n.reel*7919+i*104729)%997)/997*a.length);out.push(a.splice(j,1)[0]);}return out;};
 n.fakes=pick(pool,3);n.decoys=pick(DECOYS.map((_,i)=>i),3);g.emit('reelSwap',{x:g.boss.x,y:g.boss.y});
}

// ——— The fight ———
function hurtUma(g,x){const was=g.player.inv;g.hurt(false,x);return g.player.inv>was;}
function beginPhase(g,phase){
 const b=g.boss,n=b.studio;n.phase=phase;b.phase=phase;b.phaseName=phasePlans.manipulator[phase-1][0];g.emit('bossPhase',{boss:b.id,phase,name:b.phaseName});
 n.beam=null;n.viewfinder=null;n.scissors=null;n.snaps=0;
 if(phase===2)setMode(g,'detach',1);else if(phase===3){setMode(g,'transform',1.2);}
}
export function stepManipulator(g,dt){
 const b=g.boss,n=b.studio;if(!n)return;n.timer-=dt;n.elapsed+=dt;b.phase=n.phase;b.phaseName=phasePlans.manipulator[n.phase-1][0];
 n.photo&&(n.photo.t+=dt);if(n.photo&&n.photo.t>.7)n.photo=null;for(const s of n.scorches)s.t+=dt;n.scorches=n.scorches.filter(s=>s.t<.6);
 if(settlePhase(g))return;
 // Health set from outside (level select, scripted scenes) moves the fight on as well.
 if(!n.pendingPhase&&manipulatorPhase(b)>n.phase){beginPhase(g,manipulatorPhase(b));return;}
 if(n.mode==='warp')stepWarp(g);else if(n.phase===1)stepCrane(g,dt);else if(n.phase===2)stepStopFrame(g,dt);else stepProjector(g,dt);
 if(n.phase>1&&n.crane){const r=rooms[6];c_roll(n.crane,{x:r.x+TRACK_MARGIN,angle:1.05},dt);}
 // A rolling dolly runs Uma over on the floor.
}
function stepCrane(g,dt){
 const b=g.boss,n=b.studio,r=rooms[6];
 if(!n.crane){const park=parkFor(g,0);n.crane={...park,moving:false};onDock(g,0);}
 const c=n.crane;c.moving=false;
 switch(n.mode){
  case 'intro':case 'overheat':{hangCamera(g);if(n.timer<=0){setMode(g,'raise',RAISE);g.emit('craneRaise',{x:b.x,y:b.y});}return;}
  case 'raise':{c.angle+=(PAN_ANGLE-c.angle)*Math.min(1,dt/Math.max(.05,n.timer+dt));hangCamera(g);if(n.timer<=0){c.angle=PAN_ANGLE;n.pan=panStart(g);setMode(g,'roll',6);}return;}
  case 'roll':{c.moving=true;const done=moveCrane(c,{x:n.pan.from,angle:PAN_ANGLE},dt,ROLL_SPEED);if(Math.abs(c.x-n.pan.from)>20)c.dir=Math.sign(n.pan.from-c.x)||c.dir;hangCamera(g);
   if(done||n.timer<=0){c.x=n.pan.from;c.dir=n.pan.dir;hangCamera(g);setMode(g,'aim',AIM);n.beam=castBeam(g);g.emit('bossWarning',{boss:b.id,ability:'pan',x:b.x,y:b.y});}return;}
  case 'aim':{hangCamera(g);n.beam=castBeam(g);if(n.timer<=0){setMode(g,'pan',12);g.emit('bossCast',{boss:b.id,ability:'pan',x:b.x,y:b.y});}return;}
  case 'pan':{c.moving=true;const done=moveCrane(c,{x:n.pan.to,angle:PAN_ANGLE},dt,PAN_SPEED);hangCamera(g);n.beam=castBeam(g);const s=n.beam.surface,live=beamLive(n);n.beam.live=live;
   if(live&&s&&s.studioPlatform&&s.studioPhase==='solid'){s.studioPhase='warning';s.studioTimer=.45;s.burned=true;g.emit('cutWarning',{x:n.beam.x2,y:s.y,enemyType:'manipulator'});}
   if(live&&Math.floor(n.elapsed*12)!==Math.floor((n.elapsed-dt)*12))n.scorches.push({x:n.beam.x2,y:n.beam.y2,t:0});
   if(live&&!g.player.dash&&segmentHits(n.beam,g.player))hurtUma(g,n.beam.x2);
   if(done||n.timer<=0){n.beam=null;n.target=nearestDock(g);n.park=parkFor(g,n.target);setMode(g,'park',6);}return;}
  case 'park':{c.moving=true;const done=moveCrane(c,n.park,dt,ROLL_SPEED);if(Math.abs(c.x-n.park.x)>2){c.dir=Math.abs(n.park.x-c.x)>140?Math.sign(n.park.x-c.x):n.park.dir;}else c.dir=n.park.dir;hangCamera(g);
   if(done||n.timer<=0){Object.assign(c,n.park);onDock(g,n.target);b.dir=c.dir;setMode(g,'overheat',OVERHEAT);g.emit('cameraOverheat',{x:b.x,y:b.y});}return;}
 }
}
function stepStopFrame(g,dt){
 const b=g.boss,n=b.studio,p=g.player,px=p.x+p.w/2,py=p.y+p.h/2;
 stepScissors(g,dt);b.dir=px<b.x+b.w/2?-1:1;
 switch(n.mode){
  case 'detach':{if(n.timer<=0){warpTo(g,nextDock(g));}return;}
  case 'frame':{const v=n.viewfinder;if(n.timer>FRAME_LOCK){v.x+=(px-v.x)*Math.min(1,dt*7);v.y+=(py-v.y)*Math.min(1,dt*7);}
   if(n.timer<=0){setMode(g,'snap',SNAP);n.snaps++;n.photo={x:v.x,y:v.y,t:0};g.emit('stopFrame',{x:v.x,y:v.y});
    const box={x:v.x-VIEWFINDER/2,y:v.y-VIEWFINDER/2,w:VIEWFINDER,h:VIEWFINDER};
    if(!p.dash&&px>box.x&&px<box.x+box.w&&py>box.y&&py<box.y+box.h){hurtUma(g,v.x);p.vx=0;}}
   return;}
  case 'snap':{if(n.timer<=0){n.viewfinder=null;if(n.snaps>=SNAPS){n.snaps=0;setMode(g,'eject',EJECT);g.emit('reelEject',{x:b.x,y:b.y});}else beginFrame(g);}return;}
  case 'eject':{if(n.timer<=0)setMode(g,'develop',DEVELOP);return;}
  case 'develop':{if(n.timer<=0)warpTo(g,nextDock(g));return;}
 }
}
function stepWarp(g){const b=g.boss,n=b.studio;
 if(n.timer<WARP/2&&!n.arrived){onDock(g,n.to);n.arrived=true;g.emit('teleportIn',{x:b.x,y:b.y,enemyType:'manipulator'});}
 if(n.timer<=0){onDock(g,n.to);n.arrived=false;if(n.phase===1){n.crane={...parkFor(g,n.to),moving:false};hangCamera(g);setMode(g,'overheat',OVERHEAT);}else if(n.phase===2)beginFrame(g);else{setMode(g,'project',PROJECT);shuffleReel(g);}}}
function settlePhase(g){const n=g.boss.studio;if(n.pendingPhase&&n.timer<=0){const phase=n.pendingPhase;n.pendingPhase=null;beginPhase(g,phase);return true;}return false;}
function c_roll(c,target,dt){c.moving=Math.abs(target.x-c.x)>1;moveCrane(c,target,dt,ROLL_SPEED*.6);}
function beginFrame(g){const n=g.boss.studio,p=g.player;n.viewfinder={x:p.x+p.w/2,y:p.y+p.h/2};setMode(g,'frame',FRAME);g.emit('bossWarning',{boss:'manipulator',ability:'snap',x:p.x,y:p.y});}
function warpTo(g,index){const b=g.boss,n=b.studio;n.to=index;n.arrived=false;n.relocations++;n.beam=null;setMode(g,'warp',WARP);g.emit('bossShift',{boss:b.id,x:studioDock(g,index).x,y:studioDock(g,index).y});}
// Scissors pick the strip Uma stands on (or the nearest one) and cut it out for a while; it comes back taped.
function stepScissors(g,dt){
 const n=g.boss.studio,p=g.player,px=p.x+p.w/2;
 if(n.scissors){const s=n.scissors;s.timer-=dt;if(s.timer<=0){const strip=g.platforms.find(q=>q.room===6&&q.index===s.index);
   if(strip&&strip.studioPhase==='solid'){strip.studioPhase='gap';strip.studioTimer=CUT_GAP;n.cuts[s.index]=0;g.emit('filmCut',{x:s.x,y:strip.y});}n.scissors=null;}return;}
 n.scissorsClock-=dt;if(n.scissorsClock>0)return;n.scissorsClock=SCISSORS_EVERY;
 const strips=g.platforms.filter(s=>s.room===6&&STRIPS.includes(s.index)&&s.studioPhase==='solid');
 if(g.platforms.filter(s=>s.room===6&&STRIPS.includes(s.index)&&['gap','forming'].includes(s.studioPhase)).length>=MAX_CUTS)return;
 const under=strips.find(s=>p.grounded&&p.supportId===s.id),near=strips.filter(s=>Math.abs(s.x+s.w/2-px)<280).sort((a,b)=>Math.abs(a.x+a.w/2-px)-Math.abs(b.x+b.w/2-px))[0],target=under||near;
 if(!target)return;const x=clamp(px,target.x+18,target.x+target.w-18);n.scissors={index:target.index,x,timer:SCISSORS_AIM};g.emit('scissorsAim',{x,y:target.y});
}
function stepProjector(g,dt){
 const b=g.boss,n=b.studio,p=g.player,px=p.x+p.w/2,r=rooms[6];
 if(!['beam','charge'].includes(n.mode))b.dir=px<b.x+b.w/2?-1:1;
 switch(n.mode){
  case 'transform':{if(n.timer<=0){setMode(g,'project',PROJECT);shuffleReel(g);g.emit('projectorOn',{x:b.x,y:b.y});}return;}
  case 'project':{if(n.timer<=0){const lensX=b.dir>0?b.x+b.w-14:b.x+14,edge=b.dir>0?r.end:r.x;n.beam={x:Math.min(lensX,edge),y:b.y+b.h-46,w:Math.abs(edge-lensX),h:12};setMode(g,'charge',CHARGE);g.emit('bossWarning',{boss:b.id,ability:'beam',x:lensX,y:n.beam.y});}return;}
  case 'charge':{if(n.timer<=0){setMode(g,'beam',BEAM);g.emit('bossCast',{boss:b.id,ability:'beam',x:b.x,y:b.y});}return;}
  case 'beam':{if(n.beam&&!p.dash&&g.overlap(p,n.beam))hurtUma(g,b.x+b.w/2);if(n.timer<=0){n.beam=null;setMode(g,'dark',DARK);g.emit('projectorDark',{x:b.x,y:b.y});}return;}
  case 'dark':{if(n.timer<=0)warpTo(g,nextDock(g));return;}
 }
}
// Kept for scripted scenes and tests: the camera hops to the next dock.
export function beginStudioRelocation(g){warpTo(g,(g.boss.studio.dock+1)%3);}
// Opens the current phase (tests and scripted scenes).
export function exposeManipulator(g){
 const b=g.boss,n=b.studio,phase=manipulatorPhase(b);n.phase=phase;b.phase=phase;n.beam=null;n.viewfinder=null;
 if(phase===1){if(!n.crane)n.crane={...parkFor(g,0),moving:false};n.target=n.dock;Object.assign(n.crane,parkFor(g,n.dock));onDock(g,n.dock);b.dir=n.crane.dir;setMode(g,'overheat',OVERHEAT);}
 else{onDock(g,n.dock);if(phase===3&&!n.fakes.length)shuffleReel(g);setMode(g,phase===2?'develop':'dark',phase===2?DEVELOP:DARK);}
 return b;
}
// One paw hit per opening, always 3 damage (a reflected hit from a scripted scene ignores the opening).
export function damageManipulator(g,amount,reflected=false){
 const b=g.boss,n=b.studio;if(!b.active||b.hp<=0||!n)return false;if(!reflected&&!manipulatorExposed(b))return false;
 const before=manipulatorPhase(b);n.hitThisWindow=true;b.hp=Math.max(0,b.hp-Math.max(HIT,amount));b.hurtTime=.3;b.cooldown=.25;g.emit('bossHit',{x:b.x+b.w/2,y:b.y+b.h-14,boss:b.id});
 if(b.hp===0){n.beam=null;n.viewfinder=null;n.scissors=null;g.bolts=[];g.bossDefeated();return true;}
 const phase=manipulatorPhase(b);if(phase!==before){n.timer=Math.min(n.timer,.35);n.pendingPhase=phase;}else n.timer=Math.min(n.timer,.45);
 return true;
}

// ——— Platforms per phase ———
export function stepStudioPlatforms(g,dt){
 if(g.room!==6)return;const b=g.boss,n=b.studio,list=g.platforms.filter(s=>s.room===6&&s.studioPlatform);
 const live=b.active&&b.hp>0&&n;
 for(const s of list)s.intangible=!!(live&&n.phase===3&&n.fakes.includes(s.index));
 if(!live){for(const s of list){s.studioPhase='solid';s.studioTimer=5;}return;}
 if(n.phase===1){
  let missing=list.filter(s=>['gap','forming'].includes(s.studioPhase)&&!s.burnGap).length;
  for(const s of list){
   s.studioPhase??='solid';s.studioTimer??=5+s.index*.33;s.studioTimer-=dt;
   if(s.studioPhase==='solid'&&(g.player.grounded&&g.player.supportId===s.id||s.studioTimer<=0)){s.studioPhase='warning';s.studioTimer=.7;g.emit('cutWarning',{x:s.x+s.w/2,y:s.y,enemyType:'manipulator'});}
   else if(s.studioPhase==='warning'&&s.studioTimer<=0&&(missing<2||s.burned)){s.studioPhase='gap';s.studioTimer=1.15;s.burnGap=!!s.burned;if(!s.burned)missing++;s.burned=false;g.emit('platformCut',{x:s.x+s.w/2,y:s.y});}
   else if(s.studioPhase==='gap'&&s.studioTimer<=0){s.studioPhase='forming';s.studioTimer=.35;}
   else if(s.studioPhase==='forming'&&s.studioTimer<=0){s.studioPhase='solid';s.studioTimer=6+s.index*.17;if(!s.burnGap)missing--;s.burnGap=false;g.emit('platformRestore',{x:s.x+s.w/2,y:s.y});}
  }
 }else if(n.phase===2){
  for(const s of list){if(s.studioPhase==='warning')s.studioPhase='solid';if(!['gap','forming'].includes(s.studioPhase))continue;s.studioTimer-=dt;if(s.index in n.cuts)n.cuts[s.index]+=dt;
   if(s.studioPhase==='gap'&&s.studioTimer<=0){s.studioPhase='forming';s.studioTimer=.35;}
   else if(s.studioPhase==='forming'&&s.studioTimer<=0){s.studioPhase='solid';n.taped[s.index]=true;delete n.cuts[s.index];g.emit('filmTape',{x:s.x+s.w/2,y:s.y});}}
 }else for(const s of list){s.studioPhase='solid';s.studioTimer=5;}
}
