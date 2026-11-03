const $=id=>document.getElementById(id);
export function readPreference(key,fallback){try{const value=localStorage.getItem('uma-'+key);return value===null?fallback:value;}catch{return fallback;}}
function save(key,value){try{localStorage.setItem('uma-'+key,String(value));}catch{}}
export class SettingsUI{
 constructor(game,audio,clearInput){this.game=game;this.audio=audio;this.clearInput=clearInput;this.active=false;game.hintsEnabled=readPreference('hints','on')!=='off';
  $('settings-sound').addEventListener('click',()=>{audio.setEnabled(!audio.enabled);this.sync();});
  for(const type of ['music','effects'])$('volume-'+type).addEventListener('input',event=>{audio.setVolume(type,Number(event.target.value)/100);this.sync();});
  $('settings-hints').addEventListener('click',()=>{game.hintsEnabled=!game.hintsEnabled;save('hints',game.hintsEnabled?'on':'off');if(!game.hintsEnabled)$('toast').classList.remove('visible');this.sync();});
  $('settings-testing').addEventListener('click',()=>{game.testingInvulnerable=!game.testingInvulnerable;this.sync();});
  $('fullscreen').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});});
  document.addEventListener('fullscreenchange',()=>this.sync());$('settings-back').addEventListener('click',()=>this.close());this.sync();
 }
 sync(){for(const [id,on,label]of[['settings-sound',this.audio.enabled,'Звук'],['settings-hints',this.game.hintsEnabled,'Подсказки'],['settings-testing',this.game.testingInvulnerable,'Тестовая неуязвимость']]){$(id).textContent=label+': '+(on?'вкл':'выкл');$(id).setAttribute('aria-pressed',String(on));}
  for(const type of['music','effects']){const value=Math.round(this.audio[type+'Volume']*100);$('volume-'+type).value=value;$('value-'+type).textContent=value+'%';}
  $('fullscreen').textContent=document.fullscreenElement?'Выйти из полного экрана':'Полноэкранный режим';
 }
 open(back){this.back=back;this.active=true;this.clearInput();this.sync();$('settings-layer').hidden=false;$('settings-sound').focus({preventScroll:true});}
 close(){this.active=false;$('settings-layer').hidden=true;this.clearInput();this.back?.();}
 key(event){if(!this.active)return false;if(event.code==='Escape'){event.preventDefault();this.close();}else if(event.code==='Tab'){const fields=[...$('settings-layer').querySelectorAll('button,input')],i=fields.indexOf(document.activeElement);if(event.shiftKey&&i<=0){event.preventDefault();fields.at(-1).focus();}else if(!event.shiftKey&&i===fields.length-1){event.preventDefault();fields[0].focus();}}return true;}
}
