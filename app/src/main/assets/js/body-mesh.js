/* Continuous, smooth-union surface. All inputs use fractions of full visible height.
   Widths are DIAMETERS, joint x values are distances from the centre line. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AlignaBodyMesh=api;})(globalThis,function(){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const blend=(a,b,k=.007)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
  function interpolate(rows,t,key){if(t<=rows[0].t)return rows[0][key];for(let i=1;i<rows.length;i++)if(t<=rows[i].t){const a=rows[i-1],b=rows[i],u=(t-a.t)/(b.t-a.t);return (a[key]||0)+((b[key]||0)-(a[key]||0))*u;}return rows.at(-1)[key];}
  function field(profile){
    const p=profile,parts=[];
    function oval(cx,cy,cz,rx,ry,rz){parts.push((x,y,z)=>(Math.hypot((x-cx)/rx,(y-cy)/ry,(z-cz)/rz)-1)*Math.min(rx,ry,rz));}
    const shoulderY=p.shoulderY,hipY=p.hipY;
    const headHeight=Math.min(p.headHeight||.135,shoulderY-.02),headWidth=p.headWidth||.085,headDepth=p.headDepth||.105;
    oval(0,headHeight/2,0,headWidth/2,headHeight/2,headDepth/2);
    oval(0,(headHeight+shoulderY)/2,0,headWidth*.30,(shoulderY-headHeight)/2+.018,headDepth*.29);
    const rows=[{t:-.1,width:headWidth*.7,depth:headDepth*.65,centre:0},...p.torso.map(r=>({...r,centre:r.centre||0})),{t:1.12,width:p.torso.at(-1).width*.65,depth:p.torso.at(-1).depth*.65,centre:p.torso.at(-1).centre||0}];
    const top=shoulderY-.025,bottom=hipY+.035;
    parts.push((x,y,z)=>{const t=(y-shoulderY)/(hipY-shoulderY),rx=interpolate(rows,t,'width')/2,rz=interpolate(rows,t,'depth')/2;const radial=(Math.hypot(x/rx,(z-interpolate(rows,t,'centre'))/rz)-1)*Math.min(rx,rz);return Math.max(radial,top-y,y-bottom);});
    const j=p.joints||{};
    const joint=(name,x,y)=>j[name]||{x,y};
    const sh=joint('shoulder',p.shoulderSpan/2,shoulderY),el=joint('elbow',sh.x+.035,shoulderY+p.armLength*.5),wr=joint('wrist',sh.x+.05,shoulderY+p.armLength);
    const hp=joint('hip',p.torso.at(-1).width*.23,hipY),kn=joint('knee',hp.x,p.kneeY),an=joint('ankle',hp.x,p.ankleY);
    function segment(a,b,rows){
      const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
      parts.push((x,y,z)=>{const along=(x-a[0])*ux+(y-a[1])*uy,t=clamp(along/length,0,1),rx=interpolate(rows,t,'width')/2,rz=interpolate(rows,t,'depth')/2;
        const normal=(x-a[0])*(-uy)+(y-a[1])*ux,cap=along<0?along:Math.max(0,along-length);
        return (Math.hypot(normal/rx,(z-a[2])/rz,cap/Math.min(rx,rz))-1)*Math.min(rx,rz);
      });
    }
    function widths(key,start,end){const measured=p.limbProfiles?.[key];return measured?.length?measured:[{t:0,width:start,depth:start},{t:.55,width:start*.95,depth:start*.95},{t:1,width:end,depth:end}];}
    for(const sign of [-1,1]){
      const point=o=>[sign*o.x,o.y,0];
      segment(point(sh),point(el),widths('upperArm',p.upperArm,p.forearm));
      segment(point(el),point(wr),widths('forearm',p.forearm,p.forearm*.6));
      oval(sign*wr.x,wr.y+.033,0,p.forearm*.35,.043,p.forearm*.24);
      segment(point(hp),point(kn),widths('thigh',p.thigh,p.calf*.85));
      segment(point(kn),point(an),widths('calf',p.calf,p.calf*.55));
      oval(sign*an.x,Math.min(.98,an.y+.024),.018,p.calf*.34,.023,.062);
    }
    return (x,y,z)=>{let value=1;for(const part of parts)value=blend(value,part(x,y,z));return value;};
  }
  function build(p,step=.011){
    const sdf=field(p),extent=Math.max(.35,...Object.values(p.joints||{wrist:{x:.25}}).map(j=>j.x+.09),...p.torso.map(r=>r.width/2+.05)),depth=Math.max(.20,...p.torso.map(r=>r.depth/2+Math.abs(r.centre||0)+.05));
    const nx=Math.ceil(2*extent/step)+1,ny=Math.ceil(1.1/step)+1,nz=Math.ceil(2*depth/step)+1;
    const origin=[-extent,-.04,-depth],values=new Float32Array(nx*ny*nz),positions=[],indices=[],edges=new Map();
    const id=(x,y,z)=>(y*nz+z)*nx+x;
    const coord=i=>{const x=i%nx,z=Math.floor(i/nx)%nz,y=Math.floor(i/(nx*nz));return [origin[0]+x*step,origin[1]+y*step,origin[2]+z*step];};
    for(let y=0;y<ny;y++)for(let z=0;z<nz;z++)for(let x=0;x<nx;x++)values[id(x,y,z)]=sdf(origin[0]+x*step,origin[1]+y*step,origin[2]+z*step);
    function vertex(a,b){const key=a<b?a+':'+b:b+':'+a;if(edges.has(key))return edges.get(key);const A=coord(a),B=coord(b),t=values[a]/(values[a]-values[b]),n=positions.length/3;positions.push(...A.map((v,i)=>v+(B[i]-v)*t));edges.set(key,n);return n;}
    function tri(a,b,c,outside){const A=positions.slice(a*3,a*3+3),B=positions.slice(b*3,b*3+3),C=positions.slice(c*3,c*3+3),O=coord(outside);const u=B.map((v,i)=>v-A[i]),v=C.map((v,i)=>v-A[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];if(n.reduce((s,v,i)=>s+v*(O[i]-A[i]),0)<0)indices.push(a,c,b);else indices.push(a,b,c);}
    const tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
    for(let y=0;y<ny-1;y++)for(let z=0;z<nz-1;z++)for(let x=0;x<nx-1;x++){
      const cube=[id(x,y,z),id(x+1,y,z),id(x+1,y+1,z),id(x,y+1,z),id(x,y,z+1),id(x+1,y,z+1),id(x+1,y+1,z+1),id(x,y+1,z+1)];
      if(cube.every(i=>values[i]>=0)||cube.every(i=>values[i]<0))continue;
      for(const tet of tets){const ins=tet.map(i=>cube[i]).filter(i=>values[i]<0),outs=tet.map(i=>cube[i]).filter(i=>values[i]>=0);if(!ins.length||!outs.length)continue;
        if(ins.length===1){tri(...outs.map(b=>vertex(ins[0],b)),outs[0]);}
        else if(outs.length===1){tri(...ins.map(a=>vertex(a,outs[0])),outs[0]);}
        else{const a=vertex(ins[0],outs[0]),b=vertex(ins[0],outs[1]),c=vertex(ins[1],outs[1]),d=vertex(ins[1],outs[0]);tri(a,b,c,outs[0]);tri(a,c,d,outs[0]);}
      }
    }
    // Convert image coordinates to the renderer's upward Y axis; flip winding.
    for(let i=0;i<positions.length;i+=3){positions[i]*=2;positions[i+1]=1-2*positions[i+1];positions[i+2]*=2;}
    for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
    return {positions,indices};
  }
  return {build,field};
});
