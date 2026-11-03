import {sprite} from './assets.js?v=0.19.0';
export const emotionFrames=[
 {box:[48,205,331,269],pivot:[210,474]},
 {box:[449,235,324,239],pivot:[611,474]},
 {box:[800,91,346,387],pivot:[1020,478]},
 {box:[1177,108,348,370],pivot:[1351,478]},
 {box:[72,543,326,414],pivot:[207,957]},
 {box:[440,540,340,417],pivot:[601,957]},
 {box:[800,667,338,290],pivot:[967,957]},
 {box:[1160,730,361,227],pivot:[1340,957]}
];
export function wakePose(time){
 if(time<2.2)return {name:'sleep',frame:Math.floor(time*3)%2};
 if(time<3.45)return {name:'yawn',frame:time<2.8?2:3};
 return {name:'surprise',frame:time<4.2?4:5};
}
export function hurtPose(remaining){return remaining>.26?6:7;}
export function drawEmotion(c,assets,frame,center,feet,height=76,flip=false){
 const {box,pivot}=emotionFrames[frame],s=height/420;
 c.save();c.translate(Math.round(center),Math.round(feet));if(flip)c.scale(-1,1);
 sprite(c,assets.emotions,box,(box[0]-pivot[0])*s,(box[1]-pivot[1])*s,box[2]*s,box[3]*s);c.restore();
}
export const traversalFrames=[
 {box:[10,110,389,302],pivot:[205,405]},
 {box:[411,120,375,292],pivot:[592,405]},
 {box:[794,121,384,291],pivot:[980,405]},
 {box:[1197,114,338,298],pivot:[1368,405]},
 {box:[20,473,330,477],pivot:[200,943]},
 {box:[419,463,280,484],pivot:[584,943]},
 {box:[848,463,299,484],pivot:[969,943]},
 {box:[1229,469,292,481],pivot:[1375,943]}
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
 {box:[60,160,320,310],pivot:[224,463]},
 {box:[434,235,308,230],pivot:[596,459]},
 {box:[783,240,345,226],pivot:[954,460]},
 {box:[1090,120,445,350],pivot:[1360,461]},
 {box:[24,580,356,360],pivot:[218,936]},
 {box:[398,630,382,310],pivot:[604,934]},
 {box:[775,588,407,352],pivot:[986,934]},
 {box:[1180,589,340,358],pivot:[1367,939]}
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
