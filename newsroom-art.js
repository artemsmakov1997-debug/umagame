import {rooms} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
import {PRESS} from './chapter-routes.js?v=0.21.5';
// Newsroom block identity. Backdrops for the print shop and server room come from
// assets/newsroom-blocks.png (see campaign-art.js); the press is drawn here from
// assets/newsroom-press.png in world space so it stays locked to the conveyor.
// Atlas boxes: frame, head, lamp off, lamp on.
const FRAME=[0,0,132,282],HEAD=[140,0,153,65],LAMP_OFF=[140,72,19,18],LAMP_ON=[166,70,22,24];
// Positions inside the frame sprite.
const LAMP_AT=[61,4],CYLINDER_BOTTOM=97,ROD=[59,15];
const ROD_COLORS=['#0a0e26','#3b4d85','#796a84','#edd5ae','#0d1129'];
export const PRESS_REST=300,PRESS_STRIKE=371;

export function pressState(g,t){
 const control=g.mapProps?.find(d=>d.room===1&&d.section===PRESS.section);
 if(!control?.hp)return{active:false,drop:0,warn:false};
 const phase=(t+PRESS.section*.8)%5,warn=phase<1.2,strike=phase>=1.2&&phase<=2.2;
 const drop=strike?Math.min(1,(phase-1.2)/.12):phase>2.2&&phase<2.7?1-(phase-2.2)/.5:0;
 return{active:true,drop,warn};
}
function part(c,image,box,x,y){c.drawImage(image,box[0],box[1],box[2],box[3],Math.round(x),Math.round(y),box[2],box[3]);}

// Behind the platforms: the catwalk and the conveyor pass in front of the press.
export function drawNewsroomScenery(c,a,g,t){
 if(g.room!==1)return;
 const r=rooms[1],cx=r.x+PRESS.x+PRESS.w/2,cam=g.camera,vw=g.viewWidth||768;
 // Conveyor legs and rollers under the belt.
 for(let x=r.x+896;x<r.x+1260;x+=46)if(x>cam-20&&x<cam+vw+20){rect(c,x,443,8,31,'#121c2e');rect(c,x+2,443,2,31,'#3e5468');}
 const image=a.newsroomPress;if(!image||cx<cam-120||cx>cam+vw+120)return;
 const s=pressState(g,t),fx=cx-FRAME[2]/2,fy=474-FRAME[3],shake=s.warn?Math.round(Math.sin(t*40)):0;
 part(c,image,FRAME,fx,fy);
 const lit=s.active&&(s.warn?Math.floor(t*8)%2===0:s.drop>0);
 if(lit)part(c,image,LAMP_ON,fx+LAMP_AT[0]-2,fy+LAMP_AT[1]-4);else if(!s.active)part(c,image,LAMP_OFF,fx+LAMP_AT[0],fy+LAMP_AT[1]);
 const top=Math.round(PRESS_REST+(PRESS_STRIKE-PRESS_REST)*s.drop),rodTop=fy+CYLINDER_BOTTOM;
 for(const [i,color] of ROD_COLORS.entries())rect(c,fx+ROD[0]+i*3+shake,rodTop,3,top-rodTop+6,color);
 part(c,image,HEAD,cx-HEAD[2]/2+shake,top);
}

// Over the platforms: paper bursting out when the head lands on the belt.
export function drawNewsroomMachines(c,g,t){
 if(g.room!==1)return;
 const s=pressState(g,t);if(s.drop<1)return;
 const x=rooms[1].x+PRESS.x;c.save();c.globalAlpha=.7;
 for(let k=0;k<8;k++)rect(c,x+6+k*(PRESS.w-12)/7,PRESS_STRIKE+60-((k*7+Math.floor(t*30))%9),5,2,'#f2e6c8');
 c.restore();
}
