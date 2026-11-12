// Uma's dialogue portraits (assets/uma-portraits.png, 7×3 cells of 252×262, the bust on the bottom edge):
// columns are emotions, rows are eyes open / blink / mouth open (a meow).
export const umaEmotions=['calm','alert','surprised','worried','frightened','happy','determined'];
export function umaFrame(a,emotion,t,speaking=true){const blink=t%3.7>3.56,row=blink?1:speaking&&t<1.1&&Math.floor(t*6)%2===0?2:0,w=a.width/7,h=a.height/3;return{box:[emotion*w,row*h,w,h],row};}
export function drawUmaPortrait(c,a,{x=0,y=0,w=224,h=280,time=0,emotion=0,speaking=true}={}){
 const art=a.umaPortraits;if(!art)return null;const f=umaFrame(art,emotion,time,speaking),scale=Math.min(w/f.box[2],h/f.box[3]),dw=f.box[2]*scale,dh=f.box[3]*scale;
 c.save();c.beginPath();c.rect(x,y,w,h);c.clip();const bg=c.createLinearGradient(0,y,0,y+h);bg.addColorStop(0,'#0c2236');bg.addColorStop(1,'#051626');c.fillStyle=bg;c.fillRect(x,y,w,h);
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(art,...f.box,x+(w-dw)/2,y+h-dh,dw,dh);c.restore();return{emotion,row:f.row};
}
