import {chapters,rooms} from './level.js?v=0.21.5';
import {rect} from './pixel.js?v=0.21.5';
export function routeInfo(load){
 const from=rooms[load.from],to=rooms[load.to];
 if(!from||!to||from.chapter===to.chapter||!from.chapter)return null;
 return {from:from.chapter-1,to:to.chapter-1,step:from.chapter-1};
}
function label(c,value,x,y,size,color){c.font=`${size}px UmaText,monospace`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(value,x,y);}
function tag(c,value,x,y,size,width){
 const w=Math.min(width,value.length*size*.65+30),h=size+13,cut=6;
 c.save();c.fillStyle='#031329';c.strokeStyle='#48e9f4';c.lineWidth=1.5;c.beginPath();
 c.moveTo(x-w/2+cut,y-h/2);c.lineTo(x+w/2-cut,y-h/2);c.lineTo(x+w/2,y-h/2+cut);c.lineTo(x+w/2,y+h/2-cut);c.lineTo(x+w/2-cut,y+h/2);c.lineTo(x-w/2+cut,y+h/2);c.lineTo(x-w/2,y+h/2-cut);c.lineTo(x-w/2,y-h/2+cut);c.closePath();c.fill();c.stroke();c.restore();label(c,value,x,y,size,'#63edfa');
}
function landmark(c,a,index,x,y,w,h){const box=[[16,170,522,410],[550,170,500,410],[1060,170,540,410],[1603,170,558,410]][index],scale=Math.min(w/box[2],h/box[3]),dw=box[2]*scale,dh=box[3]*scale;c.drawImage(a.routeLandmarks,...box,x+(w-dw)/2,y+h-dh,dw,dh);}
export function drawRouteTransition(c,a,g,width){
 const load=g.loading,route=load&&routeInfo(load);if(!route)return false;
 const progress=Math.min(1,load.time/load.duration),tall=width<410;
 rect(c,0,0,width,480,'#031329');
 for(let i=0;i<20;i++){const x=(i*97+37)%width,y=35+(i*53)%390;rect(c,x,y,2,i%4?2:5,i%3?'#3c92bd':'#ffe4a1');}
 const start=tall?{x:width*.43,y:268}:{x:width*.32,y:322},end=tall?{x:width*.60,y:284}:{x:width*.68,y:322};
 if(tall){landmark(c,a,route.from,width*.08,111,width*.7,120);landmark(c,a,route.to,width*.25,289,width*.7,115);}
 else{const w=Math.min(300,width*.29),h=w*410/543;landmark(c,a,route.from,width*.18-w/2,288-h,w,h);landmark(c,a,route.to,width*.82-w/2,288-h,w,h);}
 label(c,'ПЕРЕХОД',width/2,tall?46:84,tall?27:38,'#ffe5a1');
 label(c,chapters[route.from].name+' → '+chapters[route.to].name,width/2,tall?81:125,tall?14:22,'#63eeff');
 c.save();c.setLineDash([7,5]);c.strokeStyle='#4ff0f7';c.lineWidth=3;c.beginPath();
 for(let i=0;i<=80;i++){const q=i/80,x=start.x+(end.x-start.x)*q,y=start.y+(end.y-start.y)*q+Math.sin(q*Math.PI*2)*14;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();c.restore();
 const x=start.x+(end.x-start.x)*progress,y=start.y+(end.y-start.y)*progress+Math.sin(progress*Math.PI*2)*14;
 rect(c,x-4,y-11,8,8,'#ffdf87');rect(c,x-7,y-17,14,10,'#ffdf87');rect(c,x-3,y-14,6,5,'#102438');rect(c,x-2,y-4,4,4,'#ffdf87');
 tag(c,chapters[route.from].name,tall?width*.43:width*.18,tall?243:348,tall?15:21,tall?width*.72:220);
 tag(c,chapters[route.to].name,tall?width*.60:width*.82,tall?420:348,tall?15:21,tall?width*.72:220);
 for(let i=0;i<3;i++)rect(c,width/2-25+i*20,447,10,10,i===route.step?'#5ff6fa':'#225573');
 return true;
}
