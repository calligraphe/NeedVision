/**
 * NEED.VISION — Прелоудер с циклом 9 иконок
 * ==========================================
 *
 * Что делает:
 *   1. ПЕРВАЯ ЗАГРУЗКА: показывает `.preloader` сразу при boot'е, крутит
 *      9 иконок (`.preloader_icon._1` … `._9`) циклом до тех пор, пока
 *      не сработает `window.load` (все картинки/шрифты/ресурсы загружены).
 *      Затем плавно гасит прозрачность и снимает блокировку UI.
 *
 *   2. ПЕРЕХОДЫ МЕЖДУ СТРАНИЦАМИ: перехватывает клики по внутренним
 *      ссылкам (same-origin, основной клик, без модификаторов, не _blank,
 *      не якорь), показывает прелоудер с короткой задержкой, потом
 *      делает `location.href = ...`. На новой странице прелоудер
 *      подхватится снова — continuous loading experience.
 *
 *   3. Пока прелоудер виден — html/body overflow:hidden (нет скролла),
 *      сам прелоудер имеет z-index 9999 (по CSS) → клики не доходят
 *      до контента под ним.
 *
 * Перф-заметки:
 *   - Цикл иконок — через requestAnimationFrame с timestamp-чеком,
 *     а не setInterval (rAF синхронизирован с refresh rate, нет drift).
 *   - opacity-toggle для смены иконок — composite-only, без reflow.
 *   - MIN_DISPLAY_MS защищает от «мигания» прелоудера на быстрых
 *     соединениях, когда window.load приходит за 100мс.
 *
 * Зависимости:
 *   - GSAP 3.12.x (для плавного fade-out; есть fallback на CSS-transition)
 *
 * Webflow селекторы:
 *   - .preloader              — корневой контейнер (CSS: display:none, z:9999)
 *   - .preloader_container    — внутренний центрирующий слой
 *   - .preloader_icon         — иконка цикла (9 штук, _1 ... _9)
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/widgets/preloader.js"></script>
 *   (грузить РАНЬШЕ остальных скриптов в footer-code, чтобы прелоудер
 *    появился до старта остальной анимации)
 */

function bootPreloader() {
  const preloader = document.querySelector(".preloader");
  if (!preloader) return;

  const icons = Array.from(preloader.querySelectorAll(".preloader_icon"));
  if (icons.length === 0) return;

  // ---- Тайминги ----
  const FRAME_MS       = 90;     // длительность одного кадра цикла (~11 fps)
  const MIN_DISPLAY_MS = 600;    // минимум видимости — не «мигает» на fast load
  const FADE_DURATION  = 0.55;   // gsap fade-out секунд
  const NAV_DELAY_MS   = 220;    // пауза перед location.href при переходе

  // ---- Состояние ----
  let cycleRunning = false;
  let currentIdx   = 0;
  let lastFrameAt  = 0;
  let shownAt      = 0;
  let navigating   = false;

  // Стартовое: первая иконка видна, остальные прозрачны.
  icons.forEach((icon, i) => {
    icon.style.opacity = i === 0 ? "1" : "0";
    icon.style.willChange = "opacity";
  });

  // ==========================================
  // LOCK / UNLOCK UI
  // ==========================================
  function lockUI() {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }
  function unlockUI() {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }

  // ==========================================
  // ЦИКЛ ИКОНОК (rAF)
  // ==========================================
  function tick(now) {
    if (!cycleRunning) return;
    if (now - lastFrameAt >= FRAME_MS) {
      lastFrameAt = now;
      icons[currentIdx].style.opacity = "0";
      currentIdx = (currentIdx + 1) % icons.length;
      icons[currentIdx].style.opacity = "1";
    }
    requestAnimationFrame(tick);
  }
  function startCycle() {
    if (cycleRunning) return;
    cycleRunning = true;
    lastFrameAt = performance.now();
    requestAnimationFrame(tick);
  }
  function stopCycle() {
    cycleRunning = false;
  }

  // ==========================================
  // SHOW / HIDE
  // ==========================================
  function showPreloader() {
    preloader.style.display = "flex";
    preloader.style.opacity = "1";
    preloader.style.pointerEvents = "auto";
    shownAt = performance.now();
    lockUI();
    startCycle();
  }

  function hidePreloader() {
    if (navigating) return;  // если уходим на другую страницу — не гасим
    const elapsed = performance.now() - shownAt;
    const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);

    setTimeout(() => {
      const onDone = () => {
        stopCycle();
        preloader.style.display = "none";
        unlockUI();
      };

      if (typeof gsap !== "undefined") {
        gsap.to(preloader, {
          opacity: 0,
          duration: FADE_DURATION,
          ease: "power2.out",
          onComplete: onDone
        });
      } else {
        // Fallback без GSAP
        preloader.style.transition = `opacity ${FADE_DURATION}s ease-out`;
        preloader.style.opacity = "0";
        setTimeout(onDone, FADE_DURATION * 1000);
      }
    }, wait);
  }

  // ==========================================
  // ПЕРВАЯ ЗАГРУЗКА
  // ==========================================
  showPreloader();

  if (document.readyState === "complete") {
    // Все ресурсы уже подгружены к моменту запуска скрипта.
    requestAnimationFrame(hidePreloader);
  } else {
    window.addEventListener("load", hidePreloader, { once: true });
  }

  // ==========================================
  // ПЕРЕХОДЫ МЕЖДУ СТРАНИЦАМИ
  // ==========================================
  // Перехватываем клики по same-origin ссылкам и показываем прелоудер
  // перед navigate. Внешние ссылки, mailto/tel, якоря, _blank,
  // ctrl/cmd-клики (новая вкладка) — пропускаем как обычно.
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    const link = e.target.closest("a[href]");
    if (!link) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download")) return;

    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    if (/^(#|mailto:|tel:|javascript:)/i.test(href)) return;

    let url;
    try { url = new URL(href, location.href); } catch { return; }

    if (url.origin !== location.origin) return;
    // Якорь / тот же URL — не перехватываем (страница не меняется).
    if (url.pathname === location.pathname && url.search === location.search) return;

    e.preventDefault();
    navigating = true;
    showPreloader();
    setTimeout(() => { window.location.href = link.href; }, NAV_DELAY_MS);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootPreloader);
} else {
  bootPreloader();
}
