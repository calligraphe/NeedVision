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

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] partner-spotlight.js: GSAP не загружен");
    return;
  }

  // ---- Проверка наличия элементов ----
  const partnerSection = document.querySelector('.partner');
  const spotlightOverlay = document.querySelector('.spotlight-overlay');
  if (!partnerSection || !spotlightOverlay) return;

  // ---- Тайминги ----
  const FOLLOW_DURATION = 1.8;

  partnerSection.addEventListener('mousemove', (e) => {
    const rect = partnerSection.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(spotlightOverlay, {
      "--mouse-x": `${x}px`,
      "--mouse-y": `${y}px`,
      duration: FOLLOW_DURATION,
      ease: "power3.out",
      overwrite: "auto"
    });
  });
});
