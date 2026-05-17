/**
 * NEED.VISION — Синхронный счётчик суммы (Odometer)
 * =================================================
 *
 * Что делает: рендерит барабан-счётчик с разделителем-пробелом
 *             (например, `400 800 400`) на ПЕРВОМ найденном элементе
 *             каждого селектора. Каждые 15–20 секунд прибавляет +15.
 *
 *             Принципиально: берём ровно ОДИН элемент `.amount-counter`
 *             (первый в DOM) и ровно ОДИН `.menu_amount-counter`.
 *             Если в Webflow есть несколько дублей с тем же классом —
 *             они будут оставаться как placeholder-вёрстка, скрипт их
 *             не трогает. Это совпадает с поведением старой версии
 *             через `querySelector`.
 *
 *             Оба активных счётчика (в нав-баре и в меню) синхронизированы:
 *             один общий `currentAmount` и один таймер.
 *
 *             Если элемент скрыт на момент DOMContentLoaded (например,
 *             меню свёрнуто) — его Odometer создаётся позже, через
 *             ResizeObserver, когда элемент получает ширину, и
 *             синхронизируется с уже работающим счётчиком.
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

function bootAmountCounter() {
  // ---- Проверка зависимости ----
  if (typeof Odometer === "undefined") {
    console.warn("[Need Vision] amount-counter.js: Odometer не загружен");
    return;
  }

  // ---- Берём ПЕРВЫЙ матч каждого класса (не querySelectorAll) ----
  // Если в Webflow есть дубли с тем же классом — они остаются как
  // placeholder-вёрстка, скрипт их не трогает. Совпадает со старым
  // поведением через querySelector.
  const counterElements = [
    document.querySelector('.amount-counter'),
    document.querySelector('.menu_amount-counter')
  ].filter(el => el !== null);
  if (counterElements.length === 0) return;

  // ---- Константы ----
  const START_AMOUNT = 400800400;
  const INCREMENT = 15;
  const MIN_INTERVAL_MS = 15000;
  const MAX_INTERVAL_MS = 20000;

  // ---- Глобальное состояние (одно на всех) ----
  let currentAmount = START_AMOUNT;
  const odometers = [];

  // ---- CSS-фикс (один раз) ----
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

  // ---- Создаём Odometer на элементе и регистрируем его в общем пуле ----
  function attachOdometer(el) {
    const od = new Odometer({
      el: el,
      value: currentAmount,
      format: ' ddd',
      theme: 'minimal'
    });
    // Если основной таймер уже что-то накапал — догоняем
    if (currentAmount !== START_AMOUNT) {
      od.update(currentAmount);
    }
    odometers.push(od);
  }

  // ---- Запускаем Odometer на каждом элементе (с отложкой для скрытых) ----
  counterElements.forEach(el => {
    if (el.offsetWidth > 0) {
      attachOdometer(el);
      return;
    }
    // Элемент пока невидим (свёрнутое меню) — ждём ширину
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(entries => {
        if (entries[0].contentRect.width > 0) {
          ro.disconnect();
          attachOdometer(el);
        }
      });
      ro.observe(el);
    } else {
      attachOdometer(el);
    }
  });

  // ---- Один общий таймер для всех ----
  function tick() {
    currentAmount += INCREMENT;
    odometers.forEach(od => od.update(currentAmount));
    const next = Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1)) + MIN_INTERVAL_MS;
    setTimeout(tick, next);
  }

  const firstInterval = Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1)) + MIN_INTERVAL_MS;
  setTimeout(tick, firstInterval);
}

// ---- Универсальный запуск (работает в любом порядке загрузки скрипта) ----
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootAmountCounter);
} else {
  bootAmountCounter();
}
