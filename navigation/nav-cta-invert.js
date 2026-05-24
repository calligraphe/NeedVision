/**
 * Тема плавающей CTA-кнопки (.nav-cta__btn) по секциям:
 *   dark > orange > white (приоритет)
 *
 * Каждый ScrollTrigger только дёргает флаг — applyTheme() через rAF
 * вычисляет активную тему и применяет одним tween'ом. Так не дерутся
 * параллельные tween'ы за один и тот же color/bg.
 *
 * В футере кнопка независимо уезжает вниз и гаснет.
 */

function bootNavCtaInvert() {
  if (typeof gsap === "undefined") {
    console.warn("nav-cta-invert.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("nav-cta-invert.js: ScrollTrigger не загружен");
    return;
  }

  const ctaBtn = document.querySelector(".nav-cta__btn");
  if (!ctaBtn) return;

  gsap.registerPlugin(ScrollTrigger);

  const THEMES = {
    white:  { bg: "#ffffff", text: "#000000" },
    orange: { bg: "#FF6038", text: "#ffffff" },
    dark:   { bg: "#040101", text: "#ffffff" }
  };

  // Синхронизируем стартовое с CSS, чтобы GSAP знал from-value
  gsap.set(".nav-cta__btn", {
    backgroundColor: THEMES.white.bg,
    color: THEMES.white.text
  });

  // Set для orange — на случай перекрывающихся секций.
  // Bool для stages — она одна.
  const activeOrange = new Set();
  let isOverStages = false;
  let currentTheme = "white";

  function applyTheme() {
    const next = isOverStages
      ? "dark"
      : (activeOrange.size > 0 ? "orange" : "white");

    if (next === currentTheme) return;
    currentTheme = next;

    const t = THEMES[next];
    // Один tween. color наследуется детьми через CSS, без * селектора.
    gsap.to(".nav-cta__btn", {
      backgroundColor: t.bg,
      color: t.text,
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto"
    });
  }

  // rAF-дебаунс: близкие onToggle (выход из orange + вход в stages)
  // схлопываются в один applyTheme.
  let pending = false;
  function scheduleApply() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      applyTheme();
    });
  }

  const orangeSections = gsap.utils.toArray(".is-orange-nav");
  orangeSections.forEach(section => {
    ScrollTrigger.create({
      trigger: section,
      start: "top 80px",
      end: "bottom 80px",
      onToggle: (self) => {
        if (self.isActive) activeOrange.add(section);
        else activeOrange.delete(section);
        scheduleApply();
      }
    });
  });

  const stagesSection = document.querySelector(".stages");
  if (stagesSection) {
    ScrollTrigger.create({
      trigger: stagesSection,
      start: "top 75%",
      end: "bottom 25%",
      onToggle: (self) => {
        isOverStages = self.isActive;
        scheduleApply();
      }
    });
  }

  // В футере — уезжаем вниз. Независимо от темы, только y/opacity.
  const footerEl = document.querySelector(".footer") || document.querySelector("footer");
  if (footerEl) {
    gsap.to(".nav-cta__btn", {
      y: 150,
      opacity: 0,
      pointerEvents: "none",
      ease: "none",
      immediateRender: false,
      scrollTrigger: {
        trigger: footerEl,
        start: "top 95%",
        end: "top 75%",
        scrub: true
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootNavCtaInvert);
} else {
  bootNavCtaInvert();
}
