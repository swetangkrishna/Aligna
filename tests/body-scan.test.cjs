const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {JSDOM}=require('jsdom');const {IDBFactory}=require('fake-indexeddb');
const source=fs.readFileSync(require.resolve('../app/src/main/assets/js/body-scan.js'),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,15));
function setup(){
 const dom=new JSDOM('<button id="alignaBodyScanOpen"></button><div id="neoAvatarStage"></div><div id="alignaBodyScanOverlay" class="hidden"></div><strong id="alignaBodyScanEntryTitle"></strong><small id="alignaBodyScanEntryStatus"></small>',{runScripts:'outside-only',url:'https://app.test'});
 const w=dom.window;w.indexedDB=new IDBFactory();w.AlignaAvatarView=class{constructor(host,p){host.textContent=p.marker;}dispose(){}view(){}};w.eval(source);
 const auth=id=>w.dispatchEvent(new w.CustomEvent('aligna-auth-session',{detail:{success:!!id,data:{user:{id}}}}));
 return{dom,w,auth,$:id=>w.document.getElementById(id)};
}
async function seed(w,owner,marker){const db=await new Promise((resolve,reject)=>{const r=w.indexedDB.open('AlignaAvatarV2',1);r.onupgradeneeded=()=>r.result.createObjectStore('profiles',{keyPath:'owner'});r.onsuccess=()=>resolve(r.result);r.onerror=reject;});await new Promise((resolve,reject)=>{const tx=db.transaction('profiles','readwrite');tx.objectStore('profiles').put({owner,profile:{marker},captures:{}});tx.oncomplete=resolve;tx.onerror=reject;});db.close();}
test('saved avatars are scoped to the signed-in account and cleared on logout',async()=>{
 const {dom,w,auth,$}=setup();await seed(w,'alice','ALICE SHAPE');await seed(w,'bob','BOB SHAPE');auth('alice');await tick();assert.match($('neoAvatarStage').textContent,/ALICE SHAPE/);auth('bob');await tick();assert.match($('neoAvatarStage').textContent,/BOB SHAPE/);assert.doesNotMatch($('neoAvatarStage').textContent,/ALICE/);auth(null);await tick();assert.doesNotMatch($('neoAvatarStage').textContent,/BOB/);dom.window.close();
});
test('camera acquired after closing is immediately stopped',async()=>{
 const {dom,w,auth,$}=setup();let resolveCamera,stopped=0;Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:()=>new Promise(r=>{resolveCamera=r;})}});auth('alice');await tick();$('alignaBodyScanOpen').click();$('scanStart').click();assert.equal($('scanCapture').hidden,false);$('scanClose').click();resolveCamera({getTracks:()=>[{stop:()=>stopped++}]});await tick();assert.equal(stopped,1);assert.equal($('alignaBodyScanOverlay').classList.contains('hidden'),true);dom.window.close();
});
test('camera permission failure exposes retry and leaves no stuck capture',async()=>{
 const {dom,w,auth,$}=setup();Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:async()=>{const e=Error();e.name='NotAllowedError';throw e;}}});auth('alice');await tick();$('alignaBodyScanOpen').click();$('scanStart').click();await tick();assert.match($('scanMessage').textContent,/Camera permission/);assert.equal($('scanShutter').disabled,false);dom.window.close();
});
test('deleting one scan cannot remove another account’s profile',async()=>{
 const {dom,w,auth,$}=setup();await seed(w,'alice','ALICE SHAPE');await seed(w,'bob','BOB SHAPE');auth('alice');await tick();$('alignaBodyScanOpen').click();$('scanDelete').click();assert.match($('scanDelete').textContent,/Tap again/);$('scanDelete').click();await tick();assert.doesNotMatch($('neoAvatarStage').textContent,/ALICE SHAPE/);auth('bob');await tick();assert.match($('neoAvatarStage').textContent,/BOB SHAPE/);dom.window.close();
});

test('existing photos open the picker without starting the camera',async()=>{
 const {dom,w,auth,$}=setup();let picked=0,cameras=0;
 Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:()=>{cameras++;}}});
 auth('alice');await tick();$('scanPhotoFile').click=()=>picked++;
 $('alignaBodyScanOpen').click();$('scanStartUpload').click();
 assert.equal(picked,1);assert.equal(cameras,0);assert.equal($('scanCapture').hidden,false);
 Object.defineProperty($('scanPhotoFile'),'files',{value:[new w.File(['x'],'test.gif',{type:'image/gif'})]});
 await $('scanPhotoFile').onchange();assert.match($('scanMessage').textContent,/JPG, PNG or WebP/);
 dom.window.close();
});
test('closing during photo decoding discards and releases the image',async()=>{
 const {dom,w,auth,$}=setup();let finish,closed=0;
 w.createImageBitmap=()=>new Promise(r=>finish=r);
 auth('alice');await tick();$('scanPhotoFile').click=()=>{};
 $('alignaBodyScanOpen').click();$('scanStartUpload').click();
 Object.defineProperty($('scanPhotoFile'),'files',{value:[new w.File(['x'],'test.jpg',{type:'image/jpeg'})]});
 const pending=$('scanPhotoFile').onchange();$('scanClose').click();
 finish({width:600,height:1000,close:()=>closed++});await pending;
 assert.equal(closed,1);assert.equal($('scanPreview').hidden,true);assert.equal($('scanUpload').disabled,false);
 dom.window.close();
});
test('saved scans expose rebuilding and source comparison without starting the camera',async()=>{
 const {dom,w,auth,$}=setup();await seed(w,'alice','SAVED');auth('alice');await tick();$('alignaBodyScanOpen').click();
 assert.equal($('scanRefit').hidden,false);assert.equal($('scanSourcePhoto').hidden,true);
 $('scanCompare').click();assert.equal($('scanSourcePhoto').hidden,false);
 $('scanCompare').click();assert.equal($('scanSourcePhoto').hidden,true);dom.window.close();
});
