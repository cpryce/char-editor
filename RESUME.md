# Session Resume — Campaign Invite / Membership System

**Branch:** `ownership-changes`  
**Status:** All work is **uncommitted**. 53/53 Playwright tests pass.  
**Last tested:** May 31, 2026 — `npx playwright test e2e/campaigns.spec.ts` → 53 passed

---

## What was built

A full campaign invite and membership system, implemented across 5 phases plus a post-phase UX addition:

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Backend: `Campaign` model (`invites` subdoc, sparse indexes), all invite routes | ✅ Done |
| 2 | `CampaignInvitePage.tsx`, `App.tsx` routing, `CampaignsPage.tsx` access badges | ✅ Done |
| 3 | `StatBlockModal` in `CampaignEditor`, access-level gating (owner / delegate / view) | ✅ Done |
| 4 | Players sidebar: DM invite management UI + player read-only list | ✅ Done |
| 5 | Auto-add character/encounter to campaign on creation (server + client) | ✅ Done |
| +  | "Create Invite → Copy Link" UX flow (replaces Send Invite button with invite URL) | ✅ Done |

---

## Uncommitted changed files

All changes live on the `ownership-changes` branch and have **not been committed**:

| File | Notes |
|------|-------|
| `server/src/models/Campaign.ts` | New `ICampaignInvite` interface, `invites` subdoc array, sparse indexes on `invites.token` / `invites.userId` |
| `server/src/index.ts` | All invite routes (`POST /api/campaigns/:id/invites`, `PATCH`, `DELETE`), `getCampaignAccess` helper, Phase 5 auto-add to `POST /api/characters` and `POST /api/encounters` |
| `client/src/App.tsx` | Lazy import of `CampaignInvitePage`, `showingCampaignInvite` state, routing for `/campaign-invite/:token` |
| `client/src/pages/CampaignsPage.tsx` | Access badges ("Shared · View", "Shared · Edit"), DM name display, delete gated to owner |
| `client/src/pages/CampaignEditor.tsx` | Full rewrite of the editor rail: access gating, StatBlockModal, invite management UI, Players sidebar, Create Invite / Copy Link flow |
| `client/src/pages/CharacterEditor.tsx` | Minor: passes `campaignId` from context when creating character |

New (untracked) files:

| File | Notes |
|------|-------|
| `client/src/pages/CampaignInvitePage.tsx` | Accept-invite page (`/campaign-invite/:token`) — shows campaign name, DM name, access badge, Join button |
| `e2e/campaigns.spec.ts` | All 53 Playwright tests for the campaign system |

---

## Key architecture decisions

### Data model (`Campaign`)
```ts
interface ICampaignInvite {
  email: string;
  token: string | null;    // null after invite is accepted
  userId: ObjectId | null; // set after invite is accepted
  access: 'view' | 'delegate';
}
// Campaign has: invites: ICampaignInvite[]
// Sparse indexes on invites.token and invites.userId
```

### Access levels
- `owner` — full edit rights, manages invites, sees the full `invites[]` array
- `delegate` — can edit characters delegated to them, can add characters/encounters to campaign
- `view` — read-only, sees stat blocks only

### `getCampaignAccess` helper (server)
Centralises access checking. Returns `{ campaign, accessLevel, invite }`. Used by all campaign-scoped routes.

### Invite flow
1. DM POSTs `{ email, access }` to `/api/campaigns/:id/invites` → server creates invite with UUID token, returns `{ token }`
2. Client builds link: `${window.location.origin}/campaign-invite/${token}`
3. DM copies link and sends it manually (no email sending)
4. Player visits `/campaign-invite/:token` → sees campaign info → clicks **Join Campaign**
5. Server PATCHes invite: sets `userId` from session, clears `token` (one-time use)

### Auto-add on creation (Phase 5)
- `POST /api/characters` accepts optional `campaignId` in body → if user has `owner` or `delegate` access, does `$addToSet: { characterIds: newChar._id }` on the campaign
- `POST /api/encounters` same pattern for `encounterIds`
- Client passes `campaignId` (from `campaignId` prop) in both creation requests

---

## How to resume

1. `git checkout ownership-changes` (already on this branch)
2. `npm run dev` (or `cd server && npm run dev` + `cd client && npm run dev`)
3. `npx playwright test e2e/campaigns.spec.ts` — should be 53/53

### Suggested next steps
- Commit the work: `git add -A && git commit -m "feat: campaign invite/membership system (Phases 1–5)"`
- Deploy / test against real MongoDB
- Consider: email notification when an invite is created (currently DM must copy+paste link manually)
- Consider: invite expiry (token TTL)
- Consider: revoke all invites on campaign delete

---

## Test structure (`e2e/campaigns.spec.ts`)

53 tests across 10 `describe` blocks:

1. `CampaignsPage` — list rendering, badges, DM name, delete gating
2. `CampaignInvitePage` — invite accept page rendering, join action, 404 handling
3. `CampaignEditor – shared campaign display` — access badges in campaigns list
4. `CampaignEditor – StatBlockModal` — modal open/close for non-editable chars
5. `CampaignEditor – row ownership gating` — click routing by ownership
6. `CampaignEditor – view-only access` — read-only gating
7. `CampaignEditor – delegate access` — delegate permissions
8. `CampaignEditor – Players sidebar (DM)` — invite CRUD, Copy Link flow
9. `CampaignEditor – Players sidebar (player view)` — read-only player list
10. `CampaignEditor – Phase 5 auto-add` — character/encounter campaign association
