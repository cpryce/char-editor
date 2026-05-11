# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: characters.spec.ts >> Characters Page >> Custom Feats nav item is enabled
- Location: e2e/characters.spec.ts:83:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Character Editor' })

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
  1   | import { test, expect } from '@playwright/test';
  2   | import { gotoApp, MOCK_CHARACTERS } from './fixtures';
  3   | 
  4   | test.describe('Characters Page', () => {
  5   |   test('shows the Characters heading', async ({ page }) => {
  6   |     await gotoApp(page);
  7   | 
  8   |     await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
  9   |   });
  10  | 
  11  |   test('renders all table column headers', async ({ page }) => {
  12  |     await gotoApp(page);
  13  | 
  14  |     for (const header of ['Name', 'Class', 'Level', 'Last Modified']) {
  15  |       await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
  16  |     }
  17  |   });
  18  | 
  19  |   test('shows empty state when no characters exist', async ({ page }) => {
  20  |     await gotoApp(page, []);
  21  | 
  22  |     await expect(page.getByText('No characters yet.')).toBeVisible();
  23  |     await expect(page.getByRole('button', { name: 'Create a new character' })).toBeVisible();
  24  |   });
  25  | 
  26  |   test('renders character names in the table', async ({ page }) => {
  27  |     await gotoApp(page);
  28  | 
  29  |     await expect(page.getByRole('cell', { name: 'Aldric Stonehammer', exact: true })).toBeVisible();
  30  |     await expect(page.getByRole('cell', { name: 'Sylara Moonshadow', exact: true })).toBeVisible();
  31  |   });
  32  | 
  33  |   test('renders class and level for each character', async ({ page }) => {
  34  |     await gotoApp(page);
  35  | 
  36  |     await expect(page.getByRole('cell', { name: 'Fighter' })).toBeVisible();
  37  |     await expect(page.getByRole('cell', { name: 'Wizard' })).toBeVisible();
  38  | 
  39  |     // Levels
  40  |     const rows = page.getByRole('row');
  41  |     await expect(rows.nth(1).getByRole('cell').nth(2)).toContainText('3');
  42  |     await expect(rows.nth(2).getByRole('cell').nth(2)).toContainText('5');
  43  |   });
  44  | 
  45  |   test('renders formatted Last Modified dates', async ({ page }) => {
  46  |     await gotoApp(page);
  47  | 
  48  |     // Dates come from the mock characters — verify at least one date cell is non-empty
  49  |     const dateCell = page.getByRole('row').nth(1).getByRole('cell').nth(3);
  50  |     await expect(dateCell).not.toBeEmpty();
  51  |   });
  52  | 
  53  |   test('"+ Character" button navigates to the editor', async ({ page }) => {
  54  |     await gotoApp(page);
  55  | 
  56  |     await page.getByRole('button', { name: '+ Character' }).click();
  57  |     await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
  58  |   });
  59  | 
  60  |   test('"Create a new character" link navigates to the editor', async ({ page }) => {
  61  |     await gotoApp(page, []);
  62  | 
  63  |     await page.getByRole('button', { name: 'Create a new character' }).click();
  64  |     await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
  65  |   });
  66  | 
  67  |   test('Characters nav item is reachable from Character Editor menu', async ({ page }) => {
  68  |     await gotoApp(page);
  69  | 
  70  |     await page.getByRole('button', { name: 'Character Editor' }).click();
  71  |     const charactersBtn = page.getByRole('menuitem', { name: 'Characters' });
  72  |     await expect(charactersBtn).toBeVisible();
  73  |     await expect(charactersBtn).toBeEnabled();
  74  |   });
  75  | 
  76  |   test('Custom Skills nav item is disabled', async ({ page }) => {
  77  |     await gotoApp(page);
  78  | 
  79  |     await page.getByRole('button', { name: 'Character Editor' }).click();
  80  |     await expect(page.getByRole('menuitem', { name: 'Custom Skills' })).toBeDisabled();
  81  |   });
  82  | 
  83  |   test('Custom Feats nav item is enabled', async ({ page }) => {
  84  |     await gotoApp(page);
  85  | 
> 86  |     await page.getByRole('button', { name: 'Character Editor' }).click();
      |                                                                  ^ Error: locator.click: Test timeout of 30000ms exceeded.
  87  |     await expect(page.getByRole('menuitem', { name: 'Custom Feats' })).toBeEnabled();
  88  |   });
  89  | 
  90  |   test('shows an error message when the API request fails', async ({ page }) => {
  91  |     await page.route('**/auth/me', (route) =>
  92  |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', name: 'Test User', email: 'test@example.com' }) })
  93  |     );
  94  |     await page.route('**/api/characters', (route) =>
  95  |       route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal Server Error' }) })
  96  |     );
  97  | 
  98  |     await page.goto('/');
  99  |     await expect(page.getByText('Failed to load characters')).toBeVisible();
  100 |   });
  101 | });
  102 | 
```