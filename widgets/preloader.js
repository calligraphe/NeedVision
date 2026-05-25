/**
 * Прелоудер: цикл 9 иконок, гасим на window.load.
 *
 * При клике по внутренней ссылке показываем заново и переходим через
 * NAV_DELAY_MS. На новой странице подхватится опять.
 *
 * Пока виден — html/body overflow:hidden, скролл и клики заблокированы
 * (z-index 9999 на .preloader из Webflow CSS).
 *
 * Цикл через rAF (без drift от setInterval). MIN_DISPLAY_MS защищает
 * от «мигания» если ресурсы загрузились раньше чем юзер увидит.
 * GSAP только для fade-out — есть CSS-fallback.
 */

function bootPreloader() {
  const preloader = document.querySelector(".preloader");
  if (!preloader) return;

  const icons = Array.from(preloader.querySelectorAll(".preloader_icon"));
  if (icons.length === 0) return;

  const FRAME_MS         = 400;       // 0.4с на каждое лого
  const MIN_DISPLAY_MS   = 400 * 9;   // минимум — полный цикл 1→9
  const PAUSE_ON_LAST_MS = 600;       // держим 9-е лого перед fade
  const FADE_DURATION    = 1.0;       // длительность fade-out
  const NAV_DELAY_MS     = 320;       // пауза перед location.href

  let cycleRunning = false;
  let currentIdx   = 0;
  let lastFrameAt  = 0;
  let shownAt      = 0;
  let navigating   = false;

  // Стартовое: первая видна, остальные прозрачны.
  icons.forEach((icon, i) => {
    icon.style.opacity = i === 0 ? "1" : "0";
    icon.style.willChange = "opacity";
  });

  function lockUI() {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }
  function unlockUI() {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }

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

  function showPreloader() {
    preloader.style.display = "flex";
    preloader.style.opacity = "1";
    preloader.style.pointerEvents = "auto";
    shownAt = performance.now();
    lockUI();
    startCycle();
  }

  // Ждём пока currentIdx дойдёт до последнего лого (9-й, индекс len-1).
  // Без этого fade-out мог сработать посреди цикла → юзер видел резкий
  // обрыв на 4-й или 7-й иконке. Теперь всегда полный 1→9 цикл.
  function waitForCycleEnd(callback) {
    if (!cycleRunning || currentIdx === icons.length - 1) {
      callback();
      return;
    }
    const check = () => {
      if (currentIdx === icons.length - 1) callback();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  function hidePreloader() {
    if (navigating) return;  // уходим на другую страницу — не гасим
    const elapsed = performance.now() - shownAt;
    const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);

    setTimeout(() => {
      waitForCycleEnd(() => {
        // Достигли 9-го лого. Стопаем цикл сразу — 9-е лого держится
        // на экране PAUSE_ON_LAST_MS, потом fade.
        stopCycle();

        setTimeout(() => {
          const onDone = () => {
            preloader.style.display = "none";
            unlockUI();
          };

          if (typeof gsap !== "undefined") {
            gsap.to(preloader, {
              opacity: 0,
              duration: FADE_DURATION,
              ease: "expo.out",
              onComplete: onDone
            });
          } else {
            preloader.style.transition = `opacity ${FADE_DURATION}s cubic-bezier(0.16, 1, 0.3, 1)`;
            preloader.style.opacity = "0";
            setTimeout(onDone, FADE_DURATION * 1000);
          }
        }, PAUSE_ON_LAST_MS);
      });
    }, wait);
  }

  // Первая загрузка
  showPreloader();

  if (document.readyState === "complete") {
    requestAnimationFrame(hidePreloader);
  } else {
    window.addEventListener("load", hidePreloader, { once: true });
  }

  // Клики по внутренним ссылкам — переход через прелоудер.
  // Пропускаем якоря, mailto/tel, _blank, ctrl/cmd-клики (новая вкладка).
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
