/**
 * NEED.VISION — Бесшовные бегущие строки
 * ======================================
 *
 * Что делает: запускает GSAP-анимацию `xPercent: -50` с бесконечным
 *             повтором — петля визуально бесшовна.
 *
 *             Поддерживает ДВА паттерна вёрстки:
 *
 *             ── Паттерн 1: одна обёртка с дублированным контентом ──
 *               <div class="marquee-wrapper">content</div>
 *               Скрипт сам дублирует HTML внутри и крутит обёртку
 *               на -50% её собственной ширины. Используется в нав-баре.
 *
 *             ── Паттерн 2: контейнер с двумя готовыми обёртками ──
 *               <div class="nav_marquee-btn">
 *                 <div class="menu_marquee-wrapper">content</div>
 *                 <div class="menu_marquee-wrapper">content</div>
 *               </div>
 *               Дублировать ничего не надо — Webflow уже положил две
 *               одинаковые копии бок о бок. Скрипт крутит сам контейнер
 *               `nav_marquee-btn` на -50% (равно ширине одной обёртки).
 *               Используется в раскрывающемся меню.
 *
 *             Если элемент скрыт на момент DOMContentLoaded (например,
 *             меню свёрнуто), анимация не стартует сразу — GSAP бы
 *             закэшировал «xPercent: -50 от нулевой ширины = 0».
 *             Через `ResizeObserver` ждём, когда элемент получит
 *             ширину, и только тогда запускаем.
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *
 * Webflow селекторы:
 *   - .marquee-wrapper       — единая обёртка маркизы (паттерн 1)
 *   - .nav_marquee-btn       — контейнер с двумя обёртками (паттерн 2)
 *   - .menu_marquee-wrapper  — обёртки внутри `.nav_marquee-btn`
 *                              (НЕ селектор анимации — анимируется родитель)
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/widgets/marquee.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] marquee.js: GSAP не загружен");
    return;
  }

  // ---- Тайминги ----
  // 30s = одна полная петля. Подбирай вместе с шириной контента.
  const LOOP_DURATION = 30;

  // ---- Запуск анимации (с отложкой, если элемент скрыт) ----
  function animateMarquee(el) {
    const start = () => {
      gsap.to(el, {
        xPercent: -50,
        repeat: -1,
        duration: LOOP_DURATION,
        ease: "none",
        force3D: true
      });
    };

    if (el.offsetWidth > 0) {
      start();
      return;
    }

    // Элемент пока невидим (свёрнутое меню) — ждём, когда получит ширину
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(entries => {
        if (entries[0].contentRect.width > 0) {
          ro.disconnect();
          start();
        }
      });
      ro.observe(el);
    } else {
      // Старые браузеры — стартуем как есть
      start();
    }
  }

  // ---- Паттерн 1: одна обёртка, дублируем содержимое внутри ----
  const singleMarquees = document.querySelectorAll(".marquee-wrapper");
  singleMarquees.forEach(marquee => {
    marquee.innerHTML += marquee.innerHTML;
    animateMarquee(marquee);
  });

  // ---- Паттерн 2: контейнер с двумя готовыми обёртками ----
  const groupedMarquees = document.querySelectorAll(".nav_marquee-btn");
  groupedMarquees.forEach(container => {
    animateMarquee(container);
  });

  // ---- Лог для диагностики ----
  console.log(
    `[Need Vision] marquee.js: одиночных=${singleMarquees.length}, групповых=${groupedMarquees.length}`
  );
});
