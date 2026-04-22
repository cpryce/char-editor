import type { Page } from '@playwright/test';

export const MOCK_USER = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  avatar: null as string | null,
};

export const MOCK_CHARACTERS = [
  {
    _id: 'char-1',
    name: 'Aldric Stonehammer',
    classes: [{ name: 'Fighter', level: 3 }],
    updatedAt: '2026-04-01T10:00:00.000Z',
  },
  {
    _id: 'char-2',
    name: 'Sylara Moonshadow',
    classes: [{ name: 'Wizard', level: 5 }],
    updatedAt: '2026-03-15T08:30:00.000Z',
  },
];

/** Mocks GET /auth/me to return an authenticated user. */
export async function mockAuth(page: Page, user = MOCK_USER) {
  await page.route('**/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) })
  );
}

/** Mocks GET /auth/me to return 401 (unauthenticated). */
export async function mockUnauthenticated(page: Page) {
  await page.route('**/auth/me', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthorized' }) })
  );
}

/** Mocks GET /api/characters to return the given list. */
export async function mockCharactersList(page: Page, characters = MOCK_CHARACTERS) {
  await page.route('**/api/characters', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(characters) });
    } else {
      route.continue();
    }
  });
}

/**
 * Sets up auth + empty characters mocks, then navigates to the app root.
 * Pass a characters array to pre-populate the list.
 */
export async function gotoApp(page: Page, characters = MOCK_CHARACTERS) {
  await mockAuth(page);
  await mockCharactersList(page, characters);
  await page.goto('/');
}
