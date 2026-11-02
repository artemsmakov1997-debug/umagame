import {endingSlides} from './finale.js?v=0.15.0';
const $=id=>document.getElementById(id);
export class EndingUI{
 constructor(game,assets,clearInput){this.game=game;this.assets=assets;this.clearInput=clearInput;this.lastIndex=null;
  $('ending-next').addEventListener('click',()=>this.advance(1));$('ending-prev').addEventListener('click',()=>this.advance(-1));
 }
 advance(direction){this.clearInput();this.game.advanceEnding(direction);this.update(true);}
 update(inGame){
  const active=inGame&&this.game.mode==='ending';$('ending-slides').hidden=!active;$('app').dataset.ending=String(active);
  if(!active){this.lastIndex=null;return;}const i=this.game.ending.index;if(i===this.lastIndex)return;this.lastIndex=i;this.clearInput();
  const slide=endingSlides[i],canvas=$('ending-art'),c=canvas.getContext('2d'),art=this.assets.ending,sw=art.width/2,sh=art.height/2;c.imageSmoothingEnabled=false;c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(art,(i%2)*sw,Math.floor(i/2)*sh,sw,sh,0,0,canvas.width,canvas.height);
  $('ending-count').textContent=`${i+1} / ${endingSlides.length}`;$('ending-title').textContent=slide.title;$('ending-caption').textContent=slide.text;canvas.setAttribute('aria-label',slide.text);
  $('ending-prev').disabled=i===0;$('ending-next').textContent=i===endingSlides.length-1?'К итогам':'Далее';$('ending-next').focus({preventScroll:true});
 }
 key(event){
  if(this.game.mode!=='ending')return false;
  if(['Enter','Space','ArrowRight'].includes(event.code)){event.preventDefault();if(!event.repeat)this.advance(1);}
  else if(event.code==='ArrowLeft'){event.preventDefault();if(!event.repeat)this.advance(-1);}
  else if(event.code==='Tab'){event.preventDefault();const prev=$('ending-prev'),next=$('ending-next');(prev.disabled||document.activeElement===prev?next:prev).focus({preventScroll:true});}
  else if(['ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','KeyX','ShiftLeft','ShiftRight'].includes(event.code))event.preventDefault();else return false;return true;
 }
}
export function drawFinaleBackdrop(c,a,g,width){
 c.fillStyle='#030a1e';c.fillRect(0,0,width,480);const i=g.ending?.index??3,sw=a.ending.width/2,sh=a.ending.height/2,scale=Math.max(width/sw,480/sh);c.save();c.globalAlpha=.4;c.drawImage(a.ending,i%2*sw,Math.floor(i/2)*sh,sw,sh,(width-sw*scale)/2,(480-sh*scale)/2,sw*scale,sh*scale);c.restore();
}
