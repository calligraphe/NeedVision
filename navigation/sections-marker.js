/**
 * NEED.VISION — Маркеры текущей секции в навигации
 * ================================================
 *
 * Что делает: фейдит opacity у маркеров навигации в зависимости от того,
 *             какая секция сейчас занимает верх вьюпорта.
 *
 *             Привязка маркер ↔ секция берётся ИЗ ЗНАЧЕНИЯ атрибута
 *             `section-is` на самом маркере. Имя в атрибуте = класс секции.
 *
 *             Пример:
 *               <div section-is="manifesto">…</div>     →  ищется .manifesto
 *               <div section-is="section-logo">…</div>  →  ищется .section-logo
 *
 *             Преимущества такого подхода:
 *               - Менять порядок маркеров в Webflow можно без правки кода
 *               - Добавлять/убирать маркеры можно без правки кода
 *               - Опечатка в атрибуте видна сразу в консоли
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *   - ScrollTrigger
 *
 * Webflow селекторы:
 *   - .sections-marker          — обёртка со всеми маркерами
 *   - .section-marker-wrap      — отдельный маркер (изначально opacity: 0 в CSS)
 *   - [section-is="..."]        — атрибут с именем класса секции
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/navigation/sections-marker.js"></script>
 */

// ---- Универсальный запуск ----
// Если DOMContentLoaded ещё впереди — ждём его.
// Если уже отстрелял (скрипт подгрузили позже) — запускаемся сразу.
// Если на момент запуска GSAP ещё не загружен — ждём до GSAP_WAIT_TIMEOUT_MS
// с проверкой через requestAnimationFrame (страховка от race condition
// при параллельной загрузке скриптов с CDN).
const GSAP_WAIT_TIMEOUT_MS = 3000;

function bootSectionsMarker() {
  const startedAt = performance.now();

  function waitForGsap() {
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      runSectionsMarker();
      return;
    }
    if (performance.now() - startedAt > GSAP_WAIT_TIMEOUT_MS) {
      console.warn("[Need Vision] sections-marker.js: GSAP / ScrollTrigger не загружены за " + GSAP_WAIT_TIMEOUT_MS + "мс");
      return;
    }
    requestAnimationFrame(waitForGsap);
  }
  waitForGsap();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootSectionsMarker);
} else {
  bootSectionsMarker();
}

function runSectionsMarker() {
  // ---- Тайминги ----
  const FADE_DURATION_IN = 0.4;
  const FADE_DURATION_OUT = 0.25;
  const REFRESH_DELAY_MS = 500;

  // ---- Поиск маркеров ----
  const markers = document.querySelectorAll("[section-is]");
  if (markers.length === 0) {
    console.warn("[Need Vision] sections-marker.js: не найдено ни одного маркера [section-is]");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ---- Управление opacity с !important ----
  // !important нужен чтобы перебить Webflow Interactions (IX2), которые
  // могут управлять opacity тех же элементов одновременно с этим скриптом
  function setOpacity(el, value, animate = true) {
    if (!animate) {
      el.style.setProperty("opacity", String(value), "important");
      return;
    }

    gsap.to(el, {
      opacity: value,
      duration: value === 1 ? FADE_DURATION_IN : FADE_DURATION_OUT,
      ease: value === 1 ? "power2.out" : "power2.in",
      overwrite: "auto",
      onUpdate: function () {
        el.style.setProperty("opacity", this.targets()[0].style.opacity, "important");
      }
    });
  }

  // ---- Привязка каждого маркера к своей секции ----
  // Все маркеры стартуют скрытыми (opacity: 0 в CSS уже стоит).
  // ScrollTrigger включит нужный когда его секция войдёт в верх вьюпорта.
  let activeMarkersCount = 0;

  markers.forEach((marker) => {
    const sectionName = marker.getAttribute("section-is");

    if (!sectionName || sectionName.trim() === "") {
      console.warn("[Need Vision] sections-marker.js: маркер без значения section-is", marker);
      return;
    }

    // Поддерживаем как селектор с точкой, так и без неё
    // (на случай если в Webflow кто-то напишет section-is=".manifesto")
    const cleanName = sectionName.replace(/^\./, "");
    const section = document.querySelector("." + cleanName);

    if (!section) {
      console.warn(`[Need Vision] sections-marker.js: секция .${cleanName} не найдена для маркера`, marker);
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      onEnter:     () => setOpacity(marker, 1),
      onLeave:     () => setOpacity(marker, 0),
      onEnterBack: () => setOpacity(marker, 1),
      onLeaveBack: () => setOpacity(marker, 0)
    });

    // Если страница уже внутри этой секции (например при перезагрузке
    // или загрузке с якорем) — показываем маркер сразу без анимации
    if (trigger.isActive) {
      setOpacity(marker, 1, false);
    }

    activeMarkersCount++;
  });

  if (activeMarkersCount === 0) {
    console.warn("[Need Vision] sections-marker.js: ни один маркер не был привязан к секции");
    return;
  }

  // ---- Refresh после позднего layout Webflow ----
  // Webflow иногда дорисовывает шрифты/изображения после DOMContentLoaded,
  // что меняет высоту секций и сбивает координаты ScrollTrigger
  setTimeout(() => ScrollTrigger.refresh(), REFRESH_DELAY_MS);

  // Дополнительный refresh после полной загрузки страницы (картинки, шрифты)
  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
  });
}
