/**
 * NEED.VISION — Бесшовные бегущие строки
 * ======================================
 *
 * Что делает: дублирует содержимое маркизы (клонирует HTML) и крутит её
 *             влево на -50% с бесконечным повтором — петля визуально
 *             бесшовна. Удвоение HTML + анимация до -50% = равномерное
 *             движение без видимых стыков.
 *
 *             Скрипт находит ВСЕ маркизы сразу:
 *               - `.marquee-wrapper`       — бегущая строка в нав-баре
 *               - `.menu_marquee-wrapper`  — бегущая строка в раскрывающемся
 *                                            меню (внутри `nav_marquee-btn`).
 *                                            Если их там две — каждая
 *                                            анимируется независимо.
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
  if (marquees.length === 0) return;

  // ---- Тайминги ----
  // Длительность одного цикла: при удвоении контента 30s даёт ту же скорость,
  // что и 15s на неудвоенном — петля длиннее, но визуальный ритм тот же.
  const LOOP_DURATION = 30;

  // ---- Каждую найденную маркизу дублируем и запускаем ----
  marquees.forEach(marquee => {
    const originalContent = marquee.innerHTML;
    marquee.innerHTML = originalContent + originalContent;

    gsap.to(marquee, {
      xPercent: -50,
      repeat: -1,
      duration: LOOP_DURATION,
      ease: "none",
      force3D: true
    });
  });
});
