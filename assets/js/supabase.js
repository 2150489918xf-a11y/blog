/**
 * BlogDB — Supabase 客户端封装层
 * ================================
 * 职责：封装所有 Supabase 数据库和存储操作，提供缓存层和统一的 CRUD 接口。
 *
 * 架构：
 *   - 所有 Supabase API 调用都通过这个模块，不直接在业务代码中裸调
 *   - 读取操作带 localStorage 缓存（5-10 分钟 TTL），减少网络请求
 *   - 写入操作自动清除所有缓存，保证数据一致性
 *   - 客户端按需初始化（lazy init），避免阻塞页面加载
 *
 * 使用方式：
 *   在 HTML 中先加载 Supabase SDK CDN，再加载本文件：
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="assets/js/supabase.js"></script>
 *
 *   然后通过全局 BlogDB 对象调用：
 *   BlogDB.getPublishedArticles()     // 获取已发布文章（带缓存）
 *   BlogDB.uploadImage(file, 'covers') // 上传图片到 Supabase Storage
 *
 * 导出对象：window.BlogDB = { getPublishedArticles, createArticle, ... }
 */

(function () {
  // ================================================================
  //  1. 配置 — 连接 Supabase 项目
  // ================================================================
  const SUPABASE_URL = 'https://rgeqokmsbtsqmbtocnij.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_zdAE4Lu3bP2KH7tlJQ5Lcg_3up3vQad';

  // ================================================================
  //  2. 客户端初始化（lazy init — 首次调用时才创建连接）
  // ================================================================
  let supabase = null;

  /** 获取 Supabase 客户端实例，未初始化则自动创建 */
  function getClient() {
    if (!supabase) {
      if (typeof supabase === 'undefined' || !window.supabase) {
        console.warn('[BlogDB] Supabase SDK 未加载，使用本地缓存模式');
        return null;
      }
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabase;
  }

  // ================================================================
  //  3. 工具函数 — URL Slug / 缓存 / 错误处理
  // ================================================================

  /** 将字符串转为 URL 友好的 slug 格式（小写 + 连字符） */
  function makeSlug(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }

  /** 构造 localStorage 缓存键名（统一加 blog_cache_ 前缀，方便批量清除） */
  function getCacheKey(name) {
    return 'blog_cache_' + name;
  }

  /**
   * 从 localStorage 读取缓存数据
   * @param {string} name   - 缓存名称
   * @param {number} maxAge - 最大有效期（毫秒），超时返回 null
   * @returns {*} 缓存数据，过期或不存在返回 null
   */
  function readCache(name, maxAge) {
    try {
      const cached = JSON.parse(localStorage.getItem(getCacheKey(name)));
      if (!cached) return null;
      if (Date.now() - cached.timestamp > maxAge) return null;
      return cached.data;
    } catch (_) {
      return null;
    }
  }

  /** 将数据写入 localStorage 缓存，自动记录时间戳 */
  function writeCache(name, data) {
    localStorage.setItem(getCacheKey(name), JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  }

  /**
   * 清除所有内容缓存
   * 在创建/更新/删除操作后调用，确保下次读取拿到最新数据
   */
  function clearContentCache() {
    Object.keys(localStorage).forEach((key) => {
      if (key.indexOf('blog_cache_') === 0) {
        localStorage.removeItem(key);
      }
    });
  }

  /** 判断是否需要忽略的错误（如表不存在 — 开发阶段正常） */
  function shouldIgnoreContentError(error) {
    return !!(error && /Could not find the table|schema cache/i.test(error.message || ''));
  }

  async function listRecords(table, options = {}) {
    const client = getClient();
    if (!client) return options.emptyValue || [];

    let query = client.from(table).select(options.select || '*');

    if (options.filters) {
      options.filters.forEach((filter) => {
        if (filter.operator === 'eq') query = query.eq(filter.column, filter.value);
        if (filter.operator === 'is') query = query.is(filter.column, filter.value);
      });
    }

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending !== false });
    }

    const { data, error } = await query;
    if (error) {
      if (!shouldIgnoreContentError(error)) {
        console.error('[BlogDB]', error.message);
      }
      return options.emptyValue || [];
    }

    return data || options.emptyValue || [];
  }

  async function getRecord(table, id, options = {}) {
    const client = getClient();
    if (!client) return null;

    const { data, error } = await client
      .from(table)
      .select(options.select || '*')
      .eq(options.idColumn || 'id', id)
      .single();

    if (error) {
      if (!shouldIgnoreContentError(error)) {
        console.error('[BlogDB]', error.message);
      }
      return null;
    }

    return data;
  }

  async function createRecord(table, payload) {
    const client = getClient();
    if (!client) throw new Error('Supabase 未连接');

    const { data, error } = await client
      .from(table)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    clearContentCache();
    return data;
  }

  async function updateRecord(table, id, payload) {
    const client = getClient();
    if (!client) throw new Error('Supabase 未连接');

    const { data, error } = await client
      .from(table)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    clearContentCache();
    return data;
  }

  async function deleteRecord(table, id) {
    const client = getClient();
    if (!client) throw new Error('Supabase 未连接');

    const { error } = await client
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;

    clearContentCache();
  }

  // ================================================================
  //  4. 通用 CRUD 操作 — 所有表共用的底层查询/写入/删除
  // ================================================================

  /**
   * 查询记录列表（支持筛选和排序）
   * @param {string} table   - 表名
   * @param {object} options - { filters, orderBy, ascending, select, emptyValue }
   */
  async function listRecords(table, options = {}) {
    const client = getClient();
    if (!client) return options.emptyValue || [];

    let query = client.from(table).select(options.select || '*');

    if (options.filters) {
      options.filters.forEach((filter) => {
        if (filter.operator === 'eq') query = query.eq(filter.column, filter.value);
        if (filter.operator === 'is') query = query.is(filter.column, filter.value);
      });
    }

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending !== false });
    }

    const { data, error } = await query;
    if (error) {
      if (!shouldIgnoreContentError(error)) {
        console.error('[BlogDB]', error.message);
      }
      return options.emptyValue || [];
    }

    return data || options.emptyValue || [];
  }

  /** 查询单条记录 */
  async function getRecord(table, id, options = {}) {
    const client = getClient();
    if (!client) return null;

    const { data, error } = await client
      .from(table)
      .select(options.select || '*')
      .eq(options.idColumn || 'id', id)
      .single();

    if (error) {
      if (!shouldIgnoreContentError(error)) {
        console.error('[BlogDB]', error.message);
      }
      return null;
    }

    return data;
  }

  /** 创建记录，成功后自动清除缓存 */
  async function createRecord(table, payload) {
    const client = getClient();
    if (!client) throw new Error('Supabase 未连接');

    const { data, error } = await client
      .from(table)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    clearContentCache();
    return data;
  }

  /** 更新记录，成功后自动清除缓存 */
  async function updateRecord(table, id, payload) {
    const client = getClient();
    if (!client) throw new Error('Supabase 未连接');

    const { data, error } = await client
      .from(table)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    clearContentCache();
    return data;
  }

  /** 删除记录，成功后自动清除缓存 */
  async function deleteRecord(table, id) {
    const client = getClient();
    if (!client) throw new Error('Supabase 未连接');

    const { error } = await client
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;

    clearContentCache();
  }

  // ================================================================
  //  5. 文章 CRUD
  // ================================================================

  /** 获取已发布的文章列表（5 分钟 localStorage 缓存） */
  async function getPublishedArticles() {
    const cacheTime = 5 * 60 * 1000; // 5 分钟缓存
    const cached = readCache('articles_published', cacheTime);
    if (cached) return cached;

    const client = getClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 更新缓存
      writeCache('articles_published', data);

      return data;
    } catch (err) {
      console.error('[BlogDB] 获取文章失败:', err.message);
      // 返回过期缓存
      try {
        const cached = JSON.parse(localStorage.getItem(getCacheKey('articles_published')));
        if (cached) return cached.data;
      } catch (_) { /* ignore */ }
      return null;
    }
  }

  /** 获取所有文章（管理员用，含未发布） */
  async function getAllArticles() {
    const client = getClient();
    if (!client) return [];

    const { data, error } = await client
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error('[BlogDB]', error.message); return []; }
    return data;
  }

  /** 获取单篇文章 */
  async function getArticleBySlug(slug) {
    const client = getClient();
    if (!client) return null;

    const { data, error } = await client
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) { console.error('[BlogDB]', error.message); return null; }
    return data;
  }

  /** 创建文章 */
  async function createArticle(article) {
    const client = getClient();
    if (!client) throw new Error('Supabase 未连接');

    const { data, error } = await client
      .from('articles')
      .insert({
        title: article.title,
        slug: article.slug || article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
        summary: article.summary || '',
        content: article.content || '',
        cover_url: article.cover_url || '',
        category: article.category || '未分类',
        tags: article.tags || [],
        read_time: article.read_time || 3,
        published: article.published !== false,
      })
      .select()
      .single();

    if (error) throw error;

    clearContentCache();
    return data;
  }

  /** 更新文章 */
  async function updateArticle(id, updates) {
    const client = getClient();
    if (!client) throw new Error('Supabase 未连接');

    const { data, error } = await client
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    clearContentCache();
    return data;
  }

  /** 删除文章 */
  async function deleteArticle(id) {
    const client = getClient();
    if (!client) throw new Error('Supabase 未连接');

    const { error } = await client
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    clearContentCache();
  }

  /** 切换发布状态 */
  async function togglePublish(id, published) {
    return updateArticle(id, { published });
  }

  // ================================================================
  //  6. 分类 CRUD
  // ================================================================

  async function getCategories() {
    const cacheTime = 10 * 60 * 1000;
    const cached = readCache('categories', cacheTime);
    if (cached) return cached;

    const data = await listRecords('categories', {
      orderBy: 'article_count',
      ascending: false,
      emptyValue: [],
    });
    writeCache('categories', data);
    return data;
  }

  // ================================================================
  //  7. 项目 CRUD
  // ================================================================

  async function getPublishedProjects() {
    const cacheTime = 5 * 60 * 1000;
    const cached = readCache('projects_published', cacheTime);
    if (cached) return cached;

    const data = await listRecords('projects', {
      filters: [{ column: 'published', operator: 'eq', value: true }],
      orderBy: 'sort_order',
      emptyValue: [],
    });
    writeCache('projects_published', data);
    return data;
  }

  async function getAllProjects() {
    return listRecords('projects', {
      orderBy: 'sort_order',
      emptyValue: [],
    });
  }

  async function createProject(project) {
    return createRecord('projects', {
      title: project.title,
      slug: project.slug || makeSlug(project.title),
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
    return updateRecord('projects', id, updates);
  }

  async function deleteProject(id) {
    return deleteRecord('projects', id);
  }

  // ================================================================
  //  8. 资源导航 CRUD
  // ================================================================

  async function getPublishedResourceGroups() {
    const cacheTime = 5 * 60 * 1000;
    const cached = readCache('resource_groups_published', cacheTime);
    if (cached) return cached;

    const groups = await listRecords('resource_groups', {
      filters: [{ column: 'published', operator: 'eq', value: true }],
      orderBy: 'sort_order',
      emptyValue: [],
    });

    const links = await listRecords('resource_links', {
      filters: [{ column: 'published', operator: 'eq', value: true }],
      orderBy: 'sort_order',
      emptyValue: [],
    });

    const data = groups.map((group) => ({
      ...group,
      links: links.filter((link) => link.group_id === group.id),
    }));

    writeCache('resource_groups_published', data);
    return data;
  }

  async function getAllResourceGroups() {
    return listRecords('resource_groups', {
      orderBy: 'sort_order',
      emptyValue: [],
    });
  }

  async function createResourceGroup(group) {
    return createRecord('resource_groups', {
      name: group.name,
      slug: group.slug || makeSlug(group.name),
      description: group.description || '',
      sort_order: group.sort_order || 0,
      published: group.published !== false,
    });
  }

  async function updateResourceGroup(id, updates) {
    return updateRecord('resource_groups', id, updates);
  }

  async function deleteResourceGroup(id) {
    return deleteRecord('resource_groups', id);
  }

  async function getAllResourceLinks() {
    return listRecords('resource_links', {
      orderBy: 'sort_order',
      emptyValue: [],
    });
  }

  async function createResourceLink(link) {
    return createRecord('resource_links', {
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
    return updateRecord('resource_links', id, updates);
  }

  async function deleteResourceLink(id) {
    return deleteRecord('resource_links', id);
  }

  // ================================================================
  //  9. 学习计划（表格项）CRUD
  // ================================================================

  async function getPublishedScheduleItems() {
    const cacheTime = 5 * 60 * 1000;
    const cached = readCache('schedule_items_published', cacheTime);
    if (cached) return cached;

    const data = await listRecords('schedule_items', {
      filters: [{ column: 'published', operator: 'eq', value: true }],
      orderBy: 'sort_order',
      emptyValue: [],
    });
    writeCache('schedule_items_published', data);
    return data;
  }

  async function getAllScheduleItems() {
    return listRecords('schedule_items', {
      orderBy: 'sort_order',
      emptyValue: [],
    });
  }

  async function createScheduleItem(item) {
    return createRecord('schedule_items', {
      task_name: item.task_name,
      time_range: item.time_range || '',
      goal: item.goal || '',
      status: item.status || '待开始',
      sort_order: item.sort_order || 0,
      published: item.published !== false,
    });
  }

  async function updateScheduleItem(id, updates) {
    return updateRecord('schedule_items', id, updates);
  }

  async function deleteScheduleItem(id) {
    return deleteRecord('schedule_items', id);
  }

  // ================================================================
  //  10. 站点配置 + 导航 + 页面区块 + 简历区块 CRUD
  // ================================================================

  async function getSiteSettings() {
    const cacheTime = 10 * 60 * 1000;
    const cached = readCache('site_settings_map', cacheTime);
    if (cached) return cached;

    const rows = await listRecords('site_settings', {
      orderBy: 'setting_key',
      emptyValue: [],
    });

    const map = rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});
    writeCache('site_settings_map', map);
    return map;
  }

  async function getAllSiteSettings() {
    return listRecords('site_settings', {
      orderBy: 'setting_key',
      emptyValue: [],
    });
  }

  async function upsertSiteSetting(setting) {
    const client = getClient();
    if (!client) throw new Error('Supabase 未连接');

    const { data, error } = await client
      .from('site_settings')
      .upsert({
        setting_key: setting.setting_key,
        label: setting.label || '',
        setting_value: setting.setting_value || {},
      }, { onConflict: 'setting_key' })
      .select()
      .single();

    if (error) throw error;

    clearContentCache();
    return data;
  }

  async function deleteSiteSetting(id) {
    return deleteRecord('site_settings', id);
  }

  async function getNavigationItems() {
    const cacheTime = 10 * 60 * 1000;
    const cached = readCache('navigation_items_visible', cacheTime);
    if (cached) return cached;

    const data = await listRecords('navigation_items', {
      filters: [{ column: 'visible', operator: 'eq', value: true }],
      orderBy: 'sort_order',
      emptyValue: [],
    });
    writeCache('navigation_items_visible', data);
    return data;
  }

  async function getAllNavigationItems() {
    return listRecords('navigation_items', {
      orderBy: 'sort_order',
      emptyValue: [],
    });
  }

  async function createNavigationItem(item) {
    return createRecord('navigation_items', {
      label: item.label,
      href: item.href,
      icon: item.icon || '',
      parent_id: item.parent_id || null,
      sort_order: item.sort_order || 0,
      visible: item.visible !== false,
    });
  }

  async function updateNavigationItem(id, updates) {
    return updateRecord('navigation_items', id, updates);
  }

  async function deleteNavigationItem(id) {
    return deleteRecord('navigation_items', id);
  }

  async function getPageSections(pageKey) {
    var cacheKey = 'page_sections_' + (pageKey || 'all');
    var cacheTime = 10 * 60 * 1000;
    var cached = readCache(cacheKey, cacheTime);
    if (cached) return cached;

    var filters = [];
    if (pageKey) filters.push({ column: 'page_key', operator: 'eq', value: pageKey });
    filters.push({ column: 'published', operator: 'eq', value: true });

    var data = await listRecords('page_sections', {
      filters: filters,
      orderBy: 'sort_order',
      emptyValue: [],
    });
    writeCache(cacheKey, data);
    return data;
  }

  async function getAllPageSections() {
    return listRecords('page_sections', {
      orderBy: 'sort_order',
      emptyValue: [],
    });
  }

  async function createPageSection(section) {
    return createRecord('page_sections', {
      page_key: section.page_key,
      section_key: section.section_key,
      eyebrow: section.eyebrow || '',
      title: section.title || '',
      description: section.description || '',
      content: section.content || {},
      sort_order: section.sort_order || 0,
      published: section.published !== false,
    });
  }

  async function updatePageSection(id, updates) {
    return updateRecord('page_sections', id, updates);
  }

  async function deletePageSection(id) {
    return deleteRecord('page_sections', id);
  }

  async function getProfileBlocks() {
    var cacheTime = 10 * 60 * 1000;
    var cached = readCache('profile_blocks_visible', cacheTime);
    if (cached) return cached;

    var data = await listRecords('profile_blocks', {
      filters: [{ column: 'published', operator: 'eq', value: true }],
      orderBy: 'sort_order',
      emptyValue: [],
    });
    writeCache('profile_blocks_visible', data);
    return data;
  }

  async function getAllProfileBlocks() {
    return listRecords('profile_blocks', {
      orderBy: 'sort_order',
      emptyValue: [],
    });
  }

  async function createProfileBlock(block) {
    return createRecord('profile_blocks', {
      block_key: block.block_key,
      title: block.title,
      subtitle: block.subtitle || '',
      content: block.content || {},
      sort_order: block.sort_order || 0,
      published: block.published !== false,
    });
  }

  async function updateProfileBlock(id, updates) {
    return updateRecord('profile_blocks', id, updates);
  }

  async function deleteProfileBlock(id) {
    return deleteRecord('profile_blocks', id);
  }

  async function getMediaAssets() {
    return listRecords('media_assets', {
      orderBy: 'created_at',
      ascending: false,
      emptyValue: [],
    });
  }

  async function createMediaAsset(asset) {
    return createRecord('media_assets', {
      file_name: asset.file_name,
      file_path: asset.file_path,
      public_url: asset.public_url,
      mime_type: asset.mime_type || '',
      size_bytes: asset.size_bytes || 0,
      usage_type: asset.usage_type || '',
    });
  }

  async function deleteMediaAsset(id) {
    return deleteRecord('media_assets', id);
  }

  // ================================================================
  //  11. 图片上传 / 删除（Supabase Storage）
  // ================================================================

  /** 上传图片到 Storage */
  async function uploadImage(file, folder = 'articles') {
    const client = getClient();
    if (!client) throw new Error('Supabase 未连接');

    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await client
      .storage
      .from('blog-images')
      .upload(fileName, file, {
        cacheControl: '31536000',
        upsert: false,
      });

    if (error) throw error;

    // 获取公开 URL
    const { data: urlData } = client
      .storage
      .from('blog-images')
      .getPublicUrl(fileName);

    try {
      await createMediaAsset({
        file_name: file.name,
        file_path: fileName,
        public_url: urlData.publicUrl,
        mime_type: file.type,
        size_bytes: file.size,
        usage_type: folder,
      });
    } catch (err) {
      console.warn('[BlogDB] 媒体记录写入失败:', err.message);
    }

    return urlData.publicUrl;
  }

  /** 删除图片 */
  async function deleteImage(path) {
    const client = getClient();
    if (!client) throw new Error('Supabase 未连接');

    const { error } = await client
      .storage
      .from('blog-images')
      .remove([path]);

    if (error) throw error;
  }

  // ================================================================
  //  12. 管理员认证（Supabase Auth）
  // ================================================================

  /** 用邮箱 + 密码登录 */
  async function adminLogin(email, password) {
    const client = getClient();
    if (!client) throw new Error('Supabase 未连接');

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /** 退出登录 */
  async function adminLogout() {
    const client = getClient();
    if (!client) return;
    await client.auth.signOut();
  }

  /** 检查是否已登录 */
  async function checkAuth() {
    const client = getClient();
    if (!client) return null;

    const { data } = await client.auth.getSession();
    return data.session;
  }

  // ================================================================
  //  13. 连接诊断
  // ================================================================

  /** 诊断数据库连接状态，结果直接输出到控制台 */
  async function checkConnection() {
    console.group('[BlogDB] 数据库连接诊断');
    console.log('项目地址:', SUPABASE_URL);

    const client = getClient();
    if (!client) {
      console.error('❌ Supabase SDK 未加载，请检查 CDN 是否可访问');
      console.groupEnd();
      return { ok: false, reason: 'SDK 未加载' };
    }
    console.log('✅ Supabase 客户端创建成功');

    // 尝试查询主要表
    const tables = ['articles', 'categories', 'projects', 'resource_groups', 'schedule_items', 'site_settings'];
    const results = {};

    for (const table of tables) {
      try {
        const { data, error } = await client.from(table).select('count', { count: 'exact', head: true });
        if (error) {
          console.warn('⚠️', table, '—', error.message);
          results[table] = { ok: false, error: error.message };
        } else {
          console.log('✅', table, '— 连接正常');
          results[table] = { ok: true };
        }
      } catch (err) {
        console.error('❌', table, '—', err.message);
        results[table] = { ok: false, error: err.message };
      }
    }

    const allOk = Object.values(results).every(r => r.ok);
    if (allOk) {
      console.log('🎉 所有数据库表连接正常！');
    } else {
      console.warn('⚠️ 部分表无法访问，可能表尚未创建或 RLS 策略限制。请在 Supabase Dashboard 中检查。');
    }
    console.groupEnd();
    return { ok: allOk, results };
  }

  // ================================================================
  //  14. 公开 API — 挂载到 window.BlogDB
  // ================================================================
  window.BlogDB = {
    getPublishedArticles,
    getAllArticles,
    getArticleBySlug,
    createArticle,
    updateArticle,
    deleteArticle,
    togglePublish,
    getCategories,
    getPublishedProjects,
    getAllProjects,
    createProject,
    updateProject,
    deleteProject,
    getPublishedResourceGroups,
    getAllResourceGroups,
    createResourceGroup,
    updateResourceGroup,
    deleteResourceGroup,
    getAllResourceLinks,
    createResourceLink,
    updateResourceLink,
    deleteResourceLink,
    getPublishedScheduleItems,
    getAllScheduleItems,
    createScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
    getSiteSettings,
    getAllSiteSettings,
    upsertSiteSetting,
    deleteSiteSetting,
    getNavigationItems,
    getAllNavigationItems,
    createNavigationItem,
    updateNavigationItem,
    deleteNavigationItem,
    getPageSections,
    getAllPageSections,
    createPageSection,
    updatePageSection,
    deletePageSection,
    getProfileBlocks,
    getAllProfileBlocks,
    createProfileBlock,
    updateProfileBlock,
    deleteProfileBlock,
    getMediaAssets,
    createMediaAsset,
    deleteMediaAsset,
    uploadImage,
    deleteImage,
    adminLogin,
    adminLogout,
    checkAuth,
    getClient,
    checkConnection,
  };
})();
