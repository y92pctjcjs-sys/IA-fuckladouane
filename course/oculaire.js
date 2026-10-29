import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {sample} from './track.js?v=atelier-002';

export const OCULAIRE_MODEL = new URL('./assets/oculaire/oculaire-tete-v4.glb', import.meta.url);

// The original GLB is loaded intact. Its embedded animation is intentionally not
// played: first verify the validated sculpture before adding game-driven motion.
export function createOculaire(scene, {loadModel = () => new GLTFLoader().loadAsync(OCULAIRE_MODEL.href), report = () => {}} = {}) {
  const root = new T.Group(); root.name = 'OCULAIRE'; root.visible = false; scene.add(root);
  const status = {state: 'loading', error: null, meshes: 0, height: 0};
  let model, disposed = false;
  const target = new T.Vector3(), center = new T.Vector3();
  const ready = Promise.resolve().then(loadModel).then(gltf => {
    model = gltf.scene;
    const bounds = new T.Box3().setFromObject(model);
    bounds.getCenter(center); const height = bounds.getSize(new T.Vector3()).y;
    if (!(height > 0)) throw new Error('OCULAIRE: le modèle ne possède pas de volume mesurable.');
    model.position.sub(center); root.add(model); root.scale.setScalar(36 / height);
    const materials = new Set();
    model.traverse(object => {
      if (object.isMesh) status.meshes++;
      for (const material of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) materials.add(material);
    });
    // A distant celestial face must retain the reference's acid pigments rather
    // than inherit the road's purple exponential fog and filmic desaturation.
    // Keep every original PBR texture, relief map and geometric feature.
    for (const material of materials) {material.fog = false; material.toneMapped = false; material.needsUpdate = true;}
    status.height = height; status.state = 'ready';
    if (disposed) {release(); return;}
    root.visible = true; report({...status});
  }).catch(error => {
    status.state = 'error'; status.error = `${error.name}: ${error.message}`;
    root.visible = false; report({...status}); console.error('OCULAIRE import:', error);
  });
  function release() {
    const geometries = new Set(), materials = new Set(), textures = new Set();
    model?.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) {
        materials.add(material); for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) {texture.source?.data?.close?.(); texture.dispose();}
    root.removeFromParent();
  }
  return {
    root, ready,
    update(r, player, camera) {
      if (status.state !== 'ready' || disposed) return;
      // Follow a world-space bearing ahead of the car, not the distant road's
      // lateral displacement. The latter clips the face on narrow screens.
      const p = sample(Math.min(13200, r.s + 75));
      const dx = p.x - camera.position.x, dz = p.z - camera.position.z;
      const distance = Math.hypot(dx, dz) || 1;
      root.position.set(camera.position.x + dx / distance * 210, p.y + 32, camera.position.z + dz / distance * 210);
      target.copy(player.position); target.y += 1;
      root.lookAt(target); // The exported face looks along local +Z.
      root.updateMatrixWorld(true);
    },
    get status() {return {...status};},
    inspect(camera) {
      if (!model || status.state !== 'ready') return {...status};
      const box = new T.Box3().setFromObject(root), screen = new T.Box2();
      for (const x of [box.min.x,box.max.x]) for (const y of [box.min.y,box.max.y]) for (const z of [box.min.z,box.max.z]) {
        const p = new T.Vector3(x,y,z).project(camera); screen.expandByPoint(new T.Vector2(p.x,p.y));
      }
      const names=[];model.traverse(o=>{if (/^eye_\d$|^nose_\d$|^mouth_\d$/.test(o.name)) names.push(o.name);});
      const direction = root.position.clone().sub(camera.position), occluders=[];
      const ray = new T.Raycaster(camera.position,direction.clone().normalize(),camera.near,direction.length()-20);
      scene.traverseVisible(object=>{
        if (!object.isMesh) return;
        for (let parent=object;parent;parent=parent.parent) if (parent===root) return;
        const materials=Array.isArray(object.material)?object.material:[object.material];
        if (materials.some(m=>m.depthWrite&&m.opacity>.95)) occluders.push(object);
      });
      const hits=ray.intersectObjects(occluders,false);
      return {...status,features:names,position:root.position.toArray(),screen:{min:screen.min.toArray(),max:screen.max.toArray()},occludedAtCenter:hits.length>0};
    },
    dispose() {disposed = true; release();}
  };
}
