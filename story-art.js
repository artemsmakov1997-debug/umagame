import {chapterStories} from './chapter-story.js?v=0.22.0';
export function storyFrame(assets,mode,index,interlude){
 if(mode==='prologue'){const a=assets.opening,w=a.width/2,h=a.height/2;return{a,box:[index%2*w,Math.floor(index/2)*h,w,h]};}
 if(mode==='interlude'&&chapterStories[interlude.boss]?.[index]?.art==='chain')return{a:assets.chain,box:[0,0,assets.chain.width,assets.chain.height]};
 if(mode==='interlude'){const a=assets.storyTransitions,w=a.width/3,h=a.height/3,i=interlude.chapterIndex*3+index;return{a,box:[i%3*w,Math.floor(i/3)*h,w,h]};}
 return null;
}
export function fitStoryImage(c,a,box,width=768,height=512){c.clearRect(0,0,width,height);const scale=Math.min(width/box[2],height/box[3]),w=box[2]*scale,h=box[3]*scale;c.imageSmoothingEnabled=false;c.drawImage(a,...box,(width-w)/2,(height-h)/2,w,h);}
