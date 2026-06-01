import { test, expect, type Page } from '@playwright/test';
import { mockAuth, gotoApp, MOCK_USER, MOCK_CHARACTERS } from './fixtures';

const OWNER_ID = MOCK_USER.id; // 'test-user-id'
const OTHER_ID = 'other-user-id';

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGN_LIST = [
  {
    _id: 'camp-1',
    name: 'Test Campaign',
    description: 'A test campaign',
    characterIds: ['char-own', 'char-other', 'char-delegated'],
    encounterIds: [],
    playerCount: 2,
    accessLevel: 'owner',
    dmName: null,
    updatedAt: '2026-05-01T10:00:00.000Z',
  },
];

const MOCK_CAMPAIGN_DETAIL = {
  _id: 'camp-1',
  name: 'Test Campaign',
  description: 'A test campaign',
  createdAt: '2026-04-01T10:00:00.000Z',
  accessLevel: 'owner',
  owner: { _id: OWNER_ID, name: 'Test User', email: 'test@example.com', avatar: null },
  characters: [
    {
      _id: 'char-own',
      name: 'Aldric Stonehammer',
      race: 'Human',
      classes: [{ name: 'Fighter', level: 3 }],
      owner: OWNER_ID,
      delegatedTo: null,
      initiativeModifier: 1,
    },
    {
      _id: 'char-other',
      name: 'Sylara Moonshadow',
      race: 'Elf',
      classes: [{ name: 'Wizard', level: 5 }],
      owner: OTHER_ID,
      delegatedTo: null,
      initiativeModifier: 2,
    },
    {
      _id: 'char-delegated',
      name: 'Bronwin Ashback',
      race: 'Dwarf',
      classes: [{ name: 'Cleric', level: 2 }],
      owner: OTHER_ID,
      delegatedTo: OWNER_ID,
      initiativeModifier: 0,
    },
  ],
  players: [
    { _id: OWNER_ID, name: 'Test User', email: 'test@example.com', avatar: null },
    { _id: OTHER_ID, name: 'Other Player', email: 'other@example.com', avatar: null },
  ],
  encounters: [],
  invites: [],
};

// ── Navigation helpers ────────────────────────────────────────────────────────

const BLANK_ABILITY = { base: 10, racial: 0, enhancement: 0, misc: 0, temp: null, tempMod: 0, levelUp: 0 };
const MOCK_FULL_CHARACTER = {
  _id: 'char-other',
  name: 'Sylara Moonshadow',
  race: 'Elf',
  size: 'Medium',
  alignment: 'True Neutral',
  baseSpeed: '30',
  gender: 'Female', deity: '', age: '', height: '', weight: '', eyes: '', hair: '', skin: '', languages: '', description: '', backstory: '',
  racialAbilityChoice: null,
  classes: [{ name: 'Wizard', level: 5, hitDieType: 4, hpRolled: [] }],
  abilityScores: {
    strength: { ...BLANK_ABILITY },
    dexterity: { ...BLANK_ABILITY },
    constitution: { ...BLANK_ABILITY },
    intelligence: { ...BLANK_ABILITY },
    wisdom: { ...BLANK_ABILITY },
    charisma: { ...BLANK_ABILITY },
  },
  hitPoints: { max: 15, current: 15, nonlethal: 0 },
  combat: {
    initiative: { miscBonus: 0 },
    speed: { base: 30, armorAdjust: 0, fly: 0, swim: 0 },
    armorClass: { armor: 0, shield: 0, size: 0, dodge: 0, natural: 0, deflection: 0, misc: 0 },
    saves: {
      fortitude: { base: 0, magic: 0, misc: 0, temp: 0 },
      reflex: { base: 0, magic: 0, misc: 0, temp: 0 },
      will: { base: 0, magic: 0, misc: 0, temp: 0 },
    },
    baseAttackBonus: 0, grappleBonus: 0,
  },
  inventory: {
    wornSlots: {
      head: { item: '', weight: '', acType: '', acBonus: 0 }, face: { item: '', weight: '', acType: '', acBonus: 0 },
      neck: { item: '', weight: '', acType: '', acBonus: 0 }, shoulders: { item: '', weight: '', acType: '', acBonus: 0 },
      bodySlot: { item: '', weight: '', acType: '', acBonus: 0 }, chest: { item: '', weight: '', acType: '', acBonus: 0 },
      wrists: { item: '', weight: '', acType: '', acBonus: 0 }, hands: { item: '', weight: '', acType: '', acBonus: 0 },
      ringLeft: { item: '', weight: '', acType: '', acBonus: 0 }, ringRight: { item: '', weight: '', acType: '', acBonus: 0 },
      waist: { item: '', weight: '', acType: '', acBonus: 0 }, feet: { item: '', weight: '', acType: '', acBonus: 0 },
    },
    body: null, mainHand: null, offHandWeapon: null, offHandShield: null, backupWeapons: [],
  },
  feats: [], skills: [],
  spellcasting: { casterAbility: '', casterLevel: 0, arcaneSpellFailure: 0, spellSlots: [] },
  characterCustomClasses: [],
};

async function setupMocks(page: Page, detail = MOCK_CAMPAIGN_DETAIL) {
  await mockAuth(page);
  await page.route('**/api/characters', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    } else {
      route.continue();
    }
  });
  await page.route('**/api/campaigns', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CAMPAIGN_LIST),
      });
    } else {
      route.continue();
    }
  });
  await page.route('**/api/campaigns/camp-1', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      });
    } else {
      route.continue();
    }
  });
  // Full character data for stat block modal (any campaign member read-only endpoint)
  await page.route('**/api/campaigns/camp-1/characters/**', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_FULL_CHARACTER) });
    } else {
      route.fallback();
    }
  });
}

async function gotoCampaigns(page: Page) {
  await setupMocks(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Campaigns' }).click();
  await page.getByRole('menuitem', { name: 'Campaigns' }).click();
  await expect(page.getByRole('heading', { name: 'Campaigns', level: 2 })).toBeVisible();
}

async function gotoCampaignEditor(page: Page) {
  await gotoCampaigns(page);
  // Click the campaign entry button (first in its li, not the delete × button)
  await page.locator('li').filter({ hasText: 'Test Campaign' }).locator('button').first().click();
  await expect(page.getByRole('textbox', { name: 'Campaign name' })).toHaveValue('Test Campaign');
}

// ── CampaignsPage ─────────────────────────────────────────────────────────────

test.describe('CampaignsPage', () => {
  test('shows the Campaigns heading', async ({ page }) => {
    await gotoCampaigns(page);
    await expect(page.getByRole('heading', { name: 'Campaigns', level: 2 })).toBeVisible();
  });

  test('shows empty state when there are no campaigns', async ({ page }) => {
    await mockAuth(page);
    await page.route('**/api/characters', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/campaigns', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        route.continue();
      }
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Campaigns' }).click();
    await page.getByRole('menuitem', { name: 'Campaigns' }).click();

    await expect(page.getByText('No campaigns yet.')).toBeVisible();
  });

  test('renders campaign name and statistics', async ({ page }) => {
    await gotoCampaigns(page);

    // The campaign entry button (first in its li) contains the name and stats
    const campaignBtn = page.locator('li').filter({ hasText: 'Test Campaign' }).locator('button').first();
    await expect(campaignBtn).toBeVisible();
    // Stats line includes player count and character count
    await expect(page.getByText(/2 players/)).toBeVisible();
    await expect(page.getByText(/3 characters/)).toBeVisible();
  });

  test('renders without error when API returns new-shape fields (accessLevel, dmName)', async ({ page }) => {
    // The response includes new Phase 1 fields; the existing CampaignsPage must not crash
    await gotoCampaigns(page);

    // Page renders normally — no error message or broken layout
    await expect(page.getByRole('heading', { name: 'Campaigns', level: 2 })).toBeVisible();
    await expect(page.locator('li').filter({ hasText: 'Test Campaign' }).locator('button').first()).toBeVisible();
  });
});

// ── CampaignEditor — character row ownership gating ──────────────────────────

test.describe('CampaignEditor – character row ownership gating', () => {
  test('own character row is styled as clickable', async ({ page }) => {
    await gotoCampaignEditor(page);

    const row = page.locator('tbody tr', { hasText: 'Aldric Stonehammer' });
    const cls = await row.getAttribute('class');
    expect(cls).toContain('cursor-pointer');
  });

  test("another user's character row is styled as clickable (opens stat block in Phase 3)", async ({ page }) => {
    await gotoCampaignEditor(page);

    const row = page.locator('tbody tr', { hasText: 'Sylara Moonshadow' });
    const cls = await row.getAttribute('class');
    // Phase 3: all rows are cursor-pointer — clicking opens stat block for non-editable chars
    expect(cls).toContain('cursor-pointer');
  });

  test('delegated character row is styled as clickable', async ({ page }) => {
    await gotoCampaignEditor(page);

    const row = page.locator('tbody tr', { hasText: 'Bronwin Ashback' });
    const cls = await row.getAttribute('class');
    expect(cls).toContain('cursor-pointer');
  });

  test('clicking own character row navigates to the character editor', async ({ page }) => {
    await page.route('**/api/characters/char-own', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ _id: 'char-own', name: 'Aldric Stonehammer' }),
        });
      } else {
        route.continue();
      }
    });

    await gotoCampaignEditor(page);
    await page.locator('tbody tr', { hasText: 'Aldric Stonehammer' }).click();

    // Character editor renders with the character's name as the heading
    await expect(page.getByRole('heading', { name: 'Aldric Stonehammer', level: 2 })).toBeVisible();
  });

  test("clicking another user's character row does not navigate away", async ({ page }) => {
    await gotoCampaignEditor(page);
    await page.locator('tbody tr', { hasText: 'Sylara Moonshadow' }).click();

    // Phase 3: clicking opens the stat block modal, not the character editor
    await expect(page.getByRole('dialog', { name: 'Stat Block' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Character name' })).not.toBeVisible();
  });
});

// ── CharacterEditor — error state on failed load ──────────────────────────────

test.describe('CharacterEditor – error state when character load fails', () => {
  test('shows an error message instead of a blank form when the character API returns 404', async ({ page }) => {
    await page.route('**/api/characters/char-1', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Character not found' }),
        });
      } else {
        route.continue();
      }
    });

    await gotoApp(page, MOCK_CHARACTERS);

    // Click the first character row to open it in edit mode
    await page.locator('tbody tr', { hasText: 'Aldric Stonehammer' }).click();

    // Error message should be visible
    await expect(page.getByText('Character not found')).toBeVisible();

    // The main character form should NOT be rendered
    await expect(page.getByRole('textbox', { name: 'Character name' })).not.toBeVisible();
  });
});

// ── CampaignInvitePage (Phase 2) ──────────────────────────────────────────────

test.describe('CampaignInvitePage', () => {
  async function gotoCampaignInvite(page: Page, token: string, access: 'view' | 'delegate' = 'delegate') {
    await page.route(`**/api/campaign-invite/${token}`, (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            campaignId: 'camp-1',
            campaignName: 'Test Campaign',
            dmName: 'DM Player',
            access,
          }),
        });
      } else {
        route.continue();
      }
    });
    await page.goto(`/campaign-invite/${token}`);
  }

  test('renders the Campaign Invite heading', async ({ page }) => {
    await gotoCampaignInvite(page, 'abc123');
    await expect(page.getByRole('heading', { name: 'Campaign Invite', level: 1 })).toBeVisible();
  });

  test('shows the campaign name and DM name', async ({ page }) => {
    await gotoCampaignInvite(page, 'abc123');
    await expect(page.getByText('Test Campaign')).toBeVisible();
    await expect(page.getByText(/DM Player/)).toBeVisible();
  });

  test('shows "Edit (Delegate)" access badge for delegate access', async ({ page }) => {
    await gotoCampaignInvite(page, 'abc123', 'delegate');
    await expect(page.getByText('Edit (Delegate)')).toBeVisible();
  });

  test('shows "View Only" access badge for view access', async ({ page }) => {
    await gotoCampaignInvite(page, 'abc123', 'view');
    await expect(page.getByText('View Only')).toBeVisible();
  });

  test('shows "Join Campaign" button', async ({ page }) => {
    await gotoCampaignInvite(page, 'abc123');
    await expect(page.getByRole('button', { name: 'Join Campaign' })).toBeVisible();
  });

  test('shows invalid invite message when token resolves to 404', async ({ page }) => {
    await page.route('**/api/campaign-invite/deadbeef01', (route) =>
      route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) })
    );
    await page.goto('/campaign-invite/deadbeef01');
    await expect(page.getByText(/no longer valid/i)).toBeVisible();
  });

  test('accepting an invite navigates to the campaigns section', async ({ page }) => {
    const token = 'cafebabe02';
    await gotoCampaignInvite(page, token, 'delegate');

    await page.route(`**/api/campaign-invite/${token}/accept`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ campaignId: 'camp-1' }),
      });
    });
    // Also mock the data the app needs after redirect
    await mockAuth(page);
    await page.route('**/api/characters', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route('**/api/campaigns', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CAMPAIGN_LIST) });
      } else {
        route.continue();
      }
    });

    await page.getByRole('button', { name: 'Join Campaign' }).click();

    // After accepting, the app renders the Campaigns section
    await expect(page.getByRole('heading', { name: 'Campaigns', level: 2 })).toBeVisible();
  });
});

// ── CampaignsPage — shared campaign display (Phase 2) ────────────────────────

test.describe('CampaignsPage – shared campaign display', () => {
  const SHARED_DELEGATE = {
    _id: 'camp-shared-1',
    name: 'Shared Campaign',
    description: '',
    characterIds: [],
    encounterIds: [],
    playerCount: 0,
    accessLevel: 'delegate' as const,
    dmName: 'DM Player',
    updatedAt: '2026-05-01T10:00:00.000Z',
  };

  const SHARED_VIEW = { ...SHARED_DELEGATE, _id: 'camp-shared-2', accessLevel: 'view' as const };

  async function gotoWithSharedCampaigns(page: Page, campaigns: typeof MOCK_CAMPAIGN_LIST) {
    await mockAuth(page);
    await page.route('**/api/characters', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route('**/api/campaigns', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(campaigns) });
      } else {
        route.continue();
      }
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Campaigns' }).click();
    await page.getByRole('menuitem', { name: 'Campaigns' }).click();
    await expect(page.getByRole('heading', { name: 'Campaigns', level: 2 })).toBeVisible();
  }

  test('shows "Shared · Edit" badge for delegate-access campaign', async ({ page }) => {
    await gotoWithSharedCampaigns(page, [SHARED_DELEGATE]);
    await expect(page.getByText('Shared · Edit')).toBeVisible();
  });

  test('shows "Shared · View" badge for view-access campaign', async ({ page }) => {
    await gotoWithSharedCampaigns(page, [SHARED_VIEW]);
    await expect(page.getByText('Shared · View')).toBeVisible();
  });

  test('shows DM name for shared campaigns', async ({ page }) => {
    await gotoWithSharedCampaigns(page, [SHARED_DELEGATE]);
    await expect(page.getByText(/DM: DM Player/)).toBeVisible();
  });

  test('does not show delete button for shared campaigns', async ({ page }) => {
    await gotoWithSharedCampaigns(page, [SHARED_DELEGATE]);
    await expect(page.getByRole('button', { name: /Delete Shared Campaign/ })).not.toBeVisible();
  });

  test('shows delete button for owned campaigns', async ({ page }) => {
    await gotoWithSharedCampaigns(page, MOCK_CAMPAIGN_LIST);
    await expect(page.getByRole('button', { name: /Delete Test Campaign/ })).toBeVisible();
  });
});

// ── CampaignEditor – access-level gating (Phase 3) ────────────────────────────

const DETAIL_VIEW     = { ...MOCK_CAMPAIGN_DETAIL, accessLevel: 'view'     as const };
const DETAIL_DELEGATE = { ...MOCK_CAMPAIGN_DETAIL, accessLevel: 'delegate' as const };

const MOCK_INVITES = [
  {
    _id: 'invite-1',
    email: 'alice@example.com',
    access: 'view' as const,
    isPending: true,
    user: null,
  },
  {
    _id: 'invite-2',
    email: 'bob@example.com',
    access: 'delegate' as const,
    isPending: false,
    user: { _id: OTHER_ID, name: 'Bob Smith', email: 'bob@example.com', avatar: null },
  },
];
const DETAIL_WITH_INVITES = { ...MOCK_CAMPAIGN_DETAIL, invites: MOCK_INVITES };

async function gotoCampaignEditorWith(page: Page, detail: typeof MOCK_CAMPAIGN_DETAIL) {
  await setupMocks(page, detail);
  await page.goto('/');
  await page.getByRole('button', { name: 'Campaigns' }).click();
  await page.getByRole('menuitem', { name: 'Campaigns' }).click();
  await expect(page.getByRole('heading', { name: 'Campaigns', level: 2 })).toBeVisible();
  await page.locator('li').filter({ hasText: 'Test Campaign' }).locator('button').first().click();
  await expect(page.getByRole('textbox', { name: 'Campaign name' })).toHaveValue('Test Campaign');
}

test.describe('CampaignEditor – StatBlockModal', () => {
  test('clicking a non-editable character row opens the stat block modal', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_VIEW);
    await page.locator('tbody tr', { hasText: 'Sylara Moonshadow' }).click();
    await expect(page.getByRole('dialog', { name: 'Stat Block' })).toBeVisible();
  });

  test('stat block modal shows character name in stat block text', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_VIEW);
    await page.locator('tbody tr', { hasText: 'Sylara Moonshadow' }).click();
    const dialog = page.getByRole('dialog', { name: 'Stat Block' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Sylara Moonshadow/, { exact: false })).toBeVisible();
  });

  test('stat block modal closes via the × button', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_VIEW);
    await page.locator('tbody tr', { hasText: 'Sylara Moonshadow' }).click();
    await expect(page.getByRole('dialog', { name: 'Stat Block' })).toBeVisible();
    await page.getByRole('dialog', { name: 'Stat Block' }).getByLabel('Close').click();
    await expect(page.getByRole('dialog', { name: 'Stat Block' })).not.toBeVisible();
  });

  test('stat block modal closes via the Escape key', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_VIEW);
    await page.locator('tbody tr', { hasText: 'Sylara Moonshadow' }).click();
    await expect(page.getByRole('dialog', { name: 'Stat Block' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Stat Block' })).not.toBeVisible();
  });

  test('stat block modal closes via backdrop click', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_VIEW);
    await page.locator('tbody tr', { hasText: 'Sylara Moonshadow' }).click();
    await expect(page.getByRole('dialog', { name: 'Stat Block' })).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(page.getByRole('dialog', { name: 'Stat Block' })).not.toBeVisible();
  });
});

test.describe('CampaignEditor – view-only access', () => {
  test("clicking another user's character row opens stat block (not character editor)", async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_VIEW);
    await page.locator('tbody tr', { hasText: 'Sylara Moonshadow' }).click();
    await expect(page.getByRole('dialog', { name: 'Stat Block' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Character name' })).not.toBeVisible();
  });

  test('clicking own character row navigates to character editor even in view mode', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_VIEW);
    await page.locator('tbody tr', { hasText: 'Aldric Stonehammer' }).click();
    // Navigation: campaign editor unmounts (Campaign name input gone)
    await expect(page.getByRole('textbox', { name: 'Campaign name' })).not.toBeVisible({ timeout: 3000 });
    // No stat block modal should have opened
    await expect(page.getByRole('dialog', { name: 'Stat Block' })).not.toBeVisible();
  });

  test("remove button is hidden for other users' characters", async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_VIEW);
    await expect(page.getByRole('button', { name: 'Remove Sylara Moonshadow' })).not.toBeVisible();
  });

  test('remove button is visible for own character', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_VIEW);
    await expect(page.getByRole('button', { name: 'Remove Aldric Stonehammer' })).toBeVisible();
  });

  test('campaign name input is read-only', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_VIEW);
    await expect(page.getByRole('textbox', { name: 'Campaign name' })).toHaveAttribute('readonly');
  });

  test('point-buy dropdown button is disabled', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_VIEW);
    // Scope to the campaign editor to avoid matching the global point-buy selector
    await expect(page.locator('.campaign-editor .point-buy-trigger')).toHaveAttribute('disabled', '');
  });
});

test.describe('CampaignEditor – delegate access', () => {
  test('clicking delegated character navigates away from campaign editor', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_DELEGATE);
    await page.locator('tbody tr', { hasText: 'Bronwin Ashback' }).click();
    // Navigation: campaign editor unmounts (Campaign name input gone)
    await expect(page.getByRole('textbox', { name: 'Campaign name' })).not.toBeVisible({ timeout: 3000 });
    // No stat block modal should have opened
    await expect(page.getByRole('dialog', { name: 'Stat Block' })).not.toBeVisible();
  });

  test("clicking another user's non-delegated character opens stat block", async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_DELEGATE);
    await page.locator('tbody tr', { hasText: 'Sylara Moonshadow' }).click();
    await expect(page.getByRole('dialog', { name: 'Stat Block' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Character name' })).not.toBeVisible();
  });

  test('remove button is visible for all characters in delegate access', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_DELEGATE);
    await expect(page.getByRole('button', { name: 'Remove Aldric Stonehammer' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove Sylara Moonshadow' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove Bronwin Ashback' })).toBeVisible();
  });

  test('campaign name input is read-only for delegate', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_DELEGATE);
    await expect(page.getByRole('textbox', { name: 'Campaign name' })).toHaveAttribute('readonly');
  });
});

// ── Phase 4: Players sidebar ──────────────────────────────────────────────────

test.describe('CampaignEditor – Players sidebar (DM)', () => {
  test('shows "No players invited yet." when invites array is empty', async ({ page }) => {
    await gotoCampaignEditorWith(page, MOCK_CAMPAIGN_DETAIL);
    await expect(page.getByText('No players invited yet.')).toBeVisible();
  });

  test('shows pending invite entry with Pending badge', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_WITH_INVITES);
    // Row shows short name; orange P badge indicates pending
    await expect(page.locator('.invite-badge--pending')).toBeVisible();
    await expect(page.getByText('alice')).toBeVisible();
  });

  test('shows accepted invite by resolved user first name', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_WITH_INVITES);
    await expect(page.getByText('Bob')).toBeVisible();
  });

  test('shows View badge for view-access invite', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_WITH_INVITES);
    // Open alice's dropdown; toggle switch should show View as active (aria-checked=false = view)
    await page.getByRole('button', { name: 'Manage alice@example.com' }).click();
    await expect(page.getByRole('switch', { name: 'Access level' })).toHaveAttribute('aria-checked', 'false');
  });

  test('shows Edit badge for delegate-access invite', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_WITH_INVITES);
    // Bob is accepted delegate → red D badge
    await expect(page.locator('.invite-badge--delegate')).toBeVisible();
  });

  test('change-access button PATCHes and updates badge', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_WITH_INVITES);
    const updated = { ...DETAIL_WITH_INVITES, invites: [{ ...MOCK_INVITES[0], access: 'delegate' as const }, MOCK_INVITES[1]] };
    await page.route('**/api/campaigns/camp-1/invites/invite-1', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
      } else { route.continue(); }
    });
    await page.getByRole('button', { name: 'Manage alice@example.com' }).click();
    await page.getByRole('switch', { name: 'Access level' }).click();
    // After patch the toggle reflects delegate (aria-checked=true)
    await expect(page.getByRole('switch', { name: 'Access level' })).toHaveAttribute('aria-checked', 'true');
  });

  test('revoke button DELETEs and removes invite from list', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_WITH_INVITES);
    const afterRevoke = { ...DETAIL_WITH_INVITES, invites: [MOCK_INVITES[1]] };
    await page.route('**/api/campaigns/camp-1/invites/invite-1', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(afterRevoke) });
      } else { route.continue(); }
    });
    await page.getByRole('button', { name: 'Manage alice@example.com' }).click();
    await page.getByRole('button', { name: 'Revoke Access' }).click();
    await expect(page.locator('.invite-badge--pending')).not.toBeVisible();
  });

  test('invite form is visible for DM', async ({ page }) => {
    await gotoCampaignEditorWith(page, MOCK_CAMPAIGN_DETAIL);
    await expect(page.getByRole('textbox', { name: 'Player email address' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Access level' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Invite' })).toBeVisible();
  });

  test('submitting invite form shows Copy Link button with the invite URL', async ({ page }) => {
    await gotoCampaignEditorWith(page, MOCK_CAMPAIGN_DETAIL);
    let postIntercepted = false;
    await page.route('**/api/campaigns/camp-1/invites', async (route) => {
      if (route.request().method() === 'POST') {
        postIntercepted = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'abc123' }) });
      } else { await route.fallback(); }
    });
    await page.getByRole('textbox', { name: 'Player email address' }).fill('newplayer@example.com');
    await page.getByRole('button', { name: 'Create Invite' }).click();
    await expect(page.getByRole('button', { name: 'Copy Link' })).toBeVisible();
    expect(postIntercepted).toBe(true);
    await expect(page.getByRole('textbox', { name: 'Invite link' })).toHaveValue(/\/campaign-invite\/abc123$/);
  });

  test('shows server error when invite POST returns 409', async ({ page }) => {
    await gotoCampaignEditorWith(page, MOCK_CAMPAIGN_DETAIL);
    await page.route('**/api/campaigns/camp-1/invites', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'A pending invite already exists for this email' }) });
      } else { route.continue(); }
    });
    await page.getByRole('textbox', { name: 'Player email address' }).fill('alice@example.com');
    await page.getByRole('button', { name: 'Create Invite' }).click();
    await expect(page.getByText('A pending invite already exists for this email')).toBeVisible();
  });
});

test.describe('CampaignEditor – Players sidebar (player view)', () => {
  test('shows read-only player list for non-owners', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_VIEW);
    await expect(page.locator('.campaign-rail-player-name').filter({ hasText: 'Other' })).toBeVisible();
  });

  test('does not show invite form for non-owners', async ({ page }) => {
    await gotoCampaignEditorWith(page, DETAIL_VIEW);
    await expect(page.getByRole('textbox', { name: 'Player email address' })).not.toBeVisible();
  });
});

// ── Phase 5: auto-add to campaign ────────────────────────────────────────────

test.describe('CampaignEditor – new character auto-add', () => {
  test('POST /api/characters includes campaignId in the request body', async ({ page }) => {
    let capturedBody: Record<string, unknown> | null = null;
    await setupMocks(page);
    await page.route('**/api/characters', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBody = await route.request().postDataJSON() as Record<string, unknown>;
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ _id: 'char-new', name: 'New Fighter' }) });
      } else { await route.fallback(); }
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Campaigns' }).click();
    await page.getByRole('menuitem', { name: 'Campaigns' }).click();
    await page.locator('li').filter({ hasText: 'Test Campaign' }).locator('button').first().click();
    await expect(page.getByRole('textbox', { name: 'Campaign name' })).toHaveValue('Test Campaign');
    // Open char dropdown → "New" tab
    await page.locator('.campaign-editor').getByRole('button', { name: 'Characters' }).click();
    await page.locator('.char-dropdown').getByRole('button', { name: 'New' }).click();
    await page.getByPlaceholder('Search class…').fill('Fighter');
    await page.locator('.char-new-class-row').first().click();
    await page.getByRole('button', { name: 'Create character' }).click();
    expect(capturedBody?.campaignId).toBe('camp-1');
  });

  test('creating a new character does NOT call POST /api/campaigns/:id/characters separately', async ({ page }) => {
    let addCharCalled = false;
    await setupMocks(page);
    await page.route('**/api/characters', async (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ _id: 'char-new', name: 'New Fighter' }) });
      } else { await route.fallback(); }
    });
    await page.route('**/api/campaigns/camp-1/characters', (route) => {
      if (route.request().method() === 'POST') { addCharCalled = true; route.continue(); }
      else { route.continue(); }
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Campaigns' }).click();
    await page.getByRole('menuitem', { name: 'Campaigns' }).click();
    await page.locator('li').filter({ hasText: 'Test Campaign' }).locator('button').first().click();
    await expect(page.getByRole('textbox', { name: 'Campaign name' })).toHaveValue('Test Campaign');
    await page.locator('.campaign-editor').getByRole('button', { name: 'Characters' }).click();
    await page.locator('.char-dropdown').getByRole('button', { name: 'New' }).click();
    await page.getByPlaceholder('Search class…').fill('Fighter');
    await page.locator('.char-new-class-row').first().click();
    await page.getByRole('button', { name: 'Create character' }).click();
    expect(addCharCalled).toBe(false);
  });

  test('creating a new character reloads the campaign detail', async ({ page }) => {
    let detailCallCount = 0;
    await setupMocks(page);
    await page.route('**/api/characters', async (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ _id: 'char-new', name: 'New Fighter' }) });
      } else { await route.fallback(); }
    });
    await page.route('**/api/campaigns/camp-1', (route) => {
      if (route.request().method() === 'GET') { detailCallCount++; route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CAMPAIGN_DETAIL) }); }
      else { route.continue(); }
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Campaigns' }).click();
    await page.getByRole('menuitem', { name: 'Campaigns' }).click();
    await page.locator('li').filter({ hasText: 'Test Campaign' }).locator('button').first().click();
    await expect(page.getByRole('textbox', { name: 'Campaign name' })).toHaveValue('Test Campaign');
    const callsAfterLoad = detailCallCount;
    await page.locator('.campaign-editor').getByRole('button', { name: 'Characters' }).click();
    await page.locator('.char-dropdown').getByRole('button', { name: 'New' }).click();
    await page.getByPlaceholder('Search class…').fill('Fighter');
    await page.locator('.char-new-class-row').first().click();
    await page.getByRole('button', { name: 'Create character' }).click();
    await page.waitForTimeout(300);
    expect(detailCallCount).toBeGreaterThan(callsAfterLoad);
  });
});

test.describe('CampaignEditor – encounter auto-associate', () => {
  test('POST /api/encounters includes campaignId for owner', async ({ page }) => {
    let capturedBody: Record<string, unknown> | null = null;
    await setupMocks(page);
    await page.route('**/api/encounters', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBody = await route.request().postDataJSON() as Record<string, unknown>;
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ _id: 'enc-1', id: 'enc-1', name: 'Test Encounter' }) });
      } else { route.continue(); }
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Campaigns' }).click();
    await page.getByRole('menuitem', { name: 'Campaigns' }).click();
    await page.locator('li').filter({ hasText: 'Test Campaign' }).locator('button').first().click();
    await expect(page.getByRole('textbox', { name: 'Campaign name' })).toHaveValue('Test Campaign');
    await page.getByRole('button', { name: '+ Encounter' }).click();
    await page.getByPlaceholder('Encounter name').fill('Test Encounter');
    await page.keyboard.press('Enter');
    expect(capturedBody?.campaignId).toBe('camp-1');
  });

  test('POST /api/encounters includes campaignId for delegate', async ({ page }) => {
    let capturedBody: Record<string, unknown> | null = null;
    await setupMocks(page, DETAIL_DELEGATE);
    await page.route('**/api/encounters', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBody = await route.request().postDataJSON() as Record<string, unknown>;
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ _id: 'enc-1', id: 'enc-1', name: 'Test Encounter' }) });
      } else { route.continue(); }
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Campaigns' }).click();
    await page.getByRole('menuitem', { name: 'Campaigns' }).click();
    await page.locator('li').filter({ hasText: 'Test Campaign' }).locator('button').first().click();
    await expect(page.getByRole('textbox', { name: 'Campaign name' })).toHaveValue('Test Campaign');
    await page.getByRole('button', { name: '+ Encounter' }).click();
    await page.getByPlaceholder('Encounter name').fill('Test Encounter');
    await page.keyboard.press('Enter');
    expect(capturedBody?.campaignId).toBe('camp-1');
  });
});
