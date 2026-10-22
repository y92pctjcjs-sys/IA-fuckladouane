// Hysteresis prevents repeated reallocations of the drawing buffer.
export function createQuality(mode='auto'){
 let level=mode==='eco'?0:2,average=1/60,slow=0,fast=0,cooldown=0,samples=0;
 return {get level(){return level;},get ratio(){return [.72,1,1.25][level];},get fps(){return samples>=30?1/average:null;},
  setMode(value){mode=value;level=value==='eco'?0:2;slow=fast=0;cooldown=4;samples=0;},
  update(dt,running){
   if(!running||dt<=0||dt>.15)return false;
   samples++;average+=(dt-average)*.04;cooldown=Math.max(0,cooldown-dt);
   if(mode!=='auto'||cooldown>0)return false;
   slow=average>.024?slow+dt:0;fast=average<.018?fast+dt:0;
   if(slow>2.5&&level>0){level--;slow=fast=0;cooldown=6;return true;}
   if(fast>12&&level<2){level++;slow=fast=0;cooldown=10;return true;}
   return false;
  }};
}
