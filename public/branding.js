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
