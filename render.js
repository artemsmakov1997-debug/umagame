import {drawAgitatorEquipment,drawAgitatorBackdrop,drawAgitatorPlatform,drawAgitatorProjectile} from './agitator-art.js?v=0.21.5';
import {drawInterferenceOverlay} from './interference-art.js?v=0.21.5';
import {drawBackdropVeil,drawPlatformShadow,drawPlatformRim} from './readability.js?v=0.21.5';
import {drawRouteTransition} from './route-transition-art.js?v=0.21.5';
import {drawStudioBackdrop,drawStudioPlatform} from './manipulator-art.js?v=0.21.5';
import {drawInfoshumProjectile} from './infoshum-sprites.js?v=0.21.5';
import {drawSpreaderEquipment} from './spreader-arena-art.js?v=0.21.5';
import {drawInfoshumBackdrop,drawInfoshumPlatform} from './infoshum-art.js?v=0.21.5';
import {drawServant} from './spreader-minion-art.js?v=0.21.5';
import {drawProjectile,drawCombatEffects} from './projectile-art.js?v=0.21.5';
import {drawBossDefeat} from './boss-defeat-art.js?v=0.21.5';
import {drawYuriSignal} from './signal-art.js?v=0.21.5';
import {drawPassages} from './passage-art.js?v=0.21.5';
import {drawNewsroomScenery,drawNewsroomConveyor} from './newsroom-art.js?v=0.21.5';
import {drawMapProps} from './chapter-route-art.js?v=0.21.5';
import {drawExitArrow} from './navigation-art.js?v=0.21.5';
import {drawEnemySources,drawEchoVortex} from './enemy-arrival-art.js?v=0.21.5';
import {drawFinaleBackdrop} from './ending-ui.js?v=0.21.5';
import {solidSurfaces} from './terrain.js?v=0.21.5';
import {drawTacticalTerrain,drawEnemyDefense} from './tactical-art.js?v=0.21.5';
import {WIDTH,HEIGHT,rooms,platforms,ladders,FINAL_X,LAST_ROOM} from './engine.js?v=0.21.5';
import {rect,text} from './pixel.js?v=0.21.5';
import {cats,creatures,sprite} from './assets.js?v=0.21.5';
import {drawMonster,drawLure,drawSoup} from './art.js?v=0.21.5';
import {drawHud} from './hud.js?v=0.21.5';
import {drawNotebook} from './notebook-art.js?v=0.21.5';
import {drawMovingRails,drawLifeCaches,drawArenaTransfer,drawLocationLoading} from './stage-art.js?v=0.21.5';
import {drawArenaBoss} from './boss-art.js?v=0.21.5';
import {drawShelter} from './spreader-art.js?v=0.21.5';
import {drawTutorialSurface,drawTutorialProps} from './tutorial-art.js?v=0.21.5';
import {drawRoofSurface,drawRoofProps,drawRoofWind,drawSensations} from './roofs-art.js?v=0.21.5';
import {drawStudioSurface,drawStudioBack,drawStudioProps} from './studio-art.js?v=0.21.5';
import {drawTargetHighlights} from './target-highlight.js?v=0.21.5';
import {drawTeleportMarkers,drawTeleportingInformant} from './teleport-art.js?v=0.21.5';
import {sceneLayers,drawSurface,drawAmbience,drawCampaignObjects,drawWakeup,drawInfection,drawEpilogue,backgroundLayers,drawBackdrop,drawOpening,roomDarkness} from './campaign-art.js?v=0.21.5';
import {drawEmotion,hurtPose,drawTraversal,drawRest,moodPose,drawMood,MOOD} from './cat-animation.js?v=0.21.5';
export class Renderer{
 constructor(canvas,assets){this.c=canvas.getContext('2d');this.hud=canvas.ownerDocument?.getElementById('hud');this.c.imageSmoothingEnabled=false;this.assets=assets;this.combatEffects=[];this.signalTime=0;this.previousVisualTime=0;this.particles=[];this.trail=[];this.trailTimer=0;this.layers=sceneLayers(assets);this.backdrops=backgroundLayers(this.layers);this.wakeupStart=null;}
 burst(x,y,color){for(let i=0;i<14;i++)this.particles.push({x,y,vx:(Math.random()-.5)*150,vy:-Math.random()*140,life:.5,color});}
 draw(g,dt=0,visualTime=g.time){
  if(g.mode==='dialogue')this.signalTime+=Math.max(0,Math.min(.05,visualTime-this.previousVisualTime));this.previousVisualTime=visualTime;
  const c=this.c,a=this.assets,bounds=c.canvas.getBoundingClientRect(),vw=Math.max(160,Math.round(HEIGHT*bounds.width/Math.max(1,bounds.height)));
  if(c.canvas.width!==vw)c.canvas.width=vw;if(c.canvas.height!==HEIGHT)c.canvas.height=HEIGHT;
  const hudBounds=this.hud?.getBoundingClientRect();if(hudBounds?.width&&hudBounds.height){const hw=Math.round(hudBounds.width),hh=Math.round(hudBounds.height);if(this.hud.width!==hw)this.hud.width=hw;if(this.hud.height!==hh)this.hud.height=hh;const hc=this.hud.getContext('2d');hc.imageSmoothingEnabled=false;drawHud(hc,a,g,hw,hh);}
  const cozyFit=g.room===0&&!g.touchEnabled,quietOpening=g.room===0&&(g.mode==='waking'||g.pausedFrom==='waking'||g.dialogue?.id==='intro'),worldScale=cozyFit?Math.min(vw/WIDTH,HEIGHT/512):1,worldWidth=cozyFit?(quietOpening?WIDTH:Math.min(rooms[0].width,vw/worldScale)):vw,worldInset=cozyFit?(vw-worldWidth*worldScale)/2:g.room===2?Math.max(0,(vw-rooms[2].width)/2):0,worldTop=cozyFit?(HEIGHT-512*worldScale)/2:0;
  if(g.mode!=='paused'&&g.viewWidth!==worldWidth){g.viewWidth=worldWidth;g.updateCamera();}
  const t=g.time,p=g.player,b=g.boss,cam=Math.round(g.camera),opening=g.room===0&&(g.mode==='waking'||g.pausedFrom==='waking'||g.dialogue?.id==='intro');
  if(['ending','conclusion','won'].includes(g.mode)||['ending','conclusion','won'].includes(g.pausedFrom)){c.imageSmoothingEnabled=false;drawFinaleBackdrop(c,a,g,vw);return;}
  c.imageSmoothingEnabled=false;c.clearRect(0,0,vw,HEIGHT);if(g.room===2){const image=a.spreaderArena,scale=Math.max(vw/image.width,HEIGHT/image.height);c.drawImage(image,(vw-image.width*scale)/2,(HEIGHT-image.height*scale)/2,image.width*scale,image.height*scale);}
  if(cozyFit&&a.wings&&worldInset>0){
   const s=HEIGHT/a.wings.height,sw=a.wings.width/4,wing=sw*s;c.save();if(roomDarkness(g.wakeTime)>0)c.filter=`brightness(${1-roomDarkness(g.wakeTime)*.8})`;
   c.drawImage(a.wings,(vw-a.wings.width*s)/2,0,a.wings.width*s,HEIGHT);
   for(let x=worldInset;x>0;x-=wing)c.drawImage(a.wings,0,0,sw,a.wings.height,x-wing,0,wing,HEIGHT);
   const rightSource=186,rightWing=rightSource*s;for(let x=worldInset+worldWidth*worldScale;x<vw;x+=rightWing)c.drawImage(a.wings,a.wings.width-rightSource,0,rightSource,a.wings.height,x,0,rightWing,HEIGHT);
   c.restore();
  }
  c.save();c.translate(worldInset,worldTop);c.scale(worldScale,worldScale);c.translate(-cam,0);
  for(const [i,room] of rooms.entries()){
   if(i!==g.room)continue;if(room.x+room.width+150<cam||room.x-150>cam+vw)continue;
   drawBackdrop(c,this.backdrops[i],room,cam,roomDarkness(g.wakeTime));drawNewsroomScenery(c,a,g,t);drawAmbience(c,room,t);if(room.index===8)drawInfoshumBackdrop(c,a,g,t);if(room.index===6)drawStudioBackdrop(c,a,g,t);if(room.index===4)drawAgitatorBackdrop(c,a,g,t);
  }
  drawBackdropVeil(c,g,cam,vw);
  if(cam<WIDTH+150)drawOpening(c,a,g);
  c.save();if(opening)c.globalAlpha=roomDarkness(g.wakeTime);
  if(![2,3,4,5,6].includes(g.room))drawPassages(c,a,g);
  // Restore only playable tabletop strips, then give every collision surface a bright edge.
  drawMovingRails(c,g.platforms.filter(s=>s.room===g.room&&!s.bossHidden),t);
  if(g.room===6)for(const platform of g.platforms.filter(p=>p.room===6&&['gap','forming'].includes(p.studioPhase)))drawStudioPlatform(c,a,platform,t);
  if(g.room===5){drawStudioBack(c,a,g,t);for(const platform of g.platforms.filter(p=>p.room===5&&p.intangible))drawStudioSurface(c,a,g,platform);}
  for(const platform of solidSurfaces(g)){
   if(platform.room!==g.room||platform.collapseTime>0)continue;
   if(platform.x+platform.w<cam||platform.x>cam+vw)continue;
   drawPlatformShadow(c,g,platform);
   if(platform.id==='1:0')drawNewsroomConveyor(c,a,g,t);else if(g.room===0&&drawTutorialSurface(c,a,g,platform)){}else if(g.room===3&&drawRoofSurface(c,a,g,platform)){}else if(g.room===5&&drawStudioSurface(c,a,g,platform)){}else if(platform.shelter&&g.room===2&&drawShelter(c,a,g,platform)){}else if(g.room===4)drawAgitatorPlatform(c,a,platform,t);else if(g.room===8)drawInfoshumPlatform(c,a,platform,t);else if(g.room===6)drawStudioPlatform(c,a,platform,t);else drawSurface(c,a,platform,t);
   drawPlatformRim(c,g,platform,t);
  }
  for(const ladder of ladders){
   if(ladder.room!==g.room||g.room===3)continue;
   if(ladder.x<cam-40||ladder.x>cam+vw)continue;
   rect(c,ladder.x-1,ladder.y+9,ladder.w+2,ladder.h-9,'#050e1e');
   for(const x of [ladder.x,ladder.x+ladder.w-3])rect(c,x,ladder.y+9,3,ladder.h-9,'#b6c8c9');
   for(let y=ladder.y+20;y<ladder.y+ladder.h;y+=19){rect(c,ladder.x+3,y,ladder.w-6,3,'#91bdcc');rect(c,ladder.x+3,y+3,ladder.w-6,2,'#415b6c');}
  }
  drawSpreaderEquipment(c,a,g,t);drawAgitatorEquipment(c,a,g,t);drawTutorialProps(c,a,g,t);drawRoofProps(c,a,g,t);drawStudioProps(c,a,g,t);drawCampaignObjects(c,a,g,t);drawTacticalTerrain(c,g,t);
  drawInfection(c,g,a);drawEnemySources(c,g,t,a);drawMapProps(c,a,g,t);c.restore();
  drawArenaBoss(c,a,g,t);drawTargetHighlights(c,g,t);drawSensations(c,a,g,t);drawRoofWind(c,g,t);
  drawLifeCaches(c,g,t);
  for(const f of g.fishes)if(f.room===g.room&&!opening&&!f.taken&&f.x>cam-20&&f.x<cam+vw+20)sprite(c,a.noise,creatures.fish,f.x-13,f.y+Math.sin(t*3+f.x)*2-8,26,16);
  for(const soup of g.soups)if(soup.room===g.room&&!soup.taken){drawSoup(c,a,soup.x,soup.y+Math.sin(t*2.6)*2,32);for(let i=0;i<3;i++)rect(c,soup.x-13+i*12,soup.y-20-Math.sin(t*3+i)*4,2,2,'#ffde8a');}
  for(const note of g.notebooks)if(note.room===g.room&&!note.taken&&Number.isFinite(note.readyAt)&&note.readyAt<=g.time+.5&&note.x>cam-30&&note.x<cam+vw+30)drawNotebook(c,note,t);
  for(const e of g.enemies)if(e.active&&!e.dead&&e.room===g.room&&e.teleport)drawTeleportMarkers(c,e,t);
  for(const e of g.enemies)if(e.room===g.room&&e.active&&(!e.dead||e.deathTime>0)&&e.x>cam-140&&e.x<cam+vw+140){
   if(e.type==='clickbait'&&!e.revealed){drawLure(c,a,e.x+24,e.y+8,t);continue;}
   c.save();
   if(e.spawnTime>0){const progress=Math.max(0,Math.min(1,(1-e.spawnTime/(e.arrivalDuration||.55)-.12)/.88));c.beginPath();c.rect(e.x-140,e.y-170,328,e.h+170);c.clip();c.translate(0,(1-progress)*(e.type==='servant'?12:78));c.globalAlpha=progress>.01?1:0;}
   else if(e.dead)c.globalAlpha=e.deathTime/.28;else if(e.inv>0&&Math.floor(t*20)%2===0)c.globalAlpha=.7;
   if(e.copyOwnerId){c.globalAlpha*=.78;c.filter='sepia(1) saturate(1.7) hue-rotate(125deg)';}
   if(e.type==='servant')drawServant(c,a,e,t);
   if(['stamp','copier','cutter','splicer','injection'].includes(e.type))drawMonster(c,a,e.type,e.x-12,e.y-39,72,68,t,e.dir<0,e);
   if(e.type==='botfarm')drawMonster(c,a,e.type,e.x+e.w/2-46,e.y+e.h-82,92,82,t,false,e);
   if(e.type==='bot')drawMonster(c,a,e.type,e.x+e.w/2-20,e.y+e.h-38,40,38,t,false,e);
   if(e.type==='static')drawMonster(c,a,e.type,e.x-17,e.y-24,74,66,t,e.dir<0,e);
   if(e.type==='echo')drawMonster(c,a,e.type,e.x+e.w/2-34,e.y+e.h-54,68,54,t,e.dir<0,{...e,chase:e.state==='chase',forming:e.state==='forming'});
   if(e.type==='fakenews'){const scale=e.pressureTime>0?1.25:1;drawMonster(c,a,e.type,e.x+24-38*scale,e.y+29-72*scale,76*scale,72*scale,t,e.dir<0,e);}
   if(e.type==='informant'){
    if(!drawTeleportingInformant(c,a,e,t))drawMonster(c,a,e.type,e.x-18,e.y-56,84,85,t,e.dir<0,e);
    if(['windup','casting'].includes(e.state)&&e.shieldBroken===0){c.strokeStyle='#ac92ff';c.lineWidth=2;c.strokeRect(e.x-8,e.y-42,64,70);}
   }
   if(e.type==='inflator')drawMonster(c,a,e.type,e.x-18,e.y-46,89,76,t,e.dir<0,e);
   if(e.type==='panicker')drawMonster(c,a,e.type,e.x-9,e.y-35,67,65,t,e.dir<0,e);
   if(e.type==='clickbait')drawMonster(c,a,e.type,e.x-35,e.y-79,112,108,t,e.dir>0,e);
   c.restore();c.filter='none';c.globalAlpha=1;if(e.dead||e.spawnTime>0||e.phased)continue;
   drawEnemyDefense(c,e,t);
   if(e.guardian)text(c,'!',e.x+38,e.y-72,'#ffcf77');if(e.state==='windup')text(c,'!',e.x+19,e.y-78,'#ffcf79',2);
   if(e.type==='inflator'&&['windup','blast'].includes(e.state)){
    const start=e.dir>0?e.x+40:e.x-360;if(e.state==='windup'){rect(c,e.x+16,e.y-34,16,3,'#e7ad63');}
    else for(let wave=0;wave<3;wave++)for(let yy=-17;yy<=17;yy+=3){const dx=Math.round(Math.sqrt(17*17-yy*yy)*.65),dist=24+wave*105+(t*850)%100;rect(c,e.x+24+e.dir*(dist+dx),e.y+13+yy,3,3,'#98eaff');}
   }
   if(e.type==='panicker'&&['windup','alarm'].includes(e.state)){const radius=e.state==='alarm'?35+(t*70)%90:35;for(let i=0;i<12;i++){const angle=i*Math.PI/6;rect(c,e.x+24+Math.cos(angle)*radius,e.y-9+Math.sin(angle)*radius,3,5,'#ffb777');}}
  }
  for(const bolt of g.bolts){
   if(bolt.kind==='echoOrb'){drawEchoVortex(c,bolt,t);drawMonster(c,a,'echo',bolt.x-8,bolt.y-10,48,48,t,false,{...bolt,flying:true,orb:true});continue;}
   if(!drawAgitatorProjectile(c,a,bolt,t)&&!drawInfoshumProjectile(c,a,bolt,t))drawProjectile(c,a,g,bolt,t);
  }
  drawCombatEffects(c,a,this.combatEffects,dt);this.combatEffects=this.combatEffects.filter(e=>e.time<.32);
  if((!p.grounded&&Math.abs(p.vx)>0||p.dash>0)&&g.mode==='playing'){
   this.trailTimer+=dt;if(this.trailTimer>.025){this.trailTimer=0;this.trail.push({x:p.x+9,y:p.y+34,life:.3,dash:p.dash>0});}
  }
  for(const trail of this.trail){trail.life-=dt;c.globalAlpha=Math.max(0,trail.life/.3);rect(c,trail.x,trail.y,trail.dash?12:3,3,trail.dash?'#72dffe':'#ccd3ff');}c.globalAlpha=1;this.trail=this.trail.filter(v=>v.life>0);
  if(g.storyEnabled&&!g.seenScenes.has('intro')||g.dialogue?.id==='intro'){
   drawWakeup(c,a,p,g.wakeTime);
  }else if(p.hurtTime>0){
   // The fresh hit uses the new recoil; the recovery keeps the old crouch.
   if(!(p.hurtTime>.26&&drawMood(c,a,MOOD.hurt,p.x+p.w/2,p.y+p.h,p.dir<0)))drawEmotion(c,a,hurtPose(p.hurtTime),p.x+p.w/2,p.y+p.h,76,p.dir>0);
  }else if(moodPose(p,g)!==null&&a.moods){
   const mood=moodPose(p,g),owner=mood===MOOD.dragged?g.enemies.find(e=>e.id===g.tether.ownerId):null,face=owner?(owner.x>p.x?1:-1):p.dir;
   if(p.inv>0&&Math.floor(t*12)%2!==0)c.globalAlpha=.6;
   c.save();if(mood===MOOD.dash){c.shadowColor='#7deaf5';c.shadowBlur=8;}drawMood(c,a,mood,p.x+p.w/2,p.y+p.h,face<0);c.restore();c.globalAlpha=1;
   if(mood===MOOD.hiss&&Math.floor(t*6)%2)rect(c,p.x+(face>0?p.w+2:-8),p.y+8,6,2,'#ffd2d8');
  }else if((p.sleeping||p.slipping||p.pulled)&&drawRest(c,a,p)){
   if(p.sleeping&&p.sleepTime>1){const z=Math.floor(t*1.4)%3;rect(c,p.x+32+z*4,p.y+5-z*7,4,2,'#a4cede');rect(c,p.x+34+z*4,p.y+7-z*7,2,3,'#a4cede');rect(c,p.x+32+z*4,p.y+10-z*7,4,2,'#a4cede');}
   if(p.slipping)for(let i=0;i<3;i++)rect(c,p.x-p.dir*(i*8+5),p.y+p.h-2,5,2,'#b27edc');
  }else if((p.climbing||p.sneaking)&&drawTraversal(c,a,p)){
   if(p.sneaking)rect(c,p.x+10,p.y-5,14,2,'#a9eac977');
  }else{
   if(p.inv>0&&Math.floor(t*12)%2!==0&&!g.swallow)c.globalAlpha=.6;
   this.wakeupStart=null;
   const pose=p.attack>0?4:!p.grounded&&!p.climbing?3:Math.abs(p.vx)>0?1+Math.floor(t*10)%2:0;
   const {box,anchor}=cats[pose],progress=g.swallow?1-Math.pow(g.swallow.timer/g.swallow.total,3):0,scale=(g.swallow?Math.max(0,1-progress*1.18):1)*(p.warpScale??1);
   const w=Math.round(box[2]*.195*scale),h=Math.round(box[3]*.195*scale);
   const center=g.swallow?(g.swallow.x+17)*(1-progress)+(g.swallow.targetX+12)*progress:p.x+p.w/2;
   const feet=g.swallow?(g.swallow.y+48)*(1-progress)+(g.swallow.targetY+24)*progress:p.y+p.h;
   if(w>0&&h>0){c.save();if(p.dash>0){c.shadowColor='#7deaf5';c.shadowBlur=8;}sprite(c,a.uma,box,p.dir>0?center-w*anchor:center-w*(1-anchor),feet-h,w,h,p.dir<0);c.restore();}
   if(p.powerTime>0)for(let i=0;i<5;i++)rect(c,p.x-13+i*14,p.y-10+Math.sin(t*5+i)*5,2,2,'#ffe6a0');
   c.globalAlpha=1;
  }
  if(p.attack>.04){c.save();c.translate(Math.round(p.x+17+p.dir*36),Math.round(p.y+24));if(p.dir<0)c.scale(-1,1);for(let i=0;i<3;i++){rect(c,10+i*2,-13+i*8,3,10,'#ffe6a7');rect(c,6+i*2,-15+i*8,4,2,'#ffe6a7');}c.restore();}
  for(const q of this.particles){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=160*dt;rect(c,q.x,q.y,3,3,q.color);}this.particles=this.particles.filter(q=>q.life>0);
  if(g.tether){const e=g.tether.ownerId==='boss:'+g.boss.id?g.boss:g.enemies.find(e=>e.id===g.tether.ownerId);if(e){c.strokeStyle='#c9a4ed';c.lineWidth=3;c.setLineDash([5,4]);c.beginPath();c.moveTo(e.x+24,e.y+2);c.lineTo(p.x+17,p.y+28);c.stroke();c.setLineDash([]);for(let i=0;i<5;i++)rect(c,e.x+5+i*8,e.y-58,5,3,i<Math.ceil(g.tether.remaining)?'#ffdb9b':'#263a55');}}
  drawYuriSignal(c,a,g,g.mode==='dialogue'||g.pausedFrom==='dialogue'?this.signalTime:t);drawBossDefeat(c,a,g);
  drawExitArrow(c,g,t,worldWidth);c.restore();
  drawInterferenceOverlay(c,g,vw);drawArenaTransfer(c,g,vw);if(!drawRouteTransition(c,a,g,vw))drawLocationLoading(c,g,vw);
  if(g.defeat&&(g.mode==='bossDefeat'||g.mode==='paused'&&g.pausedFrom==='bossDefeat')){c.save();c.globalAlpha=Math.max(0,Math.min(1,(g.defeat.time-1.42)/.28));rect(c,0,0,vw,HEIGHT,'#030919');c.restore();}
  if(g.mode==='respawning'||g.pausedFrom==='respawning'){
   const progress=1-g.respawnTime/1.1;c.globalAlpha=Math.max(0,(progress-.25)/.75)*.86;rect(c,0,47,vw,HEIGHT-47,'#030a1e');c.globalAlpha=1;
  }
 }
}
