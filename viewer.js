import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {createArmPresentation,createVisorSurface,makeVisorTexture} from './inspection.js';

export function createViewer(canvas,onSelect){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
  renderer.setClearColor(0x000000,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.35;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(33,1,.01,100);
  const suit=new THREE.Group();scene.add(suit);
  const cart=new THREE.Group();suit.add(cart);cart.position.set(1.95,0,-.45);
  let cartReady=false,cartTarget=0,cartTravel=0,cartDemo=false,gestureView=false,juniorScene=null; const cartMeshes=[],juniorWheels=[];
  let juniorCamera=null,wheelRadius=.3,juniorClock=0;
  scene.add(new THREE.HemisphereLight(0xe5f0ee,0x5f5947,2.1));
  const key=new THREE.DirectionalLight(0xffefd9,3.2);key.position.set(-3,6,5);scene.add(key);
  const fill=new THREE.DirectionalLight(0xc8e1ee,1.4);fill.position.set(4,2,3);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xe3ae69,2.6);rim.position.set(3,4,-4);scene.add(rim);
  const loading=document.querySelector('#model-loading');
  let mixer=null,clips=[],requestedMotion=null,armPose=null,palmView=false,visorMesh=null,playingMotion=false,elevation=0;
  let loaded=false,selection=null,page='suit',angle=-.18,targetAngle=-.18,auto=false,zoom=1,drag=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anchors={},markers={},meshes=[];
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const aim=new THREE.Vector3(-1,1.9,0),goal=new THREE.Vector3(),point=new THREE.Vector3(),palmCenter=new THREE.Vector3();
  let distance=9,last=performance.now(),width=0,height=0;
  function fail(error){console.error('Suit model:',error);loading.hidden=true;document.querySelector('#fallback').hidden=false;document.querySelector('#fallback p').textContent='The 3D model could not load. Reload to retry, or use the component menu.';document.body.classList.add('fallback');for(const b of Object.values(markers))b.hidden=true;document.querySelector('#rotate-toggle').disabled=true;}
  new GLTFLoader().load('./assets/spacesuit.json?v=texture-1',gltf=>{
    try{
      const model=gltf.scene;model.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
      const scale=3.8/size.y;
      model.scale.multiplyScalar(scale);model.rotation.y=Math.PI/2;model.position.set(center.z*scale,-bounds.min.y*scale,-center.x*scale);
      suit.add(model);suit.updateMatrixWorld(true);
      const helmet=model.getObjectByName('mixamorigHead');
      const glove=model.getObjectByName('mixamorigLeftHandMiddle1');
      armPose=createArmPresentation(model);
      const setup=(id,obj,label,fallback)=>{
        let box=obj&&!obj.isBone?new THREE.Box3().setFromObject(obj):null;
        anchors[id]={p:box?box.getCenter(new THREE.Vector3()):new THREE.Vector3(...fallback),size:box?box.getSize(new THREE.Vector3()).length():.6,bone:obj?.isBone?obj:null};
        const b=document.createElement('button');b.className='hotspot';b.innerHTML='<span class="dot"></span><span class="tag">INSPECT '+label+'</span>';b.setAttribute('aria-label','Inspect '+label.toLowerCase());b.addEventListener('click',()=>onSelect(id));document.querySelector('#hotspots').append(b);markers[id]=b;
      };
      setup('helmet',helmet,'HELMET & VISOR',[0,3.5,.1]);setup('glove',glove,'LEFT GLOVE',[.8,1.9,.1]);
      anchors.glove.palmBone=model.getObjectByName('mixamorigLeftHand');
      model.traverse(o=>{if(o.isMesh){meshes.push(o);if(o.isSkinnedMesh)o.frustumCulled=false;}});
      visorMesh=createVisorSurface(model,helmet,meshes.filter(m=>!cartMeshes.includes(m)),scale,makeVisorTexture());
      mixer=new THREE.AnimationMixer(model);clips=gltf.animations;
      const motion=document.querySelector('#motion-controls');
      for(const clip of [null,...gltf.animations]){
        const button=document.createElement('button');button.type='button';button.dataset.motion=clip?.name||'';
        button.textContent=clip?clip.name.replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()):'Still';
        button.setAttribute('aria-pressed',String(!clip));
        button.addEventListener('click',()=>{
          document.querySelector('#reset').click();stopMotion();
          if(clip){playingMotion=true;mixer.clipAction(clip).reset().play();}
          motion.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
        });motion.append(button);
      }
      loaded=true;loading.hidden=true;document.querySelector('#model-state').textContent='YOUR SUIT / 3D MODEL';
      if(requestedMotion)api.playMotion(requestedMotion);
      api.stats={meshes:meshes.length,triangles:meshes.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0)};
    }catch(error){fail(error)}
  },event=>{loading.textContent=event.total?'LOADING YOUR SUIT · '+Math.round(event.loaded/event.total*100)+'%':'LOADING YOUR SUIT…';},fail);
  new GLTFLoader().load('./assets/marvin-junior/marvin-junior.json?v=parts-1',gltf=>{
    const model=gltf.scene;model.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=1.75/size.y;
    model.scale.multiplyScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);cart.add(model);
    // Bake the rest pose of the five rigid pieces so they can turn around their own centers.
    const separate=(name)=>{
      const original=model.getObjectByName(name);if(!original?.isSkinnedMesh)return null;
      const geometry=original.geometry.clone(),position=geometry.attributes.position,temp=new THREE.Vector3();
      for(let i=0;i<position.count;i++){original.applyBoneTransform(i,temp.fromBufferAttribute(position,i));position.setXYZ(i,temp.x,temp.y,temp.z);}
      position.needsUpdate=true;geometry.computeBoundingBox();
      const pivot=new THREE.Group(),piece=new THREE.Mesh(geometry,original.material),middle=geometry.boundingBox.getCenter(new THREE.Vector3());
      pivot.position.copy(middle);piece.position.copy(middle).multiplyScalar(-1);pivot.add(piece);original.parent.add(pivot);original.visible=false;
      return {pivot,piece,size:geometry.boundingBox.getSize(new THREE.Vector3())};
    };
    for(const name of ['tripo_part_1','tripo_part_2','tripo_part_12','tripo_part_13']){
      const wheel=separate(name);if(wheel){juniorWheels.push(wheel.pivot);wheelRadius=wheel.size.y*.5*scale;}
    }
    const cameraPart=separate('tripo_part_7');juniorCamera=cameraPart?.pivot||null;
    model.traverse(o=>{if(o.isMesh&&o.visible){cartMeshes.push(o);meshes.push(o);if(o.isSkinnedMesh)o.frustumCulled=false;}});
    anchors.cart={p:new THREE.Vector3(1.95,1,-.45),size:2};
    const b=document.createElement('button');b.className='hotspot cart-hotspot';b.innerHTML='<span class="dot"></span><span class="tag">MARVIN JUNIOR / EQUIPMENT</span>';b.setAttribute('aria-label','Inspect Marvin Junior cart');b.addEventListener('click',()=>onSelect('cart'));document.querySelector('#hotspots').append(b);markers.cart=b;
    cartReady=true;document.dispatchEvent(new CustomEvent('cart-ready'));
  },undefined,error=>{console.error('Cart model:',error);document.dispatchEvent(new CustomEvent('cart-error'));});
  new GLTFLoader().load('./assets/fungus/fungus.json?v=1',gltf=>{
    const fungus=gltf.scene;
    const bounds=new THREE.Box3().setFromObject(fungus),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    const scale=.34/size.y;
    fungus.scale.setScalar(scale);
    fungus.position.set(-1.3-center.x*scale,-bounds.min.y*scale,.48-center.z*scale);
    suit.add(fungus);
  },undefined,error=>console.warn('Fungus model:',error));
  function stopMotion(){
    mixer?.stopAllAction();playingMotion=false;requestedMotion=null;armPose?.restore();
    document.querySelectorAll('[data-motion]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.motion==='')));
  }
  function frame(now){
    requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;
    if(page!=='suit'||document.hidden)return;
    if(width!==innerWidth||height!==innerHeight){width=innerWidth;height=innerHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
    if(auto&&!selection&&!reduced)targetAngle+=dt*.18;
    if(mixer)mixer.update(dt);
    const k=reduced?1:1-Math.exp(-dt*5);
    if(armPose&&!playingMotion)armPose.update(selection==='glove'&&palmView,dt,reduced);
    juniorClock+=dt;
    if(juniorScene==='celebrate')cartTarget=.48+.45*Math.sin(juniorClock*1.45);
    const previousTravel=cartTravel;cartTravel+=(cartTarget-cartTravel)*k;
    cart.position.z=-.45+cartTravel;if(anchors.cart)anchors.cart.p.set(1.95,1,cart.position.z);
    for(const wheel of juniorWheels)wheel.rotation.x+=(cartTravel-previousTravel)/wheelRadius;
    if(juniorCamera){
      if(juniorScene==='celebrate'){
        juniorCamera.rotation.y+=dt*3;
        if(juniorCamera.rotation.y>Math.PI*2)juniorCamera.rotation.y-=Math.PI*2;
      }else{
        if(juniorCamera.rotation.y>Math.PI)juniorCamera.rotation.y-=Math.PI*2;
        juniorCamera.rotation.y+=((juniorScene?.28*Math.sin(juniorClock*1.25):0)-juniorCamera.rotation.y)*k;
      }
    }
    angle+=(targetAngle-angle)*k;suit.rotation.y=angle;suit.updateMatrixWorld(true);
    for(const [id,a] of Object.entries(anchors)){if(a.bone){a.bone.getWorldPosition(a.p);suit.worldToLocal(a.p);if(id==='helmet'){a.p.y+=.14;a.p.z+=.22;}}}
    if(visorMesh){visorMesh.material.opacity+=((selection==='helmet'?.92:0)-visorMesh.material.opacity)*k;visorMesh.visible=visorMesh.material.opacity>.01;}
    const mobile=width<700,halfFov=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    let targetDistance;
    if(selection&&anchors[selection]){
      const anchor=anchors[selection];point.copy(anchor.p).applyMatrix4(suit.matrixWorld);
      if(selection==='glove'&&palmView&&anchor.palmBone)point.lerp(anchor.palmBone.getWorldPosition(palmCenter),.55);
      targetDistance=Math.max(selection==='cart'?5.5:selection==='helmet'?1.9:(palmView?1.25:2.25),anchor.size*2.3)*zoom;
      if(selection==='cart'&&cartDemo){point.set(.85,1.8,0).applyMatrix4(suit.matrixWorld);targetDistance=Math.max(9,7/camera.aspect)*zoom;}
      if(selection==='glove'&&gestureView){point.set(.8,1.8,0).applyMatrix4(suit.matrixWorld);targetDistance=Math.max(9.3,8/camera.aspect)*zoom;}
      // Keep the inspected component clear of the text panel.
      const splitInspection=width>800&&(selection==='helmet'||selection==='glove');
      if(splitInspection)targetDistance=Math.max(targetDistance,anchor.size/(.58*halfFov*camera.aspect));
      goal.copy(point);goal.x+=mobile?0:targetDistance*halfFov*camera.aspect*(splitInspection?.68:.34);
      if(mobile){targetDistance=Math.max(targetDistance,selection==='glove'&&palmView?2:3.1);goal.y-=targetDistance*halfFov*.48;}
    }else{
      targetDistance=Math.max(10.4,9.2/camera.aspect)*zoom;
      goal.set(.75-targetDistance*halfFov*camera.aspect*(mobile?.38:.30),1.95,0);
    }
    aim.lerp(goal,k);distance+=(targetDistance-distance)*k;
    elevation+=((selection==='glove'&&palmView?.62:0)-elevation)*k;
    camera.position.set(aim.x,aim.y+Math.sin(elevation)*distance,aim.z+Math.cos(elevation)*distance);camera.lookAt(aim);camera.updateMatrixWorld();
    renderer.render(scene,camera);
    for(const [id,a] of Object.entries(anchors)){
      const world=a.p.clone().applyMatrix4(suit.matrixWorld),screen=world.clone().project(camera);
      const x=(screen.x*.5+.5)*width,y=(-screen.y*.5+.5)*height;
      const marker=markers[id];marker.hidden=!!selection||!loaded||Math.cos(angle)<-.25||x<15||x>width-15||y<90||y>height-90;
      marker.style.left=x+'px';marker.style.top=y+'px';

    }
  }
  requestAnimationFrame(frame);
  canvas.addEventListener('pointerdown',e=>{if(page!=='suit'||!loaded)return;drag={x:e.clientX,startX:e.clientX,startY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)drag.moved=true;targetAngle+=(e.clientX-drag.x)*.008;drag.x=e.clientX;auto=false;document.querySelector('#rotate-toggle').setAttribute('aria-pressed','false')});
  canvas.addEventListener('pointerup',e=>{if(!drag)return;const moved=drag.moved;drag=null;if(moved)return;pointer.set(e.clientX/width*2-1,1-e.clientY/height*2);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(meshes,false)[0];if(hit&&cartMeshes.includes(hit.object)){onSelect('cart');return;}if(hit){let best=null,nearest=Infinity;for(const [id,a] of Object.entries(anchors)){const d=hit.point.distanceTo(a.p.clone().applyMatrix4(suit.matrixWorld));if(d<(id==='helmet'?.44:.37)&&d<nearest){best=id;nearest=d;}}if(best)onSelect(best)}});
  canvas.addEventListener('pointercancel',()=>drag=null);
  canvas.addEventListener('wheel',e=>{if(page!=='suit')return;e.preventDefault();zoom=THREE.MathUtils.clamp(zoom+e.deltaY*.0003,.75,1.4)},{passive:false});
  canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();targetAngle+=e.key==='ArrowLeft'?-.2:.2;}else if(e.key==='Home'){e.preventDefault();document.querySelector('#reset').click();}});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(new Error('WebGL context lost'))});
  const api={
    playMotion(name){stopMotion();if(!name)return;requestedMotion=name;if(!mixer)return;const clip=clips.find(c=>c.name.toLowerCase()===name.toLowerCase());if(!clip)return;playingMotion=true;mixer.clipAction(clip).reset().play();document.querySelectorAll('[data-motion]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.motion===clip.name)));},
    select(id){stopMotion();gestureView=false;cartDemo=false;juniorScene=id==='cart'?'showcase':null;cartTarget=cartTravel;selection=id;palmView=false;zoom=1;auto=false;targetAngle=id==='glove'?-.3:id==='helmet'?(-.12-Math.PI/9):-.12;},
    reset(){gestureView=false;cartDemo=false;juniorScene=null;cartTarget=0;selection=null;palmView=false;zoom=1;targetAngle=-.18;auto=false;},
    setJuniorScene(value){juniorScene=value;juniorClock=0;},
    setGestureView(value){gestureView=!!value;},
    cartCommand(command){if(!cartReady)return false;cartDemo=true;targetAngle=-.18;zoom=1;cartTarget=command==='stop'?cartTravel:command==='return'?0:.85;return true;},
    rotate(){auto=!auto;return auto;},
    setPalm(value){palmView=!!value;if(selection==='glove')targetAngle=value?(-.25+Math.PI/6+Math.PI/9):-.3;},
    setPage(value){page=value;loading.hidden=loaded||value!=='suit';},
    setFlare(value){rim.intensity=value?4:2.6;},stats:{}
  };
  return api;
}
