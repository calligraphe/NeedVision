/**
 * NEED.VISION — Анимация навигации при скролле + клик-меню
 * ========================================================
 *
 * Что делает: при скролле страницы сжимает верхнюю навигацию в компактную
 *             белую плашку, показывает PROFIT-счётчик, инвертирует цвета
 *             над тёмной секцией `.stages`, плюс открывает/закрывает
 *             выпадающее меню (кнопка `.nav-menu` ↔ панель `.menu_overlay-content`).
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *   - ScrollTrigger
 *
 * Webflow селекторы:
 *   - .container__1440px       — внешний контейнер навигации
 *   - .container__1440px *     — все потомки (меняют цвет текста)
 *   - .case__link              — ссылка-кейс в навигации
 *   - .nav-menu                — кнопка-триггер меню
 *   - .nav-menu__txt           — подпись кнопки меню (MENU ↔ CLOSE)
 *   - .nav-menu__img           — иконка кнопки меню (поворот на 45°)
 *   - .nav-profit              — обёртка PROFIT-счётчика (раскрывается)
 *   - .nav-profit-item         — пункты PROFIT-счётчика
 *   - .nav_left-icon           — левая иконка нав-бара (скрывается)
 *   - .nav_right-icon          — правая иконка нав-бара (скрывается)
 *   - .nav-timer               — таймер (скрывается)
 *   - .nav-left                — левая колонка нав-бара (сжимает gap)
 *   - .nav_right               — правая колонка нав-бара (сжимает gap)
 *   - .nav_lleft-wrapper       — внутренний враппер (сжимает gap)
 *   - .nav_left-inner          — внутренний враппер левой колонки (сжимает gap 2vw → 0)
 *   - .nav-logo_img            — лого (меняет ширину и top)
 *   - .nav-icon                — иконки (инвертируются)
 *   - .nav-btm, .nav-btm *     — нижняя строка (инверсия над .stages)
 *   - .menu_overlay-content    — выпадающая панель меню
 *   - .menu_close-trigger      — закрывающий триггер внутри меню
 *   - .menu_backdrop           — затемняющая подложка под меню
 *   - .nav_menu-link           — ссылки внутри меню (клик закрывает)
 *   - .stages                  — тёмная секция (триггер инверсии)
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/navigation/nav-scroll.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---- Проверка зависимостей ----
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] nav-scroll.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("[Need Vision] nav-scroll.js: ScrollTrigger не загружен");
    return;
  }

  // ---- Проверка наличия навигации ----
  const navContainer = document.querySelector(".container__1440px");
  if (!navContainer) return;

  gsap.registerPlugin(ScrollTrigger);

  // ==========================================
  // 1. ПРЕДУСТАНОВКА
  // ==========================================

  // PROFIT-счётчик изначально скрыт
  gsap.set(".nav-profit", {
    opacity: 0,
    width: 0,
    overflow: "hidden",
    whiteSpace: "nowrap"
  });

  gsap.set(".nav-profit-item", {
    opacity: 0,
    y: 10
  });

  // Меню изначально схлопнуто
  gsap.set(".menu_overlay-content", {
    height: 0,
    opacity: 0
  });

  // Backdrop изначально невидим и не кликабелен
  gsap.set(".menu_backdrop", {
    opacity: 0,
    pointerEvents: "none"
  });


  // ==========================================
  // 2. ОСНОВНОЙ ТАЙМЛАЙН СКРОЛЛА
  // ==========================================
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "+=800",
      scrub: 1,
    }
  });


  // ==========================================
  // 3. КОНТЕЙНЕР ПРЕВРАЩАЕТСЯ В ПЛАШКУ
  // ==========================================
  tl.to(".container__1440px", {
    maxWidth: "28vw",
    backgroundColor: "#ffffff",
    borderRadius: "1.5vw",
    paddingTop: "0.5vw",
    paddingBottom: "0.5vw",
    paddingLeft: "1vw",
    paddingRight: "1vw",
    margin: "0.7vw auto 0 auto",
    duration: 0.4
  }, 0)

    .to(".container__1440px *", {
      color: "#000000",
      duration: 0.4
    }, 0)

    .to(".case__link, .nav-menu, .nav-menu__txt, .nav-profit, .nav-profit-item", {
      fontSize: "0.7vw",
      duration: 0.4
    }, 0)


    // ==========================================
    // 4. ИСЧЕЗАЮЩИЕ ЭЛЕМЕНТЫ
    // ==========================================
    .to(".nav_left-icon", {
      width: 0, height: 0, opacity: 0,
      duration: 0.4
    }, 0)

    .to(".nav_right-icon", {
      width: 0, height: 0, opacity: 0,
      duration: 0.4
    }, 0)

    .to(".nav-timer", {
      width: 0, height: 0, opacity: 0,
      duration: 0.4
    }, 0)


    // ==========================================
    // 5. СЖИМАЕМ GAP'Ы
    // ==========================================
    .to(".nav-left", {
      gap: "0vw",
      duration: 0.4
    }, 0)

    .to(".nav_right", {
      gap: "0vw",
      duration: 0.4
    }, 0)

    .to(".nav_lleft-wrapper", {
      gap: "0vw",
      duration: 0.4
    }, 0)

    .to(".nav_left-inner", {
      gap: "0vw",
      duration: 0.4
    }, 0)


    // ==========================================
    // 6. ПОЯВЛЕНИЕ PROFIT-СЧЁТЧИКА
    // ==========================================
    .to(".nav-profit", {
      width: "auto",
      opacity: 1,
      margin: "0 1vw",
      duration: 0.4
    }, 0)

    .to(".nav-profit-item", {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.15,
      ease: "power2.out"
    }, 0)


    // ==========================================
    // 7. ЛОГОТИП NEED.VISION
    // ==========================================
    .to(".nav-logo_img", {
      width: "62%",
      top: "4vw",
      duration: 0.5,
      ease: "power2.out"
    }, 0)


    // ==========================================
    // 8. ИНВЕРСИЯ ИКОНОК
    // ==========================================
    .to(".nav-icon", {
      filter: "invert(1)",
      duration: 0.4
    }, 0);


  // ==========================================
  // 9. ИНВЕРСИЯ НАВИГАЦИИ НАД БЕЛЫМ ФОНОМ (Stages)
  // ==========================================
  const navInvertTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".stages",
      start: "top 85%",
      end: "top 25%",
      scrub: true
    }
  });

  navInvertTl.fromTo(".container__1440px",
    { backgroundColor: "#ffffff" },
    { backgroundColor: "#040101", duration: 1, immediateRender: false },
    0);

  navInvertTl.fromTo(".container__1440px *",
    { color: "#000000" },
    { color: "#ffffff", duration: 1, immediateRender: false },
    0);

  navInvertTl.fromTo(".nav-btm, .nav-btm *",
    { color: "#ffffff" },
    { color: "#000000", duration: 1, immediateRender: false },
    0);

  navInvertTl.fromTo(".nav-logo_img",
    { filter: "invert(0)" },
    { filter: "invert(1)", duration: 1, immediateRender: false },
    0);

  navInvertTl.fromTo(".nav-icon",
    { filter: "invert(1)" },
    { filter: "invert(0)", duration: 1, immediateRender: false },
    0);


  // ==========================================
  // 10. КЛИК-МЕНЮ (открытие/закрытие)
  // ==========================================
  const menuBtn = document.querySelector('.nav-menu');
  const menuPanel = document.querySelector('.menu_overlay-content');
  const menuTxt = document.querySelector('.nav-menu__txt');
  const menuIcon = document.querySelector('.nav-menu__img');
  const menuClose = document.querySelector('.menu_close-trigger');
  const menuBackdrop = document.querySelector('.menu_backdrop');

  if (menuBtn && menuPanel) {
    let isOpen = false;

    function openMenu() {
      isOpen = true;

      // Разворачиваем панель
      gsap.to(menuPanel, {
        height: "auto",
        opacity: 1,
        duration: 0.6,
        ease: "power3.out"
      });

      // Backdrop появляется вместе с меню
      if (menuBackdrop) {
        gsap.to(menuBackdrop, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
          pointerEvents: "auto"
        });
      }

      // MENU → CLOSE на верхней кнопке
      gsap.to(menuTxt, {
        opacity: 0,
        duration: 0.15,
        onComplete: () => {
          menuTxt.textContent = "CLOSE";
          gsap.to(menuTxt, { opacity: 1, duration: 0.15 });
        }
      });

      if (menuIcon) {
        gsap.to(menuIcon, {
          rotation: 45,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    }

    function closeMenu() {
      isOpen = false;

      // Сворачиваем панель
      gsap.to(menuPanel, {
        height: 0,
        opacity: 0,
        duration: 0.5,
        ease: "power3.in"
      });

      // Backdrop исчезает вместе с меню
      if (menuBackdrop) {
        gsap.to(menuBackdrop, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
          pointerEvents: "none"
        });
      }

      // CLOSE → MENU
      gsap.to(menuTxt, {
        opacity: 0,
        duration: 0.15,
        onComplete: () => {
          menuTxt.textContent = "MENU";
          gsap.to(menuTxt, { opacity: 1, duration: 0.15 });
        }
      });

      if (menuIcon) {
        gsap.to(menuIcon, {
          rotation: 0,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    }

    // Клик по верхней кнопке MENU/CLOSE
    menuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      isOpen ? closeMenu() : openMenu();
    });

    // Клик по menu_close-trigger (внутри развёрнутого меню)
    if (menuClose) {
      menuClose.addEventListener('click', (e) => {
        e.preventDefault();
        if (isOpen) closeMenu();
      });
    }

    // Клик по backdrop — закрыть
    if (menuBackdrop) {
      menuBackdrop.addEventListener('click', () => {
        if (isOpen) closeMenu();
      });
    }

    // Esc — закрыть
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    // Клик по ссылке меню — закрыть
    const links = menuPanel.querySelectorAll('.nav_menu-link');
    links.forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });
  }
});
