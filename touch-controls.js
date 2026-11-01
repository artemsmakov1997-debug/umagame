// Independent pointer IDs allow a left-thumb stick and right-thumb action together.
export function stickVector(dx,dy,radius=48,dead=.2){
 const distance=Math.hypot(dx,dy),amount=Math.min(1,distance/radius);
 if(amount<=dead)return {x:0,y:0};
 const magnitude=(amount-dead)/(1-dead);return {x:dx/distance*magnitude,y:dy/distance*magnitude};
}
export class TouchControls{
 constructor(shell,enabled){
  this.shell=shell;this.enabled=enabled;this.pad=document.getElementById('stick-pad');this.base=document.getElementById('stick-base');this.knob=document.getElementById('stick-knob');
  this.held=new Map();this.gestures=new Map();this.stickId=null;this.vector={x:0,y:0};this.pulses={jump:false,dash:false,attack:false};
  this.pad.addEventListener('pointerdown',event=>{
   if(!this.enabled()||this.stickId!==null)return;event.preventDefault();this.stickId=event.pointerId;this.origin={x:event.clientX,y:event.clientY};this.pad.setPointerCapture(event.pointerId);
   const box=this.pad.getBoundingClientRect();this.base.style.left=`${event.clientX-box.left}px`;this.base.style.top=`${event.clientY-box.top}px`;this.pad.classList.add('engaged');this.move(event);
  });
  this.pad.addEventListener('pointermove',event=>this.move(event));
  for(const type of ['pointerup','pointercancel','lostpointercapture'])this.pad.addEventListener(type,event=>{if(event.pointerId===this.stickId)this.releaseStick();});
  for(const button of document.querySelectorAll('[data-touch-action]')){
   const action=button.dataset.touchAction;
   button.addEventListener('pointerdown',event=>{if(!this.enabled())return;event.preventDefault();button.setPointerCapture(event.pointerId);this.held.set(event.pointerId,{button,action});this.pulses[action]=true;button.classList.add('pressed');});
   for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{const held=this.held.get(event.pointerId);if(!held)return;this.held.delete(event.pointerId);if(![...this.held.values()].some(h=>h.button===button))button.classList.remove('pressed');});
  }
  const canvas=document.getElementById('game');
  canvas.addEventListener('pointerdown',event=>{
   const box=canvas.getBoundingClientRect();if(!this.enabled()||event.pointerType==='mouse'||event.clientX<box.left+box.width*.48)return;
   event.preventDefault();canvas.setPointerCapture(event.pointerId);this.gestures.set(event.pointerId,{x:event.clientX,y:event.clientY});
  });
  canvas.addEventListener('pointerup',event=>{const start=this.gestures.get(event.pointerId);this.gestures.delete(event.pointerId);if(!start||!this.enabled())return;event.preventDefault();const dx=event.clientX-start.x,dy=event.clientY-start.y;this.pulses[dy<-28&&-dy>Math.abs(dx)?'jump':Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)?'dash':'attack']=true;});
  for(const type of ['pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>this.gestures.delete(event.pointerId));
 }
 move(event){
  if(event.pointerId!==this.stickId)return;if(!this.enabled()){this.reset();return;}event.preventDefault();
  const dx=event.clientX-this.origin.x,dy=event.clientY-this.origin.y,radius=48;
  this.vector=stickVector(dx,dy,radius);const length=Math.hypot(dx,dy)||1,scale=Math.min(1,radius/length);this.knob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;
 }
 releaseStick(){this.stickId=null;this.vector={x:0,y:0};this.pad.classList.remove('engaged');this.base.style.left='';this.base.style.top='';this.knob.style.transform='';}
 snapshot(){const held=[...this.held.values()].map(h=>h.action);return {axisX:this.vector.x,up:this.vector.y<-.45,down:this.vector.y>.45,jump:this.pulses.jump,dash:this.pulses.dash,attack:this.pulses.attack||held.includes('attack')};}
 consume(){this.pulses={jump:false,dash:false,attack:false};}
 reset(){this.releaseStick();for(const {button}of this.held.values())button.classList.remove('pressed');this.held.clear();this.gestures.clear();this.consume();}
}
