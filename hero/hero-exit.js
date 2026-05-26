/**
 * Hero exit. Scrub-таймлайн: элементы исчезают по мере скролла
 * на 70vw высоты. Внутри .hero_item-mask (overflow:hidden)
 * уезжают yPercent:-110 + opacity.
 *
 * Debug-режим: console.log запуска и найденных элементов —
 * открой DevTools Console чтобы понять что не так.
 *
 * Build: 2026-05-26-scrub70vw
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

  console.log("[hero-exit] init");

  const selectors = [
    ".hero_planet-img",
    ".hero_label",
    ".hero_tag",
    ".hero_title1",
    ".hero_title2",
    ".hero_subtitle1",
    ".hero_subtitle2"
  ];

  const inners = [];
  selectors.forEach((sel) => {
    const els = document.querySelectorAll(sel);
    console.log(`[hero-exit] ${sel} → ${els.length}`);
    els.forEach((el) => {
      el.removeAttribute("data-w-id");
      el.style.willChange = "transform";
      // Принудительно ставим стартовое состояние через gsap.set
      gsap.set(el, { yPercent: 0, clearProps: "transform" });
      inners.push(el);
    });
  });

  // Маски и обёртки тоже без IX2
  document.querySelectorAll(".hero_item-mask, .hero_subtitle-wrapper, .hero_title-wrapper, .hero_tags-group")
    .forEach((el) => el.removeAttribute("data-w-id"));

  console.log(`[hero-exit] total inners: ${inners.length}`);

  if (inners.length === 0) {
    console.error("[hero-exit] не нашёл ни одного hero-элемента — проверь имена классов в Webflow");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Двойная защита: повторно снимаем data-w-id через 500ms — иногда
  // Webflow IX2 восстанавливает атрибуты после нашего init.
  setTimeout(() => {
    inners.forEach((el) => el.removeAttribute("data-w-id"));
  }, 500);

  // Scrub-таймлайн привязан к скроллу: end = +70vw высоты.
  // Тройной транспорт (yPercent + y vw + opacity) как failsafe,
  // чтобы хоть одна из трансформаций гарантированно скрыла элемент.
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: () => "+=" + (window.innerWidth * 0.7),
      scrub: 1,
      invalidateOnRefresh: true
    }
  });

  tl.to(inners, {
    yPercent: -110,
    y: "-13.89vw",
    opacity: 0,
    ease: "power2.in",
    stagger: 0.3
  });
});
