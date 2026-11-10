import {chapterStories} from './chapter-story.js?v=0.21.5';
// Extra scenes live in assets/story-extra.jpg (two frames side by side) and are referenced as art:'extra:N'.
export function extraFrame(assets,n){const a=assets.storyExtra,w=a.width/2;return{a,box:[n*w,0,w,a.height]};}
export function storyFrame(assets,mode,index,interlude){
 if(mode==='prologue'){const a=assets.opening,w=a.width/2,h=a.height/2;return{a,box:[index%2*w,Math.floor(index/2)*h,w,h]};}
 if(mode==='interlude'){const art=chapterStories[interlude.boss]?.[index]?.art;if(typeof art==='string'&&art.startsWith('extra:'))return extraFrame(assets,+art.split(':')[1]);const a=assets.storyTransitions,w=a.width/3,h=a.height/3,i=typeof art==='number'?art:interlude.chapterIndex*3+index;return{a,box:[i%3*w,Math.floor(i/3)*h,w,h]};}
 return null;
}
export function fitStoryImage(c,a,box,width=768,height=512){c.clearRect(0,0,width,height);const scale=Math.min(width/box[2],height/box[3]),w=box[2]*scale,h=box[3]*scale;c.imageSmoothingEnabled=false;c.drawImage(a,...box,(width-w)/2,(height-h)/2,w,h);}
