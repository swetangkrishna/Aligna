(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const overlay=$('alignaBodyScanOverlay'),open=$('alignaBodyScanOpen'),stage=$('neoAvatarStage');
  if(!overlay||!open||!stage)return;
  const views=[['front','Face the camera','Stand tall, feet apart, arms slightly away from your body.'],['back','Turn away','Keep the same stance with your back facing the camera.'],['left','Turn to your left side','Stand sideways, left shoulder closest. Hold your arms slightly forward to keep your torso outline clear.'],['right','Turn to your right side','Right shoulder closest. Match your posture and keep your arms slightly forward.']];
  let user=null,saved=null,draft={},index=0,preview=null,stream=null,tracker=null,trackerPromise=null,renderers=[],hero=null,epoch=0,busy=false,facing='user',timer=null;
  overlay.innerHTML=`<div class="scan-shell" role="dialog" aria-modal="true" aria-labelledby="scanTitle">
    <header class="scan-head"><span class="scan-brand">ALIGNA <em>/ BODY STUDIO</em></span><button id="scanClose" class="scan-icon" aria-label="Close body studio">×</button></header>
    <div class="scan-steps" id="scanSteps" aria-label="Scan progress"></div>
    <main class="scan-main">
      <div class="scan-intro"><span class="scan-eyebrow" id="scanEyebrow">YOUR SHAPE, YOUR AVATAR</span><h2 id="scanTitle">A little more you.</h2><p id="scanSubtitle">Four guided views create an estimate of your visible body shape.</p></div>
      <p id="scanMessage" class="scan-message" role="status" aria-live="polite"></p>
      <section id="scanWelcome"><div class="scan-prep"><span>01</span><div><strong>Make room for the full picture</strong><p>Prop your phone upright at waist height. Stand 2–3 metres away with your head and feet visible.</p></div></div><div class="scan-prep"><span>02</span><div><strong>Keep the outline clear</strong><p>Use even light, a plain background and fitted clothing. Loose clothing changes the shape we see.</p></div></div><div class="scan-prep"><span>03</span><div><strong>Stay in control</strong><p>Photos and the avatar stay on this device, separate from your cloud account data. You can delete them here.</p></div></div><p class="scan-note">This estimates visible proportions. A camera cannot measure muscle mass, body fat or what is beneath clothing.</p><button id="scanStart" class="scan-primary">Start guided scan <span>→</span></button></section>
      <section id="scanCapture" hidden><div class="scan-camera"><video id="scanVideo" autoplay muted playsinline></video><svg class="scan-guide" viewBox="0 0 240 440" aria-hidden="true"><rect x="20" y="8" width="200" height="424" rx="70"/><path d="M120 8v424M20 218h200"/></svg><span id="scanCount" class="scan-count"></span><img id="scanPreview" alt="Captured view" hidden/><button id="scanFlip" class="scan-flip" aria-label="Switch camera">↻</button><span class="scan-camera-label">FULL BODY · EVEN LIGHT</span></div><div id="scanCaptureActions"><p class="scan-note">Move into position. Capture starts after a 5-second timer.</p><button id="scanShutter" class="scan-primary">Capture this view</button></div><div id="scanPreviewActions" hidden><p class="scan-note">Check that the whole body is visible and the requested view is correct.</p><div class="scan-actions"><button id="scanRetake" class="scan-secondary">Retake</button><button id="scanAccept" class="scan-primary">Use this view →</button></div></div></section>
      <section id="scanReview" hidden><div class="scan-review-grid" id="scanPhotos"></div><p class="scan-note">Check all four views. The avatar follows your outline and proportions; clothing and camera angle affect the estimate.</p><button id="scanBuild" class="scan-primary">Create my avatar →</button></section>
      <section id="scanResult" hidden><div class="scan-avatar" id="scanAvatar"></div><div class="scan-views" id="scanViews"><button data-view="front">Front</button><button data-view="left">Side</button><button data-view="back">Back</button></div><div class="scan-result-meta"><span class="scan-pill">ESTIMATED SHAPE</span><span>Drag to rotate</span></div><div class="scan-facts"><div><span>Built from</span><strong>Your four views</strong></div><div><span>Reflects</span><strong>Visible proportions</strong></div><div><span>Muscle mass</span><strong>Not measured</strong></div></div><p class="scan-note">Shoulders, torso depth, waist, hips and limb fullness follow the captured outlines. Face, hands and surface detail are simplified.</p><div class="scan-actions"><button id="scanRescan" class="scan-secondary">New scan</button><button id="scanSave" class="scan-primary">Save avatar</button></div><button id="scanDelete" class="scan-delete" hidden>Delete saved scan and photos</button></section>
    </main></div>`;
  const video=$('scanVideo'),message=$('scanMessage');
  const panels=['scanWelcome','scanCapture','scanReview','scanResult'];
  const notify=text=>{message.textContent=text;};
  function screen(id){panels.forEach(p=>$(p).hidden=p!==id);$('scanSteps').innerHTML=views.map(([key],i)=>`<span class="${draft[key]?'done':i===index&&id==='scanCapture'?'current':''}">${i+1} ${key}</span>`).join('');}
  function headings(kicker,title,subtitle){$('scanEyebrow').textContent=kicker;$('scanTitle').textContent=title;$('scanSubtitle').textContent=subtitle;}
  async function dbAction(mode,operation){
    if(!user)throw Error('Sign in to create your personal avatar.');
    const owner=user;
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('AlignaAvatarV2',1);r.onupgradeneeded=()=>r.result.createObjectStore('profiles',{keyPath:'owner'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    return new Promise((resolve,reject)=>{const tx=db.transaction('profiles',mode);const req=operation(tx.objectStore('profiles'),owner);let value;req.onsuccess=()=>{value=req.result;};tx.oncomplete=()=>{db.close();resolve(value);};tx.onerror=tx.onabort=()=>{db.close();reject(tx.error||Error('Could not save on this device.'));};});
  }
  function stop(){epoch++;clearInterval(timer);timer=null;busy=false;$('scanShutter').disabled=false;$('scanCount').textContent='';stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;}
  function disposeResult(){renderers.forEach(r=>r.dispose());renderers=[];}
  function viewer(host,shape){try{return new AlignaAvatarView(host,shape);}catch(e){host.textContent='3D preview is unavailable on this device. Your scan is still saved; try a newer Android WebView.';return null;}}
  function heroUpdate(){
    hero?.dispose();hero=null;
    stage.classList.add('body-avatar-stage');
    stage.innerHTML=saved?`<div class="body-avatar-canvas" id="bodyAvatarCanvas"></div><span class="body-avatar-badge">YOUR SCAN · ESTIMATED SHAPE</span><div class="scan-views body-avatar-controls"><button data-angle="front">Front</button><button data-angle="left">Side</button><button data-angle="back">Back</button></div><p class="body-avatar-caption">Drag to rotate · muscle mass not measured</p>`:`<div class="body-avatar-empty"><span>◎</span><h3>Your shape belongs here.</h3><p>Create an avatar from four guided camera views.</p><button id="bodyAvatarBegin" class="scan-secondary">Create my avatar →</button></div>`;
    if(saved){hero=viewer($('bodyAvatarCanvas'),saved.profile);stage.querySelectorAll('[data-angle]').forEach(b=>b.onclick=()=>hero?.view(b.dataset.angle));}
    else $('bodyAvatarBegin').onclick=()=>open.click();
    $('alignaBodyScanEntryTitle').textContent=saved?'Your body avatar':'Create body avatar';
    $('alignaBodyScanEntryStatus').textContent=saved?'View, rescan or delete · saved on this device':'Four camera views · personal shape estimate';
  }
  async function ensureTracker(){
    if(tracker)return tracker;if(trackerPromise)return trackerPromise;
    trackerPromise=(async()=>{
      notify('Loading body analysis. Internet is needed the first time.');
      const {FilesetResolver,PoseLandmarker}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/+esm');
      const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm');
      const opts={baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task'},runningMode:'IMAGE',numPoses:2,outputSegmentationMasks:true,minPoseDetectionConfidence:.5,minPosePresenceConfidence:.5};
      try{tracker=await PoseLandmarker.createFromOptions(files,{...opts,baseOptions:{...opts.baseOptions,delegate:'GPU'}});}catch(e){tracker=await PoseLandmarker.createFromOptions(files,opts);}
      return tracker;
    })();
    try{return await trackerPromise;}finally{trackerPromise=null;}
  }
  async function camera(){
    stop();const token=epoch;
    try{
      notify('Opening camera…');
      const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:720},height:{ideal:1280}},audio:false});
      if(token!==epoch){media.getTracks().forEach(t=>t.stop());return;}
      stream=media;video.srcObject=media;video.dataset.facing=facing;await video.play();
      $('scanShutter').disabled=true;await ensureTracker();
      if(token!==epoch)return;
      $('scanShutter').disabled=false;notify('Ready. Check that your head and feet are inside the frame.');
    }catch(e){if(token!==epoch)return;stop();$('scanShutter').disabled=false;notify(e.name==='NotAllowedError'?'Camera permission is needed. Allow it in Android Settings, then tap Capture to retry.':'Could not start body analysis. Check your connection and camera permission, then tap Capture to retry.');}
  }
  function captureStep(){
    preview=null;$('scanPreview').hidden=true;$('scanPreview').removeAttribute('src');$('scanPreviewActions').hidden=true;$('scanCaptureActions').hidden=false;
    const [key,title,text]=views[index];headings(`VIEW ${index+1} OF 4 · ${key.toUpperCase()}`,title,text);screen('scanCapture');notify('');
  }
  async function start(){
    stop();disposeResult();draft={};index=0;captureStep();await camera();
  }
  function takePhoto(){
    if(busy)return;if(!stream||!tracker){camera();return;}
    busy=true;const token=epoch;let remaining=5;
    $('scanShutter').disabled=true;$('scanCount').textContent=remaining;notify('Hold still. Keep your whole body visible.');
    timer=setInterval(()=>{
      if(token!==epoch){clearInterval(timer);return;}
      remaining--;$('scanCount').textContent=remaining||'…';
      if(remaining>0)return;
      clearInterval(timer);timer=null;
      requestAnimationFrame(()=>{
        if(token!==epoch)return;
        try{
          const canvas=document.createElement('canvas');const scale=Math.min(1,1000/video.videoHeight);
          canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
          if(!canvas.width||!canvas.height)throw Error('The camera is not ready. Try again.');
          // Unmirrored pixels feed both the photo and analysis; dimensions stay identical.
          canvas.getContext('2d',{willReadFrequently:true}).drawImage(video,0,0,canvas.width,canvas.height);
          const result=tracker.detect(canvas);
          let shape;
          try{
            if(result.landmarks.length!==1)throw Error('Only one person should be visible. Adjust the framing and retake.');
            const mask=result.segmentationMasks?.[0];
            if(!mask)throw Error('Body outline unavailable. Use brighter light and a plain background.');
            shape=AlignaBodyShape.analyse({landmarks:result.landmarks[0],mask:mask.getAsFloat32Array(),width:mask.width,height:mask.height,imageWidth:canvas.width,imageHeight:canvas.height,view:views[index][0]});
          }finally{result.close();}
          preview={view:views[index][0],dataUrl:canvas.toDataURL('image/jpeg',.85),shape,capturedAt:new Date().toISOString()};
          $('scanPreview').src=preview.dataUrl;$('scanPreview').hidden=false;$('scanCaptureActions').hidden=true;$('scanPreviewActions').hidden=false;notify('Outline captured. Check the photo before continuing.');
        }catch(e){notify(e.message||'Could not analyse this photo. Please retake.');}
        finally{busy=false;$('scanShutter').disabled=false;$('scanCount').textContent='';}
      });
    },1000);
  }
  function review(){
    stop();headings('FOUR VIEWS CAPTURED','Make sure it looks right.','You can retake any view before building your avatar.');screen('scanReview');notify('');
    $('scanPhotos').replaceChildren();
    for(const [key] of views){const card=document.createElement('button');card.className='scan-photo';card.type='button';const img=document.createElement('img');img.src=draft[key].dataUrl;img.alt=key+' body capture';const label=document.createElement('span');label.textContent=key+' · retake';card.append(img,label);card.onclick=async()=>{index=views.findIndex(v=>v[0]===key);captureStep();await camera();};$('scanPhotos').append(card);}
  }
  function result(profile,isSaved){
    disposeResult();screen('scanResult');headings('BODY AVATAR','A shape that starts with you.','An approximate 3D shape, built from your front, back and side outlines.');
    const v=viewer($('scanAvatar'),profile);if(v)renderers.push(v);
    $('scanViews').querySelectorAll('button').forEach(b=>b.onclick=()=>v?.view(b.dataset.view));
    $('scanSave').textContent=isSaved?'Done':'Save avatar';$('scanSave').disabled=false;$('scanDelete').hidden=!isSaved;
    $('scanSave').onclick=async()=>{
      if(isSaved){close();return;}const owner=user,token=epoch;
      $('scanSave').disabled=true;
      try{const record={owner,profile,captures:draft};await dbAction('readwrite',s=>s.put(record));if(owner!==user||token!==epoch)return;saved=record;heroUpdate();notify('Saved on this device. Photos were not uploaded.');result(profile,true);}
      catch(e){notify('Could not save your avatar. Free some device storage and try again.');}
      finally{$('scanSave').disabled=false;}
    };
  }
  async function openStudio(){
    if(!user){notify('Sign in first.');return;}
    overlay.classList.remove('hidden');overlay.setAttribute('aria-hidden','false');document.body.classList.add('aligna-body-scan-open');$('scanClose').focus();notify('');
    if(saved){draft=saved.captures;result(saved.profile,true);}else{headings('YOUR SHAPE, YOUR AVATAR','A little more you.','Four guided views create an estimate of your visible body shape.');screen('scanWelcome');}
  }
  function close(){deleteArmed=false;$('scanDelete').textContent='Delete saved scan and photos';stop();disposeResult();overlay.classList.add('hidden');overlay.setAttribute('aria-hidden','true');document.body.classList.remove('aligna-body-scan-open');draft={};preview=null;open.focus();}
  $('scanClose').onclick=close;$('scanStart').onclick=start;$('scanShutter').onclick=takePhoto;
  $('scanFlip').onclick=async()=>{facing=facing==='user'?'environment':'user';captureStep();await camera();};
  $('scanRetake').onclick=()=>{preview=null;captureStep();};
  $('scanAccept').onclick=async()=>{if(!preview)return;draft[views[index][0]]=preview;const next=views.findIndex(([key])=>!draft[key]);if(next<0){review();return;}index=next;captureStep();};
  $('scanBuild').onclick=()=>{try{const profile=AlignaBodyShape.combine(draft);notify('');result(profile,false);}catch(e){notify(e.message);}};
  $('scanRescan').onclick=start;
  let deleteArmed=false;
  $('scanDelete').onclick=async()=>{
    if(!deleteArmed){deleteArmed=true;$('scanDelete').textContent='Tap again to permanently delete this scan';return;}
    const owner=user;
    try{await dbAction('readwrite',(s,id)=>s.delete(id));if(owner!==user)return;saved=null;draft={};heroUpdate();close();}catch(e){notify('Could not delete this scan. Try again.');}
    finally{deleteArmed=false;$('scanDelete').textContent='Delete saved scan and photos';}
  };
  open.onclick=openStudio;
  async function session(event){
    const id=event.detail?.success?event.detail?.data?.user?.id:null;
    if(id===user)return;
    close();user=id||null;saved=null;heroUpdate();if(!user)return;
    const owner=user;
    try{const record=await dbAction('readonly',(s,id)=>s.get(id));if(owner!==user)return;saved=record||null;heroUpdate();}catch(e){notify('Saved scan could not be loaded.');}
  }
  ['aligna-auth-login','aligna-auth-register','aligna-auth-session'].forEach(name=>window.addEventListener(name,session));
  ['aligna-auth-logout','aligna-auth-expired'].forEach(name=>window.addEventListener(name,()=>session({detail:{success:false}})));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(!overlay.classList.contains('hidden')&&!$('scanCapture').hidden)notify('Camera paused. Tap Capture to restart.');}});
  window.addEventListener('pagehide',()=>{stop();tracker?.close();tracker=null;});
  overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){close();return;}if(e.key==='Tab'){const buttons=[...overlay.querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length);if(!buttons.length)return;const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  heroUpdate();
})();
