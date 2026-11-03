const sources={sources:'./assets/monster-sources.png',destructibles:'./assets/map-destructibles.png',interludes:'./assets/chapter-interludes.png',opening:'./assets/opening-slides.png',room:'./assets/newsroom.png',uma:'./assets/uma.png',noise:'./assets/noise.png',menu:'./assets/menu-clean.png',library:'./assets/library-room.png',idle:'./assets/uma-idle.png',monsters:'./assets/monsters.png',monsterMotion:'./assets/monster-motion.png',journey:'./assets/journey-rooms.png',yuri:'./assets/yuri-cartoon.png',journalists:'./assets/journalists.png',emotions:'./assets/uma-emotions.png',reactions:'./assets/monster-reactions.png',newMotion:'./assets/new-monsters.png',traversal:'./assets/uma-traversal.png',cozy:'./assets/quiet-room.png',baitMotion:'./assets/clickbait-emerge.png',gaits:'./assets/monster-gaits.png',dimension:'./assets/noise-dimension.png',dishes:'./assets/satellite-dishes.png',tactics:'./assets/tactical-monsters.png',rest:'./assets/uma-rest-slide.png',campaign:'./assets/campaign-monsters.png',minibosses:'./assets/minibosses.png',backdrops:'./assets/chapter-backdrops.png',monitors:'./assets/haunted-monitors.png',ending:'./assets/ending-slides.png'};
export async function loadAssets(onProgress=()=>{}){
 let done=0,failed=false;
 const entries=await Promise.all(Object.entries(sources).map(async([name,path])=>{const image=new Image(),url=new URL(path,import.meta.url);url.searchParams.set('v','0.18.0');image.src=url.href;try{await image.decode();}catch(error){failed=true;throw error;}done++;if(!failed)onProgress(done,Object.keys(sources).length);return[name,image];}));
 return Object.fromEntries(entries);
}
export const cats=[
 {box:[46,98,440,362],anchor:.70},{box:[555,118,460,327],anchor:.67},{box:[1037,129,478,316],anchor:.68},
 {box:[53,554,466,336],anchor:.65},{box:[570,567,469,372],anchor:.58},{box:[1155,585,305,347],anchor:.53}
];
export const idleCats=[[87,24,415,474],[569,24,413,474],[1065,24,402,474],[113,529,392,467],[568,523,421,473],[1055,520,421,476]];
export const creatures={crawler:[55,295,590,305],flyer:[677,118,565,486],boss:[15,641,798,567],fish:[898,910,325,200]};
export const newCreatures={clickbait:[28,18,591,581],inflator:[637,61,586,538],panicker:[54,648,542,545],soup:[771,639,340,530]};
export function sprite(c,image,box,x,y,w,h,flip=false){c.save();c.translate(Math.round(x),Math.round(y));if(flip){c.translate(w,0);c.scale(-1,1);}c.drawImage(image,...box,0,0,w,h);c.restore();}
