import {rooms} from './level.js?v=0.21.5';

export const STUDIO_DOCKS=[1,2,3];
export function createStudioFight(){return {mode:'rest',timer:1.2,relocations:0,beam:null,from:null,to:null};}
function enter(g,mode,timer){const b=g.boss;b.studio.mode=mode;b.studio.timer=timer;b.state=mode==='rest'||mode==='recover'?'recover':mode==='charge'?'windup':mode==='beam'?'casting':mode==='relocate'?'shift':'casting';b.ability=mode==='rewrite'?'rewrite':'beam';}
export function studioDock(g,index){return g.platforms.find(s=>s.room===6&&s.index===STUDIO_DOCKS[index]);}
function place(g,index){const b=g.boss,s=studioDock(g,index);b.dock=index;b.platformIndex=s.index;b.x=s.x+(s.w-b.w)/2;b.y=s.y-b.h;}
export function beginStudioRelocation(g){
 const b=g.boss,n=b.studio;n.from={x:b.x,y:b.y};n.to=(b.dock+1)%3;n.relocations++;n.beam=null;
 b.phased=true;enter(g,'relocate',.9);g.emit('bossShift',{boss:b.id,x:studioDock(g,n.to).x,y:studioDock(g,n.to).y});
}
export function stepManipulator(g,dt){
 const b=g.boss,n=b.studio;if(!n)return;
 const phase=b.hp>b.maxHp*2/3?1:b.hp>b.maxHp/3?2:3;
 if(phase!==b.phase){b.phase=phase;g.emit('bossPhase',{boss:b.id,phase,name:'Перезапись'});}
 if(n.mode==='relocate'){
  n.timer=Math.max(0,n.timer-dt);
  if(n.timer<.45&&!n.arrived){place(g,n.to);n.arrived=true;g.emit('teleportIn',{x:b.x,y:b.y,enemyType:'manipulator'});}
  if(!n.timer){place(g,n.to);n.arrived=false;b.phased=false;enter(g,'recover',1.3);}return;
 }
 place(g,b.dock);
 if(n.mode==='beam'&&n.beam&&g.overlap(g.player,n.beam))g.hurt(false,b.x+b.w/2);
 n.timer-=dt;if(n.timer>0)return;
 if(n.mode==='rest'||n.mode==='recover'){enter(g,'rewrite',.65);g.emit('studioRewrite',{x:b.x,y:b.y});}
 else if(n.mode==='rewrite'){
  b.dir=g.player.x+17<b.x+b.w/2?-1:1;
  const lensX=b.dir>0?b.x+b.w-20:b.x+20,edge=b.dir>0?rooms[6].end:rooms[6].x;
  n.beam={x:Math.min(lensX,edge),y:b.y+b.h-56,w:Math.abs(edge-lensX),h:12};
  enter(g,'charge',1.05);g.emit('bossWarning',{boss:b.id,ability:'beam',x:lensX,y:n.beam.y});
 }else if(n.mode==='charge'){enter(g,'beam',.72);g.emit('bossCast',{boss:b.id,ability:'beam',x:b.x,y:b.y});}
 else if(n.mode==='beam'){n.beam=null;enter(g,'recover',3);}
 else enter(g,'rest',1);
}
export function stepStudioPlatforms(g,dt){
 if(g.room!==6)return;
 let missing=g.platforms.filter(s=>s.room===6&&s.studioPlatform&&['gap','forming'].includes(s.studioPhase)).length;
 for(const s of g.platforms.filter(s=>s.room===6&&s.studioPlatform)){
  s.studioPhase??='solid';s.studioTimer??=5+s.index*.33;
  if(!g.boss.active||g.boss.hp<=0){s.studioPhase='solid';s.studioTimer=5;continue;}
  s.studioTimer-=dt;
  if(s.studioPhase==='solid'&&(g.player.grounded&&g.player.supportId===s.id||s.studioTimer<=0)){
   s.studioPhase='warning';s.studioTimer=.7;g.emit('cutWarning',{x:s.x+s.w/2,y:s.y,enemyType:'manipulator'});
  }else if(s.studioPhase==='warning'&&s.studioTimer<=0&&missing<2){s.studioPhase='gap';s.studioTimer=1.15;missing++;g.emit('platformCut',{x:s.x+s.w/2,y:s.y});}
  else if(s.studioPhase==='gap'&&s.studioTimer<=0){s.studioPhase='forming';s.studioTimer=.35;}
  else if(s.studioPhase==='forming'&&s.studioTimer<=0){s.studioPhase='solid';s.studioTimer=6+s.index*.17;missing--;g.emit('platformRestore',{x:s.x+s.w/2,y:s.y});}
 }
}
