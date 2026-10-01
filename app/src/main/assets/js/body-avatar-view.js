/* Parametric 3D surface fitted to visible silhouette proportions. */
window.AlignaAvatarView = class {
  constructor(host, profile) {
    this.host=host; this.profile=profile; this.drag=false;
    const T=window.THREE;
    this.scene=new T.Scene();
    this.camera=new T.PerspectiveCamera(32,1,.01,20);this.camera.position.set(0,.02,3.15);
    this.renderer=new T.WebGLRenderer({alpha:true,antialias:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.setClearColor(0x000000,0);
    this.renderer.domElement.setAttribute('aria-label','Estimated body-shape avatar. Use the view buttons or drag to rotate.');
    this.renderer.domElement.setAttribute('role','img');
    host.replaceChildren(this.renderer.domElement);
    this.group=new T.Group();this.scene.add(this.group);
    this.material=new T.MeshStandardMaterial({color:0xa9c8bd,roughness:.48,metalness:.15});
    this.scene.add(new T.HemisphereLight(0xdffff3,0x17202e,2.5));
    const key=new T.DirectionalLight(0xfff4e7,3);key.position.set(-2,3,4);this.scene.add(key);
    const rim=new T.DirectionalLight(0x58edc8,2);rim.position.set(2,1,-2);this.scene.add(rim);
    this.build(profile);
    this.resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.render();};
    this.ro=new ResizeObserver(this.resize);this.ro.observe(host);
    this.down=e=>{this.drag=true;this.lastX=e.clientX;host.setPointerCapture?.(e.pointerId);};
    this.move=e=>{if(!this.drag)return;this.group.rotation.y+=(e.clientX-this.lastX)*.012;this.lastX=e.clientX;this.render();};
    this.up=()=>{this.drag=false;};
    host.addEventListener('pointerdown',this.down);host.addEventListener('pointermove',this.move);host.addEventListener('pointerup',this.up);host.addEventListener('pointercancel',this.up);
    this.resize();
  }
  build(p) {
    const T=window.THREE, g=this.group;
    const y=v=>1-2*v;
    const mesh=(geometry,position,scale)=>{const m=new T.Mesh(geometry,this.material);if(position)m.position.set(...position);if(scale)m.scale.set(...scale);g.add(m);return m;};
    const ellipsoid=(x,yy,z,rx,ry,rz)=>mesh(new T.SphereGeometry(1,28,20),[x,yy,z],[rx,ry,rz]);
    const limb=(a,b,ra,rb)=>{const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A);const m=mesh(new T.CylinderGeometry(ra,rb,d.length(),24,1),A.clone().add(B).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),A.clone().sub(B).normalize());};
    const pts=[],indices=[],rings=32;
    p.torso.forEach((r,i)=>{for(let j=0;j<=rings;j++){const a=j/rings*Math.PI*2;pts.push(Math.cos(a)*r.width,y(p.shoulderY+(p.hipY-p.shoulderY)*r.t),Math.sin(a)*r.depth);if(i&&j<rings){const b=i*(rings+1)+j;indices.push(b,b-rings-1,b+1,b+1,b-rings-1,b-rings);}}});
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pts,3));geometry.setIndex(indices);geometry.computeVertexNormals();mesh(geometry);
    const shoulder=p.torso[0],hip=p.torso[p.torso.length-1];
    ellipsoid(0,y(p.hipY),0,hip.width,.065,hip.depth);
    const neckY=y(p.shoulderY)-.005;
    limb([0,neckY+.1,0],[0,neckY,0],.044,.06);
    const headBottom=neckY+.085, headTop=.99;
    ellipsoid(0,(headBottom+headTop)/2,0,.082,Math.max(.065,(headTop-headBottom)/2),.079);
    for(const sign of [-1,1]){
      const shoulderX=sign*Math.max(shoulder.width*.82,p.shoulderSpan*.87), shoulderY=y(p.shoulderY)+.005;
      const elbow=[shoulderX+sign*.12,shoulderY-p.armLength,0];
      const wrist=[shoulderX+sign*.16,shoulderY-p.armLength*1.9,.015];
      ellipsoid(shoulderX,shoulderY,0,p.upperArm*.65,p.upperArm*.8,p.upperArm*.65);
      limb([shoulderX,shoulderY,0],elbow,p.upperArm*.6,p.forearm*.54);
      ellipsoid(...elbow,p.forearm*.55,p.forearm*.6,p.forearm*.55);
      limb(elbow,wrist,p.forearm*.57,p.forearm*.36);
      ellipsoid(wrist[0],wrist[1]-.05,.015,.029,.061,.022);
      const hipX=sign*hip.width*.52,knee=[sign*hip.width*.55,y(p.kneeY),0],ankle=[sign*hip.width*.57,y(p.ankleY),0];
      limb([hipX,y(p.hipY),0],knee,p.thigh*.62,p.calf*.57);
      ellipsoid(...knee,p.calf*.6,.055,p.calf*.62);
      limb(knee,ankle,p.calf*.66,p.calf*.36);
      ellipsoid(ankle[0],ankle[1]-.028,.05,p.calf*.43,.032,.085);
    }
    const floor=new T.Mesh(new T.CircleGeometry(.47,64),new T.MeshBasicMaterial({color:0x8cc9b8,transparent:true,opacity:.1,side:T.DoubleSide}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.03;this.scene.add(floor);
    g.rotation.y=-.25;
  }
  view(side){this.group.rotation.y=({front:0,back:Math.PI,left:Math.PI/2,right:-Math.PI/2})[side]??0;this.render();}
  render(){this.renderer.render(this.scene,this.camera);}
  dispose(){this.ro.disconnect();for(const [name,fn] of [['pointerdown',this.down],['pointermove',this.move],['pointerup',this.up],['pointercancel',this.up]])this.host.removeEventListener(name,fn);this.scene.traverse(o=>{o.geometry?.dispose();if(o.material && o.material!==this.material)o.material.dispose();});this.material.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.host.replaceChildren();}
};
