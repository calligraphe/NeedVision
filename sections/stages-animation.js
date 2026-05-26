/**
 * Секция «Этапы» — новая вёрстка с двумя стаканными карточками.
 *
 * Структура:
 *   .stages_content-wrapper (sticky top:14vw)
 *     ├─ .stages_card._1   (position:static, opacity:1)
 *     └─ .stages_card._2   (position:absolute top:0, opacity:0)
 *
 * Карточки лежат друг на друге — card._1 держит размер, card._2
 * absolute поверх неё. Меняем какой видим через autoAlpha и
 * параллельно делаем барабан текста внутри:
 *   .stages_step-label-mask > .stages_step-label
 *   .stages_title-mask > .stages_title
 *   .stages_subtitle-mask > .stages_subtitle
 *   .stages_p-mask > .stages_p-text
 * Все *-mask элементы уже overflow:hidden в CSS, поэтому
 * yPercent ±100 даёт чистый drum-эффект.
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


  // ---- Фон секции + фонарик (scrub) ----
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


  // ---- Карточки и их анимируемые строки ----
  const cards = gsap.utils.toArray(".stages_card");
  if (cards.length === 0) return;

  // Строки, которые сидят внутри overflow:hidden масок.
  // step-label-mask, title-mask, subtitle-mask, p-mask — все
  // подготовлены в HTML; анимируем непосредственное содержимое.
  function getTextLines(card) {
    return gsap.utils.toArray(card.querySelectorAll(
      ".stages_step-label-mask > .stages_step-label, " +
      ".stages_title-mask > .stages_title, " +
      ".stages_subtitle-mask > .stages_subtitle, " +
      ".stages_p-mask > .stages_p-text"
    ));
  }

  const cardLines = cards.map(getTextLines);


  // Webflow IX2 биндит data-w-id и может перезаписывать opacity —
  // стрипаем по всему дереву карточек.
  cards.forEach(card => {
    card.removeAttribute("data-w-id");
    card.querySelectorAll("[data-w-id]").forEach(el => el.removeAttribute("data-w-id"));
  });


  // ---- Стартовое состояние ----
  // card[0] видна и текст на местах; остальные скрыты, текст внизу.
  cards.forEach((card, i) => {
    if (i === 0) {
      gsap.set(card, { autoAlpha: 1 });
      gsap.set(cardLines[i], { yPercent: 0, opacity: 1 });
    } else {
      gsap.set(card, { autoAlpha: 0 });
      gsap.set(cardLines[i], { yPercent: 100, opacity: 0 });
    }
  });


  // ---- State-machine ----
  let currentStep = 0;
  let activeTween = null;

  function transitionTo(target) {
    if (target === currentStep) return;
    if (target < 0 || target >= cards.length) return;

    const direction = target > currentStep ? 1 : -1;
    const fromIdx = currentStep;
    currentStep = target;

    if (activeTween) activeTween.kill();

    // Чистим orphan'ы на случай быстрого скролла через несколько
    // границ — прошлый transitionTo мог не успеть скрыть свой fromCard.
    cards.forEach((card, i) => {
      if (i === fromIdx || i === target) return;
      gsap.set(card, { autoAlpha: 0 });
    });

    const fromCard = cards[fromIdx];
    const toCard = cards[target];
    const fromLines = cardLines[fromIdx];
    const toLines = cardLines[target];

    const exitY = direction > 0 ? -100 : 100;
    const entryY = direction > 0 ? 100 : -100;

    const tl = gsap.timeline({
      onComplete: () => { activeTween = null; }
    });
    activeTween = tl;

    // Показываем целевую карточку сразу (она появляется поверх
    // или под текущей — обе абсолютно совмещены в одном слоте).
    tl.set(toCard, { autoAlpha: 1 }, 0);

    // Старые строки уезжают (drum-out)
    tl.to(fromLines, {
      yPercent: exitY,
      opacity: 0,
      duration: 0.55,
      stagger: { each: 0.035, from: "start" },
      ease: "power2.in",
      overwrite: "auto"
    }, 0);

    // Новые строки приезжают (drum-in) с лёгким overlap
    tl.fromTo(toLines,
      { yPercent: entryY, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.7,
        stagger: { each: 0.04, from: "start" },
        ease: "power2.out",
        overwrite: "auto"
      },
      0.2
    );

    // Прячем старую карточку (вместе с её pagination/dots), когда
    // её строки уже ушли за маски — иначе мелькает чужая пагинация.
    tl.to(fromCard, {
      autoAlpha: 0,
      duration: 0.25,
      ease: "power2.in"
    }, 0.5);
  }


  // ---- ScrollTrigger: маппинг scroll-progress → индекс карточки ----
  // Равномерное разбиение всего scroll-диапазона секции (от
  // "top top" до "bottom bottom") по количеству карточек.
  ScrollTrigger.create({
    trigger: ".stages",
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      const idx = Math.min(
        Math.floor(self.progress * cards.length),
        cards.length - 1
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
