const {test}=require('node:test'),assert=require('node:assert/strict'),rules=require('../app/src/main/assets/js/food-rules.js');
test('diet options exclude the intended animal ingredients',()=>{
 for(const [diet,ingredient] of [['vegan','Whey powder'],['vegetarian','Chicken'],['pescatarian','Beef'],['fish-only','Egg'],['eggs-only','Milk'],['dairy-only','Salmon']])assert.equal(rules.screen({ing:[ingredient]},{dietaryPreference:diet}).allowed,false,diet);
 for(const [diet,ingredient] of [['vegan','Oat milk'],['vegetarian','Egg'],['pescatarian','Salmon'],['fish-only','Tuna'],['eggs-only','Egg'],['dairy-only','Milk']])assert.equal(rules.screen({ing:[ingredient]},{dietaryPreference:diet}).allowed,true,diet);
});
test('allergen matches include ingredient aliases and product traces',()=>{
 assert.equal(rules.screen({ing:['Peanut butter']},{allergies:['peanuts']}).allowed,false);
 assert.equal(rules.screen({ing:['Whey protein']},{allergies:['milk']}).allowed,false);
 const p=rules.productSummary({product:{product_name:'Example',ingredients_text:'Cocoa',traces_tags:['en:soybeans']}},{allergies:['soy']});assert.ok(p.conflicts.length);
 assert.equal(rules.screen({ing:['Kiwi fruit']},{allergies:['kiwi']}).allowed,false);
});
test('missing product fields remain unknown, with no fabricated nutrition or safety score',()=>{
 assert.equal(rules.productSummary({}),null);const p=rules.productSummary({product:{product_name:'Partial record'}});assert.equal(p.grade,null);assert.equal(p.ingredients,'');assert.deepEqual(p.nutriments,{});
 assert.ok(rules.productSummary({product:{ingredients_analysis_tags:['en:non-vegan']}},{dietaryPreference:'vegan'}).conflicts.length);
});
test('custom recipes require ingredients and user-supplied nutrition',()=>{
 assert.throws(()=>rules.normaliseMeal({name:'Recipe',calories:400}),/ingredients/);
 assert.throws(()=>rules.normaliseMeal({name:'Recipe',ingredients:'Rice',calories:''}),/calories/);
 const m=rules.normaliseMeal({name:'My dal',cuisine:'Indian',ingredients:'Lentils\nRice',calories:410,protein:''});assert.equal(m.protein,null);assert.equal(m.calories,410);assert.equal(m.cuisine,'Indian');
});
