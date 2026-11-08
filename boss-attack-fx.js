// Boss attack animations: painted frame strips instead of code-drawn shapes.
// Agitator: «!» (4), sound wave (4, grows from the megaphone), thrown placard (4 spinning + 3 impact), stomp shockwave (3).
// Infoshum: noise packet (4, spinning), data rain (3) and its splash (3), noise wave (4), glitch jump (6), white-noise burst (4).
// cell = one frame in the strip (px); anchor = the frame's reference point inside the cell.
export const ATTACK_FX={
 bang:{key:'agitatorBang',cell:[130,110],anchor:[65,55]},
 shout:{key:'agitatorShout',cell:[120,120],anchor:[4,60]},        // the inner arc at the megaphone
 placard:{key:'agitatorPlacard',cell:[110,105],anchor:[55,52]},   // 0–3 spin; 4–6 impact, sitting on the ground (y≈104)
 stomp:{key:'agitatorStomp',cell:[225,87],anchor:[112,86]},       // bottom centre on the floor
 packet:{key:'infoshumPacket',cell:[150,119],anchor:[75,60]},
 rain:{key:'infoshumRain',cell:[70,108],anchor:[35,100]},          // the drop's tip
 splash:{key:'infoshumSplash',cell:[130,85],anchor:[65,82]},
 wave:{key:'infoshumWave',cell:[185,71],anchor:[92,62]},
 glitch:{key:'infoshumGlitch',cell:[85,96],anchor:[42,48]},
 burst:{key:'infoshumBurst',cell:[80,86],anchor:[40,43]}
};
// Draws frame `frame` of `kind` with its anchor at (x,y), `w` world pixels wide (height keeps the cell's ratio).
export function drawAttackFx(c,a,kind,frame,x,y,w,{flip=false,rot=0,alpha=1}={}){
 const fx=ATTACK_FX[kind],img=fx&&a[fx.key];if(!img)return false;const [cw,ch]=fx.cell,[ax,ay]=fx.anchor,k=w/cw;
 c.save();c.globalAlpha*=alpha;c.translate(Math.round(x),Math.round(y));if(rot)c.rotate(rot);if(flip)c.scale(-1,1);
 c.drawImage(img,frame*cw,0,cw,ch,-ax*k,-ay*k,cw*k,ch*k);c.restore();return true;
}
// Short one-off animations owned by no attack (a rain splash, an impact): kept on the game, aged by the clock.
export function pushAttackFx(g,kind,x,y,life,extra={}){
 g.attackFx=(g.attackFx||[]).filter(f=>g.time-f.born<f.life);g.attackFx.push({kind,x,y,life,born:g.time,...extra});
}
export function drawAttackFxList(c,a,g){
 for(const f of g.attackFx||[]){const k=(g.time-f.born)/f.life;if(k<0||k>=1||f.room!==undefined&&f.room!==g.room)continue;
  if(f.kind==='splash')drawAttackFx(c,a,'splash',Math.min(2,Math.floor(k*3)),f.x,f.y,f.w||64,{alpha:k>.7?(1-k)/.3:1});
  else if(f.kind==='placardHit')drawAttackFx(c,a,'placard',4+Math.min(2,Math.floor(k*3)),f.x,f.y-52*(f.w||64)/110,f.w||64,{alpha:k>.75?(1-k)/.25:1});
  else if(f.kind==='burst')drawAttackFx(c,a,'burst',Math.min(3,Math.floor(k*4)),f.x,f.y,f.w||120,{alpha:k>.75?(1-k)/.25:1});
 }
}
// Boss projectiles with painted animations. Returns false for anything else (drawn by projectile-art.js).
export function drawBossProjectile(c,a,b,t){
 const cx=b.x+b.w/2;
 // Agitator's stomp: a shockwave ring rolling along the floor.
 if(b.visual==='agitator'&&b.kind==='wave')return drawAttackFx(c,a,'stomp',1,cx,b.y+b.h+2,84,{flip:b.vx<0,alpha:.92});
 if(b.visual!=='infoshum')return false;
 // A spinning noise cube; a parried one keeps spinning on its way back.
 if(b.kind==='packet')return drawAttackFx(c,a,'packet',Math.floor(t*10+b.x*.05)&3,cx,b.y+b.h/2,56,{alpha:b.friendly?.85:1});
 if(b.infoshumAttack==='rain'){const near=b.stopY!==undefined&&b.stopY-(b.y+b.h)<36;return drawAttackFx(c,a,'rain',near?2:Math.floor(t*12)&1,cx,b.y+b.h,40);}
 if(b.infoshumAttack==='wave'){const end=b.ttl<.5;return drawAttackFx(c,a,'wave',end?3:Math.floor(t*8)%3,cx,b.y+b.h+2,112,{flip:b.vx<0,alpha:end?Math.max(0,b.ttl/.5):1});}
 return false;
}
