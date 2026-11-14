import {rect,text} from './pixel.js?v=0.21.5';
import {rooms,HEIGHT} from './level.js?v=0.21.5';
import {ROOF_BUILDINGS,ROOF_LADDERS,ROOF_ENTRANCE,mastFooting} from './roofs-map.js?v=0.21.5';
import {drawAttackFx} from './boss-attack-fx.js?v=0.21.5';
import {birdBox,ROOM} from './roofs-systems.js?v=0.21.5';
// Source boxes. assets/roofs-pieces.png: parapet and tin roof (left cap, repeatable middle, right cap), chimneys, vent, tank.
const PIECES={brickL:[49,86,382,187],brickM:[458,108,623,165],brickR:[1109,86,377,187],tinL:[40,356,378,156],tinM:[454,356,630,156],tinR:[1119,356,377,156],
 chimney:[92,633,130,326],chimneyWide:[333,624,270,335],vent:[663,664,392,295],tank:[1127,562,332,397]};
// assets/roofs-props.png: ladder, washing line (taut / sagging), awning (normal / squashed), antenna, dish, vane, sign.
const PROPS={ladder:[1236,13,112,265],rope:[144,291,566,189],ropeSag:[799,292,578,191],awning:[238,507,447,179],awningSquash:[824,509,447,177],
 antenna:[128,708,209,296],dish:[453,728,222,276],vane:[831,708,195,293],sign:[1207,725,220,276]};
// assets/roofs-entrance.png: mast stairs with the door closed (red lamp) / open (green lamp).
const ENTRANCE={closed:[53,28,662,936],open:[782,28,663,936]};
// assets/sensation.png: 4×2 cells of 384×512. Row 1: four flight frames; row 2: dash, hit, crumpled, burst.
const CELL_W=384,CELL_H=512,PIVOT_Y=[285,780],BIRD_SCALE=.14;
// Scenery that is not collision: antennas and the sign that points to the mast.
const DECOR=[{kind:'sign',x:176,bottom:420,h:100},{kind:'vane',x:560,bottom:300,h:56},{kind:'antenna',x:740,bottom:250,h:60},{kind:'antenna',x:1790,bottom:230,h:64},{kind:'dish',x:2040,bottom:190,h:40},{kind:'antenna',x:2272,bottom:150,h:66}];
const X0=()=>rooms[ROOM].x;
const blit=(c,image,box,x,y,w,h)=>c.drawImage(image,box[0],box[1],box[2],box[3],Math.round(x),Math.round(y),Math.round(w),Math.round(h));
const hash=n=>{n=Math.sin(n*127.1)*43758.5453;return n-Math.floor(n);};

// assets/roofs-facades.png: 3×2 seamless 512×512 tiles — brick (lit window, dark window, plain with a drainpipe), plaster (same).
const FACADE_TILE=96;
function facadeTile(index,row,col){const n=hash(index*31+row*7+col*13);return n<.34?0:n<.78?1:2;}
function drawWall(c,a,b,index){
 const left=X0()+(b.wall??b.x),right=X0()+b.x+b.w,top=b.y+(b.style==='tin'?26:30),w=right-left,brick=b.style==='brick';
 c.save();c.beginPath();c.rect(left,top,w,HEIGHT-top);c.clip();
 if(a.roofsFacades){const row0=brick?0:1;for(let row=0;top+row*FACADE_TILE<HEIGHT;row++)for(let col=0;left+col*FACADE_TILE<right;col++){const t=facadeTile(index,row,col);c.drawImage(a.roofsFacades,t*512+3,row0*512+3,506,506,Math.round(left+col*FACADE_TILE),Math.round(top+row*FACADE_TILE),FACADE_TILE,FACADE_TILE);}}
 else rect(c,left,top,w,HEIGHT-top,brick?'#2a1714':'#221f33');
 // Night shading: darker towards the street and at the corners, so the facades sit behind the play.
 const fall=c.createLinearGradient(0,top,0,HEIGHT);fall.addColorStop(0,'#05061000');fall.addColorStop(1,'#050610c0');c.fillStyle=fall;c.fillRect(left,top,w,HEIGHT-top);
 c.fillStyle='#0508148c';c.fillRect(left,top,w,HEIGHT-top);
 rect(c,left,top,4,HEIGHT-top,'#0b0710');rect(c,right-4,top,4,HEIGHT-top,'#0b0710');rect(c,left,top,w,5,'#0b0710');
 c.restore();
}
function drawRoofTop(c,a,s,b){
 const art=a.roofsPieces,brick=b.style==='brick',[L,M,R]=brick?['brickL','brickM','brickR']:['tinL','tinM','tinR'],k=brick?34/165:30/156;
 const x=s.x,w=s.w,lw=PIECES[L][2]*k,rw=PIECES[R][2]*k,mw=PIECES[M][2]*k,top=s.y-2,capRise=brick?(PIECES[M][1]-PIECES[L][1])*k:0;
 c.save();c.beginPath();c.rect(x-12,top-capRise-2,w+24,60);c.clip();
 for(let xx=x+lw-4;xx<x+w-rw+4;xx+=mw-2)blit(c,art,PIECES[M],xx,top,mw,PIECES[M][3]*k);
 blit(c,art,PIECES[L],x-(brick?4:6),top-capRise,lw,PIECES[L][3]*k);blit(c,art,PIECES[R],x+w-rw+(brick?4:6),top-capRise,rw,PIECES[R][3]*k);
 c.restore();
}
export function drawRoofSurface(c,a,g,s){
 if(s.room!==ROOM||!s.roof||!a.roofsPieces)return false;const r=s.roof;
 if(r.type==='building'){drawWall(c,a,r,s.index);drawRoofTop(c,a,s,r);return true;}
 if(r.type==='prop'){const box=PIECES[r.kind==='chimney'&&r.w>34?'chimneyWide':r.kind],k=s.w/box[2],h=box[3]*k;blit(c,a.roofsPieces,box,s.x,r.base-h+1,s.w,h);return true;}
 if(r.type==='rope'){const sag=g.player.grounded&&g.player.supportId===s.id,box=PROPS[sag?'ropeSag':'rope'],k=s.w/box[2];blit(c,a.roofsProps,box,s.x,s.y-8,s.w,box[3]*k);return true;}
 if(r.type==='awning'){const squash=(g.roofs?.bounceTime||0)>0,box=PROPS[squash?'awningSquash':'awning'],k=s.w/box[2];blit(c,a.roofsProps,box,s.x,s.y-3,s.w,box[3]*k);return true;}
 return false;
}

export function drawRoofProps(c,a,g,t){
 if(g.room!==ROOM||!a.roofsProps)return;const x0=X0();
 for(const d of DECOR){const box=PROPS[d.kind],k=d.h/box[3];blit(c,a.roofsProps,box,x0+d.x,d.bottom-d.h+1,box[2]*k,d.h);if(d.kind==='sign')text(c,'К МАЧТЕ',x0+d.x+Math.round(65*k)+2,d.bottom-d.h+1+Math.round(48*k+(62*k-7)/2),'#2b1a12',1,1);/* on the board right of the post, clear of the arrow tip (x 65–190, y 48–110 of the sprite) */}
 // Fire-escape ladders: the wooden ladder sprite repeats up the wall.
 const lb=PROPS.ladder,lk=31/lb[2],lh=lb[3]*lk;
 for(const l of ROOF_LADDERS){c.save();c.beginPath();c.rect(x0+l.x-4,l.top-14,40,l.bottom-l.top+14);c.clip();for(let y=l.bottom-lh;y>l.top-lh;y-=lh-6)blit(c,a.roofsProps,lb,x0+l.x,y,31,lh);c.restore();}
 // The mast stairs and its door: closed while any transmitter of the roofs still works.
 if(a.roofsEntrance){const open=!g.relays.some(d=>d.room===ROOM&&d.hp>0),box=ENTRANCE[open?'open':'closed'],k=ROOF_ENTRANCE.h/box[3];blit(c,a.roofsEntrance,box,x0+ROOF_ENTRANCE.x,ROOF_BUILDINGS.at(-1).y-ROOF_ENTRANCE.h+4,box[2]*k,ROOF_ENTRANCE.h);}
}

// Wind from a Нагнетатель: streaks and the painted gust tiles (assets/inflator-wind.png, 3 cells of 235×85) race across the view.
export function drawRoofWind(c,g,t,a){
 if(g.room!==ROOM)return;const w=g.roofs?.wind;if(!w||w.phase==='calm')return;const view=g.viewWidth||768,from=g.camera-40,span=view+80,dir=w.dir,gust=w.phase==='gust';
 c.save();const count=gust?30:10,len=gust?46:20;c.globalAlpha=gust?.5:.28;
 for(let i=0;i<count;i++){const d=(i*137+t*(gust?560:180))%span,x=dir>0?from+d:from+span-d,y=30+(i*53)%400;rect(c,x,y,len,1,i%3?'#cfe4ff':'#ffffff');}
 const img=a?.inflatorWind;if(gust&&img)for(let i=0;i<5;i++){const d=(i*233+t*480)%span,x=dir>0?from+d:from+span-d,y=70+i*72,frame=Math.floor(t*10+i)%3;c.save();c.globalAlpha=.55;c.translate(Math.round(x),Math.round(y));if(dir<0)c.scale(-1,1);c.drawImage(img,frame*235,0,235,85,-118,-42,235,85);c.restore();}
 c.restore();
}
// The Нагнетатель machine (assets/inflator-machine.png, 8 cells of 192×155, feet at y=143.5, horn to the right):
// 0–1 idle, 2 drawing breath, 3–5 blowing, 6 cooling down, 7 struck (unharmed).
export function inflatorFrame(e,t){if(e.hurtTime>0||e.guardFlash>0)return 7;if(e.state==='windup')return 2;if(e.state==='blast')return 3+Math.floor(t*12)%3;if(e.state==='recover')return 6;return Math.floor(t*3)%2;}
// assets/inflator-mast.png (optional, once drawn): 3 cells of 120×120 — platform, a mast segment (tiles vertically), base.
// The mast (assets/inflator-mast.png, drawn at half size): a cantilever deck with a lamp, a lattice segment (cap + tile)
// and a pedestal with guy wires. The machine stands on the deck; the tower rises from the roof under the deck's post.
const MAST={deck:[0,0,259,256],deckTop:107,deckMid:160,post:37,postBottom:250,seg:[261,0,67,128],cap:18,base:[330,0,257,154],baseMid:127,baseTop:60};
function drawMastArt(c,img,fx,fy,base,shift=0){
 const h=v=>v/2,d=MAST.deck,sg=MAST.seg,b=MAST.base,dx=fx-h(MAST.deckMid),dy=fy-h(MAST.deckTop),px=dx+h(MAST.post),sw=h(sg[2]);
 const top=dy+h(MAST.postBottom)-4,bx=px-h(MAST.baseMid)+shift,by=base-h(b[3]);
 c.save();c.beginPath();c.rect(px-sw,top,sw*2,Math.max(0,by+h(MAST.baseTop)-top));c.clip();
 c.drawImage(img,sg[0],sg[1],sg[2],MAST.cap,px-sw/2,top,sw,h(MAST.cap));
 for(let y=top+h(MAST.cap);y<by+h(MAST.baseTop);y+=h(sg[3]-MAST.cap))c.drawImage(img,sg[0],sg[1]+MAST.cap,sg[2],sg[3]-MAST.cap,px-sw/2,y,sw,h(sg[3]-MAST.cap));
 c.restore();
 if(by>top-20)c.drawImage(img,b[0],b[1],b[2],b[3],bx,by,h(b[2]),h(b[3]));
 c.drawImage(img,d[0],d[1],d[2],d[3],dx,dy,h(d[2]),h(d[3]));
}
export function drawInflatorMachine(c,a,e,t,x=e.x+e.w/2,feet=e.y+e.h,width=96){
 const img=a.inflatorMachine;if(!img)return false;const k=width/163,shake=e.state==='blast'?Math.sin(t*50):0;
 // The wall bracket it is bolted to, high above the roofs.
 // It stands on a lattice mast bolted to the roof below (a platform on top, guy wires down to the roof).
 if(e.room===3&&e.mountY!==undefined){const fx=Math.round(x),fy=Math.round(feet),x0=rooms[3].x,roofAt=px=>ROOF_BUILDINGS.filter(b=>px>=x0+b.x+6&&px<=x0+b.x+b.w-6).sort((p,q)=>p.y-q.y)[0],off=(MAST.deckMid-MAST.post)/2;
  // The whole foot of the lattice mast stands on one roof (see mastFooting); mirrored when it fits on the right.
  const foot=mastFooting(fx-x0),flip=!!foot?.flip,base=foot?foot.y:HEIGHT;
  if(a.inflatorMast){if(flip){c.save();c.translate(fx,0);c.scale(-1,1);c.translate(-fx,0);}drawMastArt(c,a.inflatorMast,fx,fy,base,foot?(flip?-foot.shift:foot.shift):0);if(flip)c.restore();}
  else{const half=12,dark='#262b38',lit='#5d6676';
   for(const s of[-1,1]){rect(c,fx+s*half-2,fy,4,base-fy,dark);rect(c,fx+s*half-2,fy,1,base-fy,lit);}
   for(let y=fy+8;y<base-4;y+=22){for(let i=0;i<22&&y+i<base;i+=2){rect(c,fx-half+i*24/22,y+i,3,2,dark);rect(c,fx+half-i*24/22-3,y+i,3,2,dark);}rect(c,fx-half,y,half*2,2,lit);}
   // guy wires and a base plate on the roof
   c.save();c.strokeStyle='rgba(40,46,60,.9)';c.lineWidth=1;c.beginPath();c.moveTo(fx,fy+30);c.lineTo(fx-50,base);c.moveTo(fx,fy+30);c.lineTo(fx+50,base);c.stroke();c.restore();
   rect(c,fx-22,base-5,44,5,dark);rect(c,fx-22,base-5,44,1,lit);
   // platform with railing and a red lamp
   rect(c,fx-46,fy-2,92,6,dark);rect(c,fx-46,fy-2,92,2,lit);for(const s of[-44,44])rect(c,fx+s-1,fy-18,2,16,dark);rect(c,fx-44,fy-18,88,2,lit);rect(c,fx+40,fy-24,5,5,Math.floor(t*2)%2?'#ff4a3a':'#7a1f1a');}
 }
 c.save();c.translate(Math.round(x+shake),Math.round(feet));if(e.dir<0)c.scale(-1,1);c.drawImage(img,inflatorFrame(e,t)*192,0,192,155,-88*k,-143.5*k,192*k,155*k);c.restore();return true;
}

export function drawSensations(c,a,g,t){
 if(g.room!==ROOM||!a.sensation)return;const f=g.roofs?.flock;if(!f)return;
 // The cry before a flock: a «!» blinking at the left edge of the view, at the height they will fly.
 if(f.phase==='warn')drawAttackFx(c,a,'bang',Math.floor(t*8)%2?0:2,g.camera+(g.viewWidth||768)-26,f.lane,40,{alpha:.9});
 if(f.phase!=='fly')return;
 for(const bird of f.birds){if(bird.dead&&bird.deathTime<=0)continue;
  const box=birdBox(f,bird,g.time),frame=bird.dead?7:bird.hit?5:Math.floor(t*12+bird.i)%4,row=frame>>2,col=frame%4,w=CELL_W*BIRD_SCALE,h=CELL_H*BIRD_SCALE;
  c.save();c.globalAlpha=bird.dead?Math.max(0,bird.deathTime/.35):1;c.translate(Math.round(box.x+box.w/2),Math.round(box.y+box.h/2));c.scale(-1,1);
  c.drawImage(a.sensation,col*CELL_W,row*CELL_H,CELL_W,CELL_H,-200*BIRD_SCALE,-(PIVOT_Y[row]-row*CELL_H)*BIRD_SCALE,w,h);c.restore();
 }
}
// Library and notebook portrait: the flight cycle.
export function drawSensationPortrait(c,a,x,y,w,h,time=0,actor={}){
 if(!a.sensation)return;const frame=actor.hurtTime>0?6:actor.state==='windup'?4:['casting','blast','alarm','snap'].includes(actor.state)?5:Math.floor((actor.walkTime??time)*10)%4,row=frame>>2,col=frame%4,scale=Math.min(w/330,h/250);
 c.drawImage(a.sensation,col*CELL_W+20,row?620:150,340,260,x+w/2-170*scale,y+h/2-130*scale,340*scale,260*scale);
}
// One Сенсация in flight, centred at (cx,cy): used by the Agitator's broadcast gusts.
export function drawSensationBird(c,a,cx,cy,dir,time,{burst=false,alpha=1}={}){
 if(!a.sensation)return;const frame=burst?7:Math.floor(time*12)%4,row=frame>>2,col=frame%4,w=CELL_W*BIRD_SCALE,h=CELL_H*BIRD_SCALE;
 c.save();c.globalAlpha=alpha;c.translate(Math.round(cx),Math.round(cy));if(dir<0)c.scale(-1,1);c.drawImage(a.sensation,col*CELL_W,row*CELL_H,CELL_W,CELL_H,-200*BIRD_SCALE,-(PIVOT_Y[row]-row*CELL_H)*BIRD_SCALE,w,h);c.restore();
}
