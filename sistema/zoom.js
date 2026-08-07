/*
 * Zoom de texto da apresentação SAI.
 *
 * Todos os font-size dos slides são definidos em rem (base 26px no html),
 * então alterar o font-size do <html> redimensiona apenas os textos,
 * preservando o layout (caixas, paddings e larguras ficam em px).
 *
 * Controles: teclas + / - / 0 (no slide ou no visualizador) e botões
 * A- / A+ da barra de navegação. O nível é persistido em localStorage
 * e compartilhado por todos os slides.
 *
 * Quando o slide é aberto fora do visualizador (standalone), o script
 * também ajusta o slide inteiro ao tamanho da janela via CSS zoom,
 * espelhando o transform:scale que o visualizador aplica no iframe.
 */
(function () {
  var BASE = 26;        // px — base do html definida no CSS de cada slide
  var MIN = 0.7, MAX = 1.5, STEP = 0.1;
  var KEY = 'sai-slide-zoom';
  var embedded = window.parent !== window;

  var zoom = parseFloat(localStorage.getItem(KEY));
  if (!zoom || zoom < MIN || zoom > MAX) zoom = 1;

  function apply(showFeedback) {
    document.documentElement.style.fontSize = (BASE * zoom) + 'px';
    if (embedded) {
      window.parent.postMessage({ type: 'slide-zoom-changed', value: zoom }, '*');
    }
    if (showFeedback) badge();
  }

  function set(z, showFeedback) {
    zoom = Math.min(MAX, Math.max(MIN, Math.round(z * 10) / 10));
    localStorage.setItem(KEY, String(zoom));
    apply(showFeedback);
  }

  /* Indicador temporário com o nível atual (ex.: "120%") */
  var badgeEl = null, badgeTimer = null;
  function badge() {
    if (!badgeEl) {
      badgeEl = document.createElement('div');
      badgeEl.style.cssText =
        'position:fixed;top:24px;left:50%;transform:translateX(-50%);' +
        'background:rgba(0,51,102,0.92);color:#fff;font:700 15px/1 Montserrat,sans-serif;' +
        'padding:10px 22px;border-radius:999px;z-index:9999;pointer-events:none;' +
        'box-shadow:0 6px 18px rgba(0,0,0,0.3);transition:opacity 0.3s;';
      document.body.appendChild(badgeEl);
    }
    badgeEl.textContent = 'Texto: ' + Math.round(zoom * 100) + '%';
    badgeEl.style.opacity = '1';
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(function () { badgeEl.style.opacity = '0'; }, 1200);
  }

  /* Ajuste do slide à janela quando aberto fora do visualizador */
  function fitStandalone() {
    if (embedded) return;
    var c = document.querySelector('.slide-container');
    if (!c) return;
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    if (Math.abs(s - 1) < 0.005) {
      c.style.width = ''; c.style.height = ''; c.style.margin = '';
      document.body.style.zoom = '';
      return;
    }
    c.style.width = '1920px';
    c.style.height = '1080px';
    c.style.margin = '0 auto';
    document.body.style.zoom = s;
  }

  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return; // preserva o zoom nativo do navegador
    if (e.key === '+' || e.key === '=') { e.preventDefault(); set(zoom + STEP, true); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); set(zoom - STEP, true); }
    else if (e.key === '0') { e.preventDefault(); set(1, true); }
  });

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.type !== 'slide-zoom') return;
    if (d.action === 'in') set(zoom + STEP, true);
    else if (d.action === 'out') set(zoom - STEP, true);
    else if (d.action === 'reset') set(1, true);
  });

  window.addEventListener('resize', fitStandalone);
  document.addEventListener('DOMContentLoaded', function () {
    apply(false);
    fitStandalone();
  });
  apply(false);
})();
