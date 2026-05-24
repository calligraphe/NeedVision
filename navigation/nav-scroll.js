/**
 * NEED.VISION — Анимация навигации при скролле + клик-меню
 * ========================================================
 *
 * Что делает: при скролле страницы плавно сжимает плашку меню
 *             `.menu_overlay-content` (57vw → 28vw), красит
 *             `.menu_control-bar` в белый с чёрным текстом, раскрывает
 *             PROFIT-счётчик и сжимает логотип в `.nav-btm`. Над тёмной
 *             секцией `.stages` делает повторную инверсию цветов.
 *             Клик по `.nav-menu` — экстренно переводит верх в «сжатое»
 *             состояние и раскрывает `.menu_dropdown-list` (height 0 → auto).
 *
 * Зависимости:
 *   - GSAP 3.12.x
 *   - ScrollTrigger
 *
 * Webflow селекторы:
 *   - .menu_overlay-content    — плашка меню (57vw → 28vw на скролле)
 *   - .menu_control-bar        — верхняя пилюля (бел. фон, чёрный текст)
 *   - .menu_dropdown-list      — выпадающая часть (height 0 ↔ auto)
 *   - .menu_profit-badge       — обёртка PROFIT-счётчика (раскрывается)
 *   - .nav-profit-item         — пункты PROFIT-счётчика (стаггер вверх)
 *   - .nav-menu                — кнопка-триггер меню
 *   - .nav-menu__txt           — подпись кнопки (Menu ↔ Close)
 *   - .nav-menu__img           — иконка кнопки (поворот 45°)
 *   - .nav_left-icon           — левая иконка нав-бара (скрывается)
 *   - .nav_right-icon          — правая иконка нав-бара (скрывается)
 *   - .nav-timer               — таймер (скрывается)
 *   - .nav-logo_img            — лого в `.nav-btm` (ширина и top)
 *   - .nav-icon                — иконки (инвертируются)
 *   - .nav-btm, .nav-btm *     — нижняя строка (инверсия над .stages)
 *   - .menu_backdrop           — затемняющая подложка под меню
 *   - .nav_menu-link           — ссылки внутри меню (клик закрывает)
 *   - .stages                  — бежевая секция (триггер инверсии)
 *
 * Подключение:
 *   <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/navigation/nav-scroll.js"></script>
 */

function bootNavScroll() {
  // ---- Проверка зависимостей ----
  if (typeof gsap === "undefined") {
    console.warn("[Need Vision] nav-scroll.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("[Need Vision] nav-scroll.js: ScrollTrigger не загружен");
    return;
  }

  // ---- Проверка наличия меню ----
  const overlay = document.querySelector(".menu_overlay-content");
  if (!overlay) return;

  gsap.registerPlugin(ScrollTrigger);

  // ==========================================
  // 1. ПРЕДУСТАНОВКА
  // ==========================================

  // PROFIT-счётчик скрыт по умолчанию (раскроется на скролле/открытии меню).
  gsap.set(".menu_profit-badge", {
    opacity: 0,
    width: 0,
    overflow: "hidden",
    whiteSpace: "nowrap"
  });

  gsap.set(".nav-profit-item", {
    opacity: 0,
    y: 20
  });

  // Дропдаун меню схлопнут.
  gsap.set(".menu_dropdown-list", {
    height: 0,
    opacity: 0
  });

  // Backdrop невидим и не кликабелен.
  gsap.set(".menu_backdrop", {
    opacity: 0,
    pointerEvents: "none"
  });

  // У .menu_overlay-content в CSS нет явного bg — задаём прозрачно-белый,
  // чтобы дальнейший tween в #ffffff корректно интерполировал альфу.
  gsap.set(".menu_overlay-content", {
    backgroundColor: "rgba(255,255,255,0)"
  });


  // ==========================================
  // 2. ТАЙМЛАЙН СЖАТИЯ (paused — управляется снаружи)
  // ==========================================
  // Один таймлайн обслуживает оба источника:
  //   - скролл двигает progress через proxy + scrub,
  //   - клик по меню «экстренно» форсит progress в 1.
  const compressTl = gsap.timeline({ paused: true });

  // Все tween'ы стартуют в позиции 0 — едут параллельно, но с разной
  // длительностью. Лого ВСЕГО ~0.25s → успевает «приземлиться» до того,
  // как плашка завершит покраску. Этим лого не пересекается визуально
  // с верхней частью на этапе её перекраса.
  //
  //   t=0       t=0.25     t=0.35   t=0.5         t=1.1
  //   ├─ ЛОГО ──┤
  //   ├─ NAV-BTM (marginTop 0.7vw) ──┤
  //   ├─ ОВЕРЛЕЙ (width + bg) ──────────┤
  //   ├─ ТЕКСТ control-bar (color) ─────┤
  //   ├─ PROFIT badge (width+opacity) ──┤
  //   ├─ NAV-ICON (filter invert) ──┤
  //   ├─ HIDE left/right/timer ─────┤
  //   ├─ PROFIT items (stagger) ────────────────────────┤

  compressTl.to(".nav-logo_img", {
    width: "62%",
    top: "4vw",
    duration: 0.25,
    ease: "power2.out"
  }, 0);

  compressTl.to(".nav-btm", {
    marginTop: "0.7vw",
    duration: 0.35,
    ease: "power2.out"
  }, 0);

  compressTl.to(".menu_overlay-content", {
    width: "29vw",
    backgroundColor: "#ffffff",
    duration: 0.5,
    ease: "power2.out"
  }, 0);

  compressTl.to(".menu_control-bar *", {
    color: "#000000",
    duration: 0.5,
    ease: "power2.out"
  }, 0);

  compressTl.to(".menu_profit-badge", {
    width: "auto",
    opacity: 1,
    margin: "0 0.5vw",
    duration: 0.5,
    ease: "power2.out"
  }, 0);

  compressTl.to(".nav-profit-item", {
    opacity: 1,
    y: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "power2.out"
  }, 0);

  compressTl.to(".nav-icon", {
    filter: "invert(1)",
    duration: 0.4,
    ease: "power2.out"
  }, 0);

  // Иконки/таймер — плавный fade-out в первые ~100px скролла (≈0.125
  // прогресса от полного таймлайна 1.1s). Размеры не схлопываем — это
  // вызывало «дёргание». Просто уходим в прозрачность.
  compressTl.to(".nav_left-icon, .nav_right-icon, .nav-timer", {
    opacity: 0,
    duration: 0.15,
    ease: "power2.out"
  }, 0);


  // ==========================================
  // 3. СКРОЛЛ-ДРАЙВЕР: proxy.progress → compressTl
  // ==========================================
  // Скролл тянет proxy через scrub:1 → плавно, без «лесенки». Когда меню
  // открыто — игнорируем входящие апдейты, чтобы не перебивать клик-анимацию.
  const compressState = { progress: 0 };
  let menuOpen = false;

  gsap.to(compressState, {
    progress: 1,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "+=800",
      scrub: 1
    },
    onUpdate: () => {
      if (!menuOpen) {
        compressTl.progress(compressState.progress);
      }
    }
  });


  // ==========================================
  // 4. ИНВЕРСИЯ НАВИГАЦИИ НАД БЕЖЕВОЙ СЕКЦИЕЙ
  // ==========================================
  const navInvertTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".stages",
      start: "top 85%",
      end: "top 25%",
      scrub: true
    }
  });

  navInvertTl.fromTo(".menu_overlay-content",
    { backgroundColor: "#ffffff" },
    { backgroundColor: "#040101", duration: 1, immediateRender: false },
    0);

  navInvertTl.fromTo(".menu_control-bar *",
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
  // 5. КЛИК-МЕНЮ (открытие/закрытие)
  // ==========================================
  const menuBtn = document.querySelector(".nav-menu");
  const menuPanel = document.querySelector(".menu_dropdown-list");
  const menuTxt = document.querySelector(".nav-menu__txt");
  const menuIcon = document.querySelector(".nav-menu__img");
  const menuBackdrop = document.querySelector(".menu_backdrop");

  if (menuBtn && menuPanel) {
    function openMenu() {
      menuOpen = true;

      // Экстренно догоняем «сжатое» состояние, даже если юзер у верха страницы.
      gsap.to(compressTl, {
        progress: 1,
        duration: 0.35,
        ease: "power2.out",
        overwrite: true
      });

      // Раскрываем дропдаун.
      gsap.to(menuPanel, {
        height: "auto",
        opacity: 1,
        duration: 0.6,
        ease: "power3.out"
      });

      if (menuBackdrop) {
        gsap.to(menuBackdrop, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
          pointerEvents: "auto"
        });
      }

      // MENU → CLOSE на верхней кнопке.
      if (menuTxt) {
        gsap.to(menuTxt, {
          opacity: 0,
          duration: 0.15,
          onComplete: () => {
            menuTxt.textContent = "CLOSE";
            gsap.to(menuTxt, { opacity: 1, duration: 0.15 });
          }
        });
      }

      if (menuIcon) {
        gsap.to(menuIcon, {
          rotation: 45,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    }

    function closeMenu() {
      // menuOpen снимаем по завершению tween'а компрессии, чтобы scroll-onUpdate
      // не «перебил» возврат в нужный progress по дороге.

      gsap.to(menuPanel, {
        height: 0,
        opacity: 0,
        duration: 0.5,
        ease: "power3.in"
      });

      if (menuBackdrop) {
        gsap.to(menuBackdrop, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
          pointerEvents: "none"
        });
      }

      // Возвращаемся к состоянию, диктуемому скроллом (если юзер у верха — к 0).
      gsap.to(compressTl, {
        progress: compressState.progress,
        duration: 0.4,
        ease: "power2.out",
        overwrite: true,
        onComplete: () => { menuOpen = false; }
      });

      // CLOSE → MENU
      if (menuTxt) {
        gsap.to(menuTxt, {
          opacity: 0,
          duration: 0.15,
          onComplete: () => {
            menuTxt.textContent = "Menu";
            gsap.to(menuTxt, { opacity: 1, duration: 0.15 });
          }
        });
      }

      if (menuIcon) {
        gsap.to(menuIcon, {
          rotation: 0,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    }

    // Клик по верхней кнопке Menu/Close
    menuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      menuOpen ? closeMenu() : openMenu();
    });

    // Клик по затемняющей подложке — закрыть
    if (menuBackdrop) {
      menuBackdrop.addEventListener("click", () => {
        if (menuOpen) closeMenu();
      });
    }

    // Esc — закрыть
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuOpen) closeMenu();
    });

    // Клик по любой ссылке внутри меню — закрыть
    const links = menuPanel.querySelectorAll(".nav_menu-link");
    links.forEach(link => {
      link.addEventListener("click", () => {
        closeMenu();
      });
    });
  }
}

// Универсальный запуск: если DOM ещё парсится — ждём, иначе стартуем сразу.
// Покрывает случай, когда CDN отдаёт скрипт уже после DOMContentLoaded.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootNavScroll);
} else {
  bootNavScroll();
}
