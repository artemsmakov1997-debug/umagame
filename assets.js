// Generated art stays separate from the simulation. Atlas rectangles are in source pixels.
const sources={room:'./assets/newsroom.png',uma:'./assets/uma.png',noise:'./assets/noise.png'};
export async function loadAssets(){
 const entries=await Promise.all(Object.entries(sources).map(async([name,path])=>{
  const image=new Image();image.src=new URL(path,import.meta.url).href;await image.decode();return[name,image];
 }));return Object.fromEntries(entries);
}
export const cats=[
 {box:[46,98,440,362],anchor:.70},
 {box:[555,118,460,327],anchor:.67},
 {box:[1037,129,478,316],anchor:.68},
 {box:[53,554,466,336],anchor:.65},
 {box:[570,567,469,372],anchor:.58},
 {box:[1155,585,305,347],anchor:.53}
];
export const creatures={crawler:[55,295,590,305],flyer:[677,118,565,486],boss:[15,641,798,567],fish:[898,910,325,200]};
export function sprite(c,image,box,x,y,w,h,flip=false){
 c.save();c.translate(Math.round(x),Math.round(y));if(flip){c.translate(w,0);c.scale(-1,1);}c.drawImage(image,...box,0,0,w,h);c.restore();
}
