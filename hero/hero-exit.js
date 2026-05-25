/**
 * Hero exit. Autoplay-таймлайн (НЕ scrub). При скролле >100px от верха
 * запускается полная анимация исчезновения — 3.5 секунды каскадного
 * барабана, независимо от того насколько юзер прокрутил.
 *
 * Раньше был scrub-таймлайн на 300-500px scroll-range. На трекпаде
 * MacBook один свайп даёт ~500px → анимация мгновенная.
 *
 * Маски .hero_item-mask (overflow:hidden) от юзера обрезают
 * уезжающий контент. Анимируем сами content-элементы: planet-img,
 * label, tag (×2), title, subtitle.
 *
 * При возврате юзера вверх (onLeaveBack) играется обратно.
 */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") {
    console.warn("hero-exit.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("hero-exit.js: ScrollTrigger не загружен");
    return;
  }

  const selectors = [
    ".hero_planet-img",
    ".hero_label",
    ".hero_tag",
    ".hero_title",
    ".hero_subtitle"
  ];

  const inners = [];
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      el.style.willChange = "transform";
      inners.push(el);
    });
  });

  if (inners.length === 0) return;

  gsap.registerPlugin(ScrollTrigger);

  // Autoplay-timeline. duration 1.5с + stagger 0.3с.
  // 8 элементов (planet, label, 2×tag, 2×title, 2×subtitle):
  // total = 1.5 + 0.3*7 = ~3.6с от первого до последнего.
  // ease 'power2.in' — медленный старт, ускорение к концу.
  const tl = gsap.timeline({ paused: true });
  tl.to(inners, {
    yPercent: -100,
    duration: 1.5,
    ease: "power2.in",
    stagger: 0.3
  });

  ScrollTrigger.create({
    trigger: "body",
    start: "top top-=100",
    onEnter: () => tl.play(),
    onLeaveBack: () => tl.reverse()
  });
});
