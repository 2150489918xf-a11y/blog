/**
 * BlogDB Core — Supabase 客户端核心层
 * ================================
 * 职责：Supabase 连接初始化、认证、通用 CRUD、缓存工具。
 *
 * 本文件被 supabase.js（业务 API 层）依赖，必须先加载。
 * 加载顺序：Supabase SDK CDN → supabase-core.js → supabase.js
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
      if (!window.supabase) {
        console.warn('[BlogDB] Supabase SDK 未加载，请检查 CDN 是否可访问');
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

  /**
   * 通用缓存查询 — 先查缓存，未命中则查数据库并写入缓存
   * @param {string} table     - 表名
   * @param {string} cacheKey  - 缓存键名
   * @param {number} cacheTime - 缓存有效期（毫秒）
   * @param {object} options   - 传给 listRecords 的查询选项
   */
  async function getCached(table, cacheKey, cacheTime, options) {
    var cached = readCache(cacheKey, cacheTime);
    if (cached) return cached;
    var data = await listRecords(table, options);
    writeCache(cacheKey, data);
    return data;
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
  //  5. 图片上传 / 删除（Supabase Storage）
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
  //  6. 管理员认证（Supabase Auth）
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
  //  7. 连接诊断
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
  //  8. 导出核心 API — 供 supabase.js 业务层调用
  // ================================================================
  window.BlogDBCore = {
    getClient,
    getRawClient: getClient, // alias for compatibility
    makeSlug,
    readCache,
    writeCache,
    getCached,
    clearContentCache,
    shouldIgnoreContentError,
    listRecords,
    getRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    uploadImage,
    deleteImage,
    adminLogin,
    adminLogout,
    checkAuth,
    checkConnection,
  };
})();
