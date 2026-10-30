import {Game} from './engine.js?v=0.4.0';
import {Renderer,drawControls} from './render.js?v=0.4.0';
import {loadAssets} from './assets.js?v=0.4.0';
import {ScreenManager} from './screens.js?v=0.4.0';
const $=id=>document.getElementById(id);
async function boot(){
 document.documentElement.classList.toggle('has-touch',navigator.maxTouchPoints>0);
 const game=new Game();drawControls($('controls-art'));
 const assets=await loadAssets((done,total)=>{$('loading').textContent=`Готовлю редакцию: ${done}/${total}`;}).catch(()=>null);
 if(!assets){$('loading').textContent='Не удалось загрузить рисунки. ';const retry=document.createElement('button');retry.textContent='Повторить загрузку';retry.className='back-button';retry.addEventListener('click',()=>location.reload());$('loading').append(retry);return;}
 $('loading').hidden=true;
 const renderer=new Renderer($('game'),assets),keys=new Set(),touch=new Set();let jump=false,dash=false,last=0,clock=0,accumulator=0,sound=false,audio,toastTimer;
 const overlay=$('overlay'),play=$('play'),pause=$('pause');
 function clearInput(){keys.clear();touch.clear();jump=false;dash=false;}
 function clearEffects(){renderer.particles=[];renderer.trail=[];clearTimeout(toastTimer);$('toast').classList.remove('visible');}
 function begin(){game.start();clearEffects();clearInput();accumulator=0;overlay.hidden=true;ui.show('game');}
 const ui=new ScreenManager(assets,begin,()=>{if(game.mode==='playing')game.mode='paused';clearInput();clearEffects();});
 function updateSound(){$('sound').textContent=`ЗВУК: ${sound?'ВКЛ':'ВЫКЛ'}`;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Выключить звук':'Включить звук');}
 function beep(type){
  const hz={jump:320,fish:900,pop:140,hurt:80,swat:180,bossHit:110,won:660,checkpoint:740,dash:470,parry:1100,enemyHit:180,blocked:95,heal:780,soup:1000,alarm:740,blast:110,pushed:130,swallow:65}[type];
  if(!sound||!hz)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),v=audio.createGain(),now=audio.currentTime;o.type=type==='alarm'?'triangle':'square';o.connect(v);v.connect(audio.destination);o.frequency.setValueAtTime(hz,now);o.frequency.exponentialRampToValueAtTime(type==='fish'||type==='alarm'?hz*1.5:hz*.5,now+.14);v.gain.setValueAtTime(.03,now);v.gain.exponentialRampToValueAtTime(.0001,now+.19);o.start();o.stop(now+.2);}catch{sound=false;updateSound();}
 }
 function notify(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3100);}
 function showResult(kind){
  overlay.hidden=false;clearInput();
  if(kind==='paused'){$('result-title').textContent='ПАУЗА';$('result-text').textContent='Ума прислушивается. Отдохни перед следующей атакой.';play.textContent='Продолжить';}
  else{const won=kind==='won';$('result-title').textContent=won?'ИНФОШУМ УТИХ':'ПОПРОБУЕМ ЕЩЁ?';$('result-text').textContent=won?`Ума справилась с Источником шума. Рыбок: ${game.fish}. Побеждено монстров: ${game.kills}.`:`${game.clock===0?'Время смены вышло.':'Редакция всё ещё шумит.'} Рыбок: ${game.fish}.`;play.textContent=!won&&game.checkpoint>0?'С чекпоинта':'Начать заново';}
  $('accessible-state').textContent=$('result-title').textContent+'. '+$('result-text').textContent;play.focus({preventScroll:true});
 }
 function resume(){game.mode='playing';overlay.hidden=true;clearInput();$('game').focus({preventScroll:true});}
 function togglePause(){if(ui.view!=='game')return;if(game.mode==='playing'){game.mode='paused';showResult('paused');}else if(game.mode==='paused')resume();}
 pause.addEventListener('click',togglePause);
 play.addEventListener('click',()=>{if(game.mode==='paused')resume();else{if(game.mode==='lost'&&game.checkpoint>0)game.retry();else game.start();clearEffects();clearInput();overlay.hidden=true;$('game').focus({preventScroll:true});}});
 $('return-menu').addEventListener('click',()=>ui.show('menu'));
 $('sound').addEventListener('click',()=>{sound=!sound;updateSound();if(sound)beep('fish');});
 const controls=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyS','Space','KeyA','KeyD','KeyW','KeyX','ShiftLeft','ShiftRight'];
 window.addEventListener('keydown',event=>{
  if(ui.view!=='game'){ui.key(event);return;}
  if(event.code==='Escape'||event.code==='KeyP'){event.preventDefault();if(!event.repeat)togglePause();return;}
  if(game.mode!=='playing'||!controls.includes(event.code))return;event.preventDefault();
  if((event.code==='ArrowUp'||event.code==='KeyW')&&!keys.has(event.code))jump=true;
  if((event.code==='ShiftLeft'||event.code==='ShiftRight')&&!keys.has(event.code))dash=true;keys.add(event.code);
 });
 window.addEventListener('keyup',event=>keys.delete(event.code));
 function blur(){clearInput();if(ui.view==='game'&&game.mode==='playing')togglePause();}
 window.addEventListener('blur',blur);document.addEventListener('visibilitychange',()=>{if(document.hidden)blur();});
 for(const button of document.querySelectorAll('[data-control]')){
  const control=button.dataset.control;
  button.addEventListener('pointerdown',event=>{event.preventDefault();if(ui.view!=='game'||game.mode!=='playing')return;button.setPointerCapture(event.pointerId);touch.add(control);if(control==='jump')jump=true;if(control==='dash')dash=true;});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>touch.delete(control));
 }
 function events(){for(const event of game.events){
  beep(event.type);if(['fish','pop','bossHit','enemyHit','parry','blocked','soup'].includes(event.type))renderer.burst(event.x,event.y,['fish','soup'].includes(event.type)?'#ffce76':'#77e4e3');
  if(event.type==='checkpoint')notify(`Зона ${event.room+1}: чекпоинт и +1 здоровье.`);
  if(event.type==='guardian')notify('Ретранслятор защищён. Сначала победи Инфошум с золотой меткой.');
  if(event.type==='gate')notify('Выключи ретранслятор ударами лапы, чтобы открыть проход.');
  if(event.type==='relay')notify('Сигнал снят! Проход дальше открыт.');
  if(event.type==='heal')notify('8 рыбок: +1 здоровье.');
  if(event.type==='soup')notify('Супер-мур! +1 здоровье и усиленная лапа на 10 секунд.');
  if(event.type==='alarm')notify('Паникёр зовёт ближайших противников!');
  if(event.type==='pushed')notify('Громкий заголовок! Перепрыгни волну или зайди за спину.');
  if(event.type==='swallow'){clearInput();notify('Кликбейт! Рыбка с крючком оказалась ловушкой.');}
  if(event.type==='bossStart')notify('Источник шума! В паузах бей зелёную панель монитора.');
  if(event.type==='bossPhase')notify('Источник шума атакует быстрее!');
  if(event.type==='hurt')notify(`Здоровье: ${game.lives}. SHIFT — рывок сквозь опасность.`);
  if(event.type==='won'||event.type==='lost'){clearTimeout(toastTimer);$('toast').classList.remove('visible');showResult(event.type);}
 }game.events=[];}
 function frame(now){
  const dt=last?Math.min((now-last)/1000,.1):0;last=now;clock+=dt;
  if(ui.view==='game'){
   accumulator+=dt;while(accumulator>=1/60){game.step(1/60,{left:keys.has('ArrowLeft')||keys.has('KeyA')||touch.has('left'),right:keys.has('ArrowRight')||keys.has('KeyD')||touch.has('right'),up:keys.has('ArrowUp')||keys.has('KeyW')||touch.has('jump'),down:keys.has('ArrowDown')||keys.has('KeyS')||touch.has('down'),jump,dash,attack:keys.has('Space')||keys.has('KeyX')||touch.has('attack')});jump=false;dash=false;accumulator-=1/60;events();}renderer.draw(game,game.mode==='playing'?dt:0);
  }else{accumulator=0;ui.draw($('game'),clock);}
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}
boot();
