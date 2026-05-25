/**
 * Hero exit: при скролле >100px hero-контент 'барабанит' вверх и
 * исчезает за ~20px прокрутки (почти мгновенно). Элементы уходят
 * со staggered-эффектом — поочередно, как барабан.
 *
 * Триггерится от body — не зависит от собственной высоты hero.
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

  // Селекторы — в нужном порядке (как они уходят по stagger'у).
  const targets = [
    ".hero_planet-img",
    ".hero_label",
    ".hero_tags-group",
    ".hero_title",
    ".hero_subtitle"
  ];

  const elements = targets
    .map(sel => document.querySelector(sel))
    .filter(Boolean);

  if (elements.length === 0) return;

  gsap.registerPlugin(ScrollTrigger);

  // will-change на каждом — GPU-слой для плавного transform
  elements.forEach(el => {
    el.style.willChange = "transform, opacity";
  });

  // Scrub-таймлайн на 20px скролла: 100px → 120px от верха.
  // Каждый элемент уходит yPercent:-100 + opacity:0, stagger 0.05.
  gsap.to(elements, {
    yPercent: -100,
    opacity: 0,
    ease: "power2.in",
    stagger: 0.05,
    scrollTrigger: {
      trigger: "body",
      start: "top top-=100",
      end: "top top-=120",
      scrub: true
    }
  });
});
