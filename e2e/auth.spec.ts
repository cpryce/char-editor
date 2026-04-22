import { test, expect } from '@playwright/test';
import { mockAuth, mockUnauthenticated, MOCK_USER, gotoApp } from './fixtures';

test.describe('Authentication', () => {
  test('shows sign-in page when unauthenticated', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Sign in with Google' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'char-editor', level: 1 })).toBeVisible();
  });

  test('sign-in link points to Google OAuth endpoint', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/');

    await expect(
      page.getByRole('link', { name: 'Sign in with Google' })
    ).toHaveAttribute('href', '/auth/google');
  });

  test('sign-in page does not show the sidebar', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Characters' })).not.toBeVisible();
  });

  test('authenticated user sees full app layout', async ({ page }) => {
    await gotoApp(page);

    await expect(page.getByText(MOCK_USER.name)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Characters' })).toBeVisible();
    // Header bar brand name (a <span>, not a heading)
    await expect(page.locator('header').getByText('char-editor')).toBeVisible();
  });

  test('user menu shows email when opened', async ({ page }) => {
    await gotoApp(page);

    // The trigger button contains the user name as text
    await page.getByRole('button', { name: /Test User/ }).click();
    await expect(page.getByText(MOCK_USER.email)).toBeVisible();
  });

  test('user menu contains a disabled Settings option', async ({ page }) => {
    await gotoApp(page);

    await page.getByRole('button', { name: /Test User/ }).click();
    const settingsBtn = page.getByRole('button', { name: 'Settings' });
    await expect(settingsBtn).toBeVisible();
    await expect(settingsBtn).toBeDisabled();
  });

  test('sign out calls logout endpoint and returns to sign-in', async ({ page }) => {
    let logoutCalled = false;

    await mockAuth(page);
    await page.route('**/api/characters', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route('**/auth/logout', (route) => {
      logoutCalled = true;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.goto('/');
    await expect(page.getByText(MOCK_USER.name)).toBeVisible();

    // Open the user menu then click Sign out
    await page.getByRole('button', { name: /Test User/ }).click();
    await page.getByRole('button', { name: 'Sign out' }).click();

    // App sets user to null → renders unauthenticated view
    await expect(page.getByRole('link', { name: 'Sign in with Google' })).toBeVisible();
    expect(logoutCalled).toBe(true);
  });
});
