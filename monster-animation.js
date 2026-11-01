// Source rectangles and stable body pivots. Attack reach never shrinks the torso.
export const motion={
 inflator:{asset:'monsterMotion',width:320,height:270,frames:[
  {box:[30,79,263,238],pivot:[158,313]},
  {box:[347,82,252,235],pivot:[470,313]},
  {box:[626,78,252,239],pivot:[756,313]},
  {box:[882,76,362,241],pivot:[1015,313]}
 ]},
 panicker:{asset:'monsterMotion',width:300,height:280,frames:[
  {box:[30,360,260,256],pivot:[160,610]},
  {box:[346,360,259,256],pivot:[480,610]},
  {box:[640,356,270,260],pivot:[778,610]},
  {box:[930,337,313,279],pivot:[1084,610]}
 ]},
 clickbait:{asset:'monsterMotion',width:335,height:285,frames:[
  {box:[12,638,300,280],pivot:[164,912]},
  {box:[342,638,269,280],pivot:[477,912]},
  {box:[624,635,280,283],pivot:[769,912]},
  {box:[903,635,340,283],pivot:[1078,912]}
 ]},
 infoshum:{asset:'monsterMotion',width:330,height:275,frames:[
  {box:[12,956,275,254],pivot:[155,1208]},
  {box:[332,956,284,254],pivot:[474,1208]},
  {box:[624,944,270,266],pivot:[758,1208]},
  {box:[893,944,353,266],pivot:[1060,1208]}
 ]}
};
export function monsterFrame(id,time,actor={}){
 const state=actor.state||'patrol',step=Math.floor((actor.walkTime??time)*7)%2;
 if(id==='fakenews'||id==='informant')return actor.hurtTime>0||actor.dead?5:actor.noticeTime>0||state==='windup'?3:state==='lunge'||state==='casting'||actor.attackFlash>0?4:actor.moving?1+step:0;
 if(id==='infoshum')return state==='windup'?2:state==='casting'?3:Math.floor(time*3)%2;
 if(id==='clickbait')return state==='snap'||actor.attackFlash>0?3:state==='windup'?2:step;
 return state==='blast'||state==='alarm'?3:state==='windup'?2:actor.speed===0?0:step;
}
export function previewActor(time){
 const phase=((time%8)+8)%8;
 return {state:phase<3.2?'patrol':phase<4.3?'windup':phase<5.1?'casting':'recover',walkTime:time,moving:phase<3.2,noticeTime:phase>6&&phase<6.5?.2:0,hurtTime:phase>7&&phase<7.3?.2:0};
}
const rows={clickbait:[320,568],inflator:[590,810],panicker:[820,1072],infoshum:[1080,1374]};
export function monsterReaction(id,time,actor={}){
 if(!rows[id])return null;
 const kind=actor.hurtTime>0||actor.dead?'hit':actor.noticeTime>0?'notice':actor.moving&&actor.state==='patrol'?'run':null;
 if(!kind)return null;
 const column=kind==='hit'?3:kind==='notice'?2:Math.floor((actor.walkTime??time)*10)%2;
 const [top,bottom]=rows[id],cellLeft=Math.round(column*280.5),left=column===3?854:cellLeft,right=column===2?854:Math.round((column+1)*280.5);
 return {kind,asset:'reactions',width:280.5,height:bottom-top,box:[left,top,right-left,bottom-top],pivot:[cellLeft+140.25,bottom-2]};
}

const newFrames={
 fakenews:[[[8,194,250,270],[138,458]],[[278,190,240,276],[398,462]],[[535,205,238,259],[657,458]],[[782,255,218,209],[896,458]],[[1003,190,288,274],[1146,458]],[[1299,190,237,277],[1418,460]]],
 informant:[[[12,567,263,342],[140,904]],[[280,568,238,355],[399,918]],[[524,573,244,350],[654,918]],[[769,558,231,351],[878,904]],[[1000,573,282,345],[1118,913]],[[1293,563,243,351],[1416,909]]]
};
for(const [id,frames]of Object.entries(newFrames))motion[id]={asset:'newMotion',width:280,height:id==='fakenews'?310:380,frames:frames.map(([box,pivot])=>({box,pivot}))};
export const baitEmergenceFrames=[
 {box:[34,240,474,248],pivot:[265,485]},
 {box:[534,140,468,350],pivot:[759,488]},
 {box:[1026,10,500,480],pivot:[1271,488]},
 {box:[10,539,551,426],pivot:[275,963]},
 {box:[564,579,458,391],pivot:[782,968]},
 {box:[1036,532,490,438],pivot:[1279,967]}
];
export function clickbaitAppearanceFrame(actor){
 if(actor.hurtTime>0||actor.dead)return null;
 if(actor.captureTime!==undefined&&actor.captureTime!==null)return actor.captureTime<.28?3:4;
 if(actor.state==='emerge')return Math.min(2,Math.floor((actor.revealTime||0)/.16*3));
 if(actor.state==='snap')return actor.timer>.1?3:4;
 if(actor.attackFlash>.25)return 4;
 if(actor.revealed&&actor.state==='recover'&&actor.timer>1)return 5;
 return null;
}
