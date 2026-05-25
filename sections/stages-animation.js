/**
 * Секция «Этапы». Hybrid: визуал секции привязан к скроллу,
 * смена этапов — автоплеем.
 *
 * SCROLL-DRIVEN (scrub):
 *  — фон about + фонарик при входе в секцию;
 *  — картинки .stages_img: reveal + intra-section parallax.
 *
 * AUTOPLAY (по достижению scroll-порога — играется тайм-лайн целиком):
 *  — смена текстов через word-split + stagger + blur;
 *  — смена лейбла «ЭТАП N»;
 *  — переключение активной точки пагинации.
 *
 * Зачем автоплей: при scrub текст «дёргался» вслед за колесом и
 * выглядел suetlivo. Автоплей даёт уверенный, всегда одинаковый
 * переход за фикс. duration.
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
      y: 120,
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

    // Parallax: чётные/нечётные на разной скорости — многоплановое движение
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

  setActiveDot(0);


  // ---- Word split ----
  // Каждый текст-блок разбиваем на <span class="stages_word">
  // с display:inline-block. Слова станут независимыми единицами
  // для stagger-анимации.
  function splitToWords(el) {
    if (el.dataset.splitDone === "1") return;
    const text = el.textContent;
    if (!text || !text.trim()) return;

    if (el.children.length > 0 && el.children.length !== el.querySelectorAll("br").length) {
      return;        // нетривиальный HTML — не трогаем
    }

    const words = text.trim().split(/\s+/);
    el.innerHTML = words
      .map(w => `<span class="stages_word" style="display:inline-block;will-change:transform,filter,opacity">${w}</span>`)
      .join(" ");
    el.dataset.splitDone = "1";
  }

  wrappers.forEach((wrap) => {
    wrap.querySelectorAll(".stages_title, .stages_subtitle, .stages_p-text")
      .forEach(splitToWords);
  });

  if (stepLabel) {
    stepLabel.style.willChange = "transform, filter, opacity";
    stepLabel.style.backfaceVisibility = "hidden";
  }


  // ---- Стартовое состояние ----
  wrappers.forEach((wrap, index) => {
    const words = wrap.querySelectorAll(".stages_word");
    if (index === 0) {
      gsap.set(words, { yPercent: 0, opacity: 1, filter: "blur(0px)" });
      gsap.set(wrap, { autoAlpha: 1 });
    } else {
      gsap.set(words, { yPercent: 100, opacity: 0, filter: "blur(8px)" });
      gsap.set(wrap, { autoAlpha: 0 });
    }
  });

  if (stepLabel) gsap.set(stepLabel, { yPercent: 0, opacity: 1, filter: "blur(0px)" });


  // ---- Главный scrub-таймлайн смены этапов ----
  // scrub 2.2 даёт плавную inertia-доводку. Stagger мелкий (0.018),
  // ease power2 — мягче чем power3, без 'удара'.
  const tlStages = gsap.timeline({
    scrollTrigger: {
      trigger: ".stages",
      start: "top top",
      end: "bottom bottom",
      scrub: 2.2
    }
  });

  wrappers.forEach((wrap, i) => {
    if (i >= wrappers.length - 1) return;

    const nextWrap = wrappers[i + 1];
    const currentWords = wrap.querySelectorAll(".stages_word");
    const nextWords = nextWrap.querySelectorAll(".stages_word");

    const stepName = `step_${i}`;

    tlStages.set(nextWrap, { autoAlpha: 1 }, stepName);

    // Уход: слова уходят вверх с blur, мягкий power2.inOut
    tlStages.to(currentWords, {
      yPercent: -100,
      opacity: 0,
      filter: "blur(8px)",
      duration: 1.1,
      stagger: { each: 0.018, from: "start" },
      ease: "power2.inOut"
    }, stepName);

    // Появление: новые приезжают снизу. +0.25 опережение — без зазора
    tlStages.fromTo(nextWords,
      { yPercent: 100, opacity: 0, filter: "blur(8px)" },
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 1.3,
        stagger: { each: 0.022, from: "start" },
        ease: "power2.out"
      },
      `${stepName}+=0.25`);

    if (stepLabel) {
      tlStages.to(stepLabel, {
        yPercent: -100,
        opacity: 0,
        filter: "blur(4px)",
        duration: 0.5,
        ease: "power2.in"
      }, stepName);

      tlStages.set(stepLabel, {
        textContent: `ЭТАП ${i + 2}`,
        yPercent: 100,
        filter: "blur(4px)",
        opacity: 0
      }, `${stepName}+=0.5`);

      tlStages.to(stepLabel, {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.6,
        ease: "power2.out"
      }, `${stepName}+=0.5`);
    }

    tlStages.set(wrap, { autoAlpha: 0 });
    tlStages.to({}, { duration: 0.5 });
  });


  // ---- Пагинация — отдельный onUpdate (мгновенно, не scrub-tween) ----
  let lastDotIdx = 0;
  ScrollTrigger.create({
    trigger: ".stages",
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      const idx = Math.min(
        Math.floor(self.progress * wrappers.length),
        wrappers.length - 1
      );
      if (idx !== lastDotIdx) {
        lastDotIdx = idx;
        setActiveDot(idx);
      }
    },
    onRefresh: () => setActiveDot(lastDotIdx)
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootStagesAnimation);
} else {
  bootStagesAnimation();
}
