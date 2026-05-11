# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: character-editor.spec.ts >> Character Editor >> Form Validation >> autosave does not fire when class is selected but name is empty
- Location: e2e/character-editor.spec.ts:136:9

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
  - generic [ref=e6]: at transformWithOxc (file:///Volumes/myProjects/char-editor/node_modules/vite/dist/node/chunks/node.js:3742:19) at TransformPluginContext.transform (file:///Volumes/myProjects/char-editor/node_modules/vite/dist/node/chunks/node.js:3810:26) at EnvironmentPluginContainer.transform (file:///Volumes/myProjects/char-editor/node_modules/vite/dist/node/chunks/node.js:30141:51) at async loadAndTransform (file:///Volumes/myProjects/char-editor/node_modules/vite/dist/node/chunks/node.js:24489:26)
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
  44  |       await openEditor(page);
  45  | 
  46  |       await expect(page.getByRole('heading', { name: /^Hit Points$/i, level: 3 })).toHaveCount(0);
  47  |       await expect(page.getByRole('textbox', { name: 'Hit Points' })).toBeVisible();
  48  |       await expect(page.getByRole('textbox', { name: 'Hit Points' })).toHaveValue('0');
  49  |     });
  50  | 
  51  |     test('shows Ability Score rows (STR, DEX, CON, INT, WIS, CHA)', async ({ page }) => {
  52  |       await openEditor(page);
  53  | 
  54  |       const heading = page.getByRole('heading', { name: /ability scores/i, level: 3 });
  55  |       await expect(heading).toBeVisible();
  56  | 
  57  |       // Scope to the ability scores section — the labels are <span class="w-8 ...">
  58  |       // Avoid collision with the Skills table which also shows "STR", "DEX", etc. in key ability cells
  59  |       for (const label of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) {
  60  |         await expect(page.locator('span.w-8', { hasText: label })).toBeVisible();
  61  |       }
  62  |     });
  63  | 
  64  |     test('starts all base ability scores at 8 and shows full 28-point budget remaining', async ({ page }) => {
  65  |       await openEditor(page);
  66  | 
  67  |       for (const label of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) {
  68  |         await expect(abilityRow(page, label).locator('input[type="number"]').first()).toHaveValue('8');
  69  |       }
  70  | 
  71  |       await expect(page.getByText('0 / 28 points spent · 28 remaining')).toBeVisible();
  72  |     });
  73  | 
  74  |     test('shows the Skills section with a table', async ({ page }) => {
  75  |       await openEditor(page);
  76  | 
  77  |       await expect(page.getByRole('heading', { name: /skills/i, level: 3 })).toBeVisible();
  78  |       await expect(page.getByRole('columnheader', { name: 'Skill' })).toBeVisible();
  79  |       await expect(page.getByRole('columnheader', { name: 'Ranks' })).toBeVisible();
  80  |       await expect(page.getByRole('columnheader', { name: 'Bonus', exact: true })).toBeVisible();
  81  |     });
  82  | 
  83  |     test('shows both Cancel buttons (top and bottom of form)', async ({ page }) => {
  84  |       await openEditor(page);
  85  | 
  86  |       await expect(page.getByRole('button', { name: 'Back to characters' })).toBeVisible();
  87  |     });
  88  |   });
  89  | 
  90  |   test.describe('Navigation', () => {
  91  |     test('back button returns to the character list', async ({ page }) => {
  92  |       await openEditor(page);
  93  | 
  94  |       await page.getByRole('button', { name: 'Back to characters' }).click();
  95  |       await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
  96  |     });
  97  | 
  98  |     test('Character Editor nav menu → Characters returns to the character list', async ({ page }) => {
  99  |       await openEditor(page);
  100 | 
  101 |       await page.getByRole('button', { name: 'Character Editor' }).click();
  102 |       await page.getByRole('menuitem', { name: 'Characters' }).click();
  103 |       await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
  104 |     });
  105 |   });
  106 | 
  107 |   test.describe('Form Validation', () => {
  108 |     test('autosave does not fire when name and class are empty', async ({ page }) => {
  109 |       let postCount = 0;
  110 |       await mockAuth(page);
  111 |       await page.route('**/api/characters', async (route) => {
  112 |         if (route.request().method() === 'POST') { postCount++; }
  113 |         await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  114 |       });
  115 |       await page.goto('/');
  116 |       await page.getByRole('button', { name: '+ Character' }).click();
  117 |       await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
  118 |       await page.waitForTimeout(800);
  119 |       expect(postCount).toBe(0);
  120 |     });
  121 | 
  122 |     test('autosave does not fire when name is filled but no class selected', async ({ page }) => {
  123 |       let postCount = 0;
  124 |       await mockAuth(page);
  125 |       await page.route('**/api/characters', async (route) => {
  126 |         if (route.request().method() === 'POST') { postCount++; }
  127 |         await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  128 |       });
  129 |       await page.goto('/');
  130 |       await page.getByRole('button', { name: '+ Character' }).click();
  131 |       await page.getByPlaceholder('Character name').fill('Thorin');
  132 |       await page.waitForTimeout(800);
  133 |       expect(postCount).toBe(0);
  134 |     });
  135 | 
  136 |     test('autosave does not fire when class is selected but name is empty', async ({ page }) => {
  137 |       let postCount = 0;
  138 |       await mockAuth(page);
  139 |       await page.route('**/api/characters', async (route) => {
  140 |         if (route.request().method() === 'POST') { postCount++; }
  141 |         await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  142 |       });
  143 |       await page.goto('/');
> 144 |       await page.getByRole('button', { name: '+ Character' }).click();
      |                                                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
  145 |       await selectClass(page, 'Rogue');
  146 |       await page.waitForTimeout(800);
  147 |       expect(postCount).toBe(0);
  148 |     });
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
```