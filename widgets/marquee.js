/**
 * NEED.VISION — Бесшовная бегущая строка
 * ======================================
 *
 * Что делает: дублирует содержимое маркизы (клонирует HTML) и крутит её
 *             влево на -50% с бесконечным повтором — петля визуально
 *             бесшовна. Удвоение в HTML + анимация до -50% = равномерное
 *             движение без видимых стыков.
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *
 * Webflow селекторы:
 *   - .marquee-wrapper       — обёртка с содержимым маркизы (дублируется)
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

  // ---- Проверка наличия маркизы ----
  const marquee = document.querySelector(".marquee-wrapper");
  if (!marquee) return;

  // ---- Тайминги ----
  // Длительность одного цикла: при удвоении контента 30s даёт ту же скорость,
  // что и 15s на неудвоенном — петля длиннее, но визуальный ритм тот же.
  const LOOP_DURATION = 30;

  // ---- Дублируем содержимое — клонируем HTML и добавляем в конец ----
  const originalContent = marquee.innerHTML;
  marquee.innerHTML = originalContent + originalContent;

  // ---- Анимируем на -50% (одна копия уехала, вторая на её месте — петля бесшовна) ----
  gsap.to(marquee, {
    xPercent: -50,
    repeat: -1,
    duration: LOOP_DURATION,
    ease: "none",
    force3D: true
  });
});
