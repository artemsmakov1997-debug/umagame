// assets/echo-double.png, 4×2 cells of 384×512: stand, run ×2, jump; paw swipe, sneak, forming, scattered.
const FRAMES=[
 {box:[22,120,350,296],pivot:[205,409]},{box:[394,130,362,284],pivot:[590,409]},
 {box:[770,134,370,282],pivot:[958,411]},{box:[1160,115,362,304],pivot:[1342,414]},
 {box:[30,577,354,316],pivot:[205,889]},{box:[400,638,350,250],pivot:[584,883]},
 {box:[784,559,306,334],pivot:[940,889]},{box:[1152,555,362,338],pivot:[1370,889]}
];
const POSE={stand:0,air:3,swat:4,crouch:5};
export function echoFrame(e={},time=0){
 if(e.dead||e.state==='scatter'||e.hurtTime>0)return 7;
 if(e.state==='forming'||e.state==='windup'||e.noticeTime>0)return 6;
 if(e.state==='casting')return 4;
 if(e.pose==='run'||!e.pose&&e.moving)return 1+Math.floor((e.walkTime??time*1.4)*7)%2;
 return POSE[e.pose]??0;
}
// The double is ~300 px tall in its cell; `h` is its on-screen height, feet at the bottom centre of the box.
export function drawEchoDoublePortrait(c,a,x,y,w,h,time=0,flip=false,actor={}){
 const image=a.echoDouble;if(!image)return;const f=echoFrame(actor,time),{box,pivot}=FRAMES[f],k=h/300;
 const one=(dx,alpha)=>{c.save();c.globalAlpha*=alpha;c.translate(Math.round(x+w/2+dx),Math.round(y+h));if(flip)c.scale(-1,1);
  c.drawImage(image,box[0],box[1],box[2],box[3],Math.round((box[0]-pivot[0])*k),Math.round((box[1]-pivot[1])*k),Math.round(box[2]*k),Math.round(box[3]*k));c.restore();};
 // Afterimages trail behind a moving double: it is an echo of motion.
 if(actor.chase&&f>=1&&f<=4){const back=flip?1:-1;one(back*9,.22);one(back*4,.4);}
 one(0,actor.forming?.55+.45*Math.abs(Math.sin(time*18)):.92);
}
