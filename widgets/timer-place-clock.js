/**
 * NEED.VISION — Гео-город + динамические часы
 * ===========================================
 *
 * Что делает:
 *   1. Определяет город посетителя через HTTPS-сервис ipwho.is и выводит
 *      его в `.timer-place` ВЕРХНИМ РЕГИСТРОМ. Запасной вариант — "ALMATY".
 *   2. Показывает текущее локальное время в `.timer-time` в 12-часовом
 *      формате (`H:MM AM/PM`) и обновляет каждую минуту.
 *
 * Зависимости:
 *   - нет (чистый JS, без GSAP)
 *   - сетевой API: https://ipwho.is/ (бесплатный, без ключа, HTTPS)
 *
 * Webflow селекторы:
 *   - .timer-place           — куда подставить название города
 *   - .timer-time            — куда подставить время
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/widgets/timer-place-clock.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Константы ----
  const GEO_API_URL = "https://ipwho.is/";
  const FALLBACK_CITY = "ALMATY";
  const TIME_UPDATE_MS = 60000;

  // ==========================================
  // 1. ОПРЕДЕЛЕНИЕ ТОЛЬКО ГОРОДА
  // ==========================================
  const placeElement = document.querySelector('.timer-place');

  if (placeElement) {
    fetch(GEO_API_URL)
      .then(response => response.json())
      .then(data => {
        // ipwho.is возвращает { success: true, city: "...", ... } при удаче
        if (data.success && data.city) {
          placeElement.textContent = data.city.toUpperCase();
        } else {
          placeElement.textContent = FALLBACK_CITY;
        }
      })
      .catch(() => {
        placeElement.textContent = FALLBACK_CITY;
      });
  }

  // ==========================================
  // 2. ДИНАМИЧЕСКИЕ ЧАСЫ (12-часовой формат)
  // ==========================================
  const timeElement = document.querySelector('.timer-time');

  function updateTime() {
    if (!timeElement) return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Переводим в 12-часовой формат
    hours = hours % 12;
    hours = hours ? hours : 12; // если 0 часов, ставим 12

    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    timeElement.textContent = `${hours}:${minutesStr} ${ampm}`;
  }

  updateTime();
  setInterval(updateTime, TIME_UPDATE_MS);
});
