# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: characters.spec.ts >> Characters Page >> renders class and level for each character
- Location: e2e/characters.spec.ts:33:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('row').nth(1).getByRole('cell').nth(2)
Expected substring: "3"
Received string:    "Fighter"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for getByRole('row').nth(1).getByRole('cell').nth(2)
    9 × locator resolved to <td class="px-4 py-2 text-[color:var(--color-fg-default)] char-col-class">Fighter</td>
      - unexpected value "Fighter"

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
> 41  |     await expect(rows.nth(1).getByRole('cell').nth(2)).toContainText('3');
      |                                                        ^ Error: expect(locator).toContainText(expected) failed
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
  53  |   test('"+ New" button navigates to the editor', async ({ page }) => {
  54  |     await gotoApp(page);
  55  | 
  56  |     await page.getByRole('button', { name: '+ New' }).click();
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
  73  |   });
  74  | 
  75  |   test('Custom Skills nav item is disabled', async ({ page }) => {
  76  |     await gotoApp(page);
  77  | 
  78  |     await page.getByRole('button', { name: 'Character Editor' }).click();
  79  |     await expect(page.getByRole('menuitem', { name: 'Custom Skills' })).toHaveAttribute('aria-disabled', 'true');
  80  |   });
  81  | 
  82  |   test('Custom Feats nav item is enabled', async ({ page }) => {
  83  |     await gotoApp(page);
  84  | 
  85  |     await page.getByRole('button', { name: 'Character Editor' }).click();
  86  |     await expect(page.getByRole('menuitem', { name: 'Custom Feats' })).not.toHaveAttribute('aria-disabled');
  87  |   });
  88  | 
  89  |   test('shows an error message when the API request fails', async ({ page }) => {
  90  |     await page.route('**/auth/me', (route) =>
  91  |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', name: 'Test User', email: 'test@example.com' }) })
  92  |     );
  93  |     await page.route('**/api/characters', (route) =>
  94  |       route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal Server Error' }) })
  95  |     );
  96  | 
  97  |     await page.goto('/');
  98  |     await expect(page.getByText('Failed to load characters')).toBeVisible();
  99  |   });
  100 | });
  101 | 
```