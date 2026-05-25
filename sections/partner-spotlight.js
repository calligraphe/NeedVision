/**
 * «Фонарик» за курсором в секции .partner. Двигаем CSS-переменные
 * --mouse-x / --mouse-y на .spotlight-overlay (радиальный градиент в CSS).
 * GSAP с power3.out 1.8s — фонарик ленится за курсором, не дёргается.
 */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") {
    console.warn("partner-spotlight.js: GSAP не загружен");
    return;
  }

  const partnerSection = document.querySelector('.partner');
  const spotlightOverlay = document.querySelector('.spotlight-overlay');
  if (!partnerSection || !spotlightOverlay) return;

  const FOLLOW_DURATION = 1.8;

  partnerSection.addEventListener('mousemove', (e) => {
    const rect = partnerSection.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(spotlightOverlay, {
      "--mouse-x": `${x}px`,
      "--mouse-y": `${y}px`,
      duration: FOLLOW_DURATION,
      ease: "power3.out",
      overwrite: "auto"
    });
  });
});
