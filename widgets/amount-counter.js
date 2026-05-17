/**
 * NEED.VISION — Бесконечный счётчик суммы (Odometer)
 * ==================================================
 *
 * Что делает: рендерит барабан-счётчик с разделителем-пробелом
 *             (например, `400 800 400`) и каждые 15–20 секунд
 *             прибавляет +15 — даёт ощущение «живых» поступлений.
 *
 *             Скрипт находит ВСЕ совпадения сразу:
 *               - `.amount-counter`        — счётчик в навигации
 *               - `.menu_amount-counter`   — счётчик в раскрывающемся меню
 *
 *             У каждого свой Odometer-экземпляр и свой таймер —
 *             числа на двух счётчиках будут близкими, но не точно
 *             синхронными (одновременно их обычно не видно).
 *
 *             Если элемент скрыт на момент DOMContentLoaded (например,
 *             меню свёрнуто), Odometer не инициализируется сразу.
 *             Через `ResizeObserver` ждём, когда элемент получит
 *             ширину, и только потом запускаем — иначе Odometer
 *             может неправильно посчитать макет.
 *
 * Зависимости:
 *   - Odometer.js 0.4.7
 *     <script src="https://cdnjs.cloudflare.com/ajax/libs/odometer.js/0.4.7/odometer.min.js"></script>
 *     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/odometer.js/0.4.7/themes/odometer-theme-minimal.min.css">
 *
 * Webflow селекторы:
 *   - .amount-counter        — счётчик в навигации
 *   - .menu_amount-counter   — счётчик в раскрывающемся меню
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/widgets/amount-counter.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof Odometer === "undefined") {
    console.warn("[Need Vision] amount-counter.js: Odometer не загружен");
    return;
  }

  // ---- Проверка наличия элементов ----
  const counterElements = document.querySelectorAll('.amount-counter, .menu_amount-counter');
  console.log(`[Need Vision] amount-counter.js: найдено счётчиков — ${counterElements.length}`);
  if (counterElements.length === 0) return;

  // ---- Тайминги и константы ----
  const START_AMOUNT = 400800400;
  const INCREMENT = 15;
  const MIN_INTERVAL_MS = 15000;
  const MAX_INTERVAL_MS = 20000;

  // ---- CSS-фикс (один раз для всех счётчиков) ----
  // Принудительный пробел между разрядами + наследование шрифта Webflow.
  const style = document.createElement('style');
  style.innerHTML = `
    .odometer.odometer-auto-theme .odometer-digit-separator,
    .odometer .odometer-digit-separator {
      display: inline-block !important;
      width: 0.35em !important;
      content: " " !important;
    }
    .odometer.odometer-auto-theme, .odometer {
      font-family: inherit;
    }
  `;
  document.head.appendChild(style);

  // ---- Инициализация Odometer на одном элементе ----
  function initCounter(counterElement) {
    let currentAmount = START_AMOUNT;

    const od = new Odometer({
      el: counterElement,
      value: currentAmount,
      format: ' ddd', // формат с пробелом перед разрядами
      theme: 'minimal'
    });

    function updateCounter() {
      currentAmount += INCREMENT;
      od.update(currentAmount);

      const nextInterval = Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1)) + MIN_INTERVAL_MS;
      setTimeout(updateCounter, nextInterval);
    }

    const initialInterval = Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1)) + MIN_INTERVAL_MS;
    setTimeout(updateCounter, initialInterval);
  }

  // ---- Запускаем счётчик на каждом элементе (с отложкой, если скрыт) ----
  counterElements.forEach(counterElement => {
    if (counterElement.offsetWidth > 0) {
      initCounter(counterElement);
      return;
    }

    // Элемент пока невидим (свёрнутое меню) — ждём, когда получит ширину
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(entries => {
        if (entries[0].contentRect.width > 0) {
          ro.disconnect();
          initCounter(counterElement);
        }
      });
      ro.observe(counterElement);
    } else {
      // Старые браузеры — стартуем как есть
      initCounter(counterElement);
    }
  });
});
