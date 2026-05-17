/**
 * NEED.VISION — Синхронный счётчик суммы (Odometer)
 * =================================================
 *
 * Что делает: рендерит барабан-счётчик с разделителем-пробелом
 *             (например, `400 800 400`) на ВСЕХ элементах, которые
 *             в DOM имеют классы `.amount-counter` и `.menu_amount-counter`.
 *             Каждые 15–20 секунд прибавляет +15 ко всем счётчикам
 *             синхронно (один общий `currentAmount` и один общий таймер).
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
 *   <script src="https://needvision.aoxuaio.workers.dev/widgets/amount-counter.js"></script>
 */

(() => {
  // ---- Константы ----
  const START_AMOUNT = 400800400;
  const INCREMENT = 15;
  const MIN_INTERVAL_MS = 15000;
  const MAX_INTERVAL_MS = 20000;
  const ODOMETER_WAIT_MAX_MS = 3000;
  const ODOMETER_WAIT_STEP_MS = 100;
  const STYLE_FLAG = "data-need-vision-amount-counter-styles";

  // ---- Состояние модуля (защита от двойного запуска) ----
  let initialized = false;
  let tickTimer = null;

  function randomInterval() {
    return Math.floor(
      Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1)
    ) + MIN_INTERVAL_MS;
  }

  function injectStyles() {
    // Не добавляем стили повторно при перезапуске
    if (document.head.querySelector(`style[${STYLE_FLAG}]`)) return;

    const style = document.createElement("style");
    style.setAttribute(STYLE_FLAG, "");
    style.textContent = `
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
  }

  function setupCounters() {
    if (initialized) {
      console.warn("[Need Vision] amount-counter.js: попытка повторной инициализации, пропускаем");
      return;
    }

    // Берём ВСЕ элементы с нужными классами (на случай нескольких счётчиков в DOM)
    const nodes = [
      ...document.querySelectorAll(".amount-counter"),
      ...document.querySelectorAll(".menu_amount-counter")
    ];

    if (nodes.length === 0) return;

    injectStyles();

    let currentAmount = START_AMOUNT;

    const odometers = nodes.map((el) => new Odometer({
      el: el,
      value: currentAmount,
      // ( ddd) — официальный формат Odometer для группировки пробелом
      format: "( ddd)",
      theme: "minimal"
    }));

    initialized = true;

    // Очищаем предыдущий таймер, если был
    if (tickTimer) {
      clearTimeout(tickTimer);
      tickTimer = null;
    }

    function tick() {
      currentAmount += INCREMENT;
      odometers.forEach((od) => od.update(currentAmount));
      tickTimer = setTimeout(tick, randomInterval());
    }

    tickTimer = setTimeout(tick, randomInterval());
  }

  // ---- Ожидание Odometer с тайм-аутом ----
  // На случай если этот скрипт загружен раньше Odometer
  function waitForOdometer(elapsed = 0) {
    if (typeof Odometer !== "undefined") {
      setupCounters();
      return;
    }

    if (elapsed >= ODOMETER_WAIT_MAX_MS) {
      console.warn(
        `[Need Vision] amount-counter.js: Odometer не загрузился за ${ODOMETER_WAIT_MAX_MS}мс`
      );
      return;
    }

    setTimeout(() => waitForOdometer(elapsed + ODOMETER_WAIT_STEP_MS), ODOMETER_WAIT_STEP_MS);
  }

  function boot() {
    waitForOdometer();
  }

  // ---- Универсальный запуск ----
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
