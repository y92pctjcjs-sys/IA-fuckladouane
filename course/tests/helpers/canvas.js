// CPU scene construction only; browser checks validate the actual canvas and WebGL.
export function testCanvas(){
  const context=new Proxy({measureText:text=>({width:String(text).length*10}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get(target,key){return key in target?target[key]:()=>{};}});
  return {width:0,height:0,getContext:()=>context};
}
