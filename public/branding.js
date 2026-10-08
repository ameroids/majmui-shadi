/* ═══════════════════════════════════════════════════════════
   Ameroids Tech Studio — shared branding
   Splash screen on page load + footer credit with WhatsApp link
   Included on every page via <script src="/branding.js">
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__atsBranding) return;
  window.__atsBranding = true;

  var PHONE_DISPLAY = '+91 72238 61653';
  var WA_URL = 'https://wa.me/917223861653?text=' +
    encodeURIComponent('Hello Ameroids Tech Studio! I have a query regarding the Token System.');
  var WA_ICON = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';

  /* ── styles ── */
  var style = document.createElement('style');
  style.textContent =
    '#ats-splash{position:fixed;inset:0;z-index:10000;background:#0F3630;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .5s cubic-bezier(.22,1,.36,1),visibility .5s;}' +
    '#ats-splash.ats-hide{opacity:0;visibility:hidden;pointer-events:none;}' +
    '#ats-splash .ats-inner{display:flex;flex-direction:column;align-items:center;transition:transform .5s cubic-bezier(.22,1,.36,1);}' +
    '#ats-splash.ats-hide .ats-inner{transform:scale(1.04);}' +
    '.ats-mark{position:relative;width:92px;height:92px;margin-bottom:24px;}' +
    '.ats-mark svg{width:100%;height:100%;transform:rotate(-90deg);}' +
    '.ats-ring{fill:none;stroke:#C9A24B;stroke-width:2.5;stroke-linecap:round;stroke-dasharray:289.03;stroke-dashoffset:289.03;animation:ats-ring .95s cubic-bezier(.22,1,.36,1) forwards;}' +
    '@keyframes ats-ring{to{stroke-dashoffset:0;}}' +
    '.ats-a{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:\'Amiri\',Georgia,serif;font-size:46px;line-height:1;color:#C9A24B;opacity:0;transform:scale(.7);animation:ats-pop .55s cubic-bezier(.22,1,.36,1) .3s forwards;}' +
    '@keyframes ats-pop{to{opacity:1;transform:scale(1);}}' +
    '.ats-word{display:flex;font-family:\'DM Sans\',sans-serif;font-size:21px;font-weight:600;letter-spacing:.3em;margin-left:.3em;color:#fff;}' +
    '.ats-word span{opacity:0;transform:translateY(12px);animation:ats-up .5s cubic-bezier(.22,1,.36,1) forwards;}' +
    '@keyframes ats-up{to{opacity:1;transform:translateY(0);}}' +
    '.ats-tag{font-family:\'DM Sans\',sans-serif;font-size:11px;letter-spacing:.42em;margin-left:.42em;text-transform:uppercase;color:rgba(201,162,75,.9);margin-top:10px;opacity:0;animation:ats-fade .45s ease-out 1s forwards;}' +
    '@keyframes ats-fade{to{opacity:1;}}' +
    '.ats-bar{width:150px;height:2px;background:rgba(255,255,255,.12);border-radius:2px;margin-top:28px;overflow:hidden;}' +
    '.ats-bar span{display:block;height:100%;width:0;background:#C9A24B;border-radius:2px;animation:ats-load 1.45s cubic-bezier(.4,0,.2,1) .15s forwards;}' +
    '@keyframes ats-load{to{width:100%;}}' +
    '@media(prefers-reduced-motion:reduce){' +
      '.ats-ring,.ats-a,.ats-word span,.ats-tag,.ats-bar span{animation:none;}' +
      '.ats-ring{stroke-dashoffset:0;}.ats-a,.ats-word span,.ats-tag{opacity:1;transform:none;}' +
      '.ats-bar{display:none;}#ats-splash{transition:opacity .25s ease-out;}' +
    '}' +
    '.ats-credit{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:7px;width:fit-content;max-width:92vw;margin:2.25rem auto .25rem;padding:8px 16px;border-radius:22px;border:1px solid transparent;font-family:\'DM Sans\',sans-serif;font-size:12px;line-height:1.4;text-decoration:none;text-align:center;transition:background .2s,color .2s,border-color .2s;}' +
    '.ats-credit strong{font-weight:600;}' +
    '.ats-credit svg{width:14px;height:14px;flex-shrink:0;}' +
    '.ats-on-dark{color:rgba(255,255,255,.5);}' +
    '.ats-on-dark strong{color:#C9A24B;}' +
    '.ats-on-dark svg{fill:#25d366;}' +
    '.ats-on-dark:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.14);color:rgba(255,255,255,.8);}' +
    '.ats-on-light{color:#5f5b52;}' +
    '.ats-on-light strong{color:#9C7A2E;}' +
    '.ats-on-light svg{fill:#1faa53;}' +
    '.ats-on-light:hover{background:rgba(15,54,48,.06);border-color:#dcd7cd;color:#38352f;}' +
    '@media print{#ats-splash,.ats-credit{display:none!important;}}';
  document.head.appendChild(style);

  /* ── splash screen ── */
  var letters = 'AMEROIDS'.split('').map(function (ch, i) {
    return '<span style="animation-delay:' + (0.45 + i * 0.055).toFixed(3) + 's">' + ch + '</span>';
  }).join('');

  var splash = document.createElement('div');
  splash.id = 'ats-splash';
  splash.setAttribute('aria-hidden', 'true');
  splash.innerHTML =
    '<div class="ats-inner">' +
      '<div class="ats-mark">' +
        '<svg viewBox="0 0 100 100"><circle class="ats-ring" cx="50" cy="50" r="46"/></svg>' +
        '<span class="ats-a">A</span>' +
      '</div>' +
      '<div class="ats-word">' + letters + '</div>' +
      '<div class="ats-tag">Tech Studio</div>' +
      '<div class="ats-bar"><span></span></div>' +
    '</div>';
  (document.body || document.documentElement).appendChild(splash);

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dismissed = false;
  function dismissSplash() {
    if (dismissed) return;
    dismissed = true;
    splash.classList.add('ats-hide');
    setTimeout(function () { if (splash.parentNode) splash.parentNode.removeChild(splash); }, 600);
  }
  splash.addEventListener('click', dismissSplash);      // tap anywhere to skip
  setTimeout(dismissSplash, reduced ? 700 : 2150);
  setTimeout(function () {                              // failsafe: never block the page
    if (splash.parentNode) splash.parentNode.removeChild(splash);
  }, 4000);

  /* ── footer credit → WhatsApp ── */
  function addCredit() {
    if (document.getElementById('ats-credit')) return;

    // pick light/dark styling from the page's own background
    var dark = true;
    var m = getComputedStyle(document.body).backgroundColor.match(/\d+(\.\d+)?/g);
    if (m && m.length >= 3) {
      var lum = 0.2126 * Number(m[0]) + 0.7152 * Number(m[1]) + 0.0722 * Number(m[2]);
      dark = lum < 128;
    }

    var a = document.createElement('a');
    a.id = 'ats-credit';
    a.className = 'ats-credit ' + (dark ? 'ats-on-dark' : 'ats-on-light');
    a.href = WA_URL;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', 'Chat with Ameroids Tech Studio on WhatsApp: ' + PHONE_DISPLAY);
    a.innerHTML =
      '<span>Developed by <strong>Ameroids Tech Studio</strong></span>' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + WA_ICON + '"/></svg>' +
      '<span>For queries:&nbsp;' + PHONE_DISPLAY + '</span>';
    document.body.appendChild(a);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addCredit);
  } else {
    addCredit();
  }
})();
