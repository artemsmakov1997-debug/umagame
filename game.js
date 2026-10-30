import {Game} from './engine.js';
import {Renderer} from './render.js';
import {text} from './pixel.js';
const $=id=>document.getElementById(id);
const game=new Game(),renderer=new Renderer($('game'));
const overlay=$('overlay'),play=$('play'),pause=$('pause');
const keys=new Set(),touch=new Set();let jump=false,last=0,sound=false,audio,toastTimer;
const title=$('title-art').getContext('2d');
text(title,'ДЕРЖИ УХО',9,4,'#8e653d',6);text(title,'ДЕРЖИ УХО',9,0,'#ffe5ad',6);
text(title,'ВОСТРО',57,58,'#8e653d',6);text(title,'ВОСТРО',57,54,'#ffe5ad',6);
// Audio is synthesized locally and only enabled by an explicit user gesture.
function beep(type){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.type='square';o.connect(v);v.connect(audio.destination);const now=audio.currentTime;const hz={jump:320,fish:900,pop:140,hurt:80,swat:180,bossHit:110,won:660,checkpoint:740}[type];if(!hz)return;o.frequency.setValueAtTime(hz,now);o.frequency.exponentialRampToValueAtTime(type==='fish'?1400:hz*.5,now+.13);v.gain.setValueAtTime(.025,now);v.gain.exponentialRampToValueAtTime(.0001,now+.16);o.start();o.stop(now+.17);}catch{sound=false;updateSound();}}
function notify(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2900);}
function clearInput(){keys.clear();touch.clear();jump=false;}
function showScreen(kind){overlay.hidden=false;pause.disabled=true;clearInput();const state=$('accessible-state');
 if(kind==='paused'){$('kicker').textContent='УМА ПРИСЛУШИВАЕТСЯ';$('subtitle').textContent='ПАУЗА';$('description').textContent='Передохни. Шум подождёт.';play.innerHTML='ПРОДОЛЖИТЬ <span>→</span>';}
 else{const won=kind==='won';$('kicker').textContent=won?'РЕДАКЦИЯ СНОВА В БЕЗОПАСНОСТИ':'КОШКАМ ТОЖЕ НУЖЕН ОТДЫХ';$('subtitle').textContent=won?'СМЕНА ОКОНЧЕНА':'ПОПРОБУЕМ ЕЩЁ?';$('description').textContent=won?`Ума выключила шум. Рыбок: ${game.fish}. Помех побеждено: ${game.kills}.`:`${game.clock===0?'Рассвело! Время смены вышло.':'Эта ночь оказалась непростой.'} Собрано рыбок: ${game.fish}.`;play.innerHTML='ЕЩЁ ОДНА СМЕНА <span>→</span>';}
 state.textContent=$('subtitle').textContent+'. '+$('description').textContent;requestAnimationFrame(()=>play.focus({preventScroll:true}));}
function togglePause(){if(game.mode==='playing'){game.mode='paused';showScreen('paused');}else if(game.mode==='paused')resume();}
function resume(){game.mode='playing';overlay.hidden=true;pause.disabled=false;clearInput();}
play.addEventListener('click',()=>{if(game.mode==='paused')resume();else{game.start();renderer.particles=[];overlay.hidden=true;pause.disabled=false;clearInput();notify('↑ — прыжок. ПРОБЕЛ — удар лапой. Не бойся прыгать на помехи!');}});
pause.addEventListener('click',togglePause);
function updateSound(){$('sound').textContent=`ЗВУК: ${sound?'ВКЛ':'ВЫКЛ'}`;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Выключить звук':'Включить звук');}
$('sound').addEventListener('click',()=>{sound=!sound;updateSound();if(sound)beep('fish');});
const controls=['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','KeyX'];
window.addEventListener('keydown',e=>{if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();if(!e.repeat)togglePause();return;}if(!controls.includes(e.code)||game.mode!=='playing')return;e.preventDefault();if((e.code==='ArrowUp'||e.code==='KeyW')&&!keys.has(e.code))jump=true;keys.add(e.code);});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{clearInput();if(game.mode==='playing')togglePause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(game.mode==='playing')togglePause();}});
for(const button of document.querySelectorAll('[data-control]')){
 const control=button.dataset.control;
 button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touch.add(control);if(control==='jump')jump=true;});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>touch.delete(control));
}
function handleEvents(){for(const event of game.events){beep(event.type);if(['fish','pop','bossHit'].includes(event.type))renderer.burst(event.x,event.y,event.type==='fish'?'#ffce76':'#77e4e3');if(event.type==='checkpoint')notify('Чекпоинт! Ума запомнила дорогу.');if(event.type==='hurt')notify(`Осталось жизней: ${game.lives}`);if(event.type==='won'||event.type==='lost'){$('toast').classList.remove('visible');showScreen(event.type);}}game.events=[];}
let accumulator=0;
function frame(now){const dt=last?Math.min((now-last)/1000,.1):0;last=now;accumulator+=dt;while(accumulator>=1/60){game.step(1/60,{left:keys.has('ArrowLeft')||keys.has('KeyA')||touch.has('left'),right:keys.has('ArrowRight')||keys.has('KeyD')||touch.has('right'),jump,attack:keys.has('Space')||keys.has('KeyX')||touch.has('attack')});jump=false;accumulator-=1/60;handleEvents();}if(game.mode==='ready')game.time+=dt;renderer.draw(game,dt);requestAnimationFrame(frame);}
renderer.draw(game);requestAnimationFrame(frame);
