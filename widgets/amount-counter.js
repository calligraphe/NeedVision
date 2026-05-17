/**
 * NEED.VISION — Синхронный счётчик суммы (Odometer)
 * =================================================
 *
 * Что делает: рендерит барабан-счётчик с разделителем-пробелом
 *             (например, `400 800 400`) на ПЕРВОМ найденном элементе
 *             каждого селектора. Каждые 15–20 секунд прибавляет +15.
 *
 *             Берётся ровно ОДИН `.amount-counter` (первый в DOM) и
 *             ровно ОДИН `.menu_amount-counter`. Дубли в Webflow с тем
 *             же классом остаются как декоративная вёрстка — скрипт
 *             их не трогает.
 *
 *             Оба активных счётчика синхронизированы: один общий
 *             `currentAmount` и один таймер.
 *
 *             Odometer инициализируется СРАЗУ, даже если родитель
 *             свёрнут (nav-scroll.js стартует `.nav-profit` с width: 0).
 *             Размер цифр считается от шрифта, а не от ширины родителя,
 *             поэтому никакой ResizeObserver-страховки не нужно.
 *
 * Зависимости:
 *   - Odometer.js 0.4.7
 *     <script src="https://cdnjs.cloudflare.com/ajax/libs/odometer.js/0.4.7/odometer.min.js"></script>
 *     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/odometer.js/0.4.7/themes/odometer-theme-minimal.min.css">
 *
 * Webflow селекторы:
 *   - .amount-counter        — счётчик в навигации (первый в DOM)
 *   - .menu_amount-counter   — счётчик в раскрывающемся меню (первый в DOM)
 *
 * Подключение:
 *   <script src="https://needvision.aoxuaio.workers.dev/widgets/amount-counter.js"></script>
 */

function bootAmountCounter() {
  if (typeof Odometer === "undefined") {
    console.warn("[Need Vision] amount-counter.js: Odometer не загружен");
    return;
  }

  // Берём ровно по одному элементу каждого класса
  const elements = [
    document.querySelector('.amount-counter'),
    document.querySelector('.menu_amount-counter')
  ].filter(Boolean);

  if (elements.length === 0) return;

  // Константы
  const START_AMOUNT = 400800400;
  const INCREMENT = 15;
  const MIN_INTERVAL_MS = 15000;
  const MAX_INTERVAL_MS = 20000;

  // CSS-фикс: пробел между разрядами + наследование шрифта Webflow
  const style = document.createElement('style');
  style.innerHTML = `
    .odometer.odometer-auto-theme .odometer-digit-separator,
    .odometer .odometer-digit-separator {
      display: inline-block !important;
      width: 0.35em !important;
    }
    .odometer.odometer-auto-theme, .odometer {
      font-family: inherit;
    }
  `;
  document.head.appendChild(style);

  // Создаём Odometer на каждом элементе. Initial value = 400800400,
  // что бы в нём ни было до этого, Odometer перерендерит содержимое.
  let currentAmount = START_AMOUNT;
  const odometers = elements.map(el => new Odometer({
    el: el,
    value: currentAmount,
    format: ' ddd',
    theme: 'minimal'
  }));

  // Один общий таймер на все счётчики
  function tick() {
    currentAmount += INCREMENT;
    odometers.forEach(od => od.update(currentAmount));
    const next = Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1)) + MIN_INTERVAL_MS;
    setTimeout(tick, next);
  }

  const firstInterval = Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1)) + MIN_INTERVAL_MS;
  setTimeout(tick, firstInterval);
}

// Универсальный запуск (работает в любом порядке загрузки)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootAmountCounter);
} else {
  bootAmountCounter();
}
