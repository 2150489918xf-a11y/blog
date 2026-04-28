# Admin CMS Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the admin system into a module-driven CMS that can manage articles, projects, resource navigation content, schedule/table content, and page configuration from Supabase.

**Architecture:** Keep the site as plain HTML/CSS/JavaScript. Expand the Supabase schema for typed content tables plus page configuration tables, add a dedicated admin application script, and migrate front-end rendering to a remote-first data flow with static fallbacks.

**Tech Stack:** HTML5, CSS3, JavaScript, Supabase JS CDN, Supabase Postgres, manual browser smoke validation, VS Code Problems validation.

---

### Task 1: Establish the admin shell foundation

**Files:**
- Modify: `admin.html`
- Modify: `admin.css`
- Create: `admin.js`

**Step 1: Write the failing check**

Open `admin.html` and confirm the current page only exposes article management and uses a large inline script.

**Step 2: Run the failing check**

Check: open `admin.html` in the browser preview
Expected: only article management exists, with no module navigation for other content types.

**Step 3: Write minimal implementation**

- Add a sidebar/module navigation shell.
- Move admin page logic out of inline HTML into `admin.js`.
- Keep article management working while preparing placeholders for projects, resources, schedule, and page configuration modules.

**Step 4: Run focused validation**

- Check VS Code Problems for `admin.html`, `admin.css`, `admin.js`
- Open `admin.html` and verify the shell renders and article module still loads

### Task 2: Expand the Supabase schema and content API

**Files:**
- Modify: `db/migration.sql`
- Modify: `supabase.js`

**Step 1: Write the failing check**

Confirm `supabase.js` only exposes article/category methods and `migration.sql` only creates `articles` and `categories`.

**Step 2: Run the failing check**

Check: inspect `window.BlogDB` methods and the migration file
Expected: projects, resources, schedule, navigation, page sections, profile blocks, and site settings are missing.

**Step 3: Write minimal implementation**

- Add new tables for projects, resource groups, resource links, schedule items, site settings, navigation items, page sections, profile blocks, and media assets.
- Add CRUD helpers in `supabase.js` for these content types.

**Step 4: Run focused validation**

- Check VS Code Problems for `db/migration.sql` and `supabase.js`
- Open the browser console and verify `window.BlogDB` exposes the new methods

### Task 3: Implement core content modules in admin

**Files:**
- Modify: `admin.js`
- Modify: `admin.css`

**Step 1: Write the failing check**

Open the new admin shell and verify only articles can be listed or edited.

**Step 2: Run the failing check**

Check: click the module navigation
Expected: projects, resources, and schedule do not yet have functional lists/forms.

**Step 3: Write minimal implementation**

- Add projects CRUD.
- Add resource group and resource link CRUD.
- Add schedule item CRUD.
- Reuse generic list/form rendering wherever practical.

**Step 4: Run focused validation**

- Check VS Code Problems for `admin.js` and `admin.css`
- Open `admin.html` and verify module switching and form rendering work without runtime errors

### Task 4: Switch front-end list pages to remote-first rendering

**Files:**
- Modify: `script.js`
- Modify: `pages/projects/index.html`
- Modify: `pages/resources/links.html`
- Modify: `pages/data/schedule.html`

**Step 1: Write the failing check**

Confirm these pages still depend on static arrays or hard-coded content.

**Step 2: Run the failing check**

Open the pages and inspect the rendered output
Expected: project list, resource navigation, and schedule content are not yet driven by Supabase.

**Step 3: Write minimal implementation**

- Load projects, resource groups/links, and schedule items from Supabase first.
- Fall back to the existing static content when remote data is unavailable.
- Replace hard-coded resource blocks with JS-rendered content regions.

**Step 4: Run focused validation**

- Check VS Code Problems for the modified files
- Open the three pages and verify rendering still works when remote content is absent

### Task 5: Add configuration-driven page content foundation

**Files:**
- Modify: `script.js`
- Modify: `pages/profile/resume.html`
- Modify: `index.html`
- Modify: `admin.js`

**Step 1: Write the failing check**

Confirm the homepage profile area and resume page content are still hard-coded in HTML.

**Step 2: Run the failing check**

Open `index.html` and `pages/profile/resume.html`
Expected: content cannot yet be changed from the admin system.

**Step 3: Write minimal implementation**

- Introduce site settings, page sections, and profile blocks rendering hooks.
- Add admin forms for these configuration tables.
- Preserve static fallback content where no remote records exist.

**Step 4: Run focused validation**

- Check VS Code Problems for the modified files
- Open the homepage and resume page to ensure fallback rendering remains intact

### Task 6: Final smoke validation

**Files:**
- Verify: `admin.html`
- Verify: `admin.js`
- Verify: `admin.css`
- Verify: `supabase.js`
- Verify: `script.js`
- Verify: `pages/**`

**Step 1: Run error validation**

Check VS Code Problems for all touched files.

**Step 2: Run browser smoke tests**

Open:

- `admin.html`
- `index.html`
- `pages/projects/index.html`
- `pages/resources/links.html`
- `pages/data/schedule.html`
- `pages/profile/resume.html`

Expected: no blocking script errors and all pages render with remote-first fallback behavior.

**Step 3: Review diff**

Inspect the changed files to ensure the refactor stays scoped to content management and rendering.