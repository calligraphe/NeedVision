/**
 * NEED.VISION — Активное состояние на странице /cases
 * ====================================================
 *
 * Что делает: одна `.case-row` в любой момент времени помечена классом
 * `.is-active` (по умолчанию — первая). На mouseenter любой другой
 * строки переключаем active → старая теряет класс, новая получает.
 *
 * Визуальный эффект «заливения каждый раз»:
 *   1. Строка: ::before-псевдоэлемент с scaleX(0→1) из CSS — оранжевый
 *      заливает строку слева направо за 0.45s. Каждое переключение
 *      даёт новую анимацию заливки. (См. custom.css секция 5.)
 *   2. Сайдбар `.cases-sidebar_display`: при свиче active превью
 *      сначала «уходит» (clip-path inset top 0→100%), потом срабатывает
 *      свап src, потом «заливается» обратно (clip-path 100→0).
 *      Эффект «новая картинка наливается снизу вверх» на каждом hover.
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *
 * Webflow селекторы:
 *   - .case-row              — строка кейса (hover-цель)
 *   - .case-row_preview-img  — превью-картинка (display:none, src-источник)
 *   - .cases-sidebar_display — контейнер где показывается превью
 *
 * Скрипт безопасен на других страницах — guard'ы на отсутствие узлов.
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sections/cases-page.js"></script>
 */

function bootCasesPageHover() {
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] cases-page.js: GSAP не загружен");
    return;
  }

  const rows = Array.from(document.querySelectorAll(".case-row"));
  const display = document.querySelector(".cases-sidebar_display");
  if (rows.length === 0 || !display) return;

  // ---- Кэш src по строкам ----
  const rowSrcs = rows.map(row => {
    const img = row.querySelector(".case-row_preview-img");
    return img ? (img.getAttribute("src") || "") : "";
  });

  // ---- Preview-img в display ----
  let preview = display.querySelector(".cases-sidebar_preview");
  if (!preview) {
    preview = document.createElement("img");
    preview.className = "cases-sidebar_preview";
    preview.alt = "";
    display.appendChild(preview);
  }

  // ---- Тайминги для сайдбар-свича ----
  const HIDE_DUR   = 0.3;
  const REVEAL_DUR = 0.5;

  let currentSrc = null;
  let activeIdx  = -1;
  let switchTl   = null;

  // Свич превью с эффектом «заливения»: hide → swap → reveal.
  // Первая отрисовка пропускает hide (превью изначально скрыта CSS-ом).
  function showPreview(src) {
    if (src === currentSrc) return;
    if (switchTl) switchTl.kill();
    switchTl = gsap.timeline();

    if (currentSrc === null) {
      preview.src = src;
      currentSrc = src;
      switchTl.to(preview, {
        clipPath: "inset(0% 0 0 0)",
        duration: REVEAL_DUR,
        ease: "power2.out"
      });
    } else {
      switchTl.to(preview, {
        clipPath: "inset(100% 0 0 0)",
        duration: HIDE_DUR,
        ease: "power2.in"
      });
      switchTl.call(() => {
        preview.src = src;
        currentSrc = src;
      });
      switchTl.to(preview, {
        clipPath: "inset(0% 0 0 0)",
        duration: REVEAL_DUR,
        ease: "power2.out"
      });
    }
  }

  // Переключение активной строки. Класс .is-active даёт CSS-заливку
  // через ::before scaleX(0→1) + чёрный текст + видимую стрелку.
  function setActive(idx) {
    if (idx === activeIdx) return;
    activeIdx = idx;
    rows.forEach((row, i) => {
      row.classList.toggle("is-active", i === idx);
    });
    const src = rowSrcs[idx];
    if (src) showPreview(src);
  }

  // ---- Default: первая строка горит ----
  setActive(0);

  // ---- Hover любой строки → она становится активной ----
  rows.forEach((row, i) => {
    row.addEventListener("mouseenter", () => setActive(i));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootCasesPageHover);
} else {
  bootCasesPageHover();
}
