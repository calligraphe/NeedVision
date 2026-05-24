/**
 * NEED.VISION — Карусель кейсов
 * =============================
 *
 * Что делает: горизонтальная карусель кейсов.
 *   - drag/swipe по ЛЮБОМУ месту `.cases_slider-track` → next/prev слайд
 *   - чистый клик по неактивной карточке (без движения) → активировать её
 *   - клик по точке-индикатору                          → активировать слайд
 *   - клик в `.case-click-zone`                         → переход на страницу кейса
 *   - hover на неактивной карточке                      → серый фон + белый текст + инв. лого
 *
 * На крае слайдера (первый или последний слайд) drag в «нечего тянуть»
 * сторону — no-op. Работает только обратное направление.
 *
 * Архитектура (что чинит «тупит» в старой версии):
 *   - ОДИН Observer на .cases_slider-track вместо одного на каждую карточку
 *     → меньше слушателей, drag «ловит» весь видимый трек, включая зазоры
 *   - убран `isAnimating` lock — он блокировал любой ввод на TRACK_DURATION
 *     (0.8s). Теперь юзер может ремкать-драгать сколько угодно, GSAP сам
 *     убивает старые tween'ы через `overwrite: 'auto'`
 *   - DOM-узлы (.cases_slider-dot-full/empty, .case_card-content, .logo)
 *     закэшированы один раз в bootCasesSlider — больше нет querySelector
 *     внутри updateSlider на каждый клик
 *   - hover-обработчики игнорируют событие во время press (isPressed flag)
 *     — drag через карточки больше не «дёргает» hover-tween'ами
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *   - Observer
 *
 * Webflow селекторы:
 *   - .cases_slider-track    — движущаяся дорожка (drag target)
 *   - .case_card             — отдельные карточки (слайды)
 *   - .cases_slider-dot      — точки-индикаторы
 *   - .cases_slider-dot-full — заполненный кружок (активная)
 *   - .cases_slider-dot-empty — пустой кружок (неактивная)
 *   - .case_bg-image         — фоновые изображения каждого слайда
 *   - .cases_fraction-txt    — текст "2/4"
 *   - .case_card-content     — внутренний контент карточки (меняет цвет/фон)
 *   - .case_tag-text         — тэг карточки (active class → visible)
 *   - .case_client-logo      — лого клиента (инвертируется)
 *   - .case-click-zone       — зона клика (ведёт на страницу кейса)
 *   - .case-mouse-click      — кастомный курсор-иконка в click-zone
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sliders/cases-slider.js"></script>
 */

function bootCasesSlider() {
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] cases-slider.js: GSAP не загружен");
    return;
  }
  if (typeof Observer === "undefined") {
    console.warn("[Need Vision] cases-slider.js: Observer не загружен");
    return;
  }

  const track = document.querySelector(".cases_slider-track");
  const slides = Array.from(document.querySelectorAll(".case_card"));
  if (!track || slides.length === 0) return;

  gsap.registerPlugin(Observer);

  const dots         = Array.from(document.querySelectorAll(".cases_slider-dot"));
  const bgImages     = Array.from(document.querySelectorAll(".case_bg-image"));
  const fractionTxt  = document.querySelector(".cases_fraction-txt");
  const clickZone    = document.querySelector(".case-click-zone");
  const mouseIcon    = document.querySelector(".case-mouse-click");

  // ---- Кэш внутренних узлов (querySelector один раз, не на каждый клик) ----
  const dotFulls   = dots.map(d => d.querySelector(".cases_slider-dot-full"));
  const dotEmpties = dots.map(d => d.querySelector(".cases_slider-dot-empty"));
  const slideParts = slides.map(s => ({
    content: s.querySelector(".case_card-content"),
    tag:     s.querySelector(".case_tag-text"),
    logo:    s.querySelector(".case_client-logo")
  }));

  // ---- Константы ----
  const SLIDE_STEP_VW   = 28;
  const TRACK_DURATION  = 0.7;
  const CONTENT_DURATION = 0.4;
  const HOVER_DURATION  = 0.6;
  const BG_DURATION     = 0.8;
  const DOT_DURATION    = 0.4;
  const DRAG_MIN        = 10;
  const DRAG_TOLERANCE  = 20;

  const HOVER_BG    = "#8F8E84";
  const HOVER_COLOR = "#ffffff";
  const IDLE_BG     = "#ffffff";
  const IDLE_COLOR  = "#000000";

  let activeIndex = 0;
  let isPressed   = false;
  const totalSlides = slides.length;

  gsap.set(bgImages, { opacity: 0 });

  // ==========================================
  // КАСТОМНЫЙ КУРСОР В .case-click-zone
  // ==========================================
  if (clickZone && mouseIcon) {
    clickZone.style.cursor = "none";
    mouseIcon.style.cssText += `
      position: fixed !important;
      pointer-events: none !important;
      z-index: 9999 !important;
      opacity: 0 !important;
      transform: translate(-50%, -50%) !important;
      transition: opacity 0.2s ease !important;
    `;
    const xTo = gsap.quickTo(mouseIcon, "left", { duration: 0.25, ease: "power3.out" });
    const yTo = gsap.quickTo(mouseIcon, "top",  { duration: 0.25, ease: "power3.out" });

    clickZone.addEventListener("mouseenter", () => { mouseIcon.style.opacity = "1"; });
    clickZone.addEventListener("mouseleave", () => { mouseIcon.style.opacity = "0"; });
    clickZone.addEventListener("mousemove",  (e) => { xTo(e.clientX); yTo(e.clientY); });

    clickZone.addEventListener("click", () => {
      const active = slides[activeIndex];
      if (!active) return;
      const link = active.querySelector("a")?.getAttribute("href")
                || active.getAttribute("data-href");
      if (link) window.location.href = link;
    });
  }

  // ==========================================
  // ОБНОВЛЕНИЕ СЛАЙДЕРА
  // ==========================================
  // Никаких локов. Все tween'ы с overwrite:'auto' — повторный вызов
  // тут же убивает предыдущие. Юзер может щёлкать-драгать без лагов.
  function updateSlider(index) {
    // Трек
    gsap.to(track, {
      x: `-${index * SLIDE_STEP_VW}vw`,
      duration: TRACK_DURATION,
      ease: "power2.inOut",
      overwrite: "auto"
    });

    // Фракция
    if (fractionTxt) fractionTxt.textContent = `${index + 1}/${totalSlides}`;

    // Точки — пара full/empty, как в .stages
    dotFulls.forEach((full, i) => {
      if (!full) return;
      gsap.to(full, {
        opacity: i === index ? 1 : 0,
        duration: DOT_DURATION,
        ease: "power2.inOut",
        overwrite: "auto"
      });
    });
    dotEmpties.forEach((empty, i) => {
      if (!empty) return;
      gsap.to(empty, {
        opacity: i === index ? 0 : 1,
        duration: DOT_DURATION,
        ease: "power2.inOut",
        overwrite: "auto"
      });
    });

    // Фоновые изображения
    bgImages.forEach((bg, i) => {
      gsap.to(bg, {
        opacity: i === index ? 1 : 0,
        duration: BG_DURATION,
        ease: "power2.inOut",
        overwrite: "auto"
      });
    });

    // Карточки
    slideParts.forEach((parts, i) => {
      const isActive = i === index;
      if (parts.content) {
        gsap.to(parts.content, {
          backgroundColor: isActive ? "transparent" : IDLE_BG,
          color: isActive ? "#ffffff" : IDLE_COLOR,
          duration: CONTENT_DURATION,
          overwrite: "auto"
        });
      }
      if (parts.tag) {
        parts.tag.classList.toggle("active", isActive);
      }
      if (parts.logo) {
        gsap.to(parts.logo, {
          filter: isActive ? "brightness(0) invert(1)" : "brightness(0) invert(0)",
          duration: CONTENT_DURATION,
          overwrite: "auto"
        });
      }
    });
  }

  // ==========================================
  // НАВИГАЦИЯ — границы атомарно проверяются здесь
  // ==========================================
  function goNext() {
    if (activeIndex >= totalSlides - 1) return;   // на крае «нечего тянуть»
    activeIndex++;
    updateSlider(activeIndex);
  }
  function goPrev() {
    if (activeIndex <= 0) return;                 // на крае «нечего тянуть»
    activeIndex--;
    updateSlider(activeIndex);
  }
  function goTo(i) {
    if (i < 0 || i >= totalSlides || i === activeIndex) return;
    activeIndex = i;
    updateSlider(activeIndex);
  }

  // ==========================================
  // ЕДИНЫЙ Observer на ВЕСЬ .cases_slider-track
  // ==========================================
  // Drag/swipe в любом месте трека → next/prev. Клик без движения
  // (Observer сам различает: <DRAG_MIN px = click, >=DRAG_MIN = drag) →
  // активировать карточку под курсором.
  track.style.cursor = "grab";

  Observer.create({
    target: track,
    type: "touch,pointer",
    dragMinimum: DRAG_MIN,
    tolerance: DRAG_TOLERANCE,
    onPress:    () => { isPressed = true;  track.style.cursor = "grabbing"; },
    onRelease:  () => { isPressed = false; track.style.cursor = "grab"; },
    onLeft:     goNext,
    onRight:    goPrev,
    onClick: (self) => {
      const card = self.event?.target?.closest?.(".case_card");
      if (!card) return;
      const i = slides.indexOf(card);
      goTo(i);
    }
  });

  // ==========================================
  // HOVER на НЕактивной карточке
  // ==========================================
  // Игнорируем во время press (драг через карточки больше не дёргает hover).
  slideParts.forEach((parts, i) => {
    if (!parts.content) return;
    const slide = slides[i];

    slide.addEventListener("mouseenter", () => {
      if (i === activeIndex || isPressed) return;
      gsap.to(parts.content, {
        backgroundColor: HOVER_BG,
        color: HOVER_COLOR,
        duration: HOVER_DURATION,
        ease: "power2.out",
        overwrite: "auto"
      });
      if (parts.logo) {
        gsap.to(parts.logo, {
          filter: "brightness(0) invert(1)",
          duration: HOVER_DURATION,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    });

    slide.addEventListener("mouseleave", () => {
      if (i === activeIndex) return;
      gsap.to(parts.content, {
        backgroundColor: IDLE_BG,
        color: IDLE_COLOR,
        duration: HOVER_DURATION,
        ease: "power2.out",
        overwrite: "auto"
      });
      if (parts.logo) {
        gsap.to(parts.logo, {
          filter: "brightness(0) invert(0)",
          duration: HOVER_DURATION,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    });
  });

  // ==========================================
  // КЛИК ПО ТОЧКЕ-ИНДИКАТОРУ
  // ==========================================
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => goTo(i));
  });

  // ==========================================
  // ПЕРВАЯ ОТРИСОВКА
  // ==========================================
  updateSlider(0);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootCasesSlider);
} else {
  bootCasesSlider();
}
