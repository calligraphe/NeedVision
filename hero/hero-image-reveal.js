/**
 * Hero-картинка раздвигается из узкой полоски на всю ширину при скролле.
 * scrub привязывает анимацию к колесу/пальцу — без своего ease.
 */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") {
    console.warn("hero-image-reveal.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("hero-image-reveal.js: ScrollTrigger не загружен");
    return;
  }

  const heroImg = document.querySelector(".hero__img");
  const heroSection = document.querySelector(".hero-image");
  if (!heroImg || !heroSection) return;

  gsap.registerPlugin(ScrollTrigger);

  // Стартовое: тонкая полоска
  gsap.set(".hero__img", {
    width: "0.01vw",
    overflow: "hidden"
  });

  gsap.to(".hero__img", {
    width: "40vw",
    ease: "none",          // под scrub — иначе будет «дёргать» к концу
    scrollTrigger: {
      trigger: ".hero-image",
      start: "top top",
      end: "bottom bottom",
      scrub: 1
    }
  });
});
