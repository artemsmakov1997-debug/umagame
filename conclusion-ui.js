import {closingParagraphs,closingText} from './conclusion.js?v=0.21.1';
const $=id=>document.getElementById(id);
export class ConclusionUI{
 constructor(game,clearInput){this.game=game;this.clearInput=clearInput;this.keyState=null;this.parts=[...document.querySelectorAll('[data-closing-part]')];$('closing-next').addEventListener('click',()=>this.advance());$('closing-skip').addEventListener('click',()=>this.advance(true));}
 advance(skip=false){this.clearInput();this.game.advanceConclusion(skip);this.update(true);}
 update(inGame){const s=this.game.conclusion,active=inGame&&this.game.mode==='conclusion';$('closing-screen').hidden=!active;if(!active){this.keyState=null;return;}$('closing-screen').dataset.stage=s.stage;$('closing-screen').style.setProperty('--fade',Math.min(1,s.elapsed/.7));$('closing-screen').style.setProperty('--copy',s.stage==='brand'?1-Math.min(1,s.elapsed/.55):1);$('closing-screen').style.setProperty('--brand',Math.max(0,Math.min(1,(s.elapsed-.55)/.7)));$('closing-screen').style.setProperty('--cursor',Math.floor(s.elapsed*2)%2?0:1);
  let offset=0;this.parts.forEach((p,i)=>{const content=closingParagraphs[i].slice(0,Math.max(0,s.revealed-offset));if(p.textContent!==content)p.textContent=content;offset+=closingParagraphs[i].length+2;});
  $('closing-next').textContent=s.stage==='brand'?'К результатам':['fade','typing'].includes(s.stage)?'Показать текст':'Далее';
  if(this.keyState!==s.stage){this.keyState=s.stage;$('closing-next').focus({preventScroll:true});if(s.stage==='read')$('closing-readable').textContent=closingText;if(s.stage==='brand')$('closing-readable').textContent='МЕДИА.СТРАЖ';}
 }
 key(event){if(this.game.mode!=='conclusion')return false;if(['ArrowUp','ArrowDown','PageUp','PageDown'].includes(event.code)){event.preventDefault();document.querySelector('.closing-copy').scrollTop+=(event.code.includes('Up')?-1:1)*(event.code.startsWith('Page')?180:36);}else if(event.code==='Tab'){event.preventDefault();(document.activeElement===$('closing-next')?$('closing-skip'):$('closing-next')).focus({preventScroll:true});}else if(['Enter','Space','ArrowRight'].includes(event.code)){event.preventDefault();if(!event.repeat)this.advance(document.activeElement===$('closing-skip'));}else if(['ArrowLeft','KeyA','KeyD','KeyW','KeyS','KeyX','ShiftLeft','ShiftRight'].includes(event.code))event.preventDefault();return true;}
}
