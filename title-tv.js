// The menu title flickers like an old TV. The logo (assets/game-heading.png, shown by the SVG in index.html) is
// copied onto a canvas laid over it at the screen's pixel density; about 15 times a second its rows are redrawn with
// a gentle travelling ripple, red/cyan fringes, scanlines and now and then a short burst of tearing and a bright
// band rolling down. It is cheap (one drawImage per row band) and it stops when the menu is hidden. With «reduce
// motion» the title stays still.
const SRC='./assets/game-heading.png?v=0.21.5',VIEW=[65,109,2063,525],FPS=15;
let started=false;
export function startTitleTV(){
 if(started||typeof document==='undefined')return;started=true;
 const svg=document.querySelector('.game-logo');if(!svg)return;
 const canvas=document.createElement('canvas');canvas.className='game-logo-tv';canvas.setAttribute('aria-hidden','true');svg.after(canvas);
 const img=new Image();img.src=SRC;
 let base=null,red=null,blue=null,size='',last=0;
 const still=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const tinted=(src,color)=>{const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const x=c.getContext('2d');x.drawImage(src,0,0);x.globalCompositeOperation='source-in';x.fillStyle=color;x.fillRect(0,0,c.width,c.height);return c;};
 function prepare(){
  const r=svg.getBoundingClientRect();if(!r.width||!r.height||!img.naturalWidth)return false;const dpr=Math.min(2,globalThis.devicePixelRatio||1),W=Math.round(r.width*dpr),H=Math.round(r.height*dpr),key=W+'x'+H;
  if(key===size)return true;size=key;canvas.width=W;canvas.height=H;
  // Fit the logo's view box into the box the SVG occupies (xMidYMid meet), at the canvas resolution.
  const k=Math.min(W/VIEW[2],H/VIEW[3]),w=Math.round(VIEW[2]*k),h=Math.round(VIEW[3]*k);
  base=document.createElement('canvas');base.width=w;base.height=h;const b=base.getContext('2d');b.imageSmoothingEnabled=true;b.drawImage(img,VIEW[0],VIEW[1],VIEW[2],VIEW[3],0,0,w,h);
  // Scanlines baked into the logo itself.
  b.globalCompositeOperation='source-atop';b.fillStyle='rgba(0,7,22,.28)';const step=Math.max(3,Math.round(3*dpr));for(let y=0;y<h;y+=step)b.fillRect(0,y,w,Math.max(1,Math.round(step/3)));
  red=tinted(base,'rgba(255,60,120,1)');blue=tinted(base,'rgba(60,220,255,1)');
  canvas.dataset.ox=String(Math.round((W-w)/2));canvas.dataset.oy=String(Math.round((H-h)/2));return true;
 }
 function draw(t){
  const c=canvas.getContext('2d'),W=canvas.width,H=canvas.height,ox=+canvas.dataset.ox,oy=+canvas.dataset.oy,w=base.width,h=base.height;c.clearRect(0,0,W,H);
  const cycle=t%6.3,burst=cycle>2.6&&cycle<2.8?1:cycle>4.9&&cycle<5.02?.6:0,fringe=Math.max(2,w*.0028)*(1+burst*2.5),band=Math.max(2,Math.round(h/90));
  const flick=(t%3.1>1.45&&t%3.1<1.5)?.86:1;
  c.globalAlpha=.42*flick;c.drawImage(red,ox+fringe,oy);c.globalAlpha=.42*flick;c.drawImage(blue,ox-fringe,oy);c.globalAlpha=flick;
  for(let y=0;y<h;y+=band){const wave=Math.sin(y*.045+t*7)*w*.0018+Math.sin(y*.013-t*3)*w*.0012,tear=burst&&Math.sin(y*.31+Math.floor(t*30))>.55?(Math.sin(y*7.1+t*50))*w*.02*burst:0;
   c.drawImage(base,0,y,w,Math.min(band,h-y),Math.round(ox+wave+tear),oy+y,w,Math.min(band,h-y));}
  // A soft bright band rolls down over the letters now and then.
  const roll=(t%4.7)/4.7;if(roll>.62){const yb=oy+((roll-.62)/.38)*(h+40)-20;c.save();c.globalCompositeOperation='source-atop';c.globalAlpha=.16;c.fillStyle='#d9fbff';c.fillRect(0,yb,W,Math.max(6,h*.08));c.restore();}
  c.globalAlpha=1;
 }
 function frame(now){
  requestAnimationFrame(frame);
  const visible=document.getElementById('app')?.dataset.screen==='menu'&&!document.hidden;if(!visible)return;
  if(now-last<1000/FPS)return;last=now;if(!prepare())return;
  svg.style.visibility='hidden';canvas.style.display='block';draw(still?0:now/1000);
 }
 img.onload=()=>requestAnimationFrame(frame);
}
