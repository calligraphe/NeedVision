/**
 * Hero exit. Юзер обернул каждый hero-блок в .hero_item-mask
 * (overflow:hidden). Структура:
 *   .hero_item-mask
 *     └ .hero_planet-img / .hero_label / .hero_tag / .hero_title / .hero_subtitle
 *
 * Анимируем именно inner-child маски (yPercent:-100 уведёт его за
 * границу overflow:hidden). Чистый mask-reveal как в stages — никаких
 * span-обёрток через JS, всё уже в HTML.
 *
 * scrub:true + linear ease + stagger → плавный барабан по скроллу.
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

  // Берём всех первых детей у каждой маски в порядке DOM
  // (planet → label → tag1 → tag2 → title → subtitle).
  const masks = document.querySelectorAll(".hero_item-mask");
  const inners = [];
  masks.forEach((mask) => {
    const child = mask.firstElementChild;
    if (child) {
      child.style.willChange = "transform";
      inners.push(child);
    }
  });

  if (inners.length === 0) return;

  gsap.registerPlugin(ScrollTrigger);

  // scroll 100→600px (500px range), linear ease — движение 1:1 со
  // скроллом. stagger 0.1 — каждый следующий стартует чуть позже,
  // создаёт каскад 'барабана'.
  gsap.to(inners, {
    yPercent: -100,
    ease: "none",
    stagger: 0.1,
    scrollTrigger: {
      trigger: "body",
      start: "top top-=100",
      end: "top top-=600",
      scrub: true
    }
  });
});
