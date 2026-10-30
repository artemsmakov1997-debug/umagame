// Seconds within a deterministic idle cycle. Real sprite frames, not a moving still image.
export function idleFrame(time){
 const t=((time%18)+18)%18;
 if(t>=3&&t<3.14||t>=13.8&&t<13.94)return {frame:1,action:'blink'};
 if(t>=6&&t<6.22)return {frame:2,action:'lick'};
 if(t>=9&&t<12.1){
  const frames=[0,3,3,4,4,3,4,4,5,0];
  return {frame:frames[Math.min(9,Math.floor((t-9)/.31))],action:'groom'};
 }
 return {frame:0,action:'idle'};
}
