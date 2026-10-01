# Neon experience and food tools

The visual layer uses a #0B0D12 base, lime/coral/cyan accents, glass cards, bundled Space Grotesk display typography, a live calorie counter, completion ring, pointer tilt and press feedback. The floating centre Start button opens the existing Training screen. Reduced-motion preferences disable animated effects. Browsers supporting View Transitions animate navigation and food-tool expansion; others use the dialog entrance fallback.

Settings now has an explicit click handler. Food preferences are available both there and on Meals. Vegan, vegetarian, pescatarian and plant-foods-plus-fish/eggs/dairy options screen known ingredient terms. Fourteen allergen categories plus free-text exclusions are stored in the existing account state and passed through the existing AI profile flow. Ingredient screening is incomplete by nature: it does not establish allergy safety or know cross-contact. Existing planned meals are flagged when conflicting; generated upcoming slots are reconciled, and known conflicting AI plans are rejected.

Custom meals accept any cuisine, ingredients, method and user-supplied calories per serving (optional protein). They persist in `customMeals` through the existing app-state/cloud-sync mechanism and join Meal ideas, weekly plans and grocery calculations. IDs use a stable appended catalogue index. User text is escaped before entering legacy HTML templates. Invalid saved records preserve index positions and are excluded from suggestions. The current collection limit is 100.

Taste & Tempo is an optional six-question activity about cuisines, favourite meals, movement, appetite, energy patterns and self-described build. Skip is available throughout. Explicit selections go into the profile and AI context. No metabolism, body-composition or medical inference is made; the old build-dependent calorie multipliers and misleading build labels were removed.

Product scanning uses Google Code Scanner 16.1.0 and requires compatible Google Play services; it may download its module on first use. Barcode entry remains available. The native bridge requests a fixed Open Food Facts API endpoint with an identifying User-Agent and a timeout. Only barcodes are sent to that service. Ingredients, declared allergens, traces, diet-analysis tags, available per-100g/ml nutrients and the source's Nutri-Score are displayed. Missing values remain unknown, and no Yuka-like proprietary score or allergy-safe verdict is invented. Results are discarded when the dialog closes or the account changes. Photos are not uploaded.

Sources:
- https://developers.google.com/ml-kit/vision/barcode-scanning/code-scanner
- https://openfoodfacts.github.io/documentation/docs/Product-Opener/v3/products/get-api-v3-product-code/
- Open Food Facts data attribution: ODbL; https://world.openfoodfacts.org/terms-of-use
- Space Grotesk font licence is bundled in app assets/fonts.

Validation includes Settings open/save, Start navigation, dietary persistence, custom recipes through reload and weekly plans, markup injection protection, stale product replies, optional discovery, ingredient matching and missing product records. A live Open Food Facts sample-barcode lookup returned ingredients, allergens and nutrients. Native scanning compiles but camera interaction and the final visual layout still require testing on a phone; browser preview policy verification was unavailable in this environment.
