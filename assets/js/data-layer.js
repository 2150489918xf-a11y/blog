/**
 * 数据加载层
 * ===========
 * 职责：从 Supabase 获取数据，提供内存缓存 + localStorage 双重缓存。
 *
 * 数据流：BlogDB API → resolveXxx()（内存缓存）→ 返回给渲染层
 *
 * 依赖：supabase.js（必须先加载，提供 BlogDB）
 * 加载顺序：supabase-core.js → supabase.js → data-layer.js → page-sections.js → ...
 */

// ================================================================
//  0. 模块级缓存 — 避免重复请求 Supabase
// ================================================================
var activeSiteSettings = null;       // 站点设置 { key: value }
var activeNavigationItems = null;    // 导航菜单项
var activeProfileBlocks = null;      // 简历区块
var pageSectionCache = {};           // 页面区块缓存 { pageKey: [...] }

// ================================================================
//  1. 工具函数 — 路径解析 / 设置读取
// ================================================================

/**
 * 解析相对路径为绝对路径
 * 如果页面有 data-root 属性（如 data-root="../.."），会拼接前缀
 * 如果是外部链接（http/mailto/tel），直接返回
 */
function resolvePath(target) {
  if (/^(https?:|mailto:|tel:|data:|#)/i.test(target)) {
    return target;
  }

  var root = document.body.dataset.root;
  if (!root) {
    return target;
  }

  return root + '/' + target;
}

function normalizeSettingValue(value) {
  if (value && typeof value === "object" && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, "value") && Object.keys(value).length === 1) {
    return value.value;
  }
  return value;
}

function getSettingValue(settings, key, fallback) {
  if (!settings || typeof settings[key] === "undefined") {
    return fallback;
  }
  var value = normalizeSettingValue(settings[key]);
  return typeof value === "undefined" ? fallback : value;
}

function deriveNavPageKeyFromHref(href) {
  if (!href) return "";
  if (/articles/i.test(href)) return "articles";
  if (/projects/i.test(href)) return "projects";
  if (/resources/i.test(href)) return "resources";
  if (/contact/i.test(href)) return "contact";
  if (/resume/i.test(href)) return "resume";
  if (/index\.html$/i.test(href) || /(^|\/)$/i.test(href)) return "home";
  return "";
}

function resolveNavIcon(item) {
  if (item.icon) return item.icon;
  var pageKey = deriveNavPageKeyFromHref(item.href);
  var map = {
    home: "fas fa-home",
    articles: "fas fa-book",
    projects: "fas fa-graduation-cap",
    resources: "fas fa-folder-open",
    contact: "fas fa-comments",
    resume: "fas fa-info-circle",
  };
  return map[pageKey] || "fas fa-link";
}

function countValues(values) {
  return values.reduce(function (counts, value) {
    counts.set(value, (counts.get(value) || 0) + 1);
    return counts;
  }, new Map());
}

// ================================================================
//  2. 数据加载 + 内存缓存
// ================================================================

/**
 * 通用数据加载 + 内存缓存辅助函数
 * 模式：检查缓存 → 调用 BlogDB API → map 结果 → 写入缓存 → 返回
 */
async function resolveCached(cacheHolder, cacheKey, apiMethod, mapFn) {
  if (cacheHolder[cacheKey]) return cacheHolder[cacheKey];
  if (typeof BlogDB === "undefined" || typeof BlogDB[apiMethod] !== "function") {
    cacheHolder[cacheKey] = [];
    return cacheHolder[cacheKey];
  }
  try {
    var data = await BlogDB[apiMethod]();
    if (data && data.length > 0) {
      cacheHolder[cacheKey] = mapFn ? data.map(mapFn) : data;
      return cacheHolder[cacheKey];
    }
  } catch (_) { /* 降级到空数据 */ }
  cacheHolder[cacheKey] = [];
  return cacheHolder[cacheKey];
}

var _dataCache = {};

async function loadSiteSettingsFromSupabase() {
  if (typeof BlogDB === "undefined" || !BlogDB.getSiteSettings) {
    return null;
  }
  try {
    var data = await BlogDB.getSiteSettings();
    if (data && Object.keys(data).length > 0) {
      return data;
    }
  } catch (_) { /* 降级到静态内容 */ }
  return null;
}

async function loadPageSectionsFromSupabase(pageKey) {
  if (typeof BlogDB === "undefined" || !BlogDB.getPageSections) {
    return [];
  }
  try {
    var data = await BlogDB.getPageSections(pageKey);
    if (data && data.length > 0) {
      return data;
    }
  } catch (_) { /* 降级 */ }
  return [];
}

async function resolveSiteSettings() {
  if (activeSiteSettings) return activeSiteSettings;
  activeSiteSettings = await loadSiteSettingsFromSupabase();
  return activeSiteSettings;
}

async function resolveNavigationItems() {
  return resolveCached({ activeNavigationItems: activeNavigationItems }, 'activeNavigationItems', 'getNavigationItems');
}

async function resolvePageSections(pageKey) {
  if (Object.prototype.hasOwnProperty.call(pageSectionCache, pageKey)) {
    return pageSectionCache[pageKey];
  }
  pageSectionCache[pageKey] = await loadPageSectionsFromSupabase(pageKey);
  return pageSectionCache[pageKey];
}

async function resolveProfileBlocks() {
  return resolveCached({ activeProfileBlocks: activeProfileBlocks }, 'activeProfileBlocks', 'getProfileBlocks');
}

// ================================================================
//  3. 数据映射函数 — Supabase 原始数据 → 前端渲染格式
// ================================================================

function mapSupabaseArticle(article, index) {
  var date = article.created_at
    ? new Date(article.created_at).toISOString().slice(0, 10)
    : "2026-04-27";
  return {
    title: article.title,
    category: article.category || "未分类",
    date: date,
    summary: article.summary || "",
    path: article.slug
      ? "pages/articles/" + article.slug + ".html"
      : "pages/articles/index.html",
    readTime: "阅读 " + (article.read_time || 5) + " 分钟",
    tags: article.tags || [],
    cover: article.cover_url || "",
    id: article.id,
  };
}

function mapSupabaseProject(project) {
  var date = project.created_at
    ? new Date(project.created_at).toISOString().slice(0, 10)
    : "2026-04-27";
  return {
    title: project.title,
    category: "项目实战",
    date: date,
    summary: project.summary || project.description || "",
    path: project.slug
      ? "pages/projects/detail.html?slug=" + project.slug
      : "pages/projects/index.html",
    readTime: project.status || "进行中",
    tags: project.tech_tags || [],
    cover: project.cover_url || "",
    id: project.id,
  };
}

function mapSupabaseResourceGroup(group) {
  return {
    kicker: group.name,
    title: group.description || group.name,
    links: (group.links || []).map(function (link) {
      return {
        title: link.title,
        desc: link.description || "",
        href: link.href,
        label: link.label || "资源链接",
      };
    }),
  };
}

function mapSupabaseScheduleItem(item) {
  return {
    task: item.task_name,
    time: item.time_range || "",
    goal: item.goal || "",
    status: item.status || "待开始",
  };
}

// ================================================================
//  4. 数据 resolve 入口 — 供渲染层调用
// ================================================================

async function resolveArticleCatalog() {
  return resolveCached(_dataCache, 'articles', 'getPublishedArticles', mapSupabaseArticle);
}

async function resolveProjectCatalog() {
  return resolveCached(_dataCache, 'projects', 'getPublishedProjects', mapSupabaseProject);
}

async function resolveResourceGroups() {
  return resolveCached(_dataCache, 'resourceGroups', 'getPublishedResourceGroups', mapSupabaseResourceGroup);
}

async function resolveScheduleRows() {
  return resolveCached(_dataCache, 'schedule', 'getPublishedScheduleItems', mapSupabaseScheduleItem);
}
