# 知行成长笔记 — 个人博客型课程设计作品集

计算机专业课程设计项目，一个多页面个人博客/作品集站点，包含文章系统、项目管理、资源导航、学习计划等模块，配备完整的后台管理系统。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 / CSS3 / 原生 JavaScript（无框架） |
| 后端 | [Supabase](https://supabase.com)（BaaS，PostgreSQL + Storage） |
| 图标 | Font Awesome 6 |
| 部署 | Vercel / 任意静态托管 |

## 功能概览

### 前台（访客可见）

- 首页轮播、精选卡片、文章列表、学习计划路线图
- 学习笔记（文章列表 + 独立详情页）
- 实战教程（项目列表 + 独立详情页，含演示/仓库链接）
- 资源导航（分组展示外部链接）
- 互动交流（留言板 + 联系方式）
- 关于我（个人资料、技能、时间线）
- 全站响应式适配（桌面 / 平板 / 手机）
- 实时时钟、返回顶部

### 管理后台

- 文章管理 — Markdown 编辑器 + 实时预览 + 图片拖拽/粘贴上传
- 项目管理 — Markdown 编辑器 + 演示链接/仓库链接
- 资源分组 & 资源链接管理
- 表格内容（学习计划）管理
- 站点设置（统一管理品牌、作者、联系方式等全局配置）
- 导航配置
- 页面内容（轮播图、卡片组等可视化编辑器）
- 简历区块管理
- Supabase Storage 图片上传
- localStorage 缓存（10 分钟 TTL，写操作自动失效）

## 项目结构

```
Web_Project/
├── index.html                     # 首页
├── admin.html                     # 管理后台
├── styles.css                     # 全站通用样式
├── admin.css                      # 后台专用样式
├── script.js                      # 前台渲染逻辑
├── supabase.js                    # Supabase SDK 封装 + CRUD
├── admin.js                       # 后台管理逻辑
├── images/                        # 封面兜底图 + 头像
├── pages/
│   ├── articles/
│   │   ├── index.html             # 文章列表
│   │   ├── frontend-roadmap.html  # 文章详情（示例）
│   │   └── build-portfolio.html   # 文章详情（示例）
│   ├── projects/
│   │   ├── index.html             # 项目列表
│   │   └── detail.html            # 项目详情（动态加载 Supabase 数据）
│   ├── resources/
│   │   └── links.html             # 资源导航
│   ├── about/
│   │   └── contact.html           # 互动交流
│   └── profile/
│       └── resume.html            # 关于我
└── docs/                          # 设计文档
```

## 本地运行

1. 克隆仓库
```bash
git clone https://github.com/2150489918xf-a11y/blog.git
cd blog
```

2. 直接用浏览器打开 `index.html`，或者用任意静态服务：
```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

3. 访问 `http://localhost:8080`

管理后台入口：`admin.html`，需要配置 Supabase 认证（邮箱 + 密码登录）。

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入仓库
3. 无需配置 Framework、Build Command、Output Directory，直接 Deploy

## 数据存储

所有内容数据（文章、项目、资源、设置等）存储在 Supabase 的 PostgreSQL 数据库中。图片上传到 Supabase Storage。

本地开发时使用 `supabase.js` 中配置的 Supabase 项目地址和公开密钥，无需额外环境变量。

## 关于

东华理工大学 软件工程专业 2024 级课程设计作品。

独立完成，从零搭建的项目结构、样式系统和 JavaScript 交互逻辑。
