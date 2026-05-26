/**
 * Параллакс bento-карточек. Скролл через .parallax-sticky:
 * фаза 1 — карточки выезжают снизу, пауза, фаза 2 — уходят вверх.
 * Каждой карточке можно задать индивидуальный сдвиг через data-start-y /
 * data-end-y / data-exit-delay (атрибуты на самом элементе).
 */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") {
    console.warn("bento-parallax-cards.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("bento-parallax-cards.js: ScrollTrigger не загружен");
    return;
  }

  const cards = document.querySelectorAll('.bento_card.is-parallax');
  const stickySection = document.querySelector(".parallax-sticky");
  if (cards.length === 0 || !stickySection) return;

  // Webflow IX2 (data-w-id) на самих карточках или контейнере может
  // переписывать наш transform — наш tween не виден визуально хотя
  // GSAP его двигает. Снимаем атрибут со всех затронутых элементов.
  cards.forEach(card => card.removeAttribute('data-w-id'));
  stickySection.removeAttribute('data-w-id');
  // Прямые дети sticky-секции тоже — там могут сидеть IX2-завязки на overflow
  Array.from(stickySection.children).forEach(child => child.removeAttribute('data-w-id'));

  gsap.registerPlugin(ScrollTrigger);

  // Длительности в условных единицах timeline (это пропорции внутри
  // одного scroll-distance, не секунды).
  const PHASE_1_DURATION = 5;
  const PAUSE_DURATION = 4.06;       // +30% к 3.12
  const PHASE_2_DURATION = 25;       // 20.28 → 25

  // start: "top bottom" — анимация начинается как только секция
  // показалась снизу.
  // end: "bottom top" — заканчивается когда блок ушёл за верх.
  // scrub: 0.5 — лёгкая inertia (не true) для устойчивости при
  // внешнем Lenis от 3D-сцены, который может дёргать ScrollTrigger.
  // invalidateOnRefresh: false — иначе при каждом ScrollTrigger.refresh
  // (а Lenis инициирует refresh при scroll-position change) fromTo
  // пересчитывает from-values → opacity моргает.
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".parallax-sticky",
      start: "top bottom",
      end: "bottom top",
      scrub: 0.5,
      invalidateOnRefresh: false
    }
  });

  // Фаза 1 — появление
  cards.forEach(card => {
    const attrStart = card.getAttribute('data-start-y');
    // 600px в дизайне 1440 = 41.67vw — скейлится с шириной экрана
    const startY = attrStart ? attrStart : "41.67vw";

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

  tl.to({}, { duration: PAUSE_DURATION });

  // На фазе 2 контейнеры (grid и columns) тоже едут вверх через
  // marginTop — чтобы общее движение карточек выглядело заметнее.
  // Grid -3vw, columns -5vw: разная скорость = лёгкий параллакс.
  const phase2BaseStart = PHASE_1_DURATION + PAUSE_DURATION;

  tl.to(".bento_grid", {
    marginTop: "-18vw",
    duration: PHASE_2_DURATION,
    ease: "power2.in"
  }, phase2BaseStart);

  tl.to(".bento_column", {
    marginTop: "-15vw",
    duration: PHASE_2_DURATION,
    ease: "power2.in"
  }, phase2BaseStart);

  // Фаза 2 — уход. Дефолтный endY -1200: карточка ~800px высотой
  // успевает полностью уехать за верх. Opacity отложен на последнюю
  // четверть фазы — карточка успевает заметно уехать, прежде чем
  // тает (раньше фейд начинался с середины и юзер ловил полу-
  // прозрачные карточки посреди экрана).
  cards.forEach(card => {
    const attrEnd = card.getAttribute('data-end-y');
    // -1200px в 1440 = -83.33vw
    const endY = attrEnd ? attrEnd : "-83.33vw";

    const attrDelay = card.getAttribute('data-exit-delay');
    const exitDelay = attrDelay ? parseFloat(attrDelay) : 0;

    const phase2Start = PHASE_1_DURATION + PAUSE_DURATION + exitDelay;

    tl.to(card, {
      y: endY,
      duration: PHASE_2_DURATION,
      ease: "power2.in",
      force3D: true
    }, phase2Start);
  });
});
