# Mock 数据删除与空状态设计稿

## 一、背景

当前前端脚本仍包含静态 mock 数据与本地存储兜底逻辑，已不符合“数据库为唯一内容源”的要求。需要删除所有硬编码数据与本地存储缓存，同时保留统一空状态提示，避免页面空白或报错。

## 二、目标

- 删除所有 mock/示例数据与本地存储内容源。
- 页面只渲染数据库内容，数据为空时展示统一空状态提示。
- 不改动 Supabase 接口层，保持数据结构一致。

## 三、范围与边界

**纳入范围**
- `script.js` 中的静态数组、localStorage 文章覆盖、sessionStorage 留言历史。
- 依赖静态内容的页面 fallback 区块。
- 所有内容列表的空状态渲染。

**不纳入范围**
- Supabase schema 与 CRUD 接口调整。
- 后台功能改造。

## 四、方案设计

### 4.1 数据源策略
- 移除 `staticArticleCatalog`、`projectCatalog`、`resourceGroupCatalog`、`scheduleRows`、`friendLinkCatalog`、`defaultMessages`。
- 移除 `LOCAL_STORAGE_KEY` 与 `window.blogAdmin` 的本地存储写入逻辑。
- 移除留言的 `sessionStorage` 历史逻辑，改为仅展示数据库内容。

### 4.2 空状态渲染
- 统一新增 `renderEmptyState(container, title, desc)` 渲染方法。
- 当数据列表为空时，展示空状态卡片：
  - 标题：`暂无数据`
  - 描述：`请在管理后台添加内容后刷新页面。`
- 复用现有 `.empty-state` 风格，尽量减少新增样式。

### 4.3 页面级处理
- 首页：文章列表、侧栏目录为空时显示空状态提示。
- 项目页：项目列表为空时显示空状态提示。
- 资源页：资源分组为空时显示空状态提示，并清空示例文案块。
- 表格页：表格为空时显示空状态行。
- 联系页：留言为空时显示空状态提示。
- 简历页：移除硬编码内容块，改为空状态提示。

## 五、影响文件

- `script.js`
- `index.html`
- `pages/projects/index.html`
- `pages/resources/links.html`
- `pages/data/schedule.html`
- `pages/about/contact.html`
- `pages/profile/resume.html`

## 六、验证策略

- 打开首页/项目页/资源页/表格页/联系页/简历页，确认数据为空时显示空状态提示。
- 添加数据库内容后刷新页面，确认正常渲染。
- 浏览器控制台无报错。
