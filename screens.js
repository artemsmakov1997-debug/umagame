import {monsters} from './catalog.js?v=0.8.0';
import {drawMenuScene,drawPortrait} from './art.js?v=0.8.0';
import {idleFrame} from './menu-animation.js?v=0.8.0';
const $=id=>document.getElementById(id);
export class ScreenManager{
 constructor(assets,onStart,onExit,onQuit=()=>{}){
  this.assets=assets;this.onStart=onStart;this.onExit=onExit;this.onQuit=onQuit;this.view='menu';this.menuIndex=0;this.monsterIndex=0;this.time=0;this.idleAction='idle';this.libraryReturn=null;
  this.menuItems=[...document.querySelectorAll('[data-menu]')];
  this.menuItems.forEach((button,index)=>{button.disabled=false;button.addEventListener('focus',()=>this.highlightMenu(index));button.addEventListener('pointerenter',()=>this.highlightMenu(index));button.addEventListener('click',()=>{
   this.highlightMenu(index);if(button.dataset.menu==='start')this.onStart();else if(button.dataset.menu==='library')this.showLibrary();else if(button.dataset.menu==='authors')this.show('authors');else if(button.dataset.menu==='exit')this.onQuit();
  });});
  for(const button of document.querySelectorAll('[data-back]'))button.addEventListener('click',()=>this.back());
  document.querySelector('#exit-screen button').addEventListener('click',()=>{this.highlightMenu(0);this.show('menu');});
  this.monsterButtons=monsters.map((monster,index)=>{
   const button=document.createElement('button');button.className='monster-option';button.setAttribute('aria-label',monster.name);button.setAttribute('aria-pressed','false');
   const canvas=document.createElement('canvas');canvas.width=140;canvas.height=94;canvas.setAttribute('aria-hidden','true');
   const label=document.createElement('span');label.textContent=monster.name;button.append(canvas,label);$('monster-list').append(button);
   drawPortrait(canvas,assets,monster.id);button.addEventListener('click',()=>this.selectMonster(index));return button;
  });
  this.selectMonster(0);this.show('menu',false);
 }
 showLibrary(returnTo=null){this.libraryReturn=returnTo;document.querySelector('#library-screen [data-back]').textContent=returnTo?'← МЕНЮ ИГРЫ':'← В МЕНЮ';this.show('library');}
 back(){if(this.view==='library'&&this.libraryReturn){const back=this.libraryReturn;this.libraryReturn=null;back();}else this.show('menu');}
 highlightMenu(index){this.menuIndex=(index+this.menuItems.length)%this.menuItems.length;this.menuItems.forEach((el,i)=>el.classList.toggle('selected',i===this.menuIndex));}
 selectMonster(index,focus=false){
  this.monsterIndex=(index+monsters.length)%monsters.length;const monster=monsters[this.monsterIndex];
  this.monsterButtons.forEach((button,i)=>{button.classList.toggle('selected',i===this.monsterIndex);button.setAttribute('aria-pressed',String(i===this.monsterIndex));});
  $('monster-title').textContent=monster.name;$('monster-title').classList.toggle('long-title',monster.name.length>11);$('monster-description').textContent=monster.description;$('monster-tip').textContent=monster.tip;
  const abilities=$('monster-abilities');abilities.replaceChildren();
  for(const [i,[label,value]] of monster.abilities.entries()){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd'),icon=document.createElement('i');icon.className=i===0?'sound-icon':'danger-icon';icon.setAttribute('aria-hidden','true');dt.append(icon,document.createTextNode(label));dd.textContent=value;row.append(dt,dd);abilities.append(row);}
  drawPortrait($('monster-art'),this.assets,monster.id);if(focus)this.monsterButtons[this.monsterIndex].focus({preventScroll:true});
 }
 show(view,focus=true){
  if(this.view==='game'&&view!=='game')this.onExit();this.view=view;$('app').dataset.screen=view;
  for(const id of ['menu','library','authors','exit'])$(`${id}-screen`).hidden=id!==view;
  const game=view==='game';$('pause').hidden=!game;$('controls-art').hidden=!game;$('touch-controls').hidden=!game;$('menu-hint').hidden=game;
  if(!game)$('overlay').hidden=true;
  $('footer-hint').textContent=game?'↓ — КРАСТЬСЯ · SHIFT — РЫВОК · ESC — МЕНЮ':'УМА ПРОТИВ ИНФОШУМА';
  if(game&&$('game').height!==480)$('game').height=480;
  if(focus){if(view==='menu')this.menuItems[this.menuIndex].focus({preventScroll:true});else if(view==='library')this.monsterButtons[this.monsterIndex].focus({preventScroll:true});else if(view==='authors')document.querySelector('#authors-screen [data-back]').focus({preventScroll:true});else if(view==='exit')document.querySelector('#exit-screen button').focus({preventScroll:true});else $('game').focus({preventScroll:true});}
 }
 key(event){
  if(this.view==='game')return false;
  if(event.code==='Escape'){event.preventDefault();this.back();return true;}
  if(this.view==='menu'&&['ArrowUp','ArrowDown'].includes(event.code)){event.preventDefault();this.highlightMenu(this.menuIndex+(event.code==='ArrowDown'?1:-1));this.menuItems[this.menuIndex].focus({preventScroll:true});return true;}
  if(this.view==='library'&&['ArrowUp','ArrowDown'].includes(event.code)){event.preventDefault();this.selectMonster(this.monsterIndex+(event.code==='ArrowDown'?1:-1),true);return true;}
  if(event.code==='Enter'&&this.view==='menu'&&!event.repeat){event.preventDefault();this.menuItems[this.menuIndex].click();return true;}
  return true;
 }
 draw(canvas,time){
  if(canvas.width!==768)canvas.width=768;
  this.time=time;this.idleAction=idleFrame(time).action;const bounds=canvas.getBoundingClientRect(),height=Math.round(768*bounds.height/bounds.width);if(canvas.height!==height)canvas.height=height;
  const c=canvas.getContext('2d');
  if(this.view==='library'){
   c.imageSmoothingEnabled=false;if(height===480)c.drawImage(this.assets.library,0,0,768,512);else{const w=height*1.5;c.drawImage(this.assets.library,(768-w)/2,0,w,height);}
   // Animate the selected illustration and list poses at a pixel animation cadence.
   if(this.lastPortraitTick!==Math.floor(time*12)||this.lastPortraitIndex!==this.monsterIndex){
    drawPortrait($('monster-art'),this.assets,monsters[this.monsterIndex].id,time);
    this.monsterButtons.forEach((button,i)=>drawPortrait(button.querySelector('canvas'),this.assets,monsters[i].id,time+i*.4));
    this.lastPortraitTick=Math.floor(time*12);this.lastPortraitIndex=this.monsterIndex;
   }
  }else drawMenuScene(c,this.assets,time,this.view==='menu');
 }
}
