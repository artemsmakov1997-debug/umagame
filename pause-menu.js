const $=id=>document.getElementById(id);
export class PauseMenu{
 constructor(game,ui,{clearInput,restart,exit,onResume}){
  this.game=game;this.ui=ui;this.clearInput=clearInput;this.restart=restart;this.exit=exit;this.onResume=onResume;this.active=false;this.panel='root';this.index=0;
  this.items=[...document.querySelectorAll('[data-pause-action]')];
  this.items.forEach((button,index)=>{button.addEventListener('focus',()=>{this.index=index;this.highlight();});button.addEventListener('pointerenter',()=>{this.index=index;this.highlight();});button.addEventListener('click',()=>this.action(button.dataset.pauseAction));});
  $('controls-back').addEventListener('click',()=>this.showRoot());
  $('fullscreen').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});});
 }
 open(){
  if(this.active||this.ui.view!=='game')return;this.previousMode=this.game.mode;this.game.pausedFrom=this.previousMode;this.game.mode='paused';this.active=true;this.clearInput();$('overlay').hidden=true;$('dialogue').hidden=true;$('app').dataset.dialogue='false';this.showRoot();
 }
 showRoot(){
  if(this.ui.view!=='game')this.ui.show('game',false);this.panel='root';$('pause-menu').hidden=false;$('pause-root').hidden=false;$('controls-panel').hidden=true;this.index=0;this.highlight();this.items[0].focus({preventScroll:true});
 }
 highlight(){this.items.forEach((button,i)=>button.classList.toggle('selected',i===this.index));}
 resume(){
  if(!this.active)return;this.active=false;$('pause-menu').hidden=true;this.game.mode=this.previousMode;delete this.game.pausedFrom;this.clearInput();this.onResume(this.previousMode);
 }
 dismiss(){this.active=false;delete this.game.pausedFrom;$('pause-menu').hidden=true;this.clearInput();}
 action(action){
  if(action==='resume')this.resume();
  else if(action==='restart'){this.dismiss();this.restart();}
  else if(action==='controls'){this.panel='controls';$('pause-root').hidden=true;$('controls-panel').hidden=false;$('controls-back').focus({preventScroll:true});}
  else if(action==='library'){this.panel='library';$('pause-menu').hidden=true;this.ui.showLibrary(()=>this.showRoot());}
  else if(action==='exit'){this.dismiss();this.exit();}
 }
 key(event){
  if(!this.active)return false;
  if(this.panel==='library'){if(event.code==='Escape'){event.preventDefault();this.ui.back();}else this.ui.key(event);return true;}
  if(event.code==='Escape'){event.preventDefault();if(!event.repeat){if(this.panel==='root')this.resume();else this.showRoot();}return true;}
  if(this.panel==='root'&&['ArrowUp','ArrowDown'].includes(event.code)){event.preventDefault();this.index=(this.index+(event.code==='ArrowDown'?1:-1)+this.items.length)%this.items.length;this.highlight();this.items[this.index].focus({preventScroll:true});return true;}
  if(event.code==='Enter'&&this.panel==='root'){event.preventDefault();if(!event.repeat)this.items[this.index].click();return true;}
  if(event.code==='Tab'){
   const buttons=this.panel==='root'?this.items:[...$('controls-panel').querySelectorAll('button')],i=buttons.indexOf(document.activeElement);
   if(event.shiftKey&&i<=0){event.preventDefault();buttons.at(-1).focus();}else if(!event.shiftKey&&(i<0||i===buttons.length-1)){event.preventDefault();buttons[0].focus();}return true;
  }
  if(['Space','ArrowLeft','ArrowRight','KeyA','KeyD','KeyW','KeyS','KeyX','ShiftLeft','ShiftRight'].includes(event.code)&&document.activeElement?.tagName!=='BUTTON')event.preventDefault();
  return true;
 }
}
