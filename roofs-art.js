import {rect,text} from './pixel.js?v=0.21.5';
import {rooms,HEIGHT} from './level.js?v=0.21.5';
import {ROOF_BUILDINGS,ROOF_LADDERS,ROOF_ENTRANCE,SENSATION_LANES,WIND} from './roofs-map.js?v=0.21.5';
import {flockState,birdBox,windPhase,BIRD,ROOM} from './roofs-systems.js?v=0.21.5';
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
const DECOR=[{kind:'sign',x:196,bottom:420,h:52},{kind:'vane',x:1000,bottom:298,h:56},{kind:'antenna',x:1646,bottom:230,h:64},{kind:'dish',x:1872,bottom:262,h:44},{kind:'antenna',x:2070,bottom:150,h:70},{kind:'dish',x:2120,bottom:150,h:46}];
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
 for(const d of DECOR){const box=PROPS[d.kind],k=d.h/box[3];blit(c,a.roofsProps,box,x0+d.x,d.bottom-d.h+1,box[2]*k,d.h);if(d.kind==='sign')text(c,'К МАЧТЕ',x0+d.x+6,d.bottom-d.h+9,'#2b1a12',1,1);}
 // Fire-escape ladders: the wooden ladder sprite repeats up the wall.
 const lb=PROPS.ladder,lk=31/lb[2],lh=lb[3]*lk;
 for(const l of ROOF_LADDERS){c.save();c.beginPath();c.rect(x0+l.x-4,l.top-14,40,l.bottom-l.top+14);c.clip();for(let y=l.bottom-lh;y>l.top-lh;y-=lh-6)blit(c,a.roofsProps,lb,x0+l.x,y,31,lh);c.restore();}
 // The mast stairs and its door: closed while any transmitter of the roofs still works.
 if(a.roofsEntrance){const open=!g.relays.some(d=>d.room===ROOM&&d.hp>0),box=ENTRANCE[open?'open':'closed'],k=ROOF_ENTRANCE.h/box[3];blit(c,a.roofsEntrance,box,x0+ROOF_ENTRANCE.x,ROOF_BUILDINGS[8].y-ROOF_ENTRANCE.h+4,box[2]*k,ROOF_ENTRANCE.h);}
}

// Wind: streaks thicken before a gust and race left during it.
export function drawRoofWind(c,g,t){
 if(g.room!==ROOM)return;const phase=windPhase(t),x0=X0(),from=Math.max(g.camera-20,x0+WIND.x1),to=Math.min(g.camera+(g.viewWidth||768)+20,x0+WIND.x2);if(to<=from)return;
 const count=phase==='gust'?34:phase==='warn'?12:5,len=phase==='gust'?46:22;c.save();c.globalAlpha=phase==='gust'?.55:.3;
 for(let i=0;i<count;i++){const span=to-from,x=to-((i*137+t*(phase==='gust'?520:160))%(span+80)),y=40+(i*53)%380;rect(c,x,y,len,1,i%3?'#cfe4ff':'#ffffff');}
 c.restore();
}

export function drawSensations(c,a,g,t){
 if(g.room!==ROOM||!a.sensation)return;const x0=X0();
 for(const [li,lane] of SENSATION_LANES.entries()){
  const s=flockState(lane,t),f=g.roofs?.flocks?.[li],same=f&&f.cycle===s.cycle;
  drawLauncher(c,lane,s,t);
  for(const bird of s.birds){if(!bird.visible)continue;const state=same?f.birds[bird.i]:null;if(state?.dead&&state.deathTime<=0)continue;
   const box=birdBox(lane,bird),frame=state?.dead?7:state?.hit?5:Math.floor(t*12+bird.i)%4,row=frame>>2,col=frame%4,w=CELL_W*BIRD_SCALE,h=CELL_H*BIRD_SCALE;
   const d=Math.abs(bird.x-s.entry),span=lane.x2-lane.x1;c.save();c.globalAlpha=state?.dead?Math.max(0,state.deathTime/.35):Math.min(1,(span-d)/36+.15);const cx=box.x+box.w/2,cy=box.y+box.h/2;c.translate(Math.round(cx),Math.round(cy));if(s.dir<0)c.scale(-1,1);
   c.drawImage(a.sensation,col*CELL_W,row*CELL_H,CELL_W,CELL_H,-200*BIRD_SCALE,-(PIVOT_Y[row]-row*CELL_H)*BIRD_SCALE,w,h);c.restore();
  }
 }
}
// The firework launcher a flock is fired from: on a pole standing on a roof, or bolted to a wall.
// Before a salvo its fuse sparks and a red sign blinks over it; every rocket leaves a muzzle flash and smoke.
function drawLauncher(c,lane,s,t){
 const x0=X0(),dir=s.dir,mx=x0+s.entry,y=lane.y,box={x:Math.round(mx-(dir>0?22:4)),y:y-11,w:26,h:22},L=lane.launcher||{};
 if(L.mount==='pole'){rect(c,mx-(dir>0?12:-6)-2,y+10,5,L.base-y-10,'#1a1622');rect(c,mx-(dir>0?12:-6)-2,y+10,2,L.base-y-10,'#4a4258');rect(c,mx-(dir>0?12:-6)-8,L.base-4,17,4,'#1a1622');}
 else{rect(c,box.x+(dir>0?0:20)-3,y-4,9,8,'#2a2430');rect(c,box.x+(dir>0?0:20)-3,y-4,9,2,'#5a5068');}
 c.save();c.translate(mx,y);c.scale(1.4,1.4);c.translate(-mx,-y);
 c.save();c.globalAlpha=s.warn?.5+.3*Math.sin(t*20):.22;rect(c,box.x-3,box.y-3,box.w+6,box.h+6,'#ffb36a');c.restore();
 rect(c,box.x-1,box.y-1,box.w+2,box.h+2,'#0d0a12');rect(c,box.x,box.y,box.w,box.h,'#5a2d24');rect(c,box.x,box.y,box.w,3,'#8a4a36');rect(c,box.x+3,box.y+8,box.w-6,2,'#3a1c18');
 // Three tubes with red-and-white bands point along the flight.
 for(let i=0;i<3;i++){const ty=box.y+2+i*7,tx=dir>0?box.x+box.w-4:box.x-6;rect(c,tx,ty,10,5,'#e8dcc4');rect(c,tx+3,ty,2,5,'#d63a32');rect(c,dir>0?tx+9:tx,ty+1,2,3,'#120a0a');}
 if(s.warn){const blink=Math.floor(t*8)%2;for(let i=0;i<4;i++){const k=(t*9+i*1.7)%1;rect(c,box.x+box.w/2-1+Math.cos(i*2.1+t*14)*k*9,box.y-2-k*10,2,2,i%2?'#ffd36e':'#ff7a3a');}
  c.save();c.globalAlpha=blink?.95:.5;rect(c,box.x+box.w/2-4,box.y-30,9,20,'#2a0d10');rect(c,box.x+box.w/2-2,box.y-28,5,11,'#ff5a4a');rect(c,box.x+box.w/2-2,box.y-15,5,3,'#ff5a4a');c.restore();}
 c.restore();
 for(const bird of s.birds){const d=Math.abs(bird.x-s.entry);if(d<0||d>34||!bird.visible)continue;const k=d/34,fx=mx+dir*(6+d*.4);c.save();c.globalAlpha=1-k;rect(c,fx-4,y-5,9,9,'#ffe08a');rect(c,fx-2,y-3,5,5,'#ffffff');c.globalAlpha=(1-k)*.7;rect(c,mx-dir*(4+d*.5)-5,y-6-d*.3,11,9,'#6a6478');c.restore();}
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
