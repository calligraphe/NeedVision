/**
 * Hero exit. Универсальный mask-reveal: берём firstElementChild у
 * ВСЕХ hero-масок (.hero_item-mask, .hero_header-mask и любых
 * других с этим суффиксом). Не зависит от того как юзер назвал
 * конкретные текстовые элементы — анимирует то что внутри маски.
 *
 * Build: 2026-05-25-v3
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

  console.log("[hero-exit] init v3");

  // Любая hero-маска: item-mask, header-mask, hero-sub, и т.п.
  // Селектор по подстроке 'mask' покрывает все варианты.
  const masks = document.querySelectorAll('[class*="hero_item-mask"], [class*="hero_header-mask"], .hero_item-mask, .hero_header-mask');

  console.log(`[hero-exit] масок найдено: ${masks.length}`);

  const inners = [];
  masks.forEach((mask, i) => {
    mask.removeAttribute("data-w-id");
    const child = mask.firstElementChild;
    if (!child) {
      console.warn(`[hero-exit] маска #${i} пустая, пропускаем`, mask);
      return;
    }
    child.removeAttribute("data-w-id");
    child.style.willChange = "transform, opacity";
    console.log(`[hero-exit] inner #${i}:`, child.className || child.tagName);
    inners.push(child);
  });

  // Wrapper'ы тоже без IX2
  document.querySelectorAll(".hero_subtitle-wrapper, .hero_title-wrapper, .hero_tags-group")
    .forEach((el) => el.removeAttribute("data-w-id"));

  if (inners.length === 0) {
    console.error("[hero-exit] масок не нашёл — проверь имена классов");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Двойная защита: повторно снимаем data-w-id через 500ms (Webflow
  // IX2 может восстановить атрибуты).
  setTimeout(() => {
    inners.forEach((el) => el.removeAttribute("data-w-id"));
    masks.forEach((m) => m.removeAttribute("data-w-id"));
  }, 500);

  const tl = gsap.timeline({ paused: true });
  tl.to(inners, {
    yPercent: -110,
    y: -200,
    opacity: 0,
    duration: 1.5,
    ease: "power2.in",
    stagger: 0.3
  });

  ScrollTrigger.create({
    trigger: "body",
    start: "top top-=100",
    onEnter: () => {
      console.log("[hero-exit] onEnter → play");
      tl.play();
    },
    onLeaveBack: () => {
      console.log("[hero-exit] onLeaveBack → reverse");
      tl.reverse();
    }
  });
});
