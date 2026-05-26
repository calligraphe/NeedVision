/**
 * Секция «Этапы». Hybrid:
 *  — фон секции, картинки и parallax по-прежнему scrub (плавно по скроллу);
 *  — смена этапов (барабан слов + лейбл) — autoplay через
 *    state-machine. Раньше при медленном скролле scrub-таймлайн
 *    «застревал» в середине барабана и показывал грязные
 *    промежуточные кадры (полупрозрачные слова с тёмным blur).
 *    Теперь каждое пересечение границы этапа триггерит автоплей
 *    в нужную сторону, без половинчатых состояний.
 *
 *  — blur убран из текстовой анимации (давал тёмный halo на
 *    кремовом фоне). Барабан = yPercent + opacity, чисто.
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


  // ---- Тексты, пагинация, лейбл ----
  const wrappers = gsap.utils.toArray(".stages_text-wrapper");
  const dots = gsap.utils.toArray(".stages_dot");
  const stepLabel = document.querySelector(".stages_step-label");
  const stagesPagination = document.querySelector(".stages_pagination");

  if (wrappers.length === 0) return;


  // ---- Пагинация (прямой opacity с !important — IX2-proof) ----
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

  function setActiveDot(index) {
    dotInners.forEach(({ full, empty }, i) => {
      const isActive = i === index;
      if (full)  full.style.setProperty("opacity", isActive ? "1" : "0", "important");
      if (empty) empty.style.setProperty("opacity", isActive ? "0" : "1", "important");
    });
  }


  // ---- Word split ----
  function splitToWords(el) {
    if (el.dataset.splitDone === "1") return;
    const text = el.textContent;
    if (!text || !text.trim()) return;

    if (el.children.length > 0 && el.children.length !== el.querySelectorAll("br").length) {
      return;
    }

    const words = text.trim().split(/\s+/);
    el.innerHTML = words
      .map(w => `<span class="stages_word" style="display:inline-block;will-change:transform,opacity">${w}</span>`)
      .join(" ");
    el.dataset.splitDone = "1";
  }

  wrappers.forEach((wrap) => {
    wrap.querySelectorAll(".stages_title, .stages_subtitle, .stages_p-text")
      .forEach(splitToWords);
  });

  if (stepLabel) {
    stepLabel.style.willChange = "transform, opacity";
    stepLabel.style.backfaceVisibility = "hidden";
  }


  // ---- Стартовое состояние ----
  wrappers.forEach((wrap, index) => {
    const words = wrap.querySelectorAll(".stages_word");
    if (index === 0) {
      gsap.set(words, { yPercent: 0, opacity: 1 });
      gsap.set(wrap, { autoAlpha: 1 });
    } else {
      gsap.set(words, { yPercent: 100, opacity: 0 });
      gsap.set(wrap, { autoAlpha: 0 });
    }
  });

  if (stepLabel) gsap.set(stepLabel, { yPercent: 0, opacity: 1 });

  setActiveDot(0);


  // ---- State-machine: автоплей перехода между этапами ----
  // currentStep — индекс видимого этапа. transitionTo вызывается
  // из onUpdate когда scroll-progress пересекает границу.
  // Direction (forward / back) определяет в какую сторону уезжают
  // слова (вверх или вниз).
  //
  // Длительности подобраны под ощущение «такой же скорости» как
  // у прежнего scrub:2.2 — exit ~0.55s, entry ~0.7s с лёгким overlap.
  let currentStep = 0;
  let activeTween = null;

  function transitionTo(target) {
    if (target === currentStep) return;
    if (target < 0 || target >= wrappers.length) return;

    const direction = target > currentStep ? 1 : -1;
    const fromIdx = currentStep;
    currentStep = target;
    setActiveDot(target);

    const fromWrap = wrappers[fromIdx];
    const toWrap = wrappers[target];
    const fromWords = fromWrap.querySelectorAll(".stages_word");
    const toWords = toWrap.querySelectorAll(".stages_word");

    const exitY = direction > 0 ? -100 : 100;
    const entryY = direction > 0 ? 100 : -100;

    if (activeTween) activeTween.kill();

    const tl = gsap.timeline({
      onComplete: () => { activeTween = null; }
    });
    activeTween = tl;

    tl.set(toWrap, { autoAlpha: 1 }, 0);

    // Текущие слова уходят
    tl.to(fromWords, {
      yPercent: exitY,
      opacity: 0,
      duration: 0.55,
      stagger: { each: 0.014, from: "start" },
      ease: "power2.in",
      overwrite: "auto"
    }, 0);

    // Новые слова приезжают (со стороны direction)
    tl.fromTo(toWords,
      { yPercent: entryY, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.7,
        stagger: { each: 0.016, from: "start" },
        ease: "power2.out",
        overwrite: "auto"
      },
      0.2
    );

    // Лейбл «ЭТАП N»: барабаном меняет цифру
    if (stepLabel) {
      tl.to(stepLabel, {
        yPercent: exitY,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        overwrite: "auto"
      }, 0);

      tl.call(() => {
        stepLabel.textContent = `ЭТАП ${target + 1}`;
      }, [], 0.3);

      tl.fromTo(stepLabel,
        { yPercent: entryY, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto"
        },
        0.3
      );
    }

    // Старый wrapper в конце скрываем
    tl.set(fromWrap, { autoAlpha: 0 });
  }


  // ---- ScrollTrigger: один монитор, маппит progress → step idx ----
  // Границы между этапами равномерно разбивают scroll-диапазон секции
  // (от "top top" до "bottom bottom"). При пересечении границы вверх
  // или вниз — autoplay-таймлайн в нужном направлении.
  ScrollTrigger.create({
    trigger: ".stages",
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      const idx = Math.min(
        Math.floor(self.progress * wrappers.length),
        wrappers.length - 1
      );
      transitionTo(idx);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootStagesAnimation);
} else {
  bootStagesAnimation();
}
