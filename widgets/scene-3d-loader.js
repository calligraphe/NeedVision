/**
 * Worker-interceptor для 3D-сцены с needvision.netlify.app.
 *
 * Netlify-приложение (3D-сцена с океаном) использует Web Workers,
 * которые внутри делают fetch('/static/...') с абсолютными путями
 * от корня. Когда воркер грузится с CDN netlify.app, эти запросы
 * уходят на текущий хост (наш Webflow) → 404.
 *
 * Этот скрипт перехватывает window.Worker: если URL воркера —
 * netlify.app, оборачиваем его в blob-wrapper, который внутри
 * подменяет fetch/Request чтобы добавлять needvision.netlify.app
 * к относительным URL.
 *
 * ВАЖНО: грузится в head ДО app.js, иначе Worker создастся до
 * того, как мы заменим конструктор.
 */

(() => {
  const OriginalWorker = window.Worker;

  window.Worker = function (scriptURL) {
    const urlString = scriptURL.toString();

    if (urlString.includes("netlify.app")) {
      const fallbackCode = `
        const targetDomain = 'https://needvision.netlify.app';

        const OriginalRequest = self.Request;
        self.Request = function(input, init) {
          if (typeof input === 'string' && input.startsWith('/')) {
            input = targetDomain + input;
          }
          return new OriginalRequest(input, init);
        };
        self.Request.prototype = OriginalRequest.prototype;

        const originalFetch = self.fetch;
        self.fetch = function(input, init) {
          if (typeof input === 'string' && input.startsWith('/')) {
            input = targetDomain + input;
          } else if (input instanceof OriginalRequest && input.url.startsWith('/')) {
            input = new OriginalRequest(targetDomain + input.url, input);
          }
          return originalFetch(input, init);
        };

        importScripts('${urlString}');
      `;

      const blob = new Blob([fallbackCode], { type: "application/javascript" });
      const blobURL = URL.createObjectURL(blob);
      return new OriginalWorker(blobURL);
    }

    return new OriginalWorker(scriptURL);
  };
})();
