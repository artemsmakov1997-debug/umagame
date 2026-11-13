import {portraitFrame} from './yuri-portrait.js?v=0.21.5';
import {umaFrame} from './uma-portrait.js?v=0.21.5';
// Visual-novel portraits for the phone dialogue: the whole bust of each cell, scaled to fit (never cropped at the
// shoulders), standing on the text box. Yuri stands on the left looking right, Uma on the right (mirrored) looking at him; the
// one listening is dimmed.
function drawCell(canvas,img,box,dim){
 const c=canvas.getContext('2d');if(canvas.width!==box[2]||canvas.height!==box[3]){canvas.width=box[2];canvas.height=box[3];}
 c.clearRect(0,0,canvas.width,canvas.height);if(!img)return;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 c.drawImage(img,box[0],box[1],box[2],box[3],0,0,box[2],box[3]);
 if(dim){c.globalCompositeOperation='source-atop';c.fillStyle='rgba(4,10,28,.5)';c.fillRect(0,0,canvas.width,canvas.height);c.globalCompositeOperation='source-over';}
}
export function drawNovelPortraits(assets,{speaker,umaEmotion=0,yuriEmotion=0,umaTime=0,yuriTime=0,speaking=true}){
 const uma=assets.umaPortraits,yuri=assets.yuriEmotions,umaTalks=speaker==='uma';
 if(uma){const f=umaFrame(uma,umaTalks?umaEmotion:0,umaTime,umaTalks);drawCell(document.getElementById('novel-uma'),uma,f.box.map(Math.round),!umaTalks);}
 if(yuri){const f=portraitFrame(yuri,yuriEmotion,yuriTime,!umaTalks&&speaking);drawCell(document.getElementById('novel-yuri'),yuri,f.box.map(Math.round),umaTalks);}
}
