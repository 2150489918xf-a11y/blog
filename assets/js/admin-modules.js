/**
 * 管理后台 — 模块配置 + 工具函数
 * ==================================
 * 职责：定义所有 CMS 模块的字段、列表列、CRUD 回调，以及通用工具函数。
 *
 * 依赖：supabase.js（必须先加载，提供 BlogDB）
 * 加载顺序：supabase-core.js → supabase.js → admin-modules.js → admin-form.js → admin.js
 */

// ================================================================
//  1. 工具函数
// ================================================================

/** HTML 转义，防止 XSS */
function esc(s) {
  if (!s && s !== 0) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(d) {
  if (!d) return '';
  var t = new Date(d);
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}

function splitCommaValues(value) {
  return String(value || '')
    .split(',')
    .map(function (item) { return item.trim(); })
    .filter(Boolean);
}

function formatJsonText(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function parseMaybeJson(value) {
  var raw = String(value || '').trim();
  if (!raw) return '';

  if (/^(\{|\[|")/.test(raw)) {
    try {
      return JSON.parse(raw);
    } catch (_) {
      throw new Error('JSON 内容格式不正确');
    }
  }

  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);

  return raw;
}

function staticOptions(values) {
  return function () {
    return values.map(function (value) {
      return { label: value, value: value };
    });
  };
}

function pageOptions() {
  return [
    { label: '首页', value: 'home' },
    { label: '关于页', value: 'resume' },
    { label: '资源导航', value: 'resources' },
    { label: '联系页', value: 'contact' }
  ];
}

function sectionOptions() {
  return [
    { label: '首页轮播图', value: 'hero_carousel' },
    { label: '首页卡片组', value: 'note_board' },
    { label: '文章列表', value: 'article_feed' }
  ];
}

function pageLabel(value) {
  var map = { home: '首页', resume: '关于页', resources: '资源导航', contact: '联系页', settings: '站点设置' };
  return map[value] || value || '—';
}

function sectionLabel(value) {
  var map = { hero_carousel: '首页轮播', note_board: '首页卡片组', article_feed: '文章列表', usage_tips_card: '使用提示', contact_info_card: '联系方式', page_note_card: '页面说明' };
  return map[value] || value || '—';
}

function parseContentObject(value) {
  if (value && typeof value === 'object') return value;

  var raw = String(value || '').trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (_) {
    return {};
  }
}

// ================================================================
//  2. 异步选项加载（供 MODULES 字段的 options 回调使用）
// ================================================================

async function loadResourceGroupOptions() {
  var groups = await BlogDB.getAllResourceGroups();
  return groups.map(function (group) {
    return { label: group.name, value: group.id };
  });
}

async function loadCategoryOptions() {
  var categories = await BlogDB.getCategories();
  return (categories || []).map(function (c) {
    return { label: c.name, value: c.name };
  });
}

async function loadNavigationParentOptions() {
  var items = await BlogDB.getAllNavigationItems();
  return items.map(function (item) {
    return { label: item.label + ' · ' + item.href, value: item.id };
  });
}

async function loadResourceLinkRecords() {
  var groups = await BlogDB.getAllResourceGroups();
  var groupMap = groups.reduce(function (acc, group) {
    acc[group.id] = group.name;
    return acc;
  }, {});
  var links = await BlogDB.getAllResourceLinks();
  return links.map(function (link) {
    return Object.assign({}, link, {
      group_name: groupMap[link.group_id] || '未分组'
    });
  });
}

// ================================================================
//  3. 表单小部件初始化（Slug 自动生成 / 封面上传 / 标签输入 / Markdown 编辑器）
// ================================================================

function initGenericWidgets(moduleId) {
  var module = MODULES[moduleId];
  if (!module || !module.fields) return;

  var $moduleForm = document.getElementById('moduleForm');

  // ---- Slug 自动生成 ----
  var titleField = module.fields.find(function (f) { return f.name === 'title' || f.name === 'name'; });
  var slugField = module.fields.find(function (f) { return f.name === 'slug'; });
  if (titleField && slugField) {
    var $titleInput = $moduleForm.querySelector('[name="' + titleField.name + '"]');
    var $slugInput = $moduleForm.querySelector('[name="slug"]');
    if ($titleInput && $slugInput) {
      $titleInput.addEventListener('input', function () {
        if (!$slugInput.value || $slugInput.dataset.autoSlug === '1') {
          $slugInput.value = this.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
          $slugInput.dataset.autoSlug = '1';
        }
      });
      $slugInput.addEventListener('input', function () {
        this.dataset.autoSlug = '0';
      });
    }
  }

  // ---- 封面上传 ----
  var coverArea = $moduleForm.querySelector('[data-cover-area]');
  if (coverArea) {
    var coverHidden = $moduleForm.querySelector('[data-cover-hidden]');
    var coverPreview = $moduleForm.querySelector('[data-cover-preview]');
    var coverPreviewImg = $moduleForm.querySelector('[data-cover-preview-img]');
    var coverPlaceholder = $moduleForm.querySelector('[data-cover-placeholder]');
    var coverRemove = $moduleForm.querySelector('[data-cover-remove]');

    var coverFileInput = document.createElement('input');
    coverFileInput.type = 'file';
    coverFileInput.accept = 'image/*';
    coverFileInput.style.display = 'none';
    coverArea.appendChild(coverFileInput);

    function updateCoverPreview(url) {
      if (url) {
        coverPreviewImg.src = url;
        coverPreview.style.display = 'block';
        coverPlaceholder.style.display = 'none';
        coverHidden.value = url;
      } else {
        coverPreview.style.display = 'none';
        coverPlaceholder.style.display = '';
        coverHidden.value = '';
      }
    }

    coverArea.addEventListener('click', function () { coverFileInput.click(); });
    coverFileInput.addEventListener('change', async function (e) {
      if (e.target.files.length > 0) {
        var file = e.target.files[0];
        if (!file.type.startsWith('image/')) return;
        if (window.adminToast) window.adminToast('正在上传封面...', 'info');
        try {
          var url = await BlogDB.uploadImage(file, 'covers');
          updateCoverPreview(url);
          if (window.adminToast) window.adminToast('封面上传成功', 'success');
        } catch (err) {
          if (window.adminToast) window.adminToast('封面上传失败: ' + err.message, 'error');
        }
      }
    });
    coverRemove.addEventListener('click', function (e) {
      e.stopPropagation();
      updateCoverPreview('');
      coverFileInput.value = '';
    });
  }

  // ---- 标签输入 ----
  var tagWrapper = $moduleForm.querySelector('[data-tag-wrapper]');
  if (tagWrapper) {
    var tagHidden = $moduleForm.querySelector('[data-tags-hidden]');
    var tagInput = $moduleForm.querySelector('[data-tag-input]');
    var tags = tagHidden.value ? splitCommaValues(tagHidden.value) : [];

    function syncTags() {
      tagHidden.value = tags.join(', ');
      var pills = tagWrapper.querySelectorAll('.tag-pill');
      pills.forEach(function (p) { p.remove(); });
      tags.forEach(function (tag, idx) {
        var pill = document.createElement('span');
        pill.className = 'tag-pill';
        pill.innerHTML = esc(tag) + ' <span class="tag-remove" data-tag-idx="' + idx + '">&times;</span>';
        tagWrapper.insertBefore(pill, tagInput);
      });
    }

    tagWrapper.addEventListener('click', function (e) {
      if (e.target.classList.contains('tag-remove')) {
        var idx = parseInt(e.target.dataset.tagIdx, 10);
        tags.splice(idx, 1);
        syncTags();
      }
    });

    tagInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var val = tagInput.value.trim();
        if (val && tags.indexOf(val) === -1) {
          tags.push(val);
          syncTags();
        }
        tagInput.value = '';
      }
    });
  }

  // ---- Markdown 编辑器初始化 ----
  var mdEditors = $moduleForm.querySelectorAll('[data-md-editor]');
  mdEditors.forEach(function (editor) {
    var mdInput = editor.querySelector('[data-md-input]');
    var mdPreview = editor.querySelector('[data-md-preview]');
    if (!mdInput || !mdPreview) return;

    function renderMD(text) {
      var html = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;">')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      return '<p>' + html + '</p>';
    }

    function updateMDPreview() {
      mdPreview.innerHTML = renderMD(mdInput.value);
    }

    mdInput.addEventListener('input', updateMDPreview);
    mdInput.addEventListener('paste', function (e) {
      var items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          var file = items[i].getAsFile();
          if (file) {
            if (window.adminToast) window.adminToast('正在上传图片...', 'info');
            BlogDB.uploadImage(file, 'articles').then(function (url) {
              var mdVal = mdInput.value;
              var imgMd = '\n![' + (file.name || 'image') + '](' + url + ')\n';
              var start = mdInput.selectionStart;
              mdInput.value = mdVal.substring(0, start) + imgMd + mdVal.substring(mdInput.selectionEnd);
              mdInput.focus();
              updateMDPreview();
              if (window.adminToast) window.adminToast('图片上传成功', 'success');
            }).catch(function (err) {
              if (window.adminToast) window.adminToast('图片上传失败: ' + err.message, 'error');
            });
          }
        }
      }
    });

    editor.querySelectorAll('[data-md-tool]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var prefix = btn.getAttribute('data-md-tool');
        var suffix = btn.getAttribute('data-md-suffix') || '';
        var start = mdInput.selectionStart;
        var end = mdInput.selectionEnd;
        var text = mdInput.value;
        var selected = text.substring(start, end);
        var replacement = prefix + selected + suffix;
        mdInput.value = text.substring(0, start) + replacement + text.substring(end);
        mdInput.focus();
        mdInput.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
        updateMDPreview();
      });
    });

    updateMDPreview();
  });
}

// ================================================================
//  4. 模块定义 — 每个管理模块的字段、列表列、CRUD 回调
// ================================================================

var MODULES = {
  // ----- 文章模块 -----
  articles: {
    type: 'generic',
    kicker: 'Content Manager',
    title: '文章管理',
    description: '管理文章的标题、分类、标签、Markdown 内容和发布状态。',
    actionLabel: '新建文章',
    implemented: true,
    listTitle: '文章列表',
    columns: [
      { key: 'title', label: '标题' },
      { key: 'category', label: '分类' },
      { key: 'published', label: '状态', html: true, format: function (v) { return v ? '<span class="status-dot published"></span>已发布' : '<span class="status-dot draft"></span>草稿'; } },
      { key: 'updated_at', label: '更新时间', format: fmtDate },
    ],
    fields: [
      { name: 'title', label: '文章标题', type: 'text', required: true },
      { name: 'slug', label: 'URL 路径名', type: 'text', placeholder: '输入标题后自动生成' },
      { name: 'summary', label: '内容摘要', type: 'textarea', full: true, placeholder: '简要描述文章核心内容...' },
      { name: 'category', label: '所属分类', type: 'datalist', placeholder: '如：学习笔记', options: loadCategoryOptions },
      { name: 'read_time', label: '预计阅读（分钟）', type: 'number', defaultValue: 5 },
      { name: 'cover_url', label: '封面图片', type: 'cover' },
      { name: 'tags', label: '标签（按回车添加）', type: 'tags', parse: splitCommaValues },
      { name: 'content', label: '正文内容（Markdown）', type: 'markdown', full: true, placeholder: '在此输入文章正文...' },
      { name: 'published', label: '立即发布（访客可见）', type: 'checkbox', defaultValue: true },
    ],
    loadRecords: function () { return BlogDB.getAllArticles(); },
    createRecord: function (payload) { return BlogDB.createArticle(payload); },
    updateRecord: function (id, payload) { return BlogDB.updateArticle(id, payload); },
    deleteRecord: function (id) { return BlogDB.deleteArticle(id); },
    toggleRecord: function (id, current) { return BlogDB.togglePublish(id, !current); },
    afterRender: initGenericWidgets
  },
  projects: {
    type: 'generic',
    kicker: 'Project Library',
    title: '项目管理',
    description: '管理项目卡片、技术栈、链接与展示顺序。',
    actionLabel: '新建项目',
    implemented: true,
    listTitle: '项目列表',
    columns: [
      { key: 'title', label: '标题' },
      { key: 'tech_tags', label: '技术栈', format: function (v) { return Array.isArray(v) ? v.join(', ') : (v || ''); } },
      { key: 'status', label: '状态' },
      { key: 'sort_order', label: '排序' },
      { key: 'published', label: '可见', format: function (value) { return value ? '已发布' : '草稿'; } }
    ],
    fields: [
      { name: 'title', label: '项目标题', type: 'text', required: true },
      { name: 'slug', label: 'URL 路径名', type: 'text', placeholder: '输入标题后自动生成' },
      { name: 'cover_url', label: '封面图片', type: 'cover' },
      { name: 'summary', label: '项目摘要', type: 'textarea', full: true },
      { name: 'description', label: '项目详细介绍（支持 Markdown）', type: 'markdown', full: true },
      { name: 'status', label: '项目状态', type: 'select', options: staticOptions(['进行中', '已完成', '待开始']) },
      { name: 'tech_tags', label: '技术标签', type: 'tags', parse: splitCommaValues },
      { name: 'demo_url', label: '演示地址', type: 'url' },
      { name: 'repo_url', label: '仓库地址', type: 'url' },
      { name: 'sort_order', label: '排序', type: 'number', defaultValue: 0 },
      { name: 'published', label: '立即发布', type: 'checkbox', defaultValue: true }
    ],
    loadRecords: function () { return BlogDB.getAllProjects(); },
    createRecord: function (payload) { return BlogDB.createProject(payload); },
    updateRecord: function (id, payload) { return BlogDB.updateProject(id, payload); },
    deleteRecord: function (id) { return BlogDB.deleteProject(id); },
    toggleRecord: function (id, current) { return BlogDB.updateProject(id, { published: !current }); },
    afterRender: initGenericWidgets
  },
  resource_groups: {
    type: 'generic',
    kicker: 'Resource Groups',
    title: '资源分组',
    description: '管理资源导航页的分组标题、描述和展示顺序。',
    actionLabel: '新建分组',
    implemented: true,
    listTitle: '资源分组列表',
    columns: [
      { key: 'name', label: '名称' },
      { key: 'description', label: '描述', format: function (v) { return (v || '').slice(0, 40) + ((v || '').length > 40 ? '...' : ''); } },
      { key: 'sort_order', label: '排序' },
      { key: 'published', label: '可见', format: function (value) { return value ? '显示' : '隐藏'; } }
    ],
    fields: [
      { name: 'name', label: '分组名称', type: 'text', required: true },
      { name: 'slug', label: 'URL 路径名', type: 'text', placeholder: '输入名称后自动生成' },
      { name: 'description', label: '分组描述', type: 'textarea', full: true },
      { name: 'sort_order', label: '排序', type: 'number', defaultValue: 0 },
      { name: 'published', label: '显示该分组', type: 'checkbox', defaultValue: true }
    ],
    loadRecords: function () { return BlogDB.getAllResourceGroups(); },
    createRecord: function (payload) { return BlogDB.createResourceGroup(payload); },
    updateRecord: function (id, payload) { return BlogDB.updateResourceGroup(id, payload); },
    deleteRecord: function (id) { return BlogDB.deleteResourceGroup(id); },
    toggleRecord: function (id, current) { return BlogDB.updateResourceGroup(id, { published: !current }); },
    afterRender: initGenericWidgets
  },
  resource_links: {
    type: 'generic',
    kicker: 'Resource Links',
    title: '资源链接',
    description: '管理资源导航中的具体链接，并绑定到对应分组。',
    actionLabel: '新建链接',
    implemented: true,
    listTitle: '资源链接列表',
    columns: [
      { key: 'title', label: '标题' },
      { key: 'group_name', label: '所属分组' },
      { key: 'href', label: '链接地址', format: function (v) { var t = (v || '').replace(/^https?:\/\//, ''); return t.length > 30 ? t.slice(0, 30) + '...' : t; } },
      { key: 'published', label: '可见', format: function (value) { return value ? '显示' : '隐藏'; } }
    ],
    fields: [
      { name: 'group_id', label: '所属分组', type: 'select', required: true, options: loadResourceGroupOptions },
      { name: 'title', label: '链接标题', type: 'text', required: true },
      { name: 'href', label: '跳转地址', type: 'url', required: true, full: true, placeholder: 'https://...' },
      { name: 'label', label: '角标文字', type: 'text', placeholder: '如：推荐、常用、官方，留空则不显示' },
      { name: 'description', label: '链接描述', type: 'textarea', full: true },
      { name: 'sort_order', label: '排序', type: 'number', defaultValue: 0 },
      { name: 'published', label: '显示该链接', type: 'checkbox', defaultValue: true }
    ],
    loadRecords: loadResourceLinkRecords,
    createRecord: function (payload) { return BlogDB.createResourceLink(payload); },
    updateRecord: function (id, payload) { return BlogDB.updateResourceLink(id, payload); },
    deleteRecord: function (id) { return BlogDB.deleteResourceLink(id); },
    toggleRecord: function (id, current) { return BlogDB.updateResourceLink(id, { published: !current }); },
    afterRender: initGenericWidgets
  },
  schedule: {
    type: 'generic',
    kicker: 'Schedule Manager',
    title: '表格内容',
    description: '管理学习计划表格中的任务、时间、目标和进度状态。',
    actionLabel: '新建任务',
    implemented: true,
    listTitle: '任务列表',
    columns: [
      { key: 'task_name', label: '任务名称' },
      { key: 'time_range', label: '时间安排', format: function (v) { return (v || '').length > 24 ? (v || '').slice(0, 24) + '...' : (v || ''); } },
      { key: 'status', label: '状态', html: true, format: function (v) { var map = { '待开始': '<span class="status-dot draft"></span>待开始', '进行中': '<span class="status-dot" style="background:#3b82f6;"></span>进行中', '已完成': '<span class="status-dot published"></span>已完成' }; return map[v] || (v || '—'); } },
      { key: 'sort_order', label: '排序' },
      { key: 'published', label: '可见', format: function (value) { return value ? '显示' : '隐藏'; } }
    ],
    fields: [
      { name: 'task_name', label: '任务名称', type: 'text', required: true, placeholder: '如：学习 React 基础' },
      { name: 'time_range', label: '时间安排', type: 'text', placeholder: '如：第 1-2 周 或 2026.03' },
      { name: 'status', label: '当前状态', type: 'select', options: staticOptions(['待开始', '进行中', '已完成']) },
      { name: 'goal', label: '目标说明', type: 'textarea', full: true, placeholder: '描述该阶段的具体目标和预期成果' },
      { name: 'sort_order', label: '排序', type: 'number', defaultValue: 0 },
      { name: 'published', label: '显示该任务', type: 'checkbox', defaultValue: true }
    ],
    loadRecords: function () { return BlogDB.getAllScheduleItems(); },
    createRecord: function (payload) { return BlogDB.createScheduleItem(payload); },
    updateRecord: function (id, payload) { return BlogDB.updateScheduleItem(id, payload); },
    deleteRecord: function (id) { return BlogDB.deleteScheduleItem(id); },
    toggleRecord: function (id, current) { return BlogDB.updateScheduleItem(id, { published: !current }); }
  },
  site_settings: {
    type: 'generic',
    kicker: 'Site Config',
    title: '站点设置',
    description: '管理站点品牌、作者资料、页脚文字等全站基础配置。',
    actionLabel: '新建设置',
    implemented: true,
    listTitle: '设置列表',
    columns: [
      { key: 'setting_key', label: '键名' },
      { key: 'label', label: '说明' },
      { key: 'value_preview', label: '当前值', format: function (v) { var t = (v || '').replace(/\s+/g, ' '); return t.length > 40 ? t.slice(0, 40) + '...' : t; } }
    ],
    fields: [
      { name: 'setting_key', label: '设置键名', type: 'datalist', required: true, placeholder: '选择或输入自定义键名', options: staticOptions(['site_name', 'site_description', 'brand_name', 'brand_subtitle', 'brand_mark', 'author_name', 'author_bio', 'author_avatar', 'author_social_links', 'contact_email', 'contact_github', 'contact_school', 'contact_major', 'contact_grade', 'resume_meta', 'resume_summary', 'resume_avatar_text', 'footer_text', 'hero_title', 'hero_subtitle', 'seo_keywords', 'custom_css']) },
      { name: 'label', label: '中文说明', type: 'text', placeholder: '如：站点名称、作者简介' },
      { name: 'setting_value', label: '设置内容', type: 'textarea', full: true, format: formatJsonText, parse: parseMaybeJson, placeholder: '可输入普通文本，或 JSON 对象 / 数组用于复杂配置' }
    ],
    loadRecords: function () {
      return BlogDB.getAllSiteSettings().then(function (rows) {
        return rows.map(function (row) {
          return Object.assign({}, row, {
            value_preview: formatJsonText(row.setting_value).replace(/\s+/g, ' ').slice(0, 60)
          });
        });
      });
    },
    createRecord: function (payload) { return BlogDB.upsertSiteSetting(payload); },
    updateRecord: function (_id, payload) { return BlogDB.upsertSiteSetting(payload); },
    deleteRecord: function (id) { return BlogDB.deleteSiteSetting(id); }
  },
  navigation_items: {
    type: 'generic',
    kicker: 'Navigation Builder',
    title: '导航配置',
    description: '管理全站顶部导航的标题、链接、图标、打开方式和显示顺序。',
    actionLabel: '新建导航项',
    implemented: true,
    listTitle: '导航项列表',
    visibilityField: 'visible',
    columns: [
      { key: 'label', label: '标题' },
      { key: 'href', label: '链接', format: function (v) { var t = (v || '').replace(/^https?:\/\//, ''); return t.length > 28 ? t.slice(0, 28) + '...' : t; } },
      { key: 'icon', label: '图标', html: true, format: function (v) { return v ? '<i class="' + v + '" style="color:var(--accent);"></i> ' + v : '—'; } },
      { key: 'sort_order', label: '顺序' },
      { key: 'visible', label: '显示', format: function (value) { return value ? '显示' : '隐藏'; } }
    ],
    fields: [
      { name: 'label', label: '标题', type: 'text', required: true, placeholder: '如：首页' },
      { name: 'href', label: '链接地址', type: 'text', required: true, placeholder: '/ 或 /about.html 或 https://...' },
      { name: 'icon', label: '图标类名', type: 'text', placeholder: 'fas fa-home（Font Awesome 图标）' },
      { name: 'parent_id', label: '父级导航', type: 'select', options: loadNavigationParentOptions },
      { name: 'target', label: '打开方式', type: 'select', options: staticOptions(['_self', '_blank']) },
      { name: 'sort_order', label: '排序', type: 'number', defaultValue: 0 },
      { name: 'visible', label: '显示该导航项', type: 'checkbox', defaultValue: true }
    ],
    loadRecords: function () { return BlogDB.getAllNavigationItems(); },
    createRecord: function (payload) { return BlogDB.createNavigationItem(payload); },
    updateRecord: function (id, payload) { return BlogDB.updateNavigationItem(id, payload); },
    deleteRecord: function (id) { return BlogDB.deleteNavigationItem(id); },
    toggleRecord: function (id, current) { return BlogDB.updateNavigationItem(id, { visible: !current }); }
  },
  page_sections: {
    type: 'generic',
    kicker: '内容管理',
    title: '页面内容',
    description: '管理网站上各个页面的内容模块，比如首页轮播图、文章列表、作者卡片等，下方有可视化编辑器帮助你配置。',
    actionLabel: '新建内容模块',
    implemented: true,
    listTitle: '内容模块列表',
    columns: [
      { key: 'page_key', label: '所在页面', format: pageLabel },
      { key: 'section_key', label: '模块类型', format: sectionLabel },
      { key: 'title', label: '标题' },
      { key: 'description', label: '描述', format: function (v) { return (v || '').slice(0, 30) + ((v || '').length > 30 ? '...' : '') || '—'; } },
      { key: 'sort_order', label: '排序' },
      { key: 'published', label: '显示', format: function (value) { return value ? '显示' : '隐藏'; } }
    ],
    fields: [
      { name: 'page_key', label: '展示在哪个页面', type: 'select', required: true, options: pageOptions },
      { name: 'section_key', label: '内容类型', type: 'select', required: true, options: sectionOptions },
      { name: 'title', label: '模块标题', type: 'text', placeholder: '如：精选内容、最新文章' },
      { name: 'eyebrow', label: '标签文字', type: 'text', placeholder: '如：精选 / LATEST（显示在标题上方的小字）' },
      { name: 'description', label: '简单说明', type: 'textarea', full: true, placeholder: '简单描述这个模块的用途（部分位置会显示这段文字）' },
      { name: 'content', label: '内容配置', type: 'textarea', full: true, format: formatJsonText, parse: parseMaybeJson, placeholder: '下方可视化编辑器会自动填充此区域，无需手动填写' },
      { name: 'sort_order', label: '显示顺序', type: 'number', defaultValue: 0 },
      { name: 'published', label: '在网站上显示', type: 'checkbox', defaultValue: true }
    ],
    loadRecords: function () { return BlogDB.getAllPageSections(); },
    createRecord: function (payload) { return BlogDB.createPageSection(payload); },
    updateRecord: function (id, payload) { return BlogDB.updatePageSection(id, payload); },
    deleteRecord: function (id) { return BlogDB.deletePageSection(id); },
    toggleRecord: function (id, current) { return BlogDB.updatePageSection(id, { published: !current }); },
    afterRender: function (id) { window.StructuredEditor.init(id); }
  },
  profile_blocks: {
    type: 'generic',
    kicker: 'Resume Blocks',
    title: '简历区块',
    description: '管理关于页主栏与侧栏区块，支持 summary-grid、badge-grid、timeline、prose、check-list 等布局，配备可视化编辑器。',
    actionLabel: '新建简历区块',
    implemented: true,
    listTitle: '简历区块列表',
    columns: [
      { key: 'block_key', label: '区块键' },
      { key: 'title', label: '标题' },
      { key: 'subtitle', label: '副标题', format: function (v) { return v || '—'; } },
      { key: 'content_type', label: '内容类型', format: function (v, record) { try { var c = typeof record.content === 'object' ? record.content : JSON.parse(record.content || '{}'); return c.layout || (Array.isArray(c.items) ? '列表' : '—'); } catch (_) { return '—'; } } },
      { key: 'sort_order', label: '排序' },
      { key: 'published', label: '显示', format: function (value) { return value ? '显示' : '隐藏'; } }
    ],
    fields: [
      { name: 'block_key', label: '区块键名', type: 'datalist', required: true, placeholder: '选择或输入，如：skills', options: staticOptions(['basic_info', 'skills', 'interests', 'timeline', 'self_evaluation', 'contact', 'social_links']) },
      { name: 'title', label: '标题', type: 'text', required: true, placeholder: '如：专业技能' },
      { name: 'subtitle', label: '副标题', type: 'text', placeholder: '如：My Skills' },
      { name: 'content', label: '区块内容', type: 'textarea', full: true, format: formatJsonText, parse: parseMaybeJson, placeholder: '{"layout":"check-list","position":"aside","items":[...]}' },
      { name: 'sort_order', label: '排序', type: 'number', defaultValue: 0 },
      { name: 'published', label: '显示该区块', type: 'checkbox', defaultValue: true }
    ],
    loadRecords: function () { return BlogDB.getAllProfileBlocks(); },
    createRecord: function (payload) { return BlogDB.createProfileBlock(payload); },
    updateRecord: function (id, payload) { return BlogDB.updateProfileBlock(id, payload); },
    deleteRecord: function (id) { return BlogDB.deleteProfileBlock(id); },
    toggleRecord: function (id, current) { return BlogDB.updateProfileBlock(id, { published: !current }); },
    afterRender: function (id) { window.StructuredEditor.init(id); }
  },
};
