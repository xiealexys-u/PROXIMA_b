import * as THREE from 'three';

// A coordinated presentation pose: upper arm lifts, elbow bends, forearm
// supinates, and the wrist stays approximately aligned with the forearm.
export function createArmPresentation(model){
  const bones=['LeftArm','LeftForeArm','LeftHand'].map(name=>model.getObjectByName('mixamorig'+name));
  if(bones.some(b=>!b))return null;
  model.updateMatrixWorld(true);
  const rest=bones.map(b=>b.quaternion.clone());
  const modelRotation=model.getWorldQuaternion(new THREE.Quaternion());
  const toWorld=v=>v.normalize().applyQuaternion(modelRotation);
  const worldToLocal=(bone,q)=>bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q);
  const upperWorld=bones[0].getWorldQuaternion(new THREE.Quaternion());
  const direction=new THREE.Vector3(0,1,0).applyQuaternion(upperWorld);
  const upperTarget=new THREE.Quaternion().setFromUnitVectors(direction,toWorld(new THREE.Vector3(-.21,-.90,.38))).multiply(upperWorld);
  bones[0].quaternion.copy(worldToLocal(bones[0],upperTarget));model.updateMatrixWorld(true);
  const palmUpFrame=direction=>{
    const y=toWorld(direction),up=toWorld(new THREE.Vector3(0,1,0));
    const x=new THREE.Vector3().crossVectors(y,up.negate()).normalize();
    const z=new THREE.Vector3().crossVectors(x,y).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));
  };
  bones[1].quaternion.copy(worldToLocal(bones[1],palmUpFrame(new THREE.Vector3(-.875,.48,.06))));
  model.updateMatrixWorld(true);
  bones[2].quaternion.copy(worldToLocal(bones[2],palmUpFrame(new THREE.Vector3(-.978,.20,.06))));
  const raised=bones.map(b=>b.quaternion.clone());
  // Relax the curled fingers into an open palm while retaining thumb opposition.
  for(const finger of ['Index','Middle','Ring','Pinky'])for(let joint=1;joint<=3;joint++){
    const bone=model.getObjectByName('mixamorigLeftHand'+finger+joint);
    if(bone){bones.push(bone);rest.push(bone.quaternion.clone());raised.push(bone.quaternion.clone().slerp(new THREE.Quaternion(),.8));}
  }
  bones.forEach((b,i)=>b.quaternion.copy(rest[i]));model.updateMatrixWorld(true);
  let amount=0;
  return {
    update(isRaised,dt,reduced){
      const step=reduced?1:Math.min(1,dt/1.35);
      amount=THREE.MathUtils.clamp(amount+(isRaised?step:-step),0,1);
      const t=amount*amount*(3-2*amount);
      bones.forEach((b,i)=>b.quaternion.copy(rest[i]).slerp(raised[i],t));
      return amount;
    },
    restore(){amount=0;bones.forEach((b,i)=>b.quaternion.copy(rest[i]));},
    get amount(){return amount;}
  };
}

// Sample the uploaded visor itself so the display follows its double curvature.
// Points are stored in head-bone space; ordinary depth testing hides the HUD
// behind the shell when viewing the helmet from the rear.
export function createVisorSurface(model,head,meshes,scale,texture){
  model.updateMatrixWorld(true);
  const headPoint=head.getWorldPosition(new THREE.Vector3());
  // Bake a small, static helmet snapshot once; avoid reskinning the whole suit
  // for each sampling ray during loading.
  const snapshots=meshes.map(mesh=>{
    const attr=mesh.geometry.attributes.position,index=mesh.geometry.index;
    const positions=[],triangles=[];
    for(let i=0;i<attr.count;i++){
      const p=mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);
      positions.push(p.x,p.y,p.z);
    }
    const count=index?index.count:attr.count;
    for(let i=0;i<count;i+=3){
      const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);
      if(ids.every(j=>positions[j*3+1]>headPoint.y-.04*scale))triangles.push(...ids);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(triangles);
    return new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  });
  const ray=new THREE.Raycaster(),positions=[],uvs=[],indices=[],valid=[];
  const cols=32,rows=24;
  for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
    const u=col/cols,v=row/rows;
    const x=headPoint.x+((u-.5)*.084-.0019)*scale;
    const y=headPoint.y+(.0356+(v-.5)*.072)*scale;
    ray.set(new THREE.Vector3(x,y,headPoint.z+.25*scale),new THREE.Vector3(0,0,-1));
    const hit=ray.intersectObjects(snapshots,false)[0];
    valid.push(!!hit);
    const p=hit?hit.point.clone():new THREE.Vector3(x,y,headPoint.z);
    // Small separation prevents z-fighting while retaining the surface shape.
    p.z+=.0012*scale;
    head.worldToLocal(p);positions.push(p.x,p.y,p.z);uvs.push(u,v);
  }
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const a=row*(cols+1)+col,b=a+1,c=a+cols+1,d=c+1;
    if(valid[a]&&valid[b]&&valid[c]&&valid[d])indices.push(a,b,d,a,d,c);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,depthTest:true,side:THREE.FrontSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  snapshots.forEach(mesh=>{mesh.geometry.dispose();mesh.material.dispose();});
  const surface=new THREE.Mesh(geometry,material);surface.renderOrder=2;head.add(surface);return surface;
}

export function makeVisorTexture(){
  const display=document.createElement('canvas');display.width=1024;display.height=768;
  const c=display.getContext('2d');
  // Only luminous markings: no rectangular screen background.
  c.strokeStyle='#9ae9bf';c.fillStyle='#b7f9d6';c.lineWidth=3;
  c.beginPath();c.ellipse(512,384,440,310,0,.88*Math.PI,1.95*Math.PI);c.stroke();
  c.beginPath();c.ellipse(512,384,440,310,0,.03*Math.PI,.45*Math.PI);c.stroke();
  c.font='24px monospace';c.textAlign='center';c.fillText('VISION  /  ACTIVE',512,150);
  c.strokeStyle='#f1c777';c.lineWidth=5;
  for(const [x,y,dx,dy] of [[390,275,1,1],[634,275,-1,1],[390,460,1,-1],[634,460,-1,-1]]){
    c.beginPath();c.moveTo(x+dx*36,y);c.lineTo(x,y);c.lineTo(x,y+dy*30);c.stroke();
  }
  c.fillStyle='#f1d89e';c.font='bold 42px monospace';c.fillText('FUNGAL FLARE',512,554);
  c.font='24px monospace';c.fillText('DETECTED',512,600);
  c.fillStyle='#8bbfa6';c.font='17px monospace';c.fillText('SIMULATED SIGNAL',512,646);
  const texture=new THREE.CanvasTexture(display);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
