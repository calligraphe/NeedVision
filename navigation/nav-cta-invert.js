/**
 * NEED.VISION — Темизация и инверсия плавающей кнопки nav-cta
 * ===========================================================
 *
 * Что делает: управляет фоном/цветом плавающей CTA-кнопки в зависимости
 *             от секции, над которой она сейчас «висит»:
 *               1. В оранжевых секциях (`.is-orange-nav`) — оранжевый фон, белый текст
 *               2. Над `.stages` — чёрный фон + белый текст (вместе с маркизой)
 *               3. В футере — кнопка плавно уезжает вниз и исчезает
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *   - ScrollTrigger
 *
 * Webflow селекторы:
 *   - .nav-cta__btn          — сама плавающая кнопка
 *   - .nav-cta__btn *        — все потомки (для смены цвета текста)
 *   - .is-orange-nav         — класс-маркер секций с оранжевым фоном
 *   - .stages                — тёмная секция (триггер инверсии)
 *   - .marquee-wrapper       — бегущая строка (тоже белеет над .stages)
 *   - .footer / footer       — футер (триггер исчезновения кнопки)
 *
 * Атрибуты в Webflow:
 *   - Добавь класс `is-orange-nav` секциям, где фон оранжевый — кнопка
 *     автоматически перекрасится в оранжевый.
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/navigation/nav-cta-invert.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] nav-cta-invert.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("[Need Vision] nav-cta-invert.js: ScrollTrigger не загружен");
    return;
  }

  // ---- Проверка наличия кнопки ----
  const ctaBtn = document.querySelector(".nav-cta__btn");
  if (!ctaBtn) return;

  gsap.registerPlugin(ScrollTrigger);

  // ==========================================
  // 1. СМЕНА ФОНА КНОПКИ (Оранжевые секции)
  // ==========================================
  function setNavTheme(theme) {
    if (theme === 'orange') {
      gsap.to(".nav-cta__btn", { backgroundColor: "#FF6038", color: "#ffffff", duration: 0.3, overwrite: "auto" });
      gsap.to(".nav-cta__btn *", { color: "#ffffff", duration: 0.3, overwrite: "auto" });
    } else {
      gsap.to(".nav-cta__btn", { backgroundColor: "#ffffff", color: "#000000", duration: 0.3, overwrite: "auto" });
      gsap.to(".nav-cta__btn *", { color: "#000000", duration: 0.3, overwrite: "auto" });
    }
  }
  const orangeSections = gsap.utils.toArray(".is-orange-nav");
  if (orangeSections.length > 0) {
    orangeSections.forEach(section => {
      ScrollTrigger.create({
        trigger: section,
        start: "top 80px",
        end: "bottom 80px",
        onEnter: () => setNavTheme('orange'),
        onLeave: () => setNavTheme('white'),
        onEnterBack: () => setNavTheme('orange'),
        onLeaveBack: () => setNavTheme('white')
      });
    });
  }

  // ==========================================
  // 2. ЖЕСТКАЯ ИНВЕРСИЯ НАД БЕЛЫМ ФОНОМ (Stages)
  // ==========================================
  const stagesSection = document.querySelector(".stages");

  if (stagesSection) {
    gsap.to(".nav-cta__btn", {
      backgroundColor: "#040101",
      ease: "none",
      immediateRender: false,
      scrollTrigger: {
        trigger: stagesSection,
        start: "top 85%",
        end: "top 25%",
        scrub: true
      }
    });
    gsap.to(".nav-cta__btn *, .marquee-wrapper, .marquee-wrapper *", {
      color: "#ffffff",
      ease: "none",
      immediateRender: false,
      scrollTrigger: {
        trigger: stagesSection,
        start: "top 85%",
        end: "top 25%",
        scrub: true
      }
    });
  }

  // ==========================================
  // 3. ИСЧЕЗНОВЕНИЕ КНОПКИ В ФУТЕРЕ
  // ==========================================
  const footerEl = document.querySelector(".footer") || document.querySelector("footer");

  if (footerEl) {
    gsap.to(".nav-cta__btn", {
      y: 150,
      opacity: 0,
      pointerEvents: "none",
      ease: "none",
      immediateRender: false,
      scrollTrigger: {
        trigger: footerEl,
        start: "top 95%",
        end: "top 75%",
        scrub: true
      }
    });
  }
});
