import {FREE} from './infoshum-combat.js?v=0.21.6';
// Eight drawn frames, 4×2. Every pose retains the same severed upper-right limb.
// Source rectangles skip only the almost transparent padding; the original pixels are not resampled.
// Register by the eyes, not the changing silhouette/trail bounds, to keep the head stationary.
export const WOUNDED_SCALE=.64;
export const WOUNDED_FRAMES=[
 {r:[60,137,276,251],eyes:[181,117.5]},
 {r:[410,142,318,233],eyes:[240.5,112.5]},
 {r:[779,158,343,200],eyes:[280,101.5]},
 {r:[1160,172,358,177],eyes:[295.5,88.5]},
 {r:[58,649,277,255],eyes:[180.5,118.5]},
 {r:[402,643,353,261],eyes:[200,119.5]},
 {r:[800,643,330,253],eyes:[200,125.5]},
 {r:[1202,651,278,250],eyes:[180,114.5]}
];
export const woundedDashFrame=time=>Math.floor(Math.max(0,time)*14)%4;
export function woundedAttackFrame(f,time){
 if(!f?.hits)return null;
 if(f.mode==='ram'||f.mode==='ghostDash'&&f.seq===2&&f.phase==='dive')return woundedDashFrame(time);
 if(f.mode!=='volley')return null;
 if(f.timer>0)return f.timer<=.18?4:null;
 if(f.count===3)return 4;
 const elapsed=FREE.volleyGap-f.sub;
 if(elapsed<.09)return 5;
 if(elapsed<.21)return 6;
 if(elapsed<.32||f.count===0)return 7;
 return 4;
}
export function drawWoundedAttack(c,a,index,x,y,{flip=false,anchor='eyes'}={}){
 const p=WOUNDED_FRAMES[index],img=a.infoshumWounded;if(!p||!img?.complete||!img.naturalWidth)return false;
 // The shot's flash is 38px in front and 31.5px below the eye pivot: line it up with the real shard origin.
 const ax=p.eyes[0]+(anchor==='muzzle'?38:0),ay=p.eyes[1]+(anchor==='muzzle'?31.5:0),k=WOUNDED_SCALE;
 c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.drawImage(img,...p.r,-ax*k,-ay*k,p.r[2]*k,p.r[3]*k);c.restore();return true;
}
