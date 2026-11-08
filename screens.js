import {chapters} from './level.js?v=0.21.5';
import {monsters} from './catalog.js?v=0.21.5';
// Wax seals for each ability (assets/library-seals.png): 0 projectile, 1 summon, 2 dash, 3 area, 4 shield, 5 trap, 6 swirl/teleport, 7 beam, 8 stun, 9 warning.
const ABILITY_SEALS={fakenews:[2,9],censor:[3,4],stamp:[5,8],spreader:[0,2],informant:[6,0],paparazzi:[6,0],inflator:[7,5],sensation:[1,8],agitator:[9,3],botfarm:[1,9],cutter:[9,5],splicer:[6,8],manipulator:[7,5],echo:[6,9],clickbait:[5,8],static:[2,8],infoshum:[4,7]};
import {drawMenuScene,drawPortrait} from './art.js?v=0.21.5';
import {idleFrame} from './menu-animation.js?v=0.21.5';
const $=id=>document.getElementById(id);
export class ScreenManager{
 constructor(assets,onStart,onExit,onQuit=()=>{},onSettings=()=>{}){
  this.onSettings=onSettings;this.assets=assets;this.onStart=onStart;this.onExit=onExit;this.onQuit=onQuit;this.view='menu';this.menuIndex=0;this.monsterIndex=0;this.time=0;this.idleAction='idle';this.libraryReturn=null;
  this.menuItems=[...document.querySelectorAll('[data-menu]')];
  this.menuItems.forEach((button,index)=>{button.disabled=false;button.addEventListener('focus',()=>this.highlightMenu(index));button.addEventListener('pointerenter',()=>this.highlightMenu(index));button.addEventListener('click',()=>{
   this.highlightMenu(index);if(button.dataset.menu==='start')this.onStart();else if(button.dataset.menu==='library')this.showLibrary();else if(button.dataset.menu==='settings')this.onSettings();else if(button.dataset.menu==='authors')this.show('authors');else if(button.dataset.menu==='exit')this.onQuit();
  });});
  for(const button of document.querySelectorAll('[data-back]'))button.addEventListener('click',()=>this.back());
  this.chapterButtons=chapters.map((chapter,index)=>{const button=document.createElement('button');button.className='library-tab';button.style.setProperty('--tab',index);button.setAttribute('aria-label',chapter.name);button.title=chapter.name;const name=document.createElement('span');name.textContent=chapter.name;button.append(name);button.dataset.chapter=index;button.addEventListener('click',()=>this.selectChapter(index));$('library-chapters').append(button);return button;});
  this.monsterButtons=monsters.map((monster,index)=>{
   const button=document.createElement('button');button.className='monster-option'+(monster.boss?' boss':'');button.setAttribute('aria-label',monster.name);button.setAttribute('aria-pressed','false');
   const canvas=document.createElement('canvas');canvas.width=128;canvas.height=118;canvas.setAttribute('aria-hidden','true');
   const label=document.createElement('span');label.textContent=monster.name;if(monster.name.length>11)label.className='long';if(monster.id==='spreader')label.replaceChildren('Распростра',document.createElement('wbr'),'нитель');button.append(canvas,label);$('monster-list').append(button);
   drawPortrait(canvas,assets,monster.id);button.addEventListener('click',()=>this.selectMonster(index));return button;
  });
  // Notebook pager: arrows leaf through the chapters, dots show where you are.
  const pager=document.createElement('div');pager.className='library-pager';
  const prev=document.createElement('button');prev.id='library-prev';prev.className='library-arrow prev';prev.setAttribute('aria-label','Предыдущая глава');prev.addEventListener('click',()=>this.selectChapter(this.chapterIndex-1));
  const next=document.createElement('button');next.id='library-next';next.className='library-arrow next';next.setAttribute('aria-label','Следующая глава');next.addEventListener('click',()=>this.selectChapter(this.chapterIndex+1));
  const dots=document.createElement('span');dots.className='library-dots';dots.setAttribute('aria-hidden','true');this.chapterDots=chapters.map(()=>{const dot=document.createElement('i');dots.append(dot);return dot;});
  pager.append(prev,dots,next);document.querySelector('.library-panel').append(pager);
  this.selectMonster(0);this.show('menu',false);
 }
 showLibrary(returnTo=null){this.libraryReturn=returnTo;document.querySelector('#library-screen [data-back]').textContent=returnTo?'← МЕНЮ ИГРЫ':'← В МЕНЮ';this.show('library');}
 back(){if(this.view==='library'&&this.libraryReturn){const back=this.libraryReturn;this.libraryReturn=null;back();}else this.show('menu');}
 highlightMenu(index){this.menuIndex=(index+this.menuItems.length)%this.menuItems.length;this.menuItems.forEach((el,i)=>el.classList.toggle('selected',i===this.menuIndex));}
 selectMonster(index,focus=false){
  this.monsterIndex=(index+monsters.length)%monsters.length;const monster=monsters[this.monsterIndex];this.chapterIndex=monster.chapter;this.chapterButtons.forEach((button,i)=>{button.classList.toggle('selected',i===this.chapterIndex);button.setAttribute('aria-pressed',String(i===this.chapterIndex));});this.chapterDots?.forEach((dot,i)=>dot.classList.toggle('on',i===this.chapterIndex));$('monster-card').dataset.chapter=this.chapterIndex;
  this.monsterButtons.forEach((button,i)=>{button.hidden=monsters[i].chapter!==this.chapterIndex;button.classList.toggle('selected',i===this.monsterIndex);button.setAttribute('aria-pressed',String(i===this.monsterIndex));});
  $('monster-card').dataset.monster=monster.id;$('monster-title').textContent=monster.name;$('monster-title').classList.toggle('long-title',monster.name.length>11);$('monster-description').textContent=monster.description;$('monster-tip').textContent=monster.tip;
  const abilities=$('monster-abilities');abilities.replaceChildren();
  for(const [i,[label,value]] of monster.abilities.entries()){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd'),icon=document.createElement('i');icon.className='seal-icon';icon.style.setProperty('--seal',(ABILITY_SEALS[monster.id]||[0,9])[i]);icon.setAttribute('aria-hidden','true');dt.append(icon,document.createTextNode(label));dd.textContent=value;row.append(dt,dd);abilities.append(row);}
  drawPortrait($('monster-art'),this.assets,monster.id);if(focus){this.monsterButtons[this.monsterIndex].focus({preventScroll:true});this.monsterButtons[this.monsterIndex].scrollIntoView({block:'nearest',inline:'nearest'});}
 }
 selectChapter(index){const next=(index+chapters.length)%chapters.length;this.selectMonster(monsters.findIndex(m=>m.chapter===next),true);}
 show(view,focus=true){
  if(this.view==='game'&&view!=='game')this.onExit();this.view=view;$('app').dataset.screen=view;
  for(const id of ['menu','library','authors'])$(`${id}-screen`).hidden=id!==view;
  const game=view==='game';$('pause').hidden=!game||!document.documentElement.classList.contains('has-touch');$('controls-bar').hidden=!game;$('touch-controls').hidden=!game;$('menu-hint').hidden=game;
  if(!game)$('overlay').hidden=true;
  if(game&&$('game').height!==480)$('game').height=480;
  if(focus){if(view==='menu')this.menuItems[this.menuIndex].focus({preventScroll:true});else if(view==='library')this.monsterButtons[this.monsterIndex].focus({preventScroll:true});else if(view==='authors')document.querySelector('#authors-screen [data-back]').focus({preventScroll:true});else $('game').focus({preventScroll:true});}
 }
 key(event){
  if(this.view==='game')return false;
  if(event.code==='Escape'){event.preventDefault();this.back();return true;}
  if(this.view==='menu'&&['ArrowUp','ArrowDown'].includes(event.code)){event.preventDefault();this.highlightMenu(this.menuIndex+(event.code==='ArrowDown'?1:-1));this.menuItems[this.menuIndex].focus({preventScroll:true});return true;}
  if(this.view==='library'&&['ArrowUp','ArrowDown'].includes(event.code)){event.preventDefault();const first=this.chapterIndex*4;this.selectMonster(first+(this.monsterIndex-first+(event.code==='ArrowDown'?1:3))%4,true);return true;}
  if(this.view==='library'&&['ArrowLeft','ArrowRight'].includes(event.code)){event.preventDefault();this.selectChapter(this.chapterIndex+(event.code==='ArrowRight'?1:-1));return true;}
  if(event.code==='Enter'&&this.view==='menu'&&!event.repeat){event.preventDefault();this.menuItems[this.menuIndex].click();return true;}
  return true;
 }
 draw(canvas,time){
  if(canvas.width!==768)canvas.width=768;
  this.time=time;this.idleAction=idleFrame(time).action;const bounds=canvas.getBoundingClientRect(),height=Math.max(1,Math.round(768*bounds.height/bounds.width));if(canvas.height!==height)canvas.height=height;
  const c=canvas.getContext('2d');
  if(this.view==='library'){
   c.imageSmoothingEnabled=false;const image=this.assets.library,scale=Math.max(768/image.width,height/image.height);c.drawImage(image,(768-image.width*scale)/2,(height-image.height*scale)/2,image.width*scale,image.height*scale);
   // Animate the selected illustration and list poses at a pixel animation cadence.
   if(this.lastPortraitTick!==Math.floor(time*12)||this.lastPortraitIndex!==this.monsterIndex){
    drawPortrait($('monster-art'),this.assets,monsters[this.monsterIndex].id,time);
    this.monsterButtons.filter(button=>!button.hidden).forEach(button=>{const i=this.monsterButtons.indexOf(button);drawPortrait(button.querySelector('canvas'),this.assets,monsters[i].id,time+i*.4);});
    this.lastPortraitTick=Math.floor(time*12);this.lastPortraitIndex=this.monsterIndex;
   }
  }else drawMenuScene(c,this.assets,time,this.view==='menu');
 }
}
