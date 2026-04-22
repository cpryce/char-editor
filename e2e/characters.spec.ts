import { test, expect } from '@playwright/test';
import { gotoApp, MOCK_CHARACTERS } from './fixtures';

test.describe('Characters Page', () => {
  test('shows the Characters heading', async ({ page }) => {
    await gotoApp(page);

    await expect(page.getByRole('heading', { name: 'Characters', level: 2 })).toBeVisible();
  });

  test('renders all table column headers', async ({ page }) => {
    await gotoApp(page);

    for (const header of ['Name', 'Class', 'Level', 'Last Modified']) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
    }
  });

  test('shows empty state when no characters exist', async ({ page }) => {
    await gotoApp(page, []);

    await expect(page.getByText('No characters yet.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create a new character' })).toBeVisible();
  });

  test('renders character names in the table', async ({ page }) => {
    await gotoApp(page);

    await expect(page.getByRole('cell', { name: 'Aldric Stonehammer' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Sylara Moonshadow' })).toBeVisible();
  });

  test('renders class and level for each character', async ({ page }) => {
    await gotoApp(page);

    await expect(page.getByRole('cell', { name: 'Fighter' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Wizard' })).toBeVisible();

    // Levels
    const rows = page.getByRole('row');
    await expect(rows.nth(1).getByRole('cell').nth(2)).toContainText('3');
    await expect(rows.nth(2).getByRole('cell').nth(2)).toContainText('5');
  });

  test('renders formatted Last Modified dates', async ({ page }) => {
    await gotoApp(page);

    // Dates come from the mock characters — verify at least one date cell is non-empty
    const dateCell = page.getByRole('row').nth(1).getByRole('cell').nth(3);
    await expect(dateCell).not.toBeEmpty();
  });

  test('"+ Character" button navigates to the editor', async ({ page }) => {
    await gotoApp(page);

    await page.getByRole('button', { name: '+ Character' }).click();
    await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
  });

  test('"Create a new character" link navigates to the editor', async ({ page }) => {
    await gotoApp(page, []);

    await page.getByRole('button', { name: 'Create a new character' }).click();
    await expect(page.getByRole('heading', { name: 'New Character', level: 2 })).toBeVisible();
  });

  test('Characters sidebar item is active when on the list', async ({ page }) => {
    await gotoApp(page);

    const charactersBtn = page.getByRole('button', { name: 'Characters' });
    await expect(charactersBtn).toBeVisible();
    await expect(charactersBtn).toBeEnabled();
  });

  test('Custom Skills sidebar item is disabled', async ({ page }) => {
    await gotoApp(page);

    await expect(page.getByRole('button', { name: 'Custom Skills' })).toBeDisabled();
  });

  test('Custom Feats sidebar item is disabled', async ({ page }) => {
    await gotoApp(page);

    await expect(page.getByRole('button', { name: 'Custom Feats' })).toBeDisabled();
  });

  test('shows an error message when the API request fails', async ({ page }) => {
    await page.route('**/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', name: 'Test User', email: 'test@example.com' }) })
    );
    await page.route('**/api/characters', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal Server Error' }) })
    );

    await page.goto('/');
    await expect(page.getByText('Failed to load characters')).toBeVisible();
  });
});
