// Collision geometry follows the illustrated desks in assets/newsroom.png.
export const WIDTH = 768, HEIGHT = 480, WORLD = WIDTH;
export const platforms = [
  [0,303,204], [301,300,188], [517,275,251],
  [0,400,244], [301,412,324],
  [0,474,230], [300,474,468],
  [0,169,75], [473,204,134]
].map(([x,y,w])=>({x,y,w}));
export const ladder={x:718,y:275,w:31,h:199};
export function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
export class Game {
  constructor(){this.reset();}
  reset(){
    this.mode='ready';this.time=0;this.clock=150;this.fish=0;this.kills=0;this.lives=3;this.camera=0;this.checkpoint=0;
    this.player={x:45,y:255,w:34,h:48,vx:0,vy:0,dir:1,grounded:true,coyote:0,jumpBuffer:0,inv:0,attack:0,cooldown:0,climbing:false};
    this.enemies=[
      {x:122,y:274,origin:85,end:150,speed:20,dir:-1},
      {x:362,y:271,origin:325,end:413,speed:27,dir:1},
      {x:460,y:125,origin:430,end:550,speed:23,dir:-1,flying:true,baseY:125},
      {x:418,y:383,origin:355,end:550,speed:24,dir:1}
    ].map(e=>({...e,w:48,h:29,dead:false}));
    this.fishes=[
      [114,260],[216,228],[253,207],[290,189],[327,176],[365,165],
      [400,159],[503,221],[562,233],[181,359],[375,368],[570,368]
    ].map(([x,y])=>({x,y,taken:false}));
    this.boss={x:651,y:165,w:88,h:110,hp:5,cooldown:0,timer:1.6};this.bolts=[];this.events=[];
  }
  emit(type,data={}){this.events.push({type,...data});}
  start(){this.reset();this.mode='playing';this.emit('start');}
  hurt(fall=false){
    const p=this.player;if(this.mode!=='playing'||(p.inv>0&&!fall))return;
    this.lives--;this.emit('hurt');
    if(this.lives<=0){this.mode='lost';this.emit('lost');return;}
    p.inv=2;p.vy=-180;
    if(fall){p.x=this.checkpoint?330:45;p.y=this.checkpoint?252:255;p.vx=0;p.vy=0;p.climbing=false;}
  }
  step(dt,input={}){
    if(this.mode!=='playing')return;
    dt=Math.min(dt,1/30);this.time+=dt;this.clock=Math.max(0,this.clock-dt);
    if(this.clock===0){this.mode='lost';this.emit('lost');return;}
    const p=this.player;
    p.inv=Math.max(0,p.inv-dt);p.cooldown=Math.max(0,p.cooldown-dt);p.attack=Math.max(0,p.attack-dt);
    p.coyote=p.grounded?.1:Math.max(0,p.coyote-dt);
    p.jumpBuffer=input.jump?.13:Math.max(0,p.jumpBuffer-dt);
    const axis=(input.right?1:0)-(input.left?1:0);p.vx=axis*155;if(axis)p.dir=axis;
    const atLadder=p.x+p.w>ladder.x&&p.x<ladder.x+ladder.w&&p.y+p.h>=ladder.y&&p.y<ladder.y+ladder.h;
    if(atLadder&&(input.up||input.down)){p.climbing=true;p.vy=(input.down?1:-1)*110;p.jumpBuffer=0;}
    else if(!atLadder||axis)p.climbing=false;
    if(p.jumpBuffer>0&&(p.coyote>0||p.climbing)){p.vy=-500;p.grounded=false;p.coyote=0;p.jumpBuffer=0;p.climbing=false;this.emit('jump');}
    if(input.attack&&p.cooldown===0){p.attack=.23;p.cooldown=.38;this.emit('swat');}
    const prevBottom=p.y+p.h;
    if(!p.climbing)p.vy=Math.min(p.vy+1080*dt,550);
    else if(!input.up&&!input.down)p.vy=0;
    p.x=Math.max(0,Math.min(WORLD-p.w,p.x+p.vx*dt));p.y+=p.vy*dt;p.grounded=false;
    if(p.climbing&&input.up&&p.y+p.h<=ladder.y+3){p.y=ladder.y-p.h;p.vy=0;p.grounded=true;p.climbing=false;}
    if(p.vy>=0&&!p.climbing)for(const s of platforms){if(p.x+p.w>s.x+1&&p.x<s.x+s.w-1&&prevBottom<=s.y+1&&p.y+p.h>=s.y){p.y=s.y-p.h;p.vy=0;p.grounded=true;}}
    if(p.y>HEIGHT+30){this.hurt(true);return;}
    if(p.x>325&&p.x<480&&p.grounded&&p.y+p.h<=301&&!this.checkpoint){this.checkpoint=1;this.emit('checkpoint');}
    const paw={x:p.dir>0?p.x+16:p.x-36,y:p.y-2,w:54,h:54};
    for(const e of this.enemies){
      if(e.dead)continue;e.x+=e.speed*e.dir*dt;
      if(e.x<e.origin||e.x>e.end){e.dir*=-1;e.x=Math.max(e.origin,Math.min(e.end,e.x));}
      if(e.flying)e.y=e.baseY+Math.sin(this.time*2.4)*14;
      if(p.attack>0&&overlap(paw,e)){e.dead=true;this.kills++;this.emit('pop',{x:e.x+24,y:e.y});continue;}
      if(overlap(p,e)){if(p.vy>0&&prevBottom<e.y+12){e.dead=true;this.kills++;p.vy=-310;this.emit('pop',{x:e.x+24,y:e.y});}else this.hurt();}
    }
    for(const f of this.fishes)if(!f.taken&&Math.abs(p.x+17-f.x)<26&&Math.abs(p.y+24-f.y)<32){f.taken=true;this.fish++;this.emit('fish',{x:f.x,y:f.y});}
    const b=this.boss;b.cooldown=Math.max(0,b.cooldown-dt);
    if(b.hp>0&&p.x>500){
      b.timer-=dt;
      if(b.timer<=0){b.timer=1.65;this.bolts.push({x:b.x,y:246,w:16,h:13,vx:-140});this.emit('bolt');}
      if(p.attack>0&&b.cooldown===0&&overlap(paw,b)){b.hp--;b.cooldown=.65;this.emit('bossHit',{x:b.x,y:b.y+45});if(!b.hp){this.mode='won';this.emit('won');}}
      if(overlap(p,b))this.hurt();
    }
    for(const bolt of this.bolts){bolt.x+=bolt.vx*dt;if(p.attack>0&&overlap(paw,bolt)){bolt.dead=true;this.emit('pop',{x:bolt.x,y:bolt.y});}else if(overlap(p,bolt)){bolt.dead=true;this.hurt();}}
    this.bolts=this.bolts.filter(bolt=>!bolt.dead&&bolt.x>-25);
  }
}
