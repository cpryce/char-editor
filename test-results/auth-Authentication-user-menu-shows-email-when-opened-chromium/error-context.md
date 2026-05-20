# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> user menu shows email when opened
- Location: e2e/auth.spec.ts:38:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Test User/ })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic "Application home" [ref=e6]:
        - img [ref=e7]
        - generic [ref=e9]: AD&D (3.5e) Tools
      - navigation [ref=e10]:
        - button "Character Editor" [ref=e12] [cursor=pointer]:
          - text: Character Editor
          - img [ref=e13]
        - button "Tools" [ref=e16] [cursor=pointer]:
          - text: Tools
          - img [ref=e17]
        - button "Campaigns" [ref=e20] [cursor=pointer]:
          - text: Campaigns
          - img [ref=e21]
      - button "▾" [ref=e24] [cursor=pointer]:
        - generic [ref=e25]: T
        - generic [ref=e26]: ▾
  - main [ref=e27]:
    - generic [ref=e29]:
      - generic [ref=e30]:
        - heading "Characters" [level=2] [ref=e31]
        - generic [ref=e32]:
          - generic [ref=e33]:
            - generic [ref=e34]:
              - searchbox "Search characters by name" [ref=e35]
              - img
            - generic [ref=e36]:
              - img
              - combobox "Filter by race" [ref=e37] [cursor=pointer]:
                - option "All races" [selected]
                - option
              - img
            - generic [ref=e38]:
              - img
              - combobox "Filter by class" [ref=e39] [cursor=pointer]:
                - option "All classes" [selected]
                - option "Fighter"
                - option "Wizard"
              - img
          - generic [ref=e40]:
            - button "+ New" [ref=e41] [cursor=pointer]:
              - generic [ref=e42]: + New
            - button "New character with class" [ref=e43] [cursor=pointer]:
              - img [ref=e44]
      - table [ref=e47]:
        - rowgroup [ref=e48]:
          - row "Name Race Class Level Last Modified" [ref=e49]:
            - columnheader "Name" [ref=e50] [cursor=pointer]:
              - generic [ref=e51]: Name
            - columnheader "Race" [ref=e52] [cursor=pointer]:
              - generic [ref=e53]: Race
            - columnheader "Class" [ref=e54] [cursor=pointer]:
              - generic [ref=e55]: Class
            - columnheader "Level" [ref=e56] [cursor=pointer]:
              - generic [ref=e57]: Level
            - columnheader "Last Modified" [ref=e58] [cursor=pointer]:
              - generic [ref=e59]:
                - text: Last Modified
                - img [ref=e60]
            - columnheader [ref=e62]
        - rowgroup [ref=e63]:
          - row "Aldric Stonehammer Fighter 3 1 month ago Delegate Aldric Stonehammer Delete Aldric Stonehammer" [ref=e64] [cursor=pointer]:
            - cell "Aldric Stonehammer" [ref=e65]:
              - generic [ref=e66]: Aldric Stonehammer
            - cell [ref=e67]
            - cell "Fighter" [ref=e68]
            - cell "3" [ref=e69]
            - cell "1 month ago" [ref=e70]
            - cell "Delegate Aldric Stonehammer Delete Aldric Stonehammer" [ref=e71]:
              - generic [ref=e72]:
                - button "Delegate Aldric Stonehammer" [ref=e73]:
                  - img [ref=e74]
                - link "Delete Aldric Stonehammer" [ref=e78]:
                  - /url: "#"
                  - img [ref=e79]
          - row "Sylara Moonshadow Wizard 5 2 months ago Delegate Sylara Moonshadow Delete Sylara Moonshadow" [ref=e82] [cursor=pointer]:
            - cell "Sylara Moonshadow" [ref=e83]:
              - generic [ref=e84]: Sylara Moonshadow
            - cell [ref=e85]
            - cell "Wizard" [ref=e86]
            - cell "5" [ref=e87]
            - cell "2 months ago" [ref=e88]
            - cell "Delegate Sylara Moonshadow Delete Sylara Moonshadow" [ref=e89]:
              - generic [ref=e90]:
                - button "Delegate Sylara Moonshadow" [ref=e91]:
                  - img [ref=e92]
                - link "Delete Sylara Moonshadow" [ref=e96]:
                  - /url: "#"
                  - img [ref=e97]
      - generic [ref=e100]:
        - generic [ref=e101]:
          - generic [ref=e102]: "Per page:"
          - combobox "Per page:" [ref=e103]:
            - option "5" [selected]
            - option "10"
            - option "25"
            - option "All"
        - generic [ref=e105]: 1–2 of 2
  - complementary [ref=e106]:
    - generic [ref=e107]:
      - heading "Settings" [level=3] [ref=e108]
      - button "Close" [ref=e109] [cursor=pointer]
    - generic [ref=e111]:
      - generic [ref=e112]: Theme
      - switch "Theme toggle" [ref=e113] [cursor=pointer]:
        - generic [ref=e115]:
          - generic [ref=e116]: Light
          - generic [ref=e117]: Dark
    - generic [ref=e119]:
      - heading "Rules" [level=3] [ref=e120]
      - paragraph [ref=e121]: Point Buy System
      - button "28-point" [ref=e123] [cursor=pointer]:
        - generic [ref=e124]: 28-point
        - img [ref=e125]
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
  9  |     await expect(page.getByRole('link', { name: 'Sign in with Google' })).toBeVisible();
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
> 42 |     await page.getByRole('button', { name: /Test User/ }).click();
     |                                                           ^ Error: locator.click: Test timeout of 30000ms exceeded.
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