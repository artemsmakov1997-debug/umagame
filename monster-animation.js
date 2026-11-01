// Source rectangles and stable body pivots. Attack reach never shrinks the torso.
export const motion={
 infonoise:{asset:'noiseMotion',width:500,height:355,frames:[
  {box:[14,153,481,288],pivot:[258,437]},
  {box:[526,161,495,280],pivot:[772,437]},
  {box:[1044,160,483,281],pivot:[1313,437]},
  {box:[14,566,466,362],pivot:[250,924]},
  {box:[486,664,584,264],pivot:[711,924]},
  {box:[1110,673,414,255],pivot:[1344,924]}
 ]},
 headline:{asset:'monsterMotion',width:320,height:270,frames:[
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
 source:{asset:'monsterMotion',width:330,height:275,frames:[
  {box:[12,956,275,254],pivot:[155,1208]},
  {box:[332,956,284,254],pivot:[474,1208]},
  {box:[624,944,270,266],pivot:[758,1208]},
  {box:[893,944,353,266],pivot:[1060,1208]}
 ]}
};
export function monsterFrame(id,time,actor={}){
 const state=actor.state||'patrol',step=Math.floor((actor.walkTime??time)*7)%2;
 if(id==='infonoise')return actor.attackFlash>0?4:state==='windup'?3:state==='recover'?5:actor.speed===0?0:1+step;
 if(id==='source')return state==='windup'?2:state==='casting'?3:Math.floor(time*3)%2;
 if(id==='clickbait')return state==='snap'||actor.attackFlash>0?3:state==='windup'?2:step;
 return state==='blast'||state==='alarm'?3:state==='windup'?2:actor.speed===0?0:step;
}
export function previewActor(time){
 const phase=((time%8)+8)%8;
 return {state:phase<3.2?'patrol':phase<4.3?'windup':phase<5.1?'casting':'recover',walkTime:time,moving:phase<3.2,noticeTime:phase>6&&phase<6.5?.2:0,hurtTime:phase>7&&phase<7.3?.2:0};
}
const rows={infonoise:[50,292],clickbait:[320,568],headline:[590,810],panicker:[820,1072],source:[1080,1374]};
export function monsterReaction(id,time,actor={}){
 const kind=actor.hurtTime>0||actor.dead?'hit':actor.noticeTime>0?'notice':actor.moving&&actor.state==='patrol'?'run':null;
 if(!kind)return null;
 const column=kind==='hit'?3:kind==='notice'?2:Math.floor((actor.walkTime??time)*10)%2;
 const [top,bottom]=rows[id],cellLeft=Math.round(column*280.5),left=column===3?854:cellLeft,right=column===2?854:Math.round((column+1)*280.5);
 return {kind,asset:'reactions',width:280.5,height:bottom-top,box:[left,top,right-left,bottom-top],pivot:[cellLeft+140.25,bottom-2]};
}
