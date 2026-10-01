const {test}=require('node:test');const assert=require('node:assert/strict');
const {build,field}=require('../app/src/main/assets/js/body-mesh.js');
const profile={shoulderY:.19,hipY:.53,kneeY:.74,ankleY:.94,shoulderSpan:.19,armLength:.32,upperArm:.055,forearm:.045,thigh:.085,calf:.06,headWidth:.085,headHeight:.14,headDepth:.105,torso:Array.from({length:25},(_,i)=>({t:i/24,width:.19,depth:.12}))};
test('surface preserves torso diameter in both front and side views',()=>{
 const f=field(profile);assert.ok(Math.abs(f(.095,.36,0))<.001);assert.ok(Math.abs(f(0,.36,.06))<.001);
 assert.ok(f(.105,.36,0)>0);assert.ok(f(0,.36,.07)>0);
});
test('continuous body mesh is finite, watertight and connected',()=>{
 const m=build(profile,.014);assert.ok(m.positions.length>1000);assert.ok(m.positions.every(Number.isFinite));
 const edges=new Map(),neighbors=Array.from({length:m.positions.length/3},()=>[]);
 for(let i=0;i<m.indices.length;i+=3){const tri=m.indices.slice(i,i+3);for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],key=a<b?a+':'+b:b+':'+a;edges.set(key,(edges.get(key)||0)+1);neighbors[a].push(b);neighbors[b].push(a);}}
 assert.ok([...edges.values()].every(n=>n===2),'each edge has exactly two faces');
 const seen=new Set([0]),queue=[0];while(queue.length){for(const n of neighbors[queue.pop()])if(!seen.has(n)){seen.add(n);queue.push(n);}}
 assert.equal(seen.size,neighbors.length,'no disconnected body parts');
 const ys=m.positions.filter((_,i)=>i%3===1);assert.ok(Math.max(...ys)<=1.02);assert.ok(Math.min(...ys)>=-1.06);
});
test('wider profiles preserve additional torso volume',()=>{
 const f=field(profile),wide=field({...profile,torso:profile.torso.map(r=>({...r,width:.26}))});
 assert.ok(f(.105,.4,.03)>0);assert.ok(wide(.105,.4,.03)<0);
});
