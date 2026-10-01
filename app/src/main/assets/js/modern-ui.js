/* Presentation only: move existing controls without replacing their listeners or data. */
(() => {
  const $=s=>document.querySelector(s),groups=new Map();
  if(!$('.app')||document.body.classList.contains('aligna-modern'))return;
  document.body.classList.add('aligna-modern');
  $('.tabbar')?.setAttribute('aria-label','Main navigation');
  $('.tab.on')?.setAttribute('aria-current','page');
  function text(selector,value){const el=$(selector);if(el)el.textContent=value;}
  function heading(title,description){const el=document.createElement('div');el.className='modern-page-heading';const h=document.createElement('h2'),p=document.createElement('p');h.textContent=title;p.textContent=description;el.append(h,p);return el;}
  function sections(root,name,items){
    const bar=document.createElement('div');bar.className='modern-segments';bar.setAttribute('role','tablist');bar.setAttribute('aria-label',name+' sections');
    const panels=[],buttons=[];
    items.forEach(({key,label,nodes})=>{
      const panel=document.createElement('div');panel.id=`modern-${name}-${key}`;panel.className='modern-tab-panel';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',panel.id+'-tab');
      nodes.filter(Boolean).forEach(n=>panel.append(n));root.append(panel);panels.push(panel);
      const button=document.createElement('button');button.type='button';button.id=panel.id+'-tab';button.textContent=label;button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);bar.append(button);buttons.push(button);
      button.onclick=()=>select(key);
      button.onkeydown=e=>{const i=buttons.indexOf(button);let next;if(e.key==='ArrowRight')next=(i+1)%buttons.length;if(e.key==='ArrowLeft')next=(i+buttons.length-1)%buttons.length;if(e.key==='Home')next=0;if(e.key==='End')next=buttons.length-1;if(next!==undefined){e.preventDefault();select(items[next].key);buttons[next].focus();}};
    });
    function select(key){const index=items.findIndex(i=>i.key===key);if(index<0)return;panels.forEach((p,i)=>{p.hidden=i!==index;buttons[i].setAttribute('aria-selected',String(i===index));buttons[i].tabIndex=i===index?0:-1;});requestAnimationFrame(()=>window.dispatchEvent(new Event('aligna-layout-change')));}
    root.insertBefore(bar,panels[0]);groups.set(name,select);select(items[0].key);
  }
  // Decorative placeholder numbers are not logged data and should not compete with it.
  $('.neo-today-summary')?.remove();
  const mealHero=$('.neo-meal-hero');mealHero?.replaceWith(heading('Meals','Your plan, your kitchen, your pace.'));
  $('.neo-training-overview')?.replaceWith(heading('Training','One session. A little stronger.'));
  const greeting=$('.home-greeting h2');if(greeting)Array.from(greeting.childNodes).filter(n=>n.nodeType===3).forEach(n=>n.remove());
  text('.home-live-pill','YOUR NEXT STEP');text('#homeOpenMeals',"View today's schedule");
  text('#homePersonalisedButton strong','Your personal plan');text('#homePersonalisedButton small','Meals and training, made for you');
  text('.progress-v4-sub','Small steps. A clearer picture.');
  const ai=$('#openAI'),brand=$('.brand');if(ai&&brand){const actions=document.createElement('div');actions.className='modern-header-actions';ai.classList.add('modern-ai');const label=document.createElement('span');label.textContent='Ask AI';ai.append(label);actions.append(ai,$('#openSettings'));brand.append(actions);}
  const today=$('#view-today'),schedule=$('#timeline')?.closest('section'),wellness=$('.home-wellness-grid');
  if(schedule){const fold=document.createElement('details');fold.className='modern-disclosure';const summary=document.createElement('summary');summary.innerHTML='<span><strong>Your full schedule</strong><small>Meals, breaks and daily routines</small></span><span class="modern-chevron" aria-hidden="true">⌄</span>';schedule.before(fold);fold.append(summary,schedule);if(wellness)fold.before(wellness);}
  const insight=$('.home-insight');if(insight){const fold=document.createElement('details');fold.className='modern-disclosure modern-insight';const summary=document.createElement('summary');summary.textContent='A little encouragement';fold.append(summary,insight);today.append(fold);}
  const meals=$('#view-ideas');
  sections(meals,'meals',[
    {key:'plan',label:'Week plan',nodes:[$('#weekPlanList')?.closest('section')]},
    {key:'ideas',label:'Meal ideas',nodes:[$('#ideaList')?.closest('section')]},
    {key:'kitchen',label:'My kitchen',nodes:[$('#kitchenInventoryForm')?.closest('section')]}
  ]);
  const addMeals=document.createElement('button');addMeals.type='button';addMeals.className='modern-add-meals';addMeals.textContent='＋ Browse meal ideas';addMeals.onclick=()=>groups.get('meals')('ideas');$('#modern-meals-plan').append(addMeals);
  const progress=$('.progress-v4');
  sections(progress,'progress',[
    {key:'overview',label:'Overview',nodes:[$('.progress-v4-stats'),$('.calorie-panel'),$('.calendar-panel'),$('.progress-v4-insight')]},
    {key:'body',label:'My body',nodes:[$('.muscle-panel')]},
    {key:'trends',label:'Trends',nodes:[$('.weight-panel'),$('.radar-panel'),$('.records-panel'),$('.progress-v4-support')]}
  ]);
  const trainingTip=$('#view-train > section > .ribbon');if(trainingTip){const fold=document.createElement('details');fold.className='modern-disclosure';const summary=document.createElement('summary');summary.textContent='Training guidance';trainingTip.before(fold);fold.append(summary,trainingTip);$('#view-train').append(fold);}
  // Keep every section reachable for app/AI navigation and future deep links.
  window.AlignaUI={select:(group,key)=>groups.get(group)?.(key),openSchedule:()=>{const fold=schedule?.closest('details');if(fold){fold.open=true;fold.querySelector('summary').focus();fold.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}}};
  window.addEventListener('aligna-auth-logout',()=>{groups.get('meals')?.('plan');groups.get('progress')?.('overview');});
})();
