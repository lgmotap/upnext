# FIX-01 — Team / crew parity + settings polish

> **Status:** 📋 Planning (awaiting PO approval — no code until approved)  
> **Track:** `tasks/fixes/`  
> **Triggered by:** Owner UX report — missing crew portal link, cannot add team member with full info without invite, settings UI bugs

---

## ConvertLabs reference (how they do it)

Sources: `competitor-research/` crawls (phase-08-team), CL help center, public docs.

### Owner app — Service Providers (`/booking/service-providers`)

| CL capability | Detail |
|---------------|--------|
| **List** | Table of providers with name, contact, status |
| **Add** | **New Service Provider** drawer/page — owner enters **first name, last name, email** (Teams docs also include **phone**, team **color**) |
| **Create behavior** | Account/roster created on save; provider gets **welcome email/SMS** with login link (optional to send later in some flows) |
| **Row actions (⋮)** | **Portal login link** — copy or send via email/SMS; **Edit work schedule**; **Edit wage** (P2 — out of scope for us) |
| **Member detail** | Click name → edit profile + tabs: **Business Hours**, **Wage**, self-assign toggle |
| **Portal URL** | Provider app at `teams.convertlabs.io` (magic link; passwordless by default) |

Help article (admin): *Service Providers → ⋮ → Portal login link → copy or Send link via Email/SMS.*

### Provider / crew experience

| CL | UpNext equivalent |
|----|-------------------|
| Magic link from admin or self-request at login | Invite email → accept; worker signs in at `/sign-in` → `/crew` |
| Today's jobs, check-in, OTW, photos | `/crew` — **ahead** on checklist/photos/timer |
| Edit own work schedule in app | Read-only hours on `/crew`; owner edits at `/app/team/[id]/availability` |

### Mapping CL → UpNext (honest gap)

| CL pattern | UpNext today | FIX-01 target |
|------------|--------------|---------------|
| Add provider with name + email + phone | Invite **email + role** only | **Add member** form with profile fields |
| Owner fills roster without worker self-serve | Not possible | **Add without invite** OR **save profile + send invite later** |
| Portal login link in settings / row menu | **Missing** — Portals tab has booking + customer only | **Crew portal** card + per-member **Copy crew link** |
| Member detail (not just hours) | `/app/team/[id]` redirects to availability | **Profile page** with Hours tab |
| Portal login link per provider | Row ⋮ action | Row action: copy magic sign-in / crew URL |
| Edit work schedule | Separate hours page only | Hours as tab on member profile |
| Wage / payout | Full module | ➖ Out of scope (MVP) |
| Team color | UI chrome | ➖ Defer |
| Self-assign open jobs | Team checkbox | ➖ Sprint 47 |

**Scorecard correction:** `tasks/competitor-parity-status.md` lists Team as ✅ “CRUD + magic link” — should be 🟡 **invite-only** until FIX-01 ships.

---

## Locked v1 scope (FIX-01)

### 1. Crew / field portal discoverability (Settings)

Mirror **Customer portal** block on Settings → Portals:

- [ ] **`getCrewPortalUrl()`** in `lib/url/app.ts` → `{APP_URL}/crew`
- [ ] Card: **Crew / field portal** — URL, copy button, preview link, short instructions
- [ ] Copy: “Share with workers after they join your team. Works in any mobile browser — no app store.”
- [ ] Optional: duplicate compact link on **`/app/team`** header

**CL parity:** Admin can find and copy provider portal entry (CL: Portal login link from Service Providers; we use shared `/crew` URL + per-member invite/link).

### 2. Team member — add & profile (owner CRUD lite)

**Data model (minimal):**

- [ ] `User.phone` optional **or** `Membership.phone` — pick one; prefer `User.phone` for SMS worker notifications (sprint 29)
- [ ] No hire-date / wage fields in FIX-01 unless PO confirms

**Add member flow** (`/app/team`):

- [ ] Two modes (tabs or toggle):
  - **Send invite** — current behavior (email + role)
  - **Add member** — owner enters: **first name, last name, email, phone (optional), role**
- [ ] **Send invite email** checkbox (default on for Add member)
- [ ] When invite unchecked: create Supabase user + membership server-side with generated setup path (document security choice in ADR snippet or sprint notes):
  - **Recommended:** create auth user + membership `active`; show owner **“Copy setup link”** / resend invite later; worker cannot sign in until they complete password setup
  - **Not recommended:** placeholder membership without auth (cannot assign jobs)

**Member profile** (`/app/team/[membershipId]` — stop redirect-only):

- [ ] Overview: name, email, phone, role, status, job count
- [ ] Edit form (owner/admin): update name, phone, role; deactivate member
- [ ] **Hours** tab → existing weekly hours form (move from standalone page or embed)
- [ ] **Crew access** section: Copy portal link, Resend invite (if pending), last sign-in if available

**Row actions on team list:**

- [ ] Link to profile (not only “Hours”)
- [ ] Quick: Copy crew URL, Resend invite (pending)

### 3. Settings UI polish (same sprint — small)

- [ ] **Layout subtitle** — include Locations, Booking form, API (`app/app/settings/layout.tsx`)
- [ ] **Portals cards** — normalize padding (remove double `p-5` + inner `px-5` on `Card className="p-5"` + `CardHeader`)
- [ ] **Tab bar** — horizontal scroll on narrow viewports (`SettingsTabs.tsx`)
- [ ] **Locations page** — collapse-to-edit or single open form (reduce N× Places widgets); already has autocomplete via `LocationAddressFields`
- [ ] Update **`docs/08-routes-and-navigation.md`** settings routes list

---

## Out of scope (FIX-01)

- Provider wage / payout (CL Wage tab)
- Team color / calendar color coding
- Open jobs self-claim (sprint 47)
- Providers Activity kanban (sprint 48)
- Native provider app / push notifications
- Full HR fields (hire date, DOB, emergency contact) — confirm with PO before any schema add
- Passwordless magic link for crew (CL default) — optional follow-up FIX-02; FIX-01 uses existing invite + `/crew` after sign-in

---

## Open questions (PO — block implementation until answered)

1. **Add without invite:** Must new manual members be **assignable to jobs immediately**? (Recommended: yes, after admin sets temp password or copy setup link.)
2. **Phone:** Required on add form or optional? (Recommend optional; needed for SMS worker alerts.)
3. **Crew login:** Keep email+password only for FIX-01, or add **magic link request** on `/sign-in` for workers? (CL parity suggests magic link — could be FIX-02.)
4. **“Team member date”** — if hire/start date is required, specify field; not found in CL Service Provider create form (only in reporting elsewhere).

---

## Implementation notes

### Suggested file touch list

| Area | Files |
|------|--------|
| URL helper | `lib/url/app.ts` |
| Settings UI | `app/app/settings/portals/page.tsx`, `layout.tsx`, `SettingsTabs.tsx`, `locations/page.tsx` |
| Team UI | `app/app/team/page.tsx`, `app/app/team/[membershipId]/page.tsx`, new `TeamMemberForm.tsx` |
| Server | `server/actions/team.ts`, `server/services/team-invites.ts`, new `server/services/team-members.ts` |
| Schema | `prisma/schema.prisma` (+ migration if phone) |
| Validators | `server/validators/team.ts` |
| Docs | `docs/08-routes-and-navigation.md`, `docs/14-mobile-crew-view.md`, `tasks/competitor-parity-status.md` |

### Auth strategy for manual add (draft)

```txt
Owner submits Add member (invite unchecked)
  → upsert User (email, name, phone)
  → create Membership (role, active)
  → optional: createTeamInvite without email OR Supabase admin createUser + recovery link
  → return setup URL for owner to copy
Worker completes setup → /crew
```

Reuse patterns from `server/services/portal-auth.ts` (admin-provisioned users) where possible.

---

## Tests

- [ ] `scripts/smoke-team-manual-add.ts` — add member without invite, assign job, worker can access `/crew` after setup
- [ ] Extend `scripts/smoke-team-invite.ts` — invite path still works
- [ ] `scripts/smoke-settings-portals.ts` or extend `smoke-business-profile` — crew URL present on Portals page
- [ ] `npm run smoke:launch-crew` — regression

---

## Validation

- [ ] `npm run typecheck`, `npm run lint`, `npm run build`
- [ ] `npm run smoke:team-invite`, `npm run smoke:launch-crew`, new manual-add smoke
- [ ] Browser: Settings → Portals shows 3 portal blocks (booking, customer, crew)
- [ ] Browser: Team → add member without invite → profile editable → hours tab saves

---

## Docs & tracking updates (on ship)

- [ ] `CHANGELOG.md`
- [ ] `HANDOFF.md` — resume pointer
- [ ] `tasks/competitor-parity-status.md` — Team row → ✅ after FIX-01
- [ ] `tasks/fixes/README.md` — mark FIX-01 complete
- [ ] `docs/01-product-requirements.md` R9 — align with shipped behavior
