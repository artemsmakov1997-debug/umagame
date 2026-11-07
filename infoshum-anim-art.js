// Infoshum's moves between screens and its breakout.
// assets/infoshum-transfer.png (4×2): pressed to the glass, swirling into the socket, cable blob ×2;
// static flash with eyes, assembling, striking the glass, an empty sparking screen.
// assets/infoshum-breakout.png (4×2): bulging glass, tentacles pierce, the burst, tearing out; the roar, descending,
// the smoking empty case, flying shards.
const SCREEN={pressed:[81,162,234,210],socket:[461,162,234,210],eyes:[82,650,234,210],assemble:[461,650,234,210],strike:[841,650,234,210],empty:[1223,650,234,210]};
const CABLE=[[771,212,366,137],[1153,188,366,179]];
const BREAK=[[37,144,310,269],[394,140,373,273],[732,80,372,335],[1117,112,410,295],[8,552,386,383],[403,580,353,355],[780,548,320,373],[1141,589,380,309]];
// The glass of the old CRT sprite, relative to the monitor rectangle the combat code uses.
export function screenRect(m){const h=m.w*271/319;return {x:m.x+m.w*.17,y:m.y-35+h*.19,w:m.w*.62,h:h*.5};}
export function drawScreenContent(c,a,m,kind,alpha=1){
 const img=a.infoshumTransfer,box=SCREEN[kind];if(!img||!box)return false;const r=screenRect(m);
 c.save();c.globalAlpha*=alpha;c.drawImage(img,box[0],box[1],box[2],box[3],Math.round(r.x),Math.round(r.y),Math.round(r.w),Math.round(r.h));c.restore();return true;
}
// A glowing blob of noise inside a stretch of thick cable, turned along the path.
export function drawCableBlob(c,a,x,y,angle,time){
 const img=a.infoshumTransfer;if(!img)return false;const box=CABLE[Math.floor(time*10)%2],w=132,h=box[3]*w/box[2];
 c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.drawImage(img,box[0],box[1],box[2],box[3],-w/2,-h/2,w,h);c.restore();return true;
}
// The breakout plays over the 2.25 s rupture: progress 0→1.
export function breakoutFrame(progress){return progress<.18?0:progress<.36?1:progress<.5?2:progress<.66?3:progress<.84?4:5;}
export function drawBreakout(c,a,m,progress,time){
 const img=a.infoshumBreakout;if(!img)return false;const f=breakoutFrame(progress),box=BREAK[f];
 const cx=m.x+m.w/2,cy=m.y+m.h/2-10,base=m.w*1.18/310,grow=f>=4?1.25+.15*(f-4):1,k=base*grow,shake=f===2?Math.sin(time*90)*4:f<2?Math.sin(time*60)*progress*6:0;
 const rise=f===5?(progress-.84)/.16*40:0;
 c.save();c.drawImage(img,box[0],box[1],box[2],box[3],Math.round(cx-box[2]*k/2+shake),Math.round(cy-box[3]*k/2+rise),Math.round(box[2]*k),Math.round(box[3]*k));c.restore();
 // Shards fly outward from the burst on.
 if(f>=2&&f<=4){const s=BREAK[7],spread=Math.min(1,(progress-.36)/.4),sk=base*(.8+spread*.9);c.save();c.globalAlpha=1-spread*.7;
  c.drawImage(img,s[0],s[1],s[2],s[3],Math.round(cx-s[2]*sk/2),Math.round(cy-s[3]*sk/2),Math.round(s[2]*sk),Math.round(s[3]*sk));c.restore();}
 if(f===2){c.save();c.globalAlpha=.55*(1-(progress-.36)/.14);c.fillStyle='#ffe4fb';c.fillRect(m.x-400,0,m.w+800,480);c.restore();}
 return true;
}
// After the breakout the emptied case keeps smoking in place of the plain wreck.
export function drawSmokingCase(c,a,m,w=110,y=380){
 const img=a.infoshumBreakout;if(!img)return false;const box=BREAK[6],h=box[3]*w/box[2];
 c.drawImage(img,box[0],box[1],box[2],box[3],Math.round(m.x+m.w/2-w/2),Math.round(y+94-h),Math.round(w),Math.round(h));return true;
}
