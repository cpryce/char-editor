# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: character-editor.spec.ts >> Character Editor >> Identity Fields >> hit points update when class or constitution changes
- Location: e2e/character-editor.spec.ts:355:9

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
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import { mockAuth, gotoApp } from './fixtures';
  3   | 
  4   | /** Navigates to the app and opens the New Character editor. */
  5   | async function openEditor(page: Page) {
  6   |   await gotoApp(page, []);
> 7   |   await page.getByRole('button', { name: '+ Character' }).click();
      |                                                           ^ Error: locator.click: Test timeout of 30000ms exceeded.
  8   |   await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
  9   | }
  10  | 
  11  | /** Selects a class in the class dropdown. */
  12  | async function selectClass(page: Page, className: string) {
  13  |   await page.locator('select').filter({ hasText: '— Select class —' }).selectOption(className);
  14  | }
  15  | 
  16  | function abilityRow(page: Page, label: string) {
  17  |   return page.locator('div.flex.items-center.gap-3').filter({
  18  |     has: page.locator('span.w-8', { hasText: label }),
  19  |   });
  20  | }
  21  | 
  22  | test.describe('Character Editor', () => {
  23  |   test.describe('Layout', () => {
  24  |     test('shows the New Character heading', async ({ page }) => {
  25  |       await openEditor(page);
  26  | 
  27  |       await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
  28  |     });
  29  | 
  30  |     test('shows the Identity section with a Name field', async ({ page }) => {
  31  |       await openEditor(page);
  32  | 
  33  |       await expect(page.getByRole('heading', { name: /identity/i, level: 3 })).toBeVisible();
  34  |       await expect(page.getByPlaceholder('Character name')).toBeVisible();
  35  |     });
  36  | 
  37  |     test('shows the Class & Level section', async ({ page }) => {
  38  |       await openEditor(page);
  39  | 
  40  |       await expect(page.getByRole('heading', { name: /class/i, level: 3 })).toBeVisible();
  41  |     });
  42  | 
  43  |     test('shows a derived hit points field under the class selector instead of a hit points section', async ({ page }) => {
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
```