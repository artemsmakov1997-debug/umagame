import {EndingUI} from './ending-ui.js?v=0.18.1';
import {scoreBreakdown,projectPurpose} from './finale.js?v=0.18.1';
import {Game} from './engine.js?v=0.18.1';
import {Renderer} from './render.js?v=0.18.1';
import {loadAssets} from './assets.js?v=0.18.1';
import {ScreenManager} from './screens.js?v=0.18.1';
import {DialogueUI} from './dialogue-ui.js?v=0.18.1';
import {PauseMenu} from './pause-menu.js?v=0.18.1';
import {TouchControls} from './touch-controls.js?v=0.18.1';
import {GameAudio} from './audio.js?v=0.18.1';
const $=id=>document.getElementById(id);
async function boot(){
 document.documentElement.classList.toggle('has-touch',navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches);
 const game=new Game({cinematic:true});game.touchEnabled=document.documentElement.classList.contains('has-touch');
 const assets=await loadAssets((done,total)=>{$('loading').textContent=`Готовлю редакцию: ${done}/${total}`;}).catch(()=>null);
 if(!assets){$('loading').textContent='Не удалось загрузить рисунки. ';const retry=document.createElement('button');retry.textContent='Повторить загрузку';retry.className='back-button';retry.addEventListener('click',()=>location.reload());$('loading').append(retry);return;}
 $('loading').hidden=true;
 const renderer=new Renderer($('game'),assets),keys=new Set();let jump=false,dash=false,attack=false,last=0,clock=0,accumulator=0,toastTimer,touch;
 const audio=new GameAudio({onChange:()=>updateSound()});
 window.addEventListener('pointerdown',()=>audio.unlock(),{capture:true});window.addEventListener('keydown',()=>audio.unlock(),{capture:true});
 function clearInput(){keys.clear();jump=false;dash=false;attack=false;touch?.reset();}
 function clearEffects(){renderer.particles=[];renderer.trail=[];clearTimeout(toastTimer);$('toast').classList.remove('visible');}
 function begin(){pauseMenu.dismiss();game.start();clearEffects();clearInput();accumulator=0;$('overlay').hidden=true;ui.show('game');dialogueUI.update(true);}
 function goMain(){pauseMenu.dismiss();game.mode='ready';game.dialogue=null;clearEffects();ui.show('menu');dialogueUI.update(false);}
 function quit(){pauseMenu.dismiss();game.mode='exited';game.dialogue=null;clearEffects();clearInput();ui.show('exit');dialogueUI.update(false);}
 const ui=new ScreenManager(assets,begin,()=>{if(game.mode==='playing')game.mode='paused';clearInput();},quit);
 const dialogueUI=new DialogueUI(game,assets,clearInput);
 const endingUI=new EndingUI(game,assets,clearInput);
 const pauseMenu=new PauseMenu(game,ui,{clearInput,restart:begin,exit:quit,toggleSound:()=>{audio.setEnabled(!audio.enabled);if(audio.enabled)audio.play({type:'fish'});},onResume:mode=>{dialogueUI.update(true);endingUI.update(true);if(mode==='won'||mode==='lost')showResult(mode);else if(mode!=='dialogue')$('game').focus({preventScroll:true});}});
 touch=new TouchControls(document.querySelector('.game-shell'),()=>ui.view==='game'&&game.mode==='playing'&&!pauseMenu.active);
 function updateSound(){$('pause-sound').textContent=`Звук: ${audio.enabled?'включён':'выключен'}`;$('pause-sound').setAttribute('aria-pressed',String(audio.enabled));}
 updateSound();let lastAbilities='';
 function updateControls(){const signature=Object.values(game.abilities).join();if(signature===lastAbilities)return;lastAbilities=signature;for(const el of document.querySelectorAll('[data-ability]'))el.hidden=!game.abilities[el.dataset.ability];}
 function notify(message,duration=2800){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),duration);}
 function showResult(kind){
  $('overlay').hidden=false;clearInput();const won=kind==='won';$('retry-location').hidden=won;$('result-library').hidden=won;
  $('result-title').textContent=won?'ШУМ ОСТАНОВЛЕН':'ПОПРОБУЕМ ЕЩЁ?';
  $('result-text').textContent=won?`Ума остановила Инфошум и раскрыла причину его появления. Рыбок: ${game.fish}.`:`Жизни закончились. Рыбок: ${game.fish}.`;
  $('play').textContent='Начать заново';$('result-media').hidden=!won;$('result-purpose').hidden=!won;$('result-score').hidden=!won;
  $('result-purpose').textContent=projectPurpose;const score=game.finalScore||scoreBreakdown(game);$('result-points').textContent=score.total.toLocaleString('ru-RU');$('result-breakdown').textContent=score.items.map(i=>`${i.label==='Побеждённые враги'?'Враги':i.label}: ${i.count}`).join(' · ');
  if(won){$('result-title').textContent='СПАСИБО ЗА ИГРУ';$('result-text').textContent='Ума вернулась домой. Держи ухо востро!';}
  $('accessible-state').textContent=$('result-title').textContent+'. '+$('result-text').textContent;$(won?'play':'retry-location').focus({preventScroll:true});
 }
 $('pause').addEventListener('click',()=>pauseMenu.open());
 $('play').addEventListener('click',begin);
 $('retry-location').addEventListener('click',()=>{game.retryLocation();clearEffects();clearInput();$('overlay').hidden=true;$('game').focus({preventScroll:true});});
 $('result-library').addEventListener('click',()=>ui.showLibrary(()=>{ui.show('game');showResult('lost');}));
 $('return-menu').addEventListener('click',goMain);$('wake-skip').addEventListener('click',()=>{clearInput();game.finishWakeup();dialogueUI.update(true);});
 const controls=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyS','Space','KeyA','KeyD','KeyW','KeyX','ShiftLeft','ShiftRight'];
 window.addEventListener('keydown',event=>{
  if(pauseMenu.key(event))return;
  if(ui.view!=='game'){ui.key(event);return;}
  if(event.code==='Escape'||event.code==='KeyP'){event.preventDefault();if(!event.repeat)pauseMenu.open();return;}
  if(game.mode==='waking'&&['Enter','Space'].includes(event.code)){event.preventDefault();if(!event.repeat)game.finishWakeup();return;}
  if(endingUI.key(event)||dialogueUI.key(event))return;
  if(game.mode!=='playing'||!controls.includes(event.code))return;event.preventDefault();
  if((event.code==='ArrowUp'||event.code==='KeyW')&&!keys.has(event.code))jump=true;
  if(event.code==='Space'||event.code==='KeyX')attack=true;
  if((event.code==='ShiftLeft'||event.code==='ShiftRight')&&!keys.has(event.code))dash=true;keys.add(event.code);
 });
 window.addEventListener('keyup',event=>keys.delete(event.code));
 function blur(){clearInput();if(ui.view==='game'&&!pauseMenu.active&&['playing','waking','dialogue','respawning','enteringArena','loading','echoWarp','ending','prologue','interlude'].includes(game.mode))pauseMenu.open();}
 window.addEventListener('blur',blur);document.addEventListener('visibilitychange',()=>{audio.setHidden(document.hidden);if(document.hidden)blur();});
 function events(){for(const event of game.events){
  if(event.type==='dialogue'&&game.mode==='dialogue'){clearTimeout(toastTimer);$('toast').classList.remove('visible');}
  if(['lifeLost','lifeRestored','arenaPull','arenaEnter','arenaReady','locationExit','locationEnter','locationReady','echoTeleport','echoArrive','echoReady','endingSlide','victory'].includes(event.type)){clearInput();renderer.trail=[];renderer.particles=[];}
  if(event.type==='notebook'){updateControls();renderer.burst(event.x,event.y,'#ffe0a0');}
  audio.play(event,game);if(['fish','pop','bossHit','enemyHit','parry','blocked','soup','evidence','dishBreak','lifePickup','controlBreak'].includes(event.type)&&Number.isFinite(event.x))renderer.burst(event.x,event.y,['fish','soup'].includes(event.type)?'#ffce76':'#77e4e3');

  if(event.type==='gate')notify(event.boss?'Победи хозяина арены и отключи его защиту.':({1:'Отключи все печатные узлы!',3:'Отключи городские передатчики!',5:'Останови монтажные станции!',7:'Разрушь ядра искажённого сигнала!'})[game.room]||'Отключи все сигнальные узлы.');

  if(event.type==='lifePickup')notify('+1 жизнь!');
  if(event.type==='controlBreak')notify('Опасность отключена. Короткий путь открыт: ↑ у входа.');
  if(event.type==='clue')notify('СЛЕД: '+event.text,4700);
  if(event.type==='enemyIntroduction')notify(({fakenews:'Фейкньюс: ударь лапой или прыгни сверху',copier:'Копир: бей по открытому лотку',censor:'Цензор: избегай чернил',informant:'Информатор: следи за меткой',inflator:'Раздуватель: заходи сзади',panicker:'Паникёр: прерви тревогу',injection:'Вброс: отражай бегущую строку',cutter:'Нарезчик: уходи с метки',splicer:'Склейка: разорви ленту рывком',static:'Помеха: уклонись от броска',echo:'Эхо: разорви притяжение',clickbait:'Кликбейт: опасайся рыбки на крючке'})[event.enemyType]||'Новый противник!',3800);
  if(event.type==='alarm')notify('Паникёр открывает портал!');
  if(event.type==='portal')notify('Портал открыт! Прерви звон Паникёра.');
  if(event.type==='swallow'){clearInput();notify('Кликбейт! Поглощение отнимает целую жизнь.');}
  if(event.type==='bossPhase')notify(`Фаза ${event.phase}: ${event.name}`);
  if(event.type==='won'||event.type==='lost'){clearTimeout(toastTimer);$('toast').classList.remove('visible');showResult(event.type);}
 }game.events=[];}
 function frame(now){
  const dt=last?Math.min((now-last)/1000,.1):0;last=now;clock+=dt;
  if(ui.view==='game'){
   accumulator+=dt;while(accumulator>=1/60){const mobile=touch.snapshot();game.step(1/60,{...mobile,left:keys.has('ArrowLeft')||keys.has('KeyA'),right:keys.has('ArrowRight')||keys.has('KeyD'),up:keys.has('ArrowUp')||keys.has('KeyW')||mobile.up,down:keys.has('ArrowDown')||keys.has('KeyS')||mobile.down,jump:jump||mobile.jump,dash:dash||mobile.dash,attack:attack||keys.has('Space')||keys.has('KeyX')||mobile.attack});jump=false;dash=false;attack=false;touch.consume();accumulator-=1/60;events();}renderer.draw(game,game.mode==='playing'?dt:0,clock);
  }else{accumulator=0;ui.draw($('game'),clock);}
  audio.setScene(ui.view,game);dialogueUI.update(ui.view==='game'&&!pauseMenu.active);endingUI.update(ui.view==='game'&&!pauseMenu.active);
  document.body.classList.toggle('playing-screen',ui.view==='game');
  $('app').dataset.boss=String(ui.view==='game'&&game.mode==='playing'&&game.boss.active&&game.boss.hp>0);
  $('app').dataset.opening=String(ui.view==='game'&&(game.mode==='waking'||game.pausedFrom==='waking'||game.dialogue?.id==='intro'));
  $('pause').hidden=!game.touchEnabled||ui.view!=='game'||pauseMenu.active||['won','lost'].includes(game.mode);$('wake-caption').hidden=ui.view!=='game'||game.mode!=='waking'||pauseMenu.active;
  updateControls();
  $('touch-controls').hidden=ui.view!=='game'||game.mode!=='playing'||pauseMenu.active;
  const hudText=`Здоровье: ${game.health}. Рыбки: ${game.fish}. Жизни: ${game.lives}.`;if($('hud-status').textContent!==hudText)$('hud-status').textContent=hudText;
  $('dash-status').textContent=game.player.dashCooldown>0?game.player.dashCooldown.toFixed(1):'';
  document.querySelector('.touch-dash').style.setProperty('--ready',`${(1-game.player.dashCooldown/1.5)*100}%`);
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}
boot();
