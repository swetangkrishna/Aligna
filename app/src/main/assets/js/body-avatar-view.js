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
    this.material=new T.MeshStandardMaterial({color:0xa9c8bd,roughness:.85,metalness:0});
    this.scene.add(new T.HemisphereLight(0xdffff3,0x17202e,2.5));
    const key=new T.DirectionalLight(0xfff4e7,3);key.position.set(-2,3,4);this.scene.add(key);
    const rim=new T.DirectionalLight(0x58edc8,2);rim.position.set(2,1,-2);this.scene.add(rim);
    this.build(profile);
    this.resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.position.z=Math.max(4.25,1.1/(Math.tan(16*Math.PI/180)*this.camera.aspect));this.camera.updateProjectionMatrix();this.render();};
    this.ro=new ResizeObserver(this.resize);this.ro.observe(host);
    this.down=e=>{this.drag=true;this.lastX=e.clientX;host.setPointerCapture?.(e.pointerId);};
    this.move=e=>{if(!this.drag)return;this.group.rotation.y+=(e.clientX-this.lastX)*.012;this.lastX=e.clientX;this.render();};
    this.up=()=>{this.drag=false;};
    host.addEventListener('pointerdown',this.down);host.addEventListener('pointermove',this.move);host.addEventListener('pointerup',this.up);host.addEventListener('pointercancel',this.up);
    this.resize();
  }
  build(p) {
    const T=window.THREE, g=this.group;
    const data=AlignaBodyMesh.build(p);
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));
    geometry.setIndex(data.indices);geometry.computeVertexNormals();
    g.add(new T.Mesh(geometry,this.material));
    const floor=new T.Mesh(new T.CircleGeometry(.47,64),new T.MeshBasicMaterial({color:0x8cc9b8,transparent:true,opacity:.1,side:T.DoubleSide}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.03;this.scene.add(floor);
    g.rotation.y=0;
  }
  view(side){this.group.rotation.y=({front:0,back:Math.PI,left:Math.PI/2,right:-Math.PI/2})[side]??0;this.render();}
  render(){this.renderer.render(this.scene,this.camera);}
  dispose(){this.ro.disconnect();for(const [name,fn] of [['pointerdown',this.down],['pointermove',this.move],['pointerup',this.up],['pointercancel',this.up]])this.host.removeEventListener(name,fn);this.scene.traverse(o=>{o.geometry?.dispose();if(o.material && o.material!==this.material)o.material.dispose();});this.material.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.host.replaceChildren();}
};
