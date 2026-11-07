import {projectileStyle} from './projectile-art.js?v=0.21.5';
import {ConclusionUI} from './conclusion-ui.js?v=0.21.5';
import {SettingsUI} from './settings.js?v=0.21.5';
import {buildControls,drawControls} from './controls-art.js?v=0.21.5';
import {EndingUI} from './ending-ui.js?v=0.21.5';
import {drawDefeat} from './result-art.js?v=0.21.5';
import {scoreBreakdown,projectPurpose} from './finale.js?v=0.21.5';
import {Game} from './engine.js?v=0.21.5';
import {Renderer} from './render.js?v=0.21.5';
import {loadAssets} from './assets.js?v=0.21.5';
import {ScreenManager} from './screens.js?v=0.21.5';
import {DialogueUI} from './dialogue-ui.js?v=0.21.5';
import {PauseMenu} from './pause-menu.js?v=0.21.5';
import {TouchControls} from './touch-controls.js?v=0.21.5';
import {GameAudio} from './audio.js?v=0.21.5';
const $=id=>document.getElementById(id);
async function boot(){
 document.documentElement.classList.toggle('has-touch',navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches);
 const game=new Game({cinematic:true});game.testingInvulnerable=true;game.touchEnabled=document.documentElement.classList.contains('has-touch');
 const assets=await loadAssets((done,total)=>{$('loading').textContent=`Готовлю редакцию: ${done}/${total}`;}).catch(()=>null);
 if(!assets){$('loading').textContent='Не удалось загрузить рисунки. ';const retry=document.createElement('button');retry.textContent='Повторить загрузку';retry.className='back-button';retry.addEventListener('click',()=>location.reload());$('loading').append(retry);return;}
 $('loading').hidden=true;
 const renderer=new Renderer($('game'),assets),keys=new Set();let jump=false,dash=false,attack=false,last=0,clock=0,accumulator=0,toastTimer,touch;
 const audio=new GameAudio({onChange:()=>updateSound()});
 window.addEventListener('pointerdown',()=>audio.unlock(),{capture:true});window.addEventListener('keydown',()=>audio.unlock(),{capture:true});
 function clearInput(){keys.clear();jump=false;dash=false;attack=false;touch?.reset();}
 function clearEffects(){renderer.combatEffects=[];renderer.particles=[];renderer.trail=[];clearTimeout(toastTimer);$('toast').classList.remove('visible');}
 function begin(){pauseMenu.dismiss();game.start();clearEffects();clearInput();accumulator=0;$('overlay').hidden=true;ui.show('game');dialogueUI.update(true);}
 function goMain(){
  pauseMenu.dismiss();audio.stop();game.abandon();clearEffects();clearInput();accumulator=0;settingsUI.active=false;$('settings-layer').hidden=true;$('overlay').hidden=true;ui.highlightMenu(0);ui.show('menu');dialogueUI.update(false);endingUI.update(false);conclusionUI.update(false);
 }

 function quit(){goMain();}

 const ui=new ScreenManager(assets,begin,()=>{if(game.mode==='playing')game.mode='paused';clearInput();},quit,()=>settingsUI.open(()=>ui.menuItems[ui.menuIndex].focus({preventScroll:true})));
 const dialogueUI=new DialogueUI(game,assets,clearInput);
 const endingUI=new EndingUI(game,assets,clearInput);
 const conclusionUI=new ConclusionUI(game,clearInput);
 $('cinematic-skip').addEventListener('click',()=>{clearInput();game.skipBossDefeat();});
 const settingsUI=new SettingsUI(game,audio,clearInput);buildControls();
 const pauseMenu=new PauseMenu(game,ui,{clearInput,restart:begin,exit:quit,openSettings:back=>settingsUI.open(back),onResume:mode=>{dialogueUI.update(true);endingUI.update(true);conclusionUI.update(true);if(mode==='won'||mode==='lost')showResult(mode);else if(mode!=='dialogue')$('game').focus({preventScroll:true});}});
 touch=new TouchControls(document.querySelector('.game-shell'),()=>ui.view==='game'&&game.mode==='playing'&&!pauseMenu.active);
 function updateSound(){settingsUI?.sync();}
 let lastAbilities='';
 function updateControls(){const signature=Object.values(game.abilities).join();if(signature===lastAbilities)return;lastAbilities=signature;for(const el of document.querySelectorAll('[data-ability]'))el.hidden=!game.abilities[el.dataset.ability];}
 function notify(message,duration=5200){if(!game.hintsEnabled)return;$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),duration);}
 function showResult(kind){
  $('overlay').hidden=false;clearInput();const won=kind==='won';$('retry-location').hidden=won;$('result-library').hidden=won;
  $('overlay').dataset.result=won?'won':'lost';$('defeat-art').hidden=won;$('result-text').hidden=!won;
  $('result-title').textContent=won?'ШУМ ОСТАНОВЛЕН':'Инфошум победил';$('return-menu').textContent=won?'В главное меню':'Главное меню';
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
  if(settingsUI.key(event)||pauseMenu.key(event))return;
  if(ui.view!=='game'){ui.key(event);return;}
  if(event.code==='Escape'||event.code==='KeyP'){event.preventDefault();if(!event.repeat)pauseMenu.open();return;}
  if(game.mode==='waking'&&['Enter','Space'].includes(event.code)){event.preventDefault();if(!event.repeat)game.finishWakeup();return;}
  if(game.mode==='lost'&&!$('overlay').hidden&&['ArrowUp','ArrowDown','Home','End'].includes(event.code)){event.preventDefault();const buttons=[...$('overlay').querySelectorAll('button:not([hidden])')],i=buttons.indexOf(document.activeElement),next=event.code==='Home'?0:event.code==='End'?buttons.length-1:(i+(event.code==='ArrowUp'?-1:1)+buttons.length)%buttons.length;buttons[next].focus({preventScroll:true});return;}
  if(game.mode==='bossDefeat'&&['Enter','Space'].includes(event.code)){event.preventDefault();if(!event.repeat){clearInput();game.skipBossDefeat();}return;}
  if(conclusionUI.key(event)||endingUI.key(event)||dialogueUI.key(event))return;
  if(game.mode!=='playing'||!controls.includes(event.code))return;event.preventDefault();
  if((event.code==='ArrowUp'||event.code==='KeyW')&&!keys.has(event.code))jump=true;
  if(event.code==='Space'||event.code==='KeyX')attack=true;
  if((event.code==='ShiftLeft'||event.code==='ShiftRight')&&!keys.has(event.code))dash=true;keys.add(event.code);
 });
 window.addEventListener('keyup',event=>keys.delete(event.code));
 function blur(){clearInput();if(ui.view==='game'&&!pauseMenu.active&&['playing','waking','dialogue','respawning','enteringArena','loading','echoWarp','ending','prologue','interlude','bossDefeat','conclusion'].includes(game.mode))pauseMenu.open();}
 window.addEventListener('blur',blur);document.addEventListener('visibilitychange',()=>{audio.setHidden(document.hidden);if(document.hidden)blur();});
 function events(){for(const event of game.events){
  if(event.type==='dialogue'&&game.mode==='dialogue'){clearTimeout(toastTimer);$('toast').classList.remove('visible');}
  if(['lifeLost','lifeRestored','arenaPull','arenaEnter','arenaReady','locationExit','locationEnter','locationReady','echoTeleport','echoArrive','echoReady','endingSlide','victory'].includes(event.type)){clearInput();renderer.trail=[];renderer.particles=[];}
  if(event.type==='notebook'){updateControls();renderer.burst(event.x,event.y,'#ffe0a0');}
  if(['parry','blocked','boltImpact'].includes(event.type)){renderer.combatEffects.push({kind:event.type,x:event.x,y:event.y,time:0,frame:projectileStyle(game,{kind:event.kind,visual:event.visual})});renderer.combatEffects=renderer.combatEffects.slice(-18);}
  audio.play(event,game);if(['fish','pop','bossHit','enemyHit','parry','blocked','soup','evidence','dishBreak','lifePickup','controlBreak'].includes(event.type)&&Number.isFinite(event.x))renderer.burst(event.x,event.y,['fish','soup'].includes(event.type)?'#ffce76':'#77e4e3');

  if(event.type==='voiceEcho')notify(event.text,4800);
  if(event.type==='bossDefeatStart'){clearInput();clearEffects();}
   if(event.type==='antennaHit')notify('Попадание '+event.hits+'/3. Чередуй антенны!',2800);
   if(event.type==='interferenceLost')notify(game.testingInvulnerable?'Тестовая защита: помехи достигли предела.':'Помехи заполнили эфир. Потеряна жизнь.',3000);
   if(event.type==='broadcastShieldBreak')notify('Щит разрушен! Догони Агитатора до заполнения помех.',3600);
   if(event.type==='infoshumArmorHit')notify('Защита ослабла. Для второго удара дождись нового окна.',3400);
   if(event.type==='infoshumTransfer')notify('Инфошум ушёл из экрана! Бей по засветившемуся пульту.',3500);
   if(event.type==='infoshumMonitorDestroyed')notify('Монитор разрушен. Осталось: '+(3-game.boss.network.defeatedMonitors),2400);
   if(event.type==='infoshumRupture')notify('Последний экран не выдерживает! Инфошум вырывается наружу.',3700);
   if(event.type==='infoshumTerminalOpen')notify('Последний пульт открыт — перегрузи монитор!',3500);
   if(event.type==='infoshumFreed')notify('Уклоняйся от атак и бей по раскрытому ядру!',4500);
  if(event.type==='gate')notify(event.boss?'Победи хозяина арены и отключи его защиту.':({1:'Отключи все печатные узлы!',3:'Отключи городские передатчики!',5:'Останови монтажные станции!',7:'Разрушь ядра искажённого сигнала!'})[game.room]||'Отключи все сигнальные узлы.');

  if(event.type==='roofFall')notify(game.testingInvulnerable?'Тестовая защита: Ума возвращена на крышу.':'Падение! −1 сердце. Ума вернулась на крышу.',2600);
  if(event.type==='windIntroduction')notify('Порыв ветра! В воздухе сносит влево.',2200);
  if(event.type==='lesson')notify('Юрий: '+event.text,6000);
  if(event.type==='tutorialBump')notify('Юрий: Шагом барьер не пройти — нужен рывок!',3600);
  if(event.type==='tutorialBarrier'||event.type==='tutorialMonitor')renderer.burst(event.x,event.y,event.type==='tutorialMonitor'?'#d78bff':'#8e8aff');
  if(event.type==='lifePickup')notify('+1 жизнь!');
  if(event.type==='controlBreak')notify('Опасный механизм отключён.');
  if(event.type==='clue')notify('СЛЕД: '+event.text,6500);
  if(event.type==='enemyIntroduction')notify(({fakenews:'Фейкньюс: ударь лапой или прыгни сверху',censor:'Цензор: перепрыгни, его не победить',copier:'Копир: бей по открытому лотку',stamp:'Штамп: избегай чернил',informant:'Информатор: следи за меткой',inflator:'Нагнетатель: перепрыгни поток и бей лапой',sensation:'Сенсации: пригнись, пережди стаю или сбей лапой',panicker:'Паникёр: прерви тревогу',injection:'Вброс: отражай бегущую строку',cutter:'Нарезчик: уходи с метки',splicer:'Склейка: разорви ленту рывком',static:'Помеха: уклонись от броска',echo:'Эхо: разорви притяжение',clickbait:'Кликбейт: опасайся рыбки на крючке'})[event.enemyType]||'Новый противник!',3800);
  if(event.type==='alarm')notify('Паникёр открывает портал!');
  if(event.type==='portal')notify('Портал открыт! Прерви звон Паникёра.');
  if(event.type==='swallow'){clearInput();notify('Кликбейт! Поглощение отнимает целую жизнь.');}
  if(event.type==='platformCrumble')notify('Настил осыпается! Прыгай на соседнюю крышу.');
  if(event.type==='won'||event.type==='lost'){clearTimeout(toastTimer);$('toast').classList.remove('visible');showResult(event.type);}
 }game.events=[];}
 function frame(now){
  const dt=last?Math.min((now-last)/1000,.1):0;last=now;clock+=dt;
  if(ui.view==='game'){
   accumulator+=dt;while(accumulator>=1/60){const mobile=touch.snapshot();game.step(1/60,{...mobile,left:keys.has('ArrowLeft')||keys.has('KeyA'),right:keys.has('ArrowRight')||keys.has('KeyD'),up:jump||keys.has('ArrowUp')||keys.has('KeyW')||mobile.up,down:keys.has('ArrowDown')||keys.has('KeyS')||mobile.down,jump:jump||mobile.jump,dash:dash||mobile.dash,attack:attack||keys.has('Space')||keys.has('KeyX')||mobile.attack});jump=false;dash=false;attack=false;touch.consume();accumulator-=1/60;events();}renderer.draw(game,game.mode==='playing'?dt:0,clock);
  }else{accumulator=0;ui.draw($('game'),clock);}
  audio.setScene(ui.view,game);dialogueUI.update(ui.view==='game'&&!pauseMenu.active,game.mode==='dialogue'?dt:0);endingUI.update(ui.view==='game'&&!pauseMenu.active,pauseMenu.active?0:dt);conclusionUI.update(ui.view==='game'&&!pauseMenu.active);
  $('cinematic-skip').hidden=ui.view!=='game'||pauseMenu.active||game.mode!=='bossDefeat';
  $('game-hud').hidden=ui.view!=='game'||['prologue','interlude','ending','conclusion','won','lost'].includes(game.mode)||['prologue','interlude','ending','conclusion'].includes(game.pausedFrom)&&game.mode==='paused';
  $('app').dataset.hud=String(!$('game-hud').hidden);
  if(ui.view==='game'&&game.mode==='lost'&&!$('overlay').hidden)drawDefeat($('defeat-art'),assets,clock);
  document.body.classList.toggle('playing-screen',ui.view==='game');
  $('app').dataset.boss=String(ui.view==='game'&&game.boss.room===game.room&&(game.boss.active&&game.boss.hp>0||game.mode==='bossDefeat'||game.pausedFrom==='bossDefeat'));
  $('app').dataset.opening=String(ui.view==='game'&&(game.mode==='waking'||game.pausedFrom==='waking'||game.dialogue?.id==='intro'));
  $('pause').hidden=!game.touchEnabled||ui.view!=='game'||pauseMenu.active||['won','lost'].includes(game.mode);$('wake-caption').hidden=ui.view!=='game'||game.mode!=='waking'||pauseMenu.active;
  updateControls();if(pauseMenu.active&&pauseMenu.panel==='controls')drawControls(assets,clock);
  $('touch-controls').hidden=ui.view!=='game'||game.mode!=='playing'||pauseMenu.active;
  const hudText=`Здоровье: ${game.health}. Рыбки: ${game.fish}. Жизни: ${game.lives}.`;if($('hud-status').textContent!==hudText)$('hud-status').textContent=hudText;
  $('dash-status').textContent=game.player.dashCooldown>0?game.player.dashCooldown.toFixed(1):'';
  document.querySelector('.touch-dash').style.setProperty('--ready',`${(1-game.player.dashCooldown/1.5)*100}%`);
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}
boot();
