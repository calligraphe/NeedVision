/**
 * NEED.VISION — Бесконечная смена логотипов в сетке
 * =================================================
 *
 * Что делает: на сетке из видимых лого случайным образом подменяет
 *             3–4 штуки одновременно на новые из скрытого «пула»,
 *             с плавным затуханием и появлением. Запускается в
 *             бесконечном цикле с интервалом 2–4 секунды.
 *
 * Зависимости:
 *   - GSAP 3.12.x (использует gsap.utils.shuffle / random / toArray)
 *
 * Webflow селекторы:
 *   - .logo-grid_img-visible       — видимые слоты с логотипами (на экране)
 *   - .logo-hidden-pool            — скрытый блок-пул с запасными лого
 *   - .logo-hidden-pool .logo-grid_img — отдельные `<img>` в пуле
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sections/logo-grid-swap.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] logo-grid-swap.js: GSAP не загружен");
    return;
  }

  // ---- Проверка наличия элементов ----
  const visibleSlots = document.querySelectorAll('.logo-grid_img-visible');
  const poolImages = document.querySelectorAll('.logo-hidden-pool .logo-grid_img');
  if (visibleSlots.length === 0 || poolImages.length === 0) return;

  // ---- Тайминги и константы ----
  const FADE_OUT_DURATION = 0.6;
  const FADE_IN_DURATION = 0.6;
  const MIN_SWAP_COUNT = 3;
  const MAX_SWAP_COUNT = 4;
  const MIN_INTERVAL_MS = 2000;
  const MAX_INTERVAL_MS = 4000;
  const FIRST_SWAP_DELAY_MS = 2000;

  const allLogosSrc = Array.from(poolImages).map(img => img.src);
  let currentVisibleSrc = Array.from(visibleSlots).map(img => img.src);

  function swapBatchLogos() {
    // 1. Ищем логотипы в пуле, которых СЕЙЧАС НЕТ на экране
    let availableLogos = allLogosSrc.filter(src => !currentVisibleSrc.includes(src));
    if (availableLogos.length === 0) return;

    // 2. Выбираем, сколько логотипов поменяем в этот раз (3–4)
    let swapCount = gsap.utils.random(MIN_SWAP_COUNT, MAX_SWAP_COUNT, 1);

    // Защита: если в пуле осталось меньше — берём сколько есть
    if (availableLogos.length < swapCount) swapCount = availableLogos.length;

    // 3. Перемешиваем доступные новые лого и берём первые N штук
    let shuffledNewLogos = gsap.utils.shuffle([...availableLogos]);
    let newLogosToUse = shuffledNewLogos.slice(0, swapCount);

    // 4. Выбираем N случайных ячеек для замены
    let slotIndices = Array.from({ length: visibleSlots.length }, (_, i) => i);
    let slotsToReplace = gsap.utils.shuffle(slotIndices).slice(0, swapCount);

    // 5. Запускаем анимацию для каждой выбранной ячейки
    slotsToReplace.forEach((slotIndex, i) => {
      let slotToChange = visibleSlots[slotIndex];
      let newLogoSrc = newLogosToUse[i];

      gsap.to(slotToChange, {
        opacity: 0,
        duration: FADE_OUT_DURATION,
        ease: "power1.inOut",
        onComplete: () => {
          // Подменяем картинку и убиваем srcset Webflow (иначе он перезапишет src)
          slotToChange.src = newLogoSrc;
          slotToChange.removeAttribute('srcset');
          slotToChange.removeAttribute('sizes');

          // Обновляем базу видимых картинок
          currentVisibleSrc[slotIndex] = newLogoSrc;

          // Плавно проявляем
          gsap.to(slotToChange, {
            opacity: 1,
            duration: FADE_IN_DURATION,
            ease: "power1.inOut"
          });
        }
      });
    });

    // 6. БЕСКОНЕЧНЫЙ ЦИКЛ
    const nextSwapTime = gsap.utils.random(MIN_INTERVAL_MS, MAX_INTERVAL_MS);
    setTimeout(swapBatchLogos, nextSwapTime);
  }

  // Первый запуск через FIRST_SWAP_DELAY_MS
  setTimeout(swapBatchLogos, FIRST_SWAP_DELAY_MS);
});
