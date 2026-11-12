import {platforms,rooms,MAX_LIVES} from './level.js?v=0.21.5';
// Health packets. Each map has two, standing on platforms (they ride moving ones via world-platforms.js); a boss
// arena starts with none and gets one each time the boss enters a new phase. Lives are not found on the map any
// more: they are topped up when Uma starts a level (enters its map from the previous chapter).
export const MAP_PACKS=[[1,3],[1,6],[3,13],[3,14],[5,15],[5,11],[7,10],[7,25]];
export const PACK={lift:24,near:[200,320],rise:130,drop:60,boss:150,minW:70};
export function createPacks(){return MAP_PACKS.map(([room,index],i)=>{const s=platforms.find(p=>p.room===room&&p.index===index);return {id:'pack-'+i,room,platformIndex:index,x:s.x+s.w*.6,y:s.y-PACK.lift,taken:false};});}
// Called by activateRoom: arena packets of an earlier attempt go away; a new level refills the lives.
export function enterRoomPacks(g,index,heal){
 g.soups=(g.soups||[]).filter(s=>!(s.phase&&s.room===index));g.pendingPack=null;
 const r=rooms[index];if(heal&&index>0&&!r.arena&&!r.tutorial&&g.lives<MAX_LIVES){g.lives=MAX_LIVES;g.emit('livesRefill',{lives:g.lives});}
}
export function queuePhasePack(g,event){if(event.type==='bossPhase'&&event.phase>=2)g.pendingPack={boss:event.boss,phase:event.phase};}
// Wait until the new phase has settled (the arena may be rebuilt during the change), then put a packet on a solid
// platform within a short jump of Uma and clear of the boss.
export function stepPhasePack(g){
 const want=g.pendingPack,b=g.boss;if(!want||!b?.active)return;
 if(b.state==='phaseChange'||['assemble','breakout'].includes(b.network?.stage))return;
 g.pendingPack=null;const pack=placePack(g);if(pack){g.soups=g.soups.filter(s=>!(s.phase&&s.room===g.room));g.soups.push(pack);g.emit('packDrop',{x:pack.x,y:pack.y});}
}
export function placePack(g){
 const p=g.player,px=p.x+p.w/2,feet=p.y+p.h,bx=g.boss?(g.boss.x+g.boss.w/2):-1e9,r=rooms[g.room];
 const list=g.platforms.filter(s=>s.room===g.room&&!s.bossHidden&&!s.intangible&&!s.burned&&s.w>=PACK.minW&&s.y<=feet+PACK.drop&&s.y>=feet-PACK.rise);
 const clear=g.boss?.network?.stage==='colossus'?260:Math.max(PACK.boss,(g.boss?.w||0)/2+60);let best=null;
 for(const s of list)for(const dir of [-1,1])for(let d=PACK.near[0];d<=PACK.near[1];d+=30){
  const x=Math.max(s.x+28,Math.min(s.x+s.w-28,px+dir*d)),run=Math.abs(x-px);if(x<r.x+40||x>r.end-40)continue;
  const score=(run<PACK.near[0]?PACK.near[0]-run:run>PACK.near[1]?run-PACK.near[1]:0)+(Math.abs(x-bx)<clear?400:0)+Math.abs(s.y-feet)*.5;
  if(!best||score<best.score)best={s,x,score};}
 if(!best)return null;
 return {id:'phase-'+g.boss.id+'-'+g.boss.phase,room:g.room,platformIndex:best.s.index,x:best.x,y:best.s.y-PACK.lift,taken:false,phase:true};
}
