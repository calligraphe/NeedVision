/**
 * NEED.VISION — Параллакс bento-карточек
 * ======================================
 *
 * Что делает: при скролле через sticky-секцию `.parallax-sticky` bento-
 *             карточки сначала выезжают снизу (Фаза 1), задерживаются
 *             на короткую паузу, затем уходят вверх (Фаза 2). Каждая
 *             карточка может задать индивидуальный стартовый/конечный
 *             сдвиг и задержку ухода через data-атрибуты.
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *   - ScrollTrigger
 *
 * Webflow селекторы:
 *   - .parallax-sticky       — sticky-секция-обёртка (триггер)
 *   - .bento_card.is-parallax — карточки, которым нужен параллакс-эффект
 *
 * Атрибуты в Webflow:
 *   - data-start-y           — стартовый сдвиг вниз (px). По умолчанию 600
 *   - data-end-y             — конечный сдвиг вверх (px). По умолчанию -510
 *   - data-exit-delay        — задержка ухода относительно начала Фазы 2 (сек)
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/bento/bento-parallax-cards.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] bento-parallax-cards.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("[Need Vision] bento-parallax-cards.js: ScrollTrigger не загружен");
    return;
  }

  // ---- Проверка наличия элементов ----
  const cards = document.querySelectorAll('.bento_card.is-parallax');
  const stickySection = document.querySelector(".parallax-sticky");
  if (cards.length === 0 || !stickySection) return;

  gsap.registerPlugin(ScrollTrigger);

  // ---- Тайминги (длительности фаз в условных единицах GSAP timeline) ----
  const PHASE_1_DURATION = 5;  // появление
  const PAUSE_DURATION = 1;    // пауза между фазами
  const PHASE_2_DURATION = 5;  // уход
  const SCRUB = 3;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".parallax-sticky",
      start: "top top",
      end: "bottom top",
      scrub: SCRUB,
      invalidateOnRefresh: true
    }
  });

  // =========================================================
  // ФАЗА 1: ПОЯВЛЕНИЕ
  // =========================================================
  cards.forEach(card => {
    const attrStart = card.getAttribute('data-start-y');
    const startY = attrStart ? parseFloat(attrStart) : 600;

    tl.fromTo(card, {
      y: startY,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: PHASE_1_DURATION,
      ease: "power2.out",
      force3D: true
    }, 0);
  });

  // =========================================================
  // ПАУЗА
  // =========================================================
  tl.to({}, { duration: PAUSE_DURATION });

  // =========================================================
  // ФАЗА 2: УХОД ВВЕРХ
  // =========================================================
  cards.forEach(card => {
    const attrEnd = card.getAttribute('data-end-y');
    const endY = attrEnd ? parseFloat(attrEnd) : -510;

    const attrDelay = card.getAttribute('data-exit-delay');
    const exitDelay = attrDelay ? parseFloat(attrDelay) : 0;

    tl.to(card, {
      y: endY,
      opacity: 0,
      duration: PHASE_2_DURATION,
      ease: "power2.in",
      force3D: true
    }, PHASE_1_DURATION + PAUSE_DURATION + exitDelay);
  });
});
