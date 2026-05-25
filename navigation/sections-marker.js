/**
 * Маркеры текущей секции в навигации. Каждый маркер — `[section-is="..."]`,
 * значение = класс секции (без точки). При скролле к секции маркер
 * проявляется, при выходе — гаснет. Привязка через атрибут, а не через
 * порядок: можно переставлять/добавлять маркеры в Webflow без правки кода.
 */

const GSAP_WAIT_TIMEOUT_MS = 3000;

function bootSectionsMarker() {
  const startedAt = performance.now();

  function waitForGsap() {
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      runSectionsMarker();
      return;
    }
    if (performance.now() - startedAt > GSAP_WAIT_TIMEOUT_MS) {
      console.warn("sections-marker.js: GSAP/ScrollTrigger не загружены за " + GSAP_WAIT_TIMEOUT_MS + "мс");
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
  const FADE_DURATION_IN = 0.4;
  const FADE_DURATION_OUT = 0.25;
  const REFRESH_DELAY_MS = 500;

  const markers = document.querySelectorAll("[section-is]");
  if (markers.length === 0) {
    console.warn("sections-marker.js: не найдено маркеров [section-is]");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // !important нужен — Webflow IX2 может править opacity тех же элементов
  // параллельно, иначе наш tween затирается.
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

  let activeMarkersCount = 0;

  markers.forEach((marker) => {
    const sectionName = marker.getAttribute("section-is");

    if (!sectionName || sectionName.trim() === "") {
      console.warn("sections-marker.js: маркер без значения section-is", marker);
      return;
    }

    // Принимаем и "manifesto", и ".manifesto"
    const cleanName = sectionName.replace(/^\./, "");
    const section = document.querySelector("." + cleanName);

    if (!section) {
      console.warn(`sections-marker.js: секция .${cleanName} не найдена`, marker);
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

    // Загрузка по якорю / перезагрузка внутри секции → показать сразу
    if (trigger.isActive) {
      setOpacity(marker, 1, false);
    }

    activeMarkersCount++;
  });

  if (activeMarkersCount === 0) {
    console.warn("sections-marker.js: ни один маркер не привязан к секции");
    return;
  }

  // Webflow догружает шрифты/картинки после DOMContentLoaded → высоты
  // секций меняются → координаты ScrollTrigger сбиваются. Перепосчитать.
  setTimeout(() => ScrollTrigger.refresh(), REFRESH_DELAY_MS);
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
