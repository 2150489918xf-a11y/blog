/**
 * 前台启动入口
 * =============
 * 职责：按顺序调用各模块，启动前台页面。
 *
 * 数据流：
 *   Supabase → BlogDB（缓存层）→ resolveXxx()（内存缓存）→ applyXxx()（DOM 渲染）
 *
 * 启动顺序（boot 函数）：
 *   1. applyRemotePageConfiguration() — 站点设置 + 导航（并行）
 *   2. 各页面区块渲染（根据 data-page 属性分发）
 *   3. 侧栏目录 / 文章列表 / 轮播初始化
 *   4. 时钟 / 返回顶部 / 表单处理
 *
 * 依赖加载顺序：
 *   supabase-core.js → supabase.js → data-layer.js → page-sections.js → profile-renderer.js → script.js
 */

async function boot() {
  // 数据库连接诊断（结果输出到浏览器控制台）
  if (typeof BlogDB !== 'undefined' && BlogDB.checkConnection) {
    BlogDB.checkConnection();
  }
  await applyRemotePageConfiguration();
  markCurrentPage();
  initClock();
  initBackToTop();
  renderHomeArticles();
  renderArticleCatalog();
  renderProjectCards();
  renderFriendLinks();
  renderSidebarDirectory();
  renderScheduleTable();
  renderMessages();
  initCarousel();
  initSidebarTabs();
  initForms();
}

document.addEventListener("DOMContentLoaded", function () {
  boot();
});
