const playerHeight=(p,height)=>{const feet=p.y+p.h;p.h=height;p.y=feet-height;};
// Low ceilings: a surface with `shelter` (the y of its underside) can be passed beneath only crouched.
// Standing, Uma stops at its edge; once beneath, she stays crouched until she leaves or jumps up through it.
export function applyLowCeilings(g,oldX){
 const p=g.player;p.forcedCrouch=false;if(!p.grounded||p.climbing)return;
 for(const s of g.platforms){
  if(s.room!==g.room||!s.shelter||p.y+p.h<s.shelter+2)continue;
  const left=s.x+4,right=s.x+s.w-4;if(p.x+p.w<=left||p.x>=right)continue;
  if(!p.sneaking){
   if(oldX+p.w<=left){p.x=left-p.w;continue;}
   if(oldX>=right){p.x=right;continue;}
  }
  p.forcedCrouch=true;if(!p.sneaking){p.sneaking=true;playerHeight(p,26);}
 }
}
