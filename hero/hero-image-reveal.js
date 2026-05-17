/**
 * NEED.VISION — Раскрытие hero-изображения при скролле
 * ====================================================
 *
 * Что делает: при скролле страницы плавно раздвигает hero-картинку из
 *             узкой полоски (`0.01vw`) до полной ширины (`45vw`). Привязка
 *             к скроллу через ScrollTrigger со scrub — анимация идёт точно
 *             за пальцем/колесом мыши.
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *   - ScrollTrigger
 *
 * Webflow селекторы:
 *   - .hero-image            — контейнер высотой ~1500px (триггер ScrollTrigger)
 *   - .hero__img             — сама картинка (меняет width)
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/hero/hero-image-reveal.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] hero-image-reveal.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("[Need Vision] hero-image-reveal.js: ScrollTrigger не загружен");
    return;
  }

  // ---- Проверка наличия элементов ----
  const heroImg = document.querySelector(".hero__img");
  const heroSection = document.querySelector(".hero-image");
  if (!heroImg || !heroSection) return;

  gsap.registerPlugin(ScrollTrigger);

  // ---- ПРЕДУСТАНОВКА: картинка изначально узкая полоска ----
  gsap.set(".hero__img", {
    width: "0.01vw",
    overflow: "hidden"
  });

  // ---- Анимация по скроллу ----
  gsap.to(".hero__img", {
    width: "45vw",     // финальная ширина
    ease: "none",      // "none" для scrub — анимация идёт ровно за скроллом
    scrollTrigger: {
      trigger: ".hero-image",
      start: "top top",
      end: "bottom bottom",
      scrub: 1           // мягкая доводка в 1 секунду
    }
  });
});
