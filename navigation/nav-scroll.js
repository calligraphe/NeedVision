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

  // ЛОГО и NAV-BTM стартуют в pos=0 — это «нижняя группа».
  // Все изменения ВЕРХНЕЙ ЧАСТИ (плашка, текст, profit, инверсия иконок)
  // отложены на TOP_DELAY → к моменту начала покраски плашки лого уже
  // почти полностью «приземлилось» и не висит над ней визуально.
  //
  //   t=0        t=0.25   t=0.35       t=TD            t=TD+0.5    t=TD+0.8+stagger
  //   ├─ ЛОГО ───┤
  //   ├─ NAV-BTM (marginTop 0.7vw) ────┤
  //   ├─ HIDE icons/timer ┤
  //                                    ├─ ОВЕРЛЕЙ (width + bg) ──────┤
  //                                    ├─ ТЕКСТ control-bar (color) ─┤
  //                                    ├─ PROFIT badge ──────────────┤
  //                                    ├─ PROFIT items (stagger) ─────────────────┤
  //                                    ├─ NAV-ICON (invert) ─────┤
  const TOP_DELAY = 0.2;

  compressTl.to(".nav-logo_img", {
    width: "62%",
    top: "4vw",
    duration: 0.25,
    ease: "power2.out"
  }, 0);

  compressTl.to(".nav-btm", {
    marginTop: "0.55vw",
    duration: 0.35,
    ease: "power2.out"
  }, 0);

  compressTl.to(".menu_overlay-content", {
    width: "29vw",
    backgroundColor: "#ffffff",
    duration: 0.5,
    ease: "power2.out"
  }, TOP_DELAY);

  compressTl.to(".menu_control-bar *", {
    color: "#000000",
    duration: 0.5,
    ease: "power2.out"
  }, TOP_DELAY);

  compressTl.to(".menu_profit-badge", {
    width: "auto",
    opacity: 1,
    margin: "0 0.5vw",
    duration: 0.5,
    ease: "power2.out"
  }, TOP_DELAY);

  compressTl.to(".nav-profit-item", {
    opacity: 1,
    y: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "power2.out"
  }, TOP_DELAY);

  compressTl.to(".nav-icon", {
    filter: "invert(1)",
    duration: 0.4,
    ease: "power2.out"
  }, TOP_DELAY);

  // Иконки/таймер — плавный fade + одновременный коллапс высоты.
  // Высота уезжает в 0 параллельно с opacity, чтобы .nav_bar тоже
  // схлопнулся и не оставлял пустого отступа над плашкой.
  compressTl.to(".nav_left-icon, .nav_right-icon, .nav-timer", {
    opacity: 0,
    height: 0,
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
  const menuIcon = document.querySelector(".menu-icon");
  const menuBackdrop = document.querySelector(".menu_backdrop");

  if (menuBtn && menuPanel) {
    // Границы скругления плашки .menu_overlay-content при клике по меню.
    // Сейчас оба значения равны 1.5vw — фактически borderRadius не меняется.
    // Оставлены константы и tween'ы, чтобы быстро поменять при необходимости.
    const RADIUS_DEFAULT = "1.5vw";
    const RADIUS_OPEN    = "1.5vw";

    // Единый timeline, в котором живут оба сценария (open / close).
    // Каждый новый клик убивает предыдущий → нет наложений и рваных переходов.
    let menuTl = null;

    function openMenu() {
      menuOpen = true;
      if (menuTl) menuTl.kill();

      // Если плашка ещё не сжата (юзер у верха или на полпути) — сначала
      // визуально сжимаем её, и только ПОТОМ раскрываем дропдаун.
      // Если уже сжата (юзер проскроллил) — шаг компрессии пропускаем.
      const needsCompress = compressTl.progress() < 0.99;

      menuTl = gsap.timeline();

      // ---- ШАГ 1 (опционально): визуальное сжатие плашки ----
      if (needsCompress) {
        menuTl.to(compressTl, {
          progress: 1,
          duration: 0.6,
          ease: "power3.inOut",
          overwrite: true
        }, 0);
      }

      // ---- ШАГ 2: раскрытие дропдауна + радиус + бэкдроп ----
      // Лёгкое перекрытие с компрессией (-0.12) — плавный переход без зазора.
      const dropdownPos = needsCompress ? "-=0.12" : 0;

      menuTl.to(menuPanel, {
        height: "auto",
        opacity: 1,
        duration: 0.85,
        ease: "expo.out"
      }, dropdownPos);

      menuTl.to(".menu_overlay-content", {
        borderRadius: RADIUS_OPEN,
        duration: 0.7,
        ease: "power3.out"
      }, "<");

      if (menuBackdrop) {
        menuTl.to(menuBackdrop, {
          opacity: 1,
          pointerEvents: "auto",
          duration: 0.7,
          ease: "power3.out"
        }, "<");
      }

      // Иконка (CSS-class, GPU-анимация).
      if (menuIcon) {
        menuIcon.classList.add("is-open");
        menuIcon.setAttribute("aria-expanded", "true");
      }

      // Текст MENU → CLOSE — независимый short tween, не блокирует timeline.
      if (menuTxt) {
        gsap.to(menuTxt, {
          opacity: 0,
          duration: 0.2,
          ease: "power2.in",
          overwrite: "auto",
          onComplete: () => {
            menuTxt.textContent = "CLOSE";
            gsap.to(menuTxt, { opacity: 1, duration: 0.25, ease: "power2.out" });
          }
        });
      }
    }

    function closeMenu() {
      if (menuTl) menuTl.kill();

      // menuOpen=false ставим в onComplete всего timeline — пока идёт close,
      // scroll-onUpdate не перебивает наш tween на compressTl.
      menuTl = gsap.timeline({
        onComplete: () => { menuOpen = false; }
      });

      // ---- ШАГ 1: схлопывание дропдауна + радиус + бэкдроп (параллельно) ----
      menuTl.to(menuPanel, {
        height: 0,
        opacity: 0,
        duration: 0.55,
        ease: "expo.in"
      }, 0);

      menuTl.to(".menu_overlay-content", {
        borderRadius: RADIUS_DEFAULT,
        duration: 0.55,
        ease: "power3.inOut"
      }, 0);

      if (menuBackdrop) {
        menuTl.to(menuBackdrop, {
          opacity: 0,
          pointerEvents: "none",
          duration: 0.5,
          ease: "power3.in"
        }, 0);
      }

      // ---- ШАГ 2: возврат компрессии к scroll-state ----
      // Если юзер у верха — плашка плавно «раскрывается обратно в дефолт».
      // Если внизу — compressState.progress=1 → tween будет no-op.
      // Лёгкое перекрытие с закрытием (-0.18), чтобы переход ощущался как
      // один цельный жест, а не два рывка.
      menuTl.to(compressTl, {
        progress: compressState.progress,
        duration: 0.65,
        ease: "power3.inOut",
        overwrite: true
      }, "-=0.18");

      // Иконка (CSS-class).
      if (menuIcon) {
        menuIcon.classList.remove("is-open");
        menuIcon.setAttribute("aria-expanded", "false");
      }

      // Текст CLOSE → MENU
      if (menuTxt) {
        gsap.to(menuTxt, {
          opacity: 0,
          duration: 0.2,
          ease: "power2.in",
          overwrite: "auto",
          onComplete: () => {
            menuTxt.textContent = "Menu";
            gsap.to(menuTxt, { opacity: 1, duration: 0.25, ease: "power2.out" });
          }
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
