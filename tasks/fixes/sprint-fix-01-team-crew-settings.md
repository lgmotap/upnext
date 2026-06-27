# FIX-01 — Service Providers parity (team + crew + settings)

> **Status:** 📋 Approved for implementation (PO confirmed CL-style flow)  
> **Track:** `tasks/fixes/`  
> **Competitor ref:** CL Service Providers module + [portal login help](https://help.convertlabs.io/en/service-provider-portal/logging-in-to-the-app)

---

## Product decision (locked)

| Decision | Choice |
|----------|--------|
| Primary add flow | **Create member on save** (CL “New Service Provider”), not invite-first |
| Worker login | **Signed crew login URL** (CL-style auto-login), email on create + copy/resend anytime |
| Wage / rating / color | **Defer** (wage out of MVP; color optional later) |
| Dispatcher vs worker | Unchanged RBAC — this sprint targets **worker / crew** experience |
| Same `/crew` UI | Magic link lands on same routes as password sign-in (`/crew`, `/crew/jobs/[id]`) |

---

## ConvertLabs reference (from screenshots + docs)

### New Service Provider

- Service Provider Title (display name)
- First name, last name, email, phone (required)
- Optional: allow self-assign open jobs (→ sprint 47)
- **Create** → member exists immediately; welcome email with login link sent

### List + row actions

- Table: provider, email, phone, wage (defer), rating (defer)
- Edit / delete
- **⋮ Portal login link** — signed URL modal, copy + Send via Email/SMS
- **⋮ Edit work schedule** — day toggles + from/to
- **⋮ Edit wage** — defer

### Provider login URL (CL)

```
https://teams.convertlabs.io/signin?expires=…&team=…&team_email=…&signature=…
```

Tap link → logged in. No accept-invite step.

---

## UpNext architecture (how we will match CL)

### Crew login URL (proposed)

```
{NEXT_PUBLIC_APP_URL}/crew/auth/{token}
```

- Token stored in DB (`CrewLoginToken` or extend pattern from `CustomerPortalToken`)
- Fields: `membershipId`, `organizationId`, `token`, `expiresAt`, `usedAt?`, `lastUsedAt?`
- HMAC or `randomBytes(32)` — same security model as customer portal
- On redeem: create Supabase session for linked `User` → redirect `/crew`
- Default TTL: **7 days** (match team invite) or **30 days** (CL-style long-lived) — **PO pick: 7 days default, regeneratable**

### Email delivery — important

**UpNext does NOT use Supabase Auth emails for portal/crew magic links today.**

| Flow | Email sender | Auth mechanism |
|------|--------------|----------------|
| Customer portal “magic link” | **Resend** (`notifyCustomerPortalLink`) | Custom `CustomerPortalToken` |
| Team invite today | **Resend** (`notifyTeamInvite`) | Custom `/accept-invite/{token}` |
| App sign-in password reset | **Supabase Auth** email | Supabase |

So if “magic link email didn’t arrive,” the fix is usually **Resend/env**, not Supabase Auth settings — unless we explicitly choose Supabase `admin.auth.generateLink()` for crew (adds Supabase SMTP dependency).

**FIX-01 recommendation:** Reuse **CustomerPortalToken pattern** + **Resend** for crew login emails (consistent, already logged in `/app/communications`).

---

## Phase 0 — Diagnose email failures (do first)

Before building new crew emails, verify why existing magic links fail in your environment.

### Checklist

- [ ] **Env:** `RESEND_API_KEY` set and not placeholder (`npm run check:env`)
- [ ] **Sandbox:** If `EMAIL_FROM` uses `@resend.dev`, only `RESEND_SANDBOX_TO` inbox receives mail (`lib/resend/config.ts`)
- [ ] **Production:** Verified domain + `EMAIL_FROM=…@yourdomain.com` + **unset** `RESEND_SANDBOX_TO` (`tasks/launch-checklist.md` line 17)
- [ ] **Logs:** Settings → Communications (or `NotificationLog`) for `team_invite` / `customer_portal_link` — status `sent` | `failed` | `skipped`
- [ ] **Skipped reason:** `RESEND_API_KEY not set` logged when key missing
- [ ] **Supabase (only if using password reset / portal password):** Dashboard → Authentication → Email templates + SMTP; Site URL = `NEXT_PUBLIC_APP_URL`; redirect URLs include `/auth/callback`
- [ ] **Smoke:** `npm run smoke:customer-portal` (token path); optional manual send from customer detail → confirm log row

### Deliverable

- [ ] Document finding in sprint notes (env vs Resend vs wrong recipient expectation)
- [ ] If sandbox: show owner UI hint when `isResendSandboxMode()` — “Emails redirect to your sandbox inbox”

**Not Supabase for crew magic link unless Phase 1 explicitly switches — document in HANDOFF.**

---

## Phase 1 — Data model + crew auth route

### Schema

- [ ] `Membership.displayTitle` optional (CL “Service Provider Title”) — or `User` + list label from name
- [ ] `User.phone` optional (for SMS later + list column)
- [ ] `Membership.crewLastLoginAt` DateTime?
- [ ] `CrewLoginToken` model (mirror `CustomerPortalToken`): `membershipId`, `organizationId`, `token`, `expiresAt`, `createdAt`, `usedAt?`
- [ ] Migration + `prisma generate`

### Auth service

- [ ] `server/services/crew-auth.ts`
  - `createCrewLoginToken(membershipId)` → `{ authUrl, tokenId }`
  - `redeemCrewLoginToken(token)` → Supabase session + update `crewLastLoginAt` + redirect `/crew`
- [ ] Route: `app/crew/auth/[token]/route.ts` (GET — mirror `app/my/.../auth/[token]`)
- [ ] Rate-limit redeem path
- [ ] Revoke tokens on membership deactivate

### Email

- [ ] `notifyCrewLoginLink` template in `server/services/notifications.ts`
- [ ] `NotificationTemplate.crew_login_link` enum + migration
- [ ] Send on member create (when “Send login link” checked — default **on**)

---

## Phase 2 — Service Providers UI (`/app/team`)

### List (CL-like table)

- [ ] Columns: Provider (avatar + title + name), email, phone, last crew login, role badge
- [ ] Row actions: Edit, Delete/deactivate, **⋮ Menu**
  - Copy crew login link
  - Send link via email (Resend)
  - Edit work schedule (modal or navigate to Hours tab)

### Add member (replaces invite-only)

- [ ] Modal/drawer **New team member**:
  - Display title (optional)
  - First name, last name, email, phone
  - Role: worker | dispatcher
  - Checkbox: **Send login link email now** (default on)
- [ ] Server: `createTeamMember` — upsert User + active Membership + provision Supabase user if needed + optional crew token email
- [ ] **No** `TeamInvite` pending state for this path (keep invite as legacy or remove from primary UX)

### Member profile (`/app/team/[membershipId]`)

- [ ] Stop redirect-only to availability
- [ ] Tabs/sections: **Profile** | **Hours** | **Crew access**
- [ ] Profile: edit name, phone, role, active; show `crewLastLoginAt`
- [ ] Crew access: copy link, resend email, regenerate link

### Permissions

- [ ] Still `canManageTeam` = owner + admin only (dispatchers cannot manage roster — matches CL admin vs field split)

---

## Phase 3 — Global route guards (worker vs office)

**Problem today:** `worker` can open `/app/*` and hit permission errors; proxy only checks Supabase session, not role (`lib/supabase/proxy.ts`).

### Implementation

- [ ] **`app/app/layout.tsx`** (or shared guard): if `session.role === "worker"` → `redirect("/crew")`
- [ ] **Exceptions:** none for workers on `/app/*` (including `/app/onboarding` — workers should not onboard orgs)
- [ ] **`/crew/*`:** allow worker, dispatcher, admin, owner (office staff may preview crew view)
- [ ] **Optional:** `/accept-invite/*` remains public until migrated off invite-first
- [ ] Document in `docs/10-auth-and-permissions.md` + browser checklist Part 8

### Why middleware not proxy

- Role requires Prisma membership lookup; keep in server layout (already has `getAppSession`) rather than adding DB to edge proxy unless perf requires it later.

---

## Phase 4 — Settings polish

- [ ] **Portals tab:** add **Crew / field portal** card (`getCrewPortalUrl()` + copy) — generic `/crew` explainer
- [ ] Per-member signed links live on Team page (CL parity)
- [ ] Fix Portals **double padding** (`Card` + inner `px-5`)
- [ ] Settings layout subtitle — include Locations, Booking form, API
- [ ] `SettingsTabs` horizontal scroll on small screens
- [ ] Locations page: collapse edit forms (reduce N× Places widgets)

---

## Phase 5 — Tests, docs, tracking

### Smokes

- [ ] `scripts/smoke-crew-login.ts` — create member, token redeem, `/crew` session, `crewLastLoginAt` set
- [ ] Extend `smoke-team-invite.ts` or deprecate if invite path secondary
- [ ] `npm run smoke:launch-crew` regression
- [ ] Phase 0 email: assert `NotificationLog` status when Resend configured

### Docs

- [ ] `docs/14-mobile-crew-view.md` — crew login link flow
- [ ] `docs/13-notifications.md` — `crew_login_link` template + Resend troubleshooting
- [ ] `docs/08-routes-and-navigation.md` — `/crew/auth/[token]`, team profile routes
- [ ] `docs/10-auth-and-permissions.md` — worker `/app` redirect
- [ ] `CHANGELOG.md`, `HANDOFF.md`
- [ ] `tasks/competitor-parity-status.md` — Team row → ✅ when done

### Validation

- [ ] `npm run typecheck`, `npm run lint`, `npm run build`
- [ ] `npm run db:validate`

---

## Out of scope (FIX-01)

- Wage / hourly / payout (CL Wage modal)
- Avg rating column
- Provider color hex (scheduler color — later)
- Open jobs self-assign checkbox (sprint 47)
- Supabase OTP “Request login” on `/sign-in` for workers (optional FIX-02)
- SMS send for crew link (email first; mirror `notifyCustomerPortalLink` SMS later if Twilio on)

---

## Implementation order (suggested)

```
Phase 0  Email diagnostics (your broken magic link report)
Phase 1  Schema + /crew/auth/[token] + Resend template
Phase 3  Worker → /crew global guard (quick win, can parallel)
Phase 2  Team UI (add, table, profile, copy/send link)
Phase 4  Settings polish
Phase 5  Smokes + docs
```

---

## Open items (defaults if silent)

| Item | Default |
|------|---------|
| Token TTL | 7 days, regeneratable from Team |
| Send email on create | On |
| Phone on add form | Optional |
| Dispatcher uses | `/app` only (unchanged) |
| Worker uses | `/crew` only (enforced) |

---

## Files (expected touch list)

| Area | Paths |
|------|--------|
| Schema | `prisma/schema.prisma`, migration |
| Crew auth | `server/services/crew-auth.ts`, `app/crew/auth/[token]/route.ts` |
| Notifications | `server/services/notifications.ts`, `lib/notifications/labels.ts` |
| Team | `app/app/team/page.tsx`, `app/app/team/[membershipId]/page.tsx`, `server/actions/team.ts`, `server/services/team-members.ts` |
| Guards | `app/app/layout.tsx` |
| Settings | `app/app/settings/portals/page.tsx`, `SettingsTabs.tsx`, `layout.tsx` |
| URL | `lib/url/app.ts` |
| Smokes | `scripts/smoke-crew-login.ts` |
