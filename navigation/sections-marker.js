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
 *             секция занимает верх вьюпорта.
 *
 *             Чтобы перебить возможные Webflow Interactions (IX2),
 *             которые могут параллельно ставить opacity у этих же
 *             элементов, скрипт пишет `opacity` напрямую в inline-style
 *             с `!important` (`element.style.setProperty(..., 'important')`).
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
 *
 * ⚠ ВАЖНО: если на маркерах висят Webflow Interactions, которые
 *    управляют opacity (например, «при наведении/скролле»), их нужно
 *    отключить — иначе IX2 и этот скрипт будут драться за стиль.
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

  // ---- Установка opacity с `!important`, чтобы перебить Webflow IX2 ----
  // GSAP сам по себе пишет в inline-style, но без `!important`. Если в
  // Webflow на маркер навешана интеракция со скрытым `opacity: 0` или
  // CSS с `!important` — GSAP проигрывает. Поэтому пишем напрямую.
  function setOpacity(el, value, animate = true) {
    if (!animate) {
      el.style.setProperty('opacity', value, 'important');
      return;
    }
    // Анимируем через GSAP, но в конце форсируем !important — чтобы
    // последующие IX2-апдейты не сбросили значение.
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

  // ---- Создаём ScrollTrigger на каждую пару маркер ↔ секция ----
  const triggers = [];

  markers.forEach((marker, idx) => {
    const sectionClass = marker.getAttribute('section-is');
    if (!sectionClass) return;

    const section = document.querySelector('.' + sectionClass);
    if (!section) {
      console.warn(
        `[Need Vision] sections-marker.js: маркер #${idx} ` +
        `с section-is="${sectionClass}" — секция .${sectionClass} не найдена`
      );
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      onEnter: () => {
        console.log(`[sections-marker] ВКЛ: .${sectionClass}`);
        setOpacity(marker, 1);
      },
      onLeave: () => {
        console.log(`[sections-marker] выкл: .${sectionClass} (вниз)`);
        setOpacity(marker, 0);
      },
      onEnterBack: () => {
        console.log(`[sections-marker] ВКЛ: .${sectionClass} (наверх)`);
        setOpacity(marker, 1);
      },
      onLeaveBack: () => {
        console.log(`[sections-marker] выкл: .${sectionClass} (наверх)`);
        setOpacity(marker, 0);
      }
    });

    triggers.push({ marker, trigger, sectionClass, section });
  });

  // ---- Инициализация: если страница уже внутри какой-то секции ----
  triggers.forEach(({ marker, trigger, sectionClass }) => {
    if (trigger.isActive) {
      console.log(`[sections-marker] стартовое состояние: .${sectionClass} активна`);
      setOpacity(marker, 1, false);
    }
  });

  // ---- Refresh: на случай если Webflow подгрузил что-то поздно ----
  // и ScrollTrigger считал размеры до финального layout.
  setTimeout(() => ScrollTrigger.refresh(), 500);

  // ---- Диагностический отчёт ----
  console.log(`[sections-marker] всего маркеров: ${triggers.length}`);
  triggers.forEach(({ trigger, sectionClass }, i) => {
    console.log(
      `  #${i}  .${sectionClass}  start=${Math.round(trigger.start)}px  ` +
      `end=${Math.round(trigger.end)}px  isActive=${trigger.isActive}`
    );
  });
});
