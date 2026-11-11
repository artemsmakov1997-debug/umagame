// Seconds within a deterministic idle cycle. Real sprite frames, not a moving still image.
export function idleFrame(time){
 const t=((time%18)+18)%18;
 if(t>=3&&t<3.14||t>=13.8&&t<13.94)return {frame:1,action:'blink'};
 if(t>=1.2&&t<1.42||t>=6&&t<6.22||t>=15.3&&t<15.52)return {frame:2,action:'lick'};
 if(t>=9&&t<12.1){
  const frames=[0,3,3,4,4,3,4,4,5,0];
  return {frame:frames[Math.min(9,Math.floor((t-9)/.31))],action:'groom'};
 }
 return {frame:0,action:'idle'};
}
// Register each pose to the same rear paw, at one source-pixel scale.
// Tight-crop height and changing ear position must never resize the whole cat.
const poses=[
 {box:[12,12,391,467],anchor:[293,479]},
 {box:[415,13,389,466],anchor:[694,479]},
 {box:[816,12,396,467],anchor:[1104,479]},
 {box:[12,493,397,465],anchor:[318,958]},
 {box:[421,493,402,465],anchor:[727,958]},
 {box:[835,492,404,466],anchor:[1144,958]}
];
export function idlePlacement(time,height=480,placement={}){
 const {frame,action}=idleFrame(time),{box,anchor}=poses[frame],tall=height>700;
 const scale=(placement.height??(tall?300:215))/474,groundX=placement.x??(tall?650:605),groundY=placement.y??(tall?height*.87:418);
 return {frame,action,box,scale,groundX,groundY,x:groundX+(box[0]-anchor[0])*scale,y:groundY+(box[1]-anchor[1])*scale,w:box[2]*scale,h:box[3]*scale};
}
