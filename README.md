# Need Vision — JS-скрипты для Webflow

Репозиторий с кастомными JavaScript-скриптами для сайта **Need Vision** — агентства маркетинга в недвижимости. Сайт собран на Webflow, скрипты хостятся здесь и подключаются через [jsDelivr CDN](https://www.jsdelivr.com/).

Такой подход разгружает Webflow Custom Code, разносит логику по понятным файлам и позволяет править скрипты без перезаливки проекта.

---

## О проекте

- **Платформа:** Webflow
- **Стек:** чистый JavaScript + GSAP 3.12.x (`ScrollTrigger`, `Observer`), Odometer.js, Swiper 11
- **Сборка:** не используется — все файлы подключаются напрямую через `<script src="...">`
- **CDN:** [jsDelivr](https://www.jsdelivr.com/)

---

## Подключение через jsDelivr

В Webflow → **Site Settings → Custom Code → Footer Code** вставь блок ниже (можно убрать строки, которые на странице не нужны):

```html
<!-- ===== GSAP и плагины ===== -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Observer.min.js"></script>

<!-- ===== Odometer (для widgets/amount-counter) ===== -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/odometer.js/0.4.7/themes/odometer-theme-minimal.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/odometer.js/0.4.7/odometer.min.js"></script>

<!-- ===== Swiper (только если используешь sliders/team-slider-swiper) ===== -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>

<!-- ===== Стили Need Vision ===== -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/styles/custom.css">

<!-- ===== Скрипты Need Vision ===== -->
<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/navigation/nav-scroll.js"></script>
<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/navigation/nav-cta-invert.js"></script>

<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/widgets/marquee.js"></script>
<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/widgets/amount-counter.js"></script>
<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/widgets/timer-place-clock.js"></script>

<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/hero/hero-image-reveal.js"></script>
<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/manifesto/manifesto-text-reveal.js"></script>

<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/bento/bento-parallax-cards.js"></script>

<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sections/logo-reveal.js"></script>
<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sections/logo-grid-swap.js"></script>
<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sections/partner-spotlight.js"></script>
<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sections/stages-animation.js"></script>

<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sliders/cases-slider.js"></script>
<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sliders/team-slider.js"></script>
<!-- <script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/sliders/team-slider-swiper.js"></script> -->
```

**Порядок важен:** сначала GSAP и его плагины, потом Odometer/Swiper, потом скрипты Need Vision. Каждый скрипт проверяет наличие зависимостей через `typeof` и тихо выходит, если их нет — но без библиотек он, естественно, ничего не сделает.

`team-slider-swiper.js` оставлен закомментированным — подключай только что-то одно из двух team-слайдеров (см. ниже).

---

## Список скриптов

| Файл | Назначение | Основные селекторы | Зависимости |
|------|------------|--------------------|-------------|
| [`navigation/nav-scroll.js`](navigation/nav-scroll.js) | Сжатие нав-бара в плашку при скролле, PROFIT-счётчик, инверсия над `.stages`, клик-меню | `.container__1440px`, `.nav-menu`, `.menu_overlay-content`, `.nav-profit`, `.nav-btm`, `.stages` | GSAP, ScrollTrigger |
| [`navigation/nav-cta-invert.js`](navigation/nav-cta-invert.js) | Темизация плавающей CTA-кнопки (оранжевые секции / `.stages` / футер) | `.nav-cta__btn`, `.is-orange-nav`, `.stages`, `.footer` | GSAP, ScrollTrigger |
| [`widgets/marquee.js`](widgets/marquee.js) | Бесшовные бегущие строки — дублирует HTML внутри обёртки и крутит её на -50%. Работает на каждой найденной маркизе. Для скрытых элементов (свёрнутое меню) анимация откладывается через ResizeObserver | `.marquee-wrapper`, `.menu_marquee-wrapper` | GSAP |
| [`widgets/amount-counter.js`](widgets/amount-counter.js) | Барабан-счётчики суммы, +15 каждые 15–20 сек — независимые экземпляры на каждом матче | `.amount-counter`, `.menu_amount-counter` | Odometer 0.4.7 |
| [`widgets/timer-place-clock.js`](widgets/timer-place-clock.js) | Гео-город (по IP через `ipwho.is`) + локальные часы (12h) | `.timer-place`, `.timer-time` | — |
| [`hero/hero-image-reveal.js`](hero/hero-image-reveal.js) | Раскрытие hero-картинки от полоски до `45vw` при скролле | `.hero-image`, `.hero__img` | GSAP, ScrollTrigger |
| [`manifesto/manifesto-text-reveal.js`](manifesto/manifesto-text-reveal.js) | Каскадное появление строк манифеста с blur | `.manifesto`, `.man-anim__txt` | GSAP, ScrollTrigger |
| [`bento/bento-parallax-cards.js`](bento/bento-parallax-cards.js) | Параллакс bento-карточек: появление + уход | `.parallax-sticky`, `.bento_card.is-parallax` | GSAP, ScrollTrigger |
| [`sections/logo-reveal.js`](sections/logo-reveal.js) | Появление текстов в секции `.section-logo` с blur | `.section-logo`, `.logo-anim__txt` | GSAP, ScrollTrigger |
| [`sections/logo-grid-swap.js`](sections/logo-grid-swap.js) | Бесконечная подмена 3–4 лого в сетке из скрытого пула | `.logo-grid_img-visible`, `.logo-hidden-pool` | GSAP |
| [`sections/partner-spotlight.js`](sections/partner-spotlight.js) | Фонарик, следующий за курсором в секции `.partner` | `.partner`, `.spotlight-overlay` | GSAP, CSS-переменные |
| [`sections/stages-animation.js`](sections/stages-animation.js) | Смена фона + блюр картинок + барабанная смена текстов этапов | `.stages`, `.about-wrapper`, `.stages_img`, `.stages_text-wrapper`, `.stages_dot-full`, `.stages_step-label` | GSAP, ScrollTrigger |
| [`sliders/cases-slider.js`](sliders/cases-slider.js) | Карусель кейсов с кастомным курсором + drag через Observer | `.cases_slider-track`, `.case_card`, `.case-click-zone` | GSAP, Observer |
| [`sliders/team-slider.js`](sliders/team-slider.js) | Кастомный team-слайдер с замером слотов в `vw` (актуальная версия) | `.team_photo-track`, `.team_photo-slide`, `.team_div`, `.team_role-text`, … | GSAP |
| [`sliders/team-slider-swiper.js`](sliders/team-slider-swiper.js) | **Альтернатива.** Старый team-слайдер на Swiper. Подключать вместо `team-slider.js`, не одновременно | `.swiper`, `.team_role-title`, `.team_quote-text` | Swiper 11, GSAP |

### Стили

| Файл | Что внутри |
|------|------------|
| [`styles/custom.css`](styles/custom.css) | `.nav-blur-bg` (маска размытия), `.spotlight-overlay` (фонарик), `.swiper-slide` (размеры в Swiper-варианте team-слайдера) |

---

## Версионирование

`@main` — это **подвижная** ветка: каждый коммит долетает до прода через ~5–10 минут после сброса кеша jsDelivr. Удобно для разработки, рискованно для прода.

### Для прода используй теги

Когда версия стабильна — пометь её тегом:

```bash
git tag v1.0.0
git push origin v1.0.0
```

И поменяй ссылки в Webflow с `@main` на `@v1.0.0`:

```html
<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@v1.0.0/navigation/nav-scroll.js"></script>
```

Тегированные релизы кешируются jsDelivr **навсегда** — даже если что-то поломаешь в `main`, прод останется живой.

---

## Сброс кеша CDN

jsDelivr кеширует `@main` примерно на **12 часов**. Чтобы форснуть обновление после пуша, открой в браузере:

```
https://purge.jsdelivr.net/gh/calligraphe/NeedVision@main/navigation/nav-scroll.js
```

(подставь нужный путь). Ответ `{"success":true,...}` — кеш сброшен, новая версия раздаётся сразу.

---

## Разработка

Во время отладки удобно обходить кеш через query-параметр:

```html
<script src="https://cdn.jsdelivr.net/gh/calligraphe/NeedVision@main/navigation/nav-scroll.js?v=3"></script>
```

Меняй число `?v=N` после каждого пуша — jsDelivr будет отдавать свежий файл. На проде убери query-параметр (или замени на тег).

### Локальные изменения

```bash
git pull
# редактируешь файлы
git add .
git commit -m "fix: что-то поправил в nav-scroll"
git push
# через ~5 минут (или сразу после purge) обновления на проде
```

### Источник правды

Файл [`script.html`](script.html) — это исходный дамп всего, что лежало в Webflow Custom Code на момент разноса. После реструктуризации он **не используется** ни в Webflow, ни на проде — оставлен только как историческая копия. Если правишь логику, правь её в соответствующем `.js`-файле, а не в `script.html`.

---

## Стандарты кода

- Комментарии — на русском
- Селекторы Webflow вынесены в константы или в шапку файла
- Каждый `querySelector` для основного элемента проверяется на `null`
- Все скрипты обёрнуты в `DOMContentLoaded`
- `typeof gsap === "undefined"` гард перед использованием GSAP
- Никаких глобальных переменных вне обработчика
- Никаких `var` — только `const` и `let`
- Тайминги — в константах в начале файла
- Где замеряются размеры после рендера Webflow — двойной `requestAnimationFrame`

---

## Структура

```
/
├── README.md
├── script.html               ← исходный дамп Webflow Custom Code (read-only)
│
├── navigation/
│   ├── nav-scroll.js
│   └── nav-cta-invert.js
│
├── widgets/
│   ├── marquee.js
│   ├── amount-counter.js
│   └── timer-place-clock.js
│
├── hero/
│   └── hero-image-reveal.js
│
├── manifesto/
│   └── manifesto-text-reveal.js
│
├── bento/
│   └── bento-parallax-cards.js
│
├── sections/
│   ├── logo-reveal.js
│   ├── logo-grid-swap.js
│   ├── partner-spotlight.js
│   └── stages-animation.js
│
├── sliders/
│   ├── cases-slider.js
│   ├── team-slider.js           ← актуальная версия
│   └── team-slider-swiper.js    ← старая альтернатива (Swiper)
│
└── styles/
    └── custom.css
```
