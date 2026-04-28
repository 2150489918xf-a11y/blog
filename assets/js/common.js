/**
 * 动态背景注入
 * =============
 * 自动创建全站统一的渐变背景 + 3 个浮动装饰形状。
 * HTML 无需手写背景 div，由此脚本在页面加载时自动注入。
 *
 * 加载方式：页面底部加 <script src="assets/js/ambient-bg.js" defer></script>
 */

(function () {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  function inject() {
    // 渐变背景层
    var bg = document.querySelector('.bg-animated');
    if (!bg) {
      bg = document.createElement('div');
      bg.className = 'bg-animated';
      bg.setAttribute('aria-hidden', 'true');
      document.body.prepend(bg);
    }

    // 3 个浮动装饰形状
    for (var i = 1; i <= 3; i++) {
      var cls = 'shape' + i;
      if (!document.querySelector('.' + cls)) {
        var shape = document.createElement('div');
        shape.className = 'shape ' + cls;
        shape.setAttribute('aria-hidden', 'true');
        document.body.insertBefore(shape, bg.nextSibling);
      }
    }
  }
})();
/**
 * 鼠标点击粒子效果
 * =================
 * 点击页面任意位置产生彩色粒子炸开动画，带重力下落和渐隐。
 * 会自动创建一个全屏 canvas 覆盖层来渲染粒子。
 *
 * 加载方式：页面底部加 <script src="assets/js/click-particle.js" defer></script>
 * 当前所有前台页面 + admin.html 均已引入。
 */

(function () {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:999999999;width:100vw;height:100vh;';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var particles = [];
    var w = window.innerWidth;
    var h = window.innerHeight;

    canvas.width = w;
    canvas.height = h;

    window.addEventListener('resize', function () {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    });

    var colors = [
      '#49b1f5', '#ff7242', '#00c4b6', '#f6d563', '#ff6b81',
      '#a78bfa', '#f472b6', '#34d399', '#fb923c', '#38bdf8',
      '#fbbf24', '#818cf8', '#e879f9', '#22d3ee', '#fb7185'
    ];

    function createParticles(x, y) {
      var count = 18;
      for (var i = 0; i < count; i++) {
        particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          size: Math.random() * 3 + 2.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1,
          decay: Math.random() * 0.025 + 0.018,
          rotation: Math.random() * Math.PI * 2
        });
      }
    }

    function render() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= p.decay;
        p.size = Math.max(0, p.size - 0.03);
        p.rotation += 0.05;

        if (p.life <= 0) {
          particles.splice(i, 1);
          i--;
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(render);
    }

    document.addEventListener('click', function (e) {
      createParticles(e.clientX, e.clientY);
    });

    render();
  }
})();

/**
 * 全站顶栏注入
 * ============
 * 自动创建统一的 site-header（品牌 + 导航 + 时钟）。
 * HTML 无需手写 header，路径根据 data-root 自动适配。
 */
(function () {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  function inject() {
    if (document.querySelector('.site-header')) return;

    var root = document.body.dataset.root || '.';
    var header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML =
      '<div class="shell site-header-inner">' +
        '<a class="brand" href="' + root + '/index.html" aria-label="返回首页">' +
          '<span class="brand-mark">X</span>' +
          '<span class="brand-copy">' +
            '<strong>个人博客</strong>' +
            '<small>课程设计作品集</small>' +
          '</span>' +
        '</a>' +
        '<nav class="site-nav" aria-label="主导航">' +
          '<ul class="menu-list">' +
            '<li><a class="menu-link" href="' + root + '/index.html" data-nav-page="home"><i class="fas fa-home"></i> 首页</a></li>' +
            '<li><a class="menu-link" href="' + root + '/pages/articles/index.html" data-nav-page="articles"><i class="fas fa-book"></i> 学习笔记</a></li>' +
            '<li><a class="menu-link" href="' + root + '/pages/projects/index.html" data-nav-page="projects"><i class="fas fa-graduation-cap"></i> 实战教程</a></li>' +
            '<li><a class="menu-link" href="' + root + '/pages/resources/links.html" data-nav-page="resources"><i class="fas fa-folder-open"></i> 资源导航</a></li>' +
            '<li><a class="menu-link" href="' + root + '/pages/about/contact.html" data-nav-page="contact"><i class="fas fa-comments"></i> 互动交流</a></li>' +
            '<li><a class="menu-link" href="' + root + '/pages/profile/resume.html" data-nav-page="resume"><i class="fas fa-info-circle"></i> 关于</a></li>' +
          '</ul>' +
        '</nav>' +
        '<div class="clock-panel" id="siteClock" aria-live="polite">正在加载时间...</div>' +
      '</div>';
    document.body.prepend(header);
  }
})();
