import {inkAt} from './terrain.js?v=0.22.0';
export const REST_AFTER=30;
const approach=(value,target,amount)=>value<target?Math.min(target,value+amount):Math.max(target,value-amount);
export function wakePlayer(p){p.idleTime=0;p.sleepTime=0;p.sleeping=false;}
export function playerHorizontal(g,axis,dt){
 const p=g.player,ink=p.grounded&&inkAt(g,p),onInk=!!ink;p.onInk=onInk;
 p.inkTime=onInk?.45:Math.max(0,(p.inkTime||0)-dt);
 if(!p.knock){
  if(p.dash>0){p.vx=p.dir*430;p.inkTime=0;}
  else if(p.inkTime>0&&!p.climbing){const target=axis*(p.sneaking?46:112)+(onInk?(ink.drift||0)*(p.sneaking?12:70):0);p.vx=approach(p.vx,target,(p.sneaking?330:axis?230:90)*dt);}
  else p.vx=axis*(p.sneaking?62:155);
 }
 p.slipping=!!(p.grounded&&p.dash===0&&!p.knock&&p.inkTime>0&&Math.abs(p.vx)>9&&!p.attack);
 if(p.slipping)p.slideTime=(p.slideTime||0)+dt;
}
export function stepPlayerRest(g,input,dt){
 const p=g.player,intent=input.left||input.right||input.up||input.down||input.jump||input.attack||input.dash||Math.abs(input.axisX||0)>.08||Math.abs(input.axisY||0)>.08;
 if(intent||!p.grounded||p.climbing||p.sneaking||p.slipping||p.knock>0||p.attack>0||p.dash>0||p.hurtTime>0||Math.abs(p.vx)>2){wakePlayer(p);return;}
 p.idleTime=(p.idleTime||0)+dt;
 if(p.idleTime>REST_AFTER){if(!p.sleeping)g.emit('catSleep');p.sleeping=true;p.sleepTime=(p.sleepTime||0)+dt;}
}
