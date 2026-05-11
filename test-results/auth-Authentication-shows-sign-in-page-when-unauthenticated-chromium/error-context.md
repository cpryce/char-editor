# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> shows sign-in page when unauthenticated
- Location: e2e/auth.spec.ts:5:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: 'Sign in with Google' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: 'Sign in with Google' })

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
  1  | import { test, expect } from '@playwright/test';
  2  | import { mockAuth, mockUnauthenticated, MOCK_USER, gotoApp } from './fixtures';
  3  | 
  4  | test.describe('Authentication', () => {
  5  |   test('shows sign-in page when unauthenticated', async ({ page }) => {
  6  |     await mockUnauthenticated(page);
  7  |     await page.goto('/');
  8  | 
> 9  |     await expect(page.getByRole('link', { name: 'Sign in with Google' })).toBeVisible();
     |                                                                           ^ Error: expect(locator).toBeVisible() failed
  10 |     await expect(page.getByRole('heading', { name: 'char-editor', level: 1 })).toBeVisible();
  11 |   });
  12 | 
  13 |   test('sign-in link points to Google OAuth endpoint', async ({ page }) => {
  14 |     await mockUnauthenticated(page);
  15 |     await page.goto('/');
  16 | 
  17 |     await expect(
  18 |       page.getByRole('link', { name: 'Sign in with Google' })
  19 |     ).toHaveAttribute('href', '/auth/google');
  20 |   });
  21 | 
  22 |   test('sign-in page does not show the nav menu', async ({ page }) => {
  23 |     await mockUnauthenticated(page);
  24 |     await page.goto('/');
  25 | 
  26 |     await expect(page.getByRole('button', { name: 'Character Editor' })).not.toBeVisible();
  27 |   });
  28 | 
  29 |   test('authenticated user sees full app layout', async ({ page }) => {
  30 |     await gotoApp(page);
  31 | 
  32 |     await expect(page.getByText(MOCK_USER.name)).toBeVisible();
  33 |     await expect(page.getByRole('button', { name: 'Character Editor' })).toBeVisible();
  34 |     // Header bar brand name (a <span>, not a heading)
  35 |     await expect(page.locator('header').getByText('AD&D (3.5e) Tools')).toBeVisible();
  36 |   });
  37 | 
  38 |   test('user menu shows email when opened', async ({ page }) => {
  39 |     await gotoApp(page);
  40 | 
  41 |     // The trigger button contains the user name as text
  42 |     await page.getByRole('button', { name: /Test User/ }).click();
  43 |     await expect(page.getByText(MOCK_USER.email)).toBeVisible();
  44 |   });
  45 | 
  46 |   test('user menu contains a disabled Settings option', async ({ page }) => {
  47 |     await gotoApp(page);
  48 | 
  49 |     await page.getByRole('button', { name: /Test User/ }).click();
  50 |     const settingsBtn = page.getByRole('button', { name: 'Settings' });
  51 |     await expect(settingsBtn).toBeVisible();
  52 |     await expect(settingsBtn).toBeEnabled();
  53 |   });
  54 | 
  55 |   test('sign out calls logout endpoint and returns to sign-in', async ({ page }) => {
  56 |     let logoutCalled = false;
  57 | 
  58 |     await mockAuth(page);
  59 |     await page.route('**/api/characters', (route) =>
  60 |       route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  61 |     );
  62 |     await page.route('**/auth/logout', (route) => {
  63 |       logoutCalled = true;
  64 |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  65 |     });
  66 | 
  67 |     await page.goto('/');
  68 |     await expect(page.getByText(MOCK_USER.name)).toBeVisible();
  69 | 
  70 |     // Open the user menu then click Sign out
  71 |     await page.getByRole('button', { name: /Test User/ }).click();
  72 |     await page.getByRole('button', { name: 'Sign out' }).click();
  73 | 
  74 |     // App sets user to null → renders unauthenticated view
  75 |     await expect(page.getByRole('link', { name: 'Sign in with Google' })).toBeVisible();
  76 |     expect(logoutCalled).toBe(true);
  77 |   });
  78 | });
  79 | 
```