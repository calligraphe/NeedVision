/**
 * NEED.VISION — Карусель кейсов
 * =============================
 *
 * Что делает: горизонтальная карусель кейсов с управлением через GSAP
 *             Observer (свайп / drag), клик по точкам и карточкам, плюс
 *             кастомный курсор-иконка в зоне `.case-click-zone`.
 *             Активная карточка визуально выделяется (тёмный фон / белый
 *             текст / инвертированное лого), остальные — на белом.
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *   - Observer
 *
 * Webflow селекторы:
 *   - .cases_slider-track    — движущаяся дорожка слайдов
 *   - .case_card             — отдельные карточки (слайды)
 *   - .cases_slider-dot      — точки-индикаторы
 *   - .cases_slider-dot-full — внутренний заполнитель точки (опасити меняется)
 *   - .case_bg-image         — фоновые изображения каждого слайда
 *   - .cases_fraction-txt    — текст вида "2/5" (текущий/всего)
 *   - .case_card-content     — внутренний контент карточки (меняет цвет/фон)
 *   - .case_tag-text         — тэг карточки (получает класс .active)
 *   - .case_client-logo      — лого клиента (инвертируется)
 *   - .case-click-zone       — зона клика (ведёт на страницу кейса)
 *   - .case-mouse-click      — кастомный курсор-иконка
 *
 * Атрибуты в Webflow:
 *   - У активной карточки `<a href="...">` или `data-href="..."` на
 *     самой карточке — куда вести при клике в `.case-click-zone`.
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sliders/cases-slider.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] cases-slider.js: GSAP не загружен");
    return;
  }
  if (typeof Observer === "undefined") {
    console.warn("[Need Vision] cases-slider.js: Observer не загружен");
    return;
  }

  // ---- Проверка наличия элементов ----
  const slides = document.querySelectorAll('.case_card');
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
  const BG_DURATION = 0.8;             // длительность фоновой подложки
  const DOT_DURATION = 0.4;            // длительность анимации точки
  const DRAG_MIN = 10;                 // минимум движения для drag
  const DRAG_TOLERANCE = 20;

  let activeIndex = 0;
  const totalSlides = slides.length;
  let isAnimating = false;

  gsap.set(bgImages, { opacity: 0 });

  // ==========================================
  // КАСТОМНЫЙ КУРСОР В ЗОНЕ КЛИКА
  // ==========================================
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

  // ==========================================
  // ОСНОВНАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ СЛАЙДЕРА
  // ==========================================
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
          backgroundColor: "#ffffff",
          color: "#000000",
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

  // ==========================================
  // ПЕРЕКЛЮЧЕНИЕ
  // ==========================================
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

  // ==========================================
  // DRAG/SWIPE через GSAP Observer
  // ==========================================
  if (track) {
    track.style.cursor = 'grab';

    Observer.create({
      target: track,
      type: "touch,pointer",
      dragMinimum: DRAG_MIN,
      tolerance: DRAG_TOLERANCE,
      onPress: () => { track.style.cursor = 'grabbing'; },
      onRelease: () => { track.style.cursor = 'grab'; },
      onLeft: () => nextSlide(),
      onRight: () => prevSlide()
    });
  }

  // ==========================================
  // КЛИКИ ПО КАРТОЧКАМ И ТОЧКАМ
  // ==========================================
  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => {
      if (activeIndex !== i) {
        activeIndex = i;
        updateSlider(activeIndex);
      }
    });
  });

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
