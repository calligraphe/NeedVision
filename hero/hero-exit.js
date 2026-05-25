/**
 * Hero exit: при скролле 100→120px hero-контент 'барабанит' вверх
 * и исчезает за маски (overflow:hidden на каждом hero-элементе).
 *
 * Каждый hero-элемент — это маска. Внутри неё текст-ноды + пустые
 * div'ы (Webflow CMS). Чтобы корректно анимировать содержимое маски,
 * оборачиваем ВЕСЬ innerHTML каждого элемента в один <span style="
 * display:block"> и анимируем span: yPercent:-100 + opacity:0.
 *
 * Исключение: <img> (.hero_planet-img) — leaf-элемент, текста нет,
 * оборачивать нечего. Анимируем img напрямую.
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

  const inners = [];

  targets.forEach((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;

    if (el.tagName === "IMG") {
      // Картинка — анимируем сам img
      el.style.willChange = "transform, opacity";
      inners.push(el);
      return;
    }

    // Защита от повторного оборота (если скрипт запустился дважды)
    if (el.dataset.heroExitWrapped === "1") {
      inners.push(el.firstElementChild);
      return;
    }

    // Оборачиваем весь innerHTML в один inner-span. display:block
    // чтобы span занимал всю высоту родителя — yPercent:-100 уведёт
    // его ровно за маску.
    const wrap = document.createElement("span");
    wrap.style.cssText = "display:block;will-change:transform,opacity";
    wrap.innerHTML = el.innerHTML;
    el.innerHTML = "";
    el.appendChild(wrap);
    el.dataset.heroExitWrapped = "1";
    inners.push(wrap);
  });

  if (inners.length === 0) return;

  gsap.registerPlugin(ScrollTrigger);

  // Scrub-таймлайн: scroll 100→600px (500px range). ease:'none' →
  // движение строго линейно следует за scroll-progress (без 'резкого
  // ухода в конце' который давал power2.in). Маска overflow:hidden
  // сама скрывает элемент когда yPercent доходит до -100, opacity
  // больше не нужен.
  gsap.to(inners, {
    yPercent: -100,
    ease: "none",
    stagger: 0.1,
    scrollTrigger: {
      trigger: "body",
      start: "top top-=100",
      end: "top top-=600",
      scrub: true
    }
  });
});
