/**
 * 管理后台 — 表单构建器 + 列表渲染器
 * ======================================
 * 职责：根据 MODULES 配置自动生成表单 HTML、处理表单提交、渲染列表表格。
 *
 * 依赖：admin-modules.js（必须先加载，提供 MODULES、esc、splitCommaValues 等）
 * 加载顺序：supabase-core.js → supabase.js → admin-modules.js → admin-form.js → admin.js
 */

// ================================================================
//  1. 表单字段值处理
// ================================================================

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
//  2. 通用表单构建器 — 根据 field.type 生成对应的 HTML
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

// ================================================================
//  3. 表单渲染 + 值收集
// ================================================================

async function renderGenericForm(moduleId, record) {
  var module = MODULES[moduleId];
  var parts = [];

  for (var i = 0; i < module.fields.length; i += 1) {
    var field = module.fields[i];
    var value = getFieldValue(field, record);
    var options = await getFieldOptions(field);
    parts.push(buildFieldHtml(field, value, options));
  }

  var $moduleEditorTitle = document.getElementById('moduleEditorTitle');
  var $moduleForm = document.getElementById('moduleForm');
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
  var formData = new FormData(document.getElementById('moduleForm'));

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
//  4. 通用列表渲染器 — 根据 module.columns 生成表格
// ================================================================

function renderGenericTable(module, moduleId, records) {
  var $moduleListTitle = document.getElementById('moduleListTitle');
  var $moduleListMeta = document.getElementById('moduleListMeta');
  var $moduleListContainer = document.getElementById('moduleListContainer');

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
  var $moduleListContainer = document.getElementById('moduleListContainer');
  var $moduleListTitle = document.getElementById('moduleListTitle');
  var $moduleListMeta = document.getElementById('moduleListMeta');

  // 有缓存且未强制刷新，直接使用缓存
  if (!forceReload && adminState.recordCache[moduleId]) {
    var cached = adminState.recordCache[moduleId];
    $moduleListTitle.textContent = module.listTitle;
    $moduleListMeta.textContent = '共 ' + cached.length + ' 条';
    renderGenericTable(module, moduleId, cached);
    return;
  }

  $moduleListContainer.innerHTML = '<p style="color:var(--text-soft);text-align:center;padding:60px;">加载中...</p>';

  try {
    var records = await module.loadRecords();
    adminState.recordCache[moduleId] = records;
    renderGenericTable(module, moduleId, records);
  } catch (err) {
    $moduleListContainer.innerHTML = '<p style="color:#ef4444;text-align:center;padding:40px;">加载失败: ' + err.message + '</p>';
  }
}
