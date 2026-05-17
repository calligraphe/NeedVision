/**
 * NEED.VISION — Раскрытие текстов manifesto
 * =========================================
 *
 * Что делает: при скролле строки манифеста каскадом поднимаются снизу,
 *             проявляются и расфокусируются (blur 20px → 0). Эффект
 *             «текст из тумана». Привязка к скроллу через ScrollTrigger
 *             на родительский блок `.manifesto`.
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *   - ScrollTrigger
 *
 * Webflow селекторы:
 *   - .manifesto             — родительский блок (~1400px высотой, триггер)
 *   - .man-anim__txt         — строки текста, которые раскрываются
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/manifesto/manifesto-text-reveal.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] manifesto-text-reveal.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("[Need Vision] manifesto-text-reveal.js: ScrollTrigger не загружен");
    return;
  }

  // ---- Проверка наличия элементов ----
  const manifesto = document.querySelector(".manifesto");
  const texts = document.querySelectorAll(".man-anim__txt");
  if (!manifesto || texts.length === 0) return;

  gsap.registerPlugin(ScrollTrigger);

  // ---- ПРЕДУСТАНОВКА: тексты опущены, прозрачные, размытые ----
  gsap.set(".man-anim__txt", {
    y: 30,
    opacity: 0,
    filter: "blur(20px)"
  });

  // ---- Анимация по скроллу ----
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
