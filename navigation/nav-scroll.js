/**
 * Навигация: сжатие плашки на скролле + клик-меню.
 *
 * На скролле плашка .menu_overlay-content сжимается 57vw → 29vw, белеет,
 * показывается profit-счётчик, лого опускается. Над .stages цвета
 * инвертируются. По клику .nav-menu — экстренно дожимает плашку (если
 * юзер у верха) и раскрывает .menu_dropdown-list.
 *
 * На внутренних страницах (например /cases) навигация должна быть сразу
 * в «сжатом» виде без scroll-анимации. Для этого на <body> ставится
 * атрибут data-nav-mode="static" (Webflow → Body → Element Settings →
 * Custom Attributes). Меню по клику работает обычно в обоих режимах.
 *
 * Архитектура:
 *  — DOM-кэш (querySelector в init, дальше прямые ссылки);
 *  — снятие data-w-id со ВСЕХ затронутых элементов (Webflow IX2
 *    параллельно ставит свои transform/opacity → конфликт с GSAP →
 *    «призраки» при reverse через scrub);
 *  — один compressTl (paused, управляется scroll-proxy или click);
 *  — навInvertTl (scrub, инверсия цветов над .stages);
 *  — applyInvertState при открытии меню в зоне инверсии;
 *  — throttled scroll-listener с флагом для force-reset на scroll<50.
 */

function bootNavScroll() {
  if (typeof gsap === "undefined") {
    console.warn("nav-scroll.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("nav-scroll.js: ScrollTrigger не загружен");
    return;
  }

  const overlay = document.querySelector(".menu_overlay-content");
  if (!overlay) return;

  gsap.registerPlugin(ScrollTrigger);


  // ---- DOM-кэш ----
  const $logo         = document.querySelector(".nav-logo_img");
  const $logoWrap     = document.querySelector(".nav-logo");
  const $navBtm       = document.querySelector(".nav-btm");
  const $navBar       = document.querySelector(".nav_bar");
  const $profitBadge  = document.querySelector(".menu_profit-badge");
  const $profitItems  = gsap.utils.toArray(".nav-profit-item");
  const $navIcon      = document.querySelector(".nav-icon");
  const $controlBar   = document.querySelector(".menu_control-bar");
  const $controlBarChildren = gsap.utils.toArray(".menu_control-bar *");
  const $sideIcons    = gsap.utils.toArray(".nav_left-icon, .nav_right-icon, .nav-timer");
  const $navBtmAll    = gsap.utils.toArray(".nav-btm, .nav-btm *");
  const $menuPanel    = document.querySelector(".menu_dropdown-list");
  const $menuBackdrop = document.querySelector(".menu_backdrop");
  const $menuBtn      = document.querySelector(".nav-menu");
  const $menuTxt      = document.querySelector(".nav-menu__txt");
  const $menuIcon     = document.querySelector(".menu-icon");


  // ---- Снять Webflow IX2 со ВСЕХ nav-элементов ----
  // IX2 параллельно с GSAP ставит свои transform/opacity → при reverse
  // через scrub браузер рендерит ДВА состояния одновременно (тот что от
  // IX2 + тот что от GSAP), отсюда «призрак логотипа».
  const ix2Targets = [
    overlay, $logo, $logoWrap, $navBtm, $navBar, $profitBadge,
    $navIcon, $controlBar, $menuPanel, $menuBackdrop, $menuBtn,
    $menuTxt, $menuIcon,
    ...$profitItems, ...$controlBarChildren, ...$sideIcons, ...$navBtmAll
  ];
  ix2Targets.forEach((el) => el?.removeAttribute?.("data-w-id"));


  // ---- GPU-слой для лого (без артефактов на scrub-reverse) ----
  // translateZ(0) форсит постоянный composite layer → браузер не
  // пересоздаёт слой при каждом scroll-update, нет flash/ghost.
  if ($logo) {
    $logo.style.willChange = "transform, width";
    $logo.style.backfaceVisibility = "hidden";
    $logo.style.transform = "translateZ(0)";
  }


  // ---- Стартовое состояние ----
  gsap.set($profitBadge, {
    opacity: 0,
    width: 0,
    overflow: "hidden",
    whiteSpace: "nowrap"
  });
  gsap.set($profitItems, { opacity: 0, y: 20 });
  gsap.set($menuPanel, { height: 0, opacity: 0 });
  gsap.set($menuBackdrop, { opacity: 0, pointerEvents: "none" });
  // У overlay в Webflow нет explicit bg — задаём прозрачно-белый,
  // чтобы tween в #ffffff корректно интерполировал альфу.
  gsap.set(overlay, { backgroundColor: "rgba(255,255,255,0)" });


  // ---- Compress timeline (paused, управляется снаружи) ----
  // Один таймлайн обслуживает scroll и клик меню:
  //   — скролл двигает progress через proxy + scrub;
  //   — клик меню форсит progress = 1.
  // Лого стартует сразу (pos 0). Плашка, текст, profit, инверсия —
  // на TOP_DELAY, чтобы лого успело «приземлиться» до перекраски.
  const compressTl = gsap.timeline({ paused: true });
  const TOP_DELAY = 0.2;

  compressTl.to($logo, {
    width: "62%",
    y: "4vw",
    duration: 0.35,
    ease: "expo.out"
  }, 0);

  compressTl.to($navBtm, {
    marginTop: "0.55vw",
    duration: 0.45,
    ease: "expo.out"
  }, 0);

  compressTl.to($sideIcons, {
    opacity: 0,
    height: 0,
    duration: 0.25,
    ease: "sine.inOut"
  }, 0);

  compressTl.to(overlay, {
    width: "29vw",
    backgroundColor: "#ffffff",
    duration: 0.65,
    ease: "expo.out"
  }, TOP_DELAY);

  compressTl.to($controlBarChildren, {
    color: "#000000",
    duration: 0.6,
    ease: "sine.inOut"
  }, TOP_DELAY);

  compressTl.to($profitBadge, {
    width: "auto",
    opacity: 1,
    margin: "0 0.5vw",
    duration: 0.65,
    ease: "expo.out"
  }, TOP_DELAY);

  compressTl.to($profitItems, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    stagger: 0.1,
    ease: "expo.out"
  }, TOP_DELAY);

  compressTl.to($navIcon, {
    filter: "invert(1)",
    duration: 0.5,
    ease: "sine.inOut"
  }, TOP_DELAY);


  // ---- Режим: scroll-driven или static ----
  const isStaticNav = document.body?.dataset?.navMode === "static";
  const compressState = { progress: isStaticNav ? 1 : 0 };
  let menuOpen = false;
  let navInvertTl = null;

  if (isStaticNav) {
    compressTl.progress(1);
  } else {
    // Scroll-driven compress. scrub 1.8 даёт плавность поверх Lenis.
    gsap.to(compressState, {
      progress: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "+=1280",
        scrub: 1.8
      },
      onUpdate: () => {
        if (!menuOpen) compressTl.progress(compressState.progress);
      }
    });

    // Инверсия над .stages (бежевая секция).
    // .to (а не .fromTo) — захватываем текущее состояние, не пробивая
    // forced from-value поверх compressTl.
    navInvertTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".stages",
        start: "top 90%",
        end: "top 15%",
        scrub: 1.8
      }
    });

    navInvertTl.to(overlay,
      { backgroundColor: "#040101", duration: 1, immediateRender: false }, 0);
    navInvertTl.to($controlBarChildren,
      { color: "#ffffff", duration: 1, immediateRender: false }, 0);
    navInvertTl.to($navBtmAll,
      { color: "#000000", duration: 1, immediateRender: false }, 0);
    navInvertTl.to($logo,
      { filter: "invert(1)", duration: 1, immediateRender: false }, 0);
    navInvertTl.to($navIcon,
      { filter: "invert(0)", duration: 1, immediateRender: false }, 0);


    // ---- Throttled force-reset при jump в top ----
    // Кнопка «вверх» / lenis.scrollTo(0) прыгает в начало быстро,
    // но scrub:1.8 догоняет ещё ~2с — плашка зависает в полу-state.
    // Throttle через rAF + флаг → gsap.to() стрельбает ровно один
    // раз при пересечении границы scrollY=50.
    let scrollTickScheduled = false;
    let forcedReset = false;

    function onScrollCheck() {
      if (window.scrollY < 50) {
        if (forcedReset) return;
        forcedReset = true;

        if (compressTl.progress() > 0.05) {
          compressTl.progress(0);
          compressState.progress = 0;
        }
        if (navInvertTl?.scrollTrigger?.progress > 0.05) {
          gsap.to(overlay,             { backgroundColor: "#ffffff", duration: 0.4, overwrite: "auto" });
          gsap.to($controlBarChildren, { color: "#000000",            duration: 0.4, overwrite: "auto" });
          gsap.to($logo,               { filter: "invert(0)",         duration: 0.4, overwrite: "auto" });
          gsap.to($navIcon,            { filter: "invert(1)",         duration: 0.4, overwrite: "auto" });
        }
      } else {
        forcedReset = false;
      }
    }

    window.addEventListener("scroll", () => {
      if (scrollTickScheduled) return;
      scrollTickScheduled = true;
      requestAnimationFrame(() => {
        scrollTickScheduled = false;
        onScrollCheck();
      });
    }, { passive: true });
  }


  // ---- Override инверсии при открытом меню ----
  // Над .stages плашка чёрная с белым текстом. При открытии меню в
  // этой зоне возвращаем светлый вид; при закрытии — обратно в dark.
  const INVERT_DARK  = { bg: "#040101", color: "#ffffff", logo: "invert(1)", icon: "invert(0)" };
  const INVERT_LIGHT = { bg: "#ffffff", color: "#000000", logo: "invert(0)", icon: "invert(1)" };
  const INVERT_OVERRIDE_DURATION = 1.4;

  function applyInvertState(state) {
    const opts = { duration: INVERT_OVERRIDE_DURATION, ease: "expo.out", overwrite: "auto" };
    gsap.to(overlay,              { ...opts, backgroundColor: state.bg });
    gsap.to($controlBarChildren,  { ...opts, color: state.color });
    gsap.to($logo,                { ...opts, filter: state.logo });
    gsap.to($navIcon,             { ...opts, filter: state.icon });
  }

  function isInInvertZone() {
    return !!navInvertTl?.scrollTrigger && navInvertTl.scrollTrigger.progress > 0.5;
  }


  // ---- Меню (открытие/закрытие) ----
  if ($menuBtn && $menuPanel) {
    let menuTl = null;

    function openMenu() {
      menuOpen = true;
      if (menuTl) menuTl.kill();

      if (isInInvertZone()) applyInvertState(INVERT_LIGHT);

      const needsCompress = compressTl.progress() < 0.99;
      menuTl = gsap.timeline();

      if (needsCompress) {
        menuTl.to(compressTl, {
          progress: 1,
          duration: 1.4,
          ease: "power3.inOut",
          overwrite: true
        }, 0);
      }

      // -0.5 перекрытие: последняя треть сжатия и первая треть
      // раскрытия одновременно — без зазора.
      const dropdownPos = needsCompress ? "-=0.5" : 0;

      menuTl.to($menuPanel, {
        height: "auto",
        opacity: 1,
        duration: 1.2,
        ease: "expo.out"
      }, dropdownPos);

      if ($menuBackdrop) {
        menuTl.to($menuBackdrop, {
          opacity: 1,
          pointerEvents: "auto",
          duration: 1.0,
          ease: "expo.out"
        }, "<");
      }

      if ($menuIcon) {
        $menuIcon.classList.add("is-open");
        $menuIcon.setAttribute("aria-expanded", "true");
      }

      if ($menuTxt) {
        gsap.to($menuTxt, {
          opacity: 0,
          duration: 0.3,
          ease: "power3.in",
          overwrite: "auto",
          onComplete: () => {
            $menuTxt.textContent = "CLOSE";
            gsap.to($menuTxt, { opacity: 1, duration: 0.4, ease: "expo.out" });
          }
        });
      }
    }

    function closeMenu() {
      // menuOpen=false сразу, не в onComplete: иначе при быстрых кликах
      // флаг застревает в true → меню «зависает в режиме закрытия».
      menuOpen = false;
      if (menuTl) menuTl.kill();

      if (isInInvertZone()) applyInvertState(INVERT_DARK);

      menuTl = gsap.timeline();

      menuTl.to($menuPanel, {
        height: 0,
        opacity: 0,
        duration: 1.8,
        ease: "power3.inOut"
      }, 0);

      if ($menuBackdrop) {
        menuTl.to($menuBackdrop, {
          opacity: 0,
          pointerEvents: "none",
          duration: 1.7,
          ease: "power3.inOut"
        }, 0);
      }

      // -1.0 перекрытие: декомпрессия стартует пока дропдаун
      // ещё схлопывается — плавный переход.
      menuTl.to(compressTl, {
        progress: compressState.progress,
        duration: 2.2,
        ease: "power3.inOut",
        overwrite: true
      }, "-=1.0");

      if ($menuIcon) {
        $menuIcon.classList.remove("is-open");
        $menuIcon.setAttribute("aria-expanded", "false");
      }

      if ($menuTxt) {
        gsap.to($menuTxt, {
          opacity: 0,
          duration: 0.6,
          ease: "power3.in",
          overwrite: "auto",
          onComplete: () => {
            $menuTxt.textContent = "Menu";
            gsap.to($menuTxt, { opacity: 1, duration: 0.8, ease: "expo.out" });
          }
        });
      }
    }

    // stopImmediatePropagation — IX2 (если осталось где-то) не дёргает.
    $menuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      menuOpen ? closeMenu() : openMenu();
    });

    if ($menuBackdrop) {
      $menuBackdrop.addEventListener("click", () => {
        if (menuOpen) closeMenu();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuOpen) closeMenu();
    });

    // Клик по любой ссылке внутри меню — закрыть (event delegation).
    $menuPanel.addEventListener("click", (e) => {
      if (e.target.closest(".nav_menu-link")) closeMenu();
    });
  }
}

// Если DOM ещё парсится — ждём, иначе сразу. Покрывает CDN отдачу
// скрипта после DOMContentLoaded.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootNavScroll);
} else {
  bootNavScroll();
}
