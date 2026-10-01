const {test,afterEach}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(require.resolve('../app/src/main/assets/index.html'),'utf8');const read=n=>fs.readFileSync(require.resolve('../app/src/main/assets/js/'+n+'.js'),'utf8');
const activeDoms=[];afterEach(()=>{activeDoms.splice(0).forEach(d=>d.window.close());});
async function setup(state){const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://app.test',pretendToBeVisual:true});activeDoms.push(dom);const w=dom.window,d=w.document;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true});w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 if(state)w.localStorage.setItem('aligna_state',JSON.stringify(state));
 w.eval(read('food-rules'));w.eval([...d.querySelectorAll('script:not([src])')][1].textContent);w.eval(read('modern-ui'));w.eval(read('experience'));await new Promise(r=>setTimeout(r,20));return{dom,w,d};}
test('Settings opens and saves existing profile controls; Start goes to training',async()=>{
 const {dom,w,d}=await setup();d.getElementById('openSettings').click();assert.ok(d.getElementById('sheet').classList.contains('show'));d.getElementById('setHeight').value='178';await d.getElementById('closeSettings').onclick();assert.equal(w.AlignaFeatures.snapshot().profile.heightCm,178);assert.equal(d.getElementById('sheet').classList.contains('show'),false);
 d.querySelector('.pulse-start').click();assert.equal(d.getElementById('view-train').classList.contains('hidden'),false);dom.window.close();
});
test('custom recipes and dietary choices survive reload and enter the weekly plan',async()=>{
 let {dom,w,d}=await setup();await w.AlignaFeatures.saveProfile({dietaryPreference:'vegan',allergies:['milk'],favoriteMeals:['Dal & rice']});await w.AlignaFeatures.addMeal({name:'Family dal',cuisine:'Indian',ingredients:'Lentils\nRice',steps:'Cook.',calories:410});
 const card=[...d.querySelectorAll('.idea')].find(n=>n.textContent.includes('Family dal'));assert.ok(card);card.querySelector('.addplan').click();const state=w.AlignaAppState.export();assert.ok(state.weekPlan.length);dom.window.close();
 ({dom,w,d}=await setup(state));d.querySelector('.tab[data-v=ideas]').click();assert.equal(w.AlignaFeatures.snapshot().profile.dietaryPreference,'vegan');assert.equal(w.AlignaFeatures.snapshot().customMeals.length,1);assert.match(d.getElementById('weekPlanList').textContent,/Family dal/);dom.window.close();
});
test('custom recipe text cannot inject markup and conflicting foods are filtered',async()=>{
 const {dom,w,d}=await setup();await w.AlignaFeatures.addMeal({name:'<img src=x onerror=alert(1)>',ingredients:'Rice',calories:100});assert.equal(d.querySelectorAll('#ideaList img[src="x"]').length,0);
 await w.AlignaFeatures.saveProfile({dietaryPreference:'vegan',allergies:['milk','eggs','peanuts']});assert.doesNotMatch(d.getElementById('ideaList').textContent,/Avocado toast \+ egg/);dom.window.close();
});
test('product lookup ignores responses after closing the dialog',async()=>{
 const {dom,w,d}=await setup();let id;w.AlignaProducts={lookup:(code,request)=>{id=request;}};d.querySelector('.pulse-tool.cyan').click();const form=d.querySelector('#pulseDialogBody form');form.querySelector('input').value='3017620422003';form.dispatchEvent(new w.Event('submit',{cancelable:true}));d.querySelector('.pulse-close').click();w.dispatchEvent(new w.CustomEvent('aligna-product-result',{detail:{requestId:id,data:{product:{product_name:'Late response'}}}}));assert.doesNotMatch(d.getElementById('pulseDialogBody').textContent,/Late response/);dom.window.close();
});
test('discovery is optional and saves explicit choices without inferring metabolism',async()=>{
 const {dom,w,d}=await setup();d.querySelector('.pulse-discover').click();d.querySelector('.pulse-picks button').click();d.querySelector('#pulseDialogBody .pulse-form-row .pulse-primary').click();
 for(let i=1;i<6;i++)d.querySelector('#pulseDialogBody .pulse-form-row .pulse-action').click();await new Promise(r=>setTimeout(r,10));const p=w.AlignaFeatures.snapshot().profile;assert.equal(p.favoriteCuisines[0],'Indian');assert.equal(p.metabolism,undefined);assert.match(d.getElementById('pulseDialogBody').textContent,/remembered/);dom.window.close();
});
