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
export function drawInterferenceOverlay(c,g,width,assets){
 const n=g.boss.network;if(g.room!==8||!n||n.stage!=='noise'||g.boss.hp<=0)return;
 const fill=n.noise||0,img=assets?.interferenceTextures;
 if(img?.width)drawTextures(c,img,fill,width,g.time);
 else{c.save();c.globalAlpha=Math.min(.72,.08+fill*.6);const lines=Math.floor(fill*110);
  for(let i=0;i<lines;i++){const x=(i*109+Math.floor(g.time*24)*17)%width,y=25+(i*47+Math.floor(g.time*8)*3)%440,w=20+(i*73)%Math.max(40,width*.35);rect(c,x,y,w,i%4?2:4,i%3?'#b746f1':'#2acde9');}
  c.restore();}
 if(fill>=.99){if(img?.width){const [sx,sy]=cell(11);c.drawImage(img,sx,sy,CW,CH,0,0,width,480);}
  else{rect(c,0,0,width,480,'#101337');for(let y=0;y<480;y+=4){const x=(y*31+Math.floor(g.time*40)*13)%width;rect(c,0,y,width,2,'#294267');rect(c,x,y,Math.min(width-x,80+(y*47)%300),3,y%12?'#be3da7':'#4acbd5');}}}
 const w=Math.min(190,width-90);rect(c,10,10,w,31,'#030c21ed');c.font='14px UmaText,monospace';c.fillStyle='#8bedff';c.textAlign='left';c.fillText('ПОМЕХИ '+Math.floor(fill*100)+'%',17,23);
 rect(c,17,29,w-14,5,'#233455');rect(c,17,29,(w-14)*fill,5,fill>.75?'#fa73ce':'#66e9ee');
}
