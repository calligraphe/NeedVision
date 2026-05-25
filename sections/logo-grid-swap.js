/**
 * Сетка лого: каждые 2–4 сек подменяет 3–4 случайные плитки на новые
 * из скрытого пула. Цикл бесконечный.
 */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") {
    console.warn("logo-grid-swap.js: GSAP не загружен");
    return;
  }

  const visibleSlots = document.querySelectorAll('.logo-grid_img-visible');
  const poolImages = document.querySelectorAll('.logo-hidden-pool .logo-grid_img');
  if (visibleSlots.length === 0 || poolImages.length === 0) return;

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
    // Берём только те, которых сейчас нет на экране — не дублируем
    let availableLogos = allLogosSrc.filter(src => !currentVisibleSrc.includes(src));
    if (availableLogos.length === 0) return;

    let swapCount = gsap.utils.random(MIN_SWAP_COUNT, MAX_SWAP_COUNT, 1);
    if (availableLogos.length < swapCount) swapCount = availableLogos.length;

    let shuffledNewLogos = gsap.utils.shuffle([...availableLogos]);
    let newLogosToUse = shuffledNewLogos.slice(0, swapCount);

    let slotIndices = Array.from({ length: visibleSlots.length }, (_, i) => i);
    let slotsToReplace = gsap.utils.shuffle(slotIndices).slice(0, swapCount);

    slotsToReplace.forEach((slotIndex, i) => {
      let slotToChange = visibleSlots[slotIndex];
      let newLogoSrc = newLogosToUse[i];

      gsap.to(slotToChange, {
        opacity: 0,
        duration: FADE_OUT_DURATION,
        ease: "power1.inOut",
        onComplete: () => {
          // Сносим srcset/sizes — иначе Webflow перезапишет src
          slotToChange.src = newLogoSrc;
          slotToChange.removeAttribute('srcset');
          slotToChange.removeAttribute('sizes');

          currentVisibleSrc[slotIndex] = newLogoSrc;

          gsap.to(slotToChange, {
            opacity: 1,
            duration: FADE_IN_DURATION,
            ease: "power1.inOut"
          });
        }
      });
    });

    const nextSwapTime = gsap.utils.random(MIN_INTERVAL_MS, MAX_INTERVAL_MS);
    setTimeout(swapBatchLogos, nextSwapTime);
  }

  setTimeout(swapBatchLogos, FIRST_SWAP_DELAY_MS);
});
