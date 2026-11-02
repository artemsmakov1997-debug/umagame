import {rect,text} from './pixel.js?v=0.14.0';
import {drawMonster} from './art.js?v=0.14.0';
import {bossShielded} from './boss.js?v=0.14.0';
import {rooms} from './level.js?v=0.14.0';
const names={spreader:'РАСПРОСТРАНИТЕЛЬ',agitator:'АГИТАТОР',manipulator:'МАНИПУЛЯТОР',infoshum:'ИНФОШУМ'};
export function drawArenaBoss(c,a,g,time){
 const b=g.boss;if(!rooms[g.room].arena||b.room!==g.room||b.hp<=0)return;const room=rooms[g.room],final=b.id==='infoshum';
 for(const d of b.docks){rect(c,d.x-9,d.y+b.h+2,b.w+18,3,'#3e4a79');rect(c,d.x+12,d.y+b.h+2,b.w-24,2,b.x===d.x?'#b199ec':'#536680');}
 c.save();if(b.state==='shift')c.globalAlpha=Math.min(1,Math.abs(b.timer-.56)/.5);
 drawMonster(c,a,b.id,b.x-(final?76:28),b.y-(final?100:62),final?280:156,final?236:138,time,false,{...b,moving:b.id==='spreader',walkTime:time});c.restore();
 const shield=bossShielded(g,b);
 if(shield){c.save();c.strokeStyle='#8d98d4';c.setLineDash([3,5]);c.strokeRect(b.x-7,b.y-12,b.w+14,b.h+18);for(const d of g.relays.filter(d=>d.room===g.room&&d.hp>0)){c.beginPath();c.moveTo(b.x+b.w/2,b.y+20);c.lineTo(d.x+20,d.y+25);c.stroke();}c.restore();}
 rect(c,b.x-10,b.y-76,b.w+20,5,'#11213b');rect(c,b.x-10,b.y-76,(b.w+20)*b.hp/b.maxHp,5,shield?'#93a2d8':'#ef7591');
 text(c,names[b.id],b.x+b.w/2-names[b.id].length*3,b.y-91,'#f3d6a1');
 if(b.state==='recover'){rect(c,b.x+8,b.y+b.h-14,b.w-16,6,'#a9ffd3');rect(c,b.x+14,b.y+b.h-12,b.w-28,2,'#e8ffe9');}
 if(b.state==='shift'){const d=b.docks[b.nextDock];if(d)for(let i=0;i<20;i++){const angle=i*Math.PI/10+time*2;rect(c,d.x+b.w/2+Math.cos(angle)*71,d.y+b.h/2+Math.sin(angle)*75,3,6,'#ad9cec');}return;}
 if(b.state!=='windup')return;
 if(['rain','posters','spotlight'].includes(b.ability))for(const x of b.targets){rect(c,x-13,20,26,454,'#ffb95b19');for(let y=28;y<474;y+=20)rect(c,x-1,y,2,8,'#e7a66b');}
 if(['wave','pressure'].includes(b.ability)){rect(c,room.x+12,b.waveY,room.width-24,12,'#efad6750');for(let x=room.x+40;x<room.end;x+=95)text(c,'!',x,b.waveY-17,'#ffd083',2);}
 if(b.aim){c.save();c.strokeStyle=b.id==='spreader'?'#e8d1a2':'#e0b97c';c.setLineDash([4,7]);c.beginPath();c.moveTo(b.x+b.w/2,b.y+35);c.lineTo(b.aim.x,b.aim.y);c.stroke();c.restore();}
 if(b.ability==='summon')for(const t of b.summonTargets){c.strokeStyle='#b49ce8';c.lineWidth=2;c.strokeRect(t.x-4,t.y-26,56,25);}
}
