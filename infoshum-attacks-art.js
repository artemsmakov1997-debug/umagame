// The colossus's extra attacks (see infoshum-combat.js): televisions and the magnet.
// Sheets are 4×4 cells keyed from the mockups; boxes below are [x,y,w,h] of each cell's picture, row by row.
import {rooms} from './level.js?v=0.21.5';
import {CHANNELS,MAGNET,FLOOR,tvBeam} from './infoshum-combat.js?v=0.21.5';
const AT={"channels":[[26,68,261,205],[340,68,260,205],[653,68,261,205],[960,44,274,229],[26,381,261,205],[339,381,271,205],[646,339,273,251],[961,358,269,233],[26,695,266,204],[339,734,263,112],[652,739,264,105],[965,721,267,138],[7,957,267,269],[357,955,209,235],[639,1050,279,167],[953,1011,287,164]],"magnet":[[17,54,353,235],[401,54,353,235],[785,54,353,235],[1159,15,367,285],[11,323,373,229],[384,365,349,150],[852,397,213,93],[1163,300,356,226],[29,585,301,151],[406,593,320,138],[780,598,307,134],[1159,576,358,161],[18,847,350,111],[402,850,350,108],[786,820,350,138],[1170,851,349,107]]};
const B=(sheet,i)=>AT[sheet][i];
function put(c,img,box,x,y,w,h,{alpha=1,flip=false,rot=0}={}){if(!img||!box)return;c.save();c.globalAlpha*=alpha;c.translate(Math.round(x+w/2),Math.round(y+h/2));if(rot)c.rotate(rot);if(flip)c.scale(-1,1);c.drawImage(img,box[0],box[1],box[2],box[3],-w/2,-h/2,w,h);c.restore();}
// Width-fitted: draw a box so it is `w` wide, its centre at (cx, cy).
function fit(c,img,box,cx,cy,w,opts){const h=w*box[3]/box[2];put(c,img,box,cx-w/2,cy-h/2,w,h,opts);return h;}
function tileLine(c,img,box,x0,x1,y,h,{alpha=1,offset=0}={}){if(!img)return;const tw=box[2]*h/box[3],lo=Math.min(x0,x1),hi=Math.max(x0,x1);c.save();c.globalAlpha*=alpha;c.beginPath();c.rect(lo,y-h,hi-lo,h*2);c.clip();
 for(let x=lo-((offset%tw)+tw)%tw;x<hi;x+=tw-1)c.drawImage(img,box[0],box[1],box[2],box[3],Math.round(x),Math.round(y-h/2),Math.ceil(tw),Math.round(h));c.restore();}
// «Каналы»: TV off, switching on, on, overheating; cracked, bursting, smoking, wreck; firing, beam ×2, beam end;
// hand with a set, falling set, landing, cable.
function drawChannels(c,a,g,ch,time){
 const img=a.infoshumChannels;if(!img)return;const W=CHANNELS.tvW,fade=ch.fade?Math.max(0,1-ch.fade/.4):1;
 for(const t of ch.tvs){if(t.state==='gone')continue;const flip=t.dir<0;let f=0;
  if(t.state==='drop'){fit(c,img,B('channels',13),t.x,t.y-36,W*.9,{flip});continue;}
  if(t.state==='on')f=t.t<.25?1:2;else if(t.state==='heat')f=3;else if(t.state==='fire')f=8;else if(t.state==='broken')f=t.t<.2?4:t.t<.4?5:6;else if(t.state==='dead')f=7;
  const box=B('channels',f),h=W*box[3]/box[2];put(c,img,box,t.x-W/2,FLOOR-h+4,W,h,{flip,alpha:t.state==='dead'?fade:1});
  if(t.dust>0)fit(c,img,B('channels',14),t.x,FLOOR-30,W*1.1,{flip,alpha:Math.min(1,t.dust/.25)});
  if(t.state==='heat'){const bm=tvBeam(g,t);c.save();c.globalAlpha=.3+.3*Math.abs(Math.sin(time*14));c.fillStyle='#ff5ae0';c.fillRect(bm.x,FLOOR-6,bm.w,3);c.restore();}
  if(t.state==='fire'){const bm=tvBeam(g,t),cy=bm.y+bm.h/2,x0=t.x+t.dir*W/2,x1=t.dir<0?bm.x:bm.x+bm.w;c.save();c.globalCompositeOperation='lighter';tileLine(c,img,B('channels',9+Math.floor(time*14)%2),x0,x1,cy,bm.h+14,{offset:t.dir*time*500});c.restore();
   fit(c,img,B('channels',11),x1-t.dir*20,cy,60,{flip});}}
}
// «Магнит»: the head (face, vortex ×2, full vortex), pull waves ×4, junk ×4 (set, cable, slab, papers), sparking floor ×4.
export function drawMagnetHead(c,a,g,screen,time){
 const m=g.boss.network.col?.magnet,img=a.infoshumMagnet;if(!m||!img)return;const f=m.state==='charge'?(m.timer>MAGNET.charge/2?1:2):m.state==='pull'?3:1,box=B('magnet',f);
 // The magnet head's screen is about the middle half of its frame: scale it onto the rig's screen.
 const k=screen.w/(box[2]*.5),w=box[2]*k,h=box[3]*k;put(c,img,box,screen.x+screen.w/2-w/2,screen.y+screen.h/2-h*.45,w,h);
}
function drawMagnet(c,a,g,m,time){
 const img=a.infoshumMagnet;if(!img)return;const cx=rooms[g.room].x+768;
 if(m.state==='pull'){const f=4+Math.floor(time*5)%3;fit(c,img,B('magnet',f),cx,150,420,{alpha:.55});
  const z=B('magnet',12+Math.floor(time*10)%3);tileLine(c,img,z,cx-MAGNET.zone,cx+MAGNET.zone,FLOOR-12,34,{offset:time*60});}
 if(m.state==='end')fit(c,img,B('magnet',7),cx,150,420,{alpha:Math.max(0,m.timer/MAGNET.end)*.6});
 for(const j of m.junk)fit(c,img,B('magnet',8+j.kind),j.x,j.y,62,{flip:j.dir<0});
}
export function drawColossusAttacks(c,a,g,time){
 const col=g.boss.network?.col;if(!col)return;
 if(col.channels)drawChannels(c,a,g,col.channels,time);if(col.magnet)drawMagnet(c,a,g,col.magnet,time);
}
