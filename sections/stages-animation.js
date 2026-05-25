/**
 * Секция «Этапы». Три скролл-анимации:
 *  — на входе гаснет фонарик, фон about меняется на кремовый;
 *  — каждый .stages_img выезжает снизу с расфокусом + лёгкий settle scale;
 *  — смена текстов через mask reveal: текущий yPercent: 0 → -100 (уезжает
 *    вверх в маску .stages_title-mask / .stages_subtitle-mask /
 *    .stages_p-mask), новый 100 → 0 (приезжает снизу). Маски уже стоят
 *    в Webflow с overflow:hidden.
 * Пагинация — НЕ в scrub-таймлайне (там она пропадала на быстром скролле
 * и конфликтовала с IX2). Отдельный ScrollTrigger.onUpdate переключает
 * активную точку через прямой opacity 0/1 на .stages_dot-full/empty —
 * та же схема что в cases-slider.js.
 * Лейбл «ЭТАП N» тоже mask reveal — .stages_meta-row имеет overflow:hidden.
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


  // ---- Тексты + пагинация + лейбл ----
  const wrappers = gsap.utils.toArray(".stages_text-wrapper");
  const dots = gsap.utils.toArray(".stages_dot");
  const stepLabel = document.querySelector(".stages_step-label");
  const stagesPagination = document.querySelector(".stages_pagination");

  if (wrappers.length === 0) return;

  // ---- Пагинация: setActiveDot + ScrollTrigger ----
  // На каждом .stages_dot снимаем data-w-id (и на pagination, и на
  // самих img dot-empty/dot-full). Иначе Webflow IX2 переписывает
  // opacity после нашего set'а.
  const dotInners = [];
  dots.forEach((dot) => {
    dot.removeAttribute("data-w-id");
    const full = dot.querySelector(".stages_dot-full");
    const empty = dot.querySelector(".stages_dot-empty");
    if (full) full.removeAttribute("data-w-id");
    if (empty) empty.removeAttribute("data-w-id");
    dotInners.push({ full, empty });
  });
  if (stagesPagination) {
    stagesPagination.removeAttribute("data-w-id");
    stagesPagination.style.setProperty("opacity", "1", "important");
  }

  // setProperty с !important — единственный надёжный способ перебить
  // inline-стили которые IX2 может поставить позже.
  function setActiveDot(index) {
    dotInners.forEach(({ full, empty }, i) => {
      const isActive = i === index;
      if (full)  full.style.setProperty("opacity", isActive ? "1" : "0", "important");
      if (empty) empty.style.setProperty("opacity", isActive ? "0" : "1", "important");
    });
  }

  // Стартовое состояние — активна первая точка
  setActiveDot(0);

  // Отдельный ScrollTrigger переключает активную точку по scroll-прогрессу.
  // Не в scrub-таймлайне — там tween'ы скипались на быстром скролле и
  // конфликтовали с IX2.
  let lastDotIndex = 0;
  ScrollTrigger.create({
    trigger: ".stages",
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      const idx = Math.min(
        Math.floor(self.progress * wrappers.length),
        wrappers.length - 1
      );
      if (idx !== lastDotIndex) {
        lastDotIndex = idx;
        setActiveDot(idx);
      }
    },
    onRefresh: () => setActiveDot(lastDotIndex)
  });


  // ---- Mask reveal текстов ----
  // .stages_title-mask, .stages_subtitle-mask, .stages_p-mask — все
  // overflow:hidden. Двигаем внутренние элементы через yPercent
  // (относительно собственной высоты) — текст ровно прячется за маской.
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

  // Стартовое: первый wrapper виден, остальные — за маской снизу
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

  const tlStages = gsap.timeline({
    scrollTrigger: {
      trigger: ".stages",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5
    }
  });

  wrappers.forEach((wrap, i) => {
    if (i >= wrappers.length - 1) return;

    const nextWrap = wrappers[i + 1];
    const currentTexts = wrap.querySelectorAll(".stages_title, .stages_subtitle, .stages_p-text");
    const nextTexts = nextWrap.querySelectorAll(".stages_title, .stages_subtitle, .stages_p-text");

    const stepName = `step_${i}`;

    tlStages.set(nextWrap, { autoAlpha: 1 }, stepName);

    // Уход: текущий текст уезжает вверх внутри маски
    tlStages.to(currentTexts, {
      yPercent: -100,
      duration: 1.0,
      stagger: 0.045,
      ease: "power3.inOut"
    }, stepName);

    // Появление: новый текст приезжает снизу. +=0.25 — лёгкое опережение,
    // переход не получает зазора между уходом и появлением
    tlStages.fromTo(nextTexts,
      { yPercent: 100 },
      {
        yPercent: 0,
        duration: 1.15,
        stagger: 0.055,
        ease: "power3.out"
      },
      `${stepName}+=0.25`);

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
