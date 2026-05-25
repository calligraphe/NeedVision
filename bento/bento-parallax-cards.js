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

  gsap.registerPlugin(ScrollTrigger);

  // Длительности в условных единицах timeline (это пропорции внутри
  // одного scroll-distance, не секунды).
  const PHASE_1_DURATION = 5;
  const PAUSE_DURATION = 1;
  const PHASE_2_DURATION = 5;

  // start: "top bottom" — анимация начинается как только секция
  // показалась снизу.
  // end: "bottom top" — заканчивается когда блок ушёл за верх.
  // scrub: true — строгая 1:1 привязка к колесу.
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".parallax-sticky",
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true
    }
  });

  // Фаза 1 — появление
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

  tl.to({}, { duration: PAUSE_DURATION });

  // Фаза 2 — уход.
  // Дефолтный endY -1200 (раньше было -510): карточка ~800px высотой
  // не успевала полностью уехать за верх, выглядело как «застряла».
  cards.forEach(card => {
    const attrEnd = card.getAttribute('data-end-y');
    const endY = attrEnd ? parseFloat(attrEnd) : -1200;

    const attrDelay = card.getAttribute('data-exit-delay');
    const exitDelay = attrDelay ? parseFloat(attrDelay) : 0;

    const phase2Start = PHASE_1_DURATION + PAUSE_DURATION + exitDelay;

    // y едет всю фазу 2
    tl.to(card, {
      y: endY,
      duration: PHASE_2_DURATION,
      ease: "power2.in",
      force3D: true
    }, phase2Start);

    // opacity тает медленно — половину фазы 2, с её середины до конца.
    // Карточка к этому моменту уже заметно ушла вверх → fade выглядит
    // как «растворение за горизонтом», а не «таяние на месте».
    tl.to(card, {
      opacity: 0,
      duration: PHASE_2_DURATION * 0.5,
      ease: "power1.in"
    }, phase2Start + PHASE_2_DURATION * 0.5);
  });
});
