# pro-ilab — Claude Code Instructions

These rules apply to every session. Read before making any changes.

---

## Critical rules — do NOT break these

### 1. activeModules lives in the Zustand store — never move it back to local state

`activeModules` (which icons show on the dashboard) is stored in `useAppStore` (`src/store/useAppStore.js`).

**Why:** It used to be local state in Dashboard.jsx. Changes made from Profile (solo users) were never reflected until a page reload. The fix moved it to the global store so the icon picker can update it from any screen instantly.

**Rules:**
- `Dashboard.jsx` must read `activeModules` from `useAppStore()` — never `useState(null)`
- `DashboardIconPicker.jsx` must call `setActiveModules(modules)` from `useAppStore()` inside its `save()` function, after every save
- `clearSession` in the store must reset `activeModules: null`
- Do NOT add a separate `activeModules` state to any screen or component

### 2. Mileage (and labsafety) icons must respect activeModules — never hardcode them

Two places previously hardcoded the full module list, ignoring the user's saved preferences:

- `getAllModulesForStudent()` in `Dashboard.jsx` — the student card grid
- `allQuickLinks` in `StudentDashboardView` in `Dashboard.jsx` — the student sidebar

**Rules:**
- Any module list rendered in Dashboard must be filtered by `activeModules` if it is set
- `StudentDashboardView` receives `activeModules` as a prop and filters `allQuickLinks` with it
- `CardGridView` for students uses `activeModules` to filter `getAllModulesForStudent()`
- Never add a hardcoded list of modules that bypasses `activeModules`

### 3. External link icons (mileage, labsafety) use the ExternalLinkModal — never open URLs directly

Clicking an external module card must go through `setConfirmExternal({ url })` → `ExternalLinkModal`. Do not call `window.open()` directly from a click handler.

`ExternalLinkModal` handles empty/invalid URLs gracefully (shows "Link not configured" instead of opening a broken tab).

---

## Architecture overview

### Login modes
- **solo** — logged in via `solo_users` table (purple #534AB7 accent)
- **team** — logged in via `users` table (green #1D9E75 accent)
- **admin** — team login with `role = 'admin'`; accessed at `/pro-ilab/admin`

### Global store (`src/store/useAppStore.js`)
Key fields:
| Field | Purpose |
|-------|---------|
| `session` | Current user session |
| `activeModules` | Array of module keys visible on dashboard (null = show all) |
| `sharedWorkspaces` | Solo workspaces the user is a member of |
| `viewingWorkspaceOwnerId` | null = own workspace; uuid = shared workspace |

### Icon picker flow
1. User opens picker (from Dashboard "Customize" button or Profile → Dashboard Icons)
2. `DashboardIconPicker` saves to DB (`solo_users.active_modules` or `user_dashboard_prefs.active_modules`)
3. **Immediately** calls `setActiveModules(modules)` from store
4. Dashboard re-renders with filtered modules — no navigation or reload needed

### Solo workspace sharing
- `solo_workspace_invites` — pending/accepted/declined invites between solo users
- `solo_workspace_members` — accepted memberships
- `TeammatesPanel` component (`src/components/TeammatesPanel.jsx`) — shared between Profile and ProjectMaterial screens

### Project & Material screen
- Route `projects` → `src/screens/ProjectMaterial.jsx` (not `Projects.jsx`)
- 3 main tabs: Material Inventory | Project Test Results | Workspace
- Workspace tab has sub-tabs: Project Members (TeammatesPanel for solo) | Submit Results | Links
- Requires `project_results` and `project_links` tables (in `supabase_solo_workspace.sql`)

### SQL migrations
Run `supabase_solo_workspace.sql` in the Supabase SQL Editor to create:
- `solo_workspace_invites`
- `solo_workspace_members`
- `projects.solo_owner_id` column
- `project_results`
- `project_links`

---

## Common mistakes to avoid

- **Do not** re-introduce `const [activeModules, setActiveModules] = useState(null)` in Dashboard.jsx
- **Do not** add mileage or labsafety to any hardcoded module list that doesn't filter by `activeModules`
- **Do not** route `projects` to `<Projects />` — it must go to `<ProjectMaterial />`
- **Do not** define `TeammatesPanel` inline in Profile.jsx — it is imported from `src/components/TeammatesPanel.jsx`
- **Do not** remove `setActiveModules(modules)` from `DashboardIconPicker.save()`

### 4. New screens must be added to BOTH UNMANAGED_SCREENS and INTERNAL

There are two separate sets that must stay in sync:

- **`UNMANAGED_SCREENS`** in `Dashboard.jsx` — controls whether the icon *shows* on the dashboard for team users
- **`INTERNAL`** in `App.jsx` — controls whether navigating to the screen is *allowed* without a `user_screen_access` entry

If a screen is in `UNMANAGED_SCREENS` but NOT in `INTERNAL`, the icon shows but clicking it redirects back to dashboard. Both sets must contain the same unmanaged keys.

**Current values (must match):**
- `UNMANAGED_SCREENS` (Dashboard.jsx): `profile`, `dashboard`, `pm`, `barcode`
- `INTERNAL` (App.jsx): `dashboard`, `profile`, `inspection`, `results`, `project-detail`, `pm`, `barcode`

**Rule:** When adding a new module to `ALL_MODULES_META` that is not in `user_screen_access`, add its `screen` key to BOTH sets.
