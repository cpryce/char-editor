import { test, expect } from '@playwright/test';
import { mockAuth } from './fixtures';

test.describe('Campaign Editor', () => {
  test('shows an Owner column between Name and Race in the characters table', async ({ page }) => {
    await mockAuth(page);

    await page.route('**/api/characters', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }

      return route.continue();
    });

    await page.route('**/api/campaigns', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              _id: 'campaign-1',
              name: 'Stonebridge',
              description: 'Test campaign',
              characterIds: ['char-1'],
              encounterIds: [],
              playerCount: 1,
              updatedAt: '2026-05-01T12:00:00.000Z',
            },
          ]),
        });
      }

      return route.continue();
    });

    await page.route('**/api/campaigns/campaign-1', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: 'campaign-1',
            name: 'Stonebridge',
            description: 'Test campaign',
            createdAt: '2026-05-01T12:00:00.000Z',
            owner: { _id: 'u-1', name: 'GM', email: 'gm@example.com' },
            characters: [
              {
                _id: 'char-1',
                name: 'Aldric Stonehammer',
                owner: 'u-1',
                ownerName: 'GM',
                race: 'Dwarf',
                classes: [{ name: 'Fighter', level: 3 }],
              },
            ],
            players: [],
            pointBuySystem: 'adnd28',
          }),
        });
      }

      return route.continue();
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Campaigns' }).click();
    await page.getByRole('menuitem', { name: 'Campaigns' }).click();
    await page.getByRole('button', { name: /Stonebridge/ }).first().click();

    const headers = page.getByRole('columnheader');
    await expect(headers).toHaveText(['Name', 'Owner', 'Race', 'Class', 'Level', '']);
    await expect(page.getByRole('cell', { name: 'GM' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'u-1' })).toHaveCount(0);
  });
});
