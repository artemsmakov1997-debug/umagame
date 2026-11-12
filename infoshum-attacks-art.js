// The colossus's extra attack (see infoshum-combat.js): the televisions.
// Sheets are 4×4 cells keyed from the mockups; boxes below are [x,y,w,h] of each cell's picture, row by row.
import {rooms} from './level.js?v=0.21.5';
import {CHANNELS,FLOOR,tvBeam} from './infoshum-combat.js?v=0.21.5';
const AT={"channels":[[26,68,261,205],[340,68,260,205],[653,68,261,205],[960,44,274,229],[26,381,261,205],[339,381,271,205],[646,339,273,251],[961,358,269,233],[26,695,266,204],[339,734,263,112],[652,739,264,105],[965,721,267,138],[7,957,267,269],[357,955,209,235],[639,1050,279,167],[953,1011,287,164]]};
const B=(sheet,i)=>AT[sheet][i];
function put(c,img,box,x,y,w,h,{alpha=1,flip=false,rot=0}={}){if(!img||!box)return;c.save();c.globalAlpha*=alpha;c.translate(Math.round(x+w/2),Math.round(y+h/2));if(rot)c.rotate(rot);if(flip)c.scale(-1,1);c.drawImage(img,box[0],box[1],box[2],box[3],-w/2,-h/2,w,h);c.restore();}
// Width-fitted: draw a box so it is `w` wide, its centre at (cx, cy).
function fit(c,img,box,cx,cy,w,opts){const h=w*box[3]/box[2];put(c,img,box,cx-w/2,cy-h/2,w,h,opts);return h;}
function tileLine(c,img,box,x0,x1,y,h,{alpha=1,offset=0}={}){if(!img)return;const tw=box[2]*h/box[3],lo=Math.min(x0,x1),hi=Math.max(x0,x1);c.save();c.globalAlpha*=alpha;c.beginPath();c.rect(lo,y-h,hi-lo,h*2);c.clip();
 for(let x=lo-((offset%tw)+tw)%tw;x<hi;x+=tw-1)c.drawImage(img,box[0],box[1],box[2],box[3],Math.round(x),Math.round(y-h/2),Math.ceil(tw),Math.round(h));c.restore();}
// «Каналы»: TV off, switching on, on, overheating; cracked, bursting, smoking, wreck; firing, beam ×2, beam end;
// hand with a set, falling set, landing, cable.
function drawChannels(c,a,g,tvs,time){
 const img=a.infoshumChannels;if(!img)return;const W=CHANNELS.tvW;
 for(const t of tvs){const flip=t.dir<0;let f=0;
  if(t.state==='drop'){fit(c,img,B('channels',13),t.x,t.y-36,W*.9,{flip});continue;}
  if(t.state==='on')f=t.t<.25?1:2;else if(t.state==='heat')f=3;else if(t.state==='fire')f=8;else if(t.state==='broken')f=t.t<.2?4:t.t<.4?5:6;else if(t.state==='wreck')f=7;
  const box=B('channels',f),h=W*box[3]/box[2];put(c,img,box,t.x-W/2,FLOOR-h+4,W,h,{flip,alpha:t.state==='wreck'?Math.max(0,1-t.t/.4):1});
  if(t.dust>0)fit(c,img,B('channels',14),t.x,FLOOR-30,W*1.1,{flip,alpha:Math.min(1,t.dust/.25)});
  if(t.state==='heat'){const bm=tvBeam(g,t);c.save();c.globalAlpha=.3+.3*Math.abs(Math.sin(time*14));c.fillStyle='#ff5ae0';c.fillRect(bm.x,FLOOR-6,bm.w,3);c.restore();}
  if(t.state==='fire'){const bm=tvBeam(g,t),cy=bm.y+bm.h/2,x0=t.x+t.dir*W/2,x1=t.dir<0?bm.x:bm.x+bm.w;c.save();c.globalCompositeOperation='lighter';tileLine(c,img,B('channels',9+Math.floor(time*14)%2),x0,x1,cy,bm.h+14,{offset:t.dir*time*500});c.restore();
   fit(c,img,B('channels',11),x1-t.dir*20,cy,60,{flip});}}
}
export function drawColossusAttacks(c,a,g,time){
 const col=g.boss.network?.col;if(!col)return;
 if(col.tvs?.length)drawChannels(c,a,g,col.tvs,time);
}
