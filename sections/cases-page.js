/**
 * NEED.VISION — Hover на странице /cases
 * =======================================
 *
 * Что делает: при наведении на `.case-row` подменяет картинку в
 * `.cases-sidebar_display` на превью этой строки (`.case-row_preview-img`)
 * и анимирует «заливку снизу вверх» через clip-path: inset().
 *
 * Сам hover-стиль строки (оранжевый фон, чёрный текст, видимая стрелка)
 * живёт в CSS (`styles/custom.css`, секция «5. Страница /cases»).
 * Этот скрипт нужен только для anim'а sidebar-картинки, т.к. CSS
 * не умеет «брать src из соседнего элемента».
 *
 * UX-нюанс с переходами между строками:
 *   На mouseleave пускаем hide НЕ сразу, а с задержкой HIDE_DELAY_MS.
 *   Если в течение этой задержки сработал mouseenter на другую строку —
 *   отменяем hide и просто свапаем src + продолжаем reveal'ить.
 *   Это убирает «миг» когда между строками картинка успевала спрятаться
 *   и тут же открыться обратно.
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *
 * Webflow селекторы:
 *   - .case-row              — строка кейса (link, hover-цель)
 *   - .case-row_preview-img  — превью-картинка (display:none в CSS, нужна
 *                              только как источник src для сайдбара)
 *   - .cases-sidebar_display — контейнер где показывается превью
 *                              (css: position:relative + overflow:hidden
 *                              добавлены в custom.css)
 *
 * Скрипт безопасен на других страницах — если нет .case-row или
 * .cases-sidebar_display, молча возвращается.
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

  // ---- Кэш src по строкам (querySelector один раз при init) ----
  const rowSrcs = rows.map(row => {
    const img = row.querySelector(".case-row_preview-img");
    return img ? (img.getAttribute("src") || "") : "";
  });

  // ---- Preview-img внутри display (создаём один раз, переиспользуем) ----
  let preview = display.querySelector(".cases-sidebar_preview");
  if (!preview) {
    preview = document.createElement("img");
    preview.className = "cases-sidebar_preview";
    preview.alt = "";
    display.appendChild(preview);
  }

  // ---- Тайминги ----
  const REVEAL_DUR    = 0.55;   // секунд — раскрытие снизу вверх
  const HIDE_DUR      = 0.4;    // секунд — обратное схлопывание
  const HIDE_DELAY_MS = 100;    // даём шанс mouseenter другой строки перехватить

  let currentSrc = null;
  let hideTimer  = null;

  function reveal(src) {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    if (src && src !== currentSrc) {
      preview.src = src;
      currentSrc = src;
    }
    gsap.to(preview, {
      clipPath: "inset(0% 0 0 0)",
      duration: REVEAL_DUR,
      ease: "power2.out",
      overwrite: "auto"
    });
  }

  function scheduleHide() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      hideTimer = null;
      gsap.to(preview, {
        clipPath: "inset(100% 0 0 0)",
        duration: HIDE_DUR,
        ease: "power2.in",
        overwrite: "auto"
      });
    }, HIDE_DELAY_MS);
  }

  rows.forEach((row, i) => {
    const src = rowSrcs[i];
    if (!src) return;
    row.addEventListener("mouseenter", () => reveal(src));
    row.addEventListener("mouseleave", scheduleHide);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootCasesPageHover);
} else {
  bootCasesPageHover();
}
