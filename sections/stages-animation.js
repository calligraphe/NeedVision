/**
 * Секция «Этапы»: три скролл-анимации.
 *  — на входе гаснет фонарик, фон about меняется на кремовый;
 *  — каждый .stages_img выезжает снизу с расфокусом (blur 12 → 0);
 *  — барабанная смена текстов через «белое свечение» (text-shadow,
 *    а не blur — на ретине blur даёт квадрат вокруг текста).
 * Параллельно тикают точки .stages_dot-full/empty и лейбл «ЭТАП N».
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


  // .stages_img — выезжают снизу с расфокусом
  const stageImages = gsap.utils.toArray(".stages_img");

  stageImages.forEach((img) => {
    img.style.willChange = "filter, transform, opacity";
    img.style.backfaceVisibility = "hidden";

    gsap.set(img, {
      y: 100,
      opacity: 0,
      filter: "blur(12px)"
    });

    gsap.to(img, {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      ease: "power2.out",
      scrollTrigger: {
        trigger: img,
        start: "top 90%",
        end: "top 45%",
        scrub: 2.5
      }
    });
  });


  // Барабанная смена текстов. Свечение через text-shadow вместо blur —
  // на ретине blur даёт «квадрат» вокруг текста, shadow чистый.
  const wrappers = gsap.utils.toArray(".stages_text-wrapper");
  const dotsFull = gsap.utils.toArray(".stages_dot-full");
  const dotsEmpty = gsap.utils.toArray(".stages_dot-empty");
  const stepLabel = document.querySelector(".stages_step-label");

  // Состояния «тумана» — белое свечение через text-shadow.
  // Несколько слоёв создают мягкое рассеянное свечение.
  const GLOW = "0 0 12px rgba(255,251,242,1), 0 0 24px rgba(255,251,242,0.9), 0 0 40px rgba(255,251,242,0.7)";
  const GLOW_SMALL = "0 0 6px rgba(255,251,242,1), 0 0 12px rgba(255,251,242,0.8)";
  const NO_GLOW = "0 0 0px rgba(255,251,242,0)";

  if (wrappers.length > 0) {
    wrappers.forEach((wrap) => {
      const innerTexts = wrap.querySelectorAll(".stages_title, .stages_subtitle, .stages_p-text");
      innerTexts.forEach(el => {
        el.style.willChange = "text-shadow, transform, opacity";
        el.style.backfaceVisibility = "hidden";
      });
    });

    if (stepLabel) {
      stepLabel.style.willChange = "text-shadow, transform, opacity";
      stepLabel.style.backfaceVisibility = "hidden";
    }

    wrappers.forEach((wrap, index) => {
      const innerTexts = wrap.querySelectorAll(".stages_title, .stages_subtitle, .stages_p-text");

      if (index !== 0) {
        gsap.set(innerTexts, {
          y: 40,
          opacity: 0,
          textShadow: GLOW              // белое свечение в скрытом состоянии
        });
        gsap.set(wrap, { autoAlpha: 0 });
      } else {
        gsap.set(innerTexts, {
          y: 0,
          opacity: 1,
          textShadow: NO_GLOW
        });
        gsap.set(wrap, { autoAlpha: 1 });
      }
    });

    const stagesPagination = document.querySelector(".stages_pagination");

    // На точках висит Webflow IX2 (On-Page-Load), который сбрасывает
    // opacity после нашего gsap.set. Снимаем data-w-id — IX2 их больше
    // не видит, opacity полностью наш.
    const pagDots = [...dotsFull, ...dotsEmpty];
    if (stagesPagination) pagDots.push(stagesPagination);
    pagDots.forEach(el => el.removeAttribute("data-w-id"));

    if (stagesPagination) {
      gsap.set(stagesPagination, { opacity: 1 });
    }
    // Активная (0): full=1, empty=0. Остальные наоборот.
    if (dotsFull[0]) gsap.set(dotsFull[0], { opacity: 1 });
    if (dotsFull.length > 1) gsap.set(dotsFull.slice(1), { opacity: 0 });
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
    // ре-инициализирует tween'ы и сбивает inline opacity.
    if (dotsFull[0]) tlStages.set(dotsFull[0], { opacity: 1 }, 0);
    if (dotsFull.length > 1) tlStages.set(dotsFull.slice(1), { opacity: 0 }, 0);
    if (dotsEmpty[0]) tlStages.set(dotsEmpty[0], { opacity: 0 }, 0);
    if (dotsEmpty.length > 1) tlStages.set(dotsEmpty.slice(1), { opacity: 1 }, 0);

    wrappers.forEach((wrap, i) => {
      if (i < wrappers.length - 1) {
        const nextWrap = wrappers[i + 1];

        const currentTexts = wrap.querySelectorAll(".stages_title, .stages_subtitle, .stages_p-text");
        const nextTexts = nextWrap.querySelectorAll(".stages_title, .stages_subtitle, .stages_p-text");

        const stepLabelName = `step_${i}`;

        tlStages.set(nextWrap, { autoAlpha: 1 }, stepLabelName);

        // УХОД ТЕКУЩИХ: растворяются в белом свечении
        tlStages.to(currentTexts, {
          y: -40,
          opacity: 0,
          textShadow: GLOW,
          duration: 1.2,
          stagger: 0.06,
          ease: "power2.inOut"
        }, stepLabelName);

        // ПОЯВЛЕНИЕ НОВЫХ: из белого свечения в фокус
        tlStages.fromTo(nextTexts,
          {
            y: 40,
            opacity: 0,
            textShadow: GLOW
          },
          {
            y: 0,
            opacity: 1,
            textShadow: NO_GLOW,
            duration: 1.2,
            stagger: 0.06,
            ease: "power2.inOut"
          }, stepLabelName);

        // Прошлая точка: full гаснет, empty проявляется.
        tlStages.to(dotsFull[i], { opacity: 0, duration: 1, ease: "power2.inOut" }, stepLabelName);
        if (dotsEmpty[i]) {
          tlStages.to(dotsEmpty[i], { opacity: 1, duration: 1, ease: "power2.inOut" }, stepLabelName);
        }
        // Новая точка: full проявляется, empty гаснет.
        tlStages.to(dotsFull[i + 1], { opacity: 1, duration: 1, ease: "power2.inOut" }, stepLabelName);
        if (dotsEmpty[i + 1]) {
          tlStages.to(dotsEmpty[i + 1], { opacity: 0, duration: 1, ease: "power2.inOut" }, stepLabelName);
        }

        // ЛЕЙБЛ «ЭТАП N» — более лёгкое свечение для мелкого текста
        tlStages.to(stepLabel, {
          y: -15,
          opacity: 0,
          textShadow: GLOW_SMALL,
          duration: 0.5,
          ease: "power2.in"
        }, stepLabelName);

        tlStages.set(stepLabel, {
          textContent: `ЭТАП ${i + 2}`,
          y: 15,
          textShadow: GLOW_SMALL
        }, `${stepLabelName}+=0.5`);

        tlStages.to(stepLabel, {
          y: 0,
          opacity: 1,
          textShadow: NO_GLOW,
          duration: 0.5,
          ease: "power2.out"
        }, `${stepLabelName}+=0.5`);

        tlStages.set(wrap, { autoAlpha: 0 });
        tlStages.to({}, { duration: 0.5 });
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootStagesAnimation);
} else {
  bootStagesAnimation();
}
