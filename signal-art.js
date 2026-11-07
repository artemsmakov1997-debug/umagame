import {drawYuriPortrait,yuriEmotion} from './yuri-portrait.js?v=0.21.5';
import {rooms} from './level.js?v=0.21.5';
import {drawHauntedMonitor} from './art.js?v=0.21.5';
import {hauntedScreens} from './campaign-art.js?v=0.21.5';
import {rect,text} from './pixel.js?v=0.21.5';
function face(c,a,screen,t,quality,echo=false,emotion=0){c.save();c.beginPath();c.rect(screen.x,screen.y,screen.w,screen.h);c.clip();rect(c,screen.x,screen.y,screen.w,screen.h,'#031524');c.globalAlpha=quality*.8+.16;const cut=Math.floor(t*5)%13===0;drawYuriPortrait(c,a,{...screen,time:t,emotion,quality,speaking:true});c.globalAlpha=1;for(let i=0;i<8;i++)rect(c,screen.x,screen.y+(i*17+Math.floor(t*27))%screen.h,screen.w,i%3?1:2,echo?'#e5647760':'#8de5ee35');if(cut)rect(c,screen.x,screen.y+screen.h*.47,screen.w,4,echo?'#ff4a7355':'#8ce9e650');c.restore();}
export function drawYuriSignal(c,a,g,t){
 const dialogue=g.mode==='dialogue'||g.mode==='paused'&&g.pausedFrom==='dialogue';
 const profile=g.dialogue?.signal||g.signal,echo=g.signal.echoTime>0;
 if(g.dialogue?.catReply)text(c,'Мяу!',g.player.x+15,g.player.y-28,'#ffe8b5',1.5);
 // Quiet room: once Uma is awake, Yuri curates the course from the old monitor.
 if(g.room===0){if(dialogue||g.mode!=='waking'&&g.pausedFrom!=='waking')face(c,a,{x:214,y:154,w:135,h:104},t,profile.quality,echo,yuriEmotion(g));return;}
 let screens=hauntedScreens.filter(s=>s.room===g.room&&rooms[g.room].x+s.lx>=g.camera-90&&rooms[g.room].x+s.lx<g.camera+(g.viewWidth||768));
 if(dialogue||echo)for(const s of screens)face(c,a,{x:rooms[g.room].x+s.lx+s.w*.15,y:s.y+s.h*.14,w:s.w*.7,h:s.h*.65},t,profile.quality,echo,g.room===5&&s.forged?6:yuriEmotion(g));
 // The receiver is a persistent painted prop beside the notebook, not a floating UI placeholder.
 for(const n of g.notebooks){if(n.room!==g.room||!Number.isFinite(n.readyAt))continue;const support=g.platforms.find(s=>s.room===n.room&&s.index===n.index);if(!support)continue;const x=Math.max(support.x+3,Math.min(support.x+support.w-54,n.x+20)),y=support.y-54;if(x<g.camera-60||x>g.camera+(g.viewWidth||768))continue;drawHauntedMonitor(c,a,x,y,54,54,t);if(g.dialogue?.id==='notebook:'+n.id)face(c,a,{x:x+8,y:y+8,w:38,h:34},t,profile.quality,echo,yuriEmotion(g));}
}
