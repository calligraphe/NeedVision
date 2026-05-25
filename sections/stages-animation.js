/**
 * Секция «Этапы». Три скролл-анимации:
 *  — на входе гаснет фонарик, фон about меняется на кремовый;
 *  — каждый .stages_img выезжает снизу с расфокусом + лёгкий settle scale;
 *  — смена текстов через mask reveal: текущий yPercent: 0 → -100 (уезжает
 *    вверх в маску .stages_title-mask / .stages_subtitle-mask /
 *    .stages_p-mask), новый 100 → 0 (приезжает снизу). Маски уже стоят
 *    в Webflow с overflow:hidden — анимация работает «из коробки».
 * Параллельно тикают точки .stages_dot-full/empty (с лёгким pop-scale
 * на активной) и лейбл «ЭТАП N» (тоже mask reveal — .stages_meta-row
 * имеет overflow:hidden).
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

  // Фон секции и фонарик при входе в .stages
  const bgChangeTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".stages",
      start: "top 85%",
      end: "top 25%",
      scrub: true
    }
  });

  bgChangeTl.to(".spotlight-overlay", {
    opacity: 0,
    duration: 0.3
  }, 0);

  bgChangeTl.to(".about-wrapper", {
    backgroundColor: "#FFFBF2",
    duration: 0.7
  }, 0.3);


  // .stages_img — выезжают снизу с расфокусом и settle scale
  const stageImages = gsap.utils.toArray(".stages_img");

  stageImages.forEach((img) => {
    img.style.willChange = "filter, transform, opacity";
    img.style.backfaceVisibility = "hidden";

    gsap.set(img, {
      y: 100,
      opacity: 0,
      scale: 1.06,
      filter: "blur(10px)"
    });

    gsap.to(img, {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      ease: "power3.out",
      scrollTrigger: {
        trigger: img,
        start: "top 90%",
        end: "top 45%",
        scrub: 2.5
      }
    });
  });


  // Mask reveal текстов. .stages_title-mask, .stages_subtitle-mask,
  // .stages_p-mask — все overflow:hidden. Двигаем внутренние элементы
  // через yPercent (относительно собственной высоты) — текст ровно
  // прячется за маской.
  const wrappers = gsap.utils.toArray(".stages_text-wrapper");
  const dotsFull = gsap.utils.toArray(".stages_dot-full");
  const dotsEmpty = gsap.utils.toArray(".stages_dot-empty");
  const stepLabel = document.querySelector(".stages_step-label");
  const stagesPagination = document.querySelector(".stages_pagination");

  if (wrappers.length === 0) return;

  // Webflow IX2 (data-w-id) сам управляет opacity на точках и pagination —
  // снимаем атрибут, иначе IX2 сбрасывает наш opacity после gsap.set.
  const pagDots = [...dotsFull, ...dotsEmpty];
  if (stagesPagination) pagDots.push(stagesPagination);
  pagDots.forEach(el => el.removeAttribute("data-w-id"));

  if (stagesPagination) gsap.set(stagesPagination, { opacity: 1 });

  // will-change на текстах. Без backface-visibility получаются artifacts
  // на ретине при transform.
  wrappers.forEach((wrap) => {
    const innerTexts = wrap.querySelectorAll(".stages_title, .stages_subtitle, .stages_p-text");
    innerTexts.forEach(el => {
      el.style.willChange = "transform";
      el.style.backfaceVisibility = "hidden";
    });
  });

  if (stepLabel) {
    stepLabel.style.willChange = "transform";
    stepLabel.style.backfaceVisibility = "hidden";
  }

  // Стартовое: первый wrapper виден полностью, остальные — за маской снизу
  wrappers.forEach((wrap, index) => {
    const innerTexts = wrap.querySelectorAll(".stages_title, .stages_subtitle, .stages_p-text");
    if (index === 0) {
      gsap.set(innerTexts, { yPercent: 0 });
      gsap.set(wrap, { autoAlpha: 1 });
    } else {
      gsap.set(innerTexts, { yPercent: 100 });
      gsap.set(wrap, { autoAlpha: 0 });
    }
  });

  if (stepLabel) gsap.set(stepLabel, { yPercent: 0 });

  // Стартовое для точек: первая активна (full=1, empty=0, scale=1),
  // остальные — наоборот, scale 0.85 для будущего pop при активации.
  if (dotsFull[0]) gsap.set(dotsFull[0], { opacity: 1, scale: 1, transformOrigin: "center center" });
  if (dotsFull.length > 1) gsap.set(dotsFull.slice(1), { opacity: 0, scale: 0.85, transformOrigin: "center center" });
  if (dotsEmpty[0]) gsap.set(dotsEmpty[0], { opacity: 0 });
  if (dotsEmpty.length > 1) gsap.set(dotsEmpty.slice(1), { opacity: 1 });

  const tlStages = gsap.timeline({
    scrollTrigger: {
      trigger: ".stages",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5
    }
  });

  // Дублируем стартовое внутри таймлайна — иначе scrub-рефреш
  // ре-инициализирует tween'ы и сбивает inline opacity/scale.
  if (dotsFull[0]) tlStages.set(dotsFull[0], { opacity: 1, scale: 1 }, 0);
  if (dotsFull.length > 1) tlStages.set(dotsFull.slice(1), { opacity: 0, scale: 0.85 }, 0);
  if (dotsEmpty[0]) tlStages.set(dotsEmpty[0], { opacity: 0 }, 0);
  if (dotsEmpty.length > 1) tlStages.set(dotsEmpty.slice(1), { opacity: 1 }, 0);

  wrappers.forEach((wrap, i) => {
    if (i >= wrappers.length - 1) return;

    const nextWrap = wrappers[i + 1];
    const currentTexts = wrap.querySelectorAll(".stages_title, .stages_subtitle, .stages_p-text");
    const nextTexts = nextWrap.querySelectorAll(".stages_title, .stages_subtitle, .stages_p-text");

    const stepName = `step_${i}`;

    tlStages.set(nextWrap, { autoAlpha: 1 }, stepName);

    // УХОД: текущий текст уезжает вверх внутри маски (yPercent:-100)
    // staggered — заголовок первым, текст по строкам следом
    tlStages.to(currentTexts, {
      yPercent: -100,
      duration: 1.0,
      stagger: 0.045,
      ease: "power3.inOut"
    }, stepName);

    // ПОЯВЛЕНИЕ: новый текст приезжает снизу. +=0.25 — лёгкое опережение
    // (новый стартует пока старый ещё не до конца уехал → переход плавный)
    tlStages.fromTo(nextTexts,
      { yPercent: 100 },
      {
        yPercent: 0,
        duration: 1.15,
        stagger: 0.055,
        ease: "power3.out"
      },
      `${stepName}+=0.25`);

    // Точки: текущая гаснет и shrink, следующая загорается и pop через back-ease
    tlStages.to(dotsFull[i], {
      opacity: 0,
      scale: 0.85,
      duration: 0.55,
      ease: "power2.inOut"
    }, stepName);
    if (dotsEmpty[i]) {
      tlStages.to(dotsEmpty[i], {
        opacity: 1,
        duration: 0.55,
        ease: "power2.inOut"
      }, stepName);
    }
    tlStages.to(dotsFull[i + 1], {
      opacity: 1,
      scale: 1,
      duration: 0.65,
      ease: "back.out(2)"
    }, stepName);
    if (dotsEmpty[i + 1]) {
      tlStages.to(dotsEmpty[i + 1], {
        opacity: 0,
        duration: 0.55,
        ease: "power2.inOut"
      }, stepName);
    }

    // Лейбл «ЭТАП N» — mask reveal через overflow:hidden на .stages_meta-row
    if (stepLabel) {
      tlStages.to(stepLabel, {
        yPercent: -100,
        duration: 0.4,
        ease: "power3.in"
      }, stepName);

      tlStages.set(stepLabel, {
        textContent: `ЭТАП ${i + 2}`,
        yPercent: 100
      }, `${stepName}+=0.4`);

      tlStages.to(stepLabel, {
        yPercent: 0,
        duration: 0.5,
        ease: "power3.out"
      }, `${stepName}+=0.4`);
    }

    tlStages.set(wrap, { autoAlpha: 0 });
    tlStages.to({}, { duration: 0.5 });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootStagesAnimation);
} else {
  bootStagesAnimation();
}
