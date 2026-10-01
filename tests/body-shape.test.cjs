const {test}=require('node:test');const assert=require('node:assert/strict');
const {analyse,combine}=require('../app/src/main/assets/js/body-shape.js');
function fixture({view='front',fullness=1,aspect=.5}={}) {
 const w=256,h=512,mask=new Float32Array(w*h),p=Array.from({length:33},()=>({x:.5,y:.1,visibility:.95}));
 const side=['left','right'].includes(view);
 for(const [a,b,y] of [[11,12,.23],[13,14,.4],[15,16,.57],[23,24,.55],[25,26,.74],[27,28,.92]]){const gap=side?.025:(a===11?.13:a===13?.22:a===15?.26:.08);p[a]={x:.5-gap,y,visibility:.95};p[b]={x:.5+gap,y,visibility:.95};}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const yy=y/h,xx=x/w;
   const r=(yy<.23?.07:(yy<.55?(side?.115:(.15-.035*Math.sin((yy-.23)/.32*Math.PI)))*fullness:.12));
   if(yy>.06&&yy<.95&&Math.abs(xx-.5)<r)mask[y*w+x]=1;
 }
 return {landmarks:p,mask,width:w,height:h,imageWidth:1000*aspect,imageHeight:1000,view};
}
test('wider captured silhouettes produce a fuller avatar, not a fixed body type',()=>{
 const build=fullness=>combine(Object.fromEntries(['front','back','left','right'].map(view=>[view,{shape:analyse(fixture({view,fullness}))}])));
 const slim=build(.85),full=build(1.15);
 assert.ok(full.torso[6].width>slim.torso[6].width*1.2);
 assert.ok(full.torso[6].depth>slim.torso[6].depth*1.2);
 assert.equal(full.muscleMass,null);
});
test('camera aspect ratio is applied to physical proportions',()=>{
 const a=analyse(fixture()),b=analyse(fixture({aspect:.75}));
 assert.ok(Math.abs(b.torso[6].width/a.torso[6].width-1.5)<.01);
});
test('cropped body and missing landmarks are rejected',()=>{
 const f=fixture();for(let x=100;x<150;x++)f.mask[x]=1;
 assert.throws(()=>analyse(f),/entire body/);
 const g=fixture();g.landmarks[27].visibility=.1;assert.throws(()=>analyse(g),/feet visible/);
});
test('no segmentation never produces a fabricated avatar',()=>{const f=fixture();f.mask=null;assert.throws(()=>analyse(f),/outline unavailable/);});
test('all four analysed views are required; old photo-only scans cannot be treated as measurements',()=>assert.throws(()=>combine({front:{dataUrl:'old'}}),/four views/));
test('inconsistent front/back scans are rejected',()=>{
 const views=Object.fromEntries(['front','back','left','right'].map(view=>[view,{shape:analyse(fixture({view}))}]));
 views.back.shape.torso.forEach(r=>r.width*=2);assert.throws(()=>combine(views),/differ too much/);
});

test('touching arms do not become the full torso width',()=>{
 const f=fixture();
 for(const [a,b,y] of [[11,12,.23],[13,14,.4],[15,16,.57]]){f.landmarks[a]={x:.29,y,visibility:.95};f.landmarks[b]={x:.71,y,visibility:.95};}
 for(let y=Math.ceil(.24*f.height);y<.55*f.height;y++)for(let x=Math.floor(.25*f.width);x<=.75*f.width;x++)f.mask[y*f.width+x]=1;
 const result=analyse(f),raw=.5*.5/(.95-.06);
 assert.ok(result.torso[12].width<raw*.8,'sleeves excluded from connected silhouette');
});
test('fitted profile retains measured joint heights and head dimensions',()=>{
 const views=Object.fromEntries(['front','back','left','right'].map(view=>[view,{shape:analyse(fixture({view}))}]));
 const p=combine(views);assert.equal(p.version,2);assert.equal(p.joints.wrist.y,views.front.shape.joints.wrist.y);
 assert.ok(p.headWidth>0&&p.headWidth<.15);assert.equal(p.limbProfiles.thigh.length,5);
});
