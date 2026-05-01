import { test, expect, type Page } from '@playwright/test';
import { mockAuth, gotoApp } from './fixtures';

/** Navigates to the app and opens the New Character editor. */
async function openEditor(page: Page) {
  await gotoApp(page, []);
  await page.getByRole('button', { name: '+ Character' }).click();
  await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
}

/** Selects a class in the class dropdown. */
async function selectClass(page: Page, className: string) {
  await page.locator('select').filter({ hasText: '— Select class —' }).selectOption(className);
}

function abilityRow(page: Page, label: string) {
  return page.locator('div.flex.items-center.gap-3').filter({
    has: page.locator('span.w-8', { hasText: label }),
  });
}

test.describe('Character Editor', () => {
  test.describe('Layout', () => {
    test('shows the New Character heading', async ({ page }) => {
      await openEditor(page);

      await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
    });

    test('shows the Identity section with a Name field', async ({ page }) => {
      await openEditor(page);

      await expect(page.getByRole('heading', { name: /identity/i, level: 3 })).toBeVisible();
      await expect(page.getByPlaceholder('Character name')).toBeVisible();
    });

    test('shows the Class & Level section', async ({ page }) => {
      await openEditor(page);

      await expect(page.getByRole('heading', { name: /class/i, level: 3 })).toBeVisible();
    });

    test('shows a derived hit points field under the class selector instead of a hit points section', async ({ page }) => {
      await openEditor(page);

      await expect(page.getByRole('heading', { name: /^Hit Points$/i, level: 3 })).toHaveCount(0);
      await expect(page.getByRole('textbox', { name: 'Hit Points' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Hit Points' })).toHaveValue('');
    });

    test('shows Ability Score rows (STR, DEX, CON, INT, WIS, CHA)', async ({ page }) => {
      await openEditor(page);

      const heading = page.getByRole('heading', { name: /ability scores/i, level: 3 });
      await expect(heading).toBeVisible();

      // Scope to the ability scores section — the labels are <span class="w-8 ...">
      // Avoid collision with the Skills table which also shows "STR", "DEX", etc. in key ability cells
      for (const label of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) {
        await expect(page.locator('span.w-8', { hasText: label })).toBeVisible();
      }
    });

    test('starts all base ability scores at 8 and shows full 28-point budget remaining', async ({ page }) => {
      await openEditor(page);

      for (const label of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) {
        await expect(abilityRow(page, label).locator('input[type="number"]')).toHaveValue('8');
      }

      await expect(page.getByText('0 / 28 points spent · 28 remaining')).toBeVisible();
    });

    test('shows the Skills section with a table', async ({ page }) => {
      await openEditor(page);

      await expect(page.getByRole('heading', { name: /skills/i, level: 3 })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Skill' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Ranks' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Bonus' })).toBeVisible();
    });

    test('shows both Cancel buttons (top and bottom of form)', async ({ page }) => {
      await openEditor(page);

      await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(2);
    });
  });

  test.describe('Navigation', () => {
    test('top Cancel button returns to the character list', async ({ page }) => {
      await openEditor(page);

      await page.getByRole('button', { name: 'Cancel' }).first().click();
      await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
    });

    test('bottom Cancel button returns to the character list', async ({ page }) => {
      await openEditor(page);

      await page.getByRole('button', { name: 'Cancel' }).last().click();
      await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('Save Character is disabled when name and class are empty', async ({ page }) => {
      await openEditor(page);

      await expect(page.getByRole('button', { name: 'Save Character' })).toBeDisabled();
    });

    test('Save Character is disabled when name is filled but no class selected', async ({ page }) => {
      await openEditor(page);

      await page.getByPlaceholder('Character name').fill('Thorin');
      await expect(page.getByRole('button', { name: 'Save Character' })).toBeDisabled();
    });

    test('Save Character is disabled when class is selected but name is empty', async ({ page }) => {
      await openEditor(page);

      await selectClass(page, 'Rogue');
      await expect(page.getByRole('button', { name: 'Save Character' })).toBeDisabled();
    });

    test('Save Character becomes enabled when both name and class are filled', async ({ page }) => {
      await openEditor(page);

      await page.getByPlaceholder('Character name').fill('Thorin');
      await selectClass(page, 'Fighter');
      await expect(page.getByRole('button', { name: 'Save Character' })).toBeEnabled();
    });
  });

  test.describe('Form Submission', () => {
    test('submitting a valid form POSTs to /api/characters and navigates back', async ({ page }) => {
      let postedBody: Record<string, unknown> | null = null;

      await mockAuth(page);
      await page.route('**/api/characters', async (route) => {
        if (route.request().method() === 'POST') {
          postedBody = await route.request().postDataJSON() as Record<string, unknown>;
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ _id: 'new-id', name: 'Thorin', classes: [{ name: 'Fighter', level: 1 }], updatedAt: new Date().toISOString() }),
          });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
      });

      await page.goto('/');
      await page.getByRole('button', { name: '+ Character' }).click();
      await page.getByPlaceholder('Character name').fill('Thorin');
      await selectClass(page, 'Fighter');
      await page.getByRole('button', { name: 'Save Character' }).click();

      await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
      expect(postedBody).toMatchObject({ name: 'Thorin' });
    });

    test('submitted body contains the selected class', async ({ page }) => {
      let postedBody: Record<string, unknown> | null = null;

      await mockAuth(page);
      await page.route('**/api/characters', async (route) => {
        if (route.request().method() === 'POST') {
          postedBody = await route.request().postDataJSON() as Record<string, unknown>;
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ _id: 'new-id', name: 'Lyra', classes: [{ name: 'Wizard', level: 1 }], updatedAt: new Date().toISOString() }),
          });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
      });

      await page.goto('/');
      await page.getByRole('button', { name: '+ Character' }).click();
      await page.getByPlaceholder('Character name').fill('Lyra');
      await selectClass(page, 'Wizard');
      await page.getByRole('button', { name: 'Save Character' }).click();

      expect(postedBody).toMatchObject({
        classes: [{ name: 'Wizard', level: 1 }],
      });
    });

    test('submitted body contains calculated first-level hit points', async ({ page }) => {
      let postedBody: Record<string, unknown> | null = null;

      await mockAuth(page);
      await page.route('**/api/characters', async (route) => {
        if (route.request().method() === 'POST') {
          postedBody = await route.request().postDataJSON() as Record<string, unknown>;
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ _id: 'new-id', name: 'Borin', classes: [{ name: 'Fighter', level: 1 }], updatedAt: new Date().toISOString() }),
          });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
      });

      await page.goto('/');
      await page.getByRole('button', { name: '+ Character' }).click();
      await page.getByPlaceholder('Character name').fill('Borin');
      await selectClass(page, 'Fighter');
      await abilityRow(page, 'CON').locator('input[type="number"]').fill('14');
      await page.getByRole('button', { name: 'Save Character' }).click();

      expect(postedBody).toMatchObject({
        hitPoints: { max: 12, current: 12, nonlethal: 0 },
      });
    });

    test('Save button shows "Saving…" while the request is in flight', async ({ page }) => {
      await mockAuth(page);

      let resolveSave!: () => void;
      await page.route('**/api/characters', async (route) => {
        if (route.request().method() === 'POST') {
          await new Promise<void>((res) => { resolveSave = res; });
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ _id: 'new-id', name: 'Zara', classes: [{ name: 'Rogue', level: 1 }], updatedAt: new Date().toISOString() }),
          });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
      });

      await page.goto('/');
      await page.getByRole('button', { name: '+ Character' }).click();
      await page.getByPlaceholder('Character name').fill('Zara');
      await selectClass(page, 'Rogue');
      await page.getByRole('button', { name: 'Save Character' }).click();

      await expect(page.getByRole('button', { name: 'Saving…' })).toBeVisible();
      resolveSave();

      await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
    });

    test('displays an error message when the API returns an error', async ({ page }) => {
      await mockAuth(page);
      await page.route('**/api/characters', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Name is required' }),
          });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
      });

      await page.goto('/');
      await page.getByRole('button', { name: '+ Character' }).click();
      await page.getByPlaceholder('Character name').fill('Oops');
      await selectClass(page, 'Cleric');
      await page.getByRole('button', { name: 'Save Character' }).click();

      await expect(page.getByText('Name is required')).toBeVisible();
      // Should remain on the editor page
      await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
    });
  });

  test.describe('Identity Fields', () => {
    test('Race dropdown changes racial ability bonuses', async ({ page }) => {
      await openEditor(page);

      // Default race is Human — select Elf which has +2 DEX / -2 CON
      const raceSelect = page.locator('select').filter({ hasText: 'Human' }).first();
      await raceSelect.selectOption('Elf');

      // The racial column for DEX should show +2
      const dexRow = page.locator('div.flex.items-center.gap-3').filter({ hasText: 'DEX' });
      await expect(dexRow.getByText('+2')).toBeVisible();
    });

    test('can fill optional identity fields without errors', async ({ page }) => {
      await openEditor(page);

      await page.getByPlaceholder('e.g. 25').fill('30');
      await page.getByPlaceholder("e.g. 5'10\"").fill("6'2\"");
      await page.getByPlaceholder('e.g. 180 lbs').fill('190 lbs');
      await page.getByPlaceholder('Common, Elvish…').fill('Common, Elvish');

      // No errors should be visible
      await expect(page.getByText(/failed|error/i)).not.toBeVisible();
    });

    test('ability scores cannot go below 8 or exceed the remaining point-buy budget', async ({ page }) => {
      await openEditor(page);

      const strengthInput = abilityRow(page, 'STR').locator('input[type="number"]');
      await strengthInput.fill('18');
      await expect(strengthInput).toHaveValue('18');
      await expect(page.getByText('16 / 28 points spent · 12 remaining')).toBeVisible();

      const dexterityInput = abilityRow(page, 'DEX').locator('input[type="number"]');
      await dexterityInput.fill('18');
      await expect(dexterityInput).toHaveValue('16');
      await expect(page.getByText('26 / 28 points spent · 2 remaining')).toBeVisible();

      await strengthInput.fill('6');
      await expect(strengthInput).toHaveValue('8');
    });

    test('hit points update when class or constitution changes', async ({ page }) => {
      await openEditor(page);

      const hitPointsInput = page.getByRole('textbox', { name: 'Hit Points' });
      await selectClass(page, 'Fighter');
      await expect(hitPointsInput).toHaveValue('9');

      await abilityRow(page, 'CON').locator('input[type="number"]').fill('14');
      await expect(hitPointsInput).toHaveValue('12');

      await selectClass(page, 'Wizard');
      await expect(hitPointsInput).toHaveValue('6');
    });
  });

  test.describe('Backup Weapons', () => {
    async function openInventory(page: Page) {
      await page.getByRole('button', { name: /Inventory/i }).click();
      await expect(page.getByRole('button', { name: 'Add Weapon' })).toBeVisible();
    }

    test('can add up to three backup weapon selectors', async ({ page }) => {
      await openEditor(page);
      await openInventory(page);

      const addWeaponButton = page.getByRole('button', { name: 'Add Weapon' });
      await expect(page.getByText('0/3 backup weapons')).toBeVisible();

      await addWeaponButton.click();
      await expect(page.getByText('1/3 backup weapons')).toBeVisible();

      await addWeaponButton.click();
      await expect(page.getByText('2/3 backup weapons')).toBeVisible();

      await addWeaponButton.click();
      await expect(page.getByText('3/3 backup weapons')).toBeVisible();

      await expect(page.getByRole('textbox', { name: 'Weapon selector name' })).toHaveCount(3);
      await expect(addWeaponButton).toBeDisabled();
    });

    test('inline backup weapon label is included in autosave payload', async ({ page }) => {
      let latestSavedBody: Record<string, unknown> | null = null;

      await mockAuth(page);
      await page.route('**/api/characters', async (route) => {
        const method = route.request().method();
        if (method === 'GET') {
          await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
          return;
        }

        if (method === 'POST' || method === 'PUT') {
          latestSavedBody = await route.request().postDataJSON() as Record<string, unknown>;
          await route.fulfill({
            status: method === 'POST' ? 201 : 200,
            contentType: 'application/json',
            body: JSON.stringify({ _id: 'backup-test-id', name: 'Backup Tester', classes: [{ name: 'Fighter', level: 1 }], updatedAt: new Date().toISOString() }),
          });
          return;
        }

        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      });

      await page.goto('/');
      await page.getByRole('button', { name: '+ Character' }).click();
      await page.getByPlaceholder('Character name').fill('Backup Tester');
      await selectClass(page, 'Fighter');
      await openInventory(page);

      await page.getByRole('button', { name: 'Add Weapon' }).click();
      const firstLabelInput = page.getByRole('textbox', { name: 'Weapon selector name' }).first();
      await firstLabelInput.fill('Main Backup');

      await expect.poll(() => {
        const inv = latestSavedBody?.inventory as { backupWeapons?: Array<{ label?: string }> } | undefined;
        return inv?.backupWeapons?.[0]?.label ?? null;
      }).toBe('Main Backup');
    });

    test('backup weapon label persists after reopening editor', async ({ page }) => {
      const characterId = 'char-backup-1';
      const characters = [
        {
          _id: characterId,
          name: 'Backup Hero',
          classes: [{ name: 'Fighter', level: 1 }],
          updatedAt: new Date().toISOString(),
        },
      ];

      let storedCharacter: Record<string, unknown> = {
        _id: characterId,
        name: 'Backup Hero',
        classes: [{ name: 'Fighter', level: 1 }],
        inventory: { backupWeapons: [] },
        updatedAt: new Date().toISOString(),
      };

      await mockAuth(page);
      await page.route('**/api/characters', async (route) => {
        const method = route.request().method();
        if (method === 'GET') {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(characters) });
          return;
        }

        if (method === 'POST' || method === 'PUT') {
          const body = await route.request().postDataJSON() as Record<string, unknown>;
          storedCharacter = {
            ...storedCharacter,
            ...body,
            _id: characterId,
            updatedAt: new Date().toISOString(),
          };
          characters[0] = {
            ...characters[0],
            name: typeof body.name === 'string' ? body.name : characters[0].name,
            classes: Array.isArray(body.classes) ? body.classes as Array<{ name: string; level: number }> : characters[0].classes,
            updatedAt: new Date().toISOString(),
          };
          await route.fulfill({ status: method === 'POST' ? 201 : 200, contentType: 'application/json', body: JSON.stringify(storedCharacter) });
          return;
        }

        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(characters) });
      });

      await page.route(`**/api/characters/${characterId}`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(storedCharacter) });
          return;
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(storedCharacter) });
      });

      await page.goto('/');
      await page.getByRole('button', { name: '+ Character' }).click();
      await page.getByPlaceholder('Character name').fill('Backup Hero');
      await selectClass(page, 'Fighter');

      await openInventory(page);
      await page.getByRole('button', { name: 'Add Weapon' }).click();
      await page.getByRole('textbox', { name: 'Weapon selector name' }).first().fill('Pack Spear');

      await expect.poll(() => {
        const inv = storedCharacter.inventory as { backupWeapons?: Array<{ label?: string }> } | undefined;
        return inv?.backupWeapons?.[0]?.label ?? null;
      }).toBe('Pack Spear');

      await page.getByRole('button', { name: 'Back to characters' }).click();
      await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();

      await page.getByRole('cell', { name: 'Backup Hero' }).click();
      await expect(page.getByRole('heading', { name: 'Backup Hero', level: 2 })).toBeVisible();

      await openInventory(page);
      await expect(page.getByRole('textbox', { name: 'Weapon selector name' }).first()).toHaveValue('Pack Spear');
      await expect(page.getByText('1/3 backup weapons')).toBeVisible();
    });
  });
});
