// Simulation in logical pixels. Independent of the browser and renderer.
export const WIDTH = 480, HEIGHT = 270, WORLD = 2550;
export const platforms = [
  [0,215,235],[285,205,160],[490,181,150],[680,211,190],
  [920,190,160],[1125,211,215],[1380,185,180],[1600,210,180],
  [1820,180,160],[2020,203,160],[2210,215,340],
  [130,151,70],[751,148,65],[1230,146,70],[1680,145,65],[2100,139,65]
].map(([x,y,w])=>({x,y,w}));
export function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
export class Game {
  constructor(){this.reset();}
  reset(){
    this.mode='ready';this.time=0;this.clock=150;this.fish=0;this.kills=0;this.lives=3;this.camera=0;this.checkpoint=0;
    this.player={x:42,y:180,w:16,h:25,vx:0,vy:0,dir:1,grounded:false,coyote:0,jumpBuffer:0,inv:0,attack:0,cooldown:0};
    this.enemies=[1,2,3,4,6,7,8,9].map((p,i)=>({x:platforms[p].x+45,y:platforms[p].y-16,w:21,h:16,origin:platforms[p].x+12,end:platforms[p].x+platforms[p].w-32,dir:i%2?1:-1,speed:19+i*2,dead:false}));
    this.fishes=platforms.flatMap((p,i)=>[.3,.66].map((t,j)=>({x:p.x+p.w*t,y:p.y-34-(j%2)*9,taken:false})));
    this.boss={x:2410,y:155,w:49,h:60,hp:5,cooldown:0,timer:1.6};this.bolts=[];this.events=[];
  }
  emit(type,data={}){this.events.push({type,...data});}
  start(){this.reset();this.mode='playing';this.emit('start');}
  hurt(fall=false){
    const p=this.player;if(this.mode!=='playing'||(p.inv>0&&!fall))return;
    this.lives--;this.emit('hurt');
    if(this.lives<=0){this.mode='lost';this.emit('lost');return;}
    p.inv=2;p.vy=-140;p.vx=-p.dir*80;
    if(fall){p.x=this.checkpoint?1150:42;p.y=this.checkpoint?165:175;p.vx=0;p.vy=0;this.camera=Math.max(0,p.x-130);}
  }
  step(dt,input={}){
    if(this.mode!=='playing')return;
    dt=Math.min(dt,1/30);this.time+=dt;this.clock=Math.max(0,this.clock-dt);
    if(this.clock===0){this.mode='lost';this.emit('lost');return;}
    const p=this.player;
    p.inv=Math.max(0,p.inv-dt);p.cooldown=Math.max(0,p.cooldown-dt);p.attack=Math.max(0,p.attack-dt);
    p.coyote=p.grounded?.1:Math.max(0,p.coyote-dt);
    p.jumpBuffer=input.jump?.13:Math.max(0,p.jumpBuffer-dt);
    const axis=(input.right?1:0)-(input.left?1:0);
    p.vx=axis*110;if(axis)p.dir=axis;
    if(p.jumpBuffer>0&&p.coyote>0){p.vy=-285;p.grounded=false;p.coyote=0;p.jumpBuffer=0;this.emit('jump');}
    if(input.attack&&p.cooldown===0){p.attack=.2;p.cooldown=.34;this.emit('swat');}
    const prevBottom=p.y+p.h;
    p.vy=Math.min(p.vy+760*dt,400);p.x=Math.max(0,Math.min(WORLD-p.w,p.x+p.vx*dt));p.y+=p.vy*dt;p.grounded=false;
    if(p.vy>=0)for(const s of platforms){if(p.x+p.w>s.x+1&&p.x<s.x+s.w-1&&prevBottom<=s.y+1&&p.y+p.h>=s.y){p.y=s.y-p.h;p.vy=0;p.grounded=true;}}
    if(p.y>HEIGHT+30){this.hurt(true);return;}
    if(p.x>1140&&!this.checkpoint){this.checkpoint=1;this.emit('checkpoint');}
    const paw={x:p.dir>0?p.x+8:p.x-24,y:p.y-3,w:34,h:32};
    for(const e of this.enemies){
      if(e.dead)continue;
      e.x+=e.speed*e.dir*dt;if(e.x<e.origin||e.x>e.end){e.dir*=-1;e.x=Math.max(e.origin,Math.min(e.end,e.x));}
      if(p.attack>0&&overlap(paw,e)){e.dead=true;this.kills++;this.emit('pop',{x:e.x,y:e.y});continue;}
      if(overlap(p,e)){
        if(p.vy>0&&prevBottom<e.y+8){e.dead=true;this.kills++;p.vy=-205;this.emit('pop',{x:e.x,y:e.y});}
        else this.hurt();
      }
    }
    for(const f of this.fishes){if(!f.taken&&Math.abs(p.x+8-f.x)<17&&Math.abs(p.y+13-f.y)<22){f.taken=true;this.fish++;this.emit('fish',{x:f.x,y:f.y});}}
    const b=this.boss;b.cooldown=Math.max(0,b.cooldown-dt);
    if(b.hp>0&&p.x>2150){
      b.timer-=dt;
      if(b.timer<=0){b.timer=1.65;this.bolts.push({x:b.x,y:192,w:10,h:10,vx:-95});this.emit('bolt');}
      if(p.attack>0&&b.cooldown===0&&overlap(paw,b)){b.hp--;b.cooldown=.65;this.emit('bossHit',{x:b.x,y:b.y});if(!b.hp){this.mode='won';this.emit('won');}}
      if(overlap(p,b))this.hurt();
    }
    for(const bolt of this.bolts){bolt.x+=bolt.vx*dt;if(p.attack>0&&overlap(paw,bolt)){bolt.dead=true;this.emit('pop',{x:bolt.x,y:bolt.y});}else if(overlap(p,bolt)){bolt.dead=true;this.hurt();}}
    this.bolts=this.bolts.filter(bolt=>!bolt.dead&&bolt.x>p.x-520);
    this.camera=Math.max(0,Math.min(WORLD-WIDTH,p.x-WIDTH*.32));
  }
}
