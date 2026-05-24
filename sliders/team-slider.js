/**
 * NEED.VISION — Слайдер команды (кастомный, с замером слотов)
 * ===========================================================
 *
 * Что делает: горизонтальная карусель карточек команды с активным слотом
 *             по центру (карточка крупнее и выделена). Перед инициализацией
 *             замеряет реальные позиции слотов и разделителей из Webflow-
 *             вёрстки и переводит элементы в `position: absolute` —
 *             благодаря этому анимация в `vw` остаётся отзывчивой и
 *             точной на любом экране.
 *
 *             Тексты роли/цитаты/описания и подпись активного участника
 *             меняются с мягким блюром (6px → 0, без артефактов на
 *             ретине). Управление — кнопка `next`, клики по карточкам/
 *             точкам, mouse-drag и touch-swipe.
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *
 * Webflow селекторы:
 *   - .team_photo-track          — корневая дорожка слайдера
 *   - .team_photo-slide          — карточки участников
 *   - .team_photo-slide.is-active — стартовый активный слайд (один из них)
 *   - .team_div                  — вертикальные разделители между слотами
 *   - .team_nav-btn              — кнопка «следующий»
 *   - .team_dot                  — точки-индикаторы
 *   - .team_dot-full             — внутренний заполнитель точки
 *   - .team_member-header        — шапка карточки с именем (видна только у активной)
 *   - .team_member-header.is-hidden — стартовое состояние неактивных шапок (снимается)
 *   - .team_data-role            — источник данных: роль участника
 *   - .team_data-quote           — источник данных: цитата
 *   - .team_data-description     — источник данных: описание
 *   - .team_data-sign            — источник данных: подпись (img)
 *   - .team_role-text            — «монитор» роли
 *   - .team_quote-text           — «монитор» цитаты
 *   - .team_desc-text            — «монитор» описания
 *   - .team-sign                 — «монитор» подписи (img)
 *   - .team_info-meta .label-wrapper — обёртки лейблов; во второй пишется номер слайда
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sliders/team-slider.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] team-slider.js: GSAP не загружен");
    return;
  }

  // ---- Проверка наличия элементов ----
  const track = document.querySelector('.team_photo-track');
  const slides = gsap.utils.toArray('.team_photo-slide');
  if (!track || slides.length === 0) return;

  const dividers = gsap.utils.toArray('.team_div');
  const nextBtn = document.querySelector('.team_nav-btn');
  const dots = gsap.utils.toArray('.team_dot');

  // ---- Кэш DOM-узлов, которые дёргаются на каждом updateSlider/updateTexts ----
  // Раньше querySelector на эти элементы вызывался по N раз за свич слайда —
  // для текстов это 5 запросов + 1 querySelectorAll, для headers — N штук.
  // Кешируем один раз при init: дальше просто индексируем массивы.
  const slideHeaders = slides.map(s => s.querySelector('.team_member-header'));
  const dotFulls = dots.map(d => d.querySelector('.team_dot-full'));

  const textTargets = {
    role:  document.querySelector('.team_role-text'),
    quote: document.querySelector('.team_quote-text'),
    desc:  document.querySelector('.team_desc-text'),
    sign:  document.querySelector('.team-sign')
  };

  // Номер слайда пишется во ВТОРУЮ .label-wrapper внутри .team_info-meta.
  const metaLabels = document.querySelectorAll('.team_info-meta .label-wrapper');
  const numTarget = metaLabels.length > 1
    ? metaLabels[1].querySelectorAll('.label-text')[1]
    : null;

  // ---- Тайминги ----
  const ANIM_DURATION = 1.0;
  const ANIM_EASE = "power2.inOut";
  const DRAG_THRESHOLD_MOUSE = 50;
  const DRAG_THRESHOLD_TOUCH = 40;

  const totalSlides = slides.length;
  let isAnimating = false;

  // ============================================
  // 1. ЗАМЕРЯЕМ ИСХОДНУЮ ВЁРСТКУ WEBFLOW
  // ============================================
  let initialActiveIdx = 0;
  slides.forEach((slide, i) => {
    if (slide.classList.contains('is-active')) {
      initialActiveIdx = i;
    }
  });

  let activeIndex = initialActiveIdx;

  const trackRect = track.getBoundingClientRect();
  const trackCenterX = trackRect.left + trackRect.width / 2;
  const trackBottom = trackRect.bottom;
  const trackHeight = trackRect.height;

  const vw = window.innerWidth / 100;
  const toVw = px => px / vw;

  const slotPositions = slides.map(slide => {
    const rect = slide.getBoundingClientRect();
    return {
      x: toVw(rect.left + rect.width / 2 - trackCenterX),
      bottom: toVw(trackBottom - rect.bottom),
      w: toVw(rect.width),
      h: toVw(rect.height)
    };
  });

  const dividerPositions = dividers.map(div => {
    const rect = div.getBoundingClientRect();
    return {
      x: toVw(rect.left + rect.width / 2 - trackCenterX),
      bottom: toVw(trackBottom - rect.bottom)
    };
  });

  const ACTIVE_W = slotPositions[initialActiveIdx].w;
  const ACTIVE_H = slotPositions[initialActiveIdx].h;
  const ACTIVE_BOTTOM = slotPositions[initialActiveIdx].bottom;

  let SMALL_W, SMALL_H, SMALL_BOTTOM;
  for (let i = 0; i < slotPositions.length; i++) {
    if (i !== initialActiveIdx) {
      SMALL_W = slotPositions[i].w;
      SMALL_H = slotPositions[i].h;
      SMALL_BOTTOM = slotPositions[i].bottom;
      break;
    }
  }

  // ============================================
  // 2. ПЕРЕВОДИМ В ABSOLUTE
  // ============================================
  track.style.cssText += `
    display: block !important;
    position: relative !important;
    height: ${toVw(trackHeight)}vw !important;
    width: 100% !important;
    overflow: visible !important;
  `;

  slides.forEach((slide, i) => {
    slide.classList.remove('is-active');
    const header = slide.querySelector('.team_member-header');
    if (header) header.classList.remove('is-hidden');

    const isActive = (i === initialActiveIdx);
    const w = isActive ? ACTIVE_W : SMALL_W;
    const h = isActive ? ACTIVE_H : SMALL_H;
    const bottom = isActive ? ACTIVE_BOTTOM : SMALL_BOTTOM;

    slide.style.cssText += `
      position: absolute !important;
      bottom: ${bottom}vw !important;
      left: 50% !important;
      width: ${w}vw !important;
      height: ${h}vw !important;
      min-width: 0 !important;
      max-width: none !important;
      margin: 0 !important;
      transition: none !important;
    `;
  });

  gsap.set(slides, {
    xPercent: -50,
    yPercent: 0,
    transformOrigin: "center bottom"
  });

  slides.forEach((slide, i) => {
    gsap.set(slide, { x: `${slotPositions[i].x}vw` });
    const header = slide.querySelector('.team_member-header');
    if (header) {
      gsap.set(header, { opacity: (i === initialActiveIdx) ? 1 : 0 });
    }
  });

  // Стартовое состояние пагинации: активная точка горит, остальные — нет.
  // Без этого Webflow держит все .team_dot-full скрытыми до первого клика.
  dots.forEach((dot, i) => {
    const full = dot.querySelector('.team_dot-full');
    if (full) {
      gsap.set(full, { opacity: i === activeIndex ? 1 : 0 });
    }
  });

  dividers.forEach((div, i) => {
    div.style.cssText += `
      position: absolute !important;
      bottom: ${dividerPositions[i].bottom}vw !important;
      left: 50% !important;
      margin: 0 !important;
      transition: none !important;
    `;
  });

  gsap.set(dividers, {
    xPercent: -50,
    yPercent: 0
  });

  dividers.forEach((div, i) => {
    gsap.set(div, { x: `${dividerPositions[i].x}vw` });
  });

  // ============================================
  // 3. ЛОГИКА КАРУСЕЛИ
  // ============================================
  function getPhysicalSlot(cardIndex) {
    let diff = cardIndex - activeIndex;
    if (diff > Math.floor(totalSlides / 2)) diff -= totalSlides;
    if (diff < -Math.floor(totalSlides / 2)) diff += totalSlides;

    let physicalIdx = initialActiveIdx + diff;
    while (physicalIdx < 0) physicalIdx += totalSlides;
    while (physicalIdx >= totalSlides) physicalIdx -= totalSlides;
    return physicalIdx;
  }

  function getSlideState(cardIndex) {
    const physicalSlot = getPhysicalSlot(cardIndex);
    const isActiveSlot = (physicalSlot === initialActiveIdx);

    return {
      x: slotPositions[physicalSlot].x,
      bottom: slotPositions[physicalSlot].bottom,
      w: isActiveSlot ? ACTIVE_W : SMALL_W,
      h: isActiveSlot ? ACTIVE_H : SMALL_H,
      z: isActiveSlot ? 10 : 5,
      headerOpacity: isActiveSlot ? 1 : 0
    };
  }

  // ============================================
  // 4. ОБНОВЛЕНИЕ КАРУСЕЛИ
  // ============================================
  function updateSlider(newIndex) {
    if (isAnimating) return;
    isAnimating = true;
    activeIndex = newIndex;

    const tl = gsap.timeline({
      defaults: { duration: ANIM_DURATION, ease: ANIM_EASE },
      onComplete: () => { isAnimating = false; }
    });

    slides.forEach((slide, i) => {
      const state = getSlideState(i);

      tl.to(slide, {
        x: `${state.x}vw`,
        bottom: `${state.bottom}vw`,
        width: `${state.w}vw`,
        height: `${state.h}vw`,
        zIndex: state.z
      }, 0);

      const header = slideHeaders[i];
      if (header) {
        tl.to(header, {
          opacity: state.headerOpacity,
          duration: ANIM_DURATION * 0.5,
          ease: "power2.out"
        }, state.headerOpacity === 1 ? ANIM_DURATION * 0.5 : 0);
      }
    });

    dotFulls.forEach((full, index) => {
      if (!full) return;
      tl.to(full, {
        opacity: index === activeIndex ? 1 : 0,
        duration: 0.3
      }, 0);
    });

    updateTexts(slides[activeIndex], activeIndex + 1);
  }

  // ============================================
  // 5. ТЕКСТЫ — МЯГКИЙ БЛЮР БЕЗ АРТЕФАКТОВ
  // ============================================
  function updateTexts(activeSlide, currentNum) {
    const newRole = activeSlide.querySelector('.team_data-role')?.innerHTML || '';
    const newQuote = activeSlide.querySelector('.team_data-quote')?.innerHTML || '';
    const newDesc = activeSlide.querySelector('.team_data-description')?.innerHTML || '';
    const newSignSrc = activeSlide.querySelector('.team_data-sign')?.getAttribute('src') || '';

    // textTargets / numTarget закэшированы при init — без DOM-запросов на каждом тике.
    const targetRole = textTargets.role;
    const targetQuote = textTargets.quote;
    const targetDesc = textTargets.desc;
    const targetSign = textTargets.sign;
    const targetNum = numTarget;

    const elements = [targetRole, targetQuote, targetDesc, targetSign, targetNum].filter(el => el);
    if (elements.length === 0) return;

    // Подготавливаем слои заранее — убирает «квадрат» от blur'а на ретине
    elements.forEach(el => {
      el.style.willChange = "filter, transform, opacity";
      el.style.backfaceVisibility = "hidden";
    });

    const tl = gsap.timeline({
      onComplete: () => {
        // Снимаем will-change после анимации, чтобы не нагружать GPU
        elements.forEach(el => {
          el.style.willChange = "auto";
        });
      }
    });

    // Уход: лёгкий блюр + опускание + прозрачность
    tl.to(elements, {
      y: -10,
      opacity: 0,
      filter: "blur(6px)",
      duration: 0.4,
      stagger: 0.04,
      ease: "power2.in"
    });

    // Подмена контента
    tl.call(() => {
      if (targetRole) targetRole.innerHTML = newRole;
      if (targetQuote) targetQuote.innerHTML = newQuote;
      if (targetDesc) targetDesc.innerHTML = newDesc;
      if (targetNum) targetNum.innerHTML = currentNum;
      if (targetSign && newSignSrc) {
        targetSign.src = newSignSrc;
        targetSign.removeAttribute('srcset');
      }
    });

    // Появление: из лёгкого блюра + снизу
    tl.fromTo(elements,
      {
        y: 10,
        opacity: 0,
        filter: "blur(6px)"
      },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.6,
        stagger: 0.04,
        ease: "power2.out"
      }
    );
  }

  // ============================================
  // 6. УПРАВЛЕНИЕ
  // ============================================
  function nextSlide() { updateSlider((activeIndex + 1) % totalSlides); }
  function prevSlide() { updateSlider((activeIndex - 1 + totalSlides) % totalSlides); }

  if (nextBtn) nextBtn.addEventListener('click', nextSlide);

  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => {
      if (i !== activeIndex && !isAnimating) updateSlider(i);
    });
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (i !== activeIndex && !isAnimating && i < totalSlides) updateSlider(i);
    });
  });

  let startX = 0;
  let isDragging = false;

  track.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    isDragging = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const diff = startX - e.clientX;
    if (diff > DRAG_THRESHOLD_MOUSE) nextSlide();
    if (diff < -DRAG_THRESHOLD_MOUSE) prevSlide();
  });

  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    const diff = startX - e.changedTouches[0].clientX;
    if (diff > DRAG_THRESHOLD_TOUCH) nextSlide();
    if (diff < -DRAG_THRESHOLD_TOUCH) prevSlide();
  });
});
