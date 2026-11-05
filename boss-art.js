import {drawBossBarrier} from './shield-art.js?v=0.21.5';
import {rect,text} from './pixel.js?v=0.21.5';
import {drawMonster} from './art.js?v=0.21.5';
import {bossShielded} from './boss.js?v=0.21.5';
import {rooms} from './level.js?v=0.21.5';
export function drawArenaBoss(c,a,g,time){
 const b=g.boss;if(!rooms[g.room].arena||b.room!==g.room||b.hp<=0)return;const room=rooms[g.room],final=b.id==='infoshum';
 for(const d of b.docks){rect(c,d.x-9,d.y+b.h+2,b.w+18,3,'#3e4a79');rect(c,d.x+12,d.y+b.h+2,b.w-24,2,b.x===d.x?'#b199ec':'#536680');}
 c.save();if(b.ability==='telecast'&&b.state==='casting')c.globalAlpha=b.castElapsed<.22?Math.max(0,1-b.castElapsed/.22):Math.min(1,(b.castElapsed-.22)/.28);if(b.state==='shift')c.globalAlpha=Math.min(1,Math.abs(b.timer-.56)/.5);
 drawMonster(c,a,b.id,b.x-(final?76:28),b.y-(final?100:62),final?280:156,final?236:138,time,b.dir<0,{...b,moving:b.id==='spreader',walkTime:time});c.restore();
 drawBossBarrier(c,g,time);

 // Small corner marks show an opening to attack; the health gauge lives in the HUD.
 if(b.state==='recover'||b.id==='manipulator'&&b.ability==='splice'&&b.state==='casting'||b.id==='spreader'&&['ink','copy'].includes(b.ability)&&b.state==='casting')for(const xx of[b.x+5,b.x+b.w-8]){rect(c,xx,b.y+b.h-18,2,10,'#a9ffd3');rect(c,xx-2,b.y+b.h-18,6,2,'#e8ffe9');rect(c,xx-2,b.y+b.h-10,6,2,'#a9ffd3');}
 if(b.id==='agitator'){const xx=b.dir>0?b.x+b.w:b.x-5;rect(c,xx,b.y+5,5,b.h-10,b.shieldBroken?'#68647a':'#e9ba73');}
 if(b.ability==='pressure'&&b.state==='casting')for(let i=0;i<5;i++){const distance=30+(i*80+time*500)%480;rect(c,b.x+b.w/2+b.dir*distance,b.y+b.h-26,15,3,'#8fdae8');}
 if(b.state==='shift'){const d=b.docks[b.nextDock];if(d)for(let i=0;i<20;i++){const angle=i*Math.PI/10+time*2;rect(c,d.x+b.w/2+Math.cos(angle)*71,d.y+b.h/2+Math.sin(angle)*75,3,6,'#ad9cec');}return;}
 if(b.ability==='telecast'&&b.state==='windup'){const d=b.docks[b.nextDock];if(d){c.strokeStyle='#e8ac74';c.strokeRect(d.x-4,d.y-4,b.w+8,b.h+8);}}
 if(b.id==='spreader'&&b.phase===3&&b.state==='recover'&&b.timer>.6)for(const dx of[25,75])rect(c,b.x+dx,g.player.y+g.player.h-3,17,3,'#ffd083');
 if(b.state!=='windup')return;
 if(b.id==='spreader'&&b.ability==='scatter')for(const dx of[25,75]){rect(c,b.x+dx,g.player.y+g.player.h-3,17,3,'#ffd083');}
 if(b.id==='spreader'&&b.ability==='swoop'){text(c,b.dir>0?'>':'<',b.x+b.w/2,b.y-15,'#ffd083',2);}
 if(['rain','posters','spotlight'].includes(b.ability))for(const x of b.targets){const floor=g.platforms.filter(s=>s.room===g.room&&x>=s.x&&x<=s.x+s.w).sort((a,b)=>a.y-b.y)[0]?.y||474;rect(c,x-16,floor-4,32,4,'#e7a66b');}
 if(['wave','pressure'].includes(b.ability))text(c,'!',b.x+b.w/2,b.y-25,'#ffd083',2);
 if(b.ability==='summon')for(const t of b.summonTargets){c.strokeStyle='#b49ce8';c.lineWidth=2;c.strokeRect(t.x-4,t.y-26,56,25);}
}
