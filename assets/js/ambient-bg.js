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
