/**
 * NEED.VISION — Бесконечный счётчик суммы (Odometer)
 * ==================================================
 *
 * Что делает: рендерит барабан-счётчик с разделителем-пробелом
 *             (например, `400 800 400`) и каждые 15–20 секунд
 *             прибавляет +15 — даёт ощущение «живых» поступлений.
 *
 * Зависимости:
 *   - Odometer.js 0.4.7
 *     <script src="https://cdnjs.cloudflare.com/ajax/libs/odometer.js/0.4.7/odometer.min.js"></script>
 *     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/odometer.js/0.4.7/themes/odometer-theme-minimal.min.css">
 *
 * Webflow селекторы:
 *   - .amount-counter        — div, в который Odometer вставит цифры
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

  // ---- Проверка наличия элемента ----
  const counterElement = document.querySelector('.amount-counter');
  if (!counterElement) return;

  // ---- Тайминги и константы ----
  const START_AMOUNT = 400800400;
  const INCREMENT = 15;
  const MIN_INTERVAL_MS = 15000;
  const MAX_INTERVAL_MS = 20000;

  let currentAmount = START_AMOUNT;

  // ---- Настраиваем Odometer с разделителем-пробелом ----
  const od = new Odometer({
    el: counterElement,
    value: currentAmount,
    format: ' ddd', // Формат с пробелом перед разрядами
    theme: 'minimal'
  });

  // ---- CSS-фикс: пробел между разрядами и наследование шрифта Webflow ----
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

  // ---- Функция обновления ----
  function updateCounter() {
    currentAmount += INCREMENT;
    od.update(currentAmount);

    const nextInterval = Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1)) + MIN_INTERVAL_MS;
    setTimeout(updateCounter, nextInterval);
  }

  // ---- Первый запуск через 15–20 секунд после загрузки ----
  const initialInterval = Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1)) + MIN_INTERVAL_MS;
  setTimeout(updateCounter, initialInterval);
});
