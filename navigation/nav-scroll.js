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

  // y вместо top — translateY работает на compositor'е без layout reflow.
  // top: 0vw в CSS остаётся → итоговая позиция = top(0) + translateY(4vw) = 4vw.
  compressTl.to(".nav-logo_img", {
    width: "62%",
    y: "4vw",
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
  // 3. РЕЖИМ НАВИГАЦИИ: scroll-driven ИЛИ static
  // ==========================================
  // Webflow body может иметь `data-nav-mode="static"` — выставляется в
  // Designer → Body → Element Settings → Custom Attributes на тех страницах,
  // где навигация должна сразу быть в «сжатом» виде (например /cases).
  // Static-режим:
  //   - НЕТ scroll-driven компрессии (плашка изначально в финальном виде:
  //     29vw, белая, лого внизу, profit видимый, иконки скрыты)
  //   - НЕТ инверсии над .stages (на этих страницах секции нет)
  //   - Меню по клику работает как обычно (open/close timeline)
  const isStaticNav = document.body?.dataset?.navMode === "static";

  // compressState нужен в обоих режимах:
  //   - scroll-driven: обновляется ScrollTrigger'ом, используется в closeMenu
  //     для возврата плашки в текущий scroll-state
  //   - static: фиксирован на 1, closeMenu никуда не двигает плашку
  const compressState = { progress: isStaticNav ? 1 : 0 };
  let menuOpen = false;

  if (isStaticNav) {
    // Сразу применяем финальное состояние, без анимации и без ScrollTrigger.
    compressTl.progress(1);
  } else {
    // ---- SCROLL-DRIVER: proxy.progress → compressTl ----
    // Скролл тянет proxy через scrub:1 → плавно, без «лесенки». Когда меню
    // открыто — игнорируем входящие апдейты, чтобы не перебивать клик-анимацию.
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


    // ---- ИНВЕРСИЯ НАВИГАЦИИ НАД БЕЖЕВОЙ СЕКЦИЕЙ ----
    const navInvertTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".stages",
        start: "top 85%",
        end: "top 25%",
        scrub: true
      }
    });

    // .to вместо .fromTo: на границе stages GSAP захватит текущее состояние
    // (которое compressTl уже оставил), не «пробивая» его форсированным from-value.
    // Так не появляется flicker, если compressTl ещё в анимации.
    navInvertTl.to(".menu_overlay-content",
      { backgroundColor: "#040101", duration: 1, immediateRender: false },
      0);

    navInvertTl.to(".menu_control-bar *",
      { color: "#ffffff", duration: 1, immediateRender: false },
      0);

    navInvertTl.to(".nav-btm, .nav-btm *",
      { color: "#000000", duration: 1, immediateRender: false },
      0);

    navInvertTl.to(".nav-logo_img",
      { filter: "invert(1)", duration: 1, immediateRender: false },
      0);

    navInvertTl.to(".nav-icon",
      { filter: "invert(0)", duration: 1, immediateRender: false },
      0);
  }


  // ==========================================
  // 5. КЛИК-МЕНЮ (открытие/закрытие)
  // ==========================================
  const menuBtn = document.querySelector(".nav-menu");
  const menuPanel = document.querySelector(".menu_dropdown-list");
  const menuTxt = document.querySelector(".nav-menu__txt");
  const menuIcon = document.querySelector(".menu-icon");
  const menuBackdrop = document.querySelector(".menu_backdrop");

  if (menuBtn && menuPanel) {
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
      // Длительность 0.95s + power2.inOut — мягкий растянутый переход
      // 57vw → 29vw, не «дёрганый» как при коротком 0.6s.
      if (needsCompress) {
        menuTl.to(compressTl, {
          progress: 1,
          duration: 0.95,
          ease: "power2.inOut",
          overwrite: true
        }, 0);
      }

      // ---- ШАГ 2: раскрытие дропдауна + радиус + бэкдроп ----
      // Перекрытие с компрессией (-0.2) — последняя четверть сжатия
      // и первая четверть раскрытия идут одновременно, переход цельный.
      const dropdownPos = needsCompress ? "-=0.2" : 0;

      menuTl.to(menuPanel, {
        height: "auto",
        opacity: 1,
        duration: 1.1,
        ease: "power2.out"
      }, dropdownPos);

      if (menuBackdrop) {
        menuTl.to(menuBackdrop, {
          opacity: 1,
          pointerEvents: "auto",
          duration: 0.9,
          ease: "power2.out"
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

      // ---- ШАГ 1: схлопывание дропдауна + бэкдроп (параллельно) ----
      menuTl.to(menuPanel, {
        height: 0,
        opacity: 0,
        duration: 0.75,
        ease: "power2.in"
      }, 0);

      if (menuBackdrop) {
        menuTl.to(menuBackdrop, {
          opacity: 0,
          pointerEvents: "none",
          duration: 0.7,
          ease: "power2.in"
        }, 0);
      }

      // ---- ШАГ 2: возврат компрессии к scroll-state ----
      // Если юзер у верха — плашка плавно «раскрывается обратно в дефолт»
      // 29vw → 57vw за 0.95s power2.inOut (то же длительность, что и при
      // открытии — закрытие ощущается как зеркало).
      // Если внизу — compressState.progress=1 → tween будет no-op.
      // Перекрытие с закрытием (-0.3): декомпрессия начинается, когда
      // дропдаун ещё на половине пути — переход цельный.
      menuTl.to(compressTl, {
        progress: compressState.progress,
        duration: 0.95,
        ease: "power2.inOut",
        overwrite: true
      }, "-=0.3");

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

    // Клик по любой ссылке внутри меню — закрыть (event delegation).
    // Один listener вместо N штук → дешевле и проще DOM tear-down.
    menuPanel.addEventListener("click", (e) => {
      if (e.target.closest(".nav_menu-link")) closeMenu();
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
