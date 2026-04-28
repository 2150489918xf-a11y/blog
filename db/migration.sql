-- ============================================================
-- 知行成长志 · Supabase 数据库迁移
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================================

-- 1. 文章表
CREATE TABLE IF NOT EXISTS articles (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  summary     TEXT DEFAULT '',
  content     TEXT DEFAULT '',
  cover_url   TEXT DEFAULT '',
  category    TEXT DEFAULT '未分类',
  tags        TEXT[] DEFAULT '{}',
  read_time   INTEGER DEFAULT 3,
  published   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. 分类表
CREATE TABLE IF NOT EXISTS categories (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT UNIQUE NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  article_count INTEGER DEFAULT 0
);

-- 2.1 项目表
CREATE TABLE IF NOT EXISTS projects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  summary     TEXT DEFAULT '',
  description TEXT DEFAULT '',
  status      TEXT DEFAULT '进行中',
  tech_tags   TEXT[] DEFAULT '{}',
  cover_url   TEXT DEFAULT '',
  demo_url    TEXT DEFAULT '',
  repo_url    TEXT DEFAULT '',
  sort_order  INTEGER DEFAULT 0,
  published   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2.2 资源导航分组
CREATE TABLE IF NOT EXISTS resource_groups (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  sort_order  INTEGER DEFAULT 0,
  published   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2.3 资源链接
CREATE TABLE IF NOT EXISTS resource_links (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id    UUID REFERENCES resource_groups(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  href        TEXT NOT NULL,
  label       TEXT DEFAULT '',
  sort_order  INTEGER DEFAULT 0,
  published   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2.4 表格项
CREATE TABLE IF NOT EXISTS schedule_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_name   TEXT NOT NULL,
  time_range  TEXT DEFAULT '',
  goal        TEXT DEFAULT '',
  status      TEXT DEFAULT '待开始',
  sort_order  INTEGER DEFAULT 0,
  published   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2.5 站点设置
CREATE TABLE IF NOT EXISTS site_settings (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key  TEXT UNIQUE NOT NULL,
  label        TEXT DEFAULT '',
  setting_value JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 2.6 导航项
CREATE TABLE IF NOT EXISTS navigation_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label       TEXT NOT NULL,
  href        TEXT NOT NULL,
  icon        TEXT DEFAULT '',
  parent_id   UUID REFERENCES navigation_items(id) ON DELETE CASCADE,
  sort_order  INTEGER DEFAULT 0,
  visible     BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2.7 页面区块
CREATE TABLE IF NOT EXISTS page_sections (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key    TEXT NOT NULL,
  section_key TEXT NOT NULL,
  eyebrow     TEXT DEFAULT '',
  title       TEXT DEFAULT '',
  description TEXT DEFAULT '',
  content     JSONB DEFAULT '{}'::jsonb,
  sort_order  INTEGER DEFAULT 0,
  published   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_key, section_key)
);

-- 2.8 简历区块
CREATE TABLE IF NOT EXISTS profile_blocks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  block_key   TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  subtitle    TEXT DEFAULT '',
  content     JSONB DEFAULT '{}'::jsonb,
  sort_order  INTEGER DEFAULT 0,
  published   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2.9 媒体资源
CREATE TABLE IF NOT EXISTS media_assets (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name   TEXT NOT NULL,
  file_path   TEXT UNIQUE NOT NULL,
  public_url  TEXT NOT NULL,
  mime_type   TEXT DEFAULT '',
  size_bytes  BIGINT DEFAULT 0,
  usage_type  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. 更新时间自动触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS resource_groups_updated_at ON resource_groups;
CREATE TRIGGER resource_groups_updated_at
  BEFORE UPDATE ON resource_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS resource_links_updated_at ON resource_links;
CREATE TRIGGER resource_links_updated_at
  BEFORE UPDATE ON resource_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS schedule_items_updated_at ON schedule_items;
CREATE TRIGGER schedule_items_updated_at
  BEFORE UPDATE ON schedule_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS site_settings_updated_at ON site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS navigation_items_updated_at ON navigation_items;
CREATE TRIGGER navigation_items_updated_at
  BEFORE UPDATE ON navigation_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS page_sections_updated_at ON page_sections;
CREATE TRIGGER page_sections_updated_at
  BEFORE UPDATE ON page_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS profile_blocks_updated_at ON profile_blocks;
CREATE TRIGGER profile_blocks_updated_at
  BEFORE UPDATE ON profile_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles (published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category);
CREATE INDEX IF NOT EXISTS idx_projects_published ON projects (published, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_resource_groups_published ON resource_groups (published, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_resource_links_group_id ON resource_links (group_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_schedule_items_published ON schedule_items (published, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_page_sections_page_key ON page_sections (page_key, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_profile_blocks_sort_order ON profile_blocks (sort_order ASC);

-- 5. 存储桶（在 Supabase Dashboard > Storage 手动创建）
-- Bucket name: blog-images
-- 设置为 public

-- 6. RLS 策略：任何人都能读已发布文章
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 公开读策略
DROP POLICY IF EXISTS "Public can read published articles" ON articles;
CREATE POLICY "Public can read published articles"
  ON articles FOR SELECT
  USING (published = true);

-- 管理员全部权限（用 service_role key 或已认证管理员）
DROP POLICY IF EXISTS "Admin full access" ON articles;
CREATE POLICY "Admin full access"
  ON articles FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. 分类表 RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories"
  ON categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin manage categories" ON categories;
CREATE POLICY "Admin manage categories"
  ON categories FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7.1 项目表 RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read projects" ON projects;
CREATE POLICY "Public read projects"
  ON projects FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Admin manage projects" ON projects;
CREATE POLICY "Admin manage projects"
  ON projects FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7.2 资源导航表 RLS
ALTER TABLE resource_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read resource groups" ON resource_groups;
CREATE POLICY "Public read resource groups"
  ON resource_groups FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Admin manage resource groups" ON resource_groups;
CREATE POLICY "Admin manage resource groups"
  ON resource_groups FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read resource links" ON resource_links;
CREATE POLICY "Public read resource links"
  ON resource_links FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Admin manage resource links" ON resource_links;
CREATE POLICY "Admin manage resource links"
  ON resource_links FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7.3 表格项 RLS
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read schedule items" ON schedule_items;
CREATE POLICY "Public read schedule items"
  ON schedule_items FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Admin manage schedule items" ON schedule_items;
CREATE POLICY "Admin manage schedule items"
  ON schedule_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7.4 页面配置 RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site settings" ON site_settings;
CREATE POLICY "Public read site settings"
  ON site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin manage site settings" ON site_settings;
CREATE POLICY "Admin manage site settings"
  ON site_settings FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read navigation items" ON navigation_items;
CREATE POLICY "Public read navigation items"
  ON navigation_items FOR SELECT
  USING (visible = true);

DROP POLICY IF EXISTS "Admin manage navigation items" ON navigation_items;
CREATE POLICY "Admin manage navigation items"
  ON navigation_items FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read page sections" ON page_sections;
CREATE POLICY "Public read page sections"
  ON page_sections FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Admin manage page sections" ON page_sections;
CREATE POLICY "Admin manage page sections"
  ON page_sections FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read profile blocks" ON profile_blocks;
CREATE POLICY "Public read profile blocks"
  ON profile_blocks FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Admin manage profile blocks" ON profile_blocks;
CREATE POLICY "Admin manage profile blocks"
  ON profile_blocks FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read media assets" ON media_assets;
CREATE POLICY "Public read media assets"
  ON media_assets FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin manage media assets" ON media_assets;
CREATE POLICY "Admin manage media assets"
  ON media_assets FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. 插入一些示例数据
INSERT INTO articles (title, slug, summary, content, category, tags, read_time, published) VALUES
(
  '从单页主页到课程设计完整站点',
  'build-portfolio',
  '记录如何把原本的单页个人主页改造成多页课程设计站点。',
  '## 项目背景\n\n这是计算机专业 Web 前端基础课程的大作业，要求完成一个至少包含多种页面类型的静态站点。\n\n## 设计思路\n\n先把页面类型拆清楚，再用共享样式和共享脚本把它们捏回一个统一博客主题。\n\n## 技术要点\n- 语义化 HTML 结构\n- CSS Grid + Flexbox 响应式布局\n- 原生 JavaScript 交互\n- 统一导航与样式复用',
  '课程设计',
  ARRAY['静态站点','作品集','CSS Grid'],
  8,
  true
),
(
  '前端学习路线与项目推进方法',
  'frontend-roadmap',
  '从 HTML、CSS、JavaScript 到组件化思维，梳理一条适合课堂项目和自学并行推进的学习路线。',
  '## 基础阶段\n\n### HTML & CSS\n- 语义化标签\n- 盒模型与定位\n- Flexbox & Grid\n- 响应式设计\n\n### JavaScript\n- DOM 操作\n- 事件处理\n- 本地存储\n- Fetch API\n\n## 进阶方向\n- 组件化思维\n- 状态管理\n- 构建工具\n- 框架入门',
  '学习路线',
  ARRAY['HTML','CSS','JavaScript','前端'],
  10,
  true
),
(
  '如何准备前端课程设计答辩',
  'defense-prep',
  '总结答辩时最容易被问到的页面结构、交互逻辑和样式复用问题。',
  '## 答辩要点\n\n### 1. 页面结构\n- 解释为什么要这样分层\n- 每个页面承担什么角色\n\n### 2. 交互逻辑\n- 轮播、表单验证、导航高亮\n- 如何保证用户体验\n\n### 3. 样式复用\n- CSS 变量系统\n- 组件化思路\n- 响应式断点选择\n\n## 常见问题\n- 为什么用原生 JS 而不是框架？\n- 如何处理浏览器兼容性？\n- 代码组织结构是怎样的？',
  '经验总结',
  ARRAY['答辩','表达','复盘'],
  6,
  true
) ON CONFLICT (slug) DO NOTHING;

-- 初始化分类
INSERT INTO categories (name, slug, article_count) VALUES
  ('课程设计', 'course-design', 1),
  ('学习路线', 'learning-path', 1),
  ('经验总结', 'experience', 1)
ON CONFLICT (name) DO NOTHING;

-- 初始化项目数据
INSERT INTO projects (title, slug, summary, description, status, tech_tags, cover_url, demo_url, repo_url, sort_order, published) VALUES
(
  '个人作品集学习博客',
  'portfolio-blog',
  '以个人主页为视觉起点，扩展出文章、项目、表单和资源导航的完整多页站点。',
  '聚合课程设计要求、内容展示、统一样式和前端交互逻辑的主项目。',
  '进行中',
  ARRAY['HTML','CSS','JavaScript'],
  '',
  '',
  '',
  1,
  true
),
(
  'JavaScript 交互组件集',
  'js-ui-components',
  '收纳轮播、表单校验、筛选和返回顶部等基础交互组件。',
  '用于复用课程设计中的常见交互模式。',
  '持续积累',
  ARRAY['DOM','事件','本地存储'],
  '',
  '',
  '',
  2,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- 初始化资源导航分组
INSERT INTO resource_groups (name, slug, description, sort_order, published) VALUES
  ('语法文档', 'docs', '写代码时最常翻的参考站。', 1, true),
  ('学习平台', 'learning', '课堂外的补充学习资源。', 2, true),
  ('开发工具', 'tools', '日常开发中离不开的工具。', 3, true),
  ('设计灵感', 'design', '页面设计时的参考来源。', 4, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO resource_links (group_id, title, description, href, label, sort_order, published)
SELECT id, 'MDN Web Docs', 'Mozilla 维护的前端技术文档。', 'https://developer.mozilla.org/zh-CN/', 'HTML / CSS / JS', 1, true
FROM resource_groups rg
WHERE slug = 'docs'
  AND NOT EXISTS (
    SELECT 1 FROM resource_links rl
    WHERE rl.group_id = rg.id
      AND rl.href = 'https://developer.mozilla.org/zh-CN/'
  );

INSERT INTO resource_links (group_id, title, description, href, label, sort_order, published)
SELECT id, '菜鸟教程', '快速回顾基础知识点的中文学习站点。', 'https://www.runoob.com/', '基础复盘', 1, true
FROM resource_groups rg
WHERE slug = 'learning'
  AND NOT EXISTS (
    SELECT 1 FROM resource_links rl
    WHERE rl.group_id = rg.id
      AND rl.href = 'https://www.runoob.com/'
  );

INSERT INTO resource_links (group_id, title, description, href, label, sort_order, published)
SELECT id, 'GitHub', '代码托管与优秀项目参考平台。', 'https://github.com/explore', '代码托管', 1, true
FROM resource_groups rg
WHERE slug = 'tools'
  AND NOT EXISTS (
    SELECT 1 FROM resource_links rl
    WHERE rl.group_id = rg.id
      AND rl.href = 'https://github.com/explore'
  );

INSERT INTO resource_links (group_id, title, description, href, label, sort_order, published)
SELECT id, 'Dribbble', '页面视觉灵感来源。', 'https://dribbble.com/', 'UI 设计', 1, true
FROM resource_groups rg
WHERE slug = 'design'
  AND NOT EXISTS (
    SELECT 1 FROM resource_links rl
    WHERE rl.group_id = rg.id
      AND rl.href = 'https://dribbble.com/'
  );

-- 初始化表格项
INSERT INTO schedule_items (task_name, time_range, goal, status, sort_order, published)
SELECT seed.task_name, seed.time_range, seed.goal, seed.status, seed.sort_order, seed.published
FROM (
  VALUES
    ('首页轮播与导航联调', '周一 9:00-11:00', '完成首页核心交互', '已完成', 1, true),
    ('文章列表与详情编排', '周二 14:00-16:00', '打通文章浏览路径', '进行中', 2, true),
    ('表单验证与留言页面', '周三 10:00-12:00', '完成设置页和留言演示', '待开始', 3, true)
) AS seed(task_name, time_range, goal, status, sort_order, published)
WHERE NOT EXISTS (
  SELECT 1 FROM schedule_items existing
  WHERE existing.task_name = seed.task_name
);

-- 初始化站点设置
INSERT INTO site_settings (setting_key, label, setting_value) VALUES
  ('brand_mark', '品牌标记', to_jsonb('X'::text)),
  ('brand_name', '站点名称', to_jsonb('熊帆的博客'::text)),
  ('brand_subtitle', '站点副标题', to_jsonb('课程设计作品集'::text)),
  ('author_name', '作者名称', to_jsonb('熊帆'::text)),
  ('author_bio', '作者简介', to_jsonb('专注于前端开发与 AI 交互设计'::text)),
  ('author_avatar', '作者头像', to_jsonb('images/avatar.png'::text)),
  ('resume_meta', '简历头部信息', to_jsonb('东华理工大学 · 软件工程专业 · 大二在读'::text)),
  ('resume_summary', '简历头部简介', to_jsonb('专注前端开发与 AI Agent 方向，喜欢用技术解决实际问题'::text)),
  ('resume_avatar_text', '简历头像文案', to_jsonb('熊'::text)),
  (
    'author_social_links',
    '作者社交链接',
    '[
      {"label":"Bilibili","href":"https://space.bilibili.com/441548806?spm_id_from=333.1007.0.0","icon":"fa-brands fa-bilibili","color":"#fb7299"},
      {"label":"Google Mail","href":"mailto:2150489918xf@gmail.com","icon":"fab fa-google","color":"#d44638","external":false},
      {"label":"GitHub","href":"https://github.com/2150489918xf-a11y","icon":"fab fa-github","color":"#24292e"},
      {"label":"QQ Mail","href":"mailto:2150489918@qq.com","icon":"fas fa-envelope","color":"#ea4335","external":false}
    ]'::jsonb
  )
ON CONFLICT (setting_key) DO NOTHING;

-- 初始化导航项
INSERT INTO navigation_items (label, href, icon, sort_order, visible)
SELECT seed.label, seed.href, seed.icon, seed.sort_order, seed.visible
FROM (
  VALUES
    ('首页', './index.html', 'fas fa-home', 1, true),
    ('学习笔记', './pages/articles/index.html', 'fas fa-book', 2, true),
    ('实战教程', './pages/projects/index.html', 'fas fa-graduation-cap', 3, true),
    ('资源导航', './pages/resources/links.html', 'fas fa-folder-open', 4, true),
    ('互动交流', './pages/about/contact.html', 'fas fa-comments', 5, true),
    ('关于', './pages/profile/resume.html', 'fas fa-info-circle', 6, true)
) AS seed(label, href, icon, sort_order, visible)
WHERE NOT EXISTS (
  SELECT 1 FROM navigation_items existing
  WHERE existing.href = seed.href
);

-- 初始化首页区块
INSERT INTO page_sections (page_key, section_key, eyebrow, title, description, content, sort_order, published) VALUES
(
  'home',
  'note_board',
  '最近更新',
  '学习动态速览',
  '进入文章列表',
  '{
    "cards": [
      {"tag":"Spring AI","title":"课程设计整体站点","description":"把文章、项目、表单和数据页串成统一视觉的多页静态站。","tone":"note-card-mint"},
      {"tag":"前端练习","title":"登录注册与留言流","description":"用原生 JavaScript 完成前端验证和提交反馈展示。","tone":"note-card-lemon"},
      {"tag":"布局实验","title":"三栏文章阅读页","description":"左侧章节导航，右侧目录，中央长内容阅读区域。","tone":"note-card-ice"},
      {"tag":"资料整理","title":"表格与资源导航","description":"展示学习计划、常用工具和课程设计答辩辅助内容。","tone":"note-card-rose"}
    ]
  }'::jsonb,
  1,
  true
)
ON CONFLICT (page_key, section_key) DO NOTHING;

-- 初始化简历区块
INSERT INTO profile_blocks (block_key, title, subtitle, content, sort_order, published) VALUES
(
  'basic_info',
  '个人资料',
  '基本信息',
  '{
    "layout": "summary-grid",
    "items": [
      {"title":"姓名","value":"熊帆"},
      {"title":"学校","value":"东华理工大学"},
      {"title":"专业","value":"软件工程"},
      {"title":"年级","value":"大二（2023级）"}
    ]
  }'::jsonb,
  1,
  true
),
(
  'skills',
  '目前掌握的技术',
  '技术栈',
  '{
    "layout": "badge-grid",
    "items": ["HTML5 / CSS3", "JavaScript (ES6+)", "Vue.js", "Node.js", "Git / GitHub", "响应式布局", "AI Agent 开发", "Prompt Engineering", "LangChain", "Claude API"]
  }'::jsonb,
  2,
  true
),
(
  'timeline',
  '成长时间线',
  '学习经历',
  '{
    "layout": "timeline",
    "items": [
      {"title":"开始接触前端开发","time":"2024 年秋季学期","description":"通过学校的 Web 前端基础课程入门，学习了 HTML 语义化标签、CSS 盒模型和基础布局，完成了第一个静态页面作品。"},
      {"title":"深入 JavaScript 与交互开发","time":"2025 年春季学期","description":"系统学习 JavaScript 核心语法，掌握 DOM 操作、事件机制、异步编程，独立完成了轮播图、表单验证等交互组件。"},
      {"title":"探索 AI 智能体技术","time":"2025 年下半年","description":"对 AI Agent 产生浓厚兴趣，学习了 Prompt Engineering、LangChain 框架和 Claude API 调用，尝试构建简单的对话式智能体应用。"},
      {"title":"课程设计综合实践","time":"2026 年春季学期","description":"将前端技术与项目管理能力结合，独立完成这个多页面博客型课程设计作品集，涵盖页面布局、交互逻辑和样式系统设计。"}
    ]
  }'::jsonb,
  3,
  true
),
(
  'interests',
  '技术之外的生活',
  '兴趣爱好',
  '{
    "layout": "badge-grid",
    "items": ["阅读技术博客", "开源项目探索", "AI 产品体验", "校园技术分享", "跑步健身"]
  }'::jsonb,
  4,
  true
),
(
  'self_evaluation',
  '对自己的认知',
  '自我评价',
  '{
    "layout": "prose",
    "paragraphs": [
      "我是一个喜欢动手实践的人，比起纯粹的理论学习，更倾向于通过做项目来理解技术。在前端开发方面，我注重代码的结构清晰和样式的一致性，习惯在项目开始前先规划好页面结构和命名规范。",
      "对 AI 智能体方向的探索让我意识到，前端不仅是画页面，更是连接用户和智能服务的桥梁。未来希望能在前端工程化和 AI 应用开发的交叉领域持续深入，把技术真正用在解决问题上。",
      "目前最想提升的能力是工程化思维和系统设计能力，希望从能写出来进化到写得好、组织得好。"
    ]
  }'::jsonb,
  5,
  true
)
ON CONFLICT (block_key) DO NOTHING;
