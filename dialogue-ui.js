import {drawYuriPortrait,yuriEmotion,yuriEmotions} from './yuri-portrait.js?v=0.21.5';
import {scenes,dialogueSpeaker} from './story.js?v=0.21.5';
import {drawUmaPortrait,umaEmotions} from './uma-portrait.js?v=0.21.5';
import {drawNovelPortraits} from './novel-portraits.js?v=0.21.5';
const $=id=>document.getElementById(id);
export class DialogueUI{
 constructor(game,assets,clearInput){this.game=game;this.clearInput=clearInput;this.lastKey=null;this.signalClock=0;this.mouthAge=0;this.assets=assets;$('dialogue-next').addEventListener('click',()=>this.advance());$('dialogue-skip').addEventListener('click',()=>this.advance(true));
  // Phone layout: a tap anywhere on the dialogue goes on (the buttons keep their own meaning).
  $('dialogue').addEventListener('click',event=>{if(['panel','landscape'].includes($('app').dataset.layout)&&!event.target.closest('button'))this.advance();});}
 advance(skip=false){this.clearInput();this.game.advanceDialogue(skip);this.update(true);if(this.game.mode==='playing'){$('game').focus({preventScroll:true});}}
 key(event){
  if(this.game.mode!=='dialogue')return false;
  if(event.code==='Tab'){const buttons=[$('dialogue-next'),$('dialogue-skip')],index=buttons.indexOf(document.activeElement);if(event.shiftKey&&index<=0){event.preventDefault();buttons.at(-1).focus();}else if(!event.shiftKey&&(index<0||index===buttons.length-1)){event.preventDefault();buttons[0].focus();}return true;}
  if(['Enter','Space'].includes(event.code)){event.preventDefault();if(!event.repeat)this.advance(document.activeElement===$('dialogue-skip'));}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','KeyX','ShiftLeft','ShiftRight'].includes(event.code))event.preventDefault();return true;
 }
 update(inGame,dt=0){
  const d=inGame&&this.game.mode==='dialogue'?this.game.dialogue:null,active=!!d;$('dialogue').hidden=!active;$('app').dataset.dialogue=String(active);
  if(!active){if(this.game.mode!=='paused')this.lastKey=null;return;}this.signalClock+=dt;this.mouthAge+=dt;const portrait=$('narrator-portrait'),speaker=dialogueSpeaker(d),uma=speaker.who==='uma';$('dialogue').dataset.speaker=speaker.who;
  // Uma answers in her own window: her portrait, name and emotion instead of Yuri's.
  if($('app').dataset.layout==='panel')drawNovelPortraits(this.assets,{speaker:speaker.who,umaEmotion:uma?speaker.emotion:0,yuriEmotion:yuriEmotion(this.game),umaTime:this.mouthAge,yuriTime:this.signalClock,speaking:uma||this.mouthAge<4});
  if(uma){portrait.dataset.emotion=umaEmotions[speaker.emotion];portrait.setAttribute('aria-label','Ума');drawUmaPortrait(portrait.getContext('2d'),this.assets,{time:this.mouthAge,emotion:speaker.emotion,speaking:true});}
  else{const emotion=yuriEmotion(this.game);portrait.dataset.emotion=yuriEmotions[emotion];portrait.setAttribute('aria-label','Юрий Шмаков на экране');drawYuriPortrait(portrait.getContext('2d'),this.assets,{time:this.signalClock,emotion,quality:(d.signal||this.game.signal).quality,speaking:this.mouthAge<4});}
  $('dialogue-speaker').textContent=uma?'Ума':'Юрий Шмаков';const role=document.querySelector('.narrator-role');if(role)role.textContent=uma?'кошка редактора':'редактор';const stage=(d.signal||{state:'stable'}).state;$('dialogue').dataset.signal=stage;$('dialogue').style.setProperty('--signal-shift',Math.floor(this.signalClock*5)%11===0?'2px':'0px');$('dialogue').style.setProperty('--signal-loss',Math.floor(this.signalClock*(stage==='fading'?4:2))%9===0?'.35':'1');const key=d.id+':'+d.page;if(key===this.lastKey)return;this.lastKey=key;this.mouthAge=0;this.clearInput();$('dialogue-text').textContent=(d.pages||scenes[d.id].pages)[d.page];$('dialogue-next').textContent='Далее';$('dialogue-next').focus({preventScroll:true});
 }
}
