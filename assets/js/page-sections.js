/**
 * 页面区块渲染层
 * ===============
 * 职责：将数据加载层获取的数据渲染到各页面 DOM。
 *
 * 包含：站点设置、导航、首页区块、文章/项目卡片、资源导航、
 *       学习计划、侧栏目录、轮播、表单验证等所有前台渲染逻辑。
 *
 * 依赖：data-layer.js（必须先加载，提供 resolveXxx / resolvePath 等函数）
 * 加载顺序：... → data-layer.js → page-sections.js → profile-renderer.js → script.js
 */

var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// ================================================================
//  1. 站点设置应用 — 将设置数据注入页面 DOM
// ================================================================

function applySiteSettings(settings) {
  if (!settings) return;

  var siteName = getSettingValue(settings, "site_name", null);
  if (siteName) {
    var currentTitle = document.title;
    var parts = currentTitle.split(' | ');
    if (parts.length > 1) {
      document.title = parts[0] + ' | ' + siteName;
    } else {
      document.title = siteName;
    }
  }

  var brandName = getSettingValue(settings, "brand_name", null);
  var brandSubtitle = getSettingValue(settings, "brand_subtitle", null);
  var brandMark = getSettingValue(settings, "brand_mark", null);

  if (brandMark) {
    document.querySelectorAll(".brand-mark").forEach(function (node) {
      node.textContent = brandMark;
    });
  }
  if (brandName) {
    document.querySelectorAll(".brand-copy strong").forEach(function (node) {
      node.textContent = brandName;
    });
  }
  if (brandSubtitle) {
    document.querySelectorAll(".brand-copy small").forEach(function (node) {
      node.textContent = brandSubtitle;
    });
  }

  if (document.body.dataset.page === "home") {
    var authorName = getSettingValue(settings, "author_name", null);
    var authorBio = getSettingValue(settings, "author_bio", null);
    var authorAvatar = getSettingValue(settings, "author_avatar", null);
    var socialLinks = getSettingValue(settings, "author_social_links", null);

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
      document.getElementById("homeAuthorSocials").innerHTML = socialLinks.map(function (item) {
        return '<a href="' + item.href + '" ' + (item.external === false ? "" : 'target="_blank"') + ' style="background: ' + (item.color || '#49b1f5') + ';" aria-label="' + (item.label || item.title || 'social') + '"><i class="' + (item.icon || 'fas fa-link') + '" aria-hidden="true"></i></a>';
      }).join("");
    }
  }

  if (document.body.dataset.page === "resume") {
    var profileName = getSettingValue(settings, "author_name", null);
    var profileMeta = getSettingValue(settings, "resume_meta", null);
    var profileSummary = getSettingValue(settings, "resume_summary", null);
    var profileAvatarText = getSettingValue(settings, "resume_avatar_text", null);

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

  var idMap = {
    contactEmail: 'contact_email',
    contactGithub: 'contact_github',
    contactSchool: 'contact_school',
    contactMajor: 'contact_major',
    resumeContactEmail: 'contact_email',
    resumeContactGithub: 'contact_github',
    resumeContactSchool: 'contact_school',
    resumeInfoName: 'author_name',
    resumeInfoSchool: 'contact_school',
    resumeInfoMajor: 'contact_major',
    resumeInfoGrade: 'contact_grade',
  };
  Object.keys(idMap).forEach(function (elId) {
    var el = document.getElementById(elId);
    if (el) {
      el.textContent = getSettingValue(settings, idMap[elId], el.textContent);
    }
  });
}

// ================================================================
//  2. 导航菜单渲染
// ================================================================

function renderNavigationMenus(items) {
  if (!items || !items.length) return;

  var topLevel = items.filter(function (item) { return !item.parent_id && item.visible !== false; });
  if (!topLevel.length) return;

  var html = topLevel.map(function (item) {
    var pageKey = deriveNavPageKeyFromHref(item.href);
    var href = resolvePath(String(item.href || "").replace(/^(\.\.\/|\.\/)+/, ""));
    return '<li><a class="menu-link" href="' + href + '" data-nav-page="' + pageKey + '"><i class="' + resolveNavIcon(item) + '"></i> ' + item.label + '</a></li>';
  }).join("");

  document.querySelectorAll(".site-nav .menu-list").forEach(function (list) {
    list.innerHTML = html;
  });
}

// ================================================================
//  3. 首页渲染 — 轮播 / 文章卡片 / 侧栏目录 / 学习计划
// ================================================================

function buildHomeNoteCard(card, index) {
  var tones = ["note-card-mint", "note-card-lemon", "note-card-ice", "note-card-rose"];
  var tone = card.tone || tones[index % tones.length];
  return '<article class="note-card ' + tone + '"><span class="note-tag">' + (card.tag || card.kicker || "内容卡片") + '</span><h3>' + (card.title || "未命名区块") + '</h3><p>' + (card.description || "") + '</p></article>';
}

function buildHomeCarouselSlide(slide, index) {
  var tones = ["visual-red", "visual-blue", "visual-green"];
  var visualClass = slide.visualClass || tones[index % tones.length];
  var meta = [];

  if (slide.chip) meta.push('<span class="chip">' + slide.chip + '</span>');
  if (slide.date) meta.push('<span>' + slide.date + '</span>');
  if (slide.readTime) meta.push('<span>' + slide.readTime + '</span>');

  var visualHtml = slide.imageUrl
    ? '<div class="carousel-visual ' + visualClass + '" aria-hidden="true"><img src="' + resolvePath(slide.imageUrl) + '" alt="' + (slide.visualAlt || slide.title || "轮播配图") + '"></div>'
    : '<div class="carousel-visual ' + visualClass + '" aria-hidden="true"><div class="carousel-visual-copy"><span class="chip">' + (slide.visualLabel || slide.chip || "精选内容") + '</span><strong>' + (slide.visualTitle || slide.title || "轮播内容") + '</strong><p>' + (slide.visualSummary || slide.summary || "") + '</p></div></div>';

  var linkedVisual = slide.linkUrl
    ? '<a href="' + slide.linkUrl + '" class="carousel-visual-link">' + visualHtml + '</a>'
    : visualHtml;

  return '<article class="carousel-slide ' + (index === 0 ? "is-active" : "") + '" data-slide>' + linkedVisual + '<div class="carousel-content"><div class="carousel-meta-row">' + meta.join("") + '</div><h2>' + (slide.linkUrl ? '<a href="' + slide.linkUrl + '">' + (slide.title || "未命名轮播") + '</a>' : (slide.title || "未命名轮播")) + '</h2><p>' + (slide.summary || "") + '</p></div></article>';
}

var contentMetaCache = null;

async function ensureContentMetaCache() {
  if (contentMetaCache) return contentMetaCache;
  var cache = {};
  try {
    var articles = await BlogDB.getPublishedArticles();
    if (articles) {
      articles.forEach(function (a) {
        cache[a.id] = { cover: a.cover_url || '', slug: a.slug || '', source: 'article' };
      });
    }
    var projects = await BlogDB.getPublishedProjects();
    if (projects) {
      projects.forEach(function (p) {
        cache[p.id] = { cover: p.cover_url || '', slug: p.slug || '', source: 'project' };
      });
    }
  } catch (_) { /* 降级 */ }
  contentMetaCache = cache;
  return cache;
}

function renderHomeCarouselSection(section) {
  if (section.eyebrow && document.getElementById("homeFeatureKicker")) {
    document.getElementById("homeFeatureKicker").textContent = section.eyebrow;
  }
  if (section.title && document.getElementById("homeFeatureTitle")) {
    document.getElementById("homeFeatureTitle").textContent = section.title;
  }

  var content = section.content || {};
  var slides = Array.isArray(content.slides) ? content.slides : [];
  var track = document.getElementById("heroCarouselTrack");
  var dots = document.getElementById("heroCarouselDots");

  if (!track || !dots || !slides.length) return;

  ensureContentMetaCache().then(function (metaCache) {
    slides = slides.map(function (slide) {
      var meta = (slide.refId && metaCache[slide.refId]) ? metaCache[slide.refId] : null;
      var enriched = Object.assign({}, slide);
      if (meta) {
        enriched.imageUrl = meta.cover || slide.imageUrl;
        if (meta.source === 'article' && meta.slug) {
          enriched.linkUrl = resolvePath('pages/articles/' + meta.slug + '.html');
        } else if (meta.source === 'project' && meta.slug) {
          enriched.linkUrl = resolvePath('pages/projects/detail.html?slug=' + meta.slug);
        }
      }
      return enriched;
    });

    track.innerHTML = slides.map(buildHomeCarouselSlide).join('');
    dots.innerHTML = slides.map(function (_slide, index) {
      return '<button class="dot ' + (index === 0 ? 'is-active' : '') + '" type="button" data-carousel-dot="' + index + '" aria-label="第 ' + (index + 1) + ' 张"></button>';
    }).join('');

    initCarousel();
  });
}

function renderHomeFeedSection(section) {
  if (section.eyebrow && document.getElementById("homeFeedKicker")) {
    document.getElementById("homeFeedKicker").textContent = section.eyebrow;
  }
  if (section.title && document.getElementById("homeFeedTitle")) {
    document.getElementById("homeFeedTitle").textContent = section.title;
  }

  var link = document.getElementById("homeFeedLink");
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

async function applyHomePageSections() {
  if (document.body.dataset.page !== "home") return;

  var sections = await resolvePageSections("home");
  if (!sections || sections.length === 0) return;

  sections.forEach(function (section) {
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
  });
}

// ================================================================
//  4. 其他页面区块渲染
// ================================================================

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
  var node = document.getElementById(id);
  if (node && value) {
    node.textContent = value;
  }
}

function renderChecklistItems(items) {
  return items.map(function (item) {
    if (typeof item === "string") {
      return '<li>' + item + '</li>';
    }
    var label = item.text || item.label || item.title || item.value || item.href || "";
    if (item.href) {
      var href = resolvePath(String(item.href).replace(/^(\.\.\/|\.\/)+/, ""));
      return '<li><a href="' + href + '" ' + (item.external === false ? "" : 'target="_blank"') + '>' + label + '</a></li>';
    }
    return '<li>' + label + '</li>';
  }).join("");
}

function renderContentLayout(content) {
  var layout = content && content.layout ? content.layout : "prose";

  if ((layout === "check-list" || layout === "list") && Array.isArray(content.items)) {
    return '<ul class="check-list">' + renderChecklistItems(content.items) + '</ul>';
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
  var container = document.getElementById(containerId);
  if (!container || !content) return;
  container.innerHTML = renderContentLayout(content);
}

async function applyResourcesPageSections() {
  if (document.body.dataset.page !== "resources") return;

  var sections = await resolvePageSections("resources");
  if (!sections || sections.length === 0) return;

  sections.forEach(function (section) {
    if (section.section_key === "hero" || section.section_key === "page_hero") {
      applyHeroSection({ kicker: "resourcesHeroKicker", title: "resourcesHeroTitle", summary: "resourcesHeroSummary" }, section);
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
  if (document.body.dataset.page !== "contact") return;

  var sections = await resolvePageSections("contact");
  if (!sections || sections.length === 0) return;

  sections.forEach(function (section) {
    if (section.section_key === "hero" || section.section_key === "page_hero") {
      applyHeroSection({ kicker: "contactHeroKicker", title: "contactHeroTitle", summary: "contactHeroSummary" }, section);
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
  if (document.body.dataset.page !== "settings") return;

  var sections = await resolvePageSections("settings");
  if (!sections || sections.length === 0) return;

  sections.forEach(function (section) {
    if (section.section_key === "hero" || section.section_key === "page_hero") {
      applyHeroSection({ kicker: "settingsHeroKicker", title: "settingsHeroTitle", summary: "settingsHeroSummary" }, section);
      return;
    }
    if (section.section_key === "settings_form_card") {
      setElementText("settingsFormKicker", section.eyebrow);
      setElementText("settingsFormTitle", section.title);

      var summary = document.getElementById("settingsFormSummary");
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
  if (document.body.dataset.page !== "resume") return;

  var sections = await resolvePageSections("resume");
  if (!sections || sections.length === 0) return;

  sections.forEach(function (section) {
    if (section.section_key !== "hero" && section.section_key !== "page_hero") return;
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

// ================================================================
//  5. 文章 / 项目 / 资源卡片渲染
// ================================================================

function buildArticleCover(article, index) {
  if (article.cover) return article.cover;

  var categoryMap = {
    'AI 研究': 'assets/images/cover' + (index % 2 === 0 ? 3 : 7) + '.jpg',
    'AI 开发': 'assets/images/cover' + (index % 2 === 0 ? 4 : 8) + '.jpg',
    'AI 探索': 'assets/images/cover12.jpg',
    '后端开发': 'assets/images/cover' + (index % 2 === 0 ? 2 : 11) + '.jpg',
    '课程设计': 'assets/images/cover' + (index % 2 === 0 ? 1 : 10) + '.jpg',
    '学习路线': 'assets/images/cover' + (index % 2 === 0 ? 5 : 9) + '.jpg',
    '前端练习': 'assets/images/cover5.jpg',
    '数据展示': 'assets/images/cover6.jpg'
  };

  if (categoryMap[article.category]) {
    return resolvePath(categoryMap[article.category]);
  }

  var coverNum = (index % 12) + 1;
  return resolvePath('assets/images/cover' + coverNum + '.jpg');
}

function createArticleCard(article, index) {
  var isSticky = index === 0;
  var stickyHtml = isSticky ? '<div class="article-sticky"><i class="fas fa-thumbtack"></i> 置顶</div>' : '';
  var tagHtml = article.tags
    ? '<div class="article-tags">' + article.tags.map(function (tag) { return '<span>' + tag + '</span>'; }).join("") + '</div>'
    : "";

  var imgUrl = buildArticleCover(article, index);

  return '<article class="article-card butterfly-article">' + stickyHtml + '<div class="article-cover"><img src="' + imgUrl + '" alt="article cover"></div><div class="article-info"><h3><a href="' + resolvePath(article.path) + '">' + article.title + '</a></h3><div class="article-meta"><span><i class="far fa-calendar-alt"></i> ' + article.date + '</span><span><i class="fas fa-inbox"></i> ' + article.category + '</span><span><i class="fas fa-clock"></i> ' + article.readTime + '</span></div><p class="article-summary">' + article.summary + '</p>' + tagHtml + '</div></article>';
}

function renderHomeArticles() {
  var container = document.getElementById("articleList");
  if (container) {
    resolveArticleCatalog().then(function (catalog) {
      container.innerHTML = catalog.map(createArticleCard).join("");
    });
  }
}

function renderArticleCatalog() {
  var container = document.getElementById("articleCatalogList");
  if (!container) return;
  resolveArticleCatalog().then(function (catalog) {
    container.innerHTML = catalog.map(createArticleCard).join("");
  });
}

function createProjectCard(project, index) {
  var tagHtml = project.tags
    ? '<div class="article-tags">' + project.tags.map(function (tag) { return '<span>' + tag + '</span>'; }).join("") + '</div>'
    : "";

  var imgUrl = buildArticleCover(project, index);

  return '<article class="article-card butterfly-article"><div class="article-cover"><img src="' + imgUrl + '" alt="project cover"></div><div class="article-info"><h3><a href="' + resolvePath(project.path) + '">' + project.title + '</a></h3><div class="article-meta"><span><i class="far fa-calendar-alt"></i> ' + project.date + '</span><span><i class="fas fa-inbox"></i> ' + project.category + '</span><span><i class="fas fa-clock"></i> ' + project.readTime + '</span></div><p class="article-summary">' + project.summary + '</p>' + tagHtml + '</div></article>';
}

function renderProjectCards() {
  var pageGrid = document.getElementById("projectList");
  if (pageGrid) {
    resolveProjectCatalog().then(function (catalog) {
      pageGrid.innerHTML = catalog.map(createProjectCard).join("");
    });
  }
}

function createFriendLinkCard(item) {
  var initial = item.title.charAt(0).toUpperCase();
  var getLinkColor = function (str) {
    var colors = ['#49b1f5', '#ff7242', '#00c4b6', '#f6d563', '#ff6b81', '#6f42c1'];
    var hash = 0;
    for (var i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };
  var color = getLinkColor(item.title);

  return '<a class="friend-link-card" href="' + item.href + '" target="_blank" rel="noreferrer noopener"><div class="link-avatar" style="background: ' + color + '20; color: ' + color + '">' + initial + '</div><div class="link-info"><div class="link-top"><strong>' + item.title + '</strong>' + (item.label ? '<span class="link-tag">' + item.label + '</span>' : '') + '</div><p>' + item.desc + '</p></div><div class="link-arrow"><i class="fas fa-external-link-alt"></i></div></a>';
}

function createResourceGroupSection(group) {
  return '<section class="panel link-card"><p class="section-kicker">' + group.kicker + '</p><h2>' + group.title + '</h2><div class="links-group">' + group.links.map(createFriendLinkCard).join("") + '</div></section>';
}

function renderFriendLinks() {
  var resourceContainer = document.getElementById("resourceGroups");
  if (resourceContainer) {
    resolveResourceGroups().then(function (groups) {
      resourceContainer.innerHTML = groups.map(createResourceGroupSection).join("");

      var jumpList = document.getElementById("resourceJumpList");
      if (jumpList) {
        jumpList.innerHTML = groups
          .map(function (group) { return '<li>' + group.kicker + ' - ' + group.links.map(function (item) { return item.title; }).join(" / ") + '</li>'; })
          .join("");
      }
    });
  }
}

// ================================================================
//  6. 侧栏目录
// ================================================================

function renderSidebarDirectory() {
  resolveArticleCatalog().then(function (catalog) {
    var sortedArticles = catalog.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    var categories = countValues(catalog.map(function (a) { return a.category; }));
    var tags = countValues(catalog.flatMap(function (a) { return a.tags || []; }));

    var authorCardStats = document.querySelector(".profile-hero-card.butterfly-author .profile-hero-stats");
    if (authorCardStats) {
      var statMap = {
        articleCount: catalog.length,
        categoryCount: categories.size,
        tagCount: tags.size,
        timelineCount: catalog.length,
      };
      var statValues = authorCardStats.querySelectorAll("strong");
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

    var articlePanel = document.getElementById("sidebarArticles");
    var articleList = document.getElementById("sidebarArticleList");
    if (articlePanel && articleList) {
      var h = articlePanel.querySelector("h2");
      if (h) h.innerHTML = '<i class="fas fa-file-alt" aria-hidden="true"></i> ' + catalog.length + ' 文章';
      articleList.innerHTML = sortedArticles.slice(0, 6).map(function (article) {
        return '<li><a href="' + resolvePath(article.path) + '"><strong>' + article.title + '</strong><span>' + article.category + ' ' + (article.readTime || '').replace('阅读 ', '') + '</span></a></li>';
      }).join('');
    }

    var categoryPanel = document.getElementById("sidebarCategories");
    var categoryList = document.getElementById("sidebarCategoryList");
    if (categoryPanel && categoryList) {
      var h2 = categoryPanel.querySelector("h2");
      if (h2) h2.innerHTML = '<i class="fas fa-th-large" aria-hidden="true"></i> ' + categories.size + ' 分类';
      categoryList.innerHTML = Array.from(categories.entries()).map(function (kv, i) { return '<span class="sidebar-pill tone-' + ((i % 6) + 1) + '">' + kv[0] + '<b>' + kv[1] + '</b></span>'; }).join('');
    }

    var tagPanel = document.getElementById("sidebarTags");
    var tagList = document.getElementById("sidebarTagList");
    if (tagPanel && tagList) {
      var h3 = tagPanel.querySelector("h2");
      if (h3) h3.innerHTML = '<i class="fas fa-tags" aria-hidden="true"></i> ' + tags.size + ' 标签';
      tagList.innerHTML = Array.from(tags.entries()).map(function (kv, i) { return '<span class="sidebar-pill tone-' + ((i % 6) + 1) + '">' + kv[0] + '<b>' + kv[1] + '</b></span>'; }).join('');
    }

    var timelinePanel = document.getElementById("sidebarTimeline");
    var timelineList = document.getElementById("sidebarTimelineList");
    if (timelinePanel && timelineList) {
      var h4 = timelinePanel.querySelector("h2");
      if (h4) h4.innerHTML = '<i class="fas fa-clock" aria-hidden="true"></i> ' + catalog.length + ' 时间轴';
      timelineList.innerHTML = sortedArticles.map(function (article) {
        var d = new Date(article.date + 'T00:00:00');
        return '<li><time datetime="' + article.date + '">' + (d.getMonth() + 1) + '/' + d.getDate() + '</time><a href="' + resolvePath(article.path) + '">' + article.title + '</a></li>';
      }).join('');
    }
  });
}

function initSidebarTabs() {
  var tabs = Array.from(document.querySelectorAll("[data-sidebar-tab]"));
  var panels = Array.from(document.querySelectorAll("[data-sidebar-panel]"));

  if (tabs.length === 0 || panels.length === 0) return;

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.dataset.sidebarTab;

      tabs.forEach(function (item) {
        var isActive = item === tab;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
      });

      panels.forEach(function (panel) {
        var isActive = panel.dataset.sidebarPanel === target;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });
    });
  });
}

// ================================================================
//  7. 学习计划渲染
// ================================================================

function renderScheduleTable() {
  var container = document.getElementById("scheduleRoadmap");
  if (!container) return;

  resolveScheduleRows().then(function (rows) {
    if (!rows || rows.length === 0) {
      container.innerHTML = '<div class="schedule-empty"><i class="fas fa-calendar-check"></i><p>暂无学习计划</p><span>通过管理后台添加课程任务</span></div>';
      return;
    }

    container.innerHTML = rows
      .map(function (row, i) {
        var borderColor = "var(--accent-gold)";
        var dotColor = "var(--accent-gold)";
        var statusLabel = row.status || "待开始";
        if (row.status === "已完成") {
          borderColor = "#10b981";
          dotColor = "#10b981";
        } else if (row.status === "进行中") {
          borderColor = "var(--accent)";
          dotColor = "var(--accent)";
        }

        return '<div class="schedule-card" style="border-left-color: ' + borderColor + '; animation-delay: ' + (i * 0.06) + 's;"><div class="schedule-card-dot" style="background: ' + dotColor + ';" aria-hidden="true"></div><div class="schedule-card-body"><div class="schedule-card-head"><h3 class="schedule-card-title">' + row.task + '</h3><span class="schedule-status-badge" style="background: ' + dotColor + '18; color: ' + dotColor + '; border: 1px solid ' + dotColor + '30;">' + statusLabel + '</span></div>' + (row.time ? '<span class="schedule-time-badge"><i class="fas fa-clock"></i> ' + row.time + '</span>' : "") + (row.goal ? '<p class="schedule-card-goal">' + row.goal + '</p>' : "") + '</div></div>';
      })
      .join("");
  });
}

// ================================================================
//  8. 交互组件 — 轮播 / 时钟 / 返回顶部 / 表单
// ================================================================

function initCarousel() {
  var root = document.getElementById("heroCarousel");
  if (!root) return;

  var slides = Array.from(root.querySelectorAll("[data-slide]"));
  var dots = Array.from(root.querySelectorAll("[data-carousel-dot]"));
  var activeIndex = 0;
  var timerId = null;

  var sync = function () {
    slides.forEach(function (slide, index) {
      slide.classList.toggle("is-active", index === activeIndex);
    });
    dots.forEach(function (dot, index) {
      dot.classList.toggle("is-active", index === activeIndex);
    });
  };

  var goTo = function (index) {
    activeIndex = (index + slides.length) % slides.length;
    sync();
  };

  var restart = function () {
    if (timerId) {
      window.clearInterval(timerId);
    }
    if (!prefersReducedMotion.matches) {
      timerId = window.setInterval(function () {
        goTo(activeIndex + 1);
      }, 4200);
    }
  };

  var prevBtn = root.querySelector("[data-carousel-prev]");
  if (prevBtn) prevBtn.addEventListener("click", function () { goTo(activeIndex - 1); restart(); });

  var nextBtn = root.querySelector("[data-carousel-next]");
  if (nextBtn) nextBtn.addEventListener("click", function () { goTo(activeIndex + 1); restart(); });

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      goTo(Number(dot.dataset.carouselDot));
      restart();
    });
  });

  sync();
  restart();
}

function renderClock() {
  var clock = document.getElementById("siteClock");
  if (!clock) return;

  var now = new Date();
  var weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][now.getDay()];
  var date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  var time = [String(now.getHours()).padStart(2, "0"), String(now.getMinutes()).padStart(2, "0"), String(now.getSeconds()).padStart(2, "0")].join(":");
  clock.textContent = date + ' ' + weekday + ' ' + time;
}

function initClock() {
  renderClock();
  window.setInterval(renderClock, 1000);
}

function initBackToTop() {
  var button = document.getElementById("backToTop");

  if (!button) {
    button = document.createElement('button');
    button.className = 'back-to-top';
    button.id = 'backToTop';
    button.type = 'button';
    button.setAttribute('aria-label', '返回顶部');
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(button);
  }

  var toggle = function () {
    button.classList.toggle('is-visible', window.scrollY > 320);
  };

  button.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
  });

  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
}

function markCurrentPage() {
  var currentPage = document.body.dataset.page;
  if (!currentPage) return;

  document.querySelectorAll("[data-nav-page]").forEach(function (link) {
    link.classList.toggle("is-active", link.dataset.navPage === currentPage);
  });
}

function renderMessages() {
  var container = document.getElementById("messageList");
  if (!container) return;
  container.innerHTML = '<div class="empty-state"><strong>暂无留言</strong><div>请在互动交流页面提交留言，或在管理后台添加内容。</div></div>';
}

function setError(form, fieldName, message) {
  var node = form.querySelector('[data-error-for="' + fieldName + '"]');
  if (node) {
    node.textContent = message;
  }
}

function clearErrors(form) {
  form.querySelectorAll("[data-error-for]").forEach(function (node) {
    node.textContent = "";
  });
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateForm(form) {
  clearErrors(form);
  var type = form.dataset.formType;
  var valid = true;

  var getValue = function (name) { return String(new FormData(form).get(name) || "").trim(); };

  if (type === "settings") {
    var nickname = getValue("nickname");
    var studentId = getValue("studentId");
    var password = getValue("password");
    var major = getValue("major");
    var gender = getValue("gender");
    var bio = getValue("bio");
    var interests = Array.from(form.querySelectorAll('input[name="interests"]:checked')).map(function (item) { return item.value; });

    if (nickname.length < 2) { setError(form, "nickname", "昵称至少 2 个字。"); valid = false; }
    if (!/^\d{8,12}$/.test(studentId)) { setError(form, "studentId", "学号应为 8 到 12 位数字。"); valid = false; }
    if (password.length < 6) { setError(form, "password", "密码至少 6 位。"); valid = false; }
    if (!major) { setError(form, "major", "请选择主修方向。"); valid = false; }
    if (!gender) { setError(form, "gender", "请选择性别。"); valid = false; }
    if (interests.length === 0) { setError(form, "interests", "至少勾选一个兴趣方向。"); valid = false; }
    if (bio.length < 20) { setError(form, "bio", "自我介绍不少于 20 个字。"); valid = false; }
  }

  if (type === "contact") {
    var name = getValue("name");
    var email = getValue("email");
    var content = getValue("content");
    if (name.length < 2) { setError(form, "name", "姓名至少 2 个字。"); valid = false; }
    if (!validateEmail(email)) { setError(form, "email", "请输入正确的邮箱地址。"); valid = false; }
    if (content.length < 10) { setError(form, "content", "留言内容不少于 10 个字。"); valid = false; }
  }

  return valid;
}

function initForms() {
  document.querySelectorAll("form[data-form-type]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
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

// ================================================================
//  9. 远程配置总入口
// ================================================================

async function applyRemotePageConfiguration() {
  var results = await Promise.all([
    resolveSiteSettings(),
    resolveNavigationItems(),
  ]);

  applySiteSettings(results[0]);
  renderNavigationMenus(results[1]);
  await Promise.all([
    applyHomePageSections(),
    applyResumePageSections(),
    applyResourcesPageSections(),
    applyContactPageSections(),
    applySettingsPageSections(),
    applyProfileBlocks(),
  ]);
}
