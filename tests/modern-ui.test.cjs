const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(require.resolve('../app/src/main/assets/index.html'),'utf8'),source=fs.readFileSync(require.resolve('../app/src/main/assets/js/modern-ui.js'),'utf8');
function setup(){const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'https://app.test'});return{dom,w:dom.window,d:dom.window.document,run:()=>dom.window.eval(source)};}
test('redesign retains every original element ID and existing feature listeners',()=>{
 const {dom,d,run}=setup(),ids=[...d.querySelectorAll('[id]')].map(e=>e.id);let calls=0;
 const ai=d.getElementById('openAI'),kitchen=d.getElementById('kitchenInventoryForm');ai.onclick=()=>calls++;kitchen.addEventListener('submit',e=>{e.preventDefault();calls++;});run();
 for(const id of ids)assert.ok(d.getElementById(id),'missing feature: '+id);
 assert.equal(d.getElementById('openAI'),ai);ai.click();kitchen.dispatchEvent(new dom.window.Event('submit',{cancelable:true}));assert.equal(calls,2);
 assert.ok(ai.closest('header'));assert.ok(d.getElementById('timeline').closest('details'));dom.window.close();
});
test('all meal and progress sections are reachable with keyboard and buttons',()=>{
 const {dom,d,run,w}=setup();run();
 for(const group of ['meals','progress']){
  const buttons=[...d.querySelectorAll(`[id^="modern-${group}-"][role=tab]`)];assert.equal(buttons.length,3);
  for(const button of buttons){button.click();assert.equal(button.getAttribute('aria-selected'),'true');assert.equal(d.getElementById(button.getAttribute('aria-controls')).hidden,false);assert.equal(buttons.filter(b=>b.getAttribute('aria-selected')==='true').length,1);}
  buttons[2].dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(buttons[0].getAttribute('aria-selected'),'true');
 }
 d.querySelector('.modern-add-meals').click();assert.equal(d.getElementById('modern-meals-ideas').hidden,false);
 w.AlignaUI.select('progress','trends');assert.equal(d.getElementById('modern-progress-trends').hidden,false);dom.window.close();
});
test('presentation setup is idempotent and logout resets section selection',()=>{
 const {dom,d,run,w}=setup();run();run();assert.equal(d.querySelectorAll('.modern-segments').length,2);
 w.AlignaUI.select('progress','body');w.dispatchEvent(new w.Event('aligna-auth-logout'));
 assert.equal(d.getElementById('modern-progress-overview').hidden,false);assert.equal(d.getElementById('modern-progress-body').hidden,true);dom.window.close();
});
test('primary Today action reveals the retained schedule',()=>{
 const {dom,d,run,w}=setup();run();const fold=d.getElementById('timeline').closest('details');let scrolled=false;fold.scrollIntoView=()=>{scrolled=true;};
 assert.equal(fold.open,false);w.AlignaUI.openSchedule();assert.equal(fold.open,true);assert.equal(scrolled,true);assert.equal(d.activeElement,fold.querySelector('summary'));dom.window.close();
});
