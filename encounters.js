import {rooms} from './level.js?v=0.15.0';
// Introduce one species at a time; optional notebooks never gate encounters.
export const introductionOrder={1:['fakenews','copier','censor'],3:['informant','inflator','panicker'],5:['injection','cutter','splicer'],7:['static','echo','clickbait']};
export const introductionDistance={1:[90,700,1200],3:[100,820,1400],5:[100,800,1400],7:[130,800,1400]};
export const SPECIES_GAP=5,FIRST_ENCOUNTER_GRACE=3;
export function canActivateEnemy(g,e){
 const order=introductionOrder[e.room];if(!order)return true;
 const index=order.indexOf(e.type);if(index<0)return true;
 const record=(g.encounters[e.room]??={types:{}}),known=record.types[e.type];
 if(known)return known.firstId===e.id||g.time-known.time>=FIRST_ENCOUNTER_GRACE;
 if(g.player.x-rooms[e.room].x<introductionDistance[e.room][index])return false;
 if(index>0){const previous=record.types[order[index-1]];if(!previous||g.time-previous.time<SPECIES_GAP)return false;}
 record.types[e.type]={time:g.time,firstId:e.id};g.emit('enemyIntroduction',{enemyType:e.type,room:e.room});return true;
}
