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

-- 4. 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles (published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category);

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
);

-- 初始化分类
INSERT INTO categories (name, slug, article_count) VALUES
  ('课程设计', 'course-design', 1),
  ('学习路线', 'learning-path', 1),
  ('经验总结', 'experience', 1)
ON CONFLICT (name) DO NOTHING;
