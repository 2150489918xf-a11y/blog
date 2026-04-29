/**
 * 管理后台 — 状态管理 + 视图切换 + 事件绑定 + 启动
 * ======================================================
 * 职责：管理后台的全局状态、模块视图切换、事件绑定和启动流程。
 *
 * 依赖：admin-form.js（必须先加载，提供 renderGenericForm, collectGenericPayload, loadGenericList 等）
 * 加载顺序：supabase-core.js → supabase.js → admin-modules.js → admin-form.js → admin.js → structured-editor.js
 */

(function () {

  // ================================================================
  //  1. 全局状态
  // ================================================================
  var state = {
    activeModule: 'articles',
    isEditingGeneric: false,
    genericRecordId: null,
    recordCache: {}
  };

  window.adminState = state;
  window.adminModuleForm = document.getElementById('moduleForm');

  var $loginScreen = document.getElementById('loginScreen');
  var $adminPanel = document.getElementById('adminPanel');
  var $loginForm = document.getElementById('loginForm');
  var $loginError = document.getElementById('loginError');
  var $adminEmail = document.getElementById('adminEmail');
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
  var $btnLogout = document.getElementById('btnLogout');
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

  // 暴露给 admin-form.js 的 initGenericWidgets 使用
  window.adminToast = toast;

  function currentModule() {
    return MODULES[state.activeModule] || MODULES.articles;
  }

  // ================================================================
  //  2. 模块视图切换
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

    $moduleListCard.style.display = showList ? 'block' : 'none';
    $moduleEditorCard.style.display = showEditor ? 'block' : 'none';

    $modulePlaceholder.hidden = isImplemented;
    if (!module.implemented) {
      $modulePlaceholderTitle.textContent = module.placeholderTitle;
      $modulePlaceholderText.textContent = module.placeholderText;
    }
  }

  // ================================================================
  //  3. 编辑器显示/隐藏 + 保存
  // ================================================================

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
    state.isEditingGeneric = false;
    state.genericRecordId = null;
    syncModuleView();
    await refreshActiveModule();
  }

  // ================================================================
  //  4. 事件绑定
  // ================================================================

  function bindEvents() {
    $moduleButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        setActiveModule(button.dataset.adminModule);
      });
    });

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

    $btnCancelModuleEdit.addEventListener('click', hideGenericEditor);
    $btnSaveModule.addEventListener('click', saveGenericRecord);
  }

  // ================================================================
  //  5. 登录/管理面板切换
  // ================================================================

  // 隐藏旧版残留元素
  var $articleListCard = document.getElementById('articleListCard');
  var $editorCard = document.getElementById('editorCard');
  if ($articleListCard) $articleListCard.style.display = 'none';
  if ($editorCard) $editorCard.style.display = 'none';

  function showLogin() {
    $loginScreen.style.display = 'grid';
    $adminPanel.style.display = 'none';
    if ($articleListCard) $articleListCard.style.display = 'none';
    if ($editorCard) $editorCard.style.display = 'none';
  }

  async function showAdmin() {
    $loginScreen.style.display = 'none';
    $adminPanel.style.display = 'block';
    if ($articleListCard) $articleListCard.style.display = 'none';
    if ($editorCard) $editorCard.style.display = 'none';

    var session = await BlogDB.checkAuth();
    if (session) $adminEmail.textContent = session.user.email;

    await setActiveModule('articles');
  }

  // ================================================================
  //  6. 全局操作（供列表按钮 onclick 调用）
  // ================================================================

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

  // ================================================================
  //  7. 启动
  // ================================================================

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
