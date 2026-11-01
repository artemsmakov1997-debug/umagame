import {Game} from './engine.js?v=0.8.0';
import {Renderer,drawControls} from './render.js?v=0.8.0';
import {loadAssets} from './assets.js?v=0.8.0';
import {ScreenManager} from './screens.js?v=0.8.0';
import {DialogueUI} from './dialogue-ui.js?v=0.8.0';
import {PauseMenu} from './pause-menu.js?v=0.8.0';
import {TouchControls} from './touch-controls.js?v=0.8.0';
const $=id=>document.getElementById(id);
async function boot(){
 document.documentElement.classList.toggle('has-touch',navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches);
 const game=new Game();game.touchEnabled=document.documentElement.classList.contains('has-touch');drawControls($('controls-art'));
 const assets=await loadAssets((done,total)=>{$('loading').textContent=`Готовлю редакцию: ${done}/${total}`;}).catch(()=>null);
 if(!assets){$('loading').textContent='Не удалось загрузить рисунки. ';const retry=document.createElement('button');retry.textContent='Повторить загрузку';retry.className='back-button';retry.addEventListener('click',()=>location.reload());$('loading').append(retry);return;}
 $('loading').hidden=true;
 const renderer=new Renderer($('game'),assets),keys=new Set();let jump=false,dash=false,attack=false,last=0,clock=0,accumulator=0,sound=false,audio,toastTimer,touch;
 function clearInput(){keys.clear();jump=false;dash=false;attack=false;touch?.reset();}
 function clearEffects(){renderer.particles=[];renderer.trail=[];clearTimeout(toastTimer);$('toast').classList.remove('visible');}
 function begin(){pauseMenu.dismiss();game.start();clearEffects();clearInput();accumulator=0;$('overlay').hidden=true;ui.show('game');dialogueUI.update(true);}
 function goMain(){pauseMenu.dismiss();game.mode='ready';game.dialogue=null;clearEffects();ui.show('menu');dialogueUI.update(false);}
 function quit(){pauseMenu.dismiss();game.mode='exited';game.dialogue=null;clearEffects();clearInput();ui.show('exit');dialogueUI.update(false);}
 const ui=new ScreenManager(assets,begin,()=>{if(game.mode==='playing')game.mode='paused';clearInput();},quit);
 const dialogueUI=new DialogueUI(game,assets,clearInput);
 const pauseMenu=new PauseMenu(game,ui,{clearInput,restart:begin,exit:quit,onResume:mode=>{dialogueUI.update(true);if(mode==='won'||mode==='lost')showResult(mode);else if(mode!=='dialogue')$('game').focus({preventScroll:true});}});
 touch=new TouchControls(document.querySelector('.game-shell'),()=>ui.view==='game'&&game.mode==='playing'&&!pauseMenu.active);
 function updateSound(){$('sound').textContent=`ЗВУК: ${sound?'ВКЛ':'ВЫКЛ'}`;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Выключить звук':'Включить звук');}
 function beep(type){
  const hz={jump:320,fish:900,pop:140,hurt:80,swat:180,bossHit:110,won:660,checkpoint:740,dash:470,parry:1100,enemyHit:180,blocked:95,heal:780,soup:1000,alarm:740,blast:110,pushed:130,swallow:65,infection:100}[type];
  if(!sound||!hz)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),v=audio.createGain(),now=audio.currentTime;o.type=type==='alarm'?'triangle':'square';o.connect(v);v.connect(audio.destination);o.frequency.setValueAtTime(hz,now);o.frequency.exponentialRampToValueAtTime(type==='fish'||type==='alarm'?hz*1.5:hz*.5,now+.14);v.gain.setValueAtTime(.03,now);v.gain.exponentialRampToValueAtTime(.0001,now+.19);o.start();o.stop(now+.2);}catch{sound=false;updateSound();}
 }
 function notify(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2800);}
 function showResult(kind){
  $('overlay').hidden=false;clearInput();const won=kind==='won';
  $('result-title').textContent=won?'ШУМ ОСТАНОВЛЕН':'ПОПРОБУЕМ ЕЩЁ?';
  $('result-text').textContent=won?`Ума остановила Инфошум и раскрыла причину его появления. Рыбок: ${game.fish}.`:`${game.clock===0?'Время поисков вышло.':'След сигнала ещё не потерян.'} Рыбок: ${game.fish}.`;
  $('play').textContent=!won&&game.checkpoint>0?'С чекпоинта':'Начать заново';
  $('accessible-state').textContent=$('result-title').textContent+'. '+$('result-text').textContent;$('play').focus({preventScroll:true});
 }
 $('pause').addEventListener('click',()=>pauseMenu.open());
 $('play').addEventListener('click',()=>{if(game.mode==='lost'&&game.checkpoint>0){game.retry();clearEffects();clearInput();$('overlay').hidden=true;$('game').focus({preventScroll:true});}else begin();});
 $('return-menu').addEventListener('click',goMain);$('wake-skip').addEventListener('click',()=>{clearInput();game.finishWakeup();dialogueUI.update(true);});
 $('sound').addEventListener('click',()=>{sound=!sound;updateSound();if(sound)beep('fish');});
 const controls=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyS','Space','KeyA','KeyD','KeyW','KeyX','ShiftLeft','ShiftRight'];
 window.addEventListener('keydown',event=>{
  if(pauseMenu.key(event))return;
  if(ui.view!=='game'){ui.key(event);return;}
  if(event.code==='Escape'||event.code==='KeyP'){event.preventDefault();if(!event.repeat)pauseMenu.open();return;}
  if(game.mode==='waking'&&['Enter','Space'].includes(event.code)){event.preventDefault();if(!event.repeat)game.finishWakeup();return;}
  if(dialogueUI.key(event))return;
  if(game.mode!=='playing'||!controls.includes(event.code))return;event.preventDefault();
  if((event.code==='ArrowUp'||event.code==='KeyW')&&!keys.has(event.code))jump=true;
  if(event.code==='Space'||event.code==='KeyX')attack=true;
  if((event.code==='ShiftLeft'||event.code==='ShiftRight')&&!keys.has(event.code))dash=true;keys.add(event.code);
 });
 window.addEventListener('keyup',event=>keys.delete(event.code));
 function blur(){clearInput();if(ui.view==='game'&&!pauseMenu.active&&['playing','waking','dialogue'].includes(game.mode))pauseMenu.open();}
 window.addEventListener('blur',blur);document.addEventListener('visibilitychange',()=>{if(document.hidden)blur();});
 function events(){for(const event of game.events){
  if(event.type==='dialogue'&&game.mode==='dialogue'){clearTimeout(toastTimer);$('toast').classList.remove('visible');}
  beep(event.type);if(['fish','pop','bossHit','enemyHit','parry','blocked','soup','evidence'].includes(event.type)&&Number.isFinite(event.x))renderer.burst(event.x,event.y,['fish','soup'].includes(event.type)?'#ffce76':'#77e4e3');
  if(event.type==='checkpoint')notify(`Новый участок сигнала: чекпоинт и +1 сердечко.`);
  if(event.type==='guardian')notify('Сигнал защищён. Победи защитника с золотой меткой.');
  if(event.type==='gate')notify('Отключи ретранслятор тремя ударами лапы.');
  if(event.type==='heal')notify('8 рыбок: +1 сердечко.');
  if(event.type==='alarm')notify('Паникёр открывает портал!');
  if(event.type==='portal')notify('Портал открыт! Прерви звон Паникёра.');
  if(event.type==='swallow'){clearInput();notify('Кликбейт! Рыбка с крючком оказалась ловушкой.');}
  if(event.type==='bossPhase')notify('Инфошум атакует быстрее!');
  if(event.type==='won'||event.type==='lost'){clearTimeout(toastTimer);$('toast').classList.remove('visible');showResult(event.type);}
 }game.events=[];}
 function frame(now){
  const dt=last?Math.min((now-last)/1000,.1):0;last=now;clock+=dt;
  if(ui.view==='game'){
   accumulator+=dt;while(accumulator>=1/60){const mobile=touch.snapshot();game.step(1/60,{...mobile,left:keys.has('ArrowLeft')||keys.has('KeyA'),right:keys.has('ArrowRight')||keys.has('KeyD'),up:keys.has('ArrowUp')||keys.has('KeyW')||mobile.up,down:keys.has('ArrowDown')||keys.has('KeyS')||mobile.down,jump:jump||mobile.jump,dash:dash||mobile.dash,attack:attack||keys.has('Space')||keys.has('KeyX')||mobile.attack});jump=false;dash=false;attack=false;touch.consume();accumulator-=1/60;events();}renderer.draw(game,game.mode==='playing'?dt:0,clock);
  }else{accumulator=0;ui.draw($('game'),clock);}
  dialogueUI.update(ui.view==='game'&&!pauseMenu.active);
  $('pause').hidden=ui.view!=='game'||pauseMenu.active;$('wake-caption').hidden=ui.view!=='game'||game.mode!=='waking'||pauseMenu.active;
  $('touch-controls').hidden=ui.view!=='game'||game.mode!=='playing'||pauseMenu.active;
  $('dash-status').textContent=game.player.dashCooldown>0?game.player.dashCooldown.toFixed(1):'';
  document.querySelector('.touch-dash').style.setProperty('--ready',`${(1-game.player.dashCooldown/1.5)*100}%`);
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}
boot();
