/**
 * Секция «Этапы». Премиальный word-level reveal вместо плоского mask-slide.
 *
 * Тексты разбиваются на слова, каждое слово получает свой stagger:
 *  — на уходе: yPercent -100 + skewY -4 + blur 6 + opacity 0,
 *    каскадом справа-налево (поток уносит слова за горизонт);
 *  — на появлении: yPercent 100 → 0 + blur 6 → 0 + opacity 0 → 1,
 *    обратный stagger (слова собираются из тумана слева-направо).
 *
 * Картинки .stages_img: scrub-driven reveal + лёгкий parallax-сдвиг
 * пока секция в pin (одни картинки едут чуть быстрее других).
 *
 * Лейбл «ЭТАП N» — счётчик-морфинг через сам text-mask + char-stagger.
 *
 * Пагинация — независимый ScrollTrigger.onUpdate с прямым opacity
 * (та же надёжная схема что в cases-slider).
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


  // ---- Фон секции + фонарик на входе ----
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


  // ---- Картинки: reveal + лёгкий intra-section parallax ----
  // Reveal: y + blur + scale при входе во вьюпорт.
  // Parallax: пока секция в pin, картинки чуть смещаются друг
  // относительно друга — создаёт живое многоплановое движение.
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

    // Parallax-сдвиг: чётные картинки едут вверх медленнее,
    // нечётные — быстрее. Размах ±60px.
    const parallaxOffset = idx % 2 === 0 ? -60 : 60;
    gsap.to(img, {
      yPercent: parallaxOffset / 10,    // ~ -6% / +6% от высоты
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


  // ---- Пагинация (та же надёжная схема что в cases-slider) ----
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


  // ---- Word split на текстах ----
  // Разбиваем содержимое .stages_title, .stages_subtitle, .stages_p-text
  // на отдельные <span class="stages_word">word</span>. Каждое слово
  // станет независимой анимируемой единицей с микро-stagger.
  //
  // display:inline-block на span'е держит layout как у обычного
  // inline-flow, но позволяет transform на слове.
  function splitToWords(el) {
    if (el.dataset.splitDone === "1") return;
    const text = el.textContent;
    if (!text || !text.trim()) return;

    // Сохраняем innerHTML для случая если внутри есть вложенные
    // элементы (например <br>, <span>). Простой split по пробелам
    // покрывает 95% случаев, для остального — fallback.
    if (el.children.length > 0 && el.children.length !== el.querySelectorAll("br").length) {
      // Есть нетривиальный HTML внутри — не трогаем
      return;
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
      gsap.set(words, { yPercent: 0, opacity: 1, filter: "blur(0px)", skewY: 0 });
      gsap.set(wrap, { autoAlpha: 1 });
    } else {
      gsap.set(words, { yPercent: 100, opacity: 0, filter: "blur(6px)", skewY: 4 });
      gsap.set(wrap, { autoAlpha: 0 });
    }
  });

  if (stepLabel) gsap.set(stepLabel, { yPercent: 0, opacity: 1, filter: "blur(0px)" });


  // ---- Главный scrub-таймлайн ----
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
    const currentWords = wrap.querySelectorAll(".stages_word");
    const nextWords = nextWrap.querySelectorAll(".stages_word");

    const stepName = `step_${i}`;

    tlStages.set(nextWrap, { autoAlpha: 1 }, stepName);

    // УХОД: каждое слово yPercent -100 + skewY + blur + opacity.
    // Stagger 0.025s + ease power3.inOut → каскад «вверх по волне»
    tlStages.to(currentWords, {
      yPercent: -100,
      skewY: -4,
      opacity: 0,
      filter: "blur(6px)",
      duration: 1.0,
      stagger: { each: 0.025, from: "start" },
      ease: "power3.inOut"
    }, stepName);

    // ПОЯВЛЕНИЕ: обратный stagger, чуть длиннее.
    // +0.2 опережение — без зазора между фазами
    tlStages.fromTo(nextWords,
      { yPercent: 100, skewY: 4, opacity: 0, filter: "blur(6px)" },
      {
        yPercent: 0,
        skewY: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 1.2,
        stagger: { each: 0.03, from: "start" },
        ease: "power3.out"
      },
      `${stepName}+=0.2`);

    // Лейбл «ЭТАП N» — текст и blur+fade-морфинг
    if (stepLabel) {
      tlStages.to(stepLabel, {
        yPercent: -100,
        opacity: 0,
        filter: "blur(4px)",
        duration: 0.45,
        ease: "power3.in"
      }, stepName);

      tlStages.set(stepLabel, {
        textContent: `ЭТАП ${i + 2}`,
        yPercent: 100,
        filter: "blur(4px)",
        opacity: 0
      }, `${stepName}+=0.45`);

      tlStages.to(stepLabel, {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.55,
        ease: "power3.out"
      }, `${stepName}+=0.45`);
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
