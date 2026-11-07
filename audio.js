import {musicScores,sceneMusic} from './music-scores.js?v=0.21.5';
import {rooms} from './level.js?v=0.21.5';
// Original chiptune score and procedural Foley. No downloads or external audio.
function volume(key){try{const n=Number(globalThis.localStorage?.getItem('uma-volume-'+key)??'0.8');return Number.isFinite(n)?Math.max(0,Math.min(1,n)):.8;}catch{return .8;}}
const midi=n=>440*Math.pow(2,(n-69)/12);
function preference(){try{return globalThis.localStorage?.getItem('uma-sound')!=='off';}catch{return true;}}
export class GameAudio{
 constructor({context=null,enabled=preference(),onChange=()=>{}}={}){
  this.musicVolume=volume('music');this.effectsVolume=volume('effects');this.enabled=enabled;this.onChange=onChange;this.context=null;this.voices=new Set();this.theme='menu';this.duck=false;this.hidden=false;this.paused=false;this.step=0;this.next=0;this.interval=null;this.effectTimes=new Map();
  if(context)this.connect(context);
 }
 connect(context){
  this.context=context;this.offline=typeof context.startRendering==='function';
  this.master=context.createGain();this.master.gain.value=this.enabled?.55:0;
  this.music=context.createGain();this.music.gain.value=.42*this.musicVolume;this.effects=context.createGain();this.effects.gain.value=.66*this.effectsVolume;
  this.music.connect(this.master);this.effects.connect(this.master);
  this.analyser=context.createAnalyser();this.analyser.fftSize=512;this.master.connect(this.analyser);this.analyser.connect(context.destination);
  this.noise=context.createBuffer(1,context.sampleRate,context.sampleRate);const samples=this.noise.getChannelData(0);let seed=137;
  for(let i=0;i<samples.length;i++){seed=(seed*1664525+1013904223)>>>0;samples[i]=seed/2147483648-1;}
 }
 unlock(){
  if(!this.enabled||this.offline)return;
  try{
   if(!this.context){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;this.connect(new Audio());}
   if(this.context.state==='suspended')this.context.resume().catch(()=>{});
   if(!this.interval)this.interval=setInterval(()=>this.tick(),90);
  }catch{this.setEnabled(false);}
 }
 setEnabled(enabled){
  this.enabled=!!enabled;try{globalThis.localStorage?.setItem('uma-sound',enabled?'on':'off');}catch{}
  if(!enabled)this.stop();else this.unlock();
  if(this.master)this.master.gain.setTargetAtTime(enabled?.55:0,this.context.currentTime,.015);
  this.next=0;this.onChange(this.enabled);
 }
 setVolume(type,value){if(!['music','effects'].includes(type))return;value=Number.isFinite(value)?Math.max(0,Math.min(1,value)):.8;this[type+'Volume']=value;try{globalThis.localStorage?.setItem('uma-volume-'+type,String(value));}catch{}if(this.context){const level=type==='music'?(this.paused||this.hidden?0:this.duck?.12:.42):.66;this[type].gain.setTargetAtTime(level*value,this.context.currentTime,.02);}this.onChange(this.enabled);}
 stop(group=null){
  for(const voice of this.voices)if(!group||voice.group===group){try{voice.source.stop();}catch{}this.voices.delete(voice);}
 }
 setHidden(hidden){this.hidden=!!hidden;if(hidden){this.stop();this.next=0;}}
 setScene(view,game){
  const pause=view==='exit'||view==='game'&&['paused','lost','respawning','exited','loading'].includes(game.mode);
  const theme=sceneMusic(view,game,rooms);
  this.duck=view==='game'&&['dialogue','waking','conclusion'].includes(game.mode);
  if(theme!==this.theme||pause!==this.paused){this.stop(pause?null:'music');this.step=0;this.next=0;this.theme=theme;this.paused=pause;}
  if(this.music)this.music.gain.setTargetAtTime(pause||this.hidden?0:this.duck?.12*this.musicVolume:.42*this.musicVolume,this.context.currentTime,.08);
 }
 voice({frequency=220,to=frequency,duration=.15,gain=.06,wave='square',start,pan=0,group='effects',noise=false,filter=1800}){
  const ctx=this.context;if(!ctx)return;const at=start??ctx.currentTime+.006,source=noise?ctx.createBufferSource():ctx.createOscillator(),volume=ctx.createGain();
  if(noise){source.buffer=this.noise;const eq=ctx.createBiquadFilter();eq.type='bandpass';eq.frequency.value=filter;eq.Q.value=.7;source.connect(eq);eq.connect(volume);}
  else{source.type=wave;source.frequency.setValueAtTime(Math.max(12,frequency),at);source.frequency.exponentialRampToValueAtTime(Math.max(12,to),at+duration);source.connect(volume);}
  volume.gain.setValueAtTime(.0001,at);volume.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),at+.007);volume.gain.exponentialRampToValueAtTime(.0001,at+duration);
  const bus=group==='music'?this.music:this.effects;
  if(ctx.createStereoPanner){const stereo=ctx.createStereoPanner();stereo.pan.value=pan;volume.connect(stereo);stereo.connect(bus);}else volume.connect(bus);
  const voice={source,group};this.voices.add(voice);source.onended=()=>{this.voices.delete(voice);source.disconnect();volume.disconnect();};source.start(at);source.stop(at+duration+.02);return voice;
 }
 scheduleStep(index,start){
  const score=musicScores[this.theme],step=index%64,part=Math.floor(step/16),beat=60/score.bpm/2,note=score.melody[step%score.melody.length],boss=['spreader','agitator','manipulator','infoshum'].includes(this.theme);
  if(note!==null)this.voice({frequency:midi(note),duration:beat*.77,gain:score.gain??(boss?.043:.034),wave:score.wave,start,group:'music',pan:.12});
  if(this.theme==='infoshum'&&note!==null&&step%4===0)this.voice({frequency:midi(note+7),duration:beat*.4,gain:.014,wave:'square',start:start+beat*.12,group:'music',pan:-.2});
  if(step%2===0)this.voice({frequency:midi(score.bass[part]+(step%8===6?12:0)),duration:beat*1.5,gain:boss?.085:.065,wave:'triangle',start,group:'music',pan:-.12});
  if(step%8===0)for(const n of score.chords[part])this.voice({frequency:midi(n),duration:beat*6,gain:.013,wave:'triangle',start,group:'music',pan:-.25});
  if(score.drums.includes(step%8))this.voice({duration:.045,gain:boss?.028:.017,start,group:'music',noise:true,filter:score.noise,pan:.25});
  if(score.drums.length&&step%4===0)this.voice({frequency:boss?125:98,to:42,duration:.13,gain:boss?.09:.06,wave:'sine',start,group:'music'});
  if(score.drums.length&&step%8===4)this.voice({duration:.11,gain:.04,start,group:'music',noise:true,filter:score.noise*.55});
 }
 tick(){
  const ctx=this.context;if(!ctx||ctx.state!=='running'||!this.enabled||this.hidden||this.paused){this.next=0;return;}
  if(!this.next||this.next<ctx.currentTime-.1)this.next=ctx.currentTime+.035;
  while(this.next<ctx.currentTime+.17){this.scheduleStep(this.step++,this.next);this.next+=60/musicScores[this.theme].bpm/2;}
 }
 play(event,game){
  if(!this.enabled||this.hidden||!this.context||!this.offline&&this.context.state!=='running')return;
  const enemyType=event.enemyType,type={tutorialMonitor:'dishBreak',tutorialBarrier:'dash',sensationWarning:'alarm',roofBounce:'jump',gustWarning:'dash',roofFall:'hurt',holoWarning:'cutWarning',holoVanish:'platformCut',takeWarning:'cutWarning',takeSwap:'platformCut',botPrint:'copyScan',botSpawn:'copySpawn',botFreeze:'staticWarning',envelopeIn:'teleportIn',envelopeOut:'teleportOut',deadLink:'blocked',riftFlip:'echoTeleport',sourceFound:'lifePickup',clickbaitSpit:'hurt',lettersCrumble:'platformCrumble',placardRise:'copySpawn'}[event.type]||event.type,now=this.context.currentTime,last=this.effectTimes.get(type)??-10;
  if(now-last<.045)return;this.effectTimes.set(type,now);
  const dx=Number.isFinite(event.x)&&game?event.x-game.player.x:0,pan=Math.max(-.7,Math.min(.7,dx/450)),level=Math.abs(dx)>650?.18:Math.abs(dx)>350?.55:1;
  const tone=(frequency,to,duration=.15,gain=.07,wave='square',delay=0)=>this.voice({frequency,to,duration,gain:gain*level,wave,pan,start:now+.006+delay});
  const noise=(duration=.12,gain=.07,filter=2000,delay=0)=>this.voice({noise:true,duration,gain:gain*level,filter,pan,start:now+.006+delay});
  if(type==='letterLand'){noise(.09,.07,500);tone(120,70,.12,.05,'square');return;}
  if(type==='agitatorOverheat'){noise(.5,.04,5200);tone(900,300,.45,.025,'sawtooth');return;}
  if(type==='mastBend'){tone(140,55,.6,.06,'sawtooth');noise(.4,.05,1200,.05);return;}
  if(type==='bossLand'){noise(.22,.09,400);tone(90,40,.25,.06,'triangle');return;}
  if(type==='enemyNoticed'){
   const pitches={fakenews:260,clickbait:100,inflator:145,informant:920,panicker:740,stamp:180,copier:460,cutter:1100,splicer:320,injection:580,echo:660,static:190};tone(pitches[enemyType]||280,(pitches[enemyType]||280)*1.25,.08,.035,'triangle');return;
  }
  if(type==='catMeow'){tone(620,900,.13,.04,'triangle');tone(900,590,.18,.035,'sine',.1);}
  else if(type==='bossDefeatStart'){noise(.35,.06,event.boss==='agitator'?800:3500);tone(180,50,.5,.055,'triangle');}
  else if(type==='brandReveal'){for(const [i,n]of [60,67,72].entries())tone(midi(n),midi(n),.6,.028,'triangle',i*.09);}
  else if(type==='echoTeleport'){tone(880,140,.35,.06,'triangle');tone(660,100,.38,.035,'sine');}
  else if(type==='echoArrive')tone(160,660,.2,.06,'triangle');
  else if(type==='staticWarning')noise(.3,.045,4500);
  else if(type==='staticStrike'){noise(.16,.09,6200);tone(180,65,.13,.05,'sawtooth');}
  else if(type==='glueWarning')tone(280,350,.28,.04,'triangle');
  else if(type==='gluePull'){noise(.25,.055,1200);tone(340,170,.35,.035,'sawtooth');}
  else if(type==='glueRelease')tone(600,100,.1,.04);
  else if(type==='tickerShot'){tone(540,110,.15,.05);noise(.08,.04,3200);}
  else if(type==='fakeLunge'||type==='fakeJump'){noise(.13,.09,3200);tone(260,100,.09,.03);}
  else if(type==='baitReveal'){tone(80,500,.16,.11,'sawtooth');noise(.09,.08,900);}
  else if(type==='swallow'){tone(150,35,.38,.13,'triangle');noise(.2,.06,250,.08);}
  else if(type==='inflatorWarning')tone(100,210,.28,.04,'sawtooth');
  else if(type==='blast'){for(let i=0;i<3;i++)tone(130+i*5,70,.14,.095,'sawtooth',i*.055);noise(.2,.06,700);}
  else if(type==='alarm'){for(const [ratio,gain]of [[1,.11],[2.76,.035],[5.4,.015]])tone(740*ratio,735*ratio,.8,gain,'sine');}
  else if(type==='alarmMuffled'){noise(.18,.045,280);tone(130,65,.2,.045,'triangle');}
  else if(type==='enemyShot'){tone(920,360,.11,.07);noise(.045,.03,4200);}
  else if(type==='teleportStart'||type==='teleportOut'){tone(170,1250,.27,.065,'sawtooth');tone(178,1000,.27,.035,'triangle');}
  else if(type==='teleportIn'){tone(1300,240,.28,.065,'triangle');noise(.12,.035,3000);}
  else if(type==='inkWarning')tone(110,160,.12,.04,'triangle');
  else if(type==='inkStamp'){noise(.24,.11,380);tone(140,46,.2,.08,'triangle');}
  else if(type==='copyScan'){tone(220,1100,.45,.055,'sawtooth');tone(448,460,.4,.025,'triangle');}
  else if(type==='copySpawn'){noise(.22,.055,2700);tone(880,660,.12,.055);tone(1320,990,.14,.035,'triangle',.13);}
  else if(type==='copyDissolve'){noise(.17,.035,4200);tone(700,100,.15,.035,'triangle');}
  else if(type==='cutWarning'){noise(.045,.07,5600);tone(1400,1000,.055,.035,'triangle');}
  else if(type==='platformCut'){noise(.11,.12,4500);noise(.08,.08,2700,.12);tone(1000,340,.09,.04);}
  else if(type==='platformRestore')tone(350,660,.15,.035,'triangle');
  else if(type==='antennaHit'){tone(350,800,.18,.05,'triangle');noise(.08,.04,2200);}
  else if(type==='broadcastShieldBreak'){noise(.4,.08,3000);tone(180,800,.5,.05,'triangle');}
  else if(type==='infoshumArmorHit'){tone(480,120,.22,.04,'sawtooth');}
  else if(type==='infoshumWarning'){tone(145,290,.25,.045,'triangle');}
  else if(type==='infoshumTransfer'){tone(420,90,.35,.04,'sawtooth');}
  else if(type==='infoshumSlam'){noise(.18,.09,1800);tone(100,45,.18,.06,'sawtooth');}
  else if(type==='infoshumRupture'){noise(.65,.08,2200);tone(65,180,.65,.08,'triangle');}
  else if(type==='bossCast'){tone(90,45,.3,.12,'sawtooth');if(event.ability==='rain')noise(.5,.06,3400);else noise(.2,.06,700);}
  else if(type==='bossWarning'){const base={spreader:240,agitator:110,manipulator:440,infoshum:75}[event.boss]||110;tone(base,base*1.4,.25,.05,'triangle');}
  else if(type==='arenaPull'||type==='infection'){tone(140,35,.8,.09,'sawtooth');noise(.5,.06,400);}
  else if(type==='bossStart'||type==='arenaEnter'){for(const n of [45,52,57])tone(midi(n),midi(n),.6,.04,'triangle');}
  else if(type==='jump')tone(280,600,.13,.055);
  else if(type==='dash'){noise(.14,.08,4500);tone(500,1000,.12,.035,'triangle');}
  else if(type==='swat')noise(.07,.07,3300);
  else if(type==='hurt'||type==='lifeLost'){tone(150,50,.25,.1,'sawtooth');noise(.14,.06,800);}
  else if(type==='enemyHit'){noise(.08,.075,enemyType==='stamp'?400:1900);tone(220,100,.1,.045,'triangle');}
  else if(type==='blocked'){tone(340,290,.13,.07,'triangle');tone(970,900,.1,.035,'sine');}
  else if(type==='pop'){noise(.12,.07,1800);tone(300,60,.13,.05);}
  else if(type==='bossHit'){tone(170,75,.2,.09,'sawtooth');noise(.13,.08,1300);}
  else if(['fish','heal','soup','checkpoint','lifePickup','dishBreak','parry'].includes(type)){
   const freq=type==='lifePickup'?1046:type==='parry'?1320:784;tone(freq,freq,.1,.06,'triangle');tone(freq*1.25,freq*1.25,.13,.05,'triangle',.09);if((type==='dishBreak'||type==='controlBreak'))noise(.24,.09,3600);
  }else if(type==='won')for(const [i,n]of [69,72,76,81].entries())tone(midi(n),midi(n),.35,.06,'triangle',i*.14);
 }
 destroy(){clearInterval(this.interval);this.interval=null;this.stop();if(this.context&&!this.offline)this.context.close().catch(()=>{});}
}
