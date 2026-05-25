/**
 * Lenis smooth scroll. Inertia вместо нативного wheel — главное что
 * меняет ощущение «резкости» сайта.
 *
 * Lenis крутится в общем gsap.ticker (один rAF на всё) и шлёт updates
 * в ScrollTrigger — иначе scrub-таймлайны отстают от реального
 * scroll-position'а.
 *
 * Глобально доступен как window.lenis — другие скрипты могут
 * остановить/возобновить скролл (например при открытом модалке).
 */

(() => {
  const LERP = 0.085;          // плавность доводки (меньше = плавнее, больше = резче)
  const WHEEL_MULTIPLIER = 1.0;
  const TOUCH_MULTIPLIER = 1.5;

  function boot() {
    if (typeof Lenis === "undefined") {
      console.warn("smooth-scroll.js: Lenis не загружен");
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
