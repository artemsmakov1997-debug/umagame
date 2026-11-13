import {STUDIO_PIECES,studioCuttable,studioContainer,containerGlass} from './studio-map.js?v=0.21.5';
import {DIM_PIECES} from './dimension-map.js?v=0.21.5';
import {AGITATOR_LAYOUT,AGITATOR_LADDERS,AGITATOR_FISH} from './agitator-map.js?v=0.21.5';
import {ROOF_BUILDINGS,ROOF_ROPES,ROOF_AWNINGS,ROOF_PROPS,ROOF_LADDERS,roofPiece} from './roofs-map.js?v=0.21.5';
export const WIDTH=768,HEIGHT=480,MAX_HEALTH=4,START_LIVES=3,MAX_LIVES=3,WAKE_DURATION=5.6,ARENA_WIDTH=1536;
export const chapters=[
 {id:'newsroom',name:'РЕДАКЦИЯ',room:1,arena:2,monsters:['fakenews','stamp','censor'],boss:'spreader'},
 {id:'roofs',name:'КРЫШИ',room:3,arena:4,monsters:['paparazzi','inflator','sensation'],boss:'agitator'},
 {id:'studio',name:'СТУДИЯ',room:5,arena:6,monsters:['boom','spotlight','botfarm'],boss:'manipulator'},
 {id:'dimension',name:'ИЗМЕРЕНИЕ',room:7,arena:8,monsters:['echo','clickbait','static'],boss:'infoshum'}
];
const definitions=[
 {name:'ТИХАЯ КОМНАТА',theme:'cozy',chapter:0,tutorial:true,width:WIDTH*2},
 {name:'РЕДАКЦИЯ',theme:'newsroom',chapter:1,width:WIDTH*3},
 {name:'ПРОЛЁТ РАСПРОСТРАНИТЕЛЯ',theme:'newsroom',chapter:1,arena:true,boss:'spreader',width:864},
 {name:'КРЫШИ',theme:'roofs',chapter:2,width:WIDTH*3},
 {name:'МАЧТА АГИТАТОРА',theme:'roofs',chapter:2,arena:true,boss:'agitator',width:ARENA_WIDTH},
 {name:'СТУДИЯ',theme:'studio',chapter:3,width:WIDTH*3},
 {name:'ПУЛЬТ МАНИПУЛЯТОРА',theme:'studio',chapter:3,arena:true,boss:'manipulator',width:ARENA_WIDTH},
 {name:'ИЗМЕРЕНИЕ',theme:'noise',chapter:4,width:WIDTH*4},
 {name:'СЕРДЦЕ ИНФОШУМА',theme:'noise',chapter:4,arena:true,boss:'infoshum',width:ARENA_WIDTH}
];
// Keep later chapters at their existing world coordinates; the compact arena uses its original reserved slot.
let cursor=0;
export const rooms=definitions.map((r,index)=>{const room={...r,index,x:cursor,end:cursor+r.width};cursor+=index===2?ARENA_WIDTH:r.width;return room;});
export const LAST_ROOM=rooms.length-1,FINAL_X=rooms[LAST_ROOM].x,WORLD=cursor,PORTAL_ROOM=7,PORTAL_X=rooms[PORTAL_ROOM].end-96;
export function roomAt(x){return rooms.find(r=>x>=r.x&&x<r.end)?.index??(x<0?0:LAST_ROOM);}
export const layouts=[];
// Quiet room course (see tutorial.js): 0 cat bed, 1–2 floor either side of the broken boards, 3 the pit bottom, 4 the bench seat.
layouts[0]=[[0,305,208],[0,445,930],[1030,445,506],[930,474,100],[474,410,128]];
// Newsroom «Конвейер»: one newspaper conveyor runs the whole location towards Uma (right to left).
// Presses stand over the belt; a few short catwalks above are rest spots, checkpoints and caches.
// Catwalks sit 85 px above the belt (an ordinary jump), upper caches another 85 px higher.
layouts[1]=[
 [0,430,2304],    // 0 the conveyor
 [260,345,120],   // 1 rest catwalk before the first press
 [860,345,120],   // 2 catwalk, checkpoint
 [960,260,110],   // 3 upper cache (life)
 [1460,345,120],  // 4 catwalk, checkpoint (soup)
 [1880,345,90],   // 5 catwalk, checkpoint between the last two presses
 [1860,260,100]   // 6 upper cache (life)
];
// «Крыши» (roofs-map.js): buildings, then the washing line, the awning and roof props.
layouts[3]=[...ROOF_BUILDINGS.map(b=>[b.x,b.y,b.w]),...ROOF_ROPES.map(r=>[r.x,r.y,r.w]),...ROOF_AWNINGS.map(a=>[a.x,a.y,a.w]),...ROOF_PROPS.map(p=>[p.x,p.y,p.w])];
// «Студия» (studio-map.js): fixed islands, spotlight risers, lamp banks on the clapper, containers off the route.
layouts[5]=STUDIO_PIECES.map(p=>[p.x,p.y,p.w]);
layouts[7]=DIM_PIECES.map(p=>[p.x,p.y,p.w]);
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
// Spreader arena: floor, two shelter tables (crouch beneath, climb on top) and two side ledges.
layouts[2]=[[0,416,864],[150,364,200],[514,364,200],[24,285,104],[736,285,104]];
// Three permanent camera docks and a reversible holographic chase route.
layouts[6]=[[0,422,210],[550,220,210],[1160,198,230],[70,220,180],[520,422,375],[1320,422,216],[195,352,125],[350,284,125],[240,224,145],[780,280,140],[955,226,140],[1010,348,140],[1190,360,125],[430,357,125],[700,350,125],[850,410,125],[1410,300,126],[20,320,125]];
// «Мачта Агитатора» (agitator-map.js): roof, mast deck, two antenna towers, chimneys and hidden letter slots.
layouts[4]=AGITATOR_LAYOUT;
// The last boss uses a readable continuous floor and three reachable CRT stations.
layouts[8]=[
 [0,474,1536],[80,386,322],[609,338,324],[1107,386,323],
 [405,413,170],[947,413,170],[160,335,160],[685,280,175],
 [1190,335,160],[469,288,147],[970,288,150],[241,440,170],
 [686,440,160],[1330,300,138],[0,426,125],[1410,426,126],
 [396,354,103],[1032,354,98]
];
// Additional side routes: a paper lift, fire escape, stage wagon and drifting islands.
// Exposed roof spans replace the broad safety floor; upper routes remain connected.
const motions={
  '6:1':{axis:'x',amplitude:46,period:5.6},'6:3':{axis:'y',amplitude:46,period:6},'6:10':{axis:'y',amplitude:30,period:5.8},
 '4:10':{axis:'y',amplitude:30,period:6.4},
 '8:13':{axis:'y',amplitude:26,period:5.6}
};
export const platforms=rooms.flatMap(r=>layouts[r.index].map(([x,y,w],index)=>({id:r.index+':'+index,x:x+r.x,y,w,room:r.index,index,fragile:false,roof:r.index===3?roofPiece(index):null,studio:r.index===5?STUDIO_PIECES[index]:null,dim:r.index===7?DIM_PIECES[index]:null,cuttable:r.index===5?studioCuttable(index):(r.theme==='studio'&&[1,4,13,16,22,25].includes(index))||(r.index===8&&[9,12,13,15].includes(index)),belt:r.index===1&&index===0?-45:0,shelter:r.index===2&&[1,2].includes(index)?y+16:r.index===0&&index===4?y+11:r.index===5?STUDIO_PIECES[index]?.shelter??null:null,studioPlatform:r.index===6&&[6,7,8,9,10,11,12,13,14,15,16,17].includes(index),motion:[4,6].includes(r.index)?null:motions[r.index+':'+index]||null})));
export const ladders=rooms.flatMap(r=>{
 if(r.tutorial)return [];
 if(r.index===4)return AGITATOR_LADDERS.map(l=>({...l,x:r.x+l.x,room:4}));
 if(r.arena)return [];
 if(r.index===1)return [];
 if(r.index===5||r.index===7)return [];
 if(r.index===3)return ROOF_LADDERS.map(l=>({x:r.x+l.x,y:l.top,w:31,h:l.bottom-l.top,room:3}));
 return [r.x+730,r.x+1498,r.end-50].map((x,i)=>{const s=platforms.find(p=>p.room===r.index&&p.index===[2,12,21][i]);return{x,y:s.y,w:31,h:474-s.y,room:r.index};});
});
export const ladder=ladders[0];
export const spawns=rooms.map(r=>({x:r.x+(r.tutorial?78:r.arena?74:45),y:layouts[r.index][0][1]-48}));
export const enemyTypes=['fakenews','clickbait','inflator','informant','paparazzi','spotlight','boom','panicker','stamp','copier','cutter','splicer','injection','echo','static','botfarm','bot'];
export function enemy(type,room,x,platformIndex,extra={}){
 if(type==='montager')type='cutter';
 if(!enemyTypes.includes(type))throw new Error('Unknown enemy type: '+type);
 const s=platforms.find(p=>p.room===room&&p.index===platformIndex);if(!s)throw new Error('Unknown enemy platform');
 const hp=['fakenews','injection','bot'].includes(type)?1:['inflator','informant','copier','splicer','botfarm','echo','spotlight','boom'].includes(type)?3:2;
 const r=rooms[room],flying=['echo','static'].includes(type);
 const actor={id:type+'-'+room+'-'+x+'-'+platformIndex,type,room,platformIndex,x:r.x+x,y:s.y-(flying?100:29),w:flying?40:48,h:flying?38:29,origin:s.x+12,end:s.x+s.w-60,
 dir:-1,speed:{fakenews:38,clickbait:30,inflator:14,informant:25,paparazzi:0,spotlight:0,boom:0,panicker:16,stamp:20,copier:10,cutter:13,splicer:12,injection:42,echo:76,static:105,botfarm:0,bot:78}[type],hp,maxHp:hp,state:type==='clickbait'?'lure':'patrol',timer:1.3,
 active:false,trigger:Math.max(55,x-250),spawnTime:0,inv:0,lastSwing:-1,dead:false,deathTime:0,hurtTime:0,noticeTime:0,noticed:false,revealed:false,revealTime:0,moving:false,alert:0,pressureTime:0,shieldBroken:0,blastHit:false,attackFlash:0,walkTime:0,vy:0,jumpPhase:null,jumpCooldown:1.2,teleport:null,teleportCooldown:1.6,phased:false,flying,alarmCooldown:0,warpCooldown:0,...extra};
 if(type==='echo'){actor.w=30;actor.h=40;actor.y=s.y-actor.h;actor.pose='stand';}
 // The studio's Ботоферма is a huge machine at the end of the location.
 if(type==='botfarm'){const big=room===5;actor.w=big?84:40;actor.h=big?140:68;actor.y=s.y-actor.h;actor.origin=actor.end=actor.x;}
 if(type==='paparazzi'){actor.w=44;actor.h=52;actor.y=s.y-actor.h;actor.origin=actor.end=actor.x;}
 if(type==='boom'){actor.w=40;actor.h=50;actor.y=s.y-actor.h;actor.origin=actor.end=actor.x;}
 // The Прожектор hangs from the ceiling truss above its platform.
 if(type==='spotlight'){actor.w=60;actor.h=62;actor.y=8;actor.origin=rooms[room].x+40;actor.end=rooms[room].end-40-actor.w;actor.beamX=actor.x+actor.w/2;delete actor.source;actor.arrivalDuration=.05;}
 if(room===5&&studioContainer(platformIndex))seatInContainer(actor,s);
 if(type==='inflator'&&room===3){actor.w=74;actor.h=56;actor.y=(extra.mountY??s.y)-actor.h;actor.origin=actor.end=actor.x;actor.speed=0;actor.hp=actor.maxHp=99;}
 const kinds={botfarm:'printer',fakenews:platformIndex%3?'papers':'bin',informant:'receiver',paparazzi:'receiver',injection:'printer',static:'screen',echo:'rift',copier:'printer',stamp:'printer',cutter:'reel',splicer:'reel',inflator:'receiver',panicker:'receiver'};
 // In the newsroom every monster tears out of a newspaper riding the conveyor.
 if(type!=='clickbait')actor.source={kind:actor.copyOwnerId?'print':actor.portalMinion?'portal':room===1?'belt':kinds[type],platformIndex,localX:Math.max(24,Math.min(s.w-24,actor.x+actor.w/2-s.x)),transient:!!(actor.copyOwnerId||actor.portalMinion||actor.bossOwnerId)};
 if(actor.container){delete actor.source;actor.arrivalDuration=.05;}
 // Roof machines hang on brackets and the Папарацци simply stands on its roof: no arrival source next to them.
 if(room===3&&['inflator','paparazzi'].includes(type)||['boom','spotlight'].includes(type))delete actor.source;
 // In the Dimension monsters simply appear — no televisions or torn-paper portals on the map.
 if(room===7)delete actor.source;
 actor.arrivalDuration=actor.arrivalDuration||actor.spawnTime||(room===1?.8:['echo','static'].includes(type)?.95:.55);return actor;
}
// A studio monster sits behind the glass of its container: its box is centred on the window (see studio-container-art.js).
function seatInContainer(actor,s){
 const piece=STUDIO_PIECES[s.index],glass=containerGlass(piece,s.x-piece.x);
 Object.assign(actor,{container:piece.kind,printOn:piece.print,w:48,h:29,speed:0});actor.x=glass.x+glass.w/2-actor.w/2;actor.y=glass.y+glass.h/2-actor.h/2;actor.origin=actor.end=actor.x;
}
export function createEnemies(){const all=[
 // Редакция: Фейкньюс, Цензоры (newsroom-systems.js CENSOR_SOURCES) and Штампы alternate evenly along the belt —
 // F 330 · C 540 · F 760 · C 1000 · S 1180 · F 1430 · C 1620 · F 1900 · S 2210 · F 2290. Each Штамп wakes while Uma is
 // still on the catwalk before it, so its ink rides the belt into the open stretch she has to cross on foot.
 enemy('fakenews',1,330,0,{trigger:90}),enemy('fakenews',1,760,0),
 enemy('stamp',1,1180,0,{trigger:880,timer:0}),enemy('fakenews',1,1430,0),
 enemy('fakenews',1,1900,0),enemy('stamp',1,2210,0,{trigger:1900,timer:0}),enemy('fakenews',1,2290,0,{hp:2,maxHp:2}),
 // Крыши: Нагнетатели sit on wall brackets high above the roofs, out of reach, and blow across the whole map.
 enemy('paparazzi',3,575,1,{trigger:260}),enemy('inflator',3,520,1,{dir:-1,mountY:115}),enemy('paparazzi',3,1150,3),enemy('inflator',3,1060,3,{dir:-1,mountY:112}),enemy('inflator',3,1727,10,{dir:-1,mountY:64}),enemy('paparazzi',3,2240,7),
 // Студия: a Журавль on each long truss, two Прожекторы riding the ceiling rail over the whole studio, the
 // Ботоферма caged over the door at the far end, sending its bots towards Uma from the moment she arrives.
 enemy('boom',5,715,3,{dir:-1,trigger:430}),enemy('spotlight',5,860,4,{trigger:600}),enemy('boom',5,1525,8,{dir:-1}),
 enemy('spotlight',5,1800,11),enemy('botfarm',5,1925,11,{range:2400,trigger:60}),
 // Измерение: Помеха over the feeds, Кликбейты only on the rising messages of «Лента» (five of them, on purple and
 // blue bubbles alike), an Эхо by each rift and one in «Пересылка».
 enemy('static',7,330,0,{trigger:150}),enemy('clickbait',7,290,2,{trigger:200,ride:true}),enemy('clickbait',7,430,4,{trigger:250,ride:true}),enemy('clickbait',7,470,6,{trigger:280,ride:true}),
 enemy('clickbait',7,580,8,{trigger:300,ride:true}),enemy('clickbait',7,610,9,{trigger:320,ride:true}),enemy('echo',7,760,10,{trigger:680}),enemy('static',7,1250,12,{y:220}),
 enemy('echo',7,1700,22,{trigger:1600}),enemy('static',7,1960,23,{y:220}),enemy('echo',7,2420,25,{trigger:2300}),enemy('static',7,2660,26,{y:200})
 ];
 const kept={1:[330,760,1180,1430,1900,2210,2290],3:[575,520,1150,1060,1727,2240],5:[715,860,1525,1800,1925],7:[330,290,430,470,580,610,760,1250,1700,1960,2420,2660]};
 const roster=all.filter(e=>kept[e.room].includes(+e.id.split('-')[2]));
 // Conveyor walkers patrol their own stretch of belt instead of the whole location.
 for(const e of roster)if(e.room===1&&e.platformIndex===0){e.origin=Math.max(e.origin,e.x-200);e.end=Math.min(e.end,e.x+200);}
 return roster;
}
export function createFish(){return rooms.flatMap(r=>{
 if(r.index===2)return [];
 const points=r.index===4?AGITATOR_FISH:r.tutorial?[[330,415],[538,428],[880,415],[980,380],[1110,415],[1330,415]]:platforms.filter(s=>s.room===r.index&&s.y<430).filter((s,i)=>i%2===0).map(s=>[s.x-r.x+s.w*.45,s.y-35]);
 return points.map(([x,y])=>({room:r.index,x:x+r.x,y,taken:false}));
});}
const antennaPlaces=[[2,4],[3,2],[3,5],[3,7],[5,3],[5,8],[5,11],[6,13],[8,10],[8,13]];
// Transmitters were removed from every map: the list stays empty, so gates are open and bosses unshielded.
export function createRelays(){return [];}
export function legacyRelays(){return antennaPlaces.map(([room,index],i)=>{const s=platforms.find(p=>p.room===room&&p.index===index);const kind={1:'printer',3:'broadcast',5:'edit',7:'signal'}[room]||'dish';
 const ordinal=antennaPlaces.slice(0,i).filter(([r])=>r===room).length;
 return{id:'dish-'+i,room,platformIndex:index,x:s.x+s.w/2-20,y:s.y-72,w:40,h:72,hp:room===4?3:[2,6].includes(room)?0:1,maxHp:room===4?3:1,rewardWhenOverloaded:room===4,lastSwing:-1,breakTime:0,kind,ordinal,scripted:[2,4,6].includes(room)};});}
export function createNotebooks(){
 // Yuri speaks once at the start of each location and once when a boss fight begins (no envelopes to find):
 // a location's notebook opens as soon as Uma is in it; a boss one when the fight starts (readyAt is set then).
 const entries=[
 {id:'paw',room:1,index:0,x:70,scenes:['arrival1','fakenews','stamp','censor','press']},
 {id:'spreader',room:2,index:0,x:60,scenes:['spreader'],bossStart:true},
 {id:'roofs',room:3,index:0,x:95,scenes:['arrival2','paparazzi','inflator','sensation']},
 {id:'agitator',room:4,index:0,x:60,scenes:['agitator'],bossStart:true},
 {id:'studio',room:5,index:0,x:95,scenes:['arrival3','boom','spotlight','botfarm']},
 {id:'manipulator',room:6,index:0,x:60,scenes:['manipulator'],bossStart:true},
 {id:'dimension',room:7,index:0,x:95,scenes:['arrival4','static','echo','clickbait']},
 {id:'infoshum',room:8,index:0,x:60,scenes:['infoshum'],bossStart:true},
 ...[2,4,6].map((room,i)=>({id:'record'+(i+1),room,index:room===6?2:room===4?3:4,x:room===2?760:room===6?1300:1400,scenes:['chapter'+(i+1)],bossRecord:true}))
 ];
 return entries.map(n=>({...n,x:rooms[n.room].x+n.x,y:platforms.find(p=>p.room===n.room&&p.index===n.index).y-23,taken:false,readyAt:n.bossRecord||n.bossStart?Infinity:0}));
}
export function surfaceAt(x,list=platforms){const room=roomAt(x),covered=list.filter(p=>p.room===room&&x>=p.x&&x<=p.x+p.w);return covered.sort((a,b)=>a.y-b.y)[0]?.y??474;}
