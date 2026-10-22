// CPU geometry inspection only. This deliberately does not emulate rasterization or WebGL.
export function canvasSink(){
 const context={};
 for(const method of ['fillRect','strokeRect','fillText','save','restore','translate','rotate','beginPath','moveTo','lineTo','closePath','stroke','arc','clearRect','transform','fill','drawImage'])context[method]=()=>{};
 return {width:0,height:0,getContext:type=>type==='2d'?context:null};
}
