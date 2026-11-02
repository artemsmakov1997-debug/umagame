import {rect,text} from './pixel.js?v=0.12.0';
import {drawMonster} from './art.js?v=0.12.0';
import {bossDocks} from './boss.js?v=0.12.0';
import {FINAL_X,ARENA_WIDTH,LAST_ROOM} from './level.js?v=0.12.0';
export function drawArenaBoss(c,a,g,time){
 if(g.room!==LAST_ROOM)return;const b=g.boss;
 for(const d of bossDocks){rect(c,d.x-9,d.y+138,146,3,'#3e4a79');rect(c,d.x+12,d.y+138,104,2,b.x===d.x?'#b199ec':'#536680');}
 if(b.hp<=0)return;
 c.save();if(b.state==='shift')c.globalAlpha=Math.abs(b.timer-.56)/.59;
 drawMonster(c,a,'infoshum',b.x-76,b.y-100,280,236,time,false,b);c.restore();
 if(b.state==='recover'){rect(c,b.x+8,b.y+b.h-14,b.w-16,6,'#a9ffd3');rect(c,b.x+14,b.y+b.h-12,b.w-28,2,'#e8ffe9');}
 if(b.cooldown>0){c.save();c.globalAlpha=.3;rect(c,b.x,b.y,b.w,b.h,'#d6ecff');c.restore();}
 if(b.state==='shift'){
  const d=bossDocks[b.nextDock];for(let i=0;i<20;i++){const angle=i*Math.PI/10+time*2;rect(c,d.x+64+Math.cos(angle)*71,d.y+60+Math.sin(angle)*95,3,6,'#ad9cec');}return;
 }
 if(b.state!=='windup')return;
 if(b.ability==='rain')for(const x of b.targets){rect(c,x-13,20,26,454,'#ffb95b19');for(let y=28;y<474;y+=20)rect(c,x-1,y,2,8,'#e7a66b');}
 if(b.ability==='wave'){rect(c,FINAL_X+12,b.waveY,ARENA_WIDTH-24,12,'#efad6750');for(let x=FINAL_X+40;x<FINAL_X+ARENA_WIDTH;x+=95)text(c,'!',x,b.waveY-17,'#ffd083',2);}
 if(b.ability==='volley'){c.save();c.strokeStyle='#e0b97c';c.setLineDash([4,7]);c.beginPath();c.moveTo(b.x+b.w/2,b.y+65);c.lineTo(b.aim.x,b.aim.y);c.stroke();c.restore();}
 if(b.ability==='summon')for(const t of b.summonTargets){c.strokeStyle='#b49ce8';c.lineWidth=2;c.strokeRect(t.x-4,t.y-26,56,25);}
}
