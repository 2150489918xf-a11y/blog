/**
 * BlogDB — Supabase 业务 API 层
 * ================================
 * 职责：封装各业务模块（文章、项目、资源等）的 CRUD 操作。
 *
 * 依赖：supabase-core.js（必须先加载，提供 BlogDBCore）
 * 加载顺序：Supabase SDK CDN → supabase-core.js → supabase.js
 *
 * 使用方式：
 *   BlogDB.getPublishedArticles()     // 获取已发布文章（带缓存）
 *   BlogDB.uploadImage(file, 'covers') // 上传图片到 Supabase Storage
 */

(function () {
  // 快捷引用核心层
  var Core = window.BlogDBCore;
  if (!Core) {
    console.error('[BlogDB] supabase-core.js 未加载，业务层无法初始化');
    return;
  }

  // ================================================================
  //  1. 文章 CRUD
  // ================================================================

  /** 获取已发布的文章列表（5 分钟 localStorage 缓存） */
  async function getPublishedArticles() {
    return Core.getCached("articles", "articles_published", 5 * 60 * 1000, {
      filters: [{ column: "published", operator: "eq", value: true }],
      orderBy: "created_at", ascending: false, emptyValue: null
    });
  }

  /** 获取所有文章（管理员用，含未发布） */
  async function getAllArticles() {
    return Core.listRecords('articles', {
      orderBy: 'created_at',
      ascending: false,
      emptyValue: [],
    });
  }

  /** 获取单篇文章 */
  async function getArticleBySlug(slug) {
    return Core.getRecord('articles', slug, { idColumn: 'slug' });
  }

  /** 创建文章 */
  async function createArticle(article) {
    return Core.createRecord('articles', {
      title: article.title,
      slug: article.slug || Core.makeSlug(article.title),
      summary: article.summary || '',
      content: article.content || '',
      cover_url: article.cover_url || '',
      category: article.category || '未分类',
      tags: article.tags || [],
      read_time: article.read_time || 3,
      published: article.published !== false,
    });
  }

  /** 更新文章 */
  async function updateArticle(id, updates) {
    return Core.updateRecord('articles', id, updates);
  }

  /** 删除文章 */
  async function deleteArticle(id) {
    return Core.deleteRecord('articles', id);
  }

  /** 切换发布状态 */
  async function togglePublish(id, published) {
    return updateArticle(id, { published });
  }

  // ================================================================
  //  2. 分类 CRUD
  // ================================================================

  async function getCategories() {
    return Core.getCached("categories", "categories", 10 * 60 * 1000, {
      orderBy: "article_count", ascending: false, emptyValue: []
    });
  }

  // ================================================================
  //  3. 项目 CRUD
  // ================================================================

  async function getPublishedProjects() {
    return Core.getCached("projects", "projects_published", 5 * 60 * 1000, {
      filters: [{ column: "published", operator: "eq", value: true }],
      orderBy: "sort_order", emptyValue: []
    });
  }

  async function getAllProjects() {
    return Core.listRecords('projects', {
      orderBy: 'sort_order',
      emptyValue: [],
    });
  }

  async function createProject(project) {
    return Core.createRecord('projects', {
      title: project.title,
      slug: project.slug || Core.makeSlug(project.title),
      summary: project.summary || '',
      description: project.description || '',
      status: project.status || '进行中',
      tech_tags: project.tech_tags || [],
      cover_url: project.cover_url || '',
      demo_url: project.demo_url || '',
      repo_url: project.repo_url || '',
      sort_order: project.sort_order || 0,
      published: project.published !== false,
    });
  }

  async function updateProject(id, updates) {
    return Core.updateRecord('projects', id, updates);
  }

  async function deleteProject(id) {
    return Core.deleteRecord('projects', id);
  }

  // ================================================================
  //  4. 资源导航 CRUD
  // ================================================================

  async function getPublishedResourceGroups() {
    var cacheTime = 5 * 60 * 1000;
    var cached = Core.readCache('resource_groups_published', cacheTime);
    if (cached) return cached;

    var groups = await Core.listRecords('resource_groups', {
      filters: [{ column: 'published', operator: 'eq', value: true }],
      orderBy: 'sort_order',
      emptyValue: [],
    });

    var links = await Core.listRecords('resource_links', {
      filters: [{ column: 'published', operator: 'eq', value: true }],
      orderBy: 'sort_order',
      emptyValue: [],
    });

    var data = groups.map(function (group) {
      return Object.assign({}, group, {
        links: links.filter(function (link) { return link.group_id === group.id; }),
      });
    });

    Core.writeCache('resource_groups_published', data);
    return data;
  }

  async function getAllResourceGroups() {
    return Core.listRecords('resource_groups', {
      orderBy: 'sort_order',
      emptyValue: [],
    });
  }

  async function createResourceGroup(group) {
    return Core.createRecord('resource_groups', {
      name: group.name,
      slug: group.slug || Core.makeSlug(group.name),
      description: group.description || '',
      sort_order: group.sort_order || 0,
      published: group.published !== false,
    });
  }

  async function updateResourceGroup(id, updates) {
    return Core.updateRecord('resource_groups', id, updates);
  }

  async function deleteResourceGroup(id) {
    return Core.deleteRecord('resource_groups', id);
  }

  async function getAllResourceLinks() {
    return Core.listRecords('resource_links', {
      orderBy: 'sort_order',
      emptyValue: [],
    });
  }

  async function createResourceLink(link) {
    return Core.createRecord('resource_links', {
      group_id: link.group_id,
      title: link.title,
      description: link.description || '',
      href: link.href,
      label: link.label || '',
      sort_order: link.sort_order || 0,
      published: link.published !== false,
    });
  }

  async function updateResourceLink(id, updates) {
    return Core.updateRecord('resource_links', id, updates);
  }

  async function deleteResourceLink(id) {
    return Core.deleteRecord('resource_links', id);
  }

  // ================================================================
  //  5. 学习计划（表格项）CRUD
  // ================================================================

  async function getPublishedScheduleItems() {
    return Core.getCached("schedule_items", "schedule_items_published", 5 * 60 * 1000, {
      filters: [{ column: "published", operator: "eq", value: true }],
      orderBy: "sort_order", emptyValue: []
    });
  }

  async function getAllScheduleItems() {
    return Core.listRecords('schedule_items', {
      orderBy: 'sort_order',
      emptyValue: [],
    });
  }

  async function createScheduleItem(item) {
    return Core.createRecord('schedule_items', {
      task_name: item.task_name,
      time_range: item.time_range || '',
      goal: item.goal || '',
      status: item.status || '待开始',
      sort_order: item.sort_order || 0,
      published: item.published !== false,
    });
  }

  async function updateScheduleItem(id, updates) {
    return Core.updateRecord('schedule_items', id, updates);
  }

  async function deleteScheduleItem(id) {
    return Core.deleteRecord('schedule_items', id);
  }

  // ================================================================
  //  6. 站点配置 + 导航 + 页面区块 + 简历区块 CRUD
  // ================================================================

  async function getSiteSettings() {
    var rows = await Core.getCached("site_settings", "site_settings_map", 10 * 60 * 1000, {
      orderBy: "setting_key", emptyValue: []
    });
    return rows.reduce(function (acc, row) {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});
  }

  async function getAllSiteSettings() {
    return Core.listRecords('site_settings', {
      orderBy: 'setting_key',
      emptyValue: [],
    });
  }

  async function upsertSiteSetting(setting) {
    var client = Core.getClient();
    if (!client) throw new Error('Supabase 未连接');

    var result = await client
      .from('site_settings')
      .upsert({
        setting_key: setting.setting_key,
        label: setting.label || '',
        setting_value: setting.setting_value || {},
      }, { onConflict: 'setting_key' })
      .select()
      .single();

    if (result.error) throw result.error;

    Core.clearContentCache();
    return result.data;
  }

  async function deleteSiteSetting(id) {
    return Core.deleteRecord('site_settings', id);
  }

  async function getNavigationItems() {
    return Core.getCached("navigation_items", "navigation_items_visible", 10 * 60 * 1000, {
      filters: [{ column: "visible", operator: "eq", value: true }],
      orderBy: "sort_order", emptyValue: []
    });
  }

  async function getAllNavigationItems() {
    return Core.listRecords('navigation_items', {
      orderBy: 'sort_order',
      emptyValue: [],
    });
  }

  async function createNavigationItem(item) {
    return Core.createRecord('navigation_items', {
      label: item.label,
      href: item.href,
      icon: item.icon || '',
      parent_id: item.parent_id || null,
      sort_order: item.sort_order || 0,
      visible: item.visible !== false,
    });
  }

  async function updateNavigationItem(id, updates) {
    return Core.updateRecord('navigation_items', id, updates);
  }

  async function deleteNavigationItem(id) {
    return Core.deleteRecord('navigation_items', id);
  }

  async function getPageSections(pageKey) {
    var cacheKey = "page_sections_" + (pageKey || "all");
    var filters = [];
    if (pageKey) filters.push({ column: "page_key", operator: "eq", value: pageKey });
    filters.push({ column: "published", operator: "eq", value: true });
    return Core.getCached("page_sections", cacheKey, 10 * 60 * 1000, {
      filters: filters, orderBy: "sort_order", emptyValue: []
    });
  }

  async function getAllPageSections() {
    return Core.listRecords('page_sections', {
      orderBy: 'sort_order',
      emptyValue: [],
    });
  }

  async function createPageSection(section) {
    return Core.createRecord('page_sections', {
      page_key: section.page_key,
      section_key: section.section_key,
      eyebrow: section.eyebrow || '',
      title: section.title,
      description: section.description || '',
      content: section.content || {},
      sort_order: section.sort_order || 0,
      published: section.published !== false,
    });
  }

  async function updatePageSection(id, updates) {
    return Core.updateRecord('page_sections', id, updates);
  }

  async function deletePageSection(id) {
    return Core.deleteRecord('page_sections', id);
  }

  async function getProfileBlocks() {
    return Core.getCached("profile_blocks", "profile_blocks_visible", 10 * 60 * 1000, {
      filters: [{ column: "published", operator: "eq", value: true }],
      orderBy: "sort_order", emptyValue: []
    });
  }

  async function getAllProfileBlocks() {
    return Core.listRecords('profile_blocks', {
      orderBy: 'sort_order',
      emptyValue: [],
    });
  }

  async function createProfileBlock(block) {
    return Core.createRecord('profile_blocks', {
      block_key: block.block_key,
      title: block.title,
      subtitle: block.subtitle || '',
      content: block.content || {},
      sort_order: block.sort_order || 0,
      published: block.published !== false,
    });
  }

  async function updateProfileBlock(id, updates) {
    return Core.updateRecord('profile_blocks', id, updates);
  }

  async function deleteProfileBlock(id) {
    return Core.deleteRecord('profile_blocks', id);
  }

  async function getMediaAssets() {
    return Core.listRecords('media_assets', {
      orderBy: 'created_at',
      ascending: false,
      emptyValue: [],
    });
  }

  async function createMediaAsset(asset) {
    return Core.createRecord('media_assets', {
      file_name: asset.file_name,
      file_path: asset.file_path,
      public_url: asset.public_url,
      mime_type: asset.mime_type || '',
      size_bytes: asset.size_bytes || 0,
      usage_type: asset.usage_type || '',
    });
  }

  async function deleteMediaAsset(id) {
    return Core.deleteRecord('media_assets', id);
  }

  // ================================================================
  //  7. 导出 API — 合并核心层 + 业务层，挂载到 window.BlogDB
  // ================================================================
  window.BlogDB = Object.assign({}, Core, {
    // 文章
    getPublishedArticles,
    getAllArticles,
    getArticleBySlug,
    createArticle,
    updateArticle,
    deleteArticle,
    togglePublish,
    // 分类
    getCategories,
    // 项目
    getPublishedProjects,
    getAllProjects,
    createProject,
    updateProject,
    deleteProject,
    // 资源导航
    getPublishedResourceGroups,
    getAllResourceGroups,
    createResourceGroup,
    updateResourceGroup,
    deleteResourceGroup,
    getAllResourceLinks,
    createResourceLink,
    updateResourceLink,
    deleteResourceLink,
    // 学习计划
    getPublishedScheduleItems,
    getAllScheduleItems,
    createScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
    // 站点配置
    getSiteSettings,
    getAllSiteSettings,
    upsertSiteSetting,
    deleteSiteSetting,
    // 导航
    getNavigationItems,
    getAllNavigationItems,
    createNavigationItem,
    updateNavigationItem,
    deleteNavigationItem,
    // 页面区块
    getPageSections,
    getAllPageSections,
    createPageSection,
    updatePageSection,
    deletePageSection,
    // 简历区块
    getProfileBlocks,
    getAllProfileBlocks,
    createProfileBlock,
    updateProfileBlock,
    deleteProfileBlock,
    // 媒体
    getMediaAssets,
    createMediaAsset,
    deleteMediaAsset,
  });
})();
