# Personal Portfolio Blog Assignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 12-page static personal portfolio and learning blog website that satisfies the university assignment requirements and keeps a unified dark visual style inspired by the existing homepage and the Preference reference site.

**Architecture:** Keep the project as a plain HTML/CSS/JavaScript static site. Use one shared stylesheet and one shared script for all pages. Organize content into nested folders under pages/ so the site satisfies the three-level directory requirement. Use lightweight JavaScript for carousel behavior, dropdown navigation, clock rendering, article filtering, table rendering, back-to-top behavior, and front-end form validation with redirect to the message page.

**Tech Stack:** HTML5, CSS3, JavaScript, PowerShell validation script, local static file serving.

---

### Task 1: Write the failing site validation

**Files:**
- Create: `tools/check-site.ps1`
- Test: `tools/check-site.ps1`

**Step 1: Write the failing validation script**

Create a PowerShell script that asserts all required pages and shared assets exist:
- `index.html`
- `styles.css`
- `script.js`
- `pages/articles/index.html`
- `pages/articles/build-portfolio.html`
- `pages/articles/frontend-roadmap.html`
- `pages/projects/index.html`
- `pages/profile/resume.html`
- `pages/profile/settings.html`
- `pages/auth/login.html`
- `pages/auth/register.html`
- `pages/data/schedule.html`
- `pages/resources/links.html`
- `pages/about/contact.html`

Also assert the homepage contains placeholders for dropdown navigation, carousel, article list, friend links, and clock.

**Step 2: Run test to verify it fails**

Run: `powershell -ExecutionPolicy Bypass -File tools/check-site.ps1`
Expected: FAIL because most required pages do not exist yet.

**Step 3: Commit**

Do not commit unless explicitly requested by the user.

### Task 2: Build the shared layout foundation

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `script.js`

**Step 1: Write the failing test expectation**

Keep the same validation script and rely on its current failure.

**Step 2: Write minimal implementation**

Replace the current single-page homepage with a course-ready homepage that includes:
- fixed header
- dropdown navigation
- hero section with carousel container
- clock area
- article preview area
- project cards
- friend links section
- footer and back-to-top button

Add shared CSS tokens and common layout styles that all inner pages can reuse.

Add shared JavaScript helpers for:
- dropdown toggle
- carousel rotation
- live date/time/week display
- back-to-top button
- current navigation highlighting

**Step 3: Run test to verify partial progress**

Run: `powershell -ExecutionPolicy Bypass -File tools/check-site.ps1`
Expected: still FAIL, but now only for missing inner pages or missing required selectors.

**Step 4: Commit**

Do not commit unless explicitly requested by the user.

### Task 3: Add the article section pages

**Files:**
- Create: `pages/articles/index.html`
- Create: `pages/articles/build-portfolio.html`
- Create: `pages/articles/frontend-roadmap.html`

**Step 1: Write the failing test expectation**

Use the existing validation failure that reports missing article pages.

**Step 2: Write minimal implementation**

Create the article list page with:
- shared header and footer
- article cards
- category filter controls
- links to the two article detail pages

Create two long article detail pages with:
- title area
- metadata
- in-page table of contents
- long-form sections with anchors
- previous or next navigation

**Step 3: Run test to verify progress**

Run: `powershell -ExecutionPolicy Bypass -File tools/check-site.ps1`
Expected: FAIL only for remaining missing non-article pages or selectors.

**Step 4: Commit**

Do not commit unless explicitly requested by the user.

### Task 4: Add the portfolio and profile pages

**Files:**
- Create: `pages/projects/index.html`
- Create: `pages/profile/resume.html`
- Create: `pages/data/schedule.html`
- Create: `pages/resources/links.html`

**Step 1: Write the failing test expectation**

Use the current validation output for these missing files.

**Step 2: Write minimal implementation**

Create:
- a project showcase page with project cards
- a resume page with profile, honors, interests, and self-evaluation
- a data table page with a styled study schedule or skill table
- a common links page with grouped useful resources and friend links

**Step 3: Run test to verify progress**

Run: `powershell -ExecutionPolicy Bypass -File tools/check-site.ps1`
Expected: FAIL only for missing form-related pages or missing form selectors.

**Step 4: Commit**

Do not commit unless explicitly requested by the user.

### Task 5: Add the form and message flow pages

**Files:**
- Create: `pages/profile/settings.html`
- Create: `pages/auth/login.html`
- Create: `pages/auth/register.html`
- Create: `pages/about/contact.html`
- Modify: `script.js`

**Step 1: Write the failing test expectation**

Use the validation output for missing form pages or missing form-related hooks.

**Step 2: Write minimal implementation**

Create:
- settings page with text, password, radio, checkbox, select, and textarea inputs
- login page with account and password validation
- register page with username, email, password, confirm password, agreement validation
- contact page that acts as the browse-message page and displays submitted messages

Extend shared JavaScript to:
- validate required inputs
- show inline error messages
- save form submissions to sessionStorage
- redirect valid submissions to `pages/about/contact.html`
- render stored message records on the contact page

**Step 3: Run test to verify it passes**

Run: `powershell -ExecutionPolicy Bypass -File tools/check-site.ps1`
Expected: PASS.

**Step 4: Commit**

Do not commit unless explicitly requested by the user.

### Task 6: Refine responsive design and interaction polish

**Files:**
- Modify: `styles.css`
- Modify: `script.js`

**Step 1: Write the failing test or check**

Use narrow behavior checks in the browser preview and confirm any missing UI hooks from the validation script.

**Step 2: Write minimal implementation**

Improve:
- responsive breakpoints at mobile, tablet, and desktop widths
- hover and focus states
- reduced motion compatibility
- table overflow behavior on small screens
- dropdown behavior on mobile

**Step 3: Run focused validation**

Run:
- `powershell -ExecutionPolicy Bypass -File tools/check-site.ps1`
- open the homepage and one inner page in the browser preview

Expected: PASS and visually stable pages.

**Step 4: Commit**

Do not commit unless explicitly requested by the user.

### Task 7: Final verification

**Files:**
- Verify: `index.html`
- Verify: `styles.css`
- Verify: `script.js`
- Verify: `pages/**`
- Verify: `tools/check-site.ps1`

**Step 1: Run the site validation**

Run: `powershell -ExecutionPolicy Bypass -File tools/check-site.ps1`
Expected: PASS.

**Step 2: Run static server smoke test**

Run: `python -m http.server 5500`
Expected: site serves successfully if Python is available.

**Step 3: Manual browser checks**

Confirm:
- homepage carousel rotates and can be controlled manually
- dropdown navigation opens and closes correctly
- clock displays date, time, and weekday
- article list filters change the rendered cards
- forms show errors on invalid input
- valid form submission redirects to the contact page and shows the stored message
- every inner page has a working path back to the homepage

**Step 4: Commit**

Do not commit unless explicitly requested by the user.
