/**
 * NEED.VISION — Бесшовные бегущие строки
 * ======================================
 *
 * Что делает: для каждой найденной маркизы дублирует её HTML-содержимое
 *             (клонирует и добавляет в конец) и крутит элемент влево на
 *             -50% его собственной ширины с бесконечным повтором — петля
 *             визуально бесшовна.
 *
 *             Скрипт находит ВСЕ маркизы сразу:
 *               - `.marquee-wrapper`       — маркиза в нав-баре
 *               - `.menu_marquee-wrapper`  — маркиза(ы) в раскрывающемся
 *                                            меню (лежит внутри кнопки
 *                                            `nav_marquee-btn`, но саму
 *                                            кнопку не трогаем)
 *
 *             Если элемент скрыт на момент DOMContentLoaded (например,
 *             меню свёрнуто и имеет `height: 0`), анимация не стартует
 *             сразу — GSAP закэшировал бы «xPercent: -50 от нулевой
 *             ширины = 0» и анимация осталась бы мёртвой даже после
 *             раскрытия меню. Через `ResizeObserver` ждём, когда
 *             элемент получит реальную ширину, и только тогда стартуем.
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *
 * Webflow селекторы:
 *   - .marquee-wrapper       — обёртка маркизы в нав-баре
 *   - .menu_marquee-wrapper  — обёртка маркизы в меню (может быть несколько)
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

  // ---- Проверка наличия маркиз ----
  const marquees = document.querySelectorAll(".marquee-wrapper, .menu_marquee-wrapper");
  console.log(`[Need Vision] marquee.js: найдено маркиз — ${marquees.length}`);
  if (marquees.length === 0) return;

  // ---- Тайминги ----
  // Длительность одного цикла: при удвоении контента 30s даёт ту же скорость,
  // что и 15s на неудвоенном — петля длиннее, но визуальный ритм тот же.
  const LOOP_DURATION = 30;

  // ---- Запуск маркизы (с отложкой, если элемент пока невидим) ----
  function startMarquee(marquee) {
    // Дублируем содержимое — клонируем HTML и добавляем в конец
    const originalContent = marquee.innerHTML;
    marquee.innerHTML = originalContent + originalContent;

    // Анимируем на -50% (одна копия уехала, вторая на её месте — петля бесшовна)
    gsap.to(marquee, {
      xPercent: -50,
      repeat: -1,
      duration: LOOP_DURATION,
      ease: "none",
      force3D: true
    });
  }

  marquees.forEach(marquee => {
    if (marquee.offsetWidth > 0) {
      startMarquee(marquee);
      return;
    }

    // Элемент пока невидим (свёрнутое меню) — ждём, когда получит ширину
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(entries => {
        if (entries[0].contentRect.width > 0) {
          ro.disconnect();
          startMarquee(marquee);
        }
      });
      ro.observe(marquee);
    } else {
      // Старые браузеры — стартуем как есть
      startMarquee(marquee);
    }
  });
});
