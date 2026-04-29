/**
 * 简历区块渲染层
 * ===============
 * 职责：渲染 profile_blocks 数据到简历页面（主区块 + 侧栏区块）。
 *
 * 依赖：data-layer.js（提供 resolveProfileBlocks）
 * 加载顺序：... → data-layer.js → page-sections.js → profile-renderer.js → script.js
 */

// ================================================================
//  1. 布局渲染函数 — 不同 content.layout 对应不同 HTML 结构
// ================================================================

function renderProfileSummaryGrid(items) {
  return '<div class="summary-grid">' + items.map(function (item) { return '<article class="summary-card"><h3>' + item.title + '</h3><p>' + item.value + '</p></article>'; }).join("") + '</div>';
}

function renderProfileBadgeGrid(items) {
  return '<div class="badge-grid">' + items.map(function (item) { return '<span class="badge">' + item + '</span>'; }).join("") + '</div>';
}

function renderProfileTimeline(items) {
  return '<div>' + items.map(function (item) {
    return '<div class="timeline-entry"><div class="timeline-dot"></div><div class="timeline-body"><h3>' + item.title + '</h3><time>' + (item.time || "") + '</time><p>' + (item.description || "") + '</p></div></div>';
  }).join("") + '</div>';
}

function renderProfileProse(paragraphs) {
  return '<div class="prose">' + paragraphs.map(function (text) { return '<p>' + text + '</p>'; }).join("") + '</div>';
}

function renderProfileChecklist(items) {
  return '<ul class="check-list">' + renderChecklistItems(items) + '</ul>';
}

// ================================================================
//  2. 区块渲染 — 主区块 / 侧栏区块
// ================================================================

function isAsideProfileBlock(block) {
  var content = block.content || {};
  return content.position === "aside" || content.position === "sidebar" || content.area === "aside";
}

function renderDynamicProfileBlock(block) {
  var content = block.content || {};
  var layout = content.layout || block.block_key;
  var bodyHtml = "";

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
    bodyHtml = '<div class="prose"><p>' + (typeof content === "string" ? content : JSON.stringify(content)) + '</p></div>';
  }

  return '<section class="panel content-card"><p class="section-kicker">' + (block.subtitle || "区块内容") + '</p><h2>' + block.title + '</h2>' + bodyHtml + '</section>';
}

function renderProfileAsideBlock(block) {
  var content = block.content || {};
  var layout = content.layout || "check-list";
  var bodyHtml = "";

  if ((layout === "check-list" || layout === "list") && Array.isArray(content.items)) {
    bodyHtml = renderProfileChecklist(content.items);
  } else if ((layout === "prose" || layout === "text") && Array.isArray(content.paragraphs)) {
    bodyHtml = renderProfileProse(content.paragraphs);
  } else if (Array.isArray(content.items)) {
    bodyHtml = renderProfileChecklist(content.items);
  } else {
    bodyHtml = '<div class="prose"><p>' + (typeof content === "string" ? content : JSON.stringify(content)) + '</p></div>';
  }

  return '<section class="panel toc-card"><p class="section-kicker">' + (block.subtitle || "侧栏区块") + '</p><h2>' + block.title + '</h2>' + bodyHtml + '</section>';
}

// ================================================================
//  3. 应用简历区块到 DOM
// ================================================================

async function applyProfileBlocks() {
  if (document.body.dataset.page !== "resume") return;

  var container = document.getElementById("profileBlocksContainer");
  var fallback = document.getElementById("profileBlocksFallback");
  var asideContainer = document.getElementById("profileAsideBlocksContainer");
  var asideFallback = document.getElementById("profileAsideBlocksFallback");
  if (!container || !fallback) return;

  var blocks = await resolveProfileBlocks();
  if (!blocks || blocks.length === 0) return;

  var mainBlocks = blocks.filter(function (block) { return !isAsideProfileBlock(block); });
  var asideBlocks = blocks.filter(isAsideProfileBlock);

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
