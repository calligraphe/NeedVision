/**
 * NEED.VISION — Слайдер команды (Swiper версия)
 * =============================================
 *
 * Что делает: Swiper-карусель карточек команды с центрированием активного
 *             слайда и плавной «барабанной» сменой текста роли и цитаты
 *             через GSAP — старый текст уходит вверх и исчезает, новый
 *             появляется снизу.
 *
 * ⚠ Это СТАРАЯ версия слайдера. Новая (без Swiper, с замером слотов)
 *    лежит в `sliders/team-slider.js`. Сверь, какая сейчас актуальна,
 *    и подключай только одну из двух — иначе они подерутся за DOM.
 *
 * Зависимости:
 *   - Swiper 11
 *     <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
 *     <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
 *   - GSAP 3.12.x
 *
 * Webflow селекторы:
 *   - .swiper                — корневой контейнер Swiper
 *   - .hidden-role           — скрытый блок с ролью внутри слайда (источник)
 *   - .hidden-quote          — скрытый блок с цитатой внутри слайда (источник)
 *   - .team_role-title       — «монитор» роли (куда вставлять текст)
 *   - .team_quote-text       — «монитор» цитаты (куда вставлять текст)
 *
 * Атрибуты в Webflow:
 *   - Можно раскомментировать `navigation` ниже и подключить
 *     `.team_nav-next` / `.team_nav-prev`.
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sliders/team-slider-swiper.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof Swiper === "undefined") {
    console.warn("[Need Vision] team-slider-swiper.js: Swiper не загружен");
    return;
  }
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] team-slider-swiper.js: GSAP не загружен");
    return;
  }

  // ---- Проверка наличия слайдера ----
  const sliderEl = document.querySelector('.swiper');
  if (!sliderEl) return;

  // ---- Тайминги ----
  const SLIDE_SPEED = 600;       // плавность Swiper-переключения
  const SPACE_BETWEEN = 40;      // расстояние между карточками

  // ---- Инициализация Swiper ----
  const teamSwiper = new Swiper('.swiper', {
    slidesPerView: 'auto',      // ширина слайдов определяется CSS
    centeredSlides: true,       // активный слайд всегда по центру
    spaceBetween: SPACE_BETWEEN,
    grabCursor: true,
    slideToClickedSlide: true,  // клик по соседней карточке ставит её в центр
    speed: SLIDE_SPEED,
    // navigation: {
    //   nextEl: '.team_nav-next',
    //   prevEl: '.team_nav-prev',
    // },
  });

  // ---- Барабанная смена текста при свайпе ----
  teamSwiper.on('slideChange', function () {
    // 1. Текущий активный слайд
    const activeSlide = teamSwiper.slides[teamSwiper.activeIndex];

    // 2. Достаём новые тексты из скрытого блока
    const newRole = activeSlide.querySelector('.hidden-role')?.innerText || '';
    const newQuote = activeSlide.querySelector('.hidden-quote')?.innerText || '';

    // 3. «Мониторы», куда вставляем текст
    const roleMonitor = document.querySelector('.team_role-title');
    const quoteMonitor = document.querySelector('.team_quote-text');

    // 4. GSAP таймлайн: барабанная смена
    const tl = gsap.timeline();

    // Уводим старый текст ВВЕРХ
    tl.to([roleMonitor, quoteMonitor], {
      y: -20,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in"
    });

    // Мгновенно подменяем содержимое (пока невидимо)
    tl.call(() => {
      if (roleMonitor) roleMonitor.innerText = newRole;
      if (quoteMonitor) quoteMonitor.innerText = newQuote;
    });

    // Телепортируем ВНИЗ и поднимаем в исходную позицию
    tl.set([roleMonitor, quoteMonitor], { y: 20 });
    tl.to([roleMonitor, quoteMonitor], {
      y: 0,
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    });
  });
});
