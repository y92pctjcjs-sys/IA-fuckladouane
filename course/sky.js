import * as T from './vendor/three.module.min.js';
// One shared glyph atlas; one GPU draw for all columns. No character DOM nodes.
export function createDigitalSky(scene,reduced=false){
 const canvas=document.createElement('canvas');canvas.width=320;canvas.height=48;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.font='bold 38px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
 for(let n=0;n<10;n++)ctx.fillText(String(n),n*32+16,25);
 const atlas=new T.CanvasTexture(canvas);atlas.minFilter=T.LinearFilter;atlas.magFilter=T.LinearFilter;
 const plane=new T.PlaneGeometry(1,1),geo=new T.InstancedBufferGeometry();geo.index=plane.index;geo.attributes.position=plane.attributes.position;geo.attributes.uv=plane.attributes.uv;
 const columns=112,rows=24,data=new Float32Array(columns*rows*4);
 // Interleave columns: economy still covers the whole sky, rather than one side.
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   const i=(row*columns+col)*4,seed=((col*73)%113)/113;
   data.set([col/columns*Math.PI*2,3300+seed*200,(row*7)%rows,seed],i);
 }
 geo.setAttribute('column',new T.InstancedBufferAttribute(data,4));geo.instanceCount=columns*rows;
 const uniforms={atlas:{value:atlas},time:{value:0},origin:{value:new T.Vector3()},arrival:{value:0}};
 const mat=new T.ShaderMaterial({uniforms,side:T.DoubleSide,transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,toneMapped:false,
  vertexShader:`attribute vec4 column; uniform float time; uniform vec3 origin; uniform float arrival; varying vec2 glyphUv; varying float alpha; varying float tint;
   void main(){
    float head=mod(time*(1.4+column.w*2.2)+column.w*24.,24.);
    float tail=mod(head-column.z+24.,24.);
    float height=140.+column.z*48.;
    float visible=1.-smoothstep(3.,18.,tail);
    alpha=visible*(.24+.42*column.w)*(1.-arrival*.65)*smoothstep(140.,260.,height);
    tint=column.w;
    float glyph=mod(floor(column.w*93.+column.z*7.+floor(time*(.5+column.w))),10.);
    glyphUv=vec2((glyph+.08+uv.x*.84)/10.,uv.y);
    vec3 center=origin+vec3(sin(column.x)*column.y,height,cos(column.x)*column.y);
    vec3 right=vec3(cos(column.x),0.,-sin(column.x));
    vec3 world=center+right*position.x*24.+vec3(0.,position.y*35.,0.);
    gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
   }`,
  fragmentShader:`uniform sampler2D atlas; varying vec2 glyphUv; varying float alpha; varying float tint;
   void main(){float ink=texture2D(atlas,glyphUv).a;if(ink<.03)discard;
    vec3 color=mix(vec3(.39,.22,.78),vec3(.16,.35,.72),tint);
    if(tint>.96)color=vec3(.57,.82,.26);
    gl_FragColor=vec4(color,ink*alpha);
   }`});
 const mesh=new T.Mesh(geo,mat);mesh.frustumCulled=false;mesh.name='CIEL / CHIFFRES';mesh.renderOrder=-20;scene.add(mesh);
 return {mesh,update(r,camera,level=2){
   uniforms.origin.value.set(camera.position.x,camera.position.y-4,camera.position.z);
   uniforms.time.value=reduced?0:r.time*.45;
   uniforms.arrival.value=Math.max(0,Math.min(1,(r.s-11800)/1200+(r.result?.won?r.cinematic/7:0)));
   geo.instanceCount=columns*Math.max(4,Math.round((level===0?10:level===1?17:rows)*(1-uniforms.arrival.value*.65)));
  },setReduced(value){reduced=value;},dispose(){mesh.removeFromParent();geo.dispose();mat.dispose();atlas.dispose();}};
}
