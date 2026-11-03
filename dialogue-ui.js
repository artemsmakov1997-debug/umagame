import {scenes} from './story.js?v=0.18.0';
const $=id=>document.getElementById(id);
export class DialogueUI{
 constructor(game,assets,clearInput){this.game=game;this.clearInput=clearInput;this.lastKey=null;$('narrator-portrait').src=assets.yuri.src;$('dialogue-next').addEventListener('click',()=>this.advance());$('dialogue-skip').addEventListener('click',()=>this.advance(true));}
 advance(skip=false){this.clearInput();this.game.advanceDialogue(skip);this.update(true);if(this.game.mode==='playing'){$('game').focus({preventScroll:true});}}
 key(event){
  if(this.game.mode!=='dialogue')return false;
  if(event.code==='Tab'){const buttons=[$('dialogue-next'),$('dialogue-skip')],index=buttons.indexOf(document.activeElement);if(event.shiftKey&&index<=0){event.preventDefault();buttons.at(-1).focus();}else if(!event.shiftKey&&(index<0||index===buttons.length-1)){event.preventDefault();buttons[0].focus();}return true;}
  if(['Enter','Space'].includes(event.code)){event.preventDefault();if(!event.repeat)this.advance(document.activeElement===$('dialogue-skip'));}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','KeyX','ShiftLeft','ShiftRight'].includes(event.code))event.preventDefault();return true;
 }
 update(inGame){
  const d=inGame&&this.game.mode==='dialogue'?this.game.dialogue:null,active=!!d;$('dialogue').hidden=!active;$('app').dataset.dialogue=String(active);
  if(!active){this.lastKey=null;return;}const key=d.id+':'+d.page;if(key===this.lastKey)return;this.lastKey=key;this.clearInput();$('dialogue-text').textContent=(d.pages||scenes[d.id].pages)[d.page];$('dialogue-next').textContent='Далее';$('dialogue-next').focus({preventScroll:true});
 }
}
