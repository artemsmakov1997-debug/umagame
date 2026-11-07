import {rooms,chapters} from './level.js?v=0.21.5';
const $=id=>document.getElementById(id);
// Level select rows: the quiet room, then each chapter's location and its boss arena.
const BOSS_NAMES={spreader:'Распростра\u00adнитель',agitator:'Агитатор',manipulator:'Манипулятор',infoshum:'Инфошум'};
const title=name=>name.charAt(0)+name.slice(1).toLowerCase();
export const levelRows=[{chapter:'Пролог',levels:[{room:0,label:'Тихая комната'}]},...chapters.map((c,i)=>({chapter:'Глава '+(i+1),levels:[{room:c.room,label:title(rooms[c.room].name)},{room:c.arena,label:BOSS_NAMES[c.boss],boss:true}]}))];
export class PauseMenu{
 constructor(game,ui,{clearInput,restart,exit,onResume,openSettings,selectLevel}){
  this.game=game;this.ui=ui;this.clearInput=clearInput;this.restart=restart;this.exit=exit;this.onResume=onResume;this.openSettings=openSettings;this.selectLevel=selectLevel;this.active=false;this.panel='root';this.index=0;
  this.items=[...document.querySelectorAll('[data-pause-action]')];
  this.items.forEach((button,index)=>{button.addEventListener('focus',()=>{this.index=index;this.highlight();});button.addEventListener('pointerenter',()=>{this.index=index;this.highlight();});button.addEventListener('click',()=>this.action(button.dataset.pauseAction));});
  $('controls-back').addEventListener('click',()=>this.showRoot());
  const list=$('levels-list');this.levelButtons=[];
  for(const row of levelRows){const caption=document.createElement('span');caption.className='level-chapter';caption.textContent=row.chapter;list.append(caption);
   for(const level of row.levels){const button=document.createElement('button');button.className='menu-item'+(level.boss?' boss':'')+(row.levels.length===1?' wide':'');button.textContent=level.label;button.dataset.level=level.room;button.addEventListener('click',()=>this.chooseLevel(level.room));button.addEventListener('pointerenter',()=>this.focusLevel(this.levelButtons.indexOf(button)));list.append(button);this.levelButtons.push(button);}}
  $('levels-back').addEventListener('click',()=>this.showRoot());

 }
 open(){
  if(this.active||this.ui.view!=='game')return;this.previousMode=this.game.mode;this.game.pausedFrom=this.previousMode;this.game.mode='paused';this.active=true;this.clearInput();$('overlay').hidden=true;$('dialogue').hidden=true;$('app').dataset.dialogue='false';this.showRoot();
 }
 showRoot(){
  if(this.ui.view!=='game')this.ui.show('game',false);this.panel='root';$('pause-menu').hidden=false;$('pause-root').hidden=false;$('controls-panel').hidden=true;$('levels-panel').hidden=true;$('pause-root').scrollTop=0;this.index=0;this.highlight();this.items[0].focus({preventScroll:true});
 }
 showLevels(){
  this.panel='levels';$('pause-root').hidden=true;$('levels-panel').hidden=false;$('levels-panel').scrollTop=0;
  const current=Math.max(0,this.levelButtons.findIndex(b=>Number(b.dataset.level)===this.game.room));this.levelButtons.forEach(b=>b.classList.toggle('current',Number(b.dataset.level)===this.game.room));this.focusLevel(current);
 }
 focusLevel(index){if(index<0)return;this.levelIndex=index;this.levelButtons.forEach((b,i)=>b.classList.toggle('selected',i===index));this.levelButtons[index].focus({preventScroll:true});this.levelButtons[index].scrollIntoView({block:'nearest'});}
 chooseLevel(room){this.dismiss();this.selectLevel(room);}
 highlight(){this.items.forEach((button,i)=>button.classList.toggle('selected',i===this.index));}
 resume(){
  if(!this.active)return;this.active=false;$('pause-menu').hidden=true;this.game.mode=this.previousMode;delete this.game.pausedFrom;this.clearInput();this.onResume(this.previousMode);
 }
 dismiss(){this.active=false;delete this.game.pausedFrom;$('pause-menu').hidden=true;this.clearInput();}
 action(action){
  if(action==='resume')this.resume();
  else if(action==='settings'){this.panel='settings';$('pause-root').hidden=true;this.openSettings(()=>this.showRoot());}
  else if(action==='restart'){this.dismiss();this.restart();}
  else if(action==='controls'){this.panel='controls';$('pause-root').hidden=true;$('controls-panel').hidden=false;$('controls-back').focus({preventScroll:true});}
  else if(action==='levels')this.showLevels();
  else if(action==='library'){this.panel='library';$('pause-menu').hidden=true;this.ui.showLibrary(()=>this.showRoot());}
  else if(action==='exit'){this.dismiss();this.exit();}
 }
 key(event){
  if(!this.active)return false;
  if(this.panel==='library'){if(event.code==='Escape'){event.preventDefault();this.ui.back();}else this.ui.key(event);return true;}
  if(event.code==='Escape'){event.preventDefault();if(!event.repeat){if(this.panel==='root')this.resume();else this.showRoot();}return true;}
  if(this.panel==='levels'){
   const n=this.levelButtons.length,i=this.levelIndex??0;
   if(event.code==='ArrowRight'||event.code==='ArrowDown'&&i===0){event.preventDefault();this.focusLevel(Math.min(n-1,i+1));return true;}
   if(event.code==='ArrowLeft'){event.preventDefault();this.focusLevel(Math.max(0,i-1));return true;}
   if(event.code==='ArrowDown'){event.preventDefault();this.focusLevel(Math.min(n-1,i+2));return true;}
   if(event.code==='ArrowUp'){event.preventDefault();this.focusLevel(i<=2?0:i-2);return true;}
   if(event.code==='Enter'){event.preventDefault();if(!event.repeat)document.activeElement?.click();return true;}
  }
  if(this.panel==='root'&&['ArrowUp','ArrowDown'].includes(event.code)){event.preventDefault();this.index=(this.index+(event.code==='ArrowDown'?1:-1)+this.items.length)%this.items.length;this.highlight();this.items[this.index].focus({preventScroll:true});this.items[this.index].scrollIntoView({block:'nearest'});return true;}
  if(event.code==='Enter'&&this.panel==='root'){event.preventDefault();if(!event.repeat)this.items[this.index].click();return true;}
  if(event.code==='Tab'){
   const buttons=this.panel==='root'?this.items:[...$(this.panel==='levels'?'levels-panel':'controls-panel').querySelectorAll('button')],i=buttons.indexOf(document.activeElement);
   if(event.shiftKey&&i<=0){event.preventDefault();buttons.at(-1).focus();}else if(!event.shiftKey&&(i<0||i===buttons.length-1)){event.preventDefault();buttons[0].focus();}return true;
  }
  if(['Space','ArrowLeft','ArrowRight','KeyA','KeyD','KeyW','KeyS','KeyX','ShiftLeft','ShiftRight'].includes(event.code)&&document.activeElement?.tagName!=='BUTTON')event.preventDefault();
  return true;
 }
}
