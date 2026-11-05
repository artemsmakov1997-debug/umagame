import {rooms} from './level.js?v=0.21.5';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function spreaderDeck(g){return g.platforms.find(s=>s.room===g.boss.room&&s.index===4);}
export const paperFeeders=[{x:126,y:103,vx:140,vy:137,stopY:272},{x:744,y:215,vx:-95,vy:135,stopY:326}];
export function paperFeederPositions(time){return paperFeeders.map((f,i)=>{const offset=Math.sin(time*Math.PI*2/(i?7.2:6)+i*Math.PI)*(i?38:44);return {...f,offset,y:f.y+offset};});}
function paper(g,x,y,vx,vy,extra={}){g.bolts.push({room:g.room,kind:'paper',visual:'spreader',x,y,w:19,h:17,vx,vy,ttl:3,...extra});}
export function summonServants(g){
 const b=g.boss,r=rooms[b.room],alive=g.enemies.filter(e=>e.bossOwnerId===b.id&&!e.dead),made=[];if(b.phase===2)return made;
 for(const [local,side] of [[b.x-110,-1],[b.x+b.w+35,1],[g.player.x-140,-1],[g.player.x+140,1]]){
  if(alive.length+made.length>=2)break;
  const x=clamp(local,r.x+20,r.end-50),y=clamp(b.phase===1?b.y+60:g.player.y-65,30,350);
  if(Math.hypot(x-g.player.x,y-g.player.y)<90||alive.concat(made).some(e=>Math.hypot(x-e.x,y-e.y)<50))continue;
  const e={id:'servant-'+(++g.tacticalSerial),type:'servant',name:'Прислужник',room:b.room,bossOwnerId:b.id,platformIndex:4,x,y,w:32,h:23,hp:1,maxHp:1,active:true,noticed:true,flying:true,dir:side,state:'patrol',flank:side,timer:.9,spawnTime:.6,arrivalDuration:.6,inv:0,hurtTime:0,lastSwing:-1,dead:false,deathTime:0,walkTime:0};g.enemies.push(e);made.push(e);g.emit('bossSummon',{boss:b.id,enemyType:e.type,x,y});
 }return made;
}
function moveTo(g,s,state,duration){const b=g.boss;b.from={x:b.x,y:b.y};b.to={x:s.x+(s.w-b.w)/2,y:s.y-b.h};b.moveDuration=duration;b.timer=duration;b.state=state;b.platformIndex=s.index;}
export function stepSpreader(g,dt){
 const b=g.boss,s=spreaderDeck(g),r=rooms[b.room],p=g.player;if(!s)return;b.timer-=dt;
 b.feedClock=(b.feedClock||0)+dt;
 if(b.feedClock>=.34){b.feedClock%=.34;for(const f of paperFeederPositions(g.time)){const hit=g.platforms.filter(q=>q.room===b.room&&q.y>f.y+10).map(q=>({q,t:(q.y-f.y)/f.vy})).filter(({q,t})=>{const x=r.x+f.x+f.vx*t;return x+19>q.x&&x<q.x+q.w;}).sort((a,c)=>a.t-c.t)[0];paper(g,r.x+f.x,f.y,f.vx,f.vy,{feeder:true,stopY:hit?.q.y??416});}}
 if(b.phase===1){
  b.x=s.x+(s.w-b.w)/2;b.y=s.y-b.h;b.platformIndex=s.index;b.state='guarding';b.ability='summon';
  if(b.timer<=0){summonServants(g);b.timer=3.4;}
  if(p.grounded&&p.supportId===s.id){
   b.phase=2;b.state='takeoff';b.ability='rain';b.timer=.7;b.from={x:b.x,y:b.y};g.relays.filter(d=>d.room===b.room).forEach(d=>{d.hp=0;d.breakTime=.45;});b.shieldDissolve=.45;g.emit('bossPhase',{boss:b.id,phase:2,name:'Газетная бомбардировка'});
   for(const e of g.enemies)if(e.bossOwnerId===b.id&&!e.dead){e.state='recover';e.timer=2.8;}
  }return;
 }
 if(b.phase===2){
  if(b.state==='takeoff'){b.y=b.from.y-65*clamp(1-b.timer/.7,0,1);if(b.timer<=0){b.state='bombWarning';b.timer=.9;g.emit('bossWarning',{boss:b.id,ability:'rain',x:b.x,y:b.y});}return;}
  if(b.state==='bombWarning'&&b.timer<=0){for(let x=s.x-15;x<s.x+s.w+20;x+=30)paper(g,x,8,0,420,{w:23,h:24,bombardment:true,ttl:1.1});b.bombardments=(b.bombardments||0)+1;b.state='bombWave';b.timer=.8;g.emit('bossCast',{boss:b.id,ability:'rain',x:b.x,y:b.y});return;}
  if(b.state==='bombWave'&&b.timer<=0){moveTo(g,g.platforms.find(q=>q.room===b.room&&q.index===6),'landing',.75);return;}
  if(b.state==='landing'){const t=clamp(1-b.timer/.75,0,1);b.x=b.from.x+(b.to.x-b.from.x)*t;b.y=b.from.y+(b.to.y-b.from.y)*t;if(b.timer<=0){b.phase=3;b.state='recover';b.timer=1.4;b.ability=null;g.emit('bossPhase',{boss:b.id,phase:3,name:'Открытый тираж'});}return;}
  return;
 }
 if(b.state==='moving'){
  const t=clamp(1-b.timer/b.moveDuration,0,1);b.x=b.from.x+(b.to.x-b.from.x)*t;b.y=b.from.y+(b.to.y-b.from.y)*t-Math.sin(t*Math.PI)*35;
  if(b.timer<=0){b.x=b.to.x;b.y=b.to.y;b.state='recover';b.timer=1.3;}return;
 }
 if(b.timer>0)return;
 if(b.state==='windup'){
  const dx=b.aim.x-(b.x+b.w/2),dy=b.aim.y-(b.y+b.h*.5),len=Math.hypot(dx,dy)||1;paper(g,b.x+b.w/2,b.y+b.h*.5,dx/len*190,dy/len*190);summonServants(g);b.state='casting';b.timer=.8;return;
 }
 if(b.state==='casting'){
  const choices=g.platforms.filter(q=>q.room===b.room&&q.index!==b.platformIndex&&q.index!==0&&q.w>=100&&Math.hypot(q.x+q.w/2-b.x-b.w/2,q.y-b.y-b.h)<310).sort((a,c)=>Math.abs(a.x+a.w/2-p.x)-Math.abs(c.x+c.w/2-p.x));
  if(choices.length){moveTo(g,choices[0],'moving',1.1);return;}
 }
 b.state='windup';b.ability='scatter';b.timer=.65;b.aim={x:p.x+p.w/2,y:p.y+p.h/2};b.dir=b.aim.x<b.x?-1:1;g.emit('bossWarning',{boss:b.id,ability:'scatter',x:b.x,y:b.y});
}
export function stepServant(g,e,dt,paw){
 if(e.dead){e.deathTime=Math.max(0,e.deathTime-dt);return;}if(e.spawnTime>0){e.spawnTime=Math.max(0,e.spawnTime-dt);return;}
 e.inv=Math.max(0,e.inv-dt);e.timer-=dt;e.walkTime+=dt;const p=g.player,r=rooms[e.room],dx=p.x+p.w/2-e.x-e.w/2,dy=p.y+12-e.y;
 if(e.state==='patrol'){e.dir=dx<0?-1:1;e.x+=clamp(dx+e.flank*65,-80,80)*dt;e.y+=clamp(p.y-38-e.y,-65,65)*dt;if(Math.abs(dx)<120&&Math.abs(dy)<75&&e.timer<=0){e.state='windup';e.timer=.5;e.aimX=p.x;e.aimY=p.y;}}
 else if(e.state==='windup'&&e.timer<=0){const len=Math.hypot(e.aimX-e.x,e.aimY-e.y)||1;e.vx=(e.aimX-e.x)/len*225;e.vy=(e.aimY-e.y)/len*225;e.state='lunge';e.timer=.3;e.contactHit=false;}
 else if(e.state==='lunge'){e.x+=e.vx*dt;e.y+=e.vy*dt;if(e.timer<=0){e.state='recover';e.timer=1.1;}}
 else if(e.state==='recover'&&e.timer<=0){e.state='patrol';e.timer=.7;}
 e.x=clamp(e.x,r.x+5,r.end-e.w-5);e.y=clamp(e.y,15,390);
 if(p.attack>0&&e.lastSwing!==p.swing&&g.overlap(paw,e)){e.lastSwing=p.swing;g.hitEnemy(e);}
 if(!e.dead&&e.state==='lunge'&&!e.contactHit&&g.overlap(p,e)&&!p.dash&&(p.inv===0||g.testingInvulnerable)){
  e.contactHit=true;g.hurt(false,e.x);const dir=Math.sign(e.vx)||e.dir;g.push(dir,e.x);p.vx=dir*180;p.vy=70;p.knock=.23;p.grounded=false;
 }
}
