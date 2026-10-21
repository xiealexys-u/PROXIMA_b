// Dependency-free WebGL concept model. Dimensions are illustrative, not engineering specifications.
export function makeSuit(){
const vertices=[];let part=4;const C={cloth:[.56,.56,.45,0],light:[.72,.70,.58,0],dark:[.105,.13,.12,0],rubber:[.065,.085,.08,0],metal:[.32,.35,.31,.7],edge:[.57,.56,.45,.65],glass:[.035,.065,.062,1],gold:[.64,.47,.17,.4],yellow:[.67,.66,.24,0],black:[.035,.05,.044,0],glow:[.76,.47,.16,2]};
const rot=(v,r)=>{let [x,y,z]=v;let c=Math.cos(r[0]),s=Math.sin(r[0]);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(r[1]);s=Math.sin(r[1]);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(r[2]);s=Math.sin(r[2]);return [x*c-y*s,x*s+y*c,z]};
function mesh(fn,nu,nv,center,scale,color,r=[0,0,0]){function at(u,v){return fn(u,v)}function emit(u,v){let p=at(u,v),eps=.0002,pu=at(u+eps,v),pv=at(u,v+eps);let a=pu.map((q,i)=>(q-p[i])/eps),b=pv.map((q,i)=>(q-p[i])/eps);let n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];let l=Math.hypot(...n)||1;n=n.map((q,i)=>q/l/scale[i]);n=rot(n,r);l=Math.hypot(...n)||1;p=rot(p.map((q,i)=>q*scale[i]),r);vertices.push(...p.map((q,i)=>q+center[i]),...n.map(q=>q/l),...color,part)}
for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){let u=i/nu,v=j/nv,U=(i+1)/nu,V=(j+1)/nv;emit(u,v);emit(U,v);emit(U,V);emit(u,v);emit(U,V);emit(u,V)}}
const sphere=(p,s,c,r=[0,0,0],nu=36,nv=24)=>mesh((u,v)=>{let a=u*Math.PI*2,b=v*Math.PI;return [Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)]},nu,nv,p,s,c,r);
const box=(p,s,c,r=[0,0,0])=>{const faces=[[[1,0,0],[0,1,0],[0,0,1]],[[-1,0,0],[0,0,1],[0,1,0]],[[0,1,0],[0,0,1],[1,0,0]],[[0,-1,0],[1,0,0],[0,0,1]],[[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[0,1,0],[1,0,0]]];faces.forEach(([n,a,b])=>mesh((u,v)=>n.map((x,i)=>x*.5+a[i]*(u-.5)+b[i]*(v-.5)),1,1,p,s,c,r))};
const torus=(p,rad,tube,c,r=[0,0,0],sx=1,sy=1)=>mesh((u,v)=>{let a=2*Math.PI*u,b=2*Math.PI*v;return [(rad+tube*Math.cos(b))*Math.cos(a)*sx,(rad+tube*Math.cos(b))*Math.sin(a)*sy,tube*Math.sin(b)]},60,10,p,[1,1,1],c,r);
function tube(a,b,r,c,r2=r){const v=b.map((x,i)=>x-a[i]);let len=Math.hypot(...v);let z=v.map(x=>x/len),ref=Math.abs(z[1])>.95?[1,0,0]:[0,1,0];let x=[ref[1]*z[2]-ref[2]*z[1],ref[2]*z[0]-ref[0]*z[2],ref[0]*z[1]-ref[1]*z[0]],l=Math.hypot(...x);x=x.map(q=>q/l);let y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];mesh((u,v)=>{let t=2*Math.PI*u,R=r+(r2-r)*v;return a.map((q,i)=>q+z[i]*len*v+R*(Math.cos(t)*x[i]+Math.sin(t)*y[i]))},14,1,[0,0,0],[1,1,1],c)}
function seam(a,b,c=C.dark,r=.008){tube(a,b,r,c)}
// Boots, articulated lower suit and hard-wearing knee shells.
part=4;
for(let s of [-1,1]){let x=s*.23;
sphere([x,.17,.1],[.20,.17,.32],C.dark);box([x,.065,.095],[.39,.11,.64],C.rubber);box([x,.035,.095],[.405,.045,.66],C.black);
for(let k=0;k<7;k++)box([x,.018,-.16+k*.085],[.39,.026,.04],C.rubber);
sphere([x,.36,-.04],[.17,.24,.19],C.cloth);for(let j=0;j<3;j++){box([x,.22+j*.085,.255-j*.02],[.30,.035,.045],C.metal,[.25,0,0]);box([x-s*.15,.25+j*.08,.1],[.05,.055,.09],C.edge)}
sphere([x,.78,-.025],[.18,.44,.18],C.dark,[0,0,s*-.025]);sphere([x,1.09,.01],[.20,.19,.21],C.cloth);sphere([x,1.08,.155],[.15,.19,.085],C.metal);box([x,1.08,.23],[.20,.18,.025],C.dark);
for(let j=0;j<4;j++)box([x,.96+j*.07,.237],[.19,.012,.015],C.edge);
sphere([x,1.48,-.02],[.22,.39,.22],C.cloth,[0,0,s*.03]);for(let j=0;j<6;j++)torus([x,.56+j*.066,-.02],.16,.012,C.dark,[Math.PI/2,0,0],1,.93);
box([x+s*.17,1.44,.015],[.07,.29,.23],C.dark,[0,0,-s*.03]);box([x+s*.21,1.47,.015],[.023,.19,.14],C.cloth);
seam([x-.09,.58,.15],[x-.08,.89,.15],C.light,.006);seam([x+.09,.58,.15],[x+.08,.89,.15],C.light,.006);
}
sphere([0,1.91,0],[.40,.29,.25],C.dark);
// Tailored, split outer coat with asymmetric panels and uneven weathered hem.
function panel(start,end){mesh((u,v)=>{let a=start+(end-start)*u;let taper=.34+v*.20;let hem=1.19+.08*Math.cos(a*3);let y=2.44+(hem-2.44)*v;let wave=.012*Math.sin(a*18+v*6)*v;return [Math.sin(a)*(taper+wave),y,Math.cos(a)*(.25+v*.07+wave)]},22,24,[0,0,0],[1,1,1],C.cloth)}
panel(.12,Math.PI-.1);panel(Math.PI+.1,2*Math.PI-.12);
// A narrow front opening exposes the pressure suit and utility belt.
sphere([0,2.44,0],[.43,.47,.265],C.cloth);sphere([0,2.68,0],[.48,.23,.27],C.cloth);box([0,2.36,.26],[.11,.61,.045],C.dark);box([0,2.35,.289],[.018,.60,.013],C.edge);
for(let s of [-1,1]){seam([s*.05,2.36,.28],[s*.065,1.28,.33],C.light,.012);seam([s*.36,2.1,.19],[s*.49,1.34,.18],C.light,.009);
box([s*.25,1.67,.285],[.25,.32,.075],C.dark,[0,s*.08,s*.04]);box([s*.25,1.71,.329],[.22,.26,.03],C.cloth,[0,s*.08,s*.04]);box([s*.25,1.82,.35],[.22,.055,.03],C.light);box([s*.25,1.75,.374],[.025,.07,.016],C.metal);
for(let j=0;j<4;j++)box([s*.21,1.35+j*.21,.326],[.02,.02,.015],C.metal);
}
// Shoulder assemblies, cloth sleeves, ribbed elbow and forearm guards.
for(let s of [-1,1]){sphere([s*.47,2.66,0],[.23,.235,.245],C.light,[0,0,s*.14]);sphere([s*.59,2.37,0],[.175,.32,.19],C.cloth,[0,0,s*.15]);sphere([s*.67,2.10,.015],[.16,.15,.17],C.dark);sphere([s*.71,1.91,.035],[.15,.26,.16],C.dark,[0,0,s*.10]);
for(let j=0;j<7;j++)torus([s*(.66+j*.012),2.13-j*.052,.026],.151,.012,C.rubber,[Math.PI/2,0,s*.12],1,.96);
box([s*.72,1.96,.156],[.22,.25,.075],C.metal,[0,0,s*.08]);box([s*.72,1.97,.20],[.17,.13,.022],C.dark,[0,0,s*.08]);box([s*.72,1.97,.216],[.10,.018,.008],C.yellow);
box([s*.58,2.45,.173],[.17,.18,.035],C.dark,[0,0,s*.13]);box([s*.58,2.48,.196],[.12,.07,.01],C.light,[0,0,s*.13]);
seam([s*.57,2.55,.15],[s*.64,2.22,.15],C.light,.009);
}
// Utility harness, fasteners and chest radio.
for(let s of [-1,1]){box([s*.28,2.50,.242],[.075,.68,.06],C.dark,[0,0,-s*.11]);box([s*.28,2.56,.279],[.043,.30,.012],C.metal,[0,0,-s*.11]);box([s*.30,2.23,.28],[.10,.12,.027],C.edge);box([s*.30,2.23,.30],[.061,.073,.012],C.dark);
seam([s*.25,2.78,.272],[s*.31,2.23,.28],C.light,.004);box([s*.35,2.11,.21],[.15,.17,.13],C.dark);box([s*.35,2.16,.28],[.13,.05,.025],C.light)}
box([0,2.13,.272],[.81,.09,.052],C.dark);box([0,2.13,.311],[.14,.11,.033],C.edge);box([0,2.13,.335],[.09,.07,.015],C.black);box([.13,2.48,.292],[.14,.25,.08],C.dark);box([.13,2.52,.337],[.095,.065,.015],C.metal);for(let k=0;k<4;k++)box([.13,2.45+k*.013,.338],[.08,.004,.01],C.edge);tube([.17,2.62,.30],[.17,2.83,.30],.009,C.dark);
box([-.14,2.62,.28],[.13,.09,.027],C.edge);box([-.14,2.62,.299],[.08,.045,.01],C.yellow);box([.08,2.31,.288],[.022,.11,.02],C.yellow,[0,0,-.15]);
// Life support unit, rails, service panels and tanks.
part=3;
box([0,2.40,-.37],[.66,.87,.29],C.dark);box([0,2.43,-.535],[.57,.77,.08],C.cloth);box([0,2.60,-.59],[.43,.32,.05],C.light);box([0,2.60,-.622],[.33,.23,.018],C.cloth);box([0,2.56,-.635],[.16,.06,.012],C.metal);box([0,2.21,-.59],[.42,.29,.04],C.metal);
for(let s of [-1,1]){tube([s*.29,2.0,-.58],[s*.29,2.84,-.58],.027,C.edge);sphere([s*.36,2.32,-.38],[.10,.38,.12],C.metal);torus([s*.36,2.50,-.38],.104,.014,C.dark,[Math.PI/2,0,0]);torus([s*.36,2.17,-.38],.104,.014,C.dark,[Math.PI/2,0,0]);for(let k=0;k<4;k++)box([s*.22,2.09+k*.19,-.616],[.038,.044,.022],C.dark);box([s*.17,2.82,-.58],[.065,.07,.04],C.dark)}
for(let j=0;j<7;j++)box([0,2.12+j*.027,-.62],[.30,.009,.016],C.dark);
let hose=[];for(let i=0;i<27;i++){let t=i/26;hose.push([.39+Math.sin(t*Math.PI)*.17,2.28-t*.72,-.34+.61*t])}for(let i=0;i<hose.length-1;i++)tube(hose[i],hose[i+1],.025,i%2?C.metal:C.dark);
// Sealed neck, circular helmet shell and broad continuous curved visor.
part=1;
sphere([0,2.91,0],[.37,.18,.32],C.dark);for(let j=0;j<4;j++)torus([0,2.88+j*.04,0],.31+j*.006,.028,j%2?C.light:C.cloth,[Math.PI/2,0,0],1,1);
sphere([0,3.34,0],[.405,.46,.365],C.light);sphere([0,3.34,.168],[.366,.392,.284],C.dark);sphere([0,3.35,.203],[.329,.355,.276],C.glass,[0,0,0],64,42);
// Glass gasket and metal bezel in the frontal plane.
torus([0,3.35,.287],.341,.018,C.edge,[0,0,0],1,1.12);torus([0,3.35,.305],.321,.012,C.dark,[0,0,0],1,1.12);
for(let s of [-1,1]){sphere([s*.39,3.32,0],[.087,.18,.18],C.dark);sphere([s*.442,3.32,0],[.045,.137,.137],C.edge);torus([s*.477,3.32,0],.095,.013,C.dark,[0,Math.PI/2,0]);sphere([s*.485,3.32,0],[.014,.074,.074],C.metal);for(let j=0;j<8;j++){let a=j*Math.PI/4;sphere([s*.489,3.32+Math.cos(a)*.114,Math.sin(a)*.114],[.009,.011,.011],C.dark,[0,0,0],8,6)}
box([s*.25,3.68,.09],[.10,.065,.16],C.dark,[0,0,s*.25]);box([s*.25,3.71,.12],[.06,.018,.10],C.metal,[0,0,s*.25]);box([s*.35,3.12,.16],[.07,.09,.11],C.edge,[0,0,s*.25]);sphere([s*.15,2.98,.24],[.025,.018,.018],C.gold,[0,0,0],10,8)}
box([0,3.77,-.02],[.19,.034,.16],C.dark);box([0,3.79,-.01],[.12,.015,.10],C.edge);box([0,3.46,-.35],[.25,.23,.04],C.cloth);box([0,3.46,-.38],[.18,.12,.02],C.metal);
// Draped collar fabric: protective folds around the base of the helmet.
part=4;
for(let j=0;j<5;j++){let a=.3+j*.38;torus([0,2.88+j*.028,.025],.335+j*.007,.026,C.cloth,[Math.PI/2-.05,j*.04,0],1.07,1);}
mesh((u,v)=>{let a=u*2*Math.PI,r=.345+.035*Math.sin(a*3)+v*.045;return [Math.cos(a)*r,2.95-v*.22+Math.sin(a*2+.7)*.04,Math.sin(a)*r*.85]},64,7,[0,0,0],[1,1,1],C.light);
// Pressure gloves with individual bent fingers and a radiation sensor.
part=2;
for(let s of [-1,1]){let x=s*.76;torus([x,1.72,.05],.143,.021,C.edge,[Math.PI/2,0,0]);sphere([x,1.60,.06],[.14,.18,.12],C.dark,[0,0,s*.08]);box([x,1.62,.164],[.20,.14,.055],C.metal,[0,0,s*.08]);box([x,1.65,.2],[.13,.06,.02],C.dark);box([x,1.65,.214],[.07,.02,.008],C.yellow);
for(let f=0;f<4;f++){let fx=x+(f-1.5)*.061;let yy=1.435+Math.abs(f-1.3)*.025; sphere([fx,yy,.105],[.028,.105,.037],C.rubber,[.16,0,-s*.04],14,12);sphere([fx,yy-.073,.135],[.027,.042,.04],C.dark,[0,0,0],12,10);box([fx,1.52,.168],[.045,.053,.026],C.edge,[.15,0,0])}
sphere([x-s*.14,1.57,.12],[.049,.105,.055],C.rubber,[0,0,-s*.45],16,12);sphere([x-s*.17,1.50,.15],[.041,.055,.05],C.dark,[0,0,-s*.35],14,10);
}
return new Float32Array(vertices);
}
export const anchors={helmet:{p:[0,3.40,.28],radius:.43,part:1},glove:{p:[-.76,1.61,.15],radius:.24,part:2},pack:{p:[.26,2.49,-.6],radius:.42,part:3},layers:{p:[.20,1.73,.29],radius:.46,part:4}};
