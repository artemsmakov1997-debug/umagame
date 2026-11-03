export function drawDefeat(canvas,assets,time){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,art=assets.defeat;if(!art)return;
 c.clearRect(0,0,w,h);c.imageSmoothingEnabled=false;
 const scale=Math.min((w-40)/art.width,(h-22)/art.height),iw=art.width*scale,ih=art.height*scale;
 c.save();c.shadowColor='#1d8eab';c.shadowBlur=8+Math.sin(time*2)*2;c.drawImage(art,(w-iw)/2,h-ih-5,iw,ih);c.restore();
}
