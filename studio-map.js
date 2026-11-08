// «Студия»: a dark sound stage where the floor is montage. Pure data, local x, y = top surface.
// Fixed islands (truss, flight case, camera dolly) are safe; between them the pits are falls.
// Everything else is a stage riser that exists — and can be seen — only while a spotlight covers it:
// Block 1 «Павильон»: one lamp swings slowly over two risers.
// Block 2 «Прожекторы»: two lamps swing together over three risers.
// Block 3 «Монтажная»: two banks of lamps (warm «дубль 1», cold «дубль 2») switch on the clapper's beat.
// Monsters: a Журавль on each long truss sweeps its boom microphone at head height (crawl under or wait);
// a Прожекторщик hangs from the ceiling over the dolly and over the takes, its red beam burns (the hanging flat
// over the dolly shields from it); the Ботоферма sits in a cage over the door at the far end and sends its
// bots hopping towards Uma. Platform indices follow this order.
export const STUDIO_PIECES=[
 {type:'fixed',kind:'truss',x:0,w:230,y:400},          // 0 start
 {type:'stage',x:285,w:96,y:386},                       // 1 under the first lamp
 {type:'stage',x:420,w:96,y:330},                       // 2
 {type:'fixed',kind:'truss',x:575,w:190,y:352},         // 3 Журавль at its right end
 {type:'fixed',kind:'dolly',x:800,w:170,y:330},         // 4 camera dolly
 {type:'stage',x:1010,w:100,y:320},                     // 5
 {type:'stage',x:1150,w:100,y:300},                     // 6
 {type:'stage',x:1290,w:100,y:318},                     // 7
 {type:'fixed',kind:'truss',x:1420,w:150,y:300},        // 8 Журавль at its right end
 {type:'take',color:'red',x:1610,w:100,y:290},          // 9
 {type:'take',color:'blue',x:1750,w:100,y:270},         // 10
 {type:'fixed',kind:'case',x:1890,w:140,y:262},         // 11
 {type:'take',color:'red',x:2050,w:100,y:244},          // 12
 {type:'take',color:'blue',x:2150,w:70,y:232},          // 13
 {type:'fixed',kind:'truss',x:2214,w:90,y:226},         // 14 the pavilion door
 // Containers (never solid, never on the route). x/w is the box, y its bottom edge.
 // A hanging set flat over the dolly: a low ceiling (crawl under it — or hop on top). It also blocks the red beam.
 {type:'fixed',kind:'flat',x:840,w:84,y:282,shelter:300},  // 15
 // The Ботоферма's cage on the wall over the door: it prints bots onto the door truss.
 {type:'container',kind:'wall',x:2186,w:110,y:166,print:14} // 16
];
export const HOLO={warn:.7,gone:1.6,back:.35};
// Spotlights hang from the ceiling truss; the lit spot sweeps along its risers' level (floor).
// The first lamp dwells over riser 1, then both, then riser 2. The two lamps of block 2 light risers 5 and 6, then 6 and 7:
// the middle riser stays lit, the outer ones take turns — "move with the light".
export const SPOTLIGHTS=[
 {x:400,mid:400,amp:62,period:6.4,phase:0,w:140,dwell:1.6,floor:386},
 {x:1130,mid:1130,amp:70,period:7.2,phase:0,w:150,dwell:1.6,floor:310},{x:1270,mid:1270,amp:70,period:7.2,phase:0,w:150,dwell:1.6,floor:310}
];
export const SPOT_MIN_OVERLAP=30;
// «Дубли»: red is live for `beat` seconds, then blue; the last `warn` seconds blink before the swap.
export const TAKES={beat:2.4,warn:.6};
// The Нарезчик may cut anything Uma walks on except the door island; containers are not surfaces at all.
export function studioCuttable(index){const p=STUDIO_PIECES[index];return !!p&&p.type!=='container'&&p.kind!=='flat'&&index!==14;}
export const studioContainer=index=>STUDIO_PIECES[index]?.type==='container';
export const STUDIO_CHECKPOINTS=[{x:45,index:0},{x:600,index:3},{x:1440,index:8},{x:1910,index:11}];
export const STUDIO_DOOR={x:2216,h:74};
export const studioSectionNames=['Павильон','Прожекторы','Монтажная'];
export function studioPiece(index){return STUDIO_PIECES[index];}

// Container art geometry (assets/studio-capsule|grate|cage.png, three states each): cell size, the body's width and bottom
// in the cell, and the glass window (centre x/y, w, h) in cell pixels. Shared by the monsters' seats and the art.
export const CONTAINER_ART={
 hang:{key:'studioCapsule',cell:[155,220],body:135,cx:77.5,bottom:178,glass:[77,111,85,58]},
 floor:{key:'studioGrate',cell:[200,100],body:200,cx:100,bottom:98,glass:[102,53,95,43]},
 wall:{key:'studioCage',cell:[170,158],body:160,cx:80,bottom:155,glass:[108,77,85,62]}
};
// World-space window of a container piece, given the room's x.
export function containerGlass(piece,x0){
 const art=CONTAINER_ART[piece.kind],k=piece.w/art.body,cx=x0+piece.x+piece.w/2,[gx,gy,gw,gh]=art.glass;
 return {x:cx+(gx-art.cx)*k-gw*k/2,y:piece.y-(art.bottom-gy)*k-gh*k/2,w:gw*k,h:gh*k,k};
}
