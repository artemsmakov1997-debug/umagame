import {rooms,platforms} from './level.js?v=0.21.5';
export const sectionNames={1:['Редакционный зал','Печатный цех','Серверная'],3:['Пожарные лестницы','Бельевые верёвки','Антенный лес'],5:['Павильон','Прожекторы','Монтажная'],7:['Лента','Пересылка','Разлом']};
export function hazardZone(room,section){return [260,370];}
// A location machine runs while its controller is intact.
export function machineActive(g,room,section){const control=g.mapProps?.find(d=>d.room===room&&d.section===section);return !!control?.hp;}
export const propKinds={1:'server',3:'power',5:'console',7:'anchor'};
export function createMapProps(){return [].flatMap(room=>(room===5?[12,22]:[10,20]).map((index,i)=>{const p=platforms.find(p=>p.room===room&&p.index===index);return{id:`control-${room}-${i}`,room,platformIndex:index,kind:propKinds[room],x:p.x+p.w-66,y:p.y-62,w:48,h:62,hp:1,breakTime:0,lastSwing:-1,section:i+1};}));}
export function createRoutePortals(){return [].flatMap(room=>[0,1].map(i=>({room,id:`burrow-${room}-${i}`,fromIndex:room===3?(i?12:9):room===5?(i?24:15):(i?22:13),toIndex:room===3?(i?25:17):room===5?(i?27:19):(i?25:17),cooldown:0})));}
export function stepMapProps(g,dt,paw){
 const p=g.player;
 for(const d of g.mapProps||[]){if(d.room!==g.room)continue;const s=g.platforms.find(s=>s.room===d.room&&s.index===d.platformIndex);d.x=s.x+s.w-66;d.y=s.y-62;d.breakTime=Math.max(0,d.breakTime-dt);
  if(d.hp&&p.attack>0&&d.lastSwing!==p.swing&&g.overlap(paw,d)){d.lastSwing=p.swing;d.hp=0;d.breakTime=.7;g.emit('controlBreak',{kind:d.kind,x:d.x+24,y:d.y+30});}
 }
 for(const route of g.routePortals||[])if(route.room===g.room)route.cooldown=Math.max(0,route.cooldown-dt);
}
export function tryRouteShortcut(g){
 const p=g.player;if(!g.routeUpPressed||!p.grounded||p.dash>0)return false;
 for(const route of g.routePortals||[]){if(route.room!==g.room||route.cooldown>0)continue;
  for(const [from,to]of [[route.fromIndex,route.toIndex],[route.toIndex,route.fromIndex]]){const s=g.platforms.find(s=>s.room===g.room&&s.index===from);if(p.supportId!==s.id||Math.abs(p.x+p.w/2-(s.x+s.w/2))>45)continue;const target=g.platforms.find(s=>s.room===g.room&&s.index===to);Object.assign(p,{x:target.x+target.w/2-p.w/2,y:target.y-p.h,vx:0,vy:0,jumpBuffer:0,coyote:0,grounded:true,supportId:target.id,inv:Math.max(p.inv,.8),climbing:false});route.cooldown=1;g.updateCamera();g.emit('shortcut',{x:p.x,y:p.y});return true;}
 }return false;
}

export function stepSection(g){
 // Sectors share one running world. Crossing never freezes physics or changes mode.
 if(!g.cinematic||!sectionNames[g.room])return;
 const index=Math.min(2,Math.max(0,Math.floor((g.player.x-rooms[g.room].x)/768))),key=g.room+':'+index;
 if(index===0||g.visitedSections.has(key))return;
 g.visitedSections.add(key);g.emit('sectionEnter',{room:g.room,section:index,title:sectionNames[g.room][index]});
}

export function stepLocationHazards(g,dt){
 if(!g.cinematic||!sectionNames[g.room]||g.player.inv>0||g.player.dash>0)return;
 const p=g.player,index=Math.min(2,Math.max(0,Math.floor((p.x-rooms[g.room].x)/768)));
 if(index===0||!machineActive(g,g.room,index))return;
 const t=(g.time+index*.8)%5,local=p.x-rooms[g.room].x-index*768;
 const [from,to]=hazardZone(g.room,index);if(t<1.2||t>2.2||local<from||local>to)return;
 if(g.room===3){if(!p.knock)g.push(-1,p.x+100);}
 else if(g.room===7){p.vy=Math.min(p.vy,-230);p.grounded=false;}
 else if(g.room===1?p.y+p.h>360:p.y>180)g.hurt(false,p.x+100);
}
