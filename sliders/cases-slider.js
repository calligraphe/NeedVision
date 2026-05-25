/**
 * Карусель кейсов на главной.
 *
 * Drag висит на всём .cases_slider-track (а не на каждой карточке) —
 * тянуть можно за любое место трека, включая промежутки между карточками.
 * Клик по карточке → активировать её, drag → next/prev, клик по точке → перейти.
 * Кастомный курсор-иконка в .case-click-zone ведёт на страницу активного кейса.
 */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") {
    console.warn("cases-slider.js: GSAP не загружен");
    return;
  }
  if (typeof Observer === "undefined") {
    console.warn("cases-slider.js: Observer не загружен");
    return;
  }

  const slides = document.querySelectorAll('.case_card');
  const slidesArr = Array.from(slides);
  const track = document.querySelector('.cases_slider-track');
  if (slides.length === 0 || !track) return;

  gsap.registerPlugin(Observer);

  const dots = document.querySelectorAll('.cases_slider-dot');
  const bgImages = document.querySelectorAll('.case_bg-image');
  const fractionTxt = document.querySelector('.cases_fraction-txt');

  // Кликабельная зона — ведёт на страницу кейса
  const clickZone = document.querySelector('.case-click-zone');
  const mouseClickIcon = document.querySelector('.case-mouse-click');

  // ---- Тайминги и константы ----
  const SLIDE_STEP_VW = 28;            // шаг сдвига дорожки на один слайд
  const TRACK_DURATION = 0.8;          // длительность сдвига дорожки
  const CONTENT_DURATION = 0.4;        // длительность смены цветов карточки
  const HOVER_DURATION = 0.6;          // длительность hover-перекраски неактивной карточки
  const BG_DURATION = 0.8;             // длительность фоновой подложки
  const DOT_DURATION = 0.4;            // длительность анимации точки
  const DRAG_MIN = 10;                 // минимум движения для drag
  const DRAG_TOLERANCE = 20;

  // Цвета hover-состояния неактивной карточки
  const HOVER_BG = "#8F8E84";
  const HOVER_COLOR = "#ffffff";
  const IDLE_BG = "#ffffff";
  const IDLE_COLOR = "#000000";

  let activeIndex = 0;
  const totalSlides = slides.length;
  let isAnimating = false;

  gsap.set(bgImages, { opacity: 0 });

  // ---- Кастомный курсор в .case-click-zone ----
  if (clickZone && mouseClickIcon) {
    clickZone.style.cursor = 'none';

    mouseClickIcon.style.cssText += `
      position: fixed !important;
      pointer-events: none !important;
      z-index: 9999 !important;
      opacity: 0 !important;
      transform: translate(-50%, -50%) !important;
      transition: opacity 0.2s ease !important;
    `;

    const xTo = gsap.quickTo(mouseClickIcon, "left", { duration: 0.25, ease: "power3.out" });
    const yTo = gsap.quickTo(mouseClickIcon, "top", { duration: 0.25, ease: "power3.out" });

    clickZone.addEventListener('mouseenter', () => {
      mouseClickIcon.style.opacity = '1';
    });
    clickZone.addEventListener('mouseleave', () => {
      mouseClickIcon.style.opacity = '0';
    });
    clickZone.addEventListener('mousemove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });

    // Клик по зоне = переход на страницу кейса
    clickZone.addEventListener('click', () => {
      const activeSlide = slides[activeIndex];
      if (!activeSlide) return;
      const link = activeSlide.querySelector('a')?.getAttribute('href')
        || activeSlide.getAttribute('data-href');
      if (link) {
        window.location.href = link;
      }
    });
  }

  function updateSlider(index) {
    if (isAnimating) return;
    isAnimating = true;

    // 1. Сдвигаем трек
    gsap.to(track, {
      x: `-${index * SLIDE_STEP_VW}vw`,
      duration: TRACK_DURATION,
      ease: "power2.inOut",
      onComplete: () => { isAnimating = false; }
    });

    // 2. Фракция
    if (fractionTxt) {
      fractionTxt.textContent = `${index + 1}/${totalSlides}`;
    }

    // 3. Точки
    dots.forEach((dot, i) => {
      const fullDot = dot.querySelector('.cases_slider-dot-full');
      if (fullDot) {
        gsap.to(fullDot, {
          opacity: i === index ? 1 : 0,
          duration: DOT_DURATION,
          ease: "power2.inOut"
        });
      }
    });

    // 4. Фоновые изображения
    bgImages.forEach((bg, i) => {
      gsap.to(bg, {
        opacity: i === index ? 1 : 0,
        duration: BG_DURATION,
        ease: "power2.inOut"
      });
    });

    // 5. Стили внутри карточек
    slides.forEach((slide, i) => {
      const content = slide.querySelector('.case_card-content');
      const tag = slide.querySelector('.case_tag-text');
      const logo = slide.querySelector('.case_client-logo');
      const isActive = i === index;

      if (isActive) {
        // Активная карточка — на тёмном фоне
        gsap.to(content, {
          backgroundColor: "transparent",
          color: "#ffffff",
          duration: CONTENT_DURATION
        });
        if (tag) tag.classList.add('active');
        if (logo) gsap.to(logo, {
          filter: "brightness(0) invert(1)",
          duration: CONTENT_DURATION
        });
      } else {
        // Неактивная карточка — на белом фоне
        gsap.to(content, {
          backgroundColor: IDLE_BG,
          color: IDLE_COLOR,
          duration: CONTENT_DURATION
        });
        if (tag) tag.classList.remove('active');
        if (logo) gsap.to(logo, {
          filter: "brightness(0) invert(0)",
          duration: CONTENT_DURATION
        });
      }
    });
  }

  function nextSlide() {
    if (activeIndex < totalSlides - 1) {
      activeIndex++;
      updateSlider(activeIndex);
    }
  }

  function prevSlide() {
    if (activeIndex > 0) {
      activeIndex--;
      updateSlider(activeIndex);
    }
  }

  // ---- Drag на всём треке ----
  // Один Observer на .cases_slider-track ловит drag/свайп в любом месте
  // (включая зазоры между карточками). Чистый клик (без движения дальше
  // DRAG_MIN) идёт в onClick — находим карточку через event.target и
  // активируем её.
  track.style.cursor = 'grab';

  Observer.create({
    target: track,
    type: "touch,pointer",
    dragMinimum: DRAG_MIN,
    tolerance: DRAG_TOLERANCE,
    onPress: () => { track.style.cursor = 'grabbing'; },
    onRelease: () => { track.style.cursor = 'grab'; },
    onLeft: () => nextSlide(),
    onRight: () => prevSlide(),
    onClick: (self) => {
      const card = self.event?.target?.closest?.('.case_card');
      if (!card) return;
      const i = slidesArr.indexOf(card);
      if (i >= 0 && i !== activeIndex) {
        activeIndex = i;
        updateSlider(activeIndex);
      }
    }
  });

  // Hover для НЕактивной карточки: фон #8F8E84, текст белый, лого инвертируется.
  // На активной игнорируем — у неё свой стиль (transparent + белый).
  slides.forEach((slide, i) => {
    const content = slide.querySelector('.case_card-content');
    const hoverLogo = slide.querySelector('.case_client-logo');
    if (!content) return;

    slide.addEventListener('mouseenter', () => {
      if (i === activeIndex) return;
      gsap.to(content, {
        backgroundColor: HOVER_BG,
        color: HOVER_COLOR,
        duration: HOVER_DURATION,
        ease: "power2.out"
      });
      if (hoverLogo) {
        gsap.to(hoverLogo, {
          filter: "brightness(0) invert(1)",
          duration: HOVER_DURATION,
          ease: "power2.out"
        });
      }
    });
    slide.addEventListener('mouseleave', () => {
      if (i === activeIndex) return;
      gsap.to(content, {
        backgroundColor: IDLE_BG,
        color: IDLE_COLOR,
        duration: HOVER_DURATION,
        ease: "power2.out"
      });
      if (hoverLogo) {
        gsap.to(hoverLogo, {
          filter: "brightness(0) invert(0)",
          duration: HOVER_DURATION,
          ease: "power2.out"
        });
      }
    });
  });

  // ---- Точки-индикаторы ----
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (activeIndex !== i) {
        activeIndex = i;
        updateSlider(activeIndex);
      }
    });
  });

  // Первая отрисовка
  updateSlider(0);
});
