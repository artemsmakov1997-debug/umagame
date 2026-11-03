import {chapterStories} from './chapter-story.js?v=0.19.0';
import {openingSlides} from './prologue.js?v=0.19.0';
import {endingSlides} from './finale.js?v=0.19.0';
const $=id=>document.getElementById(id);
// The painted first row has unequal panel widths; use its actual scene boundaries.
const interludeFrames=[[[0,0,444,512],[0,512,512,512]],[[445,0,323,512],[512,512,512,512]],[[770,0,766,512],[1024,512,512,512]]];
export function drawOpenEnding(c,width,height){
 const sx=width/768,sy=height/512;c.save();c.scale(sx,sy);c.imageSmoothingEnabled=false;
 c.fillStyle='#030818';c.fillRect(0,0,768,512);
 for(let i=0;i<62;i++){const x=(i*109+43)%768,y=(i*67+31)%512;c.fillStyle=i%4?'#123250':'#21536c';c.fillRect(x,y,i%3+1,i%3+1);}
 c.fillStyle='#0d223a';c.fillRect(192,36,384,442);c.fillStyle='#85baca';c.fillRect(198,42,372,430);
 c.fillStyle='#071524';c.fillRect(206,50,356,414);c.fillStyle='#0e3047';c.fillRect(220,80,328,314);
 c.fillStyle='#c2dfe3';c.fillRect(347,58,74,5);
 c.font='24px UmaText, monospace';c.fillStyle='#ffde98';c.textAlign='center';c.fillText('НОВОЕ СООБЩЕНИЕ',384,138);
 c.fillStyle='#31566b';c.fillRect(246,178,278,112);c.fillStyle='#83b5c2';
 for(let i=0;i<4;i++)c.fillRect(262,198+i*20,210-(i%3)*38,5);
 c.fillStyle='#f3d28e';c.fillRect(279,324,210,47);c.fillStyle='#071524';c.font='22px UmaText, monospace';c.fillText('ПОДЕЛИТЬСЯ',384,353);
 c.fillStyle='#f1bd89';c.fillRect(471,363,44,48);c.fillRect(447,385,57,37);
 c.fillStyle='#f1bd89';c.fillRect(458,345,15,43);c.fillStyle='#a57359';c.fillRect(455,351,3,37);
 c.fillStyle='#061224';c.fillRect(331,434,106,9);c.restore();
}
export class EndingUI{
 constructor(game,assets,clearInput){this.game=game;this.assets=assets;this.clearInput=clearInput;this.lastIndex=null;
  $('ending-next').addEventListener('click',()=>this.advance(1));$('ending-prev').addEventListener('click',()=>this.advance(-1));
 }
 advance(direction){this.clearInput();if(this.game.mode==='prologue')this.game.advanceOpening(direction);else if(this.game.mode==='interlude')this.game.advanceInterlude(direction);else this.game.advanceEnding(direction);this.update(true);}
 update(inGame){
  const active=inGame&&['ending','prologue','interlude'].includes(this.game.mode);$('ending-slides').hidden=!active;$('app').dataset.ending=String(active);
  if(!active){this.lastIndex=null;return;}const opening=this.game.mode==='prologue',chapter=this.game.mode==='interlude',slides=opening?openingSlides:chapter?chapterStories[this.game.interlude.boss]:endingSlides,i=opening?this.game.openingIndex:chapter?this.game.interlude.index:this.game.ending.index,key=this.game.mode+i;if(key===this.lastIndex)return;this.lastIndex=key;this.clearInput();
  const slide=slides[i],canvas=$('ending-art'),c=canvas.getContext('2d'),art=opening?this.assets.opening:chapter?this.assets.interludes:this.assets.ending,sw=art.width/2,sh=art.height/2,frame=chapter?interludeFrames[this.game.interlude.chapterIndex][i]:[i%2*sw,Math.floor(i/2)*sh,sw,sh];canvas.width=chapter?frame[2]:768;canvas.height=512;c.imageSmoothingEnabled=false;c.clearRect(0,0,canvas.width,canvas.height);if(!opening&&!chapter&&i>=4)drawOpenEnding(c,canvas.width,canvas.height);else c.drawImage(art,...frame,0,0,canvas.width,canvas.height);
  $('app').dataset.story=chapter?'interlude':opening?'prologue':'ending';
  $('ending-title').closest('header').hidden=opening;$('ending-slides').setAttribute('aria-label',opening?'История Умы':slide.title);if(opening)$('ending-slides').removeAttribute('aria-labelledby');else $('ending-slides').setAttribute('aria-labelledby','ending-title');
  $('ending-count').textContent=opening?'':`${i+1} / ${slides.length}`;$('ending-title').textContent=opening?'':slide.title;$('ending-caption').textContent=slide.text;canvas.setAttribute('aria-label',slide.text);
  $('ending-prev').disabled=i===0;$('ending-next').textContent=i===slides.length-1?(opening?'Начать':chapter?'В путь':'К итогам'):'Далее';$('ending-next').focus({preventScroll:true});
 }
 key(event){
  if(!['ending','prologue','interlude'].includes(this.game.mode))return false;
  if(['Enter','Space','ArrowRight'].includes(event.code)){event.preventDefault();if(!event.repeat)this.advance(1);}
  else if(event.code==='ArrowLeft'){event.preventDefault();if(!event.repeat)this.advance(-1);}
  else if(event.code==='Tab'){event.preventDefault();const prev=$('ending-prev'),next=$('ending-next');(prev.disabled||document.activeElement===prev?next:prev).focus({preventScroll:true});}
  else if(['ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','KeyX','ShiftLeft','ShiftRight'].includes(event.code))event.preventDefault();else return false;return true;
 }
}
export function drawFinaleBackdrop(c,a,g,width){
 c.fillStyle='#030a1e';c.fillRect(0,0,width,480);const i=g.ending?.index??3,sw=a.ending.width/2,sh=a.ending.height/2,scale=Math.max(width/sw,480/sh);c.save();c.globalAlpha=.4;if(i>=4)drawOpenEnding(c,width,480);else c.drawImage(a.ending,i%2*sw,Math.floor(i/2)*sh,sw,sh,(width-sw*scale)/2,(480-sh*scale)/2,sw*scale,sh*scale);c.restore();
}
