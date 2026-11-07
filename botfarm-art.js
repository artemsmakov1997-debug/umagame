// Ботоферма and its bots. assets/botfarm.png: 3×2 cells of 512×512 — working ×2, printing a bot, alarm, hit, broken.
// assets/botfarm-bot.png: 4×2 cells of 384×512 — stand, crouch, air, land; appear, hit, hung (spinner), falling apart.
// Each pivot is the point between the feet; drawings are placed with that point at the bottom centre of the box.
const FARM_PIVOT=[[287,475],[772,475],[1245,475],[290,990],[769,990],[1251,990]];
const BOT_PIVOT=[[207,446],[584,446],[960,399],[1344,446],[210,947],[572,947],[958,947],[1300,947]];
export function botfarmFrame(e={},time=0){
 if(e.dead)return 5;if(e.hurtTime>0)return 4;if(e.state==='printing'||e.state==='casting')return 2;if(e.alarm||e.state==='windup'||e.noticeTime>0)return 3;
 return e.moving?Math.floor((e.walkTime||0)*7)%2:Math.floor(time*3)%2;
}
export function botFrame(e={}){
 if(e.dead)return 7;if(e.frozen)return 6;if(e.hurtTime>0)return 5;if(e.spawnTime>0)return 4;
 return {crouch:1,air:2,land:3}[e.hopPhase]??0;
}
function place(c,image,cell,pivot,cw,ch,x,y,w,h,height){
 const col=cell%(image.width/cw|0),row=cell/(image.width/cw|0)|0,k=h/height;
 c.drawImage(image,col*cw,row*ch,cw,ch,Math.round(x+w/2-(pivot[0]-col*cw)*k),Math.round(y+h-(pivot[1]-row*ch)*k),Math.round(cw*k),Math.round(ch*k));
}
// The rack is ~455 px tall in its cell; `h` is its on-screen height.
export function drawBotfarmPortrait(c,a,x,y,w,h,time=0,actor={}){
 if(!a.botfarm)return;const f=botfarmFrame(actor,time);place(c,a.botfarm,f,FARM_PIVOT[f],512,512,x,y,w,h,470);
}
// A bot is ~310 px from antenna tip to feet.
export function drawBotPortrait(c,a,x,y,w,h,time=0,actor={}){
 if(!a.botfarmBot)return;const f=botFrame(actor);place(c,a.botfarmBot,f,BOT_PIVOT[f],384,512,x,y,w,h,330);
}
