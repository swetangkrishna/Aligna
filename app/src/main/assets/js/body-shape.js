/* Visible-shape estimation only. No inference of weight, fat or muscle mass. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AlignaBodyShape = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mean = a => a.reduce((s,v) => s+v,0)/a.length;
  const mid = (a,b) => ({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  function analyse({landmarks:p, mask, width:w, height:h, imageWidth, imageHeight, view}) {
    if (!p || p.length < 33 || !mask || mask.length !== w*h) throw Error('Body outline unavailable. Retake in brighter, even light.');
    if (![w,h,imageWidth,imageHeight].every(v=>Number.isFinite(v)&&v>0)) throw Error('Invalid camera dimensions.');
    const side = view==='left'||view==='right';
    const visible = i => p[i] && Number.isFinite(p[i].x) && Number.isFinite(p[i].y) && (p[i].visibility ?? 0) > .45;
    for(const pair of [[11,12],[23,24],[25,26],[27,28]]) {
      if (!(side ? pair.some(visible) : pair.every(visible))) throw Error('Keep shoulders, hips, knees and feet visible.');
    }
    const inside = (x,y) => x>=0&&x<w&&y>=0&&y<h&&mask[Math.floor(y)*w+Math.floor(x)]>.65;
    let top=h,bottom=0,left=w,right=0,count=0;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(inside(x,y)) {top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);count++;}
    if(bottom-top<h*.45 || top<h*.015 || bottom>h*.985 || left<w*.015 || right>w*.985 || count<w*h*.025) throw Error('Step back until your entire body fits inside the frame.');
    const span=(bottom-top)/h, aspect=imageWidth/imageHeight;
    const shoulder=mid(p[11],p[12]), hip=mid(p[23],p[24]);
    if(hip.y-shoulder.y<span*.16) throw Error('Stand upright and face the requested direction.');
    if(Math.abs(p[11].y-p[12].y)>span*.08 && !side) throw Error('Keep the camera level and both shoulders relaxed.');
    const shoulderSpan=Math.abs(p[11].x-p[12].x)*aspect/span;
    if(!side && shoulderSpan<.12) throw Error('Turn fully toward or away from the camera for this view.');
    if(side && shoulderSpan>.17) throw Error('Turn sideways so your shoulders overlap in the camera.');
    // Follow the torso centre; do not use the full row, which can include arms.
    const rowBounds=(y,cx)=>{
      const row=clamp(Math.round(y*h),0,h-1), centre=clamp(Math.round(cx*w),0,w-1);
      if(!inside(centre,row)) throw Error('Body outline is unclear. Use a plain background and fitted clothing.');
      let a=centre,b=centre; while(a>0&&inside(a-1,row))a--;while(b<w-1&&inside(b+1,row))b++;
      return {width:(b-a+1)/w*aspect/span,centre:((a+b)/2/w-hip.x)*aspect/span};
    };
    const rowWidth=(y,cx)=>rowBounds(y,cx).width;
    // At attached arms, a connected mask row includes both torso and sleeves.
    // Estimate each sleeve radius from its outer edge, then stop at its inner edge.
    function torsoWidth(y,cx) {
      const raw=rowWidth(y,cx);
      if(side)return raw;
      let lo=cx-raw*span/aspect/2,hi=cx+raw*span/aspect/2;
      for(const chain of [[11,13,15],[12,14,16]])for(let i=0;i<2;i++){
        const a=p[chain[i]],b=p[chain[i+1]];
        if(y<Math.min(a.y,b.y)||y>Math.max(a.y,b.y)||Math.abs(b.y-a.y)<.015)continue;
        const t=(y-a.y)/(b.y-a.y),x=a.x+(b.x-a.x)*t;
        const direction=x<cx?-1:1,row=Math.round(y*h);let edge=Math.round(x*w);
        if(!inside(edge,row))continue;
        const start=edge;while(inside(edge+direction,row))edge+=direction;
        const radius=Math.abs(edge-start)/w;
        if(radius*aspect/span<.012||radius*aspect/span>.07)continue;
        const inner=x-direction*radius;
        if(direction<0)lo=Math.max(lo,inner);else hi=Math.min(hi,inner);
      }
      return Math.max(raw*.5,(hi-lo)*aspect/span);
    }
    const torso=[];
    for(let i=0;i<25;i++){
      const t=i/24,y=shoulder.y+(hip.y-shoulder.y)*t;
      const width=torsoWidth(y,shoulder.x+(hip.x-shoulder.x)*t);
      if(width<.065||width>.55) throw Error('Keep arms slightly away from your torso, then retake.');
      torso.push({t,width,centre:side?rowBounds(y,shoulder.x+(hip.x-shoulder.x)*t).centre*Math.sign(p[0].x-hip.x):0});
    }
    // Smooth segmentation noise without replacing the individual shape with a body-type preset.
    const smooth=torso.map((r,i)=>({...r,width:mean(torso.slice(Math.max(0,i-2),i+3).map(x=>x.width))}));
    const distance=(a,b)=>Math.hypot((a.x-b.x)*aspect,a.y-b.y)/span;
    function limb(a,b,t) {
      const pa=p[a],pb=p[b],cx=(pa.x+(pb.x-pa.x)*t)*w,cy=(pa.y+(pb.y-pa.y)*t)*h;
      const dx=(pb.x-pa.x)*imageWidth,dy=(pb.y-pa.y)*imageHeight;
      const norm=Math.hypot(dx,dy); if(!norm) return null;
      const nx=-dy/norm,ny=dx/norm;
      const step=1/Math.max(w,h);
      let ends=[];
      for(const direction of [-1,1]) {
        let d=0;
        while(d<.12 && inside(cx+direction*nx*d/aspect*w,cy+direction*ny*d*h))d+=step;
        ends.push(d);
      }
      const diameter=2*Math.min(...ends)/span;
      return diameter>.012 && diameter<.18 ? diameter : null;
    }
    const both=(pairs,t)=>{const vals=pairs.map(([a,b])=>limb(a,b,t)).filter(v=>v!==null);return vals.length?mean(vals):null;};
    const stations=[.12,.3,.5,.7,.88];
    const limbProfiles={};
    for(const [name,pairs] of Object.entries({upperArm:[[11,13],[12,14]],forearm:[[13,15],[14,16]],thigh:[[23,25],[24,26]],calf:[[25,27],[26,28]]})){
      limbProfiles[name]=stations.map(t=>({t,width:both(pairs,t)}));
    }
    const joints={};
    for(const [name,a,b] of [['shoulder',11,12],['elbow',13,14],['wrist',15,16],['hip',23,24],['knee',25,26],['ankle',27,28]]){
      joints[name]={x:Math.abs(p[a].x-p[b].x)*aspect/span/2,y:(mid(p[a],p[b]).y-top/h)/span};
    }
    const headWidths=[.045,.07,.095].map(t=>rowWidth(top/h+t*span,shoulder.x));
    return {version:2,view,torso:smooth,shoulderSpan,joints,limbProfiles,
      headWidth:clamp(mean(headWidths),.055,.14),
      headHeight:clamp(((p[0].y-top/h)/span)+.06,.105,.17),
      shoulderY:(shoulder.y-top/h)/span,hipY:(hip.y-top/h)/span,
      upperArm:both([[11,13],[12,14]],.5),forearm:both([[13,15],[14,16]],.45),
      thigh:both([[23,25],[24,26]],.4),calf:both([[25,27],[26,28]],.4),
      armLength:mean([distance(p[11],p[13])+distance(p[13],p[15]),distance(p[12],p[14])+distance(p[14],p[16])]),
      kneeY:(mid(p[25],p[26]).y-top/h)/span,
      ankleY:(mid(p[27],p[28]).y-top/h)/span,
      silhouetteCoverage:count/(w*h),method:'pose-and-visible-silhouette',muscleMass:null};
  }
  function combine(views) {
    const required=['front','back','left','right'];
    if(required.some(k=>!views[k]?.shape))throw Error('Retake all four views to create your avatar.');
    const [f,b,l,r]=required.map(k=>views[k].shape);
    const difference=(a,b)=>Math.abs(a-b)/Math.max(a,b);
    if(mean(f.torso.map((v,i)=>difference(v.width,b.torso[i].width)))>.25 || mean(l.torso.map((v,i)=>difference(v.width,r.torso[i].width)))>.3) throw Error('The views differ too much. Keep the same posture and fitted clothing for all four photos.');
    const avg=(key,fallback)=>{const a=[f,b].map(x=>x[key]).filter(x=>Number.isFinite(x)&&x>0);return a.length?mean(a):fallback;};
    const joints={};
    if(f.joints&&b.joints)for(const key of Object.keys(f.joints))joints[key]={x:mean([f.joints[key].x,b.joints[key].x]),y:mean([f.joints[key].y,b.joints[key].y])};
    const limbProfiles={};
    for(const key of ['upperArm','forearm','thigh','calf']){
      if(f.limbProfiles?.[key]&&b.limbProfiles?.[key])limbProfiles[key]=f.limbProfiles[key].map((v,i)=>{
        const widths=[v.width,b.limbProfiles[key][i].width].filter(x=>Number.isFinite(x)&&x>0);
        const depths=[l.limbProfiles?.[key]?.[i]?.width,r.limbProfiles?.[key]?.[i]?.width].filter(x=>Number.isFinite(x)&&x>0);
        const width=widths.length?mean(widths):avg(key,.05);
        return {t:v.t,width,depth:depths.length&&mean(depths)<width*1.35?clamp(mean(depths),width*.65,width*1.35):width};
      });
    }
    return {version:2,joints,limbProfiles,headWidth:avg('headWidth',.085),headHeight:avg('headHeight',.135),
      headDepth:mean([l.headWidth||.105,r.headWidth||.105]),createdAt:new Date().toISOString(),method:'four-view-visible-shape',muscleMass:null,
      torso:f.torso.map((v,i)=>({t:v.t,width:mean([v.width,b.torso[i].width]),depth:mean([l.torso[i].width,r.torso[i].width]),centre:mean([l.torso[i].centre||0,r.torso[i].centre||0])})),
      shoulderY:avg('shoulderY',.2),hipY:avg('hipY',.54),kneeY:avg('kneeY',.75),ankleY:avg('ankleY',.94),
      shoulderSpan:avg('shoulderSpan',.2),armLength:clamp(avg('armLength',.35),.25,.48),
      upperArm:avg('upperArm',.055),forearm:avg('forearm',.043),thigh:avg('thigh',.1),calf:avg('calf',.067)};
  }
  return {analyse,combine};
});
