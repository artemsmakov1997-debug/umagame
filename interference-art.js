import {rect} from './pixel.js?v=0.21.5';
// «Помехи»: the interference meter of Infoshum's final phase (the freed form).
// assets/interference-textures.png on black, 4×3 cells of 384×341, blended with 'lighter' so black vanishes:
// grain stages ×4; sync tear, shifted band, colour split, rolling bar; eaten corner, Infoshum's eyes ×2, signal lost.
const CW=384,CH=341;
const cell=i=>[(i%4)*CW,Math.floor(i/4)*CH,CW,CH];
const TEAR={sync:[0,470,384,40],shift:[400,440,350,140],split:[788,450,346,115],roll:[1172,428,346,160]};
const hash=n=>{const x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x);};
function grain(c,img,stage,alpha,width,time){
 if(alpha<=0)return;const [sx,sy]=cell(stage),scale=.62,tw=CW*scale,th=CH*scale,tick=Math.floor(time*12),ox=-(hash(tick+stage)*tw|0),oy=-(hash(tick*3+stage)*th|0);
 c.globalAlpha=alpha;for(let y=oy;y<480;y+=th)for(let x=ox;x<width;x+=tw)c.drawImage(img,sx+4,sy+4,CW-8,CH-8,Math.round(x),Math.round(y),Math.ceil(tw),Math.ceil(th));
}
function drawTextures(c,img,fill,width,time){
 c.save();c.globalCompositeOperation='lighter';c.imageSmoothingEnabled=false;
 // Grain: four stages cross-fade as the meter rises.
 const level=Math.min(3,fill*4),low=Math.floor(level),mix=level-low;
 const strength=Math.min(.42,.08+fill*.36);grain(c,img,low,(1-mix)*strength,width,time);if(low<3)grain(c,img,low+1,mix*strength,width,time);
 // Corners eaten by noise grow inward.
 if(fill>.25){const [sx,sy]=cell(8),size=(120+fill*300),a=Math.min(1,(fill-.25)*1.6);c.globalAlpha=a;
  for(const [fx,fy] of [[1,1],[-1,1],[1,-1],[-1,-1]]){c.save();c.translate(fx>0?0:width,fy>0?0:480);c.scale(fx,fy);c.drawImage(img,sx,sy,CW,CH,0,0,size*1.12,size);c.restore();}}
 // Tearing bands jump around more and more.
 if(fill>.45){const bands=Math.floor((fill-.45)*8)+1,slot=Math.floor(time*6.5);
  for(let i=0;i<bands;i++){const kind=['sync','shift','split','roll'][Math.floor(hash(slot+i*7)*4)],box=TEAR[kind],y=hash(slot*13+i)*440,h=box[3]*(width/box[2])*.2;
   c.globalAlpha=.3+.35*hash(slot+i);c.drawImage(img,box[0],box[1],box[2],box[3],0,Math.round(y),width,Math.round(Math.max(8,h)));}}
 // Infoshum's eyes surface in the static now and then.
 if(fill>.55){const slot=Math.floor(time*1.4),phase=time*1.4-slot;if(hash(slot)<.25+fill*.6&&phase<.6){const [sx,sy]=cell(hash(slot+1)<.5?9:10),w=260+fill*160;
  c.globalAlpha=Math.sin(phase/.6*Math.PI)*(.3+fill*.35);c.drawImage(img,sx,sy,CW,CH,Math.round(hash(slot+2)*(width-w)),Math.round(60+hash(slot+3)*200),Math.round(w),Math.round(w*CH/CW));}}
 c.restore();
}
const MT={"frame":{"r":[0,0,684,168]},"cL":{"r":[686,0,86,60]},"cM":{"r":[0,170,393,60]},"cR":{"r":[395,170,85,60]},"dL":{"r":[482,170,86,62]},"dM":{"r":[570,170,393,62]},"dR":{"r":[0,234,86,62]},"lamp0":{"r":[88,234,99,102]},"lamp1":{"r":[189,234,100,102]},"icon0":{"r":[291,234,128,113]},"icon1":{"r":[421,234,128,113]},"icon2":{"r":[551,234,129,113]},"crack0":{"r":[682,234,229,48]},"crack1":{"r":[0,349,226,50]},"crack2":{"r":[228,349,230,50]}},CHAN=[169,76,400,38.5],SCREEN=[66,50,56,58],LAMP=[583,28,63,64],PLATE=[221,11,270,42];
// The compact gauge just under the boss health bar (top centre of the view): a dark plate with the label and the
// glass channel of assets/interference-meter.png; cyan fill, hot magenta past 75%. No monitor, lamp or frame.
export function meterBox(width){const w=Math.round(Math.max(220,Math.min(340,width*.36))),h=16;return {x:Math.round((width-w)/2),y:4,w,h,label:82};}
function drawMeter(c,img,fill,width,time){
 const m=meterBox(width),danger=fill>.75,cx=m.x+m.label,cy=m.y+3,cw=m.w-m.label-4,ch=m.h-6,fw=Math.round(cw*fill);
 c.save();c.imageSmoothingEnabled=false;
 c.fillStyle='#060a1fdd';c.beginPath();c.roundRect(m.x,m.y,m.w,m.h,4);c.fill();c.strokeStyle=danger?'#fa73cecc':'#66e9eebb';c.lineWidth=1;c.beginPath();c.roundRect(m.x+.5,m.y+.5,m.w-1,m.h-1,4);c.stroke();
 c.fillStyle='#02040e';c.fillRect(cx,cy,cw,ch);
 if(fw>0){const k=danger?'d':'c',M=MT[k+'M'],ms=[M.r[0]+8,M.r[1]+6,M.r[2]-16,M.r[3]-12];
  if(img?.width){c.save();c.beginPath();c.rect(cx,cy,fw,ch);c.clip();const mw=ms[2]*ch/ms[3],off=(time*40)%mw;for(let xx=cx-off;xx<cx+fw;xx+=mw-1)c.drawImage(img,ms[0],ms[1],ms[2],ms[3],Math.round(xx),cy,Math.ceil(mw),ch);c.restore();}
  else{c.fillStyle=danger?'#fa73ce':'#66e9ee';c.fillRect(cx,cy,fw,ch);}
  if(danger&&Math.floor(time*4)%2===0){c.fillStyle='#ffffff55';c.fillRect(cx,cy,fw,ch);}}
 c.strokeStyle='#3d4a78';c.strokeRect(cx-.5,cy-.5,cw+1,ch+1);
 c.font='9px UmaText,monospace';c.textAlign='left';c.textBaseline='middle';c.fillStyle=danger?'#ff9ad8':'#bfeff4';c.fillText('ПОМЕХИ '+Math.floor(fill*100)+'%',m.x+6,m.y+m.h/2+1);
 c.restore();
}
export function drawInterferenceOverlay(c,g,width,assets){
 const n=g.boss.network;if(g.room!==8||!n||n.stage!=='free'||g.boss.hp<=0)return;
 const fill=n.noise||0,img=assets?.interferenceTextures;
 if(img?.width)drawTextures(c,img,fill,width,g.time);
 else{c.save();c.globalAlpha=Math.min(.72,.08+fill*.6);const lines=Math.floor(fill*110);
  for(let i=0;i<lines;i++){const x=(i*109+Math.floor(g.time*24)*17)%width,y=25+(i*47+Math.floor(g.time*8)*3)%440,w=20+(i*73)%Math.max(40,width*.35);rect(c,x,y,w,i%4?2:4,i%3?'#b746f1':'#2acde9');}
  c.restore();}
 if(fill>=.99){if(img?.width){const [sx,sy]=cell(11);c.drawImage(img,sx,sy,CW,CH,0,0,width,480);}
  else{rect(c,0,0,width,480,'#101337');for(let y=0;y<480;y+=4){const x=(y*31+Math.floor(g.time*40)*13)%width;rect(c,0,y,width,2,'#294267');rect(c,x,y,Math.min(width-x,80+(y*47)%300),3,y%12?'#be3da7':'#4acbd5');}}}
 drawMeter(c,assets?.interferenceMeter,fill,width,g.time);
}
