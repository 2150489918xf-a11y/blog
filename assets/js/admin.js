/**
 * 管理后台 — CMS 面板
 * ===================
 * 职责：提供完整的内容管理系统，包括文章/项目/资源/设置等模块的增删改查。
 *
 * 架构：
 *   - MODULES 对象定义所有管理模块的配置（字段、列表、CRUD 回调）
 *   - 通用表单构建器 buildFieldHtml() 根据字段配置自动生成表单
 *   - 通用列表渲染器 loadGenericList() 根据列配置自动生成表格
 *   - 结构化内容编辑器（见 structured-editor.js）为页面区块/简历提供可视编辑
 *
 * 认证：
 *   - 使用 Supabase Auth 邮箱 + 密码登录
 *   - 登录状态持久化（localStorage session）
 *
 * 模块切换：
 *   左侧导航按钮切换 activeModule → syncModuleView() → 显示对应列表/编辑器
 */

(function () {

  // ================================================================
  //  1. 模块定义 — 每个管理模块的字段、列表列、CRUD 回调
  // ================================================================
  var MODULES = {
    // ----- 文章模块（通用类型，含 Markdown 编辑器）-----
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

  // ================================================================
  //  2. 全局状态
  // ================================================================
  var state = {
    activeModule: 'articles',
    isEditingArticle: false,
    isEditingGeneric: false,
    currentTags: [],
    genericRecordId: null,
    recordCache: {}
  };

  var $loginScreen = document.getElementById('loginScreen');
  var $adminPanel = document.getElementById('adminPanel');
  var $loginForm = document.getElementById('loginForm');
  var $loginError = document.getElementById('loginError');
  var $adminEmail = document.getElementById('adminEmail');
  var $articleListContainer = document.getElementById('articleListContainer');
  var $editorCard = document.getElementById('editorCard');
  var $articleListCard = document.getElementById('articleListCard');
  var $moduleListCard = document.getElementById('moduleListCard');
  var $moduleListContainer = document.getElementById('moduleListContainer');
  var $moduleListTitle = document.getElementById('moduleListTitle');
  var $moduleListMeta = document.getElementById('moduleListMeta');
  var $moduleEditorCard = document.getElementById('moduleEditorCard');
  var $moduleEditorTitle = document.getElementById('moduleEditorTitle');
  var $moduleForm = document.getElementById('moduleForm');
  var $btnSaveModule = document.getElementById('btnSaveModule');
  var $btnCancelModuleEdit = document.getElementById('btnCancelModuleEdit');
  var $btnNewArticle = document.getElementById('btnNewArticle');
  var $btnCancelEdit = document.getElementById('btnCancelEdit');
  var $btnSaveArticle = document.getElementById('btnSaveArticle');
  var $btnLogout = document.getElementById('btnLogout');
  var $mdInput = document.getElementById('mdInput');
  var $mdPreview = document.getElementById('mdPreview');
  var $dropZone = document.getElementById('dropZone');
  var $fileInput = document.getElementById('fileInput');
  var $coverUploadArea = document.getElementById('coverUploadArea');
  var $coverFileInput = document.getElementById('coverFileInput');
  var $coverPreview = document.getElementById('coverPreview');
  var $coverPreviewImg = document.getElementById('coverPreviewImg');
  var $coverPlaceholder = document.getElementById('coverPlaceholder');
  var $btnRemoveCover = document.getElementById('btnRemoveCover');
  var $articleCoverUrl = document.getElementById('articleCoverUrl');
  var $btnApplyCoverUrl = document.getElementById('btnApplyCoverUrl');
  var $articleCover = document.getElementById('articleCover');
  var $tagInput = document.getElementById('tagInput');
  var $tagWrapper = document.getElementById('tagWrapper');
  var $toastContainer = document.getElementById('toastContainer');
  var $moduleKicker = document.getElementById('moduleKicker');
  var $moduleTitle = document.getElementById('moduleTitle');
  var $moduleDescription = document.getElementById('moduleDescription');
  var $modulePlaceholder = document.getElementById('modulePlaceholder');
  var $modulePlaceholderTitle = document.getElementById('modulePlaceholderTitle');
  var $modulePlaceholderText = document.getElementById('modulePlaceholderText');
  var $moduleButtons = Array.prototype.slice.call(document.querySelectorAll('[data-admin-module]'));

  function $(id) {
    return document.getElementById(id);
  }

  /** 显示 Toast 提示消息（3.5 秒自动消失） */
  function toast(msg, type) {
    type = type || 'info';
    var el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    $toastContainer.appendChild(el);
    setTimeout(function () { el.remove(); }, 3500);
  }

  // ---- 异步选项加载（供 MODULES 字段的 options 回调使用）----

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
  //  3. 工具函数
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

  function initGenericWidgets(moduleId) {
    var module = MODULES[moduleId];
    if (!module || !module.fields) return;

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

      // 创建隐藏的 file input
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
          toast('正在上传封面...', 'info');
          try {
            var url = await BlogDB.uploadImage(file, 'covers');
            updateCoverPreview(url);
            toast('封面上传成功', 'success');
          } catch (err) {
            toast('封面上传失败: ' + err.message, 'error');
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

    // ---- Markdown 编辑器初始化（用于 description 等 markdown 类型字段）----
    var mdEditors = $moduleForm.querySelectorAll('[data-md-editor]');
    mdEditors.forEach(function (editor) {
      var mdInput = editor.querySelector('[data-md-input]');
      var mdPreview = editor.querySelector('[data-md-preview]');
      if (!mdInput || !mdPreview) return;

      // 简易 Markdown → HTML 渲染
      function renderMD(text) {
        var html = text
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          // 图片
          .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;">')
          // 链接
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
          // 标题
          .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
          .replace(/^### (.+)$/gm, '<h3>$1</h3>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^# (.+)$/gm, '<h1>$1</h1>')
          // 粗体/斜体
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          // 引用
          .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
          // 无序列表
          .replace(/^- (.+)$/gm, '<li>$1</li>')
          .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
          // 段落
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
              toast('正在上传图片...', 'info');
              BlogDB.uploadImage(file, 'articles').then(function (url) {
                var mdVal = mdInput.value;
                var imgMd = '\n![' + (file.name || 'image') + '](' + url + ')\n';
                var start = mdInput.selectionStart;
                mdInput.value = mdVal.substring(0, start) + imgMd + mdVal.substring(mdInput.selectionEnd);
                mdInput.focus();
                updateMDPreview();
                toast('图片上传成功', 'success');
              }).catch(function (err) {
                toast('图片上传失败: ' + err.message, 'error');
              });
            }
          }
        }
      });

      // 工具栏按钮
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

      // 初始渲染
      updateMDPreview();
    });
  }

  // ---- 轮播编辑器辅助函数 ----

  // ----- 轮播自动填充辅助函数 -----

  function md2html(md) {
    if (!md) return '';
    var html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)/g, function (m) { return '<ul>' + m + '</ul>'; })
      .replace(/\n\n/g, '</p><p>');
    return '<p>' + html + '</p>';
  }

  function renderTags() {
    var pills = $tagWrapper.querySelectorAll('.tag-pill');
    pills.forEach(function (pill) { pill.remove(); });
    state.currentTags.forEach(function (tag, idx) {
      var pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.innerHTML = esc(tag) + ' <span class="tag-remove" data-idx="' + idx + '">&times;</span>';
      $tagWrapper.insertBefore(pill, $tagInput);
    });
  }

  function updatePreview() {
    $mdPreview.innerHTML = md2html($mdInput.value);
  }

  // ============ 编辑器工具栏与粘贴功能 ============
  // ================================================================
  //  11. 文章 Markdown 编辑器（全局函数，供 HTML 内联 onclick 调用）
  // ================================================================

  window._insertMD = function (prefix, suffix) {
    suffix = suffix || '';
    var start = $mdInput.selectionStart;
    var end = $mdInput.selectionEnd;
    var text = $mdInput.value;
    var selected = text.substring(start, end);
    var replacement = prefix + selected + suffix;
    $mdInput.value = text.substring(0, start) + replacement + text.substring(end);
    $mdInput.focus();
    $mdInput.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    updatePreview();
  };

  async function handlePaste(e) {
    var items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        var file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          uploadFile(file);
        }
      }
    }
  }

  function currentModule() {
    return MODULES[state.activeModule] || MODULES.articles;
  }

  // ================================================================
  //  6. 模块视图切换
  // ================================================================

  function syncModuleView() {
    var module = currentModule();
    var isImplemented = module.implemented;
    var showList = isImplemented && !state.isEditingGeneric;
    var showEditor = isImplemented && state.isEditingGeneric;

    $moduleKicker.textContent = module.kicker;
    $moduleTitle.textContent = module.title;
    $moduleDescription.textContent = module.description;

    $moduleButtons.forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.adminModule === state.activeModule);
    });

    $btnNewArticle.innerHTML = '<i class="fas fa-plus"></i> ' + module.actionLabel;
    $btnNewArticle.hidden = !isImplemented;

    // 文章和通用模块统一使用 moduleListCard / moduleEditorCard
    $articleListCard.style.display = 'none';
    $editorCard.style.display = 'none';
    $moduleListCard.style.display = showList ? 'block' : 'none';
    $moduleEditorCard.style.display = showEditor ? 'block' : 'none';

    $modulePlaceholder.hidden = isImplemented;
    if (!module.implemented) {
      $modulePlaceholderTitle.textContent = module.placeholderTitle;
      $modulePlaceholderText.textContent = module.placeholderText;
    }
  }

  async function uploadFile(file) {
    if (!file.type.startsWith('image/')) return;
    toast('正在上传 ' + file.name + '...', 'info');

    try {
      var url = await BlogDB.uploadImage(file);
      // 插入到光标位置
      var start = $mdInput.selectionStart;
      var end = $mdInput.selectionEnd;
      var text = $mdInput.value;
      var mdImg = '\n![' + file.name + '](' + url + ')\n';
      $mdInput.value = text.substring(0, start) + mdImg + text.substring(end);
      $mdInput.focus();
      $mdInput.setSelectionRange(start + mdImg.length, start + mdImg.length);
      updatePreview();
      toast('图片已插入正文', 'success');
    } catch (err) {
      toast('上传失败: ' + err.message, 'error');
    }
  }

  function updateCoverPreview(url) {
    if (url) {
      $coverPreviewImg.src = url;
      $coverPreview.style.display = 'block';
      $coverPlaceholder.style.display = 'none';
      $articleCover.value = url;
      $articleCoverUrl.value = url;
    } else {
      $coverPreview.style.display = 'none';
      $coverPlaceholder.style.display = '';
      $articleCover.value = '';
      $articleCoverUrl.value = '';
    }
  }

  async function uploadCoverFile(file) {
    if (!file.type.startsWith('image/')) return;
    toast('正在上传封面...', 'info');

    try {
      var url = await BlogDB.uploadImage(file, 'covers');
      updateCoverPreview(url);
      toast('封面上传成功', 'success');
    } catch (err) {
      toast('封面上传失败: ' + err.message, 'error');
    }
  }

  function applyCoverUrl() {
    var url = $articleCoverUrl.value.trim();
    if (!url) {
      toast('请输入封面图片 URL', 'error');
      return;
    }
    updateCoverPreview(url);
  }

  function removeCover() {
    updateCoverPreview('');
    $coverFileInput.value = '';
    toast('封面已移除');
  }

  // ================================================================
  //  7. 文章管理（专属编辑器）
  // ================================================================

  function renderArticleTable(articles) {
    if (articles.length === 0) {
      $articleListContainer.innerHTML = '<p style="color:var(--text-soft);text-align:center;padding:40px;">还没有文章，点击上方「新建文章」开始创作。</p>';
      return;
    }

    var rows = articles.map(function (article) {
      return '<tr>' +
        '<td class="title-cell">' + esc(article.title) + '</td>' +
        '<td>' + esc(article.category || '未分类') + '</td>' +
        '<td><span class="status-dot ' + (article.published ? 'published' : 'draft') + '"></span>' + (article.published ? '已发布' : '草稿') + '</td>' +
        '<td>' + fmtDate(article.created_at) + '</td>' +
        '<td><div class="action-group">' +
          '<button onclick="window._edit(\'' + article.id + '\')"><i class="fas fa-pen"></i></button>' +
          '<button onclick="window._toggle(\'' + article.id + '\',' + article.published + ')"><i class="fas fa-' + (article.published ? 'eye-slash' : 'eye') + '"></i></button>' +
          '<button class="danger" onclick="window._del(\'' + article.id + '\')"><i class="fas fa-trash"></i></button>' +
        '</div></td></tr>';
    }).join('');

    $articleListContainer.innerHTML = '<table class="article-table"><thead><tr><th>标题</th><th>分类</th><th>状态</th><th>时间</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  async function loadArticleList() {
    // 有缓存直接渲染
    if (state.recordCache.articles) {
      renderArticleTable(state.recordCache.articles);
      return;
    }

    $articleListContainer.innerHTML = '<p style="color:var(--text-soft);text-align:center;padding:60px;">加载中...</p>';

    try {
      var articles = await BlogDB.getAllArticles();
      state.recordCache.articles = articles;
      renderArticleTable(articles);
    } catch (err) {
      $articleListContainer.innerHTML = '<p style="color:#ef4444;text-align:center;padding:40px;">加载失败: ' + err.message + '</p>';
    }
  }

  function showEditor(article) {
    state.activeModule = 'articles';
    state.isEditingArticle = true;
    state.currentTags = [];

    if (article) {
      $('articleId').value = article.id;
      $('articleTitle').value = article.title || '';
      $('articleSlug').value = article.slug || '';
      $('articleSummary').value = article.summary || '';
      $('articleCategory').value = article.category || '';
      $('articleReadTime').value = article.read_time || 5;
      $('articleCover').value = article.cover_url || '';
      updateCoverPreview(article.cover_url || '');
      $mdInput.value = article.content || '';
      $('articlePublished').checked = article.published !== false;
      state.currentTags = article.tags || [];
      document.getElementById('editorTitle').innerHTML = '<i class="fas fa-pen-to-square"></i> 编辑文章';
    } else {
      $('articleId').value = '';
      $('articleTitle').value = '';
      $('articleSlug').value = '';
      $('articleSummary').value = '';
      $('articleCategory').value = '';
      $('articleReadTime').value = 5;
      $('articleCover').value = '';
      updateCoverPreview('');
      $mdInput.value = '';
      $('articlePublished').checked = true;
      document.getElementById('editorTitle').innerHTML = '<i class="fas fa-plus"></i> 新建文章';
    }

    renderTags();
    updatePreview();
    syncModuleView();
  }

  function hideEditor() {
    state.isEditingArticle = false;
    syncModuleView();
  }

  async function saveArticle() {
    var article = {
      title: $('articleTitle').value.trim(),
      slug: $('articleSlug').value.trim(),
      summary: $('articleSummary').value.trim(),
      content: $mdInput.value,
      cover_url: $('articleCover').value.trim(),
      category: $('articleCategory').value.trim(),
      tags: state.currentTags,
      read_time: parseInt($('articleReadTime').value, 10) || 5,
      published: $('articlePublished').checked
    };

    if (!article.title) {
      toast('请输入文章标题', 'error');
      return;
    }

    if (!article.slug) {
      article.slug = article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    }

    try {
      var id = $('articleId').value;
      if (id) {
        await BlogDB.updateArticle(id, article);
        toast('文章更新成功', 'success');
      } else {
        await BlogDB.createArticle(article);
        toast('文章创建成功', 'success');
      }
      hideEditor();
      state.recordCache.articles = null;
      await loadArticleList();
    } catch (err) {
      toast('保存失败: ' + err.message, 'error');
    }
  }

  function getFieldValue(field, record) {
    if (!record) {
      return field.defaultValue !== undefined ? field.defaultValue : (field.type === 'checkbox' ? false : '');
    }
    var value = record[field.name];
    if (field.format) return field.format(value, record);
    if (value === null || value === undefined) {
      return field.defaultValue !== undefined ? field.defaultValue : (field.type === 'checkbox' ? false : '');
    }
    return value;
  }

  async function getFieldOptions(field) {
    if (!field.options) return [];
    return typeof field.options === 'function' ? field.options() : field.options;
  }

  // ================================================================
  //  8. 通用表单构建器 — 根据 field.type 生成对应的 HTML
  // ================================================================

  function buildFieldHtml(field, value, options) {
    if (field.type === 'checkbox') {
      return '<div class="form-group' + (field.full ? ' is-full' : '') + '">' +
        '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;">' +
          '<input type="checkbox" name="' + field.name + '" ' + (value ? 'checked' : '') + ' style="width:auto;">' +
          '<span>' + esc(field.label) + '</span>' +
        '</label>' +
      '</div>';
    }

    if (field.type === 'textarea') {
      return '<div class="form-group' + (field.full ? ' is-full' : '') + '">' +
        '<label>' + esc(field.label) + (field.required ? ' *' : '') + '</label>' +
        '<textarea name="' + field.name + '" placeholder="' + esc(field.placeholder || '') + '">' + esc(value) + '</textarea>' +
      '</div>';
    }

    if (field.type === 'select') {
      var optionHtml = options.map(function (option) {
        return '<option value="' + esc(option.value) + '"' + (String(option.value) === String(value) ? ' selected' : '') + '>' + esc(option.label) + '</option>';
      }).join('');
      return '<div class="form-group' + (field.full ? ' is-full' : '') + '">' +
        '<label>' + esc(field.label) + (field.required ? ' *' : '') + '</label>' +
        '<select name="' + field.name + '"><option value="">请选择</option>' + optionHtml + '</select>' +
      '</div>';
    }

    if (field.type === 'cover') {
      var coverUrl = String(value || '');
      return '<div class="form-group is-full">' +
        '<label>' + esc(field.label) + '</label>' +
        '<input type="hidden" name="' + field.name + '" value="' + esc(coverUrl) + '" data-cover-hidden>' +
        '<div class="cover-upload-area" data-cover-area>' +
          '<div class="cover-preview" data-cover-preview style="' + (coverUrl ? '' : 'display:none;') + '">' +
            '<img data-cover-preview-img src="' + esc(coverUrl) + '" alt="封面预览">' +
            '<button type="button" class="cover-remove-btn" data-cover-remove title="移除封面">&times;</button>' +
          '</div>' +
          '<div class="cover-placeholder" data-cover-placeholder style="' + (coverUrl ? 'display:none;' : '') + '">' +
            '<i class="fas fa-image"></i>' +
            '<span>点击上传封面图片</span>' +
            '<small>建议尺寸 1200×630，支持 JPG/PNG/WebP</small>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    if (field.type === 'tags') {
      var tags = Array.isArray(value) ? value : [];
      if (typeof value === 'string' && value) tags = splitCommaValues(value);
      var tagPillsHtml = tags.map(function (tag, idx) {
        return '<span class="tag-pill">' + esc(tag) + ' <span class="tag-remove" data-tag-idx="' + idx + '">&times;</span></span>';
      }).join('');
      return '<div class="form-group is-full">' +
        '<label>' + esc(field.label) + '</label>' +
        '<div class="tag-input-wrapper" data-tag-wrapper>' +
          tagPillsHtml +
          '<input type="text" class="tag-input" data-tag-input placeholder="输入后按回车添加">' +
        '</div>' +
        '<input type="hidden" name="' + field.name + '" value="' + esc(Array.isArray(value) ? value.join(', ') : (value || '')) + '" data-tags-hidden>' +
      '</div>';
    }

    if (field.type === 'datalist') {
      var datalistOptions = options.map(function (option) {
        return '<option value="' + esc(option.value) + '">' + esc(option.label || option.value) + '</option>';
      }).join('');
      return '<div class="form-group' + (field.full ? ' is-full' : '') + '">' +
        '<label>' + esc(field.label) + (field.required ? ' *' : '') + '</label>' +
        '<input type="text" name="' + field.name + '" value="' + esc(value) + '" placeholder="' + esc(field.placeholder || '') + '" list="dl_' + field.name + '" autocomplete="off">' +
        '<datalist id="dl_' + field.name + '">' + datalistOptions + '</datalist>' +
      '</div>';
    }

    if (field.type === 'markdown') {
      var mdId = 'md_' + field.name;
      return '<div class="form-group is-full">' +
        '<label>' + esc(field.label) + (field.required ? ' *' : '') + '</label>' +
        '<div class="editor-container" data-md-editor data-md-field="' + field.name + '" style="margin-top:0;border:1px solid rgba(169,176,211,0.3);border-radius:12px;overflow:hidden;background:rgba(255,255,255,0.5);">' +
          '<div class="editor-toolbar" style="padding:8px 15px;background:rgba(255,255,255,0.8);border-bottom:1px solid rgba(169,176,211,0.2);display:flex;gap:15px;align-items:center;flex-wrap:wrap;">' +
            '<div class="tool-group" style="display:flex;gap:5px;">' +
              '<button type="button" data-md-tool="## " title="一级标题" style="padding:5px 8px;border:0;background:none;cursor:pointer;color:var(--text-main);"><i class="fas fa-heading"></i>1</button>' +
              '<button type="button" data-md-tool="### " title="二级标题" style="padding:5px 8px;border:0;background:none;cursor:pointer;color:var(--text-main);"><i class="fas fa-heading"></i>2</button>' +
              '<button type="button" data-md-tool="#### " title="三级标题" style="padding:5px 8px;border:0;background:none;cursor:pointer;color:var(--text-main);"><i class="fas fa-heading"></i>3</button>' +
            '</div>' +
            '<div class="tool-separator" style="width:1px;height:16px;background:rgba(0,0,0,0.1);"></div>' +
            '<div class="tool-group" style="display:flex;gap:5px;">' +
              '<button type="button" data-md-tool="**" data-md-suffix="**" title="加粗" style="padding:5px 8px;border:0;background:none;cursor:pointer;color:var(--text-main);"><i class="fas fa-bold"></i></button>' +
              '<button type="button" data-md-tool="*" data-md-suffix="*" title="斜体" style="padding:5px 8px;border:0;background:none;cursor:pointer;color:var(--text-main);"><i class="fas fa-italic"></i></button>' +
              '<button type="button" data-md-tool="> " title="引用" style="padding:5px 8px;border:0;background:none;cursor:pointer;color:var(--text-main);"><i class="fas fa-quote-left"></i></button>' +
            '</div>' +
            '<div class="tool-separator" style="width:1px;height:16px;background:rgba(0,0,0,0.1);"></div>' +
            '<div class="tool-group" style="display:flex;gap:5px;">' +
              '<button type="button" data-md-tool="- " title="无序列表" style="padding:5px 8px;border:0;background:none;cursor:pointer;color:var(--text-main);"><i class="fas fa-list-ul"></i></button>' +
              '<button type="button" data-md-tool="[" data-md-suffix="](url)" title="超链接" style="padding:5px 8px;border:0;background:none;cursor:pointer;color:var(--text-main);"><i class="fas fa-link"></i></button>' +
              '<button type="button" data-md-tool="![" data-md-suffix="](url)" title="插入图片" style="padding:5px 8px;border:0;background:none;cursor:pointer;color:var(--accent);"><i class="fas fa-image"></i></button>' +
            '</div>' +
            '<span style="margin-left:auto;font-size:0.75rem;color:var(--text-soft);"><i class="fas fa-info-circle"></i> 支持 Markdown 语法和 Ctrl+V 粘贴图片</span>' +
          '</div>' +
          '<div class="editor-layout" style="display:grid;grid-template-columns:1fr 1fr;height:400px;">' +
            '<textarea class="editor-input" name="' + field.name + '" data-md-input style="border:0;border-right:1px solid rgba(169,176,211,0.1);border-radius:0;padding:20px;outline:none;background:transparent;" placeholder="在此输入 Markdown 内容...">' + esc(value) + '</textarea>' +
            '<div class="editor-preview" data-md-preview style="padding:20px;overflow-y:auto;"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    return '<div class="form-group' + (field.full ? ' is-full' : '') + '">' +
      '<label>' + esc(field.label) + (field.required ? ' *' : '') + '</label>' +
      '<input type="' + field.type + '" name="' + field.name + '" value="' + esc(value) + '" placeholder="' + esc(field.placeholder || '') + '">' +
    '</div>';
  }

  // ----- 渲染通用表单 + 处理表单提交 -----

  async function renderGenericForm(moduleId, record) {
    var module = MODULES[moduleId];
    var parts = [];

    for (var i = 0; i < module.fields.length; i += 1) {
      var field = module.fields[i];
      var value = getFieldValue(field, record);
      var options = await getFieldOptions(field);
      parts.push(buildFieldHtml(field, value, options));
    }

    $moduleEditorTitle.innerHTML = '<i class="fas fa-pen-to-square"></i> ' + (record ? '编辑' : '新建') + module.title;
    $moduleForm.innerHTML = '<div class="module-form-grid">' + parts.join('') + '</div>';

    if (typeof module.afterRender === 'function') {
      module.afterRender(moduleId, record || null);
    }
  }

  function coerceFieldValue(field, formData) {
    if (field.type === 'checkbox') {
      return formData.get(field.name) === 'on';
    }

    if (field.type === 'number') {
      var rawNumber = String(formData.get(field.name) || '').trim();
      return rawNumber ? parseInt(rawNumber, 10) : (field.defaultValue || 0);
    }

    var raw = String(formData.get(field.name) || '').trim();
    if (field.parse) return field.parse(raw);
    return raw;
  }

  function collectGenericPayload(module) {
    var payload = {};
    var formData = new FormData($moduleForm);

    for (var i = 0; i < module.fields.length; i += 1) {
      var field = module.fields[i];
      var value = coerceFieldValue(field, formData);

      if (field.required && (value === '' || value === null || (Array.isArray(value) && value.length === 0))) {
        throw new Error(field.label + '不能为空');
      }

      payload[field.name] = value;
    }

    return payload;
  }

  // ================================================================
  //  9. 通用列表渲染器 — 根据 module.columns 生成表格
  // ================================================================

  /** 将记录数组渲染为表格 HTML */
  function renderGenericTable(module, moduleId, records) {
    $moduleListTitle.textContent = module.listTitle;
    $moduleListMeta.textContent = '共 ' + records.length + ' 条';

    if (!records.length) {
      $moduleListContainer.innerHTML = '<div class="module-empty-state"><strong>当前模块还没有内容</strong><span>点击右上角按钮即可开始新增。</span></div>';
      return;
    }

    var header = module.columns.map(function (col) { return '<th>' + esc(col.label) + '</th>'; }).join('');

    var rows = records.map(function (record) {
      var cells = module.columns.map(function (col, idx) {
        var value = col.format ? col.format(record[col.key], record) : record[col.key];
        var cls = idx === 0 ? ' class="title-cell"' : '';
        return '<td' + cls + '>' + (col.html ? value : esc(value)) + '</td>';
      }).join('');

      var visField = module.visibilityField || 'published';
      var canToggle = typeof module.toggleRecord === 'function' && typeof record[visField] === 'boolean';
      var toggleVal = canToggle ? !!record[visField] : false;
      var actions = '<button onclick="window._moduleEdit(\'' + moduleId + '\',\'' + record.id + '\')"><i class="fas fa-pen"></i></button>';

      if (canToggle) {
        actions += '<button onclick="window._moduleToggle(\'' + moduleId + '\',\'' + record.id + '\',' + toggleVal + ')"><i class="fas fa-' + (toggleVal ? 'eye-slash' : 'eye') + '"></i></button>';
      }

      actions += '<button class="danger" onclick="window._moduleDel(\'' + moduleId + '\',\'' + record.id + '\')"><i class="fas fa-trash"></i></button>';

      return '<tr>' + cells + '<td><div class="action-group">' + actions + '</div></td></tr>';
    }).join('');

    $moduleListContainer.innerHTML = '<table class="article-table"><thead><tr>' + header + '<th>操作</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  async function loadGenericList(moduleId, forceReload) {
    var module = MODULES[moduleId];

    // 有缓存且未强制刷新，直接使用缓存
    if (!forceReload && state.recordCache[moduleId]) {
      var cached = state.recordCache[moduleId];
      $moduleListTitle.textContent = module.listTitle;
      $moduleListMeta.textContent = '共 ' + cached.length + ' 条';
      renderGenericTable(module, moduleId, cached);
      return;
    }

    $moduleListContainer.innerHTML = '<p style="color:var(--text-soft);text-align:center;padding:60px;">加载中...</p>';

    try {
      var records = await module.loadRecords();
      state.recordCache[moduleId] = records;
      renderGenericTable(module, moduleId, records);
    } catch (err) {
      $moduleListContainer.innerHTML = '<p style="color:#ef4444;text-align:center;padding:40px;">加载失败: ' + err.message + '</p>';
    }
  }

  async function showGenericEditor(moduleId, record) {
    state.activeModule = moduleId;
    state.isEditingGeneric = true;
    state.genericRecordId = record ? record.id : null;
    await renderGenericForm(moduleId, record);
    syncModuleView();
  }

  function hideGenericEditor() {
    state.isEditingGeneric = false;
    state.genericRecordId = null;
    syncModuleView();
  }

  async function saveGenericRecord() {
    var module = currentModule();

    try {
      var payload = collectGenericPayload(module);
      if (state.genericRecordId) {
        await module.updateRecord(state.genericRecordId, payload);
        toast(module.title + '更新成功', 'success');
      } else {
        await module.createRecord(payload);
        toast(module.title + '创建成功', 'success');
      }

      hideGenericEditor();
      state.recordCache[state.activeModule] = null;
      await loadGenericList(state.activeModule);
    } catch (err) {
      toast(err.message || '保存失败', 'error');
    }
  }

  async function refreshActiveModule() {
    var module = currentModule();
    if (module.type === 'generic' && !state.isEditingGeneric) {
      state.recordCache[state.activeModule] = null;
      await loadGenericList(state.activeModule);
    }
  }

  async function setActiveModule(moduleId) {
    if (!MODULES[moduleId]) return;
    state.activeModule = moduleId;
    state.isEditingArticle = false;
    state.isEditingGeneric = false;
    state.genericRecordId = null;
    syncModuleView();
    await refreshActiveModule();
  }

  function bindEvents() {
    $moduleButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        setActiveModule(button.dataset.adminModule);
      });
    });

    $tagWrapper.addEventListener('click', function (e) {
      if (e.target.classList.contains('tag-remove')) {
        state.currentTags.splice(parseInt(e.target.dataset.idx, 10), 1);
        renderTags();
      }
    });

    $tagInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var val = $tagInput.value.trim();
        if (val && state.currentTags.indexOf(val) === -1) {
          state.currentTags.push(val);
          renderTags();
        }
        $tagInput.value = '';
      }
    });

    // 输入标题时自动生成 slug
    $('articleTitle').addEventListener('input', function () {
      var slugInput = $('articleSlug');
      // 只在 slug 为空或之前是自动生成的情况下自动填充
      if (!slugInput.value || slugInput.dataset.autoSlug === '1') {
        slugInput.value = this.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        slugInput.dataset.autoSlug = '1';
      }
    });
    $('articleSlug').addEventListener('input', function () {
      this.dataset.autoSlug = '0';
    });

    // 正文插图上传
    $dropZone.addEventListener('click', function () { $fileInput.click(); });
    $fileInput.addEventListener('change', function (e) { Array.from(e.target.files).forEach(uploadFile); });
    $dropZone.addEventListener('dragover', function (e) { e.preventDefault(); $dropZone.classList.add('drag-over'); });
    $dropZone.addEventListener('dragleave', function () { $dropZone.classList.remove('drag-over'); });
    $dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      $dropZone.classList.remove('drag-over');
      Array.from(e.dataTransfer.files).forEach(uploadFile);
    });

    // 封面上传
    $coverUploadArea.addEventListener('click', function () { $coverFileInput.click(); });
    $coverFileInput.addEventListener('change', function (e) {
      if (e.target.files.length > 0) {
        uploadCoverFile(e.target.files[0]);
      }
    });
    $btnRemoveCover.addEventListener('click', function (e) {
      e.stopPropagation();
      removeCover();
    });
    $btnApplyCoverUrl.addEventListener('click', applyCoverUrl);
    $articleCoverUrl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); applyCoverUrl(); }
    });

    $mdInput.addEventListener('input', updatePreview);
    $mdInput.addEventListener('paste', handlePaste);
    var $btnToolbarImg = document.getElementById('btnToolbarImg');
    if ($btnToolbarImg) {
      $btnToolbarImg.addEventListener('click', function() { $fileInput.click(); });
    }

    $loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      $loginError.style.display = 'none';

      try {
        await BlogDB.adminLogin($('loginEmail').value.trim(), $('loginPassword').value);
        await showAdmin();
      } catch (err) {
        $loginError.textContent = err.message;
        $loginError.style.display = 'block';
      }
    });

    $btnLogout.addEventListener('click', async function () {
      await BlogDB.adminLogout();
      showLogin();
    });

    $btnNewArticle.addEventListener('click', function () {
      var module = currentModule();
      if (module.implemented) {
        showGenericEditor(state.activeModule, null);
      }
    });

    $btnCancelEdit.addEventListener('click', hideEditor);
    $btnSaveArticle.addEventListener('click', saveArticle);
    $btnCancelModuleEdit.addEventListener('click', hideGenericEditor);
    $btnSaveModule.addEventListener('click', saveGenericRecord);
  }

  function showLogin() {
    $loginScreen.style.display = 'grid';
    $adminPanel.style.display = 'none';
  }

  async function showAdmin() {
    $loginScreen.style.display = 'none';
    $adminPanel.style.display = 'block';

    var session = await BlogDB.checkAuth();
    if (session) $adminEmail.textContent = session.user.email;

    await setActiveModule('articles');
  }

  window._edit = async function (id) {
    var articles = await BlogDB.getAllArticles();
    var article = articles.find(function (item) { return item.id === id; });
    if (article) showEditor(article);
  };

  window._toggle = async function (id, current) {
    await BlogDB.togglePublish(id, !current);
    toast(current ? '已设为草稿' : '已发布', 'success');
    state.recordCache.articles = null;
    await loadArticleList();
  };

  window._del = async function (id) {
    if (!confirm('确定删除？')) return;
    await BlogDB.deleteArticle(id);
    toast('已删除', 'success');
    state.recordCache.articles = null;
    await loadArticleList();
  };

  window._moduleEdit = async function (moduleId, id) {
    var record = (state.recordCache[moduleId] || []).find(function (item) { return item.id === id; });
    if (!record) {
      toast('未找到对应记录', 'error');
      return;
    }
    await showGenericEditor(moduleId, record);
  };

  window._moduleToggle = async function (moduleId, id, current) {
    var module = MODULES[moduleId];
    await module.toggleRecord(id, current);
    toast(current ? '已隐藏' : '已显示', 'success');
    state.recordCache[moduleId] = null;
    await loadGenericList(moduleId);
  };

  window._moduleDel = async function (moduleId, id) {
    var module = MODULES[moduleId];
    if (!confirm('确定删除？')) return;
    await module.deleteRecord(id);
    toast('已删除', 'success');
    state.recordCache[moduleId] = null;
    await loadGenericList(moduleId);
  };

  bindEvents();
  syncModuleView();

  (async function boot() {
    try {
      var session = await BlogDB.checkAuth();
      if (session) {
        await showAdmin();
      } else {
        showLogin();
      }
    } catch (_) {
      showLogin();
    }
  })();
})();