export const WIDTH=768,HEIGHT=480,MAX_HEALTH=4,START_LIVES=3,MAX_LIVES=3,WAKE_DURATION=5.6,ARENA_WIDTH=1536;
export const chapters=[
 {id:'newsroom',name:'РЕДАКЦИЯ',room:1,arena:2,monsters:['fakenews','copier','censor'],boss:'spreader'},
 {id:'roofs',name:'КРЫШИ',room:3,arena:4,monsters:['informant','inflator','panicker'],boss:'agitator'},
 {id:'studio',name:'СТУДИЯ',room:5,arena:6,monsters:['injection','cutter','splicer'],boss:'manipulator'},
 {id:'dimension',name:'ИЗМЕРЕНИЕ',room:7,arena:8,monsters:['echo','clickbait','static'],boss:'infoshum'}
];
const definitions=[
 {name:'ТИХАЯ КОМНАТА',theme:'cozy',chapter:0,tutorial:true,width:WIDTH},
 {name:'РЕДАКЦИЯ',theme:'newsroom',chapter:1,width:WIDTH*3},
 {name:'ПРОЛЁТ РАСПРОСТРАНИТЕЛЯ',theme:'newsroom',chapter:1,arena:true,boss:'spreader',width:864},
 {name:'КРЫШИ',theme:'roofs',chapter:2,width:WIDTH*3},
 {name:'МАЧТА АГИТАТОРА',theme:'roofs',chapter:2,arena:true,boss:'agitator',width:ARENA_WIDTH},
 {name:'СТУДИЯ',theme:'studio',chapter:3,width:WIDTH*3},
 {name:'ПУЛЬТ МАНИПУЛЯТОРА',theme:'studio',chapter:3,arena:true,boss:'manipulator',width:ARENA_WIDTH},
 {name:'ИЗМЕРЕНИЕ',theme:'noise',chapter:4,width:WIDTH*3},
 {name:'СЕРДЦЕ ИНФОШУМА',theme:'noise',chapter:4,arena:true,boss:'infoshum',width:ARENA_WIDTH}
];
// Keep later chapters at their existing world coordinates; the compact arena uses its original reserved slot.
let cursor=0;
export const rooms=definitions.map((r,index)=>{const room={...r,index,x:cursor,end:cursor+r.width};cursor+=index===2?ARENA_WIDTH:r.width;return room;});
export const LAST_ROOM=rooms.length-1,FINAL_X=rooms[LAST_ROOM].x,WORLD=cursor,PORTAL_ROOM=7,PORTAL_X=rooms[PORTAL_ROOM].end-96;
export function roomAt(x){return rooms.find(r=>x>=r.x&&x<r.end)?.index??(x<0?0:LAST_ROOM);}
export const layouts=[];
layouts[0]=[[0,305,208],[266,365,185],[542,245,226],[0,445,248],[266,445,355],[0,474,768],[640,365,128],[0,305,75],[414,245,192]];
// Newsroom: one readable left-to-right route through three blocks.
// Редакционный зал (0-768) -> Печатный цех (768-1536) -> Серверная (1536-2304).
// Each block ends at its signal node (У1/У2/У3); optional upper shelves hold rewards.
// Steps stay within ~95 px up and ~60 px across, so every main-route move is an ordinary jump.
layouts[1]=[
 [0,474,770],     // 0  floor, editorial hall (spawn)
 [190,410,140],   // 1  first desk step
 [300,350,210],   // 2  long desk run
 [60,300,190],    // 3  office desks (optional left loop)
 [0,205,140],     // 4  archive cabinet top (optional)
 [440,255,150],   // 5  upper shelf with a life cache
 [560,420,150],   // 6  У1 deck
 [690,362,90],    // 7  step into the print shop
 [770,300,220],   // 8  print shop entry gantry
 [1000,340,110],  // 9  paper-stack dip
 [1120,290,190],  // 10 press deck (press controller)
 [1320,345,120],  // 11 step down from the press
 [1430,420,190],  // 12 У2 deck at the server-room threshold
 [880,430,380],   // 13 conveyor under the press (lower alternative)
 [1020,250,80],   // 14 paper lift
 [880,180,130],   // 15 gantry above the conveyor (optional)
 [1630,380,160],  // 16 first server cabinets
 [1810,310,130],  // 17 rack top (server controller)
 [1960,400,140],  // 18 У3 deck
 [2110,330,194],  // 19 exit deck towards the Spreader
 [1560,290,130],  // 20 upper cable tray (optional)
 [1720,215,150],  // 21 upper cable tray with a life cache
 [1910,170,140],  // 22 top rack, drops onto the exit deck
 [768,474,770],   // 23 floor, print shop
 [1536,474,768]   // 24 floor, server room
];
layouts[3]=[
 [0,330,230],[290,290,208],[560,264,240],[0,424,252],[312,414,310],[0,474,240],[300,474,488],[0,194,112],[460,184,166],[150,250,132],
 [810,312,218],[1090,268,224],[1370,300,220],[790,414,264],[1100,414,270],[784,474,490],[1330,474,254],[930,202,154],[1200,164,174],
 [1618,298,218],[1894,266,218],[2164,244,140],[1558,412,280],[1900,414,270],[1560,474,744],[1750,190,170],[2020,156,166]
];
layouts[5]=[
 [0,303,224],[285,280,205],[560,250,240],[0,400,244],[301,412,324],[0,474,240],[300,474,490],[0,168,110],[602,230,166],[145,234,130],[338,252,150],[525,84,170],
 [810,300,214],[1090,266,206],[1356,302,230],[800,412,252],[1100,412,276],[790,474,490],[1334,474,250],[920,190,184],[1210,158,170],
 [1610,310,224],[1894,274,204],[2160,244,144],[1568,412,278],[1900,412,270],[1560,474,744],[1738,204,184],[2024,156,170],[1782,322,145]
];
layouts[7]=[
 [0,360,228],[290,292,216],[558,252,242],[0,450,246],[302,418,308],[0,474,232],[304,474,486],[0,222,112],[452,184,170],[150,276,132],
 [814,308,224],[1090,256,220],[1372,298,218],[800,414,260],[1100,414,282],[792,474,494],[1338,474,254],[930,196,170],[1210,154,178],
 [1622,306,218],[1898,264,210],[2160,244,144],[1572,414,270],[1900,414,274],[1560,474,744],[1752,198,170],[2024,150,176]
];
const arenaBase=[
 [0,420,236],[296,346,232],[616,296,246],[914,374,236],[1256,314,280],[0,474,390],[470,474,320],[870,474,310],[1244,474,292],
 [120,230,170],[356,166,180],[634,124,224],[964,208,196],[1220,146,230],[20,328,140],[504,244,140],[838,290,100],[1138,260,124]
];
// Each boss now has its own route: press machinery, exposed rooftops,
// unstable studio scenery, and a fractured digital arena.
const arenaOffsets={
 2:{1:[-14,-14],3:[12,-14],4:[-12,-14],10:[8,8],12:[-10,6]},
 4:{1:[-10,-28],2:[0,-20],4:[-15,-24],10:[-6,-24],13:[0,-28]},
 6:{1:[-10,8],3:[12,-16],4:[-8,-4],10:[8,-16],11:[10,12],13:[-14,6],16:[0,-10]},
 8:{1:[-16,-18],2:[-12,2],3:[16,-18],4:[-12,-20],10:[-8,-26],12:[-10,6],13:[10,-14],16:[12,-8]}
};
for(const index of [2,4,6,8])layouts[index]=arenaBase.map(([x,y,w],i)=>{
 const [dx,dy]=arenaOffsets[index][i]||[0,0];return[x+dx,y+dy,w];
});
// Reference arena: one continuous floor, six ascending decks and two side shelves.
layouts[2]=[[0,416,864],[136,346,102],[208,306,100],[278,272,160],[592,154,250],[402,218,120],[472,182,138],[64,262,55]];
// Three permanent camera docks and a reversible holographic chase route.
layouts[6]=[[0,422,210],[550,220,210],[1160,198,230],[70,220,180],[520,422,375],[1320,422,216],[195,352,125],[350,284,125],[240,224,145],[780,280,140],[955,226,140],[1010,348,140],[1190,360,125],[430,357,125],[700,350,125],[850,410,125],[1410,300,126],[20,320,125]];
// The last boss uses a readable continuous floor and three reachable CRT stations.
layouts[8]=[
 [0,474,1536],[80,386,322],[609,338,324],[1107,386,323],
 [405,413,170],[947,413,170],[160,335,160],[685,280,175],
 [1190,335,160],[469,288,147],[970,288,150],[241,440,170],
 [686,440,160],[1330,300,138],[0,426,125],[1410,426,126],
 [396,354,103],[1032,354,98]
];
// Additional side routes: a paper lift, fire escape, stage wagon and drifting islands.
for(const [room,extra] of [[3,[[760,355,120],[1500,350,110]]],[5,[[760,350,130],[1510,350,130]]],[7,[[790,225,140],[1515,235,130]]]])layouts[room].push(...extra);
// Exposed roof spans replace the broad safety floor; upper routes remain connected.
for(const [i,shape]of Object.entries({3:[0,424,145],4:[350,414,140],5:[0,474,130],6:[330,474,130],13:[840,414,140],14:[1160,414,145],15:[820,474,120],16:[1380,474,120],22:[1610,412,145],23:[1940,414,135],24:[1640,474,125]}))layouts[3][Number(i)]=shape;
const motions={
 '3:1':{axis:'x',amplitude:24,period:4.4},'3:10':{axis:'y',amplitude:22,period:4.8},'3:19':{axis:'x',amplitude:26,period:4.7},'3:6':{axis:'x',amplitude:35,period:3.8},'3:14':{axis:'y',amplitude:20,period:4.2},
 '1:14':{axis:'y',amplitude:40,period:6},'3:27':{axis:'x',amplitude:45,period:5.7},'3:28':{axis:'y',amplitude:44,period:6.2},'5:30':{axis:'x',amplitude:55,period:6},'5:31':{axis:'y',amplitude:50,period:6},'7:27':{axis:'y',amplitude:28,period:6},'7:28':{axis:'x',amplitude:42,period:7},
 '5:1':{axis:'x',amplitude:68,period:6.2},'5:10':{axis:'y',amplitude:94,period:5.4},'5:13':{axis:'x',amplitude:62,period:5.8},'5:29':{axis:'y',amplitude:86,period:5.2},
 '6:1':{axis:'x',amplitude:46,period:5.6},'6:3':{axis:'y',amplitude:46,period:6},'6:10':{axis:'y',amplitude:30,period:5.8},
 '4:10':{axis:'y',amplitude:30,period:6.4},'7:13':{axis:'x',amplitude:38,period:7.2},
 '8:13':{axis:'y',amplitude:26,period:5.6}
};
export const platforms=rooms.flatMap(r=>layouts[r.index].map(([x,y,w],index)=>({id:r.index+':'+index,x:x+r.x,y,w,room:r.index,index,fragile:r.index===3&&[3,13,22].includes(index),cuttable:(r.theme==='studio'&&[1,4,13,16,22,25].includes(index))||(r.index===8&&[9,12,13,15].includes(index)),belt:r.index===1&&index===13?20:0,studioPlatform:r.index===6&&[6,7,8,9,10,11,12,13,14,15,16,17].includes(index),motion:r.index===6?null:motions[r.index+':'+index]||null})));
export const ladders=rooms.flatMap(r=>{
 if(r.tutorial)return [{x:430,y:245,w:31,h:200,room:0}];
 if(r.arena)return [];
 if(r.index===1)return [[740,7],[1270,10],[2140,19]].map(([x,index])=>{const s=platforms.find(p=>p.room===1&&p.index===index);return{x:r.x+x,y:s.y,w:31,h:474-s.y,room:1};});
 return [r.x+730,r.x+1498,r.end-50].map((x,i)=>{const s=platforms.find(p=>p.room===r.index&&p.index===[2,12,21][i]);return{x,y:s.y,w:31,h:474-s.y,room:r.index};});
});
export const ladder=ladders[0];
export const spawns=rooms.map(r=>({x:r.x+(r.tutorial?78:r.arena?74:45),y:layouts[r.index][0][1]-48}));
export const enemyTypes=['fakenews','clickbait','inflator','informant','panicker','censor','copier','cutter','splicer','injection','echo','static'];
export function enemy(type,room,x,platformIndex,extra={}){
 if(type==='montager')type='cutter';
 if(!enemyTypes.includes(type))throw new Error('Unknown enemy type: '+type);
 const s=platforms.find(p=>p.room===room&&p.index===platformIndex);if(!s)throw new Error('Unknown enemy platform');
 const hp=['fakenews','injection'].includes(type)?1:['inflator','informant','copier','splicer'].includes(type)?3:2;
 const r=rooms[room],flying=['echo','static'].includes(type);
 const actor={id:type+'-'+room+'-'+x+'-'+platformIndex,type,room,platformIndex,x:r.x+x,y:s.y-(flying?100:29),w:flying?40:48,h:flying?38:29,origin:s.x+12,end:s.x+s.w-60,
 dir:-1,speed:{fakenews:38,clickbait:30,inflator:14,informant:25,panicker:16,censor:20,copier:10,cutter:13,splicer:12,injection:42,echo:76,static:105}[type],hp,maxHp:hp,state:type==='clickbait'?'lure':'patrol',timer:1.3,
 active:false,trigger:Math.max(55,x-250),spawnTime:0,inv:0,lastSwing:-1,dead:false,deathTime:0,hurtTime:0,noticeTime:0,noticed:false,revealed:false,revealTime:0,moving:false,alert:0,pressureTime:0,shieldBroken:0,blastHit:false,attackFlash:0,walkTime:0,vy:0,jumpPhase:null,jumpCooldown:1.2,teleport:null,teleportCooldown:1.6,phased:false,flying,alarmCooldown:0,warpCooldown:0,...extra};
 const kinds={fakenews:platformIndex%3?'papers':'bin',informant:'receiver',injection:'printer',static:'screen',echo:'rift',copier:'printer',censor:'printer',cutter:'reel',splicer:'reel',inflator:'receiver',panicker:'receiver'};
 if(type!=='clickbait')actor.source={kind:actor.copyOwnerId?'print':actor.portalMinion?'portal':kinds[type],platformIndex,localX:Math.max(24,Math.min(s.w-24,actor.x+actor.w/2-s.x)),transient:!!(actor.copyOwnerId||actor.portalMinion||actor.bossOwnerId)};
 actor.arrivalDuration=actor.spawnTime||.55;return actor;
}
export function createEnemies(){const all=[
 enemy('fakenews',1,150,0,{trigger:90}),enemy('fakenews',1,400,2),enemy('copier',1,920,8,{trigger:640,scanIndex:8,scanStart:18,scanW:145}),
 enemy('fakenews',1,1180,10),enemy('copier',1,1470,12,{scanIndex:12,scanStart:12,scanW:120}),
 enemy('censor',1,1720,16,{trigger:1450}),enemy('fakenews',1,1600,20),enemy('censor',1,1850,24),enemy('fakenews',1,1950,22,{hp:2,maxHp:2}),
 enemy('informant',3,150,0,{trigger:100}),enemy('inflator',3,1010,17,{ledge:true,trigger:820}),enemy('panicker',3,1450,12,{trigger:1400}),enemy('informant',3,865,10),
 enemy('informant',3,1120,11),enemy('inflator',3,1245,11,{ledge:true}),enemy('panicker',3,1980,23),enemy('informant',3,1660,19),enemy('informant',3,1940,20),enemy('inflator',3,2045,20,{ledge:true}),enemy('panicker',3,2000,23),
 enemy('injection',5,160,0,{trigger:100}),enemy('injection',5,360,1),enemy('splicer',5,1430,14,{trigger:1400}),enemy('cutter',5,1110,13,{trigger:800}),enemy('injection',5,850,12),
 enemy('injection',5,1140,13),enemy('splicer',5,1190,16),enemy('cutter',5,1410,14),enemy('injection',5,1670,21),enemy('injection',5,1930,22),enemy('splicer',5,1990,25),enemy('cutter',5,2070,28),
 enemy('static',7,200,0,{trigger:130}),enemy('echo',7,1000,17,{trigger:800}),enemy('clickbait',7,1510,12,{trigger:1400}),enemy('static',7,870,10),enemy('static',7,1150,11),
 enemy('echo',7,1250,18),enemy('clickbait',7,1980,20),enemy('static',7,1650,19),enemy('static',7,1940,20),enemy('echo',7,2060,26),enemy('clickbait',7,2200,21)
 ];
 const kept={1:[150,400,920,1180,1470,1720,1600,1850,1950],3:[150,1010,1450,865,1660,2045],5:[160,1430,1110,850,1670,1990,2070],7:[200,1000,1510,870,1650,2060,2200]};
 return all.filter(e=>kept[e.room].includes(Math.round(e.x-rooms[e.room].x)));
}
export function createFish(){return rooms.flatMap(r=>{
 if(r.index===2)return [];
 const points=r.tutorial?[[130,330],[290,330],[432,325],[433,285],[550,211],[665,211]]:platforms.filter(s=>s.room===r.index&&s.y<430).filter((s,i)=>i%2===0).map(s=>[s.x-r.x+s.w*.45,s.y-35]);
 return points.map(([x,y])=>({room:r.index,x:x+r.x,y,taken:false}));
});}
export function createSoup(){return rooms.filter(r=>!r.tutorial&&r.index!==2).map(r=>{const s=platforms.find(s=>s.room===r.index&&s.index===(r.arena?5:r.index===1?15:14));return{room:r.index,x:s.x+s.w*.6,y:s.y-24,taken:false};});}
const antennaPlaces=[[1,6],[1,12],[1,18],[2,4],[3,8],[3,18],[3,26],[4,13],[5,11],[5,20],[5,28],[6,13],[7,8],[7,18],[7,26],[8,10],[8,13]];
export function createRelays(){return antennaPlaces.map(([room,index],i)=>{const s=platforms.find(p=>p.room===room&&p.index===index);const kind={1:'printer',3:'broadcast',5:'edit',7:'signal'}[room]||'dish';
 const ordinal=antennaPlaces.slice(0,i).filter(([r])=>r===room).length;
 return{id:'dish-'+i,room,platformIndex:index,x:s.x+s.w/2-20,y:s.y-72,w:40,h:72,hp:[2,6].includes(room)?0:1,lastSwing:-1,breakTime:0,kind,ordinal,scripted:[2,6].includes(room)};});}
export function createLifePickups(){return [[1,5],[1,21],[2,7],[3,7],[3,22],[4,9],[5,7],[5,24],[6,3],[7,7],[7,22],[8,9]].map(([room,index],i)=>{const s=platforms.find(p=>p.room===room&&p.index===index);return{id:'life-'+i,room,platformIndex:index,x:s.x+s.w*.6,y:s.y-24,taken:false};});}
export function createNotebooks(){
 const entries=[
 {id:'paw',room:1,index:0,x:100,scenes:['arrival1','fakenews']},
 // Newsroom: exactly one diary per block, ~100 px past each block's threshold on the main route.
 {id:'copier',room:1,index:8,x:868,scenes:['copier']},{id:'censor',room:1,index:16,x:1646,scenes:['censor','spreader']},
 {id:'roofs',room:3,index:0,x:95,scenes:['arrival2','informant']},
 {id:'inflator',room:3,index:17,x:950,scenes:['inflator']},{id:'panicker',room:3,index:12,x:1390,scenes:['panicker']},
 {id:'agitator',room:3,index:12,x:1460,scenes:['agitator']},
 {id:'studio',room:5,index:0,x:95,scenes:['arrival3','injection']},{id:'splicer',room:5,index:14,x:1385,scenes:['splicer']},{id:'cutter',room:5,index:12,x:850,scenes:['cutter']},
 {id:'manipulator',room:5,index:14,x:1410,scenes:['manipulator']},
 {id:'dimension',room:7,index:0,x:95,scenes:['arrival4','static']},{id:'echo',room:7,index:10,x:845,scenes:['echo']},{id:'clickbait',room:7,index:12,x:1410,scenes:['clickbait']},{id:'infoshum',room:7,index:21,x:2195,scenes:['infoshum']},
 ...[2,4,6].map((room,i)=>({id:'record'+(i+1),room,index:room===6?2:4,x:room===2?760:room===6?1300:1400,scenes:['chapter'+(i+1)],bossRecord:true}))
 ];
 return entries.map(n=>({...n,x:rooms[n.room].x+n.x,y:platforms.find(p=>p.room===n.room&&p.index===n.index).y-23,taken:false,readyAt:n.bossRecord?Infinity:0}));
}
export function surfaceAt(x,list=platforms){const room=roomAt(x),covered=list.filter(p=>p.room===room&&x>=p.x&&x<=p.x+p.w);return covered.sort((a,b)=>a.y-b.y)[0]?.y??474;}
