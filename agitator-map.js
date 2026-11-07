// «Мачта Агитатора»: the rooftop arena of the reworked fight «Слова становятся вещами».
// Coordinates are local to the arena room. The floor is a flat roof at FLOOR_Y.
export const FLOOR_Y=422,ARENA_W=1536,MAST_X=768;
// Phase 1 «Лозунг»: the Agitator stands on the mast deck and fires slogans whose letters
// slam into the roof as blocks. Each side gets a three-pillar staircase (2, 3 and 4 letters).
export const LETTER=46;
export const MAST_DECK={x:668,y:196,w:200};
export const PILLARS={left:[470,550,630],right:[1066,986,906]};
export const PILLAR_HEIGHTS=[2,3,4];
// Letters fill the staircase bottom-up, so it is climbable while the slogan is still flying.
export const SLOT_ORDER=[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[1,2],[2,2],[2,3]];
export const SLOGAN='ВСЕГОРЯТ!';
export const LETTER_FRAMES={'В':0,'С':1,'Е':2,'Г':3,'О':4,'Р':5,'Я':6,'Т':7,'!':8};
// Phase 2 «Митинг»: placards climb out of two roof hatches.
export const HATCHES=[560,976];
// Phase 3 «Прямой эфир»: two antenna towers with real ladders at the arena ends.
export const TOWERS=[{side:0,x:44,w:165,ladder:143,deck:{x:34,y:150,w:176},stand:38},{side:1,x:1327,w:165,ladder:1393,deck:{x:1326,y:150,w:176},stand:1410}];
// Chimneys: cover from the broadcast wind and low perches. h is the brick height above the roof.
export const CHIMNEYS=[{x:270,w:60,h:100,tall:true},{x:382,w:56,h:72},{x:1098,w:56,h:72},{x:1206,w:60,h:100,tall:true}];
// Platform indices in layouts[4].
export const AGI={floor:0,mast:1,towers:[2,3],chimneys:[4,5,6,7],slots:{left:8,right:17}};
export function slotRect(side,i){const [pillar,level]=SLOT_ORDER[i],cx=PILLARS[side][pillar];return {x:cx-LETTER/2,y:FLOOR_Y-LETTER*(level+1),w:LETTER,cx,pillar,level};}
export const AGITATOR_LAYOUT=[
 [0,FLOOR_Y,ARENA_W],
 [MAST_DECK.x,MAST_DECK.y,MAST_DECK.w],
 ...TOWERS.map(t=>[t.deck.x,t.deck.y,t.deck.w]),
 ...CHIMNEYS.map(c=>[c.x,FLOOR_Y-c.h,c.w]),
 ...['left','right'].flatMap(side=>SLOT_ORDER.map((_,i)=>{const r=slotRect(side,i);return [r.x,r.y,r.w];}))
];
export const AGITATOR_LADDERS=TOWERS.map(t=>({x:t.ladder-15,y:t.deck.y,w:31,h:FLOOR_Y-t.deck.y}));
export const AGITATOR_FISH=[[230,387],[620,387],[916,387],[1306,387],[300,287],[1236,287],[150,115],[1386,115]];
