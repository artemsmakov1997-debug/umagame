import {sprite} from './assets.js?v=0.21.5';
export const emotionFrames=[
 {box:[14,14,350,268],pivot:[185,282]},
 {box:[378,14,346,263],pivot:[551,277]},
 {box:[738,14,315,385],pivot:[938,399]},
 {box:[1067,14,389,371],pivot:[1262,385]},
 {box:[14,413,298,413],pivot:[137,826]},
 {box:[326,413,325,418],pivot:[480,831]},
 {box:[665,413,320,327],pivot:[823,740]},
 {box:[999,413,394,214],pivot:[1195,627]}
];
// The opening slides already show Uma awake and alarmed, so the game opens on her standing on guard, staring at
// the screen; when Infoshum appears she flinches with a raised paw, then crouches low.
export function wakePose(time){
 if(time<2.7)return {name:'alert',frame:4};
 return {name:'surprise',frame:time<3.5?5:7};
}
export function hurtPose(remaining){return remaining>.26?6:7;}
export function drawEmotion(c,assets,frame,center,feet,height=76,flip=false){
 const {box,pivot}=emotionFrames[frame],s=height/420;
 c.save();c.translate(Math.round(center),Math.round(feet));if(flip)c.scale(-1,1);
 sprite(c,assets.emotions,box,(box[0]-pivot[0])*s,(box[1]-pivot[1])*s,box[2]*s,box[3]*s);c.restore();
}
export const traversalFrames=[
 {box:[14,14,394,298],pivot:[212,305]},
 {box:[422,14,387,291],pivot:[609,298]},
 {box:[823,14,382,294],pivot:[1008,301]},
 {box:[1219,14,361,299],pivot:[1402,306]},
 {box:[14,327,264,483],pivot:[158,803]},
 {box:[292,327,266,481],pivot:[449,804]},
 {box:[572,327,273,480],pivot:[682,803]},
 {box:[859,327,264,484],pivot:[991,804]}
];
export function traversalPose(player){
 if(player.climbing)return 4+Math.floor(player.climbTime)%4;
 if(player.sneaking)return Math.abs(player.vx)>1?1+Math.floor(player.sneakTime)%2:0;
 return null;
}
export function drawTraversal(c,assets,player){
 const index=traversalPose(player);if(index===null)return false;const {box,pivot}=traversalFrames[index],s=index<4?.18:.158;
 c.save();c.translate(Math.round(player.x+player.w/2),Math.round(player.y+player.h));if(index<4&&player.dir<0)c.scale(-1,1);sprite(c,assets.traversal,box,(box[0]-pivot[0])*s,(box[1]-pivot[1])*s,box[2]*s,box[3]*s);c.restore();return true;
}
const restFrames=[
 {box:[14,14,329,310],pivot:[183,317]},
 {box:[357,14,310,232],pivot:[520,240]},
 {box:[681,14,317,222],pivot:[838,230]},
 {box:[1012,14,408,350],pivot:[1260,355]},
 {box:[14,378,331,383],pivot:[194,757]},
 {box:[359,378,396,309],pivot:[573,681]},
 {box:[769,378,391,354],pivot:[972,726]},
 {box:[1174,378,340,355],pivot:[1361,725]}
];
export function restPose(p){
 if(p.sleeping)return p.sleepTime<.6?0:1+Math.floor((p.sleepTime-.6)/1.4)%2;
 if(p.slipping||p.pulled&&p.grounded)return 4+Math.floor((p.slideTime||0)*8)%3;
 return null;
}
export function drawRest(c,assets,p){
 const index=restPose(p);if(index===null)return false;const {box,pivot}=restFrames[index],s=.184;
 c.save();c.translate(Math.round(p.x+p.w/2),Math.round(p.y+p.h));if(p.dir<0)c.scale(-1,1);
 sprite(c,assets.rest,box,(box[0]-pivot[0])*s,(box[1]-pivot[1])*s,box[2]*s,box[3]*s);c.restore();return true;
}
// assets/uma-moods.png, 4×2: low swat (wind-up, strike), hit, hiss, frightened fall, dragged by glue, dash, joy.
export const moodFrames=[
 {box:[14,14,330,281],pivot:[181,295]},
 {box:[358,14,343,252],pivot:[524,265]},
 {box:[715,14,323,252],pivot:[874,265]},
 {box:[1052,14,328,309],pivot:[1189,322]},
 {box:[14,337,290,338],pivot:[159,639]},
 {box:[318,337,361,258],pivot:[512,594]},
 {box:[693,337,377,146],pivot:[904,480]},
 {box:[1084,337,266,320],pivot:[1219,656]}
];
export const MOOD={lowWindup:0,lowStrike:1,hurt:2,hiss:3,fall:4,dragged:5,dash:6,joy:7};
const still=p=>p.grounded&&Math.abs(p.vx)<1&&p.attack===0;
// Which mood (if any) replaces the ordinary sprite this frame.
export function moodPose(p,g={}){
 if(g.swallow)return null;
 if(p.attack>0&&p.lowSwat)return p.attack>.12?MOOD.lowWindup:MOOD.lowStrike;
 if(p.dash>0)return MOOD.dash;
 if(g.tether&&p.pulled&&!p.echoPulled)return MOOD.dragged;
 if(!p.grounded&&!p.climbing&&p.vy>0&&p.y-(p.peakY??p.y)>150)return MOOD.fall;
 if(p.joyTime>0&&still(p)&&!p.sneaking)return MOOD.joy;
 if(p.frightTime>0&&still(p)&&!p.sneaking)return MOOD.hiss;
 return null;
}
export function drawMood(c,assets,frame,center,feet,flip=false,s=.18){
 const {box,pivot}=moodFrames[frame];if(!assets.moods)return false;
 c.save();c.translate(Math.round(center),Math.round(feet));if(flip)c.scale(-1,1);
 sprite(c,assets.moods,box,(box[0]-pivot[0])*s,(box[1]-pivot[1])*s,box[2]*s,box[3]*s);c.restore();return true;
}
// assets/uma-run8.png, 4×2 cells of 444×264 on one ground line. The cycle is a rotary gallop: front paws plant under
// the chest, rear legs swing forward, gathered flight, rear push-off, stretched flight, front landing. Cells 0 and 7
// (all four paws planted wide apart) are left out — they made Uma stall in a stretch. Each cell is registered on
// the eye so the head glides forward instead of rocking back and forth, and the rate keeps planted paws from
// skating: at 155 px/s a paw has to travel back ~16 px per frame, which is what the art gives at 10 fps.
export const RUN_CELL=[444,264],RUN_ORDER=[1,2,3,4,5,6],RUN_FPS=10;
const RUN_EYE=[351,338,334,342,344,348,343,346],RUN_FEET=258,EYE_AHEAD=49;
export function runFrame(time){return RUN_ORDER[Math.floor(time*RUN_FPS)%RUN_ORDER.length];}
export function drawRun(c,assets,frame,center,feet,flip=false,scale=1){
 const [w,h]=RUN_CELL,box=[(frame%4)*w,Math.floor(frame/4)*h,w,h],s=.272*scale,px=RUN_EYE[frame]-EYE_AHEAD;
 c.save();c.translate(Math.round(center),Math.round(feet));if(flip)c.scale(-1,1);
 sprite(c,assets.umaRun8,box,-px*s,-RUN_FEET*s,w*s,h*s);c.restore();
}
