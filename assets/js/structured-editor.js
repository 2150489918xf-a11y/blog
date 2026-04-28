/**
 * 结构化内容编辑器
 * =================
 * 为页面区块(page_sections)和简历区块(profile_blocks)提供可视化内容编辑。
 * 支持 slides/cards/stats/summary/timeline/badges/checklist/prose/link 等类型。
 *
 * 轮播项支持从已发布文章/项目选取并自动填充字段。
 * 编辑结果自动同步回 content JSON 字段。
 *
 * 加载顺序：在 admin.js 之前加载
 * 暴露接口：window.StructuredEditor = { init: initStructuredContentEditor }
 */

(function () {

  // ================================================================
  //  工具函数（从 admin.js 复制，保持本文件自包含）
  // ================================================================
  /** HTML 转义，防止 XSS */
  function esc(s) {
    if (!s && s !== 0) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatJsonText(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      try { return JSON.stringify(value, null, 2); } catch (_) { return "{}"; }
    }
    return String(value);
  }

  function parseContentObject(value) {
    if (value && typeof value === "object") return value;
    var raw = String(value || "").trim();
    if (!raw) return {};
    try { return JSON.parse(raw); } catch (_) { return {}; }
  }

  // ================================================================
  //  结构化编辑器工具函数
  // ================================================================
  function getStructuredPlacementField(moduleId) {
    return moduleId === 'page_sections' ? 'placement' : 'position';
  }

  function getDefaultStructuredPlacement(moduleId) {
    if (moduleId !== 'page_sections') return 'main';

    var sectionKeyNode = $moduleForm ? $moduleForm.querySelector('[name="section_key"]') : null;
    var sectionKey = sectionKeyNode ? String(sectionKeyNode.value || '').trim() : '';

    if (/^(usage_tips_card|contact_info_card|page_note_card|validation_card|jump_list_card)$/.test(sectionKey)) {
      return 'aside';
    }

    return 'main';
  }

  // ================================================================
  //  4. 结构化内容编辑器 — 页面区块 & 简历区块的可视编辑
  // ================================================================

  /** 根据内容数据自动检测内容类型（slides/cards/stats/...） */
  function detectStructuredType(moduleId, content) {
    var normalized = content || {};
    var sectionKeyNode = $moduleForm ? $moduleForm.querySelector('[name="section_key"]') : null;
    var blockKeyNode = $moduleForm ? $moduleForm.querySelector('[name="block_key"]') : null;
    var sectionKey = sectionKeyNode ? String(sectionKeyNode.value || '').trim() : '';
    var blockKey = blockKeyNode ? String(blockKeyNode.value || '').trim() : '';
    var layout = normalized.layout || '';

    if (Array.isArray(normalized.cards)) return 'cards';
    if (Array.isArray(normalized.slides)) return 'slides';
    if (Array.isArray(normalized.stats)) return 'stats';
    if (layout === 'summary-grid') return 'summary';
    if (layout === 'badge-grid') return 'badges';
    if (layout === 'timeline') return 'timeline';
    if (layout === 'check-list' || layout === 'list') return 'checklist';
    if (layout === 'prose' || Array.isArray(normalized.paragraphs)) return 'prose';
    if ((normalized.href || normalized.label) && !layout) return 'link';

    if (moduleId === 'page_sections') {
      if (sectionKey === 'note_board') return 'cards';
      if (sectionKey === 'hero_carousel' || sectionKey === 'carousel') return 'slides';
      if (sectionKey === 'article_feed') return 'link';
      if (/^(usage_tips_card|page_note_card)$/.test(sectionKey)) return 'prose';
      if (/^(contact_info_card|validation_card)$/.test(sectionKey)) return 'checklist';
    }

    if (moduleId === 'profile_blocks') {
      if (blockKey === 'basic_info') return 'summary';
      if (blockKey === 'skills' || blockKey === 'interests') return 'badges';
      if (blockKey === 'timeline') return 'timeline';
      if (blockKey === 'self_evaluation') return 'prose';
    }

    return 'custom';
  }

  function defaultStructuredContent(type, moduleId) {
    var placementField = getStructuredPlacementField(moduleId);
    var placement = getDefaultStructuredPlacement(moduleId);
    var content;

    switch (type) {
      case 'cards':
        return { cards: [{ tag: '', title: '', description: '', tone: '' }] };
      case 'slides':
        return { slides: [{ source: 'article', refId: '', chip: '', date: '', readTime: '', title: '', summary: '', visualClass: '', imageUrl: '' }] };
      case 'stats':
        return { stats: [{ key: 'articleCount', label: '文章' }] };
      case 'summary':
        content = { layout: 'summary-grid', items: [{ title: '', value: '' }] };
        content[placementField] = placement;
        return content;
      case 'timeline':
        content = { layout: 'timeline', items: [{ title: '', time: '', description: '' }] };
        content[placementField] = placement;
        return content;
      case 'badges':
        content = { layout: 'badge-grid', items: [''] };
        content[placementField] = placement;
        return content;
      case 'checklist':
        content = { layout: 'check-list', items: [{ text: '', href: '' }] };
        content[placementField] = placement;
        return content;
      case 'prose':
        content = { layout: 'prose', paragraphs: [''] };
        content[placementField] = placement;
        return content;
      case 'link':
        return { href: '', label: '' };
      default:
        return {};
    }
  }

  function normalizeStructuredContent(type, content, moduleId) {
    var source = content && typeof content === 'object' ? content : {};
    var placementField = getStructuredPlacementField(moduleId);
    var placement = source[placementField] || getDefaultStructuredPlacement(moduleId);
    var items;
    var result;

    if (type === 'custom') return source;
    if (!Object.keys(source).length) return defaultStructuredContent(type, moduleId);

    switch (type) {
      case 'cards':
        return {
          cards: Array.isArray(source.cards) && source.cards.length ? source.cards.map(function (item) {
            return {
              tag: item.tag || '',
              title: item.title || '',
              description: item.description || '',
              tone: item.tone || ''
            };
          }) : defaultStructuredContent(type, moduleId).cards
        };
      case 'slides':
        return {
          slides: Array.isArray(source.slides) && source.slides.length ? source.slides.map(function (item) {
            return {
              source: item.source || 'article',
              refId: item.refId || '',
              chip: item.chip || '',
              date: item.date || '',
              readTime: item.readTime || '',
              title: item.title || '',
              summary: item.summary || '',
              visualClass: item.visualClass || '',
              imageUrl: item.imageUrl || ''
            };
          }) : defaultStructuredContent(type, moduleId).slides
        };
      case 'stats':
        return {
          stats: Array.isArray(source.stats) && source.stats.length ? source.stats.map(function (item) {
            return {
              key: item.key || '',
              label: item.label || ''
            };
          }) : defaultStructuredContent(type, moduleId).stats
        };
      case 'summary':
        result = { layout: 'summary-grid', items: [] };
        result[placementField] = placement;
        items = Array.isArray(source.items) && source.items.length ? source.items : defaultStructuredContent(type, moduleId).items;
        result.items = items.map(function (item) {
          return { title: item.title || '', value: item.value || '' };
        });
        return result;
      case 'timeline':
        result = { layout: 'timeline', items: [] };
        result[placementField] = placement;
        items = Array.isArray(source.items) && source.items.length ? source.items : defaultStructuredContent(type, moduleId).items;
        result.items = items.map(function (item) {
          return { title: item.title || '', time: item.time || '', description: item.description || '' };
        });
        return result;
      case 'badges':
        result = { layout: 'badge-grid', items: [] };
        result[placementField] = placement;
        items = Array.isArray(source.items) && source.items.length ? source.items : defaultStructuredContent(type, moduleId).items;
        result.items = items.map(function (item) { return typeof item === 'string' ? item : (item.text || item.label || item.title || ''); });
        return result;
      case 'checklist':
        result = { layout: 'check-list', items: [] };
        result[placementField] = placement;
        items = Array.isArray(source.items) && source.items.length ? source.items : defaultStructuredContent(type, moduleId).items;
        result.items = items.map(function (item) {
          if (typeof item === 'string') {
            return { text: item, href: '' };
          }
          return {
            text: item.text || item.label || item.title || item.value || '',
            href: item.href || ''
          };
        });
        return result;
      case 'prose':
        result = { layout: 'prose', paragraphs: [] };
        result[placementField] = placement;
        result.paragraphs = Array.isArray(source.paragraphs) && source.paragraphs.length ? source.paragraphs : defaultStructuredContent(type, moduleId).paragraphs;
        return result;
      case 'link':
        return {
          href: source.href || '',
          label: source.label || ''
        };
      default:
        return source;
    }
  }

  function buildStructuredTypeOptions(moduleId, currentType) {
    var base = [
      { value: 'custom', label: '保留手写 JSON' },
      { value: 'prose', label: '段落内容' },
      { value: 'checklist', label: '清单列表' },
      { value: 'badges', label: '标签组' },
      { value: 'summary', label: '信息卡片' },
      { value: 'timeline', label: '时间线' },
      { value: 'link', label: '链接配置' }
    ];

    if (moduleId === 'page_sections') {
      base.splice(1, 0,
        { value: 'cards', label: '首页卡片组' },
        { value: 'slides', label: '轮播项' },
        { value: 'stats', label: '统计项' }
      );
    }

    return base.map(function (item) {
      return '<option value="' + item.value + '"' + (item.value === currentType ? ' selected' : '') + '>' + item.label + '</option>';
    }).join('');
  }

  function buildStructuredRowsMarkup(type, content) {
    function removeButton(index) {
      return '<button class="btn btn-secondary structured-remove" type="button" data-structured-remove="' + index + '">删除</button>';
    }

    if (type === 'cards') {
      return content.cards.map(function (item, index) {
        return '<div class="structured-editor-row" data-structured-row>' +
          '<div class="structured-editor-grid structured-editor-grid-2">' +
            '<input type="text" data-field="tag" data-structured-input value="' + esc(item.tag || '') + '" placeholder="标签">' +
            '<input type="text" data-field="tone" data-structured-input value="' + esc(item.tone || '') + '" placeholder="色调类名，如 note-card-mint">' +
            '<input type="text" data-field="title" data-structured-input value="' + esc(item.title || '') + '" placeholder="卡片标题">' +
            '<textarea data-field="description" data-structured-input placeholder="卡片描述">' + esc(item.description || '') + '</textarea>' +
          '</div>' + removeButton(index) +
        '</div>';
      }).join('');
    }

    if (type === 'slides') {
      return content.slides.map(function (item, index) {
        var sourceType = (item.source === 'project') ? 'project' : 'article';
        return '<div class="structured-editor-row slide-editor-card" data-structured-row data-slide-index="' + index + '">' +
          '<div class="slide-card-header">' +
            '<span class="slide-card-index">轮播 #' + (index + 1) + '</span>' +
          '</div>' +
          '<div class="slide-source-bar">' +
            '<select data-slide-source-type>' +
              '<option value="article"' + (sourceType === 'article' ? ' selected' : '') + '>从文章选取</option>' +
              '<option value="project"' + (sourceType === 'project' ? ' selected' : '') + '>从项目选取</option>' +
            '</select>' +
            '<select class="slide-ref-select" data-slide-source-ref>' +
              '<option value="">— 选择内容 —</option>' +
            '</select>' +
          '</div>' +
          '<input type="hidden" data-field="refId" data-structured-input value="' + esc(item.refId || '') + '">' +
          '<input type="hidden" data-field="source" data-structured-input value="' + esc(sourceType) + '">' +
          '<input type="hidden" data-field="imageUrl" data-structured-input value="' + esc(item.imageUrl || '') + '">' +
          '<div class="slide-fields-grid">' +
            '<input type="text" data-field="title" data-structured-input value="' + esc(item.title || '') + '" placeholder="标题（从文章来源自动填充）">' +
            '<input type="text" data-field="chip" data-structured-input value="' + esc(item.chip || '') + '" placeholder="标签">' +
            '<select data-field="visualClass" data-structured-input>' +
              '<option value="">默认自动</option>' +
              '<option value="visual-red"' + (item.visualClass === 'visual-red' ? ' selected' : '') + '>红色</option>' +
              '<option value="visual-blue"' + (item.visualClass === 'visual-blue' ? ' selected' : '') + '>蓝色</option>' +
              '<option value="visual-green"' + (item.visualClass === 'visual-green' ? ' selected' : '') + '>绿色</option>' +
            '</select>' +
            '<input type="text" data-field="date" data-structured-input value="' + esc(item.date || '') + '" placeholder="日期（自动填充）">' +
            '<input type="text" data-field="readTime" data-structured-input value="' + esc(item.readTime || '') + '" placeholder="阅读时长（自动填充）">' +
            '<textarea data-field="summary" data-structured-input class="is-full" placeholder="摘要（从文章来源自动填充）">' + esc(item.summary || '') + '</textarea>' +
          '</div>' +
          '<p class="slide-cover-note"><i class="fas fa-info-circle"></i> 封面图自动使用所选文章/项目的封面，如需修改请编辑对应文章</p>' +
          '<div class="slide-card-footer">' +
            removeButton(index) +
          '</div>' +
        '</div>';
      }).join('');
    }

    if (type === 'stats') {
      return content.stats.map(function (item, index) {
        return '<div class="structured-editor-row" data-structured-row>' +
          '<div class="structured-editor-grid structured-editor-grid-2">' +
            '<input type="text" data-field="label" data-structured-input value="' + esc(item.label || '') + '" placeholder="显示名称，如 文章">' +
            '<input type="text" data-field="key" data-structured-input value="' + esc(item.key || '') + '" placeholder="统计键，如 articleCount">' +
          '</div>' + removeButton(index) +
        '</div>';
      }).join('');
    }

    if (type === 'summary') {
      return content.items.map(function (item, index) {
        return '<div class="structured-editor-row" data-structured-row>' +
          '<div class="structured-editor-grid structured-editor-grid-2">' +
            '<input type="text" data-field="title" data-structured-input value="' + esc(item.title || '') + '" placeholder="标题">' +
            '<input type="text" data-field="value" data-structured-input value="' + esc(item.value || '') + '" placeholder="值">' +
          '</div>' + removeButton(index) +
        '</div>';
      }).join('');
    }

    if (type === 'timeline') {
      return content.items.map(function (item, index) {
        return '<div class="structured-editor-row" data-structured-row>' +
          '<div class="structured-editor-grid structured-editor-grid-2">' +
            '<input type="text" data-field="title" data-structured-input value="' + esc(item.title || '') + '" placeholder="时间线标题">' +
            '<input type="text" data-field="time" data-structured-input value="' + esc(item.time || '') + '" placeholder="时间">' +
            '<textarea data-field="description" data-structured-input class="is-full" placeholder="说明">' + esc(item.description || '') + '</textarea>' +
          '</div>' + removeButton(index) +
        '</div>';
      }).join('');
    }

    if (type === 'badges') {
      return content.items.map(function (item, index) {
        return '<div class="structured-editor-row" data-structured-row>' +
          '<div class="structured-editor-grid structured-editor-grid-1">' +
            '<input type="text" data-field="value" data-structured-input value="' + esc(item || '') + '" placeholder="标签内容">' +
          '</div>' + removeButton(index) +
        '</div>';
      }).join('');
    }

    if (type === 'checklist') {
      return content.items.map(function (item, index) {
        return '<div class="structured-editor-row" data-structured-row>' +
          '<div class="structured-editor-grid structured-editor-grid-2">' +
            '<input type="text" data-field="text" data-structured-input value="' + esc(item.text || '') + '" placeholder="显示文本">' +
            '<input type="text" data-field="href" data-structured-input value="' + esc(item.href || '') + '" placeholder="链接（可选）">' +
          '</div>' + removeButton(index) +
        '</div>';
      }).join('');
    }

    if (type === 'prose') {
      return content.paragraphs.map(function (item, index) {
        return '<div class="structured-editor-row" data-structured-row>' +
          '<div class="structured-editor-grid structured-editor-grid-1">' +
            '<textarea data-field="value" data-structured-input placeholder="段落内容">' + esc(item || '') + '</textarea>' +
          '</div>' + removeButton(index) +
        '</div>';
      }).join('');
    }

    if (type === 'link') {
      return '<div class="structured-editor-row structured-editor-row-inline" data-structured-row>' +
        '<div class="structured-editor-grid structured-editor-grid-2">' +
          '<input type="text" data-field="href" data-structured-input value="' + esc(content.href || '') + '" placeholder="跳转地址">' +
          '<input type="text" data-field="label" data-structured-input value="' + esc(content.label || '') + '" placeholder="链接文本（可选）">' +
        '</div>' +
      '</div>';
    }

    return '<div class="structured-editor-empty">当前模式保留手写 JSON，下方内容字段会原样保存。</div>';
  }

  function supportsStructuredAdd(type) {
    return ['cards', 'slides', 'stats', 'summary', 'timeline', 'badges', 'checklist', 'prose'].indexOf(type) !== -1;
  }

  function buildStructuredEditorMarkup(moduleId, type, content) {
    var placementField = getStructuredPlacementField(moduleId);
    var placementValue = content[placementField] || getDefaultStructuredPlacement(moduleId);
    var showPlacement = ['summary', 'timeline', 'badges', 'checklist', 'prose'].indexOf(type) !== -1;
    var addLabelMap = {
      cards: '新增卡片',
      slides: '新增轮播项',
      stats: '新增统计项',
      summary: '新增信息项',
      timeline: '新增时间线项',
      badges: '新增标签',
      checklist: '新增列表项',
      prose: '新增段落'
    };

    return '<div class="structured-editor-card">' +
      '<div class="structured-editor-head">' +
        '<div>' +
          '<strong>内容编辑器</strong>' +
          '<p>在下方可视化编辑内容，保存时会自动同步。</p>' +
        '</div>' +
        '<select data-structured-type hidden>' + buildStructuredTypeOptions(moduleId, type) + '</select>' +
      '</div>' +
      (showPlacement
        ? '<div class="structured-editor-meta"><label>展示位置<select data-structured-placement><option value="main"' + (placementValue === 'main' ? ' selected' : '') + '>主栏</option><option value="aside"' + (placementValue === 'aside' ? ' selected' : '') + '>侧栏</option></select></label></div>'
        : '') +
      '<div class="structured-editor-body">' + buildStructuredRowsMarkup(type, content) + '</div>' +
      (supportsStructuredAdd(type)
        ? '<div class="structured-editor-actions"><button class="btn btn-secondary" type="button" data-structured-add="1">' + addLabelMap[type] + '</button><span class="structured-editor-tip">内容会自动同步保存</span></div>'
        : '<div class="structured-editor-actions"><span class="structured-editor-tip">保存前会自动写回 content JSON。</span></div>') +
    '</div>';
  }

  function collectStructuredContent(shell, type, moduleId) {
    var placementField = getStructuredPlacementField(moduleId);
    var placementNode = shell.querySelector('[data-structured-placement]');
    var placementValue = placementNode ? placementNode.value : getDefaultStructuredPlacement(moduleId);
    var rows = Array.prototype.slice.call(shell.querySelectorAll('[data-structured-row]'));
    var result;

    if (type === 'cards') {
      return {
        cards: rows.map(function (row) {
          return {
            tag: String(row.querySelector('[data-field="tag"]').value || '').trim(),
            title: String(row.querySelector('[data-field="title"]').value || '').trim(),
            description: String(row.querySelector('[data-field="description"]').value || '').trim(),
            tone: String(row.querySelector('[data-field="tone"]').value || '').trim()
          };
        }).filter(function (item) {
          return item.tag || item.title || item.description || item.tone;
        })
      };
    }

    if (type === 'slides') {
      return {
        slides: rows.map(function (row) {
          return {
            source: String(row.querySelector('[data-field="source"]').value || '').trim() || 'article',
            refId: String(row.querySelector('[data-field="refId"]').value || '').trim(),
            chip: String(row.querySelector('[data-field="chip"]').value || '').trim(),
            date: String(row.querySelector('[data-field="date"]').value || '').trim(),
            readTime: String(row.querySelector('[data-field="readTime"]').value || '').trim(),
            title: String(row.querySelector('[data-field="title"]').value || '').trim(),
            summary: String(row.querySelector('[data-field="summary"]').value || '').trim(),
            visualClass: String(row.querySelector('[data-field="visualClass"]').value || '').trim(),
            imageUrl: String(row.querySelector('[data-field="imageUrl"]').value || '').trim()
          };
        }).filter(function (item) {
          return item.refId || item.title || item.summary;
        })
      };
    }

    if (type === 'stats') {
      return {
        stats: rows.map(function (row) {
          return {
            label: String(row.querySelector('[data-field="label"]').value || '').trim(),
            key: String(row.querySelector('[data-field="key"]').value || '').trim()
          };
        }).filter(function (item) {
          return item.label || item.key;
        })
      };
    }

    if (type === 'summary') {
      result = { layout: 'summary-grid', items: [] };
      result[placementField] = placementValue;
      result.items = rows.map(function (row) {
        return {
          title: String(row.querySelector('[data-field="title"]').value || '').trim(),
          value: String(row.querySelector('[data-field="value"]').value || '').trim()
        };
      }).filter(function (item) { return item.title || item.value; });
      return result;
    }

    if (type === 'timeline') {
      result = { layout: 'timeline', items: [] };
      result[placementField] = placementValue;
      result.items = rows.map(function (row) {
        return {
          title: String(row.querySelector('[data-field="title"]').value || '').trim(),
          time: String(row.querySelector('[data-field="time"]').value || '').trim(),
          description: String(row.querySelector('[data-field="description"]').value || '').trim()
        };
      }).filter(function (item) { return item.title || item.time || item.description; });
      return result;
    }

    if (type === 'badges') {
      result = { layout: 'badge-grid', items: [] };
      result[placementField] = placementValue;
      result.items = rows.map(function (row) {
        return String(row.querySelector('[data-field="value"]').value || '').trim();
      }).filter(Boolean);
      return result;
    }

    if (type === 'checklist') {
      result = { layout: 'check-list', items: [] };
      result[placementField] = placementValue;
      result.items = rows.map(function (row) {
        var text = String(row.querySelector('[data-field="text"]').value || '').trim();
        var href = String(row.querySelector('[data-field="href"]').value || '').trim();
        if (!text && !href) return null;
        return href ? { text: text || href, href: href } : text;
      }).filter(Boolean);
      return result;
    }

    if (type === 'prose') {
      result = { layout: 'prose', paragraphs: [] };
      result[placementField] = placementValue;
      result.paragraphs = rows.map(function (row) {
        return String(row.querySelector('[data-field="value"]').value || '').trim();
      }).filter(Boolean);
      return result;
    }

    if (type === 'link') {
      return {
        href: String(shell.querySelector('[data-field="href"]').value || '').trim(),
        label: String(shell.querySelector('[data-field="label"]').value || '').trim()
      };
    }

    return parseContentObject($moduleForm.querySelector('[name="content"]').value);
  }

  function appendStructuredEntry(type, content) {
    if (type === 'cards') content.cards.push({ tag: '', title: '', description: '', tone: '' });
    if (type === 'slides') content.slides.push({ source: 'article', refId: '', chip: '', date: '', readTime: '', title: '', summary: '', visualClass: '', imageUrl: '' });
    if (type === 'stats') content.stats.push({ key: '', label: '' });
    if (type === 'summary') content.items.push({ title: '', value: '' });
    if (type === 'timeline') content.items.push({ title: '', time: '', description: '' });
    if (type === 'badges') content.items.push('');
    if (type === 'checklist') content.items.push({ text: '', href: '' });
    if (type === 'prose') content.paragraphs.push('');
  }

  function removeStructuredEntry(type, content, index) {
    if (type === 'cards') content.cards.splice(index, 1);
    if (type === 'slides') content.slides.splice(index, 1);
    if (type === 'stats') content.stats.splice(index, 1);
    if (type === 'summary' || type === 'timeline' || type === 'badges' || type === 'checklist') content.items.splice(index, 1);
    if (type === 'prose') content.paragraphs.splice(index, 1);
  }

  // ================================================================
  //  5. 通用表单组件 — Slug 自动生成 / 封面上传 / 标签输入 / Markdown 编辑器
  // ================================================================


  // ================================================================
  //  轮播辅助 + 初始化入口
  // ================================================================
  function autoFillSlideFromArticle(row, article) {
    var setVal = function (field, value) {
      var el = row.querySelector('[data-field="' + field + '"]');
      if (el) { el.value = value || ''; el.dispatchEvent(new Event('input', { bubbles: true })); }
    };
    setVal('refId', article.id);
    setVal('source', 'article');
    setVal('title', article.title);
    setVal('summary', article.summary || '');
    setVal('imageUrl', article.cover_url || '');
    setVal('chip', article.category || '');
    setVal('readTime', article.read_time || '');
    if (article.created_at) {
      setVal('date', article.created_at.slice(0, 10));
    }
  }

  function autoFillSlideFromProject(row, project) {
    var setVal = function (field, value) {
      var el = row.querySelector('[data-field="' + field + '"]');
      if (el) { el.value = value || ''; el.dispatchEvent(new Event('input', { bubbles: true })); }
    };
    setVal('refId', project.id);
    setVal('source', 'project');
    setVal('title', project.title);
    setVal('summary', project.description || project.summary || '');
    setVal('imageUrl', project.cover_url || '');
    setVal('chip', Array.isArray(project.tech_tags) && project.tech_tags.length ? project.tech_tags[0] : '');
    if (project.created_at) {
      setVal('date', project.created_at.slice(0, 10));
    }
  }

  async function populateSlideSourceDropdowns(shell) {
    if (shell.dataset.structuredType !== 'slides') return;
    try {
      var articles = await BlogDB.getPublishedArticles();
      var projects = await BlogDB.getPublishedProjects();
      shell.dataset.articleOptionsMap = JSON.stringify((articles || []).map(function (a) {
        return { id: a.id, title: a.title };
      }));
      shell.dataset.projectOptionsMap = JSON.stringify((projects || []).map(function (p) {
        return { id: p.id, title: p.title };
      }));
      var articleOptionsHtml = '<option value="">选择文章...</option>' + (articles || []).map(function (a) {
        return '<option value="' + a.id + '">' + esc(a.title) + '</option>';
      }).join('');
      var projectOptionsHtml = '<option value="">选择项目...</option>' + (projects || []).map(function (p) {
        return '<option value="' + p.id + '">' + esc(p.title) + '</option>';
      }).join('');
      // 缓存 HTML 用于 source-type 切换
      shell.dataset.articleOptionsHtml = articleOptionsHtml;
      shell.dataset.projectOptionsHtml = projectOptionsHtml;

      var refSelects = shell.querySelectorAll('[data-slide-source-ref]');
      refSelects.forEach(function (select) {
        var row = select.closest('[data-structured-row]');
        var sourceType = row.querySelector('[data-slide-source-type]').value;
        if (sourceType === 'article') {
          select.innerHTML = articleOptionsHtml;
          select.style.display = '';
        } else if (sourceType === 'project') {
          select.innerHTML = projectOptionsHtml;
          select.style.display = '';
        }
      });
    } catch (err) {
      console.warn('[SlideEditor] 加载内容列表失败:', err);
    }
  }

  // ----- 结构化编辑器初始化（事件委托 + 渲染）-----

  function initStructuredContentEditor(moduleId) {
    if (moduleId !== 'page_sections' && moduleId !== 'profile_blocks') return;

    var contentField = $moduleForm.querySelector('[name="content"]');
    if (!contentField) return;

    var anchor = contentField.closest('.form-group');
    if (!anchor) return;

    var shell = document.createElement('div');
    shell.className = 'form-group is-full structured-editor-shell';
    anchor.insertAdjacentElement('afterend', shell);

    function renderEditor(forcedType) {
      var parsed = parseContentObject(contentField.value);
      var type = forcedType || detectStructuredType(moduleId, parsed);
      var normalized = normalizeStructuredContent(type, parsed, moduleId);

      if (type !== 'custom' && !String(contentField.value || '').trim()) {
        contentField.value = formatJsonText(normalized);
      }

      shell.dataset.structuredType = type;
      shell.innerHTML = buildStructuredEditorMarkup(moduleId, type, normalizeStructuredContent(type, parseContentObject(contentField.value), moduleId));

      // 轮播模式：加载文章/项目下拉数据
      if (type === 'slides') {
        populateSlideSourceDropdowns(shell);
      }
    }

    function syncToTextarea() {
      var type = shell.dataset.structuredType || 'custom';
      if (type === 'custom') return;
      contentField.value = formatJsonText(collectStructuredContent(shell, type, moduleId));
    }

    shell.addEventListener('change', function (event) {
      var target = event.target;
      if (target.matches('[data-structured-type]')) {
        var selectedType = target.value;
        if (selectedType !== 'custom') {
          contentField.value = formatJsonText(normalizeStructuredContent(selectedType, parseContentObject(contentField.value), moduleId));
        }
        renderEditor(selectedType);
        return;
      }

      // 轮播：来源类型切换（文章/项目）
      if (target.matches('[data-slide-source-type]')) {
        var srcRow = target.closest('[data-structured-row]');
        var refSelect = srcRow.querySelector('[data-slide-source-ref]');
        if (target.value === 'project') {
          refSelect.innerHTML = shell.dataset.projectOptionsHtml || '<option value="">选择项目...</option>';
        } else {
          refSelect.innerHTML = shell.dataset.articleOptionsHtml || '<option value="">选择文章...</option>';
        }
        refSelect.value = '';
        return;
      }

      // 轮播：选择文章/项目后自动填充
      if (target.matches('[data-slide-source-ref]')) {
        var refRow = target.closest('[data-structured-row]');
        var sourceType = refRow.querySelector('[data-slide-source-type]').value;
        if (!target.value) return;
        if (sourceType === 'article') {
          BlogDB.getPublishedArticles().then(function (articles) {
            var article = (articles || []).find(function (a) { return a.id == target.value; });
            if (article) { autoFillSlideFromArticle(refRow, article); syncToTextarea(); }
          });
        } else if (sourceType === 'project') {
          BlogDB.getPublishedProjects().then(function (projects) {
            var project = (projects || []).find(function (p) { return p.id == target.value; });
            if (project) { autoFillSlideFromProject(refRow, project); syncToTextarea(); }
          });
        }
        return;
      }

      if (target.matches('[data-structured-input], [data-structured-placement]')) {
        syncToTextarea();
      }
    });

    shell.addEventListener('input', function (event) {
      if (event.target.matches('[data-structured-input]')) {
        syncToTextarea();
      }
    });

    shell.addEventListener('click', function (event) {
      var addButton = event.target.closest('[data-structured-add]');
      var removeButton = event.target.closest('[data-structured-remove]');
      var currentType = shell.dataset.structuredType || 'custom';

      if (addButton && supportsStructuredAdd(currentType)) {
        var currentContent = collectStructuredContent(shell, currentType, moduleId);
        appendStructuredEntry(currentType, currentContent);
        contentField.value = formatJsonText(currentContent);
        renderEditor(currentType);
      }

      if (removeButton && supportsStructuredAdd(currentType)) {
        var nextContent = collectStructuredContent(shell, currentType, moduleId);
        removeStructuredEntry(currentType, nextContent, parseInt(removeButton.getAttribute('data-structured-remove'), 10));
        contentField.value = formatJsonText(nextContent);
        renderEditor(currentType);
      }
    });

    ['page_key', 'section_key', 'block_key'].forEach(function (fieldName) {
      var node = $moduleForm.querySelector('[name="' + fieldName + '"]');
      if (!node) return;
      node.addEventListener('change', function () {
        if (!String(contentField.value || '').trim() || shell.dataset.structuredType === 'custom') {
          renderEditor();
        }
      });
    });

    renderEditor();
  }

  async function loadResourceGroupOptions() {
    var groups = await BlogDB.getAllResourceGroups();
    return groups.map(function (group) {
      return { label: group.name, value: group.id };
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

  function toast(msg, type) {
    type = type || 'info';
    var el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    $toastContainer.appendChild(el);
    setTimeout(function () { el.remove(); }, 3500);
  }

  // ================================================================
  //  暴露 API
  // ================================================================
  window.StructuredEditor = {
    init: initStructuredContentEditor
  };

})();
