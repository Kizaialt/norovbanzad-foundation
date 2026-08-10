// Chrome: language switching, nav toggle, footer year, contact form.
// Does not touch the helix visual (see helix.js).
(function () {
  'use strict';

  // =========================================================================
  // Language switching
  //
  // Mongolian is authored inline in index.html; English lives in i18n.js keyed by data-i18n.
  // At init we snapshot each keyed element's Mongolian markup, so MN is restored exactly on
  // switch-back and never has to be duplicated in the dictionary. See i18n.js for the contract.
  // =========================================================================

  var STORAGE_KEY = 'nf-lang';
  var EN = window.I18N_EN || {};
  var mnSnapshot = Object.create(null);   // key -> original MN innerHTML
  var mnAttrSnapshot = [];                // {el, attr, key, value}
  var langButtons = document.querySelectorAll('.lang-switch__btn');

  function snapshot() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      // First element wins for a repeated key (e.g. nav.song appears in nav and footer); both
      // carry identical MN source, so either snapshot is correct.
      if (!(key in mnSnapshot)) mnSnapshot[key] = el.innerHTML;
    });

    // Translatable attributes are declared as data-i18n-<attr>, e.g. data-i18n-aria-label.
    document.querySelectorAll('*').forEach(function (el) {
      if (!el.attributes) return;
      Array.prototype.forEach.call(el.attributes, function (attr) {
        if (attr.name.indexOf('data-i18n-') !== 0) return;
        var target = attr.name.slice('data-i18n-'.length);
        mnAttrSnapshot.push({ el: el, attr: target, key: attr.value, value: el.getAttribute(target) });
      });
    });
  }

  function applyLang(lang) {
    var toEnglish = lang === 'en';

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (toEnglish) {
        // Missing key: leave the Mongolian in place rather than blanking the element. A visible
        // untranslated string is a far smaller failure than an empty one.
        if (Object.prototype.hasOwnProperty.call(EN, key)) el.innerHTML = EN[key];
      } else if (key in mnSnapshot) {
        el.innerHTML = mnSnapshot[key];
      }
    });

    mnAttrSnapshot.forEach(function (rec) {
      if (toEnglish) {
        if (Object.prototype.hasOwnProperty.call(EN, rec.key)) rec.el.setAttribute(rec.attr, EN[rec.key]);
      } else if (rec.value !== null) {
        rec.el.setAttribute(rec.attr, rec.value);
      }
    });

    // <title> carries data-i18n but innerHTML on <title> is unreliable across browsers; set it
    // through document.title, which is the supported path.
    var titleKey = 'doc.title';
    if (toEnglish && EN[titleKey]) document.title = EN[titleKey];
    else if (titleKey in mnSnapshot) document.title = mnSnapshot[titleKey];

    document.documentElement.setAttribute('lang', lang);

    langButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === lang));
    });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode: ignore */ }

    // Column heights change with translated text, so the helix has to re-measure. helix.js
    // rebuilds on resize; dispatching one here reuses that path rather than duplicating it.
    window.dispatchEvent(new Event('resize'));
  }

  function initialLang() {
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    if (stored === 'mn' || stored === 'en') return stored;

    // Always open in Mongolian. Deliberately NOT sniffing navigator.language: English-locale
    // systems are common in Mongolia, so branching on it would hand the Mongolian audience an
    // English site by default -- exactly backwards for this foundation. International visitors
    // reach English in one click, and the choice is remembered from then on.
    return 'mn';
  }

  snapshot();
  var currentLang = initialLang();
  if (currentLang !== 'mn') applyLang(currentLang);
  else applyLang('mn'); // sets aria-pressed and lang consistently

  langButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = btn.getAttribute('data-lang');
      if (lang !== currentLang) {
        currentLang = lang;
        applyLang(lang);
      }
    });
  });

  function t(key, fallbackMn) {
    if (currentLang === 'en' && EN[key]) return EN[key];
    return fallbackMn;
  }

  // =========================================================================
  // Nav toggle
  // =========================================================================

  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('primary-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // =========================================================================
  // Contact form
  //
  // There is no backend yet, so rather than let a visitor type a message and watch it vanish,
  // submit is intercepted while data-endpoint is empty and the fallback is shown instead.
  // Fill in data-endpoint and this hands over to a normal POST -- no code change needed.
  // =========================================================================

  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');

  if (form && status) {
    var endpoint = form.getAttribute('data-endpoint');

    // Assigning action inside the submit handler is too late in some browsers -- the target is
    // already resolved by then -- so it is done at init.
    if (endpoint) {
      form.setAttribute('action', endpoint);
      form.setAttribute('method', 'post');
    }

    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        setStatus(t('ct.err.fields', 'Шаардлагатай талбаруудыг бөглөнө үү.'), 'error');
        var firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (!endpoint) {
        e.preventDefault();
        setStatus(
          t('ct.err.noendpoint',
            'Захидлын форм хараахан холбогдоогүй байна — сангийн и-мэйл рүү шууд бичнэ үү.'),
          'error'
        );
        return;
      }
      // endpoint present: fall through and let the browser POST normally.
    });
  }

  function setStatus(message, kind) {
    status.textContent = message;
    status.className = 'form-status' + (kind ? ' form-status--' + kind : '');
  }
})();
