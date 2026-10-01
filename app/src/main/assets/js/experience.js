/* Neon experience, optional discovery activities and food tools. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s),rules=window.AlignaFoodRules;
 if(!$('.app')||!rules)return;
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const api=()=>window.AlignaFeatures;
 const profile=()=>api()?.snapshot()?.profile||{};
 document.body.classList.add('aligna-pulse');
 window.AlignaMotion={transition:commit=>{if(document.startViewTransition&&!reduced())document.startViewTransition(commit);else commit();}};
 let returnFocus=null,requestId=null,requestTimer=null;
 const dialog=el('dialog','pulse-dialog');dialog.id='pulseDialog';dialog.setAttribute('aria-labelledby','pulseDialogTitle');
 dialog.innerHTML='<div class="pulse-dialog-top"><span class="pulse-wordmark">ALIGNA / LAB</span><button type="button" class="pulse-close" aria-label="Close">×</button></div><h2 id="pulseDialogTitle"></h2><div id="pulseDialogBody"></div><p id="pulseFeedback" role="status" aria-live="polite"></p>';
 document.body.append(dialog);
 const close=()=>{requestId=null;clearTimeout(requestTimer);dialog.close();returnFocus?.focus();};
 $('.pulse-close').onclick=close;
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 const feedback=t=>{$('#pulseFeedback').textContent=t;};
 function open(title,source){
  returnFocus=source||document.activeElement;requestId=null;clearTimeout(requestTimer);$('#pulseDialogTitle').textContent=title;$('#pulseDialogBody').replaceChildren();feedback('');
  const show=()=>{if(!dialog.open)dialog.showModal();};
  if(document.startViewTransition&&!reduced()&&source){source.style.viewTransitionName='pulse-detail';const transition=document.startViewTransition(()=>{source.style.viewTransitionName='';dialog.style.viewTransitionName='pulse-detail';show();});transition.finished.finally(()=>{dialog.style.viewTransitionName='';source.style.viewTransitionName='';});}else show();
  return $('#pulseDialogBody');
 }
 function action(text,fn,cls='pulse-action'){const b=el('button',cls,text);b.type='button';b.onclick=fn;return b;}
 function field(parent,label,name,type='text',placeholder=''){const l=el('label','pulse-field',label),input=el(type==='textarea'?'textarea':'input');input.name=name;if(type!=='textarea')input.type=type;input.placeholder=placeholder;l.append(input);parent.append(l);return input;}
 function note(parent,text){parent.append(el('p','pulse-note',text));}
 async function saveProfile(patch,button){button.disabled=true;try{await api().saveProfile(patch);feedback('Saved. Upcoming meal suggestions now use these preferences. Check any previously saved meals.');}catch(e){feedback(e.message||'Could not save. Try again.');}finally{button.disabled=false;}}
 const diets=[['no-restrictions','No dietary exclusions'],['vegan','Vegan'],['vegetarian','Vegetarian · eggs & dairy'],['pescatarian','Pescatarian · fish, eggs & dairy'],['fish-only','Plant foods + fish only'],['eggs-only','Plant foods + eggs only'],['dairy-only','Plant foods + dairy only']];
 function preferences(source){
  const body=open('Food, your way.',source),form=el('form','pulse-form'),p=profile();body.append(form);
  const label=el('label','pulse-field','Eating preference'),select=el('select');select.name='diet';diets.forEach(([key,title])=>{const o=el('option','',title);o.value=key;select.append(o);});select.value=p.dietaryPreference||'no-restrictions';label.append(select);form.append(label);
  const fs=el('fieldset','pulse-choices');fs.append(el('legend','','Allergies & ingredients to avoid'));
  for(const key of Object.keys(rules.allergens)){const l=el('label','pulse-check'),input=el('input');input.type='checkbox';input.value=key;input.checked=(p.allergies||[]).includes(key);l.append(input,el('span','',({milk:'Milk / dairy',nuts:'Tree nuts',gluten:'Gluten cereals',soy:'Soy / soya',sulphites:'Sulphites'})[key]||key[0].toUpperCase()+key.slice(1)));fs.append(l);}form.append(fs);
  const extra=field(form,'Other ingredients to avoid (comma-separated)','extra','text','e.g. kiwi, coconut');extra.value=(p.allergies||[]).filter(a=>!rules.allergens[a]).join(', ');extra.maxLength=300;
  note(form,'Filters screen written ingredients; they cannot confirm a meal is allergy-safe. Always check packaging, substitutions and cross-contact with the person preparing your food.');
  const save=el('button','pulse-primary','Save preferences');save.type='submit';form.append(save);
  form.onsubmit=async e=>{e.preventDefault();const selected=[...fs.querySelectorAll('input:checked')].map(i=>i.value),custom=extra.value.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);await saveProfile({dietaryPreference:select.value,allergies:[...new Set([...selected,...custom])].slice(0,30)},save);};
 }
 function customMeal(source){
  const body=open('Your recipe. Any cuisine.',source),form=el('form','pulse-form');body.append(form);
  const name=field(form,'Meal name','name','text','e.g. My family’s vegetable biryani');name.required=true;name.maxLength=100;
  const cuisine=field(form,'Cuisine or inspiration','cuisine','text','Any cuisine, region or family recipe');cuisine.maxLength=60;
  const ingredients=field(form,'Ingredients · one per line','ingredients','textarea','Rice, 1 cup\nChickpeas, ½ cup\n...');ingredients.required=true;ingredients.maxLength=6400;
  const steps=field(form,'How you make it · one step per line','steps','textarea','Your cooking method');steps.maxLength=7500;
  const row=el('div','pulse-form-row');form.append(row);const calories=field(row,'kcal / serving','calories','number','Required'),protein=field(row,'Protein g / serving','protein','number','Optional');calories.required=true;calories.min='1';calories.max='5000';protein.min='0';protein.max='300';protein.step='0.1';
  note(form,'Use your recipe or label for nutrition. Aligna stores your estimate; it does not calculate nutrients from a photo. Saved recipes appear in Meal ideas and can be added to your plan.');
  const save=el('button','pulse-primary','Save my meal');save.type='submit';form.append(save);
  form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{const m=await api().addMeal(Object.fromEntries(new FormData(form)));form.reset();feedback(m.name+(rules.screen({ing:m.ingredients.split('\n')},profile()).allowed?' saved. Find it in Meal ideas.':' saved, but hidden by your food filters. Review the ingredients or your preferences.'));window.AlignaUI?.select('meals','ideas');}catch(err){feedback(err.message||'Could not save this meal.');}finally{save.disabled=false;}};
 }
 function showProduct(data,code){
  const p=rules.productSummary(data,profile()),container=$('#pulseProduct');if(!container)return;container.replaceChildren();
  if(!p){feedback('No product details found. Check the packaging.');return;}
  container.append(el('span','pulse-eyebrow','LABEL EXPLORER'),el('h3','',p.name),el('p','pulse-note',p.brand));
  if(p.conflicts.length){container.append(el('div','pulse-product-warning','Matches your exclusions: '+p.conflicts.join(' · ')));}else{container.append(el('div','pulse-product-warning neutral','No listed match found. This is not confirmation that the product is safe for your allergies.'));}
  for(const [title,value] of [['Ingredients',p.ingredients||'Not supplied in this record.'],['Declared allergens',p.declared.join(', ')||'Not supplied; absence does not mean allergen-free.'],['Possible traces',p.traces.join(', ')||'Not supplied.'],['Diet analysis',p.analysis.join(', ')||'Unknown'],['Nutri-Score',p.grade?`${p.grade} · reported by Open Food Facts`:'Not available']]){container.append(el('h4','',title),el('p','pulse-product-text',value));}
  const nutr=el('div','pulse-nutrients');for(const [key,label,unit] of [['energy-kcal_100g','Energy','kcal'],['sugars_100g','Sugars','g'],['salt_100g','Salt','g'],['proteins_100g','Protein','g']]){const v=p.nutriments[key];const cell=el('div');cell.append(el('strong','',Number.isFinite(v)?`${v} ${unit}`:'—'),el('small','',label+' / 100 g or ml'));nutr.append(cell);}container.append(nutr);
  note(container,'Source: Open Food Facts · community-contributed data (ODbL). Check the actual package: recipes, allergens and labels can change. Nutri-Score is not an allergy rating.');feedback('Product loaded.');
 }
 function products(source){
  const body=open('Know what’s inside.',source);note(body,'Scan a food barcode to look up ingredients and allergens. Only the barcode is sent to Open Food Facts; your allergy profile is checked on this device.');
  body.append(action('⌁ Scan product barcode',()=>{
   if(!window.AlignaProducts?.scan){feedback('Camera scanning is available in the Android app. Use barcode entry on your phone if the scanner is unavailable.');return;}
   requestId='scan_'+Date.now();feedback('Opening scanner…');window.AlignaProducts.scan(requestId);
  },'pulse-primary'));
  const form=el('form','pulse-form'),code=field(form,'Or enter the barcode','barcode','text','8, 12, 13 or 14 digits');code.inputMode='numeric';code.pattern='(?:[0-9]{8}|[0-9]{12,14})';code.required=true;code.maxLength=14;
  const submit=el('button','pulse-action','Look up product');submit.type='submit';form.append(submit);body.append(form);const result=el('div');result.id='pulseProduct';body.append(result);
  const lookup=value=>{if(!/^(?:\d{8}|\d{12,14})$/.test(value)){feedback('Enter an 8, 12, 13 or 14 digit food barcode.');return;}code.value=value;if(!window.AlignaProducts?.lookup){feedback('Product lookup is available in the Android app.');return;}submit.disabled=true;result.replaceChildren();requestId='lookup_'+Date.now();feedback('Looking up the label…');window.AlignaProducts.lookup(value,requestId);clearTimeout(requestTimer);requestTimer=setTimeout(()=>{requestId=null;submit.disabled=false;feedback('Lookup timed out. Check your connection and try again.');},25000);};
  form.onsubmit=e=>{e.preventDefault();lookup(code.value.trim());};
  dialog.productResult=payload=>{if(payload.cancelled){feedback('Scan cancelled. You can scan again or type the barcode.');return;}if(payload.error){clearTimeout(requestTimer);submit.disabled=false;feedback(payload.error);return;}if(payload.data){clearTimeout(requestTimer);submit.disabled=false;showProduct(payload.data,payload.barcode);}else if(payload.barcode)lookup(payload.barcode);};
 }
 window.addEventListener('aligna-product-result',e=>{if(dialog.open&&requestId===e.detail?.requestId)dialog.productResult?.(e.detail);});
 const activities=[
  {title:'Pick your flavour adventure.',hint:'Choose the cuisines you look forward to. You can change this anytime.',key:'favoriteCuisines',multi:true,choices:['Indian','Mediterranean','East Asian','Middle Eastern','West African','Caribbean','Latin American','European','Surprise me']},
  {title:'Build your dream lunch.',hint:'Pick the meals you enjoy. Your dietary restrictions still apply.',key:'favoriteMeals',multi:true,choices:['Dal & rice','Noodles','Tacos','Grain bowl','Pasta','Soup & bread','Sushi','A family recipe']},
  {title:'Your kind of movement?',hint:'Pick what you enjoy, not what you think you should choose.',key:'preferredWorkouts',multi:true,choices:['Strength','Walking','Yoga','Cycling','Swimming','Dance','Bodyweight','Team sports']},
  {title:'How does hunger show up?',hint:'Your answer helps describe your routine to the coach. It does not measure metabolism.',key:'appetitePattern',choices:['Small and frequent meals','Three regular meals','Hungrier later in the day','It varies a lot','Prefer not to say']},
  {title:'When do you feel your best?',hint:'There is no correct answer. This is a self-reported energy pattern.',key:'energyPattern',choices:['Early morning','Midday','Evening','No clear pattern','Prefer not to say']},
  {title:'How would you describe your build?',hint:'Optional self-description, not an assessment or a metabolism test.',key:'bodyType',choices:['slim','average','broader','Prefer not to say']}
 ];
 function discover(source){
  const body=open('A little more you.',source);let index=0;const answers={};
  const render=()=>{body.replaceChildren();feedback('');const a=activities[index],progress=el('div','pulse-activity-progress');progress.style.setProperty('--step',`${index/activities.length*100}%`);body.append(el('p','pulse-eyebrow',`TASTE & TEMPO · ${index+1} / ${activities.length}`),progress,el('h3','pulse-question',a.title));note(body,a.hint);
   const current=Object.prototype.hasOwnProperty.call(answers,a.key)?answers[a.key]:profile()[a.key];const chosen=new Set(a.multi?(current||[]):current?[current]:[]),choices=el('div','pulse-picks');
   a.choices.forEach(label=>{const b=action(label,()=>{if(!a.multi)chosen.clear();if(b.getAttribute('aria-pressed')==='true')chosen.delete(label);else chosen.add(label);choices.querySelectorAll('button').forEach(n=>n.setAttribute('aria-pressed',String(chosen.has(n.textContent))));});b.setAttribute('aria-pressed',String(chosen.has(label)));choices.append(b);});body.append(choices);
   const controls=el('div','pulse-form-row');body.append(controls);controls.append(action('Skip',()=>{if(index<activities.length-1){index++;render();}else finish();}));
   controls.append(action(index===activities.length-1?'Save my picks':'Next →',()=>{if(chosen.size)answers[a.key]=a.multi?[...chosen]:[...chosen][0];if(index<activities.length-1){index++;render();}else finish();},'pulse-primary'));
  };
  const finish=async()=>{body.replaceChildren(el('p','pulse-note','Saving your picks…'));try{if(answers.bodyType==='Prefer not to say')delete answers.bodyType;await api().saveProfile(answers);body.replaceChildren(el('div','pulse-success','✦'),el('h3','pulse-question','Your rhythm, remembered.'));note(body,'Your choices are saved for personalisation. You can replay this activity or change your food preferences anytime.');body.append(action('Done',close,'pulse-primary'));}catch(e){body.replaceChildren(action('Try again',finish,'pulse-primary'));feedback(e.message||'Could not save your choices.');}};
  render();
 }
 // Header settings remains the original control and handler; add food preferences inside it.
 const settings=$('#sheet');if(settings){const b=action('Food preferences & allergies →',()=>preferences(b));b.id='pulsePreferences';settings.insertBefore(b,$('#closeSettings'));}
 const tools=el('div','pulse-food-tools');[
  ['Food preferences','Diet & allergies',preferences,'lime'],['Your own meals','Every cuisine welcome',customMeal,'coral'],['Scan a product','Decode the label',products,'cyan']
 ].forEach(([title,sub,fn,color])=>{const b=action('',()=>fn(b),'pulse-tool '+color);b.append(el('span','pulse-tool-icon',color==='lime'?'◈':color==='coral'?'＋':'⌁'),el('strong','',title),el('small','',sub));tools.append(b);});$('#view-ideas .modern-page-heading')?.after(tools);
 const notice=el('p','pulse-note pulse-food-notice','Meal filters use ingredient text. Always verify labels for allergies.');$('#modern-meals-ideas')?.prepend(notice);
 const collection=el('p','pulse-note');collection.id='pulseCollection';$('#modern-meals-ideas')?.prepend(collection);
 const adventure=action('',()=>discover(adventure),'pulse-discover');adventure.append(el('span','pulse-eyebrow','TASTE & TEMPO'),el('strong','','Find your kind of healthy.'),el('small','','Six quick picks. More personal recommendations.'),el('span','pulse-discover-arrow','↗'));$('#view-today .home-dashboard')?.append(adventure);
 const start=action('',()=>$('.tab[data-v="train"]')?.click(),'pulse-start');start.setAttribute('aria-label','Start training');start.append(el('span','','▶'),el('small','','Start'));const nav=$('.tabbar');nav?.insertBefore(start,$('.tab[data-v="train"]'));
 // Large live stat and ring, driven exclusively by the existing logged values.
 const hero=el('section','pulse-hero');hero.innerHTML='<div class="pulse-hero-copy"><span class="pulse-eyebrow">YOUR DAILY ORBIT</span><h3>Build your<br><em>momentum.</em></h3><p>Every small step counts.</p></div><div class="pulse-ring" role="img" aria-label="Daily completion"><div class="pulse-ring-inner"><span>ENERGY LOGGED</span><strong id="pulseKcal">0</strong><small>kcal</small></div></div><div class="pulse-orbit-meta"><span><i></i> Your real-time rhythm</span><strong id="pulseCompletion">0% complete</strong></div>';
 $('.home-greeting')?.after(hero);
 let animation=0;
 function updateStats(){const target=Number(($('#homeKcalDone')?.textContent||'0').replace(/[^0-9.]/g,''))||0,score=Number(($('#homeScore')?.textContent||'0').replace(/[^0-9.]/g,''))||0;
  const ring=$('.pulse-ring');ring.style.setProperty('--progress',Math.min(100,Math.max(0,score))+'%');ring.setAttribute('aria-label',`${score}% of today's routine complete`);$('#pulseCompletion').textContent=score+'% complete';const counter=$('#pulseKcal');if(Number(counter.dataset.target)===target)return;counter.dataset.target=target;cancelAnimationFrame(animation);const from=Number(counter.textContent)||0,startTime=performance.now();
  const frame=now=>{const t=reduced()?1:Math.min(1,(now-startTime)/750);counter.textContent=String(Math.round(from+(target-from)*(1-Math.pow(1-t,3))));if(t<1)animation=requestAnimationFrame(frame);};animation=requestAnimationFrame(frame);
 }
 const observer=new MutationObserver(updateStats);['#homeKcalDone','#homeScore'].forEach(s=>{const n=$(s);if(n)observer.observe(n,{childList:true,subtree:true,characterData:true});});updateStats();
 hero.addEventListener('pointermove',e=>{if(reduced())return;const r=hero.getBoundingClientRect();$('.pulse-ring').style.transform=`perspective(600px) rotateX(${-(e.clientY-r.top-r.height/2)/30}deg) rotateY(${(e.clientX-r.left-r.width/2)/30}deg)`;});['pointerleave','pointerup','pointercancel'].forEach(name=>hero.addEventListener(name,()=>{$('.pulse-ring').style.transform='';}));
 function refreshed(){const s=api()?.snapshot();$('#pulseCollection').textContent=s?`${s.customMeals.length} personal recipes · ${diets.find(d=>d[0]===s.profile.dietaryPreference)?.[1]||'All eating styles'}`:'Sign in to save your recipes and preferences.';}
 window.addEventListener('aligna-features-changed',refreshed);window.addEventListener('aligna-main-state-refresh',refreshed);refreshed();
 ['aligna-auth-logout','aligna-auth-expired'].forEach(name=>window.addEventListener(name,()=>{requestId=null;clearTimeout(requestTimer);if(dialog.open)close();$('#pulseDialogBody').replaceChildren();}));
 let activeUser=null;
 ['aligna-auth-login','aligna-auth-register','aligna-auth-session'].forEach(name=>window.addEventListener(name,e=>{const id=e.detail?.data?.user?.id;if(id&&id!==activeUser){activeUser=id;requestId=null;clearTimeout(requestTimer);if(dialog.open)close();$('#pulseDialogBody').replaceChildren();refreshed();}}));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.open){$('#scrim')?.classList.remove('show');$('#sheet')?.classList.remove('show');}});
})();
