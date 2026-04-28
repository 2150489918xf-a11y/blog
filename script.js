const LOCAL_STORAGE_KEY = 'butterfly_custom_articles';
let activeSiteSettings = null;
let activeNavigationItems = null;
let activeProfileBlocks = null;
const pageSectionCache = {};

// 图片压缩工具：将图片文件压缩为 base64 JPEG
function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const base64 = canvas.toDataURL('image/jpeg', quality);
        const sizeKB = Math.round(base64.length * 3 / 4 / 1024);
        resolve({ base64, sizeKB, width: w, height: h });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 获取 localStorage 使用量
function getStorageUsage() {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2; // UTF-16 每字符 2 字节
    }
  }
  return { usedMB: (total / 1024 / 1024).toFixed(2), maxMB: 5 };
}

// 原始静态数据
const staticArticleCatalog = [
  {
    title: "从单页主页到课程设计完整站点",
    category: "课程设计",
    date: "2026-04-27",
    summary: "记录如何把原本的单页个人主页改造成 12 页课程设计站点，包括页面拆分、统一导航和共享样式设计。",
    path: "pages/articles/build-portfolio.html",
    readTime: "阅读 8 分钟",
    tags: ["课程设计", "静态站点", "作品集"],
  },
  {
    title: "前端学习路线与项目推进方法",
    category: "学习路线",
    date: "2026-04-24",
    summary: "从 HTML、CSS、JavaScript 到组件化思维，梳理一条适合课堂项目和自学并行推进的学习路线。",
    path: "pages/articles/frontend-roadmap.html",
    readTime: "阅读 10 分钟",
    tags: ["HTML", "CSS", "JavaScript"],
  },
  {
    title: "智能体的设计范式",
    category: "AI 研究",
    date: "2026-04-21",
    summary: "探讨从单步提示到自主智能体架构的演进，分析 ReAct、AutoGPT 等设计模式在实际项目中的落地。",
    path: "pages/articles/agent-paradigm.html",
    readTime: "阅读 12 分钟",
    tags: ["AI Agent", "设计模式", "大模型"],
  },
  {
    title: "仿 Cactus 博客布局的两栏实现",
    category: "布局实验",
    date: "2026-04-18",
    summary: "用主内容流加右侧固定信息栏的方式，还原博客阅读时左侧滚动、右侧目录保持可见的体验。",
    path: "pages/articles/index.html",
    readTime: "阅读 7 分钟",
    tags: ["CSS Grid", "Sticky", "响应式"],
  },
  
  {
    title: "学习计划表格页的可读性优化",
    category: "数据展示",
    date: "2026-04-12",
    summary: "用状态标签、行间距和响应式容器，让学习计划表既满足课程要求，也方便在窄屏设备阅读。",
    path: "pages/data/schedule.html",
    readTime: "阅读 4 分钟",
    tags: ["表格", "可读性", "课程安排"],
  },
  {
    title: "资源导航页如何组织外部链接",
    category: "资源整理",
    date: "2026-04-09",
    summary: "把 MDN、教程、兼容性工具和项目参考按学习场景归类，让资源页不只是链接堆砌。",
    path: "pages/resources/links.html",
    readTime: "阅读 4 分钟",
    tags: ["资源导航", "MDN", "工具"],
  },
  {
    title: "项目展示卡片的内容层级",
    category: "项目展示",
    date: "2026-04-06",
    summary: "为每个项目卡片安排标题、状态、技术栈和一句话总结，突出作品集页面的信息密度。",
    path: "pages/projects/index.html",
    readTime: "阅读 6 分钟",
    tags: ["项目", "卡片", "信息架构"],
  },
  {
    title: "JavaSE 核心特性深度解析",
    category: "后端开发",
    date: "2026-04-28",
    summary: "从集合框架底层原理到多线程并发控制，系统性梳理 JavaSE 在大型项目开发中的核心技术要点。",
    path: "pages/articles/javase-core.html",
    readTime: "阅读 15 分钟",
    tags: ["Java", "并发编程", "JVM"],
  },
  {
    title: "LangChain 实战：构建 LLM 应用",
    category: "AI 开发",
    date: "2026-04-28",
    summary: "解析 LangChain 的六大核心模块，展示如何通过 Chain 和 Memory 快速搭建具有上下文感知能力的 AI 应用。",
    path: "pages/articles/langchain-action.html",
    readTime: "阅读 10 分钟",
    tags: ["LangChain", "LLM", "Python"],
  },
  {
    title: "LangGraph：控制智能体的循环逻辑",
    category: "AI 研究",
    date: "2026-04-28",
    summary: "探讨如何利用 LangGraph 的状态图结构解决 LangChain 在复杂决策流中的局限性，实现高度可控的循环对话。",
    path: "pages/articles/langgraph-flow.html",
    readTime: "阅读 12 分钟",
    tags: ["LangGraph", "智能体", "状态机"],
  },
  {
    title: "RAG 架构进阶与向量数据库实践",
    category: "AI 研究",
    date: "2026-04-28",
    summary: "深入讨论检索增强生成（RAG）的优化路径，包括 Query Transformation、Rerank 机制及向量数据库的选型对比。",
    path: "pages/articles/rag-advanced.html",
    readTime: "阅读 18 分钟",
    tags: ["RAG", "向量数据库", "信息检索"],
  },
];

// 合并本地存储和静态数据
function loadAllArticles() {
  const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  const processedStatic = staticArticleCatalog.map(a => ({ ...a, id: a.id || a.path }));
  
  // 排除掉 ID 冲突的静态项（如果本地修改了静态项）
  const localIds = new Set(localData.map(a => a.id));
  const filteredStatic = processedStatic.filter(a => !localIds.has(a.id));
  
  return [...localData, ...filteredStatic];
}

// 供全局使用的动态目录
let articleCatalog = loadAllArticles();

// 管理功能 API
window.blogAdmin = {
  save: (article) => {
    const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    if (article.id) {
      const index = localData.findIndex(a => a.id === article.id);
      if (index > -1) {
        localData[index] = article; // 更新已有的本地项
      } else {
        // 如果修改的是内置文章，则作为新项存入本地（ID保持一致以覆盖）
        localData.unshift(article); 
      }
    } else {
      localData.unshift({ ...article, id: 'art_' + Date.now() }); // 完全新增
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));
  },
  delete: (id) => {
    let localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const isLocal = localData.some(a => a.id === id);
    if (isLocal) {
      localData = localData.filter(a => a.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));
    } else {
      // 这里的逻辑可以根据需求调整：内置文章暂不支持从代码中物理删除，只能在内存中过滤
      alert('内置文章删除仅在本次导出前有效，若要彻底删除请修改 script.js');
    }
  },
  getRawCode: () => {
    // 导出用于覆盖 articleCatalog 的代码（排除 base64 封面图以减小体积）
    const articles = loadAllArticles().map(a => {
      const copy = { ...a };
      delete copy.cover; // 导出时去掉 base64 封面
      return copy;
    });
    return JSON.stringify(articles, null, 2);
  },
  getStorageUsage,
  clearLocal: () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
};

const projectCatalog = [
  {
    title: "个人作品集学习博客",
    category: "课程设计",
    date: "2026-04-27",
    summary: "以个人主页为视觉起点，扩展出文章、项目、表单和资源导航的完整多页站点，是本次课程设计的主项目。",
    path: "pages/projects/index.html",
    readTime: "进行中",
    tags: ["HTML", "CSS", "JavaScript"],
  },
  {
    title: "JavaScript 交互组件集",
    category: "前端练习",
    date: "2026-04-20",
    summary: "收纳轮播、表单校验、筛选、返回顶部等基础交互逻辑，为课程设计提供可复用的组件。",
    path: "pages/projects/index.html",
    readTime: "持续积累",
    tags: ["DOM", "事件", "本地存储"],
  },
  {
    title: "AI 智能体对话原型",
    category: "AI 探索",
    date: "2026-04-15",
    summary: "基于 Claude API 和 LangChain 构建的简单对话式智能体，实现多轮对话和上下文记忆功能。",
    path: "pages/projects/index.html",
    readTime: "实验阶段",
    tags: ["Claude API", "LangChain", "Prompt"],
  },
  {
    title: "校园活动记录卡片页",
    category: "内容展示",
    date: "2026-04-10",
    summary: "用于展示社团活动、技术分享、课堂项目等校园生活内容，强化站点的内容厚度。",
    path: "pages/projects/index.html",
    readTime: "内容补充",
    tags: ["语义化 HTML", "响应式布局"],
  },
  {
    title: "学习计划与进度表",
    category: "数据展示",
    date: "2026-04-06",
    summary: "通过表格可视化学习任务、课程安排和技能掌握度，展示信息组织与样式控制能力。",
    path: "pages/data/schedule.html",
    readTime: "已完成",
    tags: ["表格设计", "状态标签"],
  },
  {
    title: "Prompt Engineering 笔记",
    category: "AI 探索",
    date: "2026-03-28",
    summary: "整理提示词工程的核心技巧，包括角色设定、Few-shot、Chain-of-Thought 等常用模式。",
    path: "pages/projects/index.html",
    readTime: "持续更新",
    tags: ["Prompt", "AI", "技巧整理"],
  },
];

const friendLinkCatalog = [
  {
    title: "MDN Web Docs",
    desc: "查 HTML、CSS、JavaScript 语法和规范时最稳定的技术参考。",
    href: "https://developer.mozilla.org/zh-CN/",
    label: "语法文档",
  },
  {
    title: "菜鸟教程前端专栏",
    desc: "快速复盘基础概念时很好用，适合课堂知识点回看。",
    href: "https://www.runoob.com/",
    label: "入门复习",
  },
  {
    title: "Can I use",
    desc: "查看浏览器兼容性时的实用工具，方便说明兼容性考虑。",
    href: "https://caniuse.com/",
    label: "兼容性",
  },
  {
    title: "GitHub Explore",
    desc: "观察项目展示方式和 README 结构时可以借鉴的参考来源。",
    href: "https://github.com/explore",
    label: "项目参考",
  },
];

const resourceGroupCatalog = [
  {
    kicker: "语法文档",
    title: "写代码时最常翻的参考站",
    links: [
      {
        title: "MDN Web Docs",
        desc: "Mozilla 维护的前端技术文档，语法说明和示例都很完整，遇到 API 不确定时第一个查的地方。",
        href: "https://developer.mozilla.org/zh-CN/",
        label: "HTML / CSS / JS",
      },
      {
        title: "Can I use",
        desc: "输入 CSS 属性或 JS API 就能看到各浏览器的支持情况，答辩时解释兼容性考虑很好用。",
        href: "https://caniuse.com/",
        label: "兼容性",
      },
      {
        title: "W3School 中文",
        desc: "每个标签和属性都有在线编辑器可以直接试，适合快速确认某个写法的效果。",
        href: "https://www.w3school.com.cn/",
        label: "快速查阅",
      },
    ],
  },
  {
    kicker: "学习平台",
    title: "课堂外的补充学习资源",
    links: [
      {
        title: "菜鸟教程",
        desc: "适合快速回顾基础知识点，每个章节都有简洁的代码示例和在线运行环境。",
        href: "https://www.runoob.com/",
        label: "基础复盘",
      },
      {
        title: "哔哩哔哩",
        desc: "前端学习视频最集中的平台，从零基础入门到框架实战都能找到对应课程。",
        href: "https://www.bilibili.com/",
        label: "视频教程",
      },
      {
        title: "稀土掘金",
        desc: "国内前端开发者活跃度最高的社区之一，实战经验和最新技术动态都能看到。",
        href: "https://juejin.cn/",
        label: "技术社区",
      },
    ],
  },
  {
    kicker: "开发工具",
    title: "日常开发中离不开的工具",
    links: [
      {
        title: "GitHub",
        desc: "全球最大的代码托管平台，可以观察优秀项目如何组织代码结构和文档。",
        href: "https://github.com/explore",
        label: "代码托管",
      },
      {
        title: "VS Code",
        desc: "微软出品的轻量级代码编辑器，插件生态丰富，前端开发的主力工具。",
        href: "https://code.visualstudio.com/",
        label: "编辑器",
      },
      {
        title: "CodePen",
        desc: "在线编写 HTML/CSS/JS 并实时预览效果，非常适合快速验证某个想法或调试样式。",
        href: "https://codepen.io/",
        label: "在线编码",
      },
    ],
  },
  {
    kicker: "设计灵感",
    title: "页面设计时的参考来源",
    links: [
      {
        title: "Dribbble",
        desc: "设计师社区，配色方案、卡片布局、页面风格都能在这里找到灵感。",
        href: "https://dribbble.com/",
        label: "UI 设计",
      },
      {
        title: "Color Hunt",
        desc: "按风格分类的配色卡合集，选颜色时不用自己从零调配，直接挑选组合即可。",
        href: "https://colorhunt.co/",
        label: "配色方案",
      },
    ],
  },
];

const scheduleRows = [
  { task: "首页轮播与导航联调", time: "周一 9:00-11:00", goal: "完成首页核心交互", status: "已完成" },
  { task: "文章列表与详情编排", time: "周二 14:00-16:00", goal: "打通文章浏览路径", status: "进行中" },
  { task: "表单验证与留言页面", time: "周三 10:00-12:00", goal: "完成设置页和留言演示", status: "待开始" },
  { task: "表格页与链接页完善", time: "周四 15:00-17:00", goal: "补齐指定页面类型", status: "已完成" },
];

const defaultMessages = [
  {
    title: "系统提示",
    summary: "这里会展示从设置页和留言页提交过来的表单摘要。",
    time: "首次进入",
  },
];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function resolvePath(target) {
  if (/^(https?:|mailto:|tel:|data:|#)/i.test(target)) {
    return target;
  }

  const root = document.body.dataset.root;
  if (!root) {
    return target;
  }

  return `${root}/${target}`;
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
  const value = normalizeSettingValue(settings[key]);
  return typeof value === "undefined" ? fallback : value;
}

async function loadSiteSettingsFromSupabase() {
  if (typeof BlogDB === "undefined" || !BlogDB.getSiteSettings) {
    return null;
  }

  try {
    const data = await BlogDB.getSiteSettings();
    if (data && Object.keys(data).length > 0) {
      return data;
    }
  } catch (_) {
    // 降级到静态内容
  }

  return null;
}

async function resolveSiteSettings() {
  if (activeSiteSettings) {
    return activeSiteSettings;
  }
  activeSiteSettings = await loadSiteSettingsFromSupabase();
  return activeSiteSettings;
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
  const pageKey = deriveNavPageKeyFromHref(item.href);
  const map = {
    home: "fas fa-home",
    articles: "fas fa-book",
    projects: "fas fa-graduation-cap",
    resources: "fas fa-folder-open",
    contact: "fas fa-comments",
    resume: "fas fa-info-circle",
  };
  return map[pageKey] || "fas fa-link";
}

async function loadNavigationItemsFromSupabase() {
  if (typeof BlogDB === "undefined" || !BlogDB.getNavigationItems) {
    return null;
  }

  try {
    const data = await BlogDB.getNavigationItems();
    if (data && data.length > 0) {
      return data;
    }
  } catch (_) {
    // 降级到静态内容
  }

  return null;
}

async function resolveNavigationItems() {
  if (activeNavigationItems) {
    return activeNavigationItems;
  }
  activeNavigationItems = await loadNavigationItemsFromSupabase();
  return activeNavigationItems;
}

async function loadPageSectionsFromSupabase(pageKey) {
  if (typeof BlogDB === "undefined" || !BlogDB.getPageSections) {
    return null;
  }

  try {
    const data = await BlogDB.getPageSections(pageKey);
    if (data && data.length > 0) {
      return data;
    }
  } catch (_) {
    // 降级到静态内容
  }

  return null;
}

async function resolvePageSections(pageKey) {
  if (Object.prototype.hasOwnProperty.call(pageSectionCache, pageKey)) {
    return pageSectionCache[pageKey];
  }
  pageSectionCache[pageKey] = await loadPageSectionsFromSupabase(pageKey);
  return pageSectionCache[pageKey];
}

async function loadProfileBlocksFromSupabase() {
  if (typeof BlogDB === "undefined" || !BlogDB.getProfileBlocks) {
    return null;
  }

  try {
    const data = await BlogDB.getProfileBlocks();
    if (data && data.length > 0) {
      return data;
    }
  } catch (_) {
    // 降级到静态内容
  }

  return null;
}

async function resolveProfileBlocks() {
  if (activeProfileBlocks) {
    return activeProfileBlocks;
  }
  activeProfileBlocks = await loadProfileBlocksFromSupabase();
  return activeProfileBlocks;
}

function applySiteSettings(settings) {
  if (!settings) {
    return;
  }

  const brandName = getSettingValue(settings, "brand_name", null);
  const brandSubtitle = getSettingValue(settings, "brand_subtitle", null);
  const brandMark = getSettingValue(settings, "brand_mark", null);

  if (brandMark) {
    document.querySelectorAll(".brand-mark").forEach((node) => {
      node.textContent = brandMark;
    });
  }

  if (brandName) {
    document.querySelectorAll(".brand-copy strong").forEach((node) => {
      node.textContent = brandName;
    });
  }

  if (brandSubtitle) {
    document.querySelectorAll(".brand-copy small").forEach((node) => {
      node.textContent = brandSubtitle;
    });
  }

  if (document.body.dataset.page === "home") {
    const authorName = getSettingValue(settings, "author_name", null);
    const authorBio = getSettingValue(settings, "author_bio", null);
    const authorAvatar = getSettingValue(settings, "author_avatar", null);
    const socialLinks = getSettingValue(settings, "author_social_links", null);

    if (authorName && document.getElementById("homeAuthorName")) {
      document.getElementById("homeAuthorName").textContent = authorName;
    }
    if (authorBio && document.getElementById("homeAuthorBio")) {
      document.getElementById("homeAuthorBio").textContent = authorBio;
    }
    if (authorAvatar && document.getElementById("homeAuthorAvatar")) {
      document.getElementById("homeAuthorAvatar").src = resolvePath(authorAvatar);
    }
    if (Array.isArray(socialLinks) && document.getElementById("homeAuthorSocials")) {
      document.getElementById("homeAuthorSocials").innerHTML = socialLinks.map((item) => `
        <a href="${item.href}" ${item.external === false ? "" : 'target="_blank"'} style="background: ${item.color || '#49b1f5'};" aria-label="${item.label || item.title || 'social'}">
          <i class="${item.icon || 'fas fa-link'}" aria-hidden="true"></i>
        </a>
      `).join("");
    }
  }

  if (document.body.dataset.page === "resume") {
    const profileName = getSettingValue(settings, "author_name", null);
    const profileMeta = getSettingValue(settings, "resume_meta", null);
    const profileSummary = getSettingValue(settings, "resume_summary", null);
    const profileAvatarText = getSettingValue(settings, "resume_avatar_text", null);

    if (profileName && document.getElementById("resumeProfileName")) {
      document.getElementById("resumeProfileName").textContent = profileName;
    }
    if (profileMeta && document.getElementById("resumeProfileMeta")) {
      document.getElementById("resumeProfileMeta").textContent = profileMeta;
    }
    if (profileSummary && document.getElementById("resumeProfileSummary")) {
      document.getElementById("resumeProfileSummary").textContent = profileSummary;
    }
    if (profileAvatarText && document.getElementById("resumeProfileAvatar")) {
      document.getElementById("resumeProfileAvatar").textContent = profileAvatarText;
    }
  }
}

function renderNavigationMenus(items) {
  if (!items || !items.length) {
    return;
  }

  const topLevel = items.filter((item) => !item.parent_id && item.visible !== false);
  if (!topLevel.length) {
    return;
  }

  const html = topLevel.map((item) => {
    const pageKey = deriveNavPageKeyFromHref(item.href);
    const href = resolvePath(String(item.href || "").replace(/^(\.\.\/|\.\/)+/, ""));
    return `
      <li>
        <a class="menu-link" href="${href}" data-nav-page="${pageKey}">
          <i class="${resolveNavIcon(item)}"></i> ${item.label}
        </a>
      </li>
    `;
  }).join("");

  document.querySelectorAll(".site-nav .menu-list").forEach((list) => {
    list.innerHTML = html;
  });
}

function buildHomeNoteCard(card, index) {
  const tones = ["note-card-mint", "note-card-lemon", "note-card-ice", "note-card-rose"];
  const tone = card.tone || tones[index % tones.length];
  return `
    <article class="note-card ${tone}">
      <span class="note-tag">${card.tag || card.kicker || "内容卡片"}</span>
      <h3>${card.title || "未命名区块"}</h3>
      <p>${card.description || ""}</p>
    </article>
  `;
}

function buildHomeCarouselSlide(slide, index) {
  const tones = ["visual-red", "visual-blue", "visual-green"];
  const visualClass = slide.visualClass || tones[index % tones.length];
  const meta = [];

  if (slide.chip) meta.push(`<span class="chip">${slide.chip}</span>`);
  if (slide.date) meta.push(`<span>${slide.date}</span>`);
  if (slide.readTime) meta.push(`<span>${slide.readTime}</span>`);

  const visualHtml = slide.imageUrl
    ? `<div class="carousel-visual ${visualClass}" aria-hidden="true"><img src="${resolvePath(slide.imageUrl)}" alt="${slide.visualAlt || slide.title || "轮播配图"}"></div>`
    : `
      <div class="carousel-visual ${visualClass}" aria-hidden="true">
        <div class="carousel-visual-copy">
          <span class="chip">${slide.visualLabel || slide.chip || "精选内容"}</span>
          <strong>${slide.visualTitle || slide.title || "轮播内容"}</strong>
          <p>${slide.visualSummary || slide.summary || ""}</p>
        </div>
      </div>
    `;

  return `
    <article class="carousel-slide ${index === 0 ? "is-active" : ""}" data-slide>
      ${visualHtml}
      <div class="carousel-content">
        <div class="carousel-meta-row">${meta.join("")}</div>
        <h2>${slide.title || "未命名轮播"}</h2>
        <p>${slide.summary || ""}</p>
      </div>
    </article>
  `;
}

function renderHomeCarouselSection(section) {
  if (section.eyebrow && document.getElementById("homeFeatureKicker")) {
    document.getElementById("homeFeatureKicker").textContent = section.eyebrow;
  }
  if (section.title && document.getElementById("homeFeatureTitle")) {
    document.getElementById("homeFeatureTitle").textContent = section.title;
  }

  const content = section.content || {};
  const slides = Array.isArray(content.slides) ? content.slides : [];
  const track = document.getElementById("heroCarouselTrack");
  const dots = document.getElementById("heroCarouselDots");

  if (!track || !dots || !slides.length) {
    return;
  }

  track.innerHTML = slides.map(buildHomeCarouselSlide).join("");
  dots.innerHTML = slides.map(function (_slide, index) {
    return `<button class="dot ${index === 0 ? "is-active" : ""}" type="button" data-carousel-dot="${index}" aria-label="第 ${index + 1} 张"></button>`;
  }).join("");
}

function renderHomeFeedSection(section) {
  if (section.eyebrow && document.getElementById("homeFeedKicker")) {
    document.getElementById("homeFeedKicker").textContent = section.eyebrow;
  }
  if (section.title && document.getElementById("homeFeedTitle")) {
    document.getElementById("homeFeedTitle").textContent = section.title;
  }

  const link = document.getElementById("homeFeedLink");
  if (link && section.description) {
    link.textContent = section.description;
  }

  if (link && section.content && section.content.href) {
    link.href = resolvePath(String(section.content.href).replace(/^(\.\.\/|\.\/)+/, ""));
  }

  if (section.content && section.content.label && link) {
    link.textContent = section.content.label;
  }
}

function renderHomeAuthorStatsSection(section) {
  const statsContainer = document.getElementById("homeAuthorStats");
  const stats = section.content && Array.isArray(section.content.stats) ? section.content.stats : [];

  if (!statsContainer || !stats.length) {
    return;
  }

  statsContainer.innerHTML = stats.map(function (item) {
    return `<div><span>${item.label || item.key || "统计"}</span><strong data-stat-key="${item.key || "articleCount"}">0</strong></div>`;
  }).join("");
}

async function applyHomePageSections() {
  if (document.body.dataset.page !== "home") {
    return;
  }

  const sections = await resolvePageSections("home");
  if (!sections || sections.length === 0) {
    return;
  }

  sections.forEach((section) => {
    if (section.section_key === "note_board") {
      if (section.eyebrow && document.getElementById("homeRecentKicker")) {
        document.getElementById("homeRecentKicker").textContent = section.eyebrow;
      }
      if (section.title && document.getElementById("homeRecentTitle")) {
        document.getElementById("homeRecentTitle").textContent = section.title;
      }
      if (section.description && document.getElementById("homeRecentLink")) {
        document.getElementById("homeRecentLink").textContent = section.description;
      }
      if (section.content && Array.isArray(section.content.cards) && document.getElementById("homeNoteGrid")) {
        document.getElementById("homeNoteGrid").innerHTML = section.content.cards.map(buildHomeNoteCard).join("");
      }
      return;
    }

    if (section.section_key === "hero_carousel" || section.section_key === "carousel") {
      renderHomeCarouselSection(section);
      return;
    }

    if (section.section_key === "article_feed" || section.section_key === "latest_articles") {
      renderHomeFeedSection(section);
      return;
    }

    if (section.section_key === "author_card" || section.section_key === "home_author_card") {
      renderHomeAuthorStatsSection(section);
    }
  });
}

function applyHeroSection(ids, section) {
  if (section.eyebrow && ids.kicker && document.getElementById(ids.kicker)) {
    document.getElementById(ids.kicker).textContent = section.eyebrow;
  }
  if (section.title && ids.title && document.getElementById(ids.title)) {
    document.getElementById(ids.title).textContent = section.title;
  }
  if (section.description && ids.summary && document.getElementById(ids.summary)) {
    document.getElementById(ids.summary).textContent = section.description;
  }
}

function setElementText(id, value) {
  const node = document.getElementById(id);
  if (node && value) {
    node.textContent = value;
  }
}

function renderChecklistItems(items) {
  return items.map(function (item) {
    if (typeof item === "string") {
      return `<li>${item}</li>`;
    }

    const label = item.text || item.label || item.title || item.value || item.href || "";
    if (item.href) {
      const href = resolvePath(String(item.href).replace(/^(\.\.\/|\.\/)+/, ""));
      return `<li><a href="${href}" ${item.external === false ? "" : 'target="_blank"'}>${label}</a></li>`;
    }

    return `<li>${label}</li>`;
  }).join("");
}

function renderContentLayout(content) {
  const layout = content && content.layout ? content.layout : "prose";

  if ((layout === "check-list" || layout === "list") && Array.isArray(content.items)) {
    return `<ul class="check-list">${renderChecklistItems(content.items)}</ul>`;
  }

  if ((layout === "badge-grid" || layout === "badges") && Array.isArray(content.items)) {
    return renderProfileBadgeGrid(content.items);
  }

  if ((layout === "summary-grid" || layout === "summary") && Array.isArray(content.items)) {
    return renderProfileSummaryGrid(content.items);
  }

  if (layout === "timeline" && Array.isArray(content.items)) {
    return renderProfileTimeline(content.items);
  }

  if (Array.isArray(content.paragraphs)) {
    return renderProfileProse(content.paragraphs);
  }

  if (typeof content === "string") {
    return renderProfileProse([content]);
  }

  return renderProfileProse([JSON.stringify(content || {}, null, 2)]);
}

function applySectionContent(containerId, content) {
  const container = document.getElementById(containerId);
  if (!container || !content) {
    return;
  }

  container.innerHTML = renderContentLayout(content);
}

async function applyResourcesPageSections() {
  if (document.body.dataset.page !== "resources") {
    return;
  }

  const sections = await resolvePageSections("resources");
  if (!sections || sections.length === 0) {
    return;
  }

  sections.forEach((section) => {
    if (section.section_key === "hero" || section.section_key === "page_hero") {
      applyHeroSection({
        kicker: "resourcesHeroKicker",
        title: "resourcesHeroTitle",
        summary: "resourcesHeroSummary",
      }, section);
      return;
    }

    if (section.section_key === "jump_list_card") {
      setElementText("resourceJumpKicker", section.eyebrow);
      setElementText("resourceJumpTitle", section.title);
      return;
    }

    if (section.section_key === "usage_tips_card") {
      setElementText("resourceGuideKicker", section.eyebrow);
      setElementText("resourceGuideTitle", section.title);
      applySectionContent("resourceGuideBody", section.content || { layout: "prose", paragraphs: [section.description || ""] });
    }
  });
}

async function applyContactPageSections() {
  if (document.body.dataset.page !== "contact") {
    return;
  }

  const sections = await resolvePageSections("contact");
  if (!sections || sections.length === 0) {
    return;
  }

  sections.forEach((section) => {
    if (section.section_key === "hero" || section.section_key === "page_hero") {
      applyHeroSection({
        kicker: "contactHeroKicker",
        title: "contactHeroTitle",
        summary: "contactHeroSummary",
      }, section);
      return;
    }

    if (section.section_key === "message_list_card") {
      setElementText("contactMessageKicker", section.eyebrow);
      setElementText("contactMessageTitle", section.title);
      setElementText("contactMessageIntro", section.description);
      return;
    }

    if (section.section_key === "message_form_card") {
      setElementText("contactFormKicker", section.eyebrow);
      setElementText("contactFormTitle", section.title);
      if (section.content && section.content.submitText && document.getElementById("contactSubmitButton")) {
        document.getElementById("contactSubmitButton").textContent = section.content.submitText;
      }
      return;
    }

    if (section.section_key === "contact_info_card") {
      setElementText("contactInfoKicker", section.eyebrow);
      setElementText("contactInfoTitle", section.title);
      applySectionContent("contactInfoBody", section.content || { layout: "check-list", items: [section.description || ""] });
      return;
    }

    if (section.section_key === "page_note_card") {
      setElementText("contactNoteKicker", section.eyebrow);
      setElementText("contactNoteTitle", section.title);
      applySectionContent("contactNoteBody", section.content || { layout: "prose", paragraphs: [section.description || ""] });
    }
  });
}

async function applySettingsPageSections() {
  if (document.body.dataset.page !== "settings") {
    return;
  }

  const sections = await resolvePageSections("settings");
  if (!sections || sections.length === 0) {
    return;
  }

  sections.forEach((section) => {
    if (section.section_key === "hero" || section.section_key === "page_hero") {
      applyHeroSection({
        kicker: "settingsHeroKicker",
        title: "settingsHeroTitle",
        summary: "settingsHeroSummary",
      }, section);
      return;
    }

    if (section.section_key === "settings_form_card") {
      setElementText("settingsFormKicker", section.eyebrow);
      setElementText("settingsFormTitle", section.title);

      const summary = document.getElementById("settingsFormSummary");
      if (summary) {
        if (section.description) {
          summary.hidden = false;
          summary.textContent = section.description;
        } else {
          summary.hidden = true;
        }
      }

      if (section.content && section.content.submitText && document.getElementById("settingsSubmitButton")) {
        document.getElementById("settingsSubmitButton").textContent = section.content.submitText;
      }
      if (section.content && section.content.resetText && document.getElementById("settingsResetButton")) {
        document.getElementById("settingsResetButton").textContent = section.content.resetText;
      }
      return;
    }

    if (section.section_key === "validation_card") {
      setElementText("settingsValidationKicker", section.eyebrow);
      setElementText("settingsValidationTitle", section.title);
      applySectionContent("settingsValidationBody", section.content || { layout: "check-list", items: [section.description || ""] });
    }
  });
}

async function applyResumePageSections() {
  if (document.body.dataset.page !== "resume") {
    return;
  }

  const sections = await resolvePageSections("resume");
  if (!sections || sections.length === 0) {
    return;
  }

  sections.forEach((section) => {
    if (section.section_key !== "hero" && section.section_key !== "page_hero") {
      return;
    }

    if (section.eyebrow && document.getElementById("resumeHeroKicker")) {
      document.getElementById("resumeHeroKicker").textContent = section.eyebrow;
    }
    if (section.title && document.getElementById("resumeHeroTitle")) {
      document.getElementById("resumeHeroTitle").textContent = section.title;
    }
    if (section.description && document.getElementById("resumeHeroSummary")) {
      document.getElementById("resumeHeroSummary").textContent = section.description;
    }
  });
}

function renderProfileSummaryGrid(items) {
  return `
    <div class="summary-grid">
      ${items.map((item) => `<article class="summary-card"><h3>${item.title}</h3><p>${item.value}</p></article>`).join("")}
    </div>
  `;
}

function renderProfileBadgeGrid(items) {
  return `<div class="badge-grid">${items.map((item) => `<span class="badge">${item}</span>`).join("")}</div>`;
}

function renderProfileTimeline(items) {
  return `
    <div>
      ${items.map((item) => `
        <div class="timeline-entry">
          <div class="timeline-dot"></div>
          <div class="timeline-body">
            <h3>${item.title}</h3>
            <time>${item.time || ""}</time>
            <p>${item.description || ""}</p>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderProfileProse(paragraphs) {
  return `<div class="prose">${paragraphs.map((text) => `<p>${text}</p>`).join("")}</div>`;
}

function renderProfileChecklist(items) {
  return `<ul class="check-list">${renderChecklistItems(items)}</ul>`;
}

function isAsideProfileBlock(block) {
  const content = block.content || {};
  return content.position === "aside" || content.position === "sidebar" || content.area === "aside";
}

function renderDynamicProfileBlock(block) {
  const content = block.content || {};
  const layout = content.layout || block.block_key;
  let bodyHtml = "";

  if ((layout === "summary-grid" || layout === "basic_info") && Array.isArray(content.items)) {
    bodyHtml = renderProfileSummaryGrid(content.items);
  } else if ((layout === "badge-grid" || layout === "skills" || layout === "interests") && Array.isArray(content.items)) {
    bodyHtml = renderProfileBadgeGrid(content.items);
  } else if ((layout === "timeline" || layout === "experience") && Array.isArray(content.items)) {
    bodyHtml = renderProfileTimeline(content.items);
  } else if ((layout === "check-list" || layout === "list") && Array.isArray(content.items)) {
    bodyHtml = renderProfileChecklist(content.items);
  } else if ((layout === "prose" || layout === "self_evaluation") && Array.isArray(content.paragraphs)) {
    bodyHtml = renderProfileProse(content.paragraphs);
  } else {
    bodyHtml = `<div class="prose"><p>${typeof content === "string" ? content : JSON.stringify(content)}</p></div>`;
  }

  return `
    <section class="panel content-card">
      <p class="section-kicker">${block.subtitle || "区块内容"}</p>
      <h2>${block.title}</h2>
      ${bodyHtml}
    </section>
  `;
}

function renderProfileAsideBlock(block) {
  const content = block.content || {};
  const layout = content.layout || "check-list";
  let bodyHtml = "";

  if ((layout === "check-list" || layout === "list") && Array.isArray(content.items)) {
    bodyHtml = renderProfileChecklist(content.items);
  } else if ((layout === "prose" || layout === "text") && Array.isArray(content.paragraphs)) {
    bodyHtml = renderProfileProse(content.paragraphs);
  } else if (Array.isArray(content.items)) {
    bodyHtml = renderProfileChecklist(content.items);
  } else {
    bodyHtml = `<div class="prose"><p>${typeof content === "string" ? content : JSON.stringify(content)}</p></div>`;
  }

  return `
    <section class="panel toc-card">
      <p class="section-kicker">${block.subtitle || "侧栏区块"}</p>
      <h2>${block.title}</h2>
      ${bodyHtml}
    </section>
  `;
}

async function applyProfileBlocks() {
  if (document.body.dataset.page !== "resume") {
    return;
  }

  const container = document.getElementById("profileBlocksContainer");
  const fallback = document.getElementById("profileBlocksFallback");
  const asideContainer = document.getElementById("profileAsideBlocksContainer");
  const asideFallback = document.getElementById("profileAsideBlocksFallback");
  if (!container || !fallback) {
    return;
  }

  const blocks = await resolveProfileBlocks();
  if (!blocks || blocks.length === 0) {
    return;
  }

  const mainBlocks = blocks.filter(function (block) { return !isAsideProfileBlock(block); });
  const asideBlocks = blocks.filter(isAsideProfileBlock);

  if (mainBlocks.length > 0) {
    container.hidden = false;
    fallback.hidden = true;
    container.innerHTML = mainBlocks.map(renderDynamicProfileBlock).join("");
  }

  if (asideContainer && asideFallback && asideBlocks.length > 0) {
    asideContainer.hidden = false;
    asideFallback.hidden = true;
    asideContainer.innerHTML = asideBlocks.map(renderProfileAsideBlock).join("");
  }
}

async function applyRemotePageConfiguration() {
  const [settings, navItems] = await Promise.all([
    resolveSiteSettings(),
    resolveNavigationItems(),
  ]);

  applySiteSettings(settings);
  renderNavigationMenus(navItems);
  await Promise.all([
    applyHomePageSections(),
    applyResumePageSections(),
    applyResourcesPageSections(),
    applyContactPageSections(),
    applySettingsPageSections(),
    applyProfileBlocks(),
  ]);
}

function renderClock() {
  const clock = document.getElementById("siteClock");
  if (!clock) {
    return;
  }

  const now = new Date();
  const weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][now.getDay()];
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  const time = [String(now.getHours()).padStart(2, "0"), String(now.getMinutes()).padStart(2, "0"), String(now.getSeconds()).padStart(2, "0")].join(":");
  clock.textContent = `${date} ${weekday} ${time}`;
}

function initClock() {
  renderClock();
  window.setInterval(renderClock, 1000);
}

function initDropdowns() {
  const dropdowns = document.querySelectorAll("[data-nav-dropdown]");

  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector("[data-dropdown-button]");
    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      const willOpen = !dropdown.classList.contains("is-open");
      dropdowns.forEach((item) => {
        item.classList.remove("is-open");
        item.querySelector("[data-dropdown-button]")?.setAttribute("aria-expanded", "false");
      });

      if (willOpen) {
        dropdown.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  document.addEventListener("click", (event) => {
    dropdowns.forEach((dropdown) => {
      if (!dropdown.contains(event.target)) {
        dropdown.classList.remove("is-open");
        dropdown.querySelector("[data-dropdown-button]")?.setAttribute("aria-expanded", "false");
      }
    });
  });
}

function initBackToTop() {
  const button = document.getElementById("backToTop");
  if (!button) {
    return;
  }

  const toggle = () => {
    button.classList.toggle("is-visible", window.scrollY > 320);
  };

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
  });

  window.addEventListener("scroll", toggle, { passive: true });
  toggle();
}

function markCurrentPage() {
  const currentPage = document.body.dataset.page;
  if (!currentPage) {
    return;
  }

  document.querySelectorAll("[data-nav-page]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.navPage === currentPage);
  });
}

function buildArticleCover(article, index) {
  // 优先使用文章自带的封面图（base64）
  if (article.cover) return article.cover;

  // 根据分类映射图片，增强相关性（现在有 12 张可选图片）
  const categoryMap = {
    'AI 研究': `images/cover${(index % 2 === 0) ? 3 : 7}.png`, // AI 研究交替使用 3 和 7
    'AI 开发': `images/cover${(index % 2 === 0) ? 4 : 8}.png`, // AI 开发交替使用 4 和 8
    'AI 探索': 'images/cover12.png',
    '后端开发': `images/cover${(index % 2 === 0) ? 2 : 11}.png`,
    '课程设计': `images/cover${(index % 2 === 0) ? 1 : 10}.png`,
    '学习路线': `images/cover${(index % 2 === 0) ? 5 : 9}.png`,
    '前端练习': 'images/cover5.png',
    '数据展示': 'images/cover6.png'
  };
  
  if (categoryMap[article.category]) {
    return resolvePath(categoryMap[article.category]);
  }
  
  // 默认根据索引在 12 张图中循环切换
  const coverNum = (index % 12) + 1;
  return resolvePath(`images/cover${coverNum}.png`);
}

function createArticleCard(article, index) {
  const isSticky = index === 0; // 假设第一篇文章是置顶的
  const stickyHtml = isSticky ? `<div class="article-sticky"><i class="fas fa-thumbtack"></i> 置顶</div>` : '';
  const tagHtml = article.tags
    ? `<div class="article-tags">${article.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>`
    : "";
  
  const imgUrl = buildArticleCover(article, index);
  
  return `
    <article class="article-card butterfly-article">
      ${stickyHtml}
      <div class="article-cover">
        <img src="${imgUrl}" alt="article cover">
      </div>
      <div class="article-info">
        <h3><a href="${resolvePath(article.path)}">${article.title}</a></h3>
        <div class="article-meta">
          <span><i class="far fa-calendar-alt"></i> ${article.date}</span>
          <span><i class="fas fa-inbox"></i> ${article.category}</span>
          <span><i class="fas fa-clock"></i> ${article.readTime}</span>
        </div>
        <p class="article-summary">${article.summary}</p>
        ${tagHtml}
      </div>
    </article>
  `;
}

/**
 * 将 Supabase 文章转换为 articleCatalog 格式（兼容现有渲染函数）
 */
function mapSupabaseArticle(article, index) {
  const date = article.created_at
    ? new Date(article.created_at).toISOString().slice(0, 10)
    : "2026-04-27";
  return {
    title: article.title,
    category: article.category || "未分类",
    date: date,
    summary: article.summary || "",
    path: article.slug
      ? resolvePath("pages/articles/" + article.slug + ".html")
      : resolvePath("pages/articles/index.html"),
    readTime: "阅读 " + (article.read_time || 5) + " 分钟",
    tags: article.tags || [],
    cover: article.cover_url || "",
    id: article.id,
  };
}

/** 从 Supabase 加载文章（异步），失败时返回 null */
async function loadArticlesFromSupabase() {
  if (typeof BlogDB === "undefined" || !BlogDB.getPublishedArticles) {
    return null;
  }
  try {
    const data = await BlogDB.getPublishedArticles();
    if (data && data.length > 0) {
      return data.map(mapSupabaseArticle);
    }
  } catch (_) { /* 降级到本地数据 */ }
  return null;
}

/** 实际渲染文章列表的数据源（Supabase 优先，本地降级） */
let activeArticleCatalog = null;

async function resolveArticleCatalog() {
  if (activeArticleCatalog) return activeArticleCatalog;
  const remote = await loadArticlesFromSupabase();
  activeArticleCatalog = remote || articleCatalog;
  return activeArticleCatalog;
}

function renderHomeArticles() {
  const container = document.getElementById("articleList");
  if (container) {
    resolveArticleCatalog().then(function (catalog) {
      container.innerHTML = catalog.map(createArticleCard).join("");
    });
  }
}

function renderArticleCatalog() {
  const container = document.getElementById("articleCatalogList");
  if (!container) {
    return;
  }

  const buttons = Array.from(document.querySelectorAll("[data-article-filter]"));
  let currentFilter = "全部";

  const paint = function () {
    resolveArticleCatalog().then(function (catalog) {
      const filtered = currentFilter === "全部"
        ? catalog
        : catalog.filter(function (article) { return article.category === currentFilter; });

      container.innerHTML = filtered.length > 0
        ? filtered.map(createArticleCard).join("")
        : '<div class="empty-state">当前分类暂无文章，切换到其他分类继续查看。</div>';

      buttons.forEach(function (button) {
        button.classList.toggle("is-active", button.dataset.articleFilter === currentFilter);
      });
    });
  };
}

function renderArticleCatalog() {
  const container = document.getElementById("articleCatalogList");
  if (!container) return;
  
  // 从 Supabase 加载（带降级）
  resolveArticleCatalog().then(function (catalog) {
    container.innerHTML = catalog.map(createArticleCard).join("");
  });
}

function createProjectCard(project, index) {
  const tagHtml = project.tags
    ? `<div class="article-tags">${project.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>`
    : "";

  const imgUrl = buildArticleCover(project, index);

  return `
    <article class="article-card butterfly-article">
      <div class="article-cover">
        <img src="${imgUrl}" alt="project cover">
      </div>
      <div class="article-info">
        <h3><a href="${resolvePath(project.path)}">${project.title}</a></h3>
        <div class="article-meta">
          <span><i class="far fa-calendar-alt"></i> ${project.date}</span>
          <span><i class="fas fa-inbox"></i> ${project.category}</span>
          <span><i class="fas fa-clock"></i> ${project.readTime}</span>
        </div>
        <p class="article-summary">${project.summary}</p>
        ${tagHtml}
      </div>
    </article>
  `;
}

function mapSupabaseProject(project) {
  const date = project.created_at
    ? new Date(project.created_at).toISOString().slice(0, 10)
    : "2026-04-27";
  return {
    title: project.title,
    category: "项目实战",
    date,
    summary: project.summary || project.description || "",
    path: project.demo_url || project.repo_url || "pages/projects/index.html",
    readTime: project.status || "进行中",
    tags: project.tech_tags || [],
    cover: project.cover_url || "",
    id: project.id,
  };
}

async function loadProjectsFromSupabase() {
  if (typeof BlogDB === "undefined" || !BlogDB.getPublishedProjects) {
    return null;
  }

  try {
    const data = await BlogDB.getPublishedProjects();
    if (data && data.length > 0) {
      return data.map(mapSupabaseProject);
    }
  } catch (_) {
    /* 降级到本地数据 */
  }

  return null;
}

let activeProjectCatalog = null;

async function resolveProjectCatalog() {
  if (activeProjectCatalog) return activeProjectCatalog;
  const remote = await loadProjectsFromSupabase();
  activeProjectCatalog = remote || projectCatalog;
  return activeProjectCatalog;
}

function renderProjectCards() {
  // 实战教程页全量列表
  const pageGrid = document.getElementById("projectList") || document.getElementById("projectCatalogGrid");
  if (pageGrid) {
    resolveProjectCatalog().then((catalog) => {
      pageGrid.innerHTML = catalog.map(createProjectCard).join("");
    });
  }
}

function mapSupabaseResourceGroup(group) {
  return {
    kicker: group.name,
    title: group.description || group.name,
    links: (group.links || []).map((link) => ({
      title: link.title,
      desc: link.description || "",
      href: link.href,
      label: link.label || "资源链接",
    })),
  };
}

async function loadResourceGroupsFromSupabase() {
  if (typeof BlogDB === "undefined" || !BlogDB.getPublishedResourceGroups) {
    return null;
  }

  try {
    const data = await BlogDB.getPublishedResourceGroups();
    if (data && data.length > 0) {
      return data.map(mapSupabaseResourceGroup);
    }
  } catch (_) {
    /* 降级到本地数据 */
  }

  return null;
}

let activeResourceGroups = null;

async function resolveResourceGroups() {
  if (activeResourceGroups) return activeResourceGroups;
  const remote = await loadResourceGroupsFromSupabase();
  activeResourceGroups = remote || resourceGroupCatalog;
  return activeResourceGroups;
}

function createFriendLinkCard(item) {
  return `
    <a class="friend-link" href="${item.href}" target="_blank" rel="noreferrer noopener">
      <span>${item.label}</span>
      <strong>${item.title}</strong>
      <p>${item.desc}</p>
    </a>
  `;
}

function createResourceGroupSection(group) {
  return `
    <section class="panel link-card">
      <p class="section-kicker">${group.kicker}</p>
      <h2>${group.title}</h2>
      <div class="links-group">
        ${group.links.map(createFriendLinkCard).join("")}
      </div>
    </section>
  `;
}

function renderFriendLinks() {
  const homeContainer = document.getElementById("friendLinks");
  if (homeContainer) {
    homeContainer.innerHTML = friendLinkCatalog.map(createFriendLinkCard).join("");
  }

  const resourceContainer = document.getElementById("resourceGroups");
  if (resourceContainer) {
    resolveResourceGroups().then((groups) => {
      resourceContainer.innerHTML = groups.map(createResourceGroupSection).join("");

      const jumpList = document.getElementById("resourceJumpList");
      if (jumpList) {
        jumpList.innerHTML = groups
          .map((group) => `<li>${group.kicker} - ${group.links.map((item) => item.title).join(" / ")}</li>`)
          .join("");
      }
    });
  }
}

function countValues(values) {
  return values.reduce((counts, value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
    return counts;
  }, new Map());
}

function renderSidebarDirectory() {
  resolveArticleCatalog().then(function (catalog) {
    const sortedArticles = [...catalog].sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    const categories = countValues(catalog.map(function (a) { return a.category; }));
    const tags = countValues(catalog.flatMap(function (a) { return a.tags || []; }));

    // 同步个人资料卡统计数据
    const authorCardStats = document.querySelector(".profile-hero-card.butterfly-author .profile-hero-stats");
    if (authorCardStats) {
      const statMap = {
        articleCount: catalog.length,
        categoryCount: categories.size,
        tagCount: tags.size,
        timelineCount: catalog.length,
      };
      const statValues = authorCardStats.querySelectorAll("strong");
      if (statValues.length > 0) {
        statValues.forEach(function (item, index) {
          var fallbackKeys = ["articleCount", "categoryCount", "tagCount", "timelineCount"];
          var key = item.dataset.statKey || fallbackKeys[index];
          if (key && Object.prototype.hasOwnProperty.call(statMap, key)) {
            item.textContent = statMap[key];
          }
        });
      }
    }

    // 文章列表
    const articlePanel = document.getElementById("sidebarArticles");
    const articleList = document.getElementById("sidebarArticleList");
    if (articlePanel && articleList) {
      const h = articlePanel.querySelector("h2");
      if (h) h.innerHTML = '<i class="fas fa-file-alt" aria-hidden="true"></i> ' + catalog.length + ' 文章';
      articleList.innerHTML = sortedArticles.slice(0, 6).map(function (article) {
        return '<li><a href="' + resolvePath(article.path) + '"><strong>' + article.title + '</strong><span>' + article.category + ' ' + (article.readTime || '').replace('阅读 ', '') + '</span></a></li>';
      }).join('');
    }

    // 分类
    const categoryPanel = document.getElementById("sidebarCategories");
    const categoryList = document.getElementById("sidebarCategoryList");
    if (categoryPanel && categoryList) {
      const h = categoryPanel.querySelector("h2");
      if (h) h.innerHTML = '<i class="fas fa-th-large" aria-hidden="true"></i> ' + categories.size + ' 分类';
      categoryList.innerHTML = Array.from(categories.entries()).map(function (kv, i) { return '<span class="sidebar-pill tone-' + ((i % 6) + 1) + '">' + kv[0] + '<b>' + kv[1] + '</b></span>'; }).join('');
    }

    // 标签
    const tagPanel = document.getElementById("sidebarTags");
    const tagList = document.getElementById("sidebarTagList");
    if (tagPanel && tagList) {
      const h = tagPanel.querySelector("h2");
      if (h) h.innerHTML = '<i class="fas fa-tags" aria-hidden="true"></i> ' + tags.size + ' 标签';
      tagList.innerHTML = Array.from(tags.entries()).map(function (kv, i) { return '<span class="sidebar-pill tone-' + ((i % 6) + 1) + '">' + kv[0] + '<b>' + kv[1] + '</b></span>'; }).join('');
    }

    // 时间轴
    const timelinePanel = document.getElementById("sidebarTimeline");
    const timelineList = document.getElementById("sidebarTimelineList");
    if (timelinePanel && timelineList) {
      const h = timelinePanel.querySelector("h2");
      if (h) h.innerHTML = '<i class="fas fa-clock" aria-hidden="true"></i> ' + catalog.length + ' 时间轴';
      timelineList.innerHTML = sortedArticles.map(function (article) {
        var d = new Date(article.date + 'T00:00:00');
        return '<li><time datetime="' + article.date + '">' + (d.getMonth() + 1) + '/' + d.getDate() + '</time><a href="' + resolvePath(article.path) + '">' + article.title + '</a></li>';
      }).join('');
    }
  });
}

function initSidebarTabs() {
  const tabs = Array.from(document.querySelectorAll("[data-sidebar-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-sidebar-panel]"));

  if (tabs.length === 0 || panels.length === 0) {
    return;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.sidebarTab;

      tabs.forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.sidebarPanel === target;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });
    });
  });
}

function renderScheduleTable() {
  const tbody = document.getElementById("scheduleTableBody");
  if (!tbody) {
    return;
  }

  resolveScheduleRows().then((rows) => {
    tbody.innerHTML = rows
      .map((row) => {
        let statusClass = "status-warn";
        if (row.status === "已完成") {
          statusClass = "status-good";
        } else if (row.status === "进行中") {
          statusClass = "status-hot";
        }

        return `
          <tr>
            <td>${row.task}</td>
            <td>${row.time}</td>
            <td>${row.goal}</td>
            <td><span class="status-pill ${statusClass}">${row.status}</span></td>
          </tr>
        `;
      })
      .join("");
  });
}

function mapSupabaseScheduleItem(item) {
  return {
    task: item.task_name,
    time: item.time_range || "",
    goal: item.goal || "",
    status: item.status || "待开始",
  };
}

async function loadScheduleRowsFromSupabase() {
  if (typeof BlogDB === "undefined" || !BlogDB.getPublishedScheduleItems) {
    return null;
  }

  try {
    const data = await BlogDB.getPublishedScheduleItems();
    if (data && data.length > 0) {
      return data.map(mapSupabaseScheduleItem);
    }
  } catch (_) {
    /* 降级到本地数据 */
  }

  return null;
}

let activeScheduleRows = null;

async function resolveScheduleRows() {
  if (activeScheduleRows) return activeScheduleRows;
  const remote = await loadScheduleRowsFromSupabase();
  activeScheduleRows = remote || scheduleRows;
  return activeScheduleRows;
}

function initCarousel() {
  const root = document.getElementById("heroCarousel");
  if (!root) {
    return;
  }

  const slides = Array.from(root.querySelectorAll("[data-slide]"));
  const dots = Array.from(root.querySelectorAll("[data-carousel-dot]"));
  let activeIndex = 0;
  let timerId = null;

  const sync = () => {
    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === activeIndex);
    });
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeIndex);
    });
  };

  const goTo = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    sync();
  };

  const restart = () => {
    if (timerId) {
      window.clearInterval(timerId);
    }

    if (!prefersReducedMotion.matches) {
      timerId = window.setInterval(() => {
        goTo(activeIndex + 1);
      }, 4200);
    }
  };

  root.querySelector("[data-carousel-prev]")?.addEventListener("click", () => {
    goTo(activeIndex - 1);
    restart();
  });

  root.querySelector("[data-carousel-next]")?.addEventListener("click", () => {
    goTo(activeIndex + 1);
    restart();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      goTo(Number(dot.dataset.carouselDot));
      restart();
    });
  });

  sync();
  restart();
}

function readMessages() {
  try {
    const raw = window.sessionStorage.getItem("courseMessages");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages) {
  window.sessionStorage.setItem("courseMessages", JSON.stringify(messages));
}

function pushMessage(message) {
  const history = readMessages();
  history.unshift(message);
  saveMessages(history.slice(0, 8));
}

function renderMessages() {
  const container = document.getElementById("messageList");
  if (!container) {
    return;
  }

  const history = readMessages();
  const records = history.length > 0 ? history : defaultMessages;
  container.innerHTML = records
    .map(
      (item) => `
        <article class="summary-card">
          <span class="chip">${item.time}</span>
          <h3>${item.title}</h3>
          <p>${item.summary}</p>
        </article>
      `,
    )
    .join("");
}

function setError(form, fieldName, message) {
  const node = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (node) {
    node.textContent = message;
  }
}

function clearErrors(form) {
  form.querySelectorAll("[data-error-for]").forEach((node) => {
    node.textContent = "";
  });
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateForm(form) {
  clearErrors(form);
  const type = form.dataset.formType;
  let valid = true;

  const getValue = (name) => String(new FormData(form).get(name) || "").trim();

  if (type === "settings") {
    const nickname = getValue("nickname");
    const studentId = getValue("studentId");
    const password = getValue("password");
    const major = getValue("major");
    const gender = getValue("gender");
    const bio = getValue("bio");
    const interests = Array.from(form.querySelectorAll('input[name="interests"]:checked')).map((item) => item.value);

    if (nickname.length < 2) {
      setError(form, "nickname", "昵称至少 2 个字。");
      valid = false;
    }
    if (!/^\d{8,12}$/.test(studentId)) {
      setError(form, "studentId", "学号应为 8 到 12 位数字。");
      valid = false;
    }
    if (password.length < 6) {
      setError(form, "password", "密码至少 6 位。");
      valid = false;
    }
    if (!major) {
      setError(form, "major", "请选择主修方向。");
      valid = false;
    }
    if (!gender) {
      setError(form, "gender", "请选择性别。");
      valid = false;
    }
    if (interests.length === 0) {
      setError(form, "interests", "至少勾选一个兴趣方向。");
      valid = false;
    }
    if (bio.length < 20) {
      setError(form, "bio", "自我介绍不少于 20 个字。");
      valid = false;
    }
  }

  

  if (type === "contact") {
    const name = getValue("name");
    const email = getValue("email");
    const content = getValue("content");
    if (name.length < 2) {
      setError(form, "name", "姓名至少 2 个字。");
      valid = false;
    }
    if (!validateEmail(email)) {
      setError(form, "email", "请输入正确的邮箱地址。");
      valid = false;
    }
    if (content.length < 10) {
      setError(form, "content", "留言内容不少于 10 个字。");
      valid = false;
    }
  }

  return valid;
}

function buildMessage(form) {
  const type = form.dataset.formType;
  const now = new Date().toLocaleString("zh-CN", { hour12: false });
  const data = new FormData(form);

  if (type === "settings") {
    return {
      title: "个人信息设置已保存",
      summary: `昵称 ${data.get("nickname")}，方向 ${data.get("major")}，资料填写已通过前端校验。`,
      time: now,
    };
  }

  

  return {
    title: `来自 ${data.get("name")} 的留言`,
    summary: `${data.get("content")}`,
    time: now,
  };
}

function initForms() {
  document.querySelectorAll("form[data-form-type]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateForm(form)) {
        return;
      }

      pushMessage(buildMessage(form));

      if (form.dataset.formType === "contact") {
        form.reset();
        renderMessages();
        return;
      }

      window.location.href = resolvePath("pages/about/contact.html");
    });
  });
}

function initCursorEffects() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:999999999;width:100vw;height:100vh;';
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  const particles = [];
  let w = window.innerWidth;
  let h = window.innerHeight;

  canvas.width = w;
  canvas.height = h;
  
  window.addEventListener('resize', () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  });
  
  const colors = ['#49b1f5', '#ff7242', '#00c4b6', '#f6d563', '#ff6b81'];
  
  function createParticles(x, y) {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: Math.random() * 0.02 + 0.015
      });
    }
  }
  
  function render() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // 重力效果
      p.life -= p.decay;
      p.size = Math.max(0, p.size - 0.05);
      
      if (p.life <= 0) {
        particles.splice(i, 1);
        i--;
        continue;
      }
      
      ctx.beginPath();
      // 绘制五角星或圆形，这里为了性能和简洁绘制圆形小碎块
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(render);
  }
  
  document.addEventListener('click', (e) => {
    createParticles(e.clientX, e.clientY);
  });
  
  render();
}

function initAmbientBackground() {
  let background = document.querySelector(".bg-animated");

  if (!background) {
    background = document.createElement("div");
    background.className = "bg-animated";
    document.body.prepend(background);
  }

  background.setAttribute("aria-hidden", "true");

  for (let index = 1; index <= 3; index++) {
    const className = `shape${index}`;
    let shape = document.querySelector(`.${className}`);

    if (!shape) {
      shape = document.createElement("div");
      shape.className = `shape ${className}`;
      document.body.insertBefore(shape, background.nextSibling);
    }

    shape.setAttribute("aria-hidden", "true");
  }
}

async function boot() {
  initAmbientBackground();
  await applyRemotePageConfiguration();
  markCurrentPage();
  initClock();
  initDropdowns();
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
  initCursorEffects();
}

document.addEventListener("DOMContentLoaded", function () {
  boot();
});
