/**
 * NEED.VISION — Город + часы по Батуми
 * ====================================
 *
 * Что делает:
 *   1. Жёстко ставит `.timer-place` = "BATUMI".
 *   2. Показывает текущее время в Батуми (часовой пояс Asia/Tbilisi,
 *      UTC+4 круглогодично, без перехода на летнее время) в формате
 *      "H:MM AM/PM" в `.timer-time`. Обновляется раз в минуту.
 *
 * Никаких геолокаций, IP-API и локального времени браузера — даже если
 * посетитель из Алматы, на сайте всегда будет «BATUMI» и батумское время.
 *
 * Зависимости:
 *   - нет (чистый JS, Intl.DateTimeFormat)
 *
 * Webflow селекторы:
 *   - .timer-place           — куда подставить название города
 *   - .timer-time            — куда подставить время
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/widgets/timer-place-clock.js"></script>
 */

function bootTimerPlaceClock() {
  const CITY = "BATUMI";
  const TIMEZONE = "Asia/Tbilisi";
  const TIME_UPDATE_MS = 60000;

  // ==========================================
  // 1. ГОРОД — статично, ВО ВСЕ копии .timer-place (нав + футер и т.д.)
  // ==========================================
  const placeElements = document.querySelectorAll(".timer-place");
  placeElements.forEach(el => { el.textContent = CITY; });

  // ==========================================
  // 2. ЧАСЫ — Asia/Tbilisi через Intl.DateTimeFormat, ВО ВСЕ .timer-time
  // ==========================================
  const timeElements = document.querySelectorAll(".timer-time");
  if (timeElements.length === 0) return;

  // Кэшируем форматтер — он тяжеловесный, не пересоздаём на каждый тик.
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });

  function updateTime() {
    // Intl выдаёт "4:45 PM" — приводим к нижнему регистру AM/PM ("4:45 pm"),
    // т.к. визуально это лучше совпадает с дизайном (мелкие подписи).
    const raw = formatter.format(new Date());
    const formatted = raw.replace(/AM$/i, "am").replace(/PM$/i, "pm");
    timeElements.forEach(el => { el.textContent = formatted; });
  }

  updateTime();
  setInterval(updateTime, TIME_UPDATE_MS);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootTimerPlaceClock);
} else {
  bootTimerPlaceClock();
}
