/**
 * Lenis smooth scroll. Inertia вместо нативного wheel — главное что
 * меняет ощущение «резкости» сайта.
 *
 * Lenis крутится в общем gsap.ticker (один rAF на всё) и шлёт updates
 * в ScrollTrigger — иначе scrub-таймлайны отстают за scroll-position'ом.
 *
 * Глобально доступен как window.lenis — другие скрипты могут
 * остановить/возобновить скролл (например при открытом модалке).
 *
 * Якорные ссылки (a[href^="#"]) перехватываются и скроллятся через
 * lenis.scrollTo — иначе браузер делает мгновенный snap.
 */

(() => {
  // lerp: коэффициент доводки (Lenis на каждом кадре сдвигает текущую
  // позицию на lerp% к таргету). Меньше = плавнее и «ленивее».
  // 0.07 = заметно премиальный feel, 0.1 = почти нативный, 0.05 = слишком вязко.
  const LERP = 0.07;
  const WHEEL_MULTIPLIER = 0.95;   // чуть меньше 1 → шаг скролла мягче
  const TOUCH_MULTIPLIER = 1.5;
  const ANCHOR_DURATION = 1.4;     // секунды доводки до якоря

  function boot() {
    if (typeof Lenis === "undefined") {
      console.warn("smooth-scroll.js: Lenis не загружен — проверь CDN в footer-code");
      return;
    }

    const lenis = new Lenis({
      lerp: LERP,
      smoothWheel: true,
      smoothTouch: false,         // touch на мобилке оставляем нативным
      wheelMultiplier: WHEEL_MULTIPLIER,
      touchMultiplier: TOUCH_MULTIPLIER
    });

    // Sync со ScrollTrigger — без этого scrub-таймлайны (stages,
    // nav compress, partner spotlight) задерживаются за scroll-position
    if (typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
    }

    // Один общий rAF: GSAP ticker крутит и tweens, и Lenis-loop
    if (typeof gsap !== "undefined") {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      // Fallback если GSAP не загрузился раньше
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }

    window.lenis = lenis;


    // Якорные ссылки — через lenis.scrollTo вместо браузерного snap
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      lenis.scrollTo(target, {
        duration: ANCHOR_DURATION,
        // expo-кривая: быстрый старт, мягкая доводка
        easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
