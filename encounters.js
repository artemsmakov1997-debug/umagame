import {rooms} from './level.js?v=0.21.5';
// Introduce one species at a time; optional notebooks never gate encounters.
export const introductionOrder={1:['fakenews','stamp'],3:['paparazzi','inflator'],5:['boom','spotlight','botfarm'],7:['static','clickbait','echo']};
export const introductionDistance={1:[90,820],3:[100,820,1400],5:[420,600,1250],7:[150,600,960]};
export const SPECIES_GAP=5,FIRST_ENCOUNTER_GRACE=3;
export function canActivateEnemy(g,e){
 const order=introductionOrder[e.room];if(!order)return true;
 const index=order.indexOf(e.type);if(index<0)return true;
 const record=(g.encounters[e.room]??={types:{}}),known=record.types[e.type];
 if(known)return known.firstId===e.id||g.time-known.time>=FIRST_ENCOUNTER_GRACE;
 if(g.player.x-rooms[e.room].x<introductionDistance[e.room][index])return false;
 if(index>0){const previous=record.types[order[index-1]];if(!previous||g.time-previous.time<SPECIES_GAP)return false;}
 record.types[e.type]={time:g.time,firstId:e.id};
 g.seenScenes.add('sighting:'+e.type);g.emit('enemyIntroduction',{enemyType:e.type,room:e.room});
 return true;
}
