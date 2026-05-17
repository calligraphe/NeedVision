/**
 * NEED.VISION — Раскрытие текстов в секции с лого
 * ===============================================
 *
 * Что делает: при скролле к `.section-logo` строки текста `.logo-anim__txt`
 *             поднимаются снизу (с y=100), проявляются и расфокусируются
 *             (blur 20px → 0) каскадом. Эффект «текст из тумана», как в
 *             manifesto-секции, но с большим стартовым сдвигом.
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *   - ScrollTrigger
 *
 * Webflow селекторы:
 *   - .section-logo          — родительская секция (триггер)
 *   - .logo-anim__txt        — тексты, которые раскрываются
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sections/logo-reveal.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] logo-reveal.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("[Need Vision] logo-reveal.js: ScrollTrigger не загружен");
    return;
  }

  // ---- Проверка наличия элементов ----
  const logoRevealTexts = document.querySelectorAll('.logo-anim__txt');
  if (logoRevealTexts.length === 0) return;

  gsap.registerPlugin(ScrollTrigger);

  // ---- ПРЕДУСТАНОВКА: опускаем тексты, делаем прозрачными и размытыми ----
  gsap.set(logoRevealTexts, {
    y: 100,
    opacity: 0,
    filter: "blur(20px)"
  });

  // ---- Анимация по скроллу ----
  gsap.to(logoRevealTexts, {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    duration: 1,
    stagger: 0.2,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".section-logo",
      start: "top 80%",
      end: "top 30%",
      scrub: 1
    }
  });
});
