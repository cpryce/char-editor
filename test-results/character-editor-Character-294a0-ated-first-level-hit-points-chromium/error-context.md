# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: character-editor.spec.ts >> Character Editor >> Form Submission >> autosave body contains calculated first-level hit points
- Location: e2e/character-editor.spec.ts:231:9

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '+ Character' })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:oxc] Transform failed with 1 error: [PARSE_ERROR] Error: Unexpected token ╭─[ src/App.tsx:169:1 ] │ 169 │ }: { │ ┬ │ ╰── ─────╯"
  - generic [ref=e5]: /Volumes/myProjects/char-editor/client/src/App.tsx
  - generic [ref=e6]: at transformWithOxc (file:///Volumes/myProjects/char-editor/node_modules/vite/dist/node/chunks/node.js:3742:19) at TransformPluginContext.transform (file:///Volumes/myProjects/char-editor/node_modules/vite/dist/node/chunks/node.js:3810:26) at EnvironmentPluginContainer.transform (file:///Volumes/myProjects/char-editor/node_modules/vite/dist/node/chunks/node.js:30141:51) at async loadAndTransform (file:///Volumes/myProjects/char-editor/node_modules/vite/dist/node/chunks/node.js:24489:26) at async viteTransformMiddleware (file:///Volumes/myProjects/char-editor/node_modules/vite/dist/node/chunks/node.js:24283:20)
  - generic [ref=e7]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e8]: server.hmr.overlay
    - text: to
    - code [ref=e9]: "false"
    - text: in
    - code [ref=e10]: vite.config.ts
    - text: .
```

# Test source

```ts
  149 | 
  150 |     test('autosave fires when both name and class are filled', async ({ page }) => {
  151 |       await mockAuth(page);
  152 |       await page.route('**/api/characters', async (route) => {
  153 |         if (route.request().method() === 'POST') {
  154 |           await route.fulfill({
  155 |             status: 201,
  156 |             contentType: 'application/json',
  157 |             body: JSON.stringify({ _id: 'new-id', name: 'Thorin', classes: [{ name: 'Fighter', level: 1 }], updatedAt: new Date().toISOString() }),
  158 |           });
  159 |         } else {
  160 |           await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  161 |         }
  162 |       });
  163 |       await page.goto('/');
  164 |       await page.getByRole('button', { name: '+ Character' }).click();
  165 |       await page.getByPlaceholder('Character name').fill('Thorin');
  166 |       await selectClass(page, 'Fighter');
  167 |       // Export PDF button appears once the first autosave completes
  168 |       await expect(page.getByRole('button', { name: 'Export PDF' })).toBeVisible();
  169 |     });
  170 |   });
  171 | 
  172 |   test.describe('Form Submission', () => {
  173 |     test('filling name and class autosaves to /api/characters', async ({ page }) => {
  174 |       let postedBody: Record<string, unknown> | null = null;
  175 | 
  176 |       await mockAuth(page);
  177 |       await page.route('**/api/characters', async (route) => {
  178 |         if (route.request().method() === 'POST') {
  179 |           postedBody = await route.request().postDataJSON() as Record<string, unknown>;
  180 |           await route.fulfill({
  181 |             status: 201,
  182 |             contentType: 'application/json',
  183 |             body: JSON.stringify({ _id: 'new-id', name: 'Thorin', classes: [{ name: 'Fighter', level: 1 }], updatedAt: new Date().toISOString() }),
  184 |           });
  185 |         } else {
  186 |           await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  187 |         }
  188 |       });
  189 | 
  190 |       await page.goto('/');
  191 |       await page.getByRole('button', { name: '+ Character' }).click();
  192 |       await page.getByPlaceholder('Character name').fill('Thorin');
  193 |       await selectClass(page, 'Fighter');
  194 | 
  195 |       // Wait for autosave (debounce + request) — Export PDF appears once the first save completes
  196 |       await expect(page.getByRole('button', { name: 'Export PDF' })).toBeVisible();
  197 |       // Navigate back
  198 |       await page.getByRole('button', { name: 'Back to characters' }).click();
  199 |       await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
  200 |       expect(postedBody).toMatchObject({ name: 'Thorin' });
  201 |     });
  202 | 
  203 |     test('autosave body contains the selected class', async ({ page }) => {
  204 |       let postedBody: Record<string, unknown> | null = null;
  205 | 
  206 |       await mockAuth(page);
  207 |       await page.route('**/api/characters', async (route) => {
  208 |         if (route.request().method() === 'POST') {
  209 |           postedBody = await route.request().postDataJSON() as Record<string, unknown>;
  210 |           await route.fulfill({
  211 |             status: 201,
  212 |             contentType: 'application/json',
  213 |             body: JSON.stringify({ _id: 'new-id', name: 'Lyra', classes: [{ name: 'Wizard', level: 1 }], updatedAt: new Date().toISOString() }),
  214 |           });
  215 |         } else {
  216 |           await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  217 |         }
  218 |       });
  219 | 
  220 |       await page.goto('/');
  221 |       await page.getByRole('button', { name: '+ Character' }).click();
  222 |       await page.getByPlaceholder('Character name').fill('Lyra');
  223 |       await selectClass(page, 'Wizard');
  224 | 
  225 |       await expect(page.getByRole('button', { name: 'Export PDF' })).toBeVisible();
  226 |       expect(postedBody).toMatchObject({
  227 |         classes: [{ name: 'Wizard', level: 1 }],
  228 |       });
  229 |     });
  230 | 
  231 |     test('autosave body contains calculated first-level hit points', async ({ page }) => {
  232 |       let postedBody: Record<string, unknown> | null = null;
  233 | 
  234 |       await mockAuth(page);
  235 |       await page.route('**/api/characters', async (route) => {
  236 |         if (route.request().method() === 'POST') {
  237 |           postedBody = await route.request().postDataJSON() as Record<string, unknown>;
  238 |           await route.fulfill({
  239 |             status: 201,
  240 |             contentType: 'application/json',
  241 |             body: JSON.stringify({ _id: 'new-id', name: 'Borin', classes: [{ name: 'Fighter', level: 1 }], updatedAt: new Date().toISOString() }),
  242 |           });
  243 |         } else {
  244 |           await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  245 |         }
  246 |       });
  247 | 
  248 |       await page.goto('/');
> 249 |       await page.getByRole('button', { name: '+ Character' }).click();
      |                                                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
  250 |       await page.getByPlaceholder('Character name').fill('Borin');
  251 |       await selectClass(page, 'Fighter');
  252 |       await abilityRow(page, 'CON').locator('input[type="number"]').first().fill('14');
  253 | 
  254 |       await expect(page.getByRole('button', { name: 'Export PDF' })).toBeVisible();
  255 |       expect(postedBody).toMatchObject({
  256 |         hitPoints: { max: 12, current: 12, nonlethal: 0 },
  257 |       });
  258 |     });
  259 | 
  260 |     test('shows saving indicator while autosave is in flight', async ({ page }) => {
  261 |       await mockAuth(page);
  262 | 
  263 |       let resolveSave!: () => void;
  264 |       await page.route('**/api/characters', async (route) => {
  265 |         if (route.request().method() === 'POST') {
  266 |           await new Promise<void>((res) => { resolveSave = res; });
  267 |           await route.fulfill({
  268 |             status: 201,
  269 |             contentType: 'application/json',
  270 |             body: JSON.stringify({ _id: 'new-id', name: 'Zara', classes: [{ name: 'Rogue', level: 1 }], updatedAt: new Date().toISOString() }),
  271 |           });
  272 |         } else {
  273 |           await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  274 |         }
  275 |       });
  276 | 
  277 |       await page.goto('/');
  278 |       await page.getByRole('button', { name: '+ Character' }).click();
  279 |       await page.getByPlaceholder('Character name').fill('Zara');
  280 |       await selectClass(page, 'Rogue');
  281 | 
  282 |       // While autosave is in flight, saving indicator text appears
  283 |       await expect(page.getByText('Saving...')).toBeVisible();
  284 |       resolveSave();
  285 |       await expect(page.getByText('Saving...')).not.toBeVisible();
  286 |     });
  287 | 
  288 |     test('displays an error message when the autosave API returns an error', async ({ page }) => {
  289 |       await mockAuth(page);
  290 |       await page.route('**/api/characters', async (route) => {
  291 |         if (route.request().method() === 'POST') {
  292 |           await route.fulfill({
  293 |             status: 400,
  294 |             contentType: 'application/json',
  295 |             body: JSON.stringify({ error: 'Name is required' }),
  296 |           });
  297 |         } else {
  298 |           await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  299 |         }
  300 |       });
  301 | 
  302 |       await page.goto('/');
  303 |       await page.getByRole('button', { name: '+ Character' }).click();
  304 |       await page.getByPlaceholder('Character name').fill('Oops');
  305 |       await selectClass(page, 'Cleric');
  306 | 
  307 |       await expect(page.getByText('Name is required')).toBeVisible();
  308 |       // Should remain on the editor page
  309 |       await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
  310 |     });
  311 |   });
  312 | 
  313 |   test.describe('Identity Fields', () => {
  314 |     test('Race dropdown changes racial ability bonuses', async ({ page }) => {
  315 |       await openEditor(page);
  316 | 
  317 |       // Default race is Human — select Elf which has +2 DEX / -2 CON
  318 |       const raceSelect = page.locator('select').filter({ hasText: 'Human' }).first();
  319 |       await raceSelect.selectOption('Elf');
  320 | 
  321 |       // The racial column for DEX should show +2
  322 |       const dexRow = page.locator('div.flex.items-center.gap-3').filter({ hasText: 'DEX' });
  323 |       await expect(dexRow.getByText('+2')).toBeVisible();
  324 |     });
  325 | 
  326 |     test('can fill optional identity fields without errors', async ({ page }) => {
  327 |       await openEditor(page);
  328 | 
  329 |       await page.getByPlaceholder('e.g. 25').fill('30');
  330 |       await page.getByPlaceholder("e.g. 5'10\"").fill("6'2\"");
  331 |       await page.getByPlaceholder('e.g. 180 lbs').fill('190 lbs');
  332 |       await page.getByPlaceholder('Common, Elvish...').fill('Common, Elvish');
  333 | 
  334 |       // No errors should be visible
  335 |       await expect(page.getByText(/failed|error/i)).not.toBeVisible();
  336 |     });
  337 | 
  338 |     test('ability scores cannot go below 8 or exceed the remaining point-buy budget', async ({ page }) => {
  339 |       await openEditor(page);
  340 | 
  341 |       const strengthInput = abilityRow(page, 'STR').locator('input[type="number"]').first();
  342 |       await strengthInput.fill('18');
  343 |       await expect(strengthInput).toHaveValue('18');
  344 |       await expect(page.getByText('16 / 28 points spent · 12 remaining')).toBeVisible();
  345 | 
  346 |       const dexterityInput = abilityRow(page, 'DEX').locator('input[type="number"]').first();
  347 |       await dexterityInput.fill('18');
  348 |       await expect(dexterityInput).toHaveValue('16');
  349 |       await expect(page.getByText('26 / 28 points spent · 2 remaining')).toBeVisible();
```