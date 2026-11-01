import {sprite} from './assets.js?v=0.7.0';
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
 if(time<1.4)return {name:'sleep',frame:Math.floor(time*3)%2};
 if(time<2.9)return {name:'yawn',frame:time<2.05?2:3};
 return {name:'surprise',frame:time<3.55?4:5};
}
export function hurtPose(remaining){return remaining>.26?6:7;}
export function drawEmotion(c,assets,frame,center,feet,height=76,flip=false){
 const {box,pivot}=emotionFrames[frame],s=height/420;
 c.save();c.translate(Math.round(center),Math.round(feet));if(flip)c.scale(-1,1);
 sprite(c,assets.emotions,box,(box[0]-pivot[0])*s,(box[1]-pivot[1])*s,box[2]*s,box[3]*s);c.restore();
}
