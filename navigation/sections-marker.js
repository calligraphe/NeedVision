/**
 * NEED.VISION — Маркеры текущей секции в навигации
 * ================================================
 *
 * Что делает: фейдит opacity у 4 маркеров в навигации в зависимости от
 *             того, какая секция сейчас занимает верх вьюпорта.
 *             Сопоставление маркер ↔ секция жёстко зашито по порядку:
 *
 *               маркер 1 → секция `.manifesto`
 *               маркер 2 → секция `.section-logo`
 *               маркер 3 → секция `.section-cases`
 *               маркер 4 → секция `.stages`
 *
 *             Маркеры берутся в DOM-порядке (первое совпадение с
 *             селектором `[section-is]` — это маркер #1, и т.д.).
 *             Значения самого атрибута `section-is` НЕ читаются —
 *             порядок задаёт всё.
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *   - ScrollTrigger
 *
 * Webflow селекторы:
 *   - .section-marker-wrap   — обёртка со всеми маркерами (контекст вёрстки)
 *   - [section-is]           — отдельные маркеры (4 штуки)
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/navigation/sections-marker.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("[Need Vision] sections-marker.js: GSAP / ScrollTrigger не загружен");
    return;
  }

  // ---- Жёсткое сопоставление маркер ↔ класс секции по порядку ----
  const SECTIONS = ["manifesto", "section-logo", "section-cases", "stages"];

  const markers = document.querySelectorAll('[section-is]');
  if (markers.length === 0) return;

  gsap.registerPlugin(ScrollTrigger);

  // ---- Тайминги ----
  const FADE_DURATION = 0.3;

  // ---- Установка opacity с `!important` ----
  // Перебивает Webflow Interactions (IX2), если они одновременно
  // управляют opacity тех же элементов.
  function setOpacity(el, value, animate = true) {
    if (!animate) {
      el.style.setProperty('opacity', String(value), 'important');
      return;
    }
    gsap.to(el, {
      opacity: value,
      duration: FADE_DURATION,
      ease: value === 1 ? "power2.out" : "power2.in",
      overwrite: "auto",
      onUpdate: function () {
        el.style.setProperty('opacity', this.targets()[0].style.opacity, 'important');
      }
    });
  }

  // ---- Привязываем каждый маркер к своей секции ----
  SECTIONS.forEach((sectionClass, idx) => {
    const marker = markers[idx];
    if (!marker) {
      console.warn(`[Need Vision] sections-marker.js: нет маркера #${idx + 1} в DOM`);
      return;
    }

    const section = document.querySelector('.' + sectionClass);
    if (!section) {
      console.warn(`[Need Vision] sections-marker.js: секция .${sectionClass} не найдена`);
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      onEnter: () => setOpacity(marker, 1),
      onLeave: () => setOpacity(marker, 0),
      onEnterBack: () => setOpacity(marker, 1),
      onLeaveBack: () => setOpacity(marker, 0)
    });

    // Если на момент загрузки страница уже внутри этой секции —
    // сразу показать маркер без анимации
    if (trigger.isActive) setOpacity(marker, 1, false);
  });

  // ---- Refresh после возможного позднего layout Webflow ----
  setTimeout(() => ScrollTrigger.refresh(), 500);
});
