// Between locations: no loading screen — just Uma running on the spot in the middle of a dark screen.
// assets/loading-cat.png: 4 cells of 190×100, a running cat facing right.
export function drawLoadingScreen(c,a,g,width){
 const e=g.loading;if(!e||!a.loadingCat)return false;
 const dur=e.duration||1.1,alpha=Math.max(0,Math.min(1,e.time/.15,(dur+.15-e.time)/.15));
 c.save();c.globalAlpha=alpha;c.fillStyle='#050816';c.fillRect(0,0,width,480);
 const h=72,w=h*1.9,f=Math.floor(e.time*12)%4,x=Math.round(width/2-w/2),y=Math.round(240-h/2+(f%2?-2:0));
 c.fillStyle='rgba(120,200,255,.12)';c.beginPath();c.ellipse(width/2,240+h/2-4,w*.32,6,0,0,Math.PI*2);c.fill();
 c.drawImage(a.loadingCat,f*190,0,190,100,x,y,Math.round(w),h);c.restore();return true;
}
