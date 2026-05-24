/**
 * NEED.VISION — Темизация плавающей CTA-кнопки (.nav-cta__btn)
 * ============================================================
 *
 * Что делает: меняет фон/цвет плавающей CTA-кнопки в зависимости от
 *             секции, над которой она «висит», и убирает её в футере.
 *
 * Темы и приоритет (старшая выигрывает):
 *   1. DARK   — над `.stages` (чёрный фон, белый текст)
 *   2. ORANGE — над `.is-orange-nav` секциями (оранжевый фон, белый)
 *   3. WHITE  — дефолт (белый фон, чёрный текст)
 *
 * Архитектура:
 *   - Каждый ScrollTrigger только ОБНОВЛЯЕТ булев флаг (без своих tween'ов).
 *   - Один централизованный applyTheme() вычисляет активную тему по флагам
 *     и применяет её ОДНИМ tween'ом на .nav-cta__btn. Цвет потомков
 *     наследуется автоматически через CSS color inheritance.
 *   - applyTheme дебаунсится через rAF — несколько одновременных onToggle
 *     (например, выход из orange + вход в stages) схлопываются в один tween.
 *   - currentTheme-гард не даёт повторно играть ту же тему.
 *
 * Это снимает три проблемы старой версии:
 *   - гонка discrete onEnter и scrub-tween за одни и те же свойства,
 *   - рассинхронизация двух раздельных scrub-таймлайнов (bg ≠ color),
 *   - «застревание» в чужой теме после быстрого скролла.
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *   - ScrollTrigger
 *
 * Webflow селекторы:
 *   - .nav-cta__btn          — сама плавающая кнопка
 *   - .is-orange-nav         — класс-маркер оранжевых секций
 *   - .stages                — тёмная секция
 *   - .footer / footer       — футер (триггер скрытия)
 *
 * Атрибуты в Webflow:
 *   - Добавь класс `is-orange-nav` секции с оранжевым фоном — кнопка
 *     автоматически перекрасится в оранжевый, пока эта секция «под» ней.
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/navigation/nav-cta-invert.js"></script>
 */

function bootNavCtaInvert() {
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] nav-cta-invert.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("[Need Vision] nav-cta-invert.js: ScrollTrigger не загружен");
    return;
  }

  const ctaBtn = document.querySelector(".nav-cta__btn");
  if (!ctaBtn) return;

  gsap.registerPlugin(ScrollTrigger);

  // ==========================================
  // ТЕМЫ
  // ==========================================
  const THEMES = {
    white:  { bg: "#ffffff", text: "#000000" },
    orange: { bg: "#FF6038", text: "#ffffff" },
    dark:   { bg: "#040101", text: "#ffffff" }
  };

  // Синхронизируем стартовое состояние с CSS, чтобы GSAP знал точку «from».
  gsap.set(".nav-cta__btn", {
    backgroundColor: THEMES.white.bg,
    color: THEMES.white.text
  });

  // ==========================================
  // СОСТОЯНИЕ
  // ==========================================
  // Используем Set вместо булки на случай перекрывающихся orange-секций.
  const activeOrange = new Set();
  let isOverStages = false;
  let currentTheme = "white";

  function applyTheme() {
    const next = isOverStages
      ? "dark"
      : (activeOrange.size > 0 ? "orange" : "white");

    if (next === currentTheme) return;
    currentTheme = next;

    const t = THEMES[next];
    // Один tween на .nav-cta__btn. backgroundColor + color сразу. Потомки
    // (.marquee-wrapper и текстовые div'ы) наследуют color через CSS.
    gsap.to(".nav-cta__btn", {
      backgroundColor: t.bg,
      color: t.text,
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto"
    });
  }

  // rAF-дебаунс: при выходе из orange + входе в stages одним кадром
  // получим два onToggle подряд → схлопнем в один applyTheme.
  let pending = false;
  function scheduleApply() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      applyTheme();
    });
  }

  // ==========================================
  // ОРАНЖЕВЫЕ СЕКЦИИ
  // ==========================================
  const orangeSections = gsap.utils.toArray(".is-orange-nav");
  orangeSections.forEach(section => {
    ScrollTrigger.create({
      trigger: section,
      start: "top 80px",
      end: "bottom 80px",
      onToggle: (self) => {
        if (self.isActive) activeOrange.add(section);
        else activeOrange.delete(section);
        scheduleApply();
      }
    });
  });

  // ==========================================
  // СЕКЦИЯ .stages — тёмная тема
  // ==========================================
  // Пороги подобраны так, чтобы тема включалась пока кнопка визуально
  // находится над секцией (кнопка прижата к bottom 2.2vw).
  const stagesSection = document.querySelector(".stages");
  if (stagesSection) {
    ScrollTrigger.create({
      trigger: stagesSection,
      start: "top 75%",
      end: "bottom 25%",
      onToggle: (self) => {
        isOverStages = self.isActive;
        scheduleApply();
      }
    });
  }

  // ==========================================
  // ИСЧЕЗНОВЕНИЕ В ФУТЕРЕ
  // ==========================================
  // Независимая от темы анимация — двигает y/opacity, не трогает цвета.
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootNavCtaInvert);
} else {
  bootNavCtaInvert();
}
