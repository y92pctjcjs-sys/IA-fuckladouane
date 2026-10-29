"""Bake the approved sculpture into game-native colored meshes; no runtime GLB loader.
Usage: python prepare-oculaire.py SOURCE.glb OUTPUT.js
Requires numpy, scipy and Pillow only during asset preparation.
"""
import base64, io, json, re, struct, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.spatial.transform import Rotation

source, output = map(Path, sys.argv[1:3])
raw=source.read_bytes(); length=struct.unpack_from('<I',raw,12)[0]
g=json.loads(raw[20:20+length]); binary=raw[28+length:]
def array(i):
 a=g['accessors'][i]; v=g['bufferViews'][a['bufferView']]
 dtype={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']]
 width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
 return np.frombuffer(binary,dtype=dtype,count=a['count']*width,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,width).copy()
images={}
def texture(index):
 i=g['textures'][index]['source']
 if i not in images:
  v=g['bufferViews'][g['images'][i]['bufferView']]; start=v.get('byteOffset',0)
  images[i]=np.array(Image.open(io.BytesIO(binary[start:start+v['byteLength']])).convert('RGBA'))/255
 return images[i]
parents={child:i for i,n in enumerate(g['nodes']) for child in n.get('children',[])}
matrices={}
def matrix(i):
 if i in matrices:return matrices[i]
 n=g['nodes'][i]; m=np.eye(4)
 if 'matrix' in n:m=np.array(n['matrix']).reshape(4,4).T
 else:
  m[:3,:3]=Rotation.from_quat(n.get('rotation',[0,0,0,1])).as_matrix()@np.diag(n.get('scale',[1,1,1]))
  m[:3,3]=n.get('translation',[0,0,0])
 if i in parents:m=matrix(parents[i])@m
 matrices[i]=m;return m
records=[]; all_points=[]
for ni,node in enumerate(g['nodes']):
 name=node.get('name','')
 if 'mesh' not in node or re.search('dents|cornee|Fibre_v4_',name):continue
 # The eye assemblies move as five closed volumes, each about its sclera center.
 group='body'
 for pattern in [r'eye_\d',r'mouth_\d']:
  match=re.match(pattern,name)
  if match:group=match.group()
 for p in g['meshes'][node['mesh']]['primitives']:
  attrs=p['attributes']; pos=array(attrs['POSITION']); normal=array(attrs['NORMAL']); faces=array(p['indices']).reshape(-1,3)
  transform=matrix(ni);pos=pos@transform[:3,:3].T+transform[:3,3]; normal=normal@np.linalg.inv(transform[:3,:3]);normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-9)
  mat=g['materials'][p['material']];pbr=mat.get('pbrMetallicRoughness',{}); rgba=np.ones((len(pos),4))*pbr.get('baseColorFactor',[1,1,1,1])
  if 'baseColorTexture' in pbr:
   image=texture(pbr['baseColorTexture']['index']); uv=array(attrs['TEXCOORD_0']);h,w=image.shape[:2]
   rgba*=image[np.clip((uv[:,1]*h).astype(int),0,h-1),np.clip((uv[:,0]*w).astype(int),0,w-1)]
  if 'Cheveux_meche' in name:faces=faces[rgba[faces,3].mean(axis=1)>.25]
  # Sample textures before clustering, retaining asymmetric pigment distribution.
  cell=.028 if name=='Tete_seule_symetrique' else .018 if 'relief_anatomique' in name else .009 if 'eye_' in name else .017
  # Keep color discontinuities separate, so eyeliner and strands stay crisp.
  key=np.c_[np.round(pos/cell).astype(int),np.floor(rgba[:,:3]*5).astype(int)]
  _,first,inv=np.unique(key,axis=0,return_index=True,return_inverse=True)
  count=np.bincount(inv); n=len(first)
  def average(values):return np.column_stack([np.bincount(inv,weights=values[:,c],minlength=n)/count for c in range(values.shape[1])])
  pos=average(pos);normal=average(normal);rgba=average(rgba);faces=inv[faces]
  faces=faces[(faces[:,0]!=faces[:,1])&(faces[:,0]!=faces[:,2])&(faces[:,1]!=faces[:,2])]
  used,faces=np.unique(faces,return_inverse=True);pos,normal,rgba=pos[used],normal[used],rgba[used];faces=faces.reshape(-1,3)
  if not len(faces):continue
  records.append((group,p['material'],pos,normal,rgba[:,:3],faces));all_points.append(pos)
minimum=np.concatenate(all_points).min(axis=0);maximum=np.concatenate(all_points).max(axis=0); center=(minimum+maximum)/2; height=maximum[1]-minimum[1]
# Merge static features by finish: body, hair, eyeliner, metal; animated parts stay named.
buckets={}
for group,mi,pos,normal,color,faces in records:
 name=g['materials'][mi]['name'];finish='hair' if re.search('Mèche|Racines|Fibre',name) else 'metal' if 'Acier' in name else 'ink' if 'Eyeliner' in name else 'skin'
 if group.startswith('eye_'):
  finish='iris' if 'Iris' in name or 'réflexion' in name else 'lid' if 'Eyeliner' in name else 'sclera' if 'Sclère' in name else 'skin'
 key=(group,finish);buckets.setdefault(key,[]).append((pos-center,normal,color,faces))
result=[]
for (group,finish),parts in buckets.items():
 positions=[];normals=[];colors=[];indices=[];offset=0
 for p,n,c,f in parts:positions.append(p);normals.append(n);colors.append(c);indices.append(f+offset);offset+=len(p)
 p=np.concatenate(positions);n=np.concatenate(normals);c=np.concatenate(colors);f=np.concatenate(indices)
 assert len(p)<65536,(group,finish,len(p))
 # Int16 positions in a shared +-4 unit coordinate system; errors below 0.00013.
 def encode(a):return base64.b64encode(a.tobytes()).decode()
 c=np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
 result.append({'group':group,'finish':finish,'p':encode(np.round(p*8192).astype('<i2')),'n':encode(np.round(np.clip(n,-1,1)*127).astype('i1')),'c':encode(np.round(np.clip(c,0,1)*255).astype('u1')),'i':encode(f.astype('<u2'))})
metadata={'height':round(float(height),6),'center':center.round(6).tolist(),'triangles':sum(len(p[5]) for p in records),'vertices':sum(len(p[2]) for p in records),'draws':len(result),'eyes':[],'mouths':[]}
for prefix,key in [('eye_','eyes'),('mouth_','mouths')]:
 for i in range(5 if key=='eyes' else 3):
  ni=next(k for k,n in enumerate(g['nodes']) if n.get('name')==prefix+str(i));metadata[key].append((matrix(ni)[:3,3]-center).round(6).tolist())
output.write_text('// Game adaptation from the approved OCULAIRE sculpture. No GLB runtime dependency.\nexport const META='+json.dumps(metadata,separators=(',',':'))+';\nexport const SURFACES='+json.dumps(result,separators=(',',':'))+';\n')
print(json.dumps({**metadata,'bytes':output.stat().st_size}))
