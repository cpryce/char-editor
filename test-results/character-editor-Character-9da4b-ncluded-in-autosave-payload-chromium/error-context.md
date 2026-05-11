# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: character-editor.spec.ts >> Character Editor >> Backup Weapons >> inline backup weapon label is included in autosave payload
- Location: e2e/character-editor.spec.ts:396:9

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
  350 | 
  351 |       await strengthInput.fill('6');
  352 |       await expect(strengthInput).toHaveValue('8');
  353 |     });
  354 | 
  355 |     test('hit points update when class or constitution changes', async ({ page }) => {
  356 |       await openEditor(page);
  357 | 
  358 |       const hitPointsInput = page.getByRole('textbox', { name: 'Hit Points' });
  359 |       await selectClass(page, 'Fighter');
  360 |       await expect(hitPointsInput).toHaveValue('9');
  361 | 
  362 |       await abilityRow(page, 'CON').locator('input[type="number"]').first().fill('14');
  363 |       await expect(hitPointsInput).toHaveValue('12');
  364 | 
  365 |       await selectClass(page, 'Wizard');
  366 |       await expect(hitPointsInput).toHaveValue('6');
  367 |     });
  368 |   });
  369 | 
  370 |   test.describe('Backup Weapons', () => {
  371 |     async function openInventory(page: Page) {
  372 |       await page.getByRole('button', { name: /Inventory/i }).click();
  373 |       await expect(page.getByRole('button', { name: 'Add Weapon' })).toBeVisible();
  374 |     }
  375 | 
  376 |     test('can add up to three backup weapon selectors', async ({ page }) => {
  377 |       await openEditor(page);
  378 |       await openInventory(page);
  379 | 
  380 |       const addWeaponButton = page.getByRole('button', { name: 'Add Weapon' });
  381 |       await expect(page.getByText('0/3 backup weapons')).toBeVisible();
  382 | 
  383 |       await addWeaponButton.click();
  384 |       await expect(page.getByText('1/3 backup weapons')).toBeVisible();
  385 | 
  386 |       await addWeaponButton.click();
  387 |       await expect(page.getByText('2/3 backup weapons')).toBeVisible();
  388 | 
  389 |       await addWeaponButton.click();
  390 |       await expect(page.getByText('3/3 backup weapons')).toBeVisible();
  391 | 
  392 |       await expect(page.getByRole('textbox', { name: 'Weapon selector name' })).toHaveCount(3);
  393 |       await expect(addWeaponButton).toBeDisabled();
  394 |     });
  395 | 
  396 |     test('inline backup weapon label is included in autosave payload', async ({ page }) => {
  397 |       let latestSavedBody: Record<string, unknown> | null = null;
  398 | 
  399 |       await mockAuth(page);
  400 |       await page.route('**/api/characters', async (route) => {
  401 |         const method = route.request().method();
  402 |         if (method === 'GET') {
  403 |           await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  404 |           return;
  405 |         }
  406 | 
  407 |         if (method === 'POST' || method === 'PUT') {
  408 |           latestSavedBody = await route.request().postDataJSON() as Record<string, unknown>;
  409 |           await route.fulfill({
  410 |             status: method === 'POST' ? 201 : 200,
  411 |             contentType: 'application/json',
  412 |             body: JSON.stringify({ _id: 'backup-test-id', name: 'Backup Tester', classes: [{ name: 'Fighter', level: 1 }], updatedAt: new Date().toISOString() }),
  413 |           });
  414 |           return;
  415 |         }
  416 | 
  417 |         await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  418 |       });
  419 | 
  420 |       await page.goto('/');
> 421 |       await page.getByRole('button', { name: '+ Character' }).click();
      |                                                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
  422 |       await page.getByPlaceholder('Character name').fill('Backup Tester');
  423 |       await selectClass(page, 'Fighter');
  424 |       await openInventory(page);
  425 | 
  426 |       await page.getByRole('button', { name: 'Add Weapon' }).click();
  427 |       const firstLabelInput = page.getByRole('textbox', { name: 'Weapon selector name' }).first();
  428 |       await firstLabelInput.fill('Main Backup');
  429 | 
  430 |       await expect.poll(() => {
  431 |         const inv = latestSavedBody?.inventory as { backupWeapons?: Array<{ label?: string }> } | undefined;
  432 |         return inv?.backupWeapons?.[0]?.label ?? null;
  433 |       }).toBe('Main Backup');
  434 |     });
  435 | 
  436 |     test('backup weapon label persists after reopening editor', async ({ page }) => {
  437 |       const characterId = 'char-backup-1';
  438 |       const characters = [
  439 |         {
  440 |           _id: characterId,
  441 |           name: 'Backup Hero',
  442 |           classes: [{ name: 'Fighter', level: 1 }],
  443 |           updatedAt: new Date().toISOString(),
  444 |         },
  445 |       ];
  446 | 
  447 |       let storedCharacter: Record<string, unknown> = {
  448 |         _id: characterId,
  449 |         name: 'Backup Hero',
  450 |         classes: [{ name: 'Fighter', level: 1 }],
  451 |         inventory: { backupWeapons: [] },
  452 |         updatedAt: new Date().toISOString(),
  453 |       };
  454 | 
  455 |       await mockAuth(page);
  456 |       await page.route('**/api/characters', async (route) => {
  457 |         const method = route.request().method();
  458 |         if (method === 'GET') {
  459 |           await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(characters) });
  460 |           return;
  461 |         }
  462 | 
  463 |         if (method === 'POST' || method === 'PUT') {
  464 |           const body = await route.request().postDataJSON() as Record<string, unknown>;
  465 |           storedCharacter = {
  466 |             ...storedCharacter,
  467 |             ...body,
  468 |             _id: characterId,
  469 |             updatedAt: new Date().toISOString(),
  470 |           };
  471 |           characters[0] = {
  472 |             ...characters[0],
  473 |             name: typeof body.name === 'string' ? body.name : characters[0].name,
  474 |             classes: Array.isArray(body.classes) ? body.classes as Array<{ name: string; level: number }> : characters[0].classes,
  475 |             updatedAt: new Date().toISOString(),
  476 |           };
  477 |           await route.fulfill({ status: method === 'POST' ? 201 : 200, contentType: 'application/json', body: JSON.stringify(storedCharacter) });
  478 |           return;
  479 |         }
  480 | 
  481 |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(characters) });
  482 |       });
  483 | 
  484 |       await page.route(`**/api/characters/${characterId}`, async (route) => {
  485 |         if (route.request().method() === 'GET') {
  486 |           await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(storedCharacter) });
  487 |           return;
  488 |         }
  489 |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(storedCharacter) });
  490 |       });
  491 | 
  492 |       await page.goto('/');
  493 |       await page.getByRole('button', { name: '+ Character' }).click();
  494 |       await page.getByPlaceholder('Character name').fill('Backup Hero');
  495 |       await selectClass(page, 'Fighter');
  496 | 
  497 |       await openInventory(page);
  498 |       await page.getByRole('button', { name: 'Add Weapon' }).click();
  499 |       await page.getByRole('textbox', { name: 'Weapon selector name' }).first().fill('Pack Spear');
  500 | 
  501 |       await expect.poll(() => {
  502 |         const inv = storedCharacter.inventory as { backupWeapons?: Array<{ label?: string }> } | undefined;
  503 |         return inv?.backupWeapons?.[0]?.label ?? null;
  504 |       }).toBe('Pack Spear');
  505 | 
  506 |       await page.getByRole('button', { name: 'Back to characters' }).click();
  507 |       await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
  508 | 
  509 |       await page.getByRole('cell', { name: 'Backup Hero', exact: true }).click();
  510 |       await expect(page.getByRole('heading', { name: 'Backup Hero', level: 2 })).toBeVisible();
  511 | 
  512 |       await openInventory(page);
  513 |       await expect(page.getByRole('textbox', { name: 'Weapon selector name' }).first()).toHaveValue('Pack Spear');
  514 |       await expect(page.getByText('1/3 backup weapons')).toBeVisible();
  515 |     });
  516 |   });
  517 | });
  518 | 
```