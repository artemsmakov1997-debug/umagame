export const WIDTH=768, HEIGHT=480, MAX_HEALTH=4, START_LIVES=3, WAKE_DURATION=5.6;
export const rooms=[
 {name:'ТИХАЯ КОМНАТА',theme:'cozy',objective:'ОСВОЙ ДВИЖЕНИЕ',tutorial:true},
 {name:'РЕДАКЦИЯ',theme:'newsroom',objective:'ПРОВЕРЬ ПЕРВЫЙ КОМПЬЮТЕР'},
 {name:'НОЧНАЯ УЛИЦА',theme:'street',objective:'ПРОСЛЕДИ ПУТЬ ПОМЕХ'},
 {name:'ТИПОГРАФИЯ',theme:'press',objective:'ПРОВЕРЬ ЖУРНАЛ ЗАПУСКА'},
 {name:'АППАРАТНАЯ',theme:'dispatch',objective:'НАЙДИ МАРШРУТ РАССЫЛКИ'},
 {name:'ТЕЛЕСТУДИЯ',theme:'studio',objective:'ОСТАНОВИ ТРЕВОЖНЫЙ ЭФИР'},
 {name:'БАШНЯ ЭФИРА',theme:'tower',objective:'ОСТАНОВИ ИНФОШУМ'}
].map((r,i)=>({...r,x:i*WIDTH}));
export const WORLD=WIDTH*rooms.length,LAST_ROOM=rooms.length-1,FINAL_X=LAST_ROOM*WIDTH;
const desks=[[0,303,204],[301,300,188],[517,275,251],[0,400,244],[301,412,324],[0,474,230],[300,474,468],[0,169,75],[473,204,134]];
export const layouts=[
 [[0,305,208],[266,365,185],[542,245,226],[0,445,248],[266,445,355],[0,474,768],[640,365,128],[0,305,75],[414,245,192]],
 desks,
 [[0,330,220],[285,290,205],[540,265,228],[0,424,250],[310,408,315],[0,474,230],[300,474,468],[0,195,100],[470,185,135]],
 [[0,310,228],[300,290,190],[535,275,233],[0,403,244],[301,412,324],[0,474,230],[300,474,468],[0,182,90],[473,204,134]],
 [[0,322,225],[285,300,215],[540,275,228],[0,419,250],[300,419,330],[0,474,230],[300,474,468],[0,185,90],[460,204,147]],
 [[0,303,220],[285,280,205],[540,250,228],[0,400,244],[301,412,324],[0,474,230],[300,474,468],[0,169,90],[473,184,134]],desks
];
export const platforms=rooms.flatMap((r,room)=>layouts[room].map(([x,y,w],index)=>({x:x+r.x,y,w,room,index,belt:room===3&&(index===1||index===4)?(index===1?20:-20):0})));
export const ladders=rooms.map((r,i)=>i===0?{x:430,y:245,w:31,h:200,room:0}:{x:r.x+718,y:layouts[i][2][1],w:31,h:474-layouts[i][2][1],room:i});
export const ladder=ladders[0];
export const spawns=rooms.map((r,i)=>({x:r.x+(i===0?78:45),y:layouts[i][0][1]-48}));
export function enemy(type,room,x,platformIndex,extra={}){
 if(!['fakenews','clickbait','inflator','informant','panicker'].includes(type))throw new Error('Unknown enemy type: '+type);
 const s=platforms.find(p=>p.room===room&&p.index===platformIndex);if(!s)throw new Error('Unknown enemy platform');
 const hp=type==='fakenews'?1:type==='inflator'||type==='informant'?3:2;
 return {id:`${type}-${room}-${x}-${platformIndex}`,type,room,platformIndex,x:rooms[room].x+x,y:s.y-29,w:48,h:29,origin:s.x+12,end:s.x+s.w-60,
 dir:-1,speed:{fakenews:32,clickbait:30,inflator:14,informant:22,panicker:16}[type],hp,maxHp:hp,state:type==='clickbait'?'lure':'patrol',timer:1.3,
 active:false,trigger:Math.max(30,x-220),spawnTime:0,inv:0,lastSwing:-1,dead:false,deathTime:0,hurtTime:0,noticeTime:0,noticed:false,revealed:false,revealTime:0,moving:false,alert:0,pressureTime:0,shieldBroken:0,blastHit:false,attackFlash:0,walkTime:0,...extra};
}
export function createEnemies(){return [
 enemy('fakenews',1,125,0,{trigger:80}),enemy('fakenews',1,365,1,{trigger:260}),enemy('fakenews',1,594,2,{guardian:true,hp:2,maxHp:2,trigger:450}),
 enemy('clickbait',2,350,1,{trigger:145}),enemy('fakenews',2,594,2,{guardian:true,hp:2,maxHp:2,trigger:450}),
 enemy('inflator',3,365,1,{trigger:170}),enemy('fakenews',3,405,4,{trigger:340}),enemy('clickbait',3,424,1,{trigger:340}),enemy('fakenews',3,600,2,{guardian:true,hp:2,maxHp:2,trigger:470}),
 enemy('informant',4,365,1,{trigger:85,guardian:true}),enemy('fakenews',4,310,1,{trigger:270}),enemy('informant',4,600,2,{trigger:440}),
 enemy('panicker',5,125,0,{trigger:45,dir:1,speed:9}),enemy('panicker',5,360,1,{trigger:300,guardian:true}),enemy('informant',5,580,2,{trigger:450}),
 enemy('inflator',6,365,1,{trigger:100}),enemy('clickbait',6,435,4,{trigger:240}),enemy('panicker',6,345,4,{trigger:300}),enemy('informant',6,570,2,{trigger:400})
 ];}
export function createFish(){return rooms.flatMap((r,i)=>(i===0?[[130,330],[290,330],[432,325],[433,285],[550,211],[665,211]]:[[114,layouts[i][0][1]-43],[216,228],[253,207],[290,189],[327,176],[365,165],[400,159],[503,221],[181,layouts[i][3][1]-41],[375,368],[570,368]]).map(([x,y])=>({x:x+r.x,y,taken:false})));}
export function createSoup(){return [2,3,4,5,6].map(room=>({x:WIDTH*room+(room%2?179:560),y:room%2?355:366,taken:false}));}
export function surfaceAt(x){const room=Math.max(0,Math.min(LAST_ROOM,Math.floor(x/WIDTH))),local=((x%WIDTH)+WIDTH)%WIDTH;return layouts[room][local<250?0:local<510?1:2][1];}
