# Mock 数据删除 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 删除所有前端 mock/本地存储兜底数据，改为数据库唯一数据源，并在为空时显示统一空状态。

**Architecture:** 保持现有静态 HTML/CSS/JS 结构不变，Supabase 仍作为数据访问层。前端渲染仅使用远程数据，列表为空时由统一空状态渲染函数补位。

**Tech Stack:** HTML, CSS, JavaScript, Supabase JS CDN, manual browser validation.

---

### Task 1: 清理 mock 与本地存储数据源

**Files:**
- Modify: `script.js`

**Step 1: Write the failing check**

在 `script.js` 中确认仍存在以下 mock/本地存储逻辑：
- `LOCAL_STORAGE_KEY` / `staticArticleCatalog`
- `projectCatalog` / `resourceGroupCatalog` / `scheduleRows` / `friendLinkCatalog` / `defaultMessages`
- `window.blogAdmin` / `readMessages` / `saveMessages` / `pushMessage`

**Step 2: Run check to verify it fails**

打开 `script.js`，搜索上述标识，确认当前仍存在。

**Step 3: Write minimal implementation**

删除上述 mock/本地存储相关常量与函数，并确保数据解析只依赖 Supabase：

```js
// 删除 LOCAL_STORAGE_KEY、staticArticleCatalog、loadAllArticles、window.blogAdmin
// 删除 projectCatalog/resourceGroupCatalog/scheduleRows/friendLinkCatalog/defaultMessages
// 删除 readMessages/saveMessages/pushMessage/buildMessage

async function resolveArticleCatalog() {
  if (activeArticleCatalog) return activeArticleCatalog;
  const remote = await loadArticlesFromSupabase();
  activeArticleCatalog = remote || [];
  return activeArticleCatalog;
}

async function resolveProjectCatalog() {
  if (activeProjectCatalog) return activeProjectCatalog;
  const remote = await loadProjectsFromSupabase();
  activeProjectCatalog = remote || [];
  return activeProjectCatalog;
}

async function resolveResourceGroups() {
  if (activeResourceGroups) return activeResourceGroups;
  const remote = await loadResourceGroupsFromSupabase();
  activeResourceGroups = remote || [];
  return activeResourceGroups;
}

async function resolveScheduleRows() {
  if (activeScheduleRows) return activeScheduleRows;
  const remote = await loadScheduleRowsFromSupabase();
  activeScheduleRows = remote || [];
  return activeScheduleRows;
}

function initForms() {
  document.querySelectorAll("form[data-form-type]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateForm(form)) return;

      if (form.dataset.formType === "contact") {
        form.reset();
        renderMessages();
        return;
      }

      window.location.href = resolvePath("pages/about/contact.html");
    });
  });
}
```

**Step 4: Run check to verify it passes**

再次搜索 `script.js`，确认上述 mock/本地存储逻辑已移除。

**Step 5: Commit**

```bash
git add script.js
git commit -m "refactor: remove mock/local storage sources"
```

---

### Task 2: 增加统一空状态渲染

**Files:**
- Modify: `script.js`

**Step 1: Write the failing check**

打开首页、项目页、资源页、表格页、联系页（数据库为空时），确认当前没有统一空状态提示。

**Step 2: Run check to verify it fails**

在浏览器中打开上述页面，观察页面为空或缺少提示。

**Step 3: Write minimal implementation**

新增统一空状态渲染函数，并在所有列表渲染点调用：

```js
function renderEmptyState(container, title, desc) {
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <strong>${title || "暂无数据"}</strong>
      <div>${desc || "请在管理后台添加内容后刷新页面。"}</div>
    </div>
  `;
}

function renderHomeArticles() {
  const container = document.getElementById("articleList");
  if (!container) return;
  resolveArticleCatalog().then((catalog) => {
    if (!catalog.length) {
      renderEmptyState(container);
      return;
    }
    container.innerHTML = catalog.map(createArticleCard).join("");
  });
}

// 在 renderArticleCatalog/renderProjectCards/renderFriendLinks/renderSidebarDirectory
// renderScheduleTable/renderMessages 中补充空状态处理
```

表格空状态建议：

```js
if (!rows.length) {
  tbody.innerHTML = `
    <tr>
      <td colspan="4"><div class="empty-state">暂无数据，请在管理后台添加内容后刷新页面。</div></td>
    </tr>
  `;
  return;
}
```

**Step 4: Run check to verify it passes**

重新打开上述页面，确认空状态提示显示且无控制台错误。

**Step 5: Commit**

```bash
git add script.js
git commit -m "feat: add empty state rendering"
```

---

### Task 3: 移除页面硬编码 fallback 内容

**Files:**
- Modify: `pages/resources/links.html`
- Modify: `pages/profile/resume.html`
- Modify: `pages/about/contact.html`

**Step 1: Write the failing check**

确认上述页面仍含硬编码示例内容（资源页使用建议、简历页内容块、联系页 sessionStorage 描述）。

**Step 2: Run check to verify it fails**

打开页面并查看 HTML，确认这些内容仍存在。

**Step 3: Write minimal implementation**

- 资源页：清空 `#resourceGuideBody` 内的示例段落，改为空容器或空状态占位。
- 简历页：删除 `#profileBlocksFallback` 与 `#profileAsideBlocksFallback` 的硬编码内容，改为仅保留空状态提示容器。
- 联系页：更新 hero/intro 文案，移除“sessionStorage”描述，改为中性描述（不承诺存储方式）。

示例（resume.html）：

```html
<div id="profileBlocksFallback" class="empty-state">
  暂无数据，请在管理后台添加内容后刷新页面。
</div>
```

**Step 4: Run check to verify it passes**

重新打开页面，确认不再显示示例内容，空状态提示正常出现。

**Step 5: Commit**

```bash
git add pages/resources/links.html pages/profile/resume.html pages/about/contact.html
git commit -m "refactor: remove fallback content blocks"
```

---

### Task 4: 全量手动验证

**Files:**
- Verify: `index.html`
- Verify: `pages/projects/index.html`
- Verify: `pages/resources/links.html`
- Verify: `pages/data/schedule.html`
- Verify: `pages/about/contact.html`
- Verify: `pages/profile/resume.html`

**Step 1: Run validation**

打开以上页面，确认数据库为空时均显示空状态提示。

**Step 2: Run validation with data**

在后台新增一条内容后刷新页面，确认可正常渲染。

**Step 3: Commit**

如无新改动，跳过提交。
