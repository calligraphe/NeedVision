/**
 * Manifesto: строки каскадом поднимаются из размытия (blur 20 → 0).
 * Привязка к скроллу через .manifesto со scrub.
 */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") {
    console.warn("manifesto-text-reveal.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("manifesto-text-reveal.js: ScrollTrigger не загружен");
    return;
  }

  const manifesto = document.querySelector(".manifesto");
  const texts = document.querySelectorAll(".man-anim__txt");
  if (!manifesto || texts.length === 0) return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.set(".man-anim__txt", {
    y: 30,
    opacity: 0,
    filter: "blur(20px)"
  });

  gsap.to(".man-anim__txt", {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    duration: 1,
    stagger: 0.2,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".manifesto",
      start: "top center",
      end: "+=600",
      scrub: 1
    }
  });
});
