/* ============================================================
   NeedVision — единый файл кастомного JS для Webflow
   ВАЖНО:
     Этот файл хостится снаружи (GitHub + jsDelivr / Vercel / т.п.).
     В Webflow подключается через <script src="..."></script>,
     инлайн-скрипты в Webflow Custom Code не нужны.

   Чтобы изменения с GitHub долетели до сайта:
     - jsDelivr кеширует ~5–10 минут на @main
     - для немедленного обновления используй URL с конкретным
       коммитом или ?v=<число> в конце пути
   ============================================================ */

document.addEventListener("DOMContentLoaded", (event) => {
  // Регистрируем плагин скролла
  gsap.registerPlugin(ScrollTrigger);

  // ==========================================
  // 1. ПРЕДУСТАНОВКА (Initial States)
  // ==========================================

  gsap.set(".nav-menu__txt, .nav-profit", {
    opacity: 0,
    width: 0,
    overflow: "hidden",
    whiteSpace: "nowrap"
  });

  gsap.set(".nav-profit-item", {
    opacity: 0,
    y: 10
  });

  gsap.set(".nav-wrapper-top", {
    width: "0%",
    opacity: 0,
    overflow: "hidden"
  });

  gsap.set(".nav-btm-item", {
    y: 10,
    opacity: 0
  });

  // Стартовое положение .nav-btm — синхронно с CSS translate(0, -2vw)
  gsap.set(".nav-btm", { y: "-2vw" });


  // ==========================================
  // 2. ОСНОВНОЙ ТАЙМЛАЙН
  // ==========================================
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "+=1600",
      scrub: 2,
    }
  });

  tl.to(".container__1440px", {
    maxWidth: "28vw",
    backgroundColor: "#ffffff",
    borderRadius: "10vw",
    padding: "0.5vw 0.5vw",
    margin: "0.7vw 0vw 2.7vw 0vw",
    color: "#000000",
    duration: 0.8
  }, 0)

  .to(".container__1440px *", {
    color: "#000000",
    duration: 0.4
  }, 0)

  .to(".nav-profit, .case__link, .nav-menu__txt, .nav-profit-item", {
    fontSize: "0.7vw",
    duration: 0.4
  }, 0)

  .to(".manifest__link, .nav-timer", {
    width: 0,
    opacity: 0,
    margin: 0,
    padding: 0,
    duration: 0.4
  }, 0)

  .to(".nav-menu__txt, .nav-profit", {
    width: "auto",
    opacity: 1,
    margin: "0 10px",
    duration: 0.4
  }, 0)

  .to(".nav-profit-item", {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.2,
    ease: "power2.out"
  }, 0)

  .to(".nav-icon", {
    filter: "invert(1)",
    duration: 0.4
  }, 0)

  .to(".word_wrapper", {
    y: 10,
    opacity: 0,
    duration: 0.5,
    stagger: 0.1,
    ease: "power1.inOut"
  }, 0)

  .to(".nav-wrapper", {
    opacity: 0,
    duration: 0.2,
    ease: "power1.out"
  }, 0)

  .to(".nav-logo__img", {
    width: "50%",
    duration: 0.2,
    ease: "power1.out"
  }, 0)

  .to(".nav-btm-item", {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.15,
    ease: "power2.out"
  }, 0.2)

  .to(".nav-wrapper-top", {
    width: "100%",
    opacity: 1,
    duration: 0.6,
    ease: "power2.out"
  }, 0.2)

  // Зазор между сжатой плашкой и .nav-btm ≈ 0.5vw
  // (плашка имеет margin-bottom 2.7vw; итоговый зазор = 2.7 + y)
  .to(".nav-btm", {
    y: "-2.2vw",
    duration: 0.6,
    ease: "power2.out"
  }, 0.2);


  // ==========================================
  // 3. ИНВЕРСИЯ НАВИГАЦИИ НАД БЕЛЫМ ФОНОМ (.stages)
  // ==========================================
  const navInvertTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".stages",
      start: "top 90%",
      end: "top 20%",
      scrub: 1.5
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

  navInvertTl.fromTo(".nav-btm-item",
    { color: "#ffffff" },
    { color: "#000000", duration: 1, immediateRender: false },
  0);

  navInvertTl.fromTo(".nav-logo__img",
    { filter: "invert(0)" },
    { filter: "invert(1)", duration: 1, immediateRender: false },
  0);

  navInvertTl.fromTo(".nav-icon",
    { filter: "invert(1)" },
    { filter: "invert(0)", duration: 1, immediateRender: false },
  0);

});
