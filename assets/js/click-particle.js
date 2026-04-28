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
