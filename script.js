const articleCatalog = [
  {
    title: "从单页主页到课程设计完整站点",
    category: "课程设计",
    date: "2026-04-27",
    summary: "记录如何把原本的单页个人主页改造成 12 页课程设计站点，包括页面拆分、统一导航和共享样式设计。",
    path: "pages/articles/build-portfolio.html",
    readTime: "阅读 8 分钟",
    tags: ["课程设计", "静态站点", "作品集"],
  },
  {
    title: "前端学习路线与项目推进方法",
    category: "学习路线",
    date: "2026-04-24",
    summary: "从 HTML、CSS、JavaScript 到组件化思维，梳理一条适合课堂项目和自学并行推进的学习路线。",
    path: "pages/articles/frontend-roadmap.html",
    readTime: "阅读 10 分钟",
    tags: ["HTML", "CSS", "JavaScript"],
  },
  {
    title: "如何准备前端课程设计答辩",
    category: "经验总结",
    date: "2026-04-21",
    summary: "总结答辩时最容易被问到的页面结构、交互逻辑和样式复用问题，并给出回答组织方式。",
    path: "pages/articles/index.html",
    readTime: "阅读 6 分钟",
    tags: ["答辩", "表达", "复盘"],
  },
  {
    title: "仿 Cactus 博客布局的两栏实现",
    category: "布局实验",
    date: "2026-04-18",
    summary: "用主内容流加右侧固定信息栏的方式，还原博客阅读时左侧滚动、右侧目录保持可见的体验。",
    path: "pages/articles/index.html",
    readTime: "阅读 7 分钟",
    tags: ["CSS Grid", "Sticky", "响应式"],
  },
  
  {
    title: "学习计划表格页的可读性优化",
    category: "数据展示",
    date: "2026-04-12",
    summary: "用状态标签、行间距和响应式容器，让学习计划表既满足课程要求，也方便在窄屏设备阅读。",
    path: "pages/data/schedule.html",
    readTime: "阅读 4 分钟",
    tags: ["表格", "可读性", "课程安排"],
  },
  {
    title: "资源导航页如何组织外部链接",
    category: "资源整理",
    date: "2026-04-09",
    summary: "把 MDN、教程、兼容性工具和项目参考按学习场景归类，让资源页不只是链接堆砌。",
    path: "pages/resources/links.html",
    readTime: "阅读 4 分钟",
    tags: ["资源导航", "MDN", "工具"],
  },
  {
    title: "项目展示卡片的内容层级",
    category: "项目展示",
    date: "2026-04-06",
    summary: "为每个项目卡片安排标题、状态、技术栈和一句话总结，突出作品集页面的信息密度。",
    path: "pages/projects/index.html",
    readTime: "阅读 6 分钟",
    tags: ["项目", "卡片", "信息架构"],
  },
];

const projectCatalog = [
  {
    title: "个人作品集学习博客",
    stack: "HTML / CSS / JavaScript",
    state: "当前作业主项目",
    summary: "以个人主页为视觉起点，扩展出文章、项目、表单和资源导航的完整多页站点。",
  },
  {
    title: "JavaScript 交互小练习",
    stack: "DOM / 事件 / 本地存储",
    state: "持续积累",
    summary: "收纳轮播、表单校验、筛选、返回顶部等基础交互逻辑，为课程设计提供可复用组件。",
  },
  {
    title: "校园活动记录卡片页",
    stack: "语义化 HTML / 响应式布局",
    state: "展示内容补充",
    summary: "用于展示社团活动、技术分享、课堂项目等校园生活内容，强化站点内容厚度。",
  },
  {
    title: "学习计划与进度表",
    stack: "表格设计 / 状态标签",
    state: "用于表格页",
    summary: "通过表格可视化学习任务、课程安排和技能掌握度，展示信息组织与样式控制能力。",
  },
];

const friendLinkCatalog = [
  {
    title: "MDN Web Docs",
    desc: "查 HTML、CSS、JavaScript 语法和规范时最稳定的技术参考。",
    href: "https://developer.mozilla.org/zh-CN/",
    label: "语法文档",
  },
  {
    title: "菜鸟教程前端专栏",
    desc: "快速复盘基础概念时很好用，适合课堂知识点回看。",
    href: "https://www.runoob.com/",
    label: "入门复习",
  },
  {
    title: "Can I use",
    desc: "查看浏览器兼容性时的实用工具，方便说明兼容性考虑。",
    href: "https://caniuse.com/",
    label: "兼容性",
  },
  {
    title: "GitHub Explore",
    desc: "观察项目展示方式和 README 结构时可以借鉴的参考来源。",
    href: "https://github.com/explore",
    label: "项目参考",
  },
];

const scheduleRows = [
  { task: "首页轮播与导航联调", time: "周一 9:00-11:00", goal: "完成首页核心交互", status: "已完成" },
  { task: "文章列表与详情编排", time: "周二 14:00-16:00", goal: "打通文章浏览路径", status: "进行中" },
  { task: "表单验证与留言页面", time: "周三 10:00-12:00", goal: "完成设置页和留言演示", status: "待开始" },
  { task: "表格页与链接页完善", time: "周四 15:00-17:00", goal: "补齐指定页面类型", status: "已完成" },
];

const defaultMessages = [
  {
    title: "系统提示",
    summary: "这里会展示从设置页和留言页提交过来的表单摘要。",
    time: "首次进入",
  },
];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function resolvePath(target) {
  if (/^https?:/i.test(target)) {
    return target;
  }

  const root = document.body.dataset.root;
  if (!root) {
    return target;
  }

  return `${root}/${target}`;
}

function renderClock() {
  const clock = document.getElementById("siteClock");
  if (!clock) {
    return;
  }

  const now = new Date();
  const weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][now.getDay()];
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  const time = [String(now.getHours()).padStart(2, "0"), String(now.getMinutes()).padStart(2, "0"), String(now.getSeconds()).padStart(2, "0")].join(":");
  clock.textContent = `${date} ${weekday} ${time}`;
}

function initClock() {
  renderClock();
  window.setInterval(renderClock, 1000);
}

function initDropdowns() {
  const dropdowns = document.querySelectorAll("[data-nav-dropdown]");

  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector("[data-dropdown-button]");
    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      const willOpen = !dropdown.classList.contains("is-open");
      dropdowns.forEach((item) => {
        item.classList.remove("is-open");
        item.querySelector("[data-dropdown-button]")?.setAttribute("aria-expanded", "false");
      });

      if (willOpen) {
        dropdown.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  document.addEventListener("click", (event) => {
    dropdowns.forEach((dropdown) => {
      if (!dropdown.contains(event.target)) {
        dropdown.classList.remove("is-open");
        dropdown.querySelector("[data-dropdown-button]")?.setAttribute("aria-expanded", "false");
      }
    });
  });
}

function initBackToTop() {
  const button = document.getElementById("backToTop");
  if (!button) {
    return;
  }

  const toggle = () => {
    button.classList.toggle("is-visible", window.scrollY > 320);
  };

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
  });

  window.addEventListener("scroll", toggle, { passive: true });
  toggle();
}

function markCurrentPage() {
  const currentPage = document.body.dataset.page;
  if (!currentPage) {
    return;
  }

  document.querySelectorAll("[data-nav-page]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.navPage === currentPage);
  });
}

function buildArticleCover(index) {
  const palettes = [
    ["#e8faff", "#4954e6", "#ff7368", "#ffffff"],
    ["#fff8dc", "#57c6e1", "#b49fda", "#fdd663"],
    ["#f5edff", "#81c995", "#4954e6", "#ffffff"],
  ];
  const palette = palettes[index % palettes.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300">
      <rect width="600" height="300" rx="28" fill="${palette[0]}"/>
      <circle cx="445" cy="72" r="82" fill="${palette[2]}" opacity="0.28"/>
      <circle cx="305" cy="145" r="62" fill="${palette[3]}" opacity="0.9"/>
      <path d="M88 250 205 78 322 250Z" fill="${palette[1]}" opacity="0.88"/>
      <path d="M395 256 493 92 575 256Z" fill="${palette[2]}" opacity="0.9"/>
      <rect x="40" y="34" width="138" height="36" rx="18" fill="white" opacity="0.58"/>
    </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function createArticleCard(article, index) {
  const isSticky = index === 0; // 假设第一篇文章是置顶的
  const stickyHtml = isSticky ? `<div class="article-sticky"><i class="fas fa-thumbtack"></i> 置顶</div>` : '';
  const tagHtml = article.tags
    ? `<div class="article-tags">${article.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>`
    : "";
  
  const imgUrl = buildArticleCover(index);
  
  return `
    <article class="article-card butterfly-article">
      ${stickyHtml}
      <div class="article-cover">
        <img src="${imgUrl}" alt="article cover">
      </div>
      <div class="article-info">
        <h3><a href="${resolvePath(article.path)}">${article.title}</a></h3>
        <div class="article-meta">
          <span><i class="far fa-calendar-alt"></i> ${article.date}</span>
          <span><i class="fas fa-inbox"></i> ${article.category}</span>
          <span><i class="fas fa-clock"></i> ${article.readTime}</span>
        </div>
        <p class="article-summary">${article.summary}</p>
        ${tagHtml}
      </div>
    </article>
  `;
}

function renderHomeArticles() {
  const container = document.getElementById("articleList");
  if (container) {
    container.innerHTML = articleCatalog.map(createArticleCard).join("");
  }
}

function renderArticleCatalog() {
  const container = document.getElementById("articleCatalogList");
  if (!container) {
    return;
  }

  const buttons = Array.from(document.querySelectorAll("[data-article-filter]"));
  let currentFilter = "全部";

  const paint = () => {
    const filtered = currentFilter === "全部"
      ? articleCatalog
      : articleCatalog.filter((article) => article.category === currentFilter);

    container.innerHTML = filtered.length > 0
      ? filtered.map(createArticleCard).join("")
      : '<div class="empty-state">当前分类暂无文章，切换到其他分类继续查看。</div>';

    buttons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.articleFilter === currentFilter);
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.articleFilter;
      paint();
    });
  });

  paint();
}

function createProjectCard(project) {
  return `
    <article class="project-card">
      <span class="chip">${project.state}</span>
      <h3>${project.title}</h3>
      <p>${project.summary}</p>
      <div class="project-meta">
        <span>${project.stack}</span>
      </div>
    </article>
  `;
}

function renderProjectCards() {
  const homeGrid = document.getElementById("projectHighlights");
  if (homeGrid) {
    homeGrid.innerHTML = projectCatalog.map(createProjectCard).join("");
  }

  const pageGrid = document.getElementById("projectCatalogGrid");
  if (pageGrid) {
    pageGrid.innerHTML = projectCatalog.map(createProjectCard).join("");
  }
}

function renderFriendLinks() {
  const container = document.getElementById("friendLinks");
  if (!container) {
    return;
  }

  container.innerHTML = friendLinkCatalog
    .map(
      (item) => `
        <a class="friend-link" href="${item.href}" target="_blank" rel="noreferrer noopener">
          <span>${item.label}</span>
          <strong>${item.title}</strong>
          <p>${item.desc}</p>
        </a>
      `,
    )
    .join("");
}

function countValues(values) {
  return values.reduce((counts, value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
    return counts;
  }, new Map());
}

function renderSidebarDirectory() {
  const articleList = document.getElementById("sidebarArticleList");
  if (articleList) {
    articleList.innerHTML = articleCatalog
      .map(
        (article) => `
          <li>
            <a href="${resolvePath(article.path)}">
              <strong>${article.title}</strong>
              <span>${article.category} · ${article.readTime.replace("阅读 ", "")}</span>
            </a>
          </li>
        `,
      )
      .join("");
  }

  const categoryList = document.getElementById("sidebarCategoryList");
  if (categoryList) {
    const categories = countValues(articleCatalog.map((article) => article.category));
    categoryList.innerHTML = Array.from(categories.entries())
      .map(([category, count], index) => `<span class="sidebar-pill tone-${(index % 6) + 1}">${category}<b>${count}</b></span>`)
      .join("");
  }

  const tagList = document.getElementById("sidebarTagList");
  if (tagList) {
    const tags = countValues(articleCatalog.flatMap((article) => article.tags || []));
    tagList.innerHTML = Array.from(tags.entries())
      .map(([tag, count], index) => `<span class="sidebar-pill tone-${(index % 6) + 1}">${tag}<b>${count}</b></span>`)
      .join("");
  }

  const timelineList = document.getElementById("sidebarTimelineList");
  if (timelineList) {
    timelineList.innerHTML = articleCatalog
      .map((article) => {
        const date = new Date(`${article.date}T00:00:00`);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `
          <li>
            <time datetime="${article.date}">${month}/${day}</time>
            <a href="${resolvePath(article.path)}">${article.title}</a>
          </li>
        `;
      })
      .join("");
  }
}

function initSidebarTabs() {
  const tabs = Array.from(document.querySelectorAll("[data-sidebar-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-sidebar-panel]"));

  if (tabs.length === 0 || panels.length === 0) {
    return;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.sidebarTab;

      tabs.forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.sidebarPanel === target;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });
    });
  });
}

function renderScheduleTable() {
  const tbody = document.getElementById("scheduleTableBody");
  if (!tbody) {
    return;
  }

  tbody.innerHTML = scheduleRows
    .map((row) => {
      let statusClass = "status-warn";
      if (row.status === "已完成") {
        statusClass = "status-good";
      } else if (row.status === "进行中") {
        statusClass = "status-hot";
      }

      return `
        <tr>
          <td>${row.task}</td>
          <td>${row.time}</td>
          <td>${row.goal}</td>
          <td><span class="status-pill ${statusClass}">${row.status}</span></td>
        </tr>
      `;
    })
    .join("");
}

function initCarousel() {
  const root = document.getElementById("heroCarousel");
  if (!root) {
    return;
  }

  const slides = Array.from(root.querySelectorAll("[data-slide]"));
  const dots = Array.from(root.querySelectorAll("[data-carousel-dot]"));
  let activeIndex = 0;
  let timerId = null;

  const sync = () => {
    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === activeIndex);
    });
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeIndex);
    });
  };

  const goTo = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    sync();
  };

  const restart = () => {
    if (timerId) {
      window.clearInterval(timerId);
    }

    if (!prefersReducedMotion.matches) {
      timerId = window.setInterval(() => {
        goTo(activeIndex + 1);
      }, 4200);
    }
  };

  root.querySelector("[data-carousel-prev]")?.addEventListener("click", () => {
    goTo(activeIndex - 1);
    restart();
  });

  root.querySelector("[data-carousel-next]")?.addEventListener("click", () => {
    goTo(activeIndex + 1);
    restart();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      goTo(Number(dot.dataset.carouselDot));
      restart();
    });
  });

  sync();
  restart();
}

function readMessages() {
  try {
    const raw = window.sessionStorage.getItem("courseMessages");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages) {
  window.sessionStorage.setItem("courseMessages", JSON.stringify(messages));
}

function pushMessage(message) {
  const history = readMessages();
  history.unshift(message);
  saveMessages(history.slice(0, 8));
}

function renderMessages() {
  const container = document.getElementById("messageList");
  if (!container) {
    return;
  }

  const history = readMessages();
  const records = history.length > 0 ? history : defaultMessages;
  container.innerHTML = records
    .map(
      (item) => `
        <article class="summary-card">
          <span class="chip">${item.time}</span>
          <h3>${item.title}</h3>
          <p>${item.summary}</p>
        </article>
      `,
    )
    .join("");
}

function setError(form, fieldName, message) {
  const node = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (node) {
    node.textContent = message;
  }
}

function clearErrors(form) {
  form.querySelectorAll("[data-error-for]").forEach((node) => {
    node.textContent = "";
  });
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateForm(form) {
  clearErrors(form);
  const type = form.dataset.formType;
  let valid = true;

  const getValue = (name) => String(new FormData(form).get(name) || "").trim();

  if (type === "settings") {
    const nickname = getValue("nickname");
    const studentId = getValue("studentId");
    const password = getValue("password");
    const major = getValue("major");
    const gender = getValue("gender");
    const bio = getValue("bio");
    const interests = Array.from(form.querySelectorAll('input[name="interests"]:checked')).map((item) => item.value);

    if (nickname.length < 2) {
      setError(form, "nickname", "昵称至少 2 个字。");
      valid = false;
    }
    if (!/^\d{8,12}$/.test(studentId)) {
      setError(form, "studentId", "学号应为 8 到 12 位数字。");
      valid = false;
    }
    if (password.length < 6) {
      setError(form, "password", "密码至少 6 位。");
      valid = false;
    }
    if (!major) {
      setError(form, "major", "请选择主修方向。");
      valid = false;
    }
    if (!gender) {
      setError(form, "gender", "请选择性别。");
      valid = false;
    }
    if (interests.length === 0) {
      setError(form, "interests", "至少勾选一个兴趣方向。");
      valid = false;
    }
    if (bio.length < 20) {
      setError(form, "bio", "自我介绍不少于 20 个字。");
      valid = false;
    }
  }

  

  if (type === "contact") {
    const name = getValue("name");
    const email = getValue("email");
    const content = getValue("content");
    if (name.length < 2) {
      setError(form, "name", "姓名至少 2 个字。");
      valid = false;
    }
    if (!validateEmail(email)) {
      setError(form, "email", "请输入正确的邮箱地址。");
      valid = false;
    }
    if (content.length < 10) {
      setError(form, "content", "留言内容不少于 10 个字。");
      valid = false;
    }
  }

  return valid;
}

function buildMessage(form) {
  const type = form.dataset.formType;
  const now = new Date().toLocaleString("zh-CN", { hour12: false });
  const data = new FormData(form);

  if (type === "settings") {
    return {
      title: "个人信息设置已保存",
      summary: `昵称 ${data.get("nickname")}，方向 ${data.get("major")}，资料填写已通过前端校验。`,
      time: now,
    };
  }

  

  return {
    title: `来自 ${data.get("name")} 的留言`,
    summary: `${data.get("content")}`,
    time: now,
  };
}

function initForms() {
  document.querySelectorAll("form[data-form-type]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateForm(form)) {
        return;
      }

      pushMessage(buildMessage(form));

      if (form.dataset.formType === "contact") {
        form.reset();
        renderMessages();
        return;
      }

      window.location.href = resolvePath("pages/about/contact.html");
    });
  });
}

function initCursorEffects() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:999999999;width:100vw;height:100vh;';
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  const particles = [];
  let w = window.innerWidth;
  let h = window.innerHeight;

  canvas.width = w;
  canvas.height = h;
  
  window.addEventListener('resize', () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  });
  
  const colors = ['#49b1f5', '#ff7242', '#00c4b6', '#f6d563', '#ff6b81'];
  
  function createParticles(x, y) {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: Math.random() * 0.02 + 0.015
      });
    }
  }
  
  function render() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // 重力效果
      p.life -= p.decay;
      p.size = Math.max(0, p.size - 0.05);
      
      if (p.life <= 0) {
        particles.splice(i, 1);
        i--;
        continue;
      }
      
      ctx.beginPath();
      // 绘制五角星或圆形，这里为了性能和简洁绘制圆形小碎块
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(render);
  }
  
  document.addEventListener('click', (e) => {
    createParticles(e.clientX, e.clientY);
  });
  
  render();
}

function initAmbientBackground() {
  let background = document.querySelector(".bg-animated");

  if (!background) {
    background = document.createElement("div");
    background.className = "bg-animated";
    document.body.prepend(background);
  }

  background.setAttribute("aria-hidden", "true");

  for (let index = 1; index <= 8; index++) {
    const className = `shape${index}`;
    let shape = document.querySelector(`.${className}`);

    if (!shape) {
      shape = document.createElement("div");
      shape.className = `shape ${className}`;
      document.body.insertBefore(shape, background.nextSibling);
    }

    shape.setAttribute("aria-hidden", "true");
  }
}

function boot() {
  initAmbientBackground();
  markCurrentPage();
  initClock();
  initDropdowns();
  initBackToTop();
  renderHomeArticles();
  renderArticleCatalog();
  renderProjectCards();
  renderFriendLinks();
  renderSidebarDirectory();
  renderScheduleTable();
  renderMessages();
  initCarousel();
  initSidebarTabs();
  initForms();
  initCursorEffects();
}

document.addEventListener("DOMContentLoaded", boot);
