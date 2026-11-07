// «Измерение» (room 7) — «Первоисточник». Pure data: pieces in room-local coordinates.
// Three blocks over a void: «Лента» (rising message bubbles), «Пересылка» (envelope portals), «Разлом» (gravity rifts).
// Yuri's own messages hold; forwarded copies rise and pop. No transmitters: three optional «первоисточники» weaken Infoshum.
export const DIM_ROOM=7;
export const DIM_PIECES=[
 {type:'yuri',x:0,w:210,y:390},                       // 0 start
 // 1–9: three feed lanes of three rising copies each (their y is computed every frame).
 ...[0,1,2].flatMap(lane=>[0,1,2].map(slot=>({type:'copy',lane,slot,x:265+lane*150,w:110,y:470}))),
 {type:'yuri',x:720,w:170,y:300},                     // 10 end of the feed, first envelope
 {type:'island',x:1080,w:200,y:330},                  // 11 envelope landing: live envelope at the back, dead link in front
 {type:'island',x:1395,w:150,y:270},                  // 12 after the boost envelope
 {type:'island',x:1560,w:170,y:360},                  // 13 «Разлом» start
 {type:'island',x:1745,w:180,y:120,inverted:true},    // 14 hanging island (walked on from below, upside down)
 {type:'island',x:1985,w:140,y:100,inverted:true},    // 15 second hanging island
 {type:'island',x:2150,w:154,y:300}                   // 16 the threshold of Infoshum
];
// Rising feed: copies appear at `bottom`, rise at `speed` and pop near `top`. Neighbouring lanes are half a step apart.
export const FEED={bottom:500,top:110,speed:34,perLane:3,lanePhase:[0,.5,0],fade:.86,pop:.965};
// Envelope portals. `in` envelopes swallow Uma; she leaves the paired `out` envelope with a launch:
// speed = minSpeed + (entry speed above a walk) × gain, at `angle` degrees above the horizontal, towards `dir`.
export const ENVELOPES=[
 {id:'e1',role:'in',x:836,y:300,pair:'o1',tag:3},
 {id:'o1',role:'out',x:990,y:262,dir:1,angle:30,minSpeed:320,gain:0},
 {id:'e2',role:'in',x:1084,y:330,pair:'o2'},
 {id:'o2',role:'out',x:1290,y:368,dir:1,angle:60,minSpeed:560,gain:.35,tag:1},
 {id:'d1',role:'dead',x:1222,y:330}
];
export const ENVELOPE={w:56,h:68,launch:1.6,steer:40};
// Gravity rifts: crossing one turns the world upside down (or back).
export const RIFTS=[{x:1758,y:110,h:330},{x:2152,y:50,h:290}];
// «Первоисточники»: Yuri's original messages, hidden off the obvious path.
export const ORIGINALS=[
 {id:'source-1',x:466,y:58},    // above the feed: ride a copy almost to the top and jump
 {id:'source-2',x:1496,y:165},  // at the top of the boost arc — only a dash into the envelope flies that high
 {id:'source-3',x:2046,y:248}   // under the second hanging island: an upside-down jump
];
export const DIM_CHECKPOINTS=[{x:40,index:0},{x:740,index:10},{x:1100,index:11},{x:1580,index:13}];
export const dimensionSectionNames=['Лента','Пересылка','Разлом'];
export const isSafeDimPiece=p=>!!p&&(p.type==='yuri'||p.type==='island'&&!p.inverted);
