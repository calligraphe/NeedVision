/**
 * NEED.VISION — Эффект «фонарика» в секции partner
 * ================================================
 *
 * Что делает: при движении мыши над секцией `.partner` смещает центр
 *             радиального градиента в `.spotlight-overlay`, создавая
 *             эффект «фонарика, следующего за курсором». Смещение
 *             центра идёт через CSS-переменные `--mouse-x` / `--mouse-y`
 *             с плавной доводкой через GSAP (1.8s + power3.out).
 *
 * Перф-заметки:
 *   - mousemove handler НЕ создаёт gsap.to на каждом событии — вместо
 *     этого один раз создаём gsap.quickTo (оптимизированный setter)
 *     и зовём его. Без throttle это ~100-200 вызовов/сек, с quickTo это
 *     не порождает новые tween'ы и в разы дешевле.
 *   - rect (.partner.getBoundingClientRect()) закэширован один раз;
 *     обновляем на scroll/resize, а не на каждый mousemove (раньше
 *     getBoundingClientRect внутри handler'а триггерил forced sync layout).
 *   - rAF-throttle: даже если событий 200/сек, реальная отрисовка идёт
 *     ровно ≤60 раз/сек (по rAF).
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *   - CSS: на `.spotlight-overlay` должен быть `background: radial-gradient(...)`
 *     с переменными `--mouse-x` / `--mouse-y` (см. `styles/custom.css`)
 *
 * Webflow селекторы:
 *   - .partner               — секция-источник событий мыши
 *   - .spotlight-overlay     — затемняющий слой с радиальным градиентом
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sections/partner-spotlight.js"></script>
 */

function bootPartnerSpotlight() {
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] partner-spotlight.js: GSAP не загружен");
    return;
  }

  const partnerSection = document.querySelector(".partner");
  const spotlightOverlay = document.querySelector(".spotlight-overlay");
  if (!partnerSection || !spotlightOverlay) return;

  const FOLLOW_DURATION = 1.8;

  // Кэш rect — обновляется только на scroll/resize.
  let rect = partnerSection.getBoundingClientRect();
  const refreshRect = () => { rect = partnerSection.getBoundingClientRect(); };
  window.addEventListener("scroll", refreshRect, { passive: true });
  window.addEventListener("resize", refreshRect);

  // Оптимизированные setter'ы — один раз создаём, потом просто зовём.
  // quickTo не создаёт новый tween каждый раз; внутри использует один
  // долгоживущий tween с плавающим target — это нативная GSAP-фича
  // именно для mousemove/touchmove-сценариев.
  const setX = gsap.quickTo(spotlightOverlay, "--mouse-x", {
    duration: FOLLOW_DURATION,
    ease: "power3.out"
  });
  const setY = gsap.quickTo(spotlightOverlay, "--mouse-y", {
    duration: FOLLOW_DURATION,
    ease: "power3.out"
  });

  // rAF-throttle: события сжимаются до 1 на animation frame.
  let pendingClientX = 0;
  let pendingClientY = 0;
  let rafQueued = false;

  function applyMouse() {
    rafQueued = false;
    const x = pendingClientX - rect.left;
    const y = pendingClientY - rect.top;
    setX(`${x}px`);
    setY(`${y}px`);
  }

  partnerSection.addEventListener("mousemove", (e) => {
    pendingClientX = e.clientX;
    pendingClientY = e.clientY;
    if (!rafQueued) {
      rafQueued = true;
      requestAnimationFrame(applyMouse);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootPartnerSpotlight);
} else {
  bootPartnerSpotlight();
}
