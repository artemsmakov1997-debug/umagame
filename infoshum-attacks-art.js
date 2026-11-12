// The colossus's four trial attacks (see infoshum-combat.js): cables, televisions, the quake and the magnet.
// Sheets are 4×4 cells keyed from the mockups; boxes below are [x,y,w,h] of each cell's picture, row by row.
import {rooms} from './level.js?v=0.21.5';
import {CABLES,CHANNELS,QUAKE,MAGNET,FLOOR,tvBeam} from './infoshum-combat.js?v=0.21.5';
const AT={"cables":[[18,118,277,90],[331,118,278,90],[645,102,277,124],[958,52,278,211],[18,422,268,122],[332,350,274,238],[646,350,274,238],[959,339,272,255],[18,738,277,85],[331,710,278,148],[645,721,277,122],[958,700,278,170],[18,1010,276,198],[332,968,277,194],[645,989,277,204],[983,964,224,238]],"channels":[[26,68,261,205],[340,68,260,205],[653,68,261,205],[960,44,274,229],[26,381,261,205],[339,381,271,205],[646,339,273,251],[961,358,269,233],[26,695,266,204],[339,734,263,112],[652,739,264,105],[965,721,267,138],[7,957,267,269],[357,955,209,235],[639,1050,279,167],[953,1011,287,164]],"quake":[[27,69,331,165],[398,63,354,182],[779,130,357,115],[1162,70,356,170],[23,357,340,106],[407,357,340,106],[791,353,339,110],[1168,324,350,141],[21,595,342,120],[405,594,342,122],[789,594,342,122],[1168,592,350,129],[26,867,329,124],[426,826,298,158],[795,827,314,164],[1168,825,350,160]],"magnet":[[17,54,353,235],[401,54,353,235],[785,54,353,235],[1159,15,367,285],[11,323,373,229],[384,365,349,150],[852,397,213,93],[1163,300,356,226],[29,585,301,151],[406,593,320,138],[780,598,307,134],[1159,576,358,161],[18,847,350,111],[402,850,350,108],[786,820,350,138],[1170,851,349,107]]};
const B=(sheet,i)=>AT[sheet][i];
function put(c,img,box,x,y,w,h,{alpha=1,flip=false,rot=0}={}){if(!img||!box)return;c.save();c.globalAlpha*=alpha;c.translate(Math.round(x+w/2),Math.round(y+h/2));if(rot)c.rotate(rot);if(flip)c.scale(-1,1);c.drawImage(img,box[0],box[1],box[2],box[3],-w/2,-h/2,w,h);c.restore();}
// Width-fitted: draw a box so it is `w` wide, its centre at (cx, cy).
function fit(c,img,box,cx,cy,w,opts){const h=w*box[3]/box[2];put(c,img,box,cx-w/2,cy-h/2,w,h,opts);return h;}
function tileLine(c,img,box,x0,x1,y,h,{alpha=1,offset=0}={}){if(!img)return;const tw=box[2]*h/box[3],lo=Math.min(x0,x1),hi=Math.max(x0,x1);c.save();c.globalAlpha*=alpha;c.beginPath();c.rect(lo,y-h,hi-lo,h*2);c.clip();
 for(let x=lo-((offset%tw)+tw)%tw;x<hi;x+=tw-1)c.drawImage(img,box[0],box[1],box[2],box[3],Math.round(x),Math.round(y-h/2),Math.ceil(tw),Math.round(h));c.restore();}
// «Сеть кабелей»: cable states 0–3, plug flying, socket, socket sparking, torn end; pulses ×4; discharge, snap, halves, smoke.
function drawCables(c,a,g,k,time){
 const img=a.infoshumCables;if(!img)return;const H=22;
 for(const l of k.lines){const reach=k.state==='shoot'?Math.min(1,1-k.timer/CABLES.shoot):1,x1=l.x0+(l.x1-l.x0)*reach;
  const state=k.state==='warn'?(Math.floor(time*10)%2?1:2):k.state==='flash'?(l.low?3:1):k.state==='snap'?0:0,alpha=k.state==='snap'?Math.max(0,k.timer/CABLES.snap):1;
  if(k.state!=='snap')tileLine(c,img,B('cables',state),l.x0,x1,l.y,H,{alpha,offset:l.dir*time*20});
  if(k.state==='shoot')fit(c,img,B('cables',4),x1,l.y,58,{flip:l.dir<0});
  else{const sock=B('cables',k.state==='flash'&&l.low?6:5);fit(c,img,sock,l.x1-l.dir*8,l.y,52,{flip:l.dir<0});}
  if(k.state==='snap'){const mid=(l.x0+l.x1)/2,t=1-k.timer/CABLES.snap;fit(c,img,B('cables',13),mid,l.y,90,{alpha:1-t});fit(c,img,B('cables',14),mid,l.y+t*60,80,{alpha:1-t});}}
 for(const q of k.pulses){const f=9+Math.floor(time*12)%2;fit(c,img,B('cables',f),q.x,q.line.y,74,{flip:q.line.dir<0});}
}
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
// «Землетрясение»: raised fists, slam, shock ring, dust; floor whole, cracked, breaking, crumbling; abyss ×3, edge;
// island rising, island, island cracking, floor coming back.
function drawQuake(c,a,g,q,time){
 const img=a.infoshumQuake;if(!img)return;const r=rooms[g.room],x0=r.x,H=36,zones=QUAKE.zones.map(([l,h])=>[x0+l,x0+h]);
 if(q.state==='raise'){fit(c,img,B('quake',0),x0+768,FLOOR-210-Math.sin(Math.min(1,1-q.timer/QUAKE.raise)*Math.PI/2)*20,230);}
 if(q.ring>0){const k=1-q.ring/.5;fit(c,img,B('quake',2),x0+768,FLOOR-14,300+k*500,{alpha:1-k});fit(c,img,B('quake',3),x0+768,FLOOR-50,260,{alpha:Math.min(1,q.ring*3)});}
 if(q.state==='crack'){const k=1-q.timer/QUAKE.crack,f=k<.5?5:6;for(const [l,h] of zones)tileLine(c,img,B('quake',f),l,h,FLOOR+10,H,{});}
 if(['fall','rise','hold','warn'].includes(q.state)){
  for(const [l,h] of zones){tileLine(c,img,B('quake',8+Math.floor(time*6)%3),l,h,FLOOR+12,44,{offset:time*40});fit(c,img,B('quake',11),l+10,FLOOR+6,60,{alpha:.9});fit(c,img,B('quake',11),h-10,FLOOR+6,60,{flip:true,alpha:.9});
   if(q.state==='fall'){const t=1-q.timer/QUAKE.fall;tileLine(c,img,B('quake',7),l,h,FLOOR+10+t*30,H,{alpha:1-t});}}
  for(const [i,x] of QUAKE.islands){const s=g.platforms.find(s=>s.room===g.room&&s.index===i);if(!s||s.bossHidden)continue;const f=q.state==='rise'?12:q.state==='warn'?14:13,w=QUAKE.islandW+16,box=B('quake',f),h=w*box[3]/box[2];put(c,img,box,s.x-8,s.y-(f===12?h*.45:h*.32),w,h);}}
 if(q.state==='reform'){const t=1-q.timer/QUAKE.reform;for(const [l,h] of zones)tileLine(c,img,B('quake',15),l,h,FLOOR+8-(1-t)*16,H,{alpha:1-t*.5});}
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
 if(col.quake)drawQuake(c,a,g,col.quake,time);if(col.cables)drawCables(c,a,g,col.cables,time);if(col.channels)drawChannels(c,a,g,col.channels,time);if(col.magnet)drawMagnet(c,a,g,col.magnet,time);
}
