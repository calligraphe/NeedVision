/**
 * Секция «Этапы» — переписана под новую вёрстку.
 *
 * Старая разметка: один общий .stages_text-wrapper + единый
 * step-label + пагинация, всё менялось через JS (textContent,
 * dot opacity).
 *
 * Новая разметка: 2× .stages_content-column, в каждой sticky-
 * wrapper .stages_content-wrapper с уже готовым меню (свой
 * step-label «этап N», своя pagination с активной точкой).
 * Wrapper'ы стартуют opacity:0 (CSS), .active = opacity 1.
 *
 * Логика анимации:
 *  — wrapper 1 active при входе в секцию;
 *  — при пересечении границы колонок: текущий wrapper выезжает
 *    барабаном (title-mask, subtitle-mask, p-mask — они уже
 *    overflow:hidden в CSS), новый wrapper въезжает с противо-
 *    положной стороны;
 *  — пагинацию/лейбл больше НЕ трогаем (в HTML уже готовые).
 */

function bootStagesAnimation() {
  if (typeof gsap === "undefined") {
    console.warn("stages-animation.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("stages-animation.js: ScrollTrigger не загружен");
    return;
  }

  const stagesSection = document.querySelector(".stages");
  if (!stagesSection) return;

  gsap.registerPlugin(ScrollTrigger);


  // ---- Фон секции + фонарик на входе (scrub) ----
  const bgChangeTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".stages",
      start: "top 85%",
      end: "top 25%",
      scrub: true
    }
  });

  bgChangeTl.to(".spotlight-overlay", { opacity: 0, duration: 0.3 }, 0);
  bgChangeTl.to(".about-wrapper", { backgroundColor: "#FFFBF2", duration: 0.7 }, 0.3);


  // ---- Картинки: reveal + intra-section parallax (scrub) ----
  const stageImages = gsap.utils.toArray(".stages_img");

  stageImages.forEach((img, idx) => {
    img.style.willChange = "filter, transform, opacity";
    img.style.backfaceVisibility = "hidden";

    gsap.set(img, {
      y: "8.33vw",
      opacity: 0,
      scale: 1.08,
      filter: "blur(12px)"
    });

    gsap.to(img, {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      ease: "power3.out",
      scrollTrigger: {
        trigger: img,
        start: "top 92%",
        end: "top 40%",
        scrub: 2.5
      }
    });

    const parallaxOffset = idx % 2 === 0 ? -60 : 60;
    gsap.to(img, {
      yPercent: parallaxOffset / 10,
      ease: "none",
      scrollTrigger: {
        trigger: img,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.5
      }
    });
  });


  // ---- Wrapper'ы и их текстовые части ----
  const wrappers = gsap.utils.toArray(".stages_content-wrapper");
  const columns = gsap.utils.toArray(".stages_content-column");
  if (wrappers.length === 0) return;

  // Берём ВСЕ элементы внутри masks — каждая строка (.stages_title,
  // .stages_subtitle, .stages_p-text) уже сидит в своей overflow:hidden
  // обёртке. Анимируем yPercent + opacity.
  function getTextParts(wrap) {
    return gsap.utils.toArray(wrap.querySelectorAll(
      ".stages_title-mask > .stages_title, " +
      ".stages_subtitle-mask > .stages_subtitle, " +
      ".stages_p-mask > .stages_p-text"
    ));
  }

  const wrapperTexts = wrappers.map(getTextParts);


  // Webflow IX2 биндит data-w-id и может перезаписывать opacity —
  // стрипаем по всему дереву wrappers'ов.
  wrappers.forEach(wrap => {
    wrap.removeAttribute("data-w-id");
    wrap.querySelectorAll("[data-w-id]").forEach(el => el.removeAttribute("data-w-id"));
  });


  // ---- Стартовое состояние ----
  // wrapper[0] активен (opacity 1, текст на местах);
  // остальные скрыты, их текст на стартовой позиции снизу.
  wrappers.forEach((wrap, i) => {
    if (i === 0) {
      gsap.set(wrap, { autoAlpha: 1 });
      gsap.set(wrapperTexts[i], { yPercent: 0, opacity: 1 });
      wrap.classList.add("active");
    } else {
      gsap.set(wrap, { autoAlpha: 0 });
      gsap.set(wrapperTexts[i], { yPercent: 100, opacity: 0 });
      wrap.classList.remove("active");
    }
  });


  // ---- State-machine ----
  let currentStep = 0;
  let activeTween = null;

  function transitionTo(target) {
    if (target === currentStep) return;
    if (target < 0 || target >= wrappers.length) return;

    const direction = target > currentStep ? 1 : -1;
    const fromIdx = currentStep;
    currentStep = target;

    if (activeTween) activeTween.kill();

    // Очистка orphan-wrappers: при быстром скролле через несколько
    // границ прошлый transitionTo мог не успеть скрыть свой fromWrap.
    wrappers.forEach((wrap, i) => {
      if (i === fromIdx || i === target) return;
      gsap.set(wrap, { autoAlpha: 0 });
      wrap.classList.remove("active");
    });

    const fromWrap = wrappers[fromIdx];
    const toWrap = wrappers[target];
    const fromText = wrapperTexts[fromIdx];
    const toText = wrapperTexts[target];

    const exitY = direction > 0 ? -100 : 100;
    const entryY = direction > 0 ? 100 : -100;

    const tl = gsap.timeline({
      onComplete: () => { activeTween = null; }
    });
    activeTween = tl;

    tl.set(toWrap, { autoAlpha: 1 }, 0);
    toWrap.classList.add("active");
    fromWrap.classList.remove("active");

    // Текущие строки уходят
    tl.to(fromText, {
      yPercent: exitY,
      opacity: 0,
      duration: 0.55,
      stagger: { each: 0.04, from: "start" },
      ease: "power2.in",
      overwrite: "auto"
    }, 0);

    // Новые строки приезжают
    tl.fromTo(toText,
      { yPercent: entryY, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.7,
        stagger: { each: 0.045, from: "start" },
        ease: "power2.out",
        overwrite: "auto"
      },
      0.2
    );

    // Старый wrapper в конце скрываем
    tl.set(fromWrap, { autoAlpha: 0 });
  }


  // ---- ScrollTriggers по колонкам ----
  // Каждая колонка кроме первой получает свой триггер: когда её верх
  // приходит к viewport center — это «момент сцепки» с предыдущим
  // sticky-wrapper'ом, на котором делаем drum-переход.
  columns.forEach((col, i) => {
    if (i === 0) return;
    ScrollTrigger.create({
      trigger: col,
      start: "top center",
      onEnter: () => transitionTo(i),
      onLeaveBack: () => transitionTo(i - 1)
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootStagesAnimation);
} else {
  bootStagesAnimation();
}
