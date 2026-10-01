/* Ingredient-text screening, not an allergen-safety certification. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AlignaFoodRules=api;})(globalThis,function(){
 const allergens={milk:['milk','dairy','butter','cheese','yogurt','yoghurt','cream','whey','casein','ghee','paneer'],eggs:['egg','eggs','albumen','mayonnaise'],fish:['fish','salmon','tuna','cod','anchovy','sardine','haddock'],peanuts:['peanut','peanuts','groundnut'],nuts:['nut','nuts','almond','cashew','walnut','hazelnut','pistachio','pecan','brazil nut','macadamia'],soy:['soy','soybean','soybeans','soya','tofu','tempeh','edamame'],gluten:['gluten','wheat','barley','rye','bread','pasta','semolina','couscous','flour'],sesame:['sesame','tahini'],crustaceans:['crustacean','shrimp','prawn','crab','lobster'],molluscs:['mollusc','mussel','oyster','squid','octopus','clam','scallop'],celery:['celery','celeriac'],mustard:['mustard'],lupin:['lupin','lupine'],sulphites:['sulphite','sulfite','sulphur dioxide','sulfur dioxide']};
 const diets={'no-restrictions':[],vegan:['meat','fish','eggs','milk','honey'],vegetarian:['meat','fish'],pescatarian:['meat'],'fish-only':['meat','eggs','milk'],'eggs-only':['meat','fish','milk'],'dairy-only':['meat','fish','eggs']};
 const words=(text,word)=>new RegExp('(^|[^a-z])'+word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'s?([^a-z]|$)','i').test(text);
 function screen(meal,profile={}){
  const source=[...(meal.ing||[]),...(meal.allergens||[])].join(' ').toLowerCase(),reasons=[];
  for(const key of (profile.allergies||[])){const terms=allergens[key]||[key];if(terms.some(t=>words(source,t)))reasons.push('Allergen match: '+key);}
  const animals=source.replace(/\b(?:oat|almond|coconut|soy|soya|rice|plant|vegan)[ -](?:milk|yogurt|yoghurt|cream|butter|cheese)\b/g,'plant alternative');
  for(const key of diets[profile.dietaryPreference]||[]){const terms=key==='meat'?['chicken','beef','pork','bacon','ham','lamb','turkey','duck','gelatin','gelatine','lard']:key==='fish'?[...allergens.fish,...allergens.crustaceans,...allergens.molluscs]:key==='honey'?['honey']:allergens[key];if(terms.some(t=>words(animals,t)))reasons.push('Outside your diet: '+key);}
  return {allowed:reasons.length===0,reasons,hasIngredients:Boolean(source.trim())};
 }
 function normaliseMeal(input){
  const clean=(v,max)=>String(v||'').trim().slice(0,max);
  const name=clean(input.name,100),cuisine=clean(input.cuisine,60),ingredients=String(input.ingredients||'').split(/\n/).map(s=>clean(s,160)).filter(Boolean).slice(0,40),steps=String(input.steps||'').split(/\n/).map(s=>clean(s,300)).filter(Boolean).slice(0,25);
  if(!name||!ingredients.length)throw Error('Add a meal name and its ingredients.');
  const calories=Number(input.calories);if(!Number.isFinite(calories)||calories<=0||calories>5000)throw Error('Enter calories per serving between 1 and 5,000.');
  const protein=input.protein===''||input.protein==null?null:Number(input.protein);if(protein!==null&&(!Number.isFinite(protein)||protein<0||protein>300))throw Error('Check the protein amount.');
  return {name,cuisine,ingredients:ingredients.join('\n'),steps:steps.join('\n'),calories:Math.round(calories),protein,type:input.type==='drink'?'drink':'food'};
 }
 function productSummary(data,profile={}){
  const p=data?.product;if(!p)return null;
  const ingredients=p.ingredients_text_en||p.ingredients_text||'',tags=a=>(Array.isArray(a)?a:[]).map(t=>String(t).replace(/^[a-z]{2}:/,''));
  const declared=tags(p.allergens_tags),traces=tags(p.traces_tags),check=screen({ing:[ingredients],allergens:[...declared,...traces]},profile);
  const analysis=tags(p.ingredients_analysis_tags);
  if(profile.dietaryPreference==='vegan'&&analysis.includes('non-vegan'))check.reasons.push('Outside your diet: non-vegan');
  if(['vegan','vegetarian','eggs-only','dairy-only'].includes(profile.dietaryPreference)&&analysis.includes('non-vegetarian'))check.reasons.push('Outside your diet: non-vegetarian');
  return {name:p.product_name||'Unnamed product',brand:p.brands||'',ingredients,declared,traces,conflicts:check.reasons,grade:/^[a-e]$/.test(p.nutriscore_grade||'')?p.nutriscore_grade.toUpperCase():null,analysis,nutriments:p.nutriments||{},source:'Open Food Facts'};
 }
 return {allergens,diets,screen,normaliseMeal,productSummary};
});
