/**
 * Hero exit. Каждый hero-блок завернут в .hero_item-mask
 * (overflow:hidden, поставлен юзером в Webflow). Анимируем
 * непосредственно contentn-элементы — они уезжают yPercent:-100
 * за свою маску.
 *
 * Берём конкретными селекторами (а не firstElementChild) — надёжнее
 * против структурных особенностей (например h1.hero_title сам имеет
 * overflow:hidden, и firstElementChild может попасть не туда).
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

  // Порядок DOM = порядок stagger'а: planet → label → tags → title → subtitle.
  const selectors = [
    ".hero_planet-img",
    ".hero_label",
    ".hero_tag",       // querySelectorAll вернёт оба
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

  // 300px range scroll, linear ease — медленно и плавно следует
  // за колесом. stagger 0.18 → каскадный 'барабан' читается визуально.
  gsap.to(inners, {
    yPercent: -100,
    ease: "none",
    stagger: 0.18,
    scrollTrigger: {
      trigger: "body",
      start: "top top-=100",
      end: "top top-=400",
      scrub: true
    }
  });
});
