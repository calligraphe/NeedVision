/**
 * NEED.VISION — Маркеры текущей секции в навигации
 * ================================================
 *
 * Что делает: показывает маркер в навигации, соответствующий той секции,
 *             которую пользователь сейчас читает. Когда секция занимает
 *             верх вьюпорта — её маркер виден (opacity 1), остальные
 *             остаются скрытыми (opacity 0). При скролле между секциями
 *             маркеры плавно сменяют друг друга.
 *
 *             Каждый маркер несёт атрибут `section-is="<class>"` — имя
 *             класса целевой секции (БЕЗ точки в начале). Скрипт находит
 *             секцию по этому классу и привязывает ScrollTrigger на
 *             интервале `top top → bottom top`: маркер активен пока
 *             секция занимает верх вьюпорта (от момента, когда её верх
 *             доехал до верха окна, до момента, когда туда же доехал
 *             её низ). Соседние секции делают чистый хендофф — старый
 *             маркер гаснет ровно когда зажигается новый.
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *   - ScrollTrigger
 *
 * Webflow селекторы:
 *   - .section-marker-wrap   — обёртка со всеми маркерами (контекст вёрстки)
 *   - [section-is]           — отдельные маркеры (всего 4 шт)
 *
 * Атрибуты в Webflow:
 *   - section-is="hero"      — имя класса целевой секции (БЕЗ точки)
 *                              Скрипт сам добавит `.` перед классом
 *                              при поиске секции.
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/navigation/sections-marker.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] sections-marker.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("[Need Vision] sections-marker.js: ScrollTrigger не загружен");
    return;
  }

  // ---- Проверка наличия маркеров ----
  const markers = document.querySelectorAll('[section-is]');
  if (markers.length === 0) return;

  gsap.registerPlugin(ScrollTrigger);

  // ---- Тайминги ----
  const FADE_DURATION = 0.3;

  // ---- Создаём ScrollTrigger на каждую пару маркер ↔ секция ----
  const triggers = [];

  markers.forEach(marker => {
    const sectionClass = marker.getAttribute('section-is');
    if (!sectionClass) return;

    const section = document.querySelector('.' + sectionClass);
    if (!section) {
      console.warn(
        `[Need Vision] sections-marker.js: не найдена секция .${sectionClass} ` +
        `для маркера с section-is="${sectionClass}"`
      );
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      onEnter: () => gsap.to(marker, {
        opacity: 1,
        duration: FADE_DURATION,
        ease: "power2.out",
        overwrite: "auto"
      }),
      onLeave: () => gsap.to(marker, {
        opacity: 0,
        duration: FADE_DURATION,
        ease: "power2.in",
        overwrite: "auto"
      }),
      onEnterBack: () => gsap.to(marker, {
        opacity: 1,
        duration: FADE_DURATION,
        ease: "power2.out",
        overwrite: "auto"
      }),
      onLeaveBack: () => gsap.to(marker, {
        opacity: 0,
        duration: FADE_DURATION,
        ease: "power2.in",
        overwrite: "auto"
      })
    });

    triggers.push({ marker, trigger });
  });

  // ---- Инициализация: если страница уже внутри какой-то секции на ----
  // ---- момент загрузки, сразу показать её маркер без анимации.    ----
  // ---- onEnter/onLeave не вызываются ретроактивно при создании.   ----
  triggers.forEach(({ marker, trigger }) => {
    if (trigger.isActive) {
      gsap.set(marker, { opacity: 1 });
    }
  });

  console.log(`[Need Vision] sections-marker.js: маркеров запущено — ${triggers.length}`);
});
