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
 * Custom Attributes). Меню по клику работает как обычно в обоих режимах.
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

  // ---- Стартовое состояние ----

  // Profit-счётчик скрыт по умолчанию — раскроется на скролле/открытии меню
  gsap.set(".menu_profit-badge", {
    opacity: 0,
    width: 0,
    overflow: "hidden",
    whiteSpace: "nowrap"
  });

  gsap.set(".nav-profit-item", { opacity: 0, y: 20 });

  // Дропдаун схлопнут, backdrop невидим
  gsap.set(".menu_dropdown-list", { height: 0, opacity: 0 });
  gsap.set(".menu_backdrop", { opacity: 0, pointerEvents: "none" });

  // У overlay в Webflow нет explicit bg — задаём прозрачно-белый,
  // чтобы tween в #ffffff корректно интерполировал альфу
  gsap.set(".menu_overlay-content", {
    backgroundColor: "rgba(255,255,255,0)"
  });


  // ---- Compress timeline (paused, управляется снаружи) ----
  // Один таймлайн обслуживает scroll и клик меню:
  //   - скролл двигает progress через proxy + scrub
  //   - клик меню форсит progress = 1
  //
  // Лого и nav-btm стартуют сразу (pos 0), всё остальное (плашка, текст,
  // profit, инверсия) отложено на TOP_DELAY — чтобы лого успело
  // «приземлиться» до того, как плашка начнёт перекрашиваться.
  const compressTl = gsap.timeline({ paused: true });
  const TOP_DELAY = 0.2;

  // top → y (translateY): composite, без layout reflow.
  // CSS top:0vw остаётся → итоговая позиция = 0 + translateY(4vw)
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

  // Иконки/таймер уходят в opacity + height одновременно за первые
  // ~100px скролла. Высота тоже схлопывается, чтобы .nav_bar не
  // оставлял пустой отступ
  compressTl.to(".nav_left-icon, .nav_right-icon, .nav-timer", {
    opacity: 0,
    height: 0,
    duration: 0.15,
    ease: "power2.out"
  }, 0);


  // ---- Режим: scroll-driven или static ----
  // body[data-nav-mode="static"] → плашка сразу в финальном виде,
  // без ScrollTrigger и без navInvertTl. Меню по клику работает обычно.
  const isStaticNav = document.body?.dataset?.navMode === "static";

  // compressState.progress хранит «куда вернуть плашку при закрытии меню».
  // В scroll-режиме обновляется ScrollTrigger'ом, в static — фиксирован на 1.
  const compressState = { progress: isStaticNav ? 1 : 0 };
  let menuOpen = false;

  if (isStaticNav) {
    compressTl.progress(1);
  } else {
    // Скролл двигает proxy через scrub:1 → плавно. Когда меню открыто,
    // игнорируем апдейты, чтобы не перебивать клик-анимацию.
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


    // Инверсия над .stages (бежевая секция).
    // .to (а не .fromTo) — захватываем текущее состояние, не пробивая
    // forced from-value поверх compressTl
    const navInvertTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".stages",
        start: "top 85%",
        end: "top 25%",
        scrub: true
      }
    });

    navInvertTl.to(".menu_overlay-content",
      { backgroundColor: "#040101", duration: 1, immediateRender: false }, 0);
    navInvertTl.to(".menu_control-bar *",
      { color: "#ffffff", duration: 1, immediateRender: false }, 0);
    navInvertTl.to(".nav-btm, .nav-btm *",
      { color: "#000000", duration: 1, immediateRender: false }, 0);
    navInvertTl.to(".nav-logo_img",
      { filter: "invert(1)", duration: 1, immediateRender: false }, 0);
    navInvertTl.to(".nav-icon",
      { filter: "invert(0)", duration: 1, immediateRender: false }, 0);
  }


  // ---- Меню (открытие/закрытие) ----
  const menuBtn = document.querySelector(".nav-menu");
  const menuPanel = document.querySelector(".menu_dropdown-list");
  const menuTxt = document.querySelector(".nav-menu__txt");
  const menuIcon = document.querySelector(".menu-icon");
  const menuBackdrop = document.querySelector(".menu_backdrop");

  if (menuBtn && menuPanel) {
    // Один timeline на оба сценария. Каждый новый клик kill()'ит
    // предыдущий — нет наложений и рваных переходов.
    let menuTl = null;

    function openMenu() {
      menuOpen = true;
      if (menuTl) menuTl.kill();

      // Если плашка ещё не сжата — сначала визуально сжимаем,
      // только потом раскрываем дропдаун. Иначе сразу к дропдауну.
      const needsCompress = compressTl.progress() < 0.99;

      menuTl = gsap.timeline();

      if (needsCompress) {
        menuTl.to(compressTl, {
          progress: 1,
          duration: 0.95,
          ease: "power2.inOut",
          overwrite: true
        }, 0);
      }

      // -0.2 перекрытие: последняя четверть сжатия и первая четверть
      // раскрытия идут одновременно — переход цельный, без зазора
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

      if (menuIcon) {
        menuIcon.classList.add("is-open");
        menuIcon.setAttribute("aria-expanded", "true");
      }

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

      // menuOpen=false ставим в onComplete всего timeline — пока идёт
      // close, scroll-onUpdate не перебивает tween на compressTl.
      menuTl = gsap.timeline({
        onComplete: () => { menuOpen = false; }
      });

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

      // Возврат к scroll-state. У верха страницы — плавно раскрываемся
      // обратно. У низа или в static-режиме — no-op (progress уже 1).
      // -0.3 перекрытие: декомпрессия стартует пока дропдаун ещё схлопывается
      menuTl.to(compressTl, {
        progress: compressState.progress,
        duration: 0.95,
        ease: "power2.inOut",
        overwrite: true
      }, "-=0.3");

      if (menuIcon) {
        menuIcon.classList.remove("is-open");
        menuIcon.setAttribute("aria-expanded", "false");
      }

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

    menuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      menuOpen ? closeMenu() : openMenu();
    });

    if (menuBackdrop) {
      menuBackdrop.addEventListener("click", () => {
        if (menuOpen) closeMenu();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuOpen) closeMenu();
    });

    // Клик по любой ссылке внутри меню — закрыть.
    // Event delegation: один listener вместо forEach.
    menuPanel.addEventListener("click", (e) => {
      if (e.target.closest(".nav_menu-link")) closeMenu();
    });
  }
}

// Если DOM ещё парсится — ждём, иначе сразу. Покрывает случай когда
// CDN отдаёт скрипт после DOMContentLoaded.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootNavScroll);
} else {
  bootNavScroll();
}
