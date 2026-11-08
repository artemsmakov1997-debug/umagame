// «Крыши»: an ascent over rooftops to the Agitator's mast. Pure data, local x, y = top surface.
// Buildings are solid blocks (their walls stop Uma below the roof line); the street between them is a fall.
// Three blocks of trampolines over the alleys; Нагнетатели blow across the whole map, Сенсации fly to its edge.
// Platform indices follow this order: buildings, then the rope, the awning and the roof props.
export const ROOF_BUILDINGS=[
 {x:0,w:250,y:420,style:'brick'},                 // 0 A0 start roof
 {x:400,w:210,y:300,style:'tin',wall:405},        // 1 A1 — reached from the alley trampoline
 {x:700,w:190,y:250,style:'brick'},               // 2 A2
 {x:1080,w:170,y:300,style:'tin'},                // 3 B0 — reached from the second trampoline
 {x:1330,w:110,y:250,style:'brick'},              // 4 B1 (a Нагнетатель blows over the trampoline chain)
 {x:1760,w:160,y:230,style:'brick',wall:1765},    // 5 C0 behind the trampoline chain
 {x:1990,w:110,y:190,style:'tin'},                // 6 C1
 {x:2160,w:144,y:150,style:'brick',wall:2165}     // 7 C2 the mast roof and the arena door
];
export const ROOF_ROPES=[];
// Trampolines (striped awnings and tarps) hang in the alleys between the roofs: a bounce reaches the next roof,
// a miss drops Uma into the street. Holding ↓ lets her stand on one.
export const ROOF_AWNINGS=[{x:285,w:85,y:430},{x:940,w:85,y:430},{x:1480,w:80,y:440},{x:1630,w:80,y:410}]; // 8–11
export const ROOF_PROPS=[
 {kind:'chimney',x:470,w:30,y:252,base:300},                      // 12 A1 chimney (soup)
 {kind:'tank',x:1150,w:60,y:240,base:300},                        // 13 B0 water tank (life)
 {kind:'chimney',x:1860,w:34,y:182,base:230}                      // 14 C0 chimney (life)
];
export const ROOF_LADDERS=[];
// Flocks of Сенсации are fired from a launcher and fly on to the edge of the map.
export const SENSATION_LANES=[
 {id:'a2',x1:0,x2:900,y:208,from:1,period:5.2,phase:0,launcher:{mount:'pole',base:250}},          // head height on A2: crouch
 {id:'b0',x1:1060,x2:2304,y:258,from:-1,period:6,phase:1.6,launcher:{mount:'wall'}},              // across B0 and on over the chain
 {id:'chain',x1:0,x2:1960,y:300,from:1,period:7.6,phase:3.1,launcher:{mount:'wall'}}              // through the trampoline chain, right to left
];
// Nothing blows without a Нагнетатель: the gusts come from them (roofs-systems.js).
export const WIND={x1:0,x2:2304,period:5.3,warn:.9,gust:1.8,speed:-120,ground:-45};
// Checkpoints after losing a life: start, A2, B1.
export const ROOF_CHECKPOINTS=[{x:45,index:0},{x:720,index:2},{x:1340,index:4}];
export const ROOF_ENTRANCE={x:2196,h:150};
export const roofSectionNames=['Батуты','Переулки','Ветреные крыши'];
// What stands at a room-3 platform index.
export function roofPiece(index){
 const nb=ROOF_BUILDINGS.length,nr=ROOF_ROPES.length,na=ROOF_AWNINGS.length;
 if(index<nb)return {type:'building',...ROOF_BUILDINGS[index]};
 if(index<nb+nr)return {type:'rope',...ROOF_ROPES[index-nb]};
 if(index<nb+nr+na)return {type:'awning',...ROOF_AWNINGS[index-nb-nr]};
 return {type:'prop',...ROOF_PROPS[index-nb-nr-na]};
}
