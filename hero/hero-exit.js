/**
 * Hero exit: при скролле >100px hero-контент 'барабанит' вверх и
 * исчезает за ~20px прокрутки. Эффект как в stages: каждый hero-блок
 * имеет overflow:hidden (поставлен в Webflow), а ВНУТРИ него двигается
 * контент (yPercent:-100) — текст/картинка уезжают за маску.
 *
 * Если внутри блока нет дочерних HTML-элементов (текст лежит прямым
 * text-node), оборачиваем в <span> чтобы было что анимировать.
 */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") {
    console.warn("hero-exit.js: GSAP не загружен");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("hero-exit.js: ScrollTrigger не загружен");
    return;
  }

  const targets = [
    ".hero_planet-img",
    ".hero_label",
    ".hero_tags-group",
    ".hero_title",
    ".hero_subtitle"
  ];

  // Для каждого target'а собираем animateable inner-элементы.
  // Маска (родитель) уже имеет overflow:hidden от юзера.
  const inners = [];

  targets.forEach((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;

    // Если внутри уже есть HTML-дети — анимируем их.
    // Если только text-node — оборачиваем в span.
    if (el.children.length > 0) {
      Array.from(el.children).forEach(child => {
        child.style.willChange = "transform, opacity";
        inners.push(child);
      });
    } else if (el.textContent.trim()) {
      const wrap = document.createElement("span");
      wrap.style.cssText = "display:inline-block;will-change:transform,opacity";
      wrap.textContent = el.textContent;
      el.textContent = "";
      el.appendChild(wrap);
      inners.push(wrap);
    }
  });

  if (inners.length === 0) return;

  gsap.registerPlugin(ScrollTrigger);

  // Scrub-таймлайн на 20px скролла: 100→120px от верха.
  // yPercent:-100 = уехать на свою высоту вверх → за маску родителя.
  // stagger 0.05 — барабан, поочерёдно (но всё уложится в 20px scroll).
  gsap.to(inners, {
    yPercent: -110,           // -110 чтобы наверняка скрыться даже при padding
    opacity: 0,
    ease: "power2.in",
    stagger: 0.05,
    scrollTrigger: {
      trigger: "body",
      start: "top top-=100",
      end: "top top-=120",
      scrub: true
    }
  });
});
