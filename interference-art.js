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
// The meter (assets/interference-meter.png): a frame with a static monitor, a glass channel and a warning lamp; the
// fill is cyan, turning hot magenta past 75%; the monitor shows Infoshum's eyes past 55% and cracks past 85%.
const MT={"frame":{"r":[0,0,684,168]},"cL":{"r":[686,0,86,60]},"cM":{"r":[0,170,393,60]},"cR":{"r":[395,170,85,60]},"dL":{"r":[482,170,86,62]},"dM":{"r":[570,170,393,62]},"dR":{"r":[0,234,86,62]},"lamp0":{"r":[88,234,99,102]},"lamp1":{"r":[189,234,100,102]},"icon0":{"r":[291,234,128,113]},"icon1":{"r":[421,234,128,113]},"icon2":{"r":[551,234,129,113]},"crack0":{"r":[682,234,229,48]},"crack1":{"r":[0,349,226,50]},"crack2":{"r":[228,349,230,50]}},CHAN=[169,76,400,38.5],SCREEN=[66,50,56,58],LAMP=[583,28,63,64],PLATE=[221,11,270,42];
function drawMeter(c,img,fill,width,time){
 const w=Math.min(520,width-24),u=w/MT.frame.r[2],x=Math.round((width-w)/2),y=6,P=(p,X,Y,W,H)=>c.drawImage(img,p.r[0],p.r[1],p.r[2],p.r[3],Math.round(X),Math.round(Y),Math.round(W),Math.round(H));
 if(!img?.width){rect(c,x,y,w,30,'#030c21ed');rect(c,x+8,y+20,(w-16)*fill,5,fill>.75?'#fa73ce':'#66e9ee');return;}
 c.save();c.imageSmoothingEnabled=false;
 const danger=fill>.75,k=danger?'d':'c',L=MT[k+'L'],M=MT[k+'M'],R=MT[k+'R'],cx=x+CHAN[0]*u,cy=y+CHAN[1]*u,cw=CHAN[2]*u,ch=CHAN[3]*u,fh=ch,fw=cw*fill,cap=L.r[2]*fh/L.r[3];
 if(fw>1){c.save();c.beginPath();c.rect(cx,cy,fw,ch);c.clip();P(L,cx,cy,cap,fh);const ms=[M.r[0]+8,M.r[1],M.r[2]-16,M.r[3]],mw=ms[2]*fh/ms[3],off=(time*60)%mw;for(let xx=cx+cap-off;xx<cx+fw;xx+=mw-1)c.drawImage(img,ms[0],ms[1],ms[2],ms[3],Math.round(xx),Math.round(cy),Math.ceil(mw),Math.round(fh));P(L,cx,cy,cap,fh);if(fill>.97)P(R,cx+cw-cap,cy,cap,fh);c.restore();}
 P(MT.frame,x,y,MT.frame.r[2]*u,MT.frame.r[3]*u);
 if(fill>.5){const q=MT['crack'+(fill>.9?2:fill>.7?1:0)];c.globalAlpha=.8;P(q,cx,cy,cw,ch);c.globalAlpha=1;}
 const ic=MT['icon'+(fill>.85?2:fill>.55?1:0)],ir=ic.r,s=[ir[0]+ir[2]*.17,ir[1]+ir[3]*.16,ir[2]*.66,ir[3]*.6];c.drawImage(img,s[0],s[1],s[2],s[3],Math.round(x+SCREEN[0]*u),Math.round(y+SCREEN[1]*u),Math.round(SCREEN[2]*u),Math.round(SCREEN[3]*u));
 if(danger&&Math.floor(time*4)%2===0)P(MT.lamp1,x+LAMP[0]*u,y+LAMP[1]*u,LAMP[2]*u,LAMP[3]*u);
 c.font=Math.round(15*u*2)+'px UmaText,monospace';c.textAlign='center';c.textBaseline='middle';c.fillStyle=danger?'#6a0f4f':'#1d1842';c.fillText('ПОМЕХИ '+Math.floor(fill*100)+'%',x+(PLATE[0]+PLATE[2]/2)*u,y+(PLATE[1]+PLATE[3]/2)*u+1);
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
