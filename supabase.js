/**
 * 知行成长志 · Supabase 客户端封装
 * 使用方式：在 HTML 中先引入 supabase-js CDN，再引入本文件
 * <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 * <script src="supabase.js"></script>
 */

(function () {
  // ============ 配置（部署前替换为你的 Supabase 项目信息）============
  const SUPABASE_URL = 'https://rgeqokmsbtsqmbtocnij.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_zdAE4Lu3bP2KH7tlJQ5Lcg_3up3vQad';

  // ============ 初始化 ============
  let supabase = null;

  function initSupabase() {
    if (supabase) return supabase;
    if (typeof supabase !== 'undefined' && window.supabase && window.supabase.createClient) {
      // supabase-js CDN 暴露全局 supabase 对象
    }
  }

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

  // ============ 文章 CRUD ============

  /** 获取已发布的文章列表（带缓存） */
  async function getPublishedArticles() {
    const cacheKey = 'blog_articles_cache';
    const cacheTime = 5 * 60 * 1000; // 5 分钟缓存

    // 尝试从缓存读取
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey));
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        return cached.data;
      }
    } catch (_) { /* ignore */ }

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
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));

      return data;
    } catch (err) {
      console.error('[BlogDB] 获取文章失败:', err.message);
      // 返回过期缓存
      try {
        const cached = JSON.parse(localStorage.getItem(cacheKey));
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

    // 清除缓存
    localStorage.removeItem('blog_articles_cache');
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

    localStorage.removeItem('blog_articles_cache');
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

    localStorage.removeItem('blog_articles_cache');
  }

  /** 切换发布状态 */
  async function togglePublish(id, published) {
    return updateArticle(id, { published });
  }

  // ============ 分类 CRUD ============

  async function getCategories() {
    const client = getClient();
    if (!client) return [];

    const { data, error } = await client
      .from('categories')
      .select('*')
      .order('article_count', { ascending: false });

    if (error) { console.error('[BlogDB]', error.message); return []; }
    return data;
  }

  // ============ 图片上传 ============

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

  // ============ 管理员认证（可选，简单密码方案）============

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

  // ============ 暴露 API ============
  window.BlogDB = {
    getPublishedArticles,
    getAllArticles,
    getArticleBySlug,
    createArticle,
    updateArticle,
    deleteArticle,
    togglePublish,
    getCategories,
    uploadImage,
    deleteImage,
    adminLogin,
    adminLogout,
    checkAuth,
    getClient,
  };
})();
