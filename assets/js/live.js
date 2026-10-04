// Shared text edits, and the in-page editor.
//
// Visitors:   every page load fetches the Foundation's saved edits and applies them over the
//             text built into index.html. If this fails, the built-in text simply stays.
// Members:    opening the page with #edit=<passcode> switches on edit mode. Any text can be
//             clicked and typed over; changes save automatically for everyone.
//
// Storage is a Firestore database used through its plain REST API (no SDK). Reads are public;
// writes only pass the database rules when they carry the edit passcode. See firebase/README.md.
(function () {
  'use strict';

  var CFG = window.NF_CONFIG || {};
  if (!CFG.projectId || !window.NF) return;     // not wired up yet: the site behaves as before

  // --- Wording of the editor itself (Mongolian). Everything members read is in this block. ---
  var S = {
    title: 'Засварлах горим',
    hint: 'Бичвэр дээр товшоод засна уу.',
    lang: 'Хэл',
    unfilled: 'Бөглөөгүй',
    next: 'Дараагийнх',
    allDone: 'Бөглөх зүйл үлдсэнгүй',
    other: 'Цэс, товчны бичвэр',
    backup: 'Нөөц татах',
    save: 'Хадгалах',
    exit: 'Гарах',
    dirty: 'Хадгалагдаагүй өөрчлөлт байна',
    saving: 'Хадгалж байна…',
    saved: 'Бүгд хадгалагдсан',
    error: 'Хадгалж чадсангүй, дахин оролдоно',
    dlgTitle: 'Засварлах эрх',
    pass: 'Нууц код',
    name: 'Таны нэр',
    nameNote: 'Өөрчлөлт бүр дээр таны нэр тэмдэглэгдэнэ.',
    go: 'Эхлэх',
    wrong: 'Нууц код буруу байна.',
    net: 'Холбогдож чадсангүй. Интернэтээ шалгаад дахин оролдоно уу.',
    otherTitle: 'Цэс, товч, маягтын бичвэр',
    close: 'Хаах',
    defaultName: 'Гишүүн'
  };

  var DB = (CFG.endpoint || 'https://firestore.googleapis.com') + '/v1/projects/' + CFG.projectId + '/databases/(default)/documents';
  var DOC_ROOT = 'projects/' + CFG.projectId + '/databases/(default)/documents';
  var KEYQ = CFG.apiKey ? 'key=' + encodeURIComponent(CFG.apiKey) : '';
  var PING_ID = 'all__ping';

  var SS_PASS = 'nf-pass';
  var LS_NAME = 'nf-editor';
  var remote = {};          // id -> saved html, as last seen on the server

  function store(kind, key, val) {
    try {
      var s = kind === 'session' ? sessionStorage : localStorage;
      if (val === undefined) return s.getItem(key);
      if (val === null) s.removeItem(key); else s.setItem(key, val);
    } catch (e) { /* storage blocked: carry on without it */ }
    return null;
  }

  // =========================================================================
  // Server calls
  // =========================================================================

  // A stalled connection must fail (and be retried) rather than hang the editor on "saving".
  function timedFetch(url, opts) {
    opts = opts || {};
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, 12000) : null;
    if (ctl) opts.signal = ctl.signal;
    return fetch(url, opts).then(function (r) { clearTimeout(t); return r; },
                                 function (e) { clearTimeout(t); throw e; });
  }

  function listAll() {
    var out = {};
    function page(token) {
      var q = ['pageSize=300'];
      if (token) q.push('pageToken=' + encodeURIComponent(token));
      if (KEYQ) q.push(KEYQ);
      return timedFetch(DB + '/texts?' + q.join('&')).then(function (r) {
        if (!r.ok) throw new Error('list ' + r.status);
        return r.json();
      }).then(function (j) {
        (j.documents || []).forEach(function (d) {
          var id = decodeURIComponent(d.name.split('/').pop());
          var f = d.fields && d.fields.html;
          if (id !== PING_ID && f && typeof f.stringValue === 'string') out[id] = f.stringValue;
        });
        return j.nextPageToken ? page(j.nextPageToken) : out;
      });
    }
    return page();
  }

  // One text is saved as two writes in a single commit: a "proof" holding the passcode, and the
  // text itself. The database rules accept the text only if the proof carries the right
  // passcode. The proof is never readable, so the passcode is never exposed.
  function commit(id, html, prev) {
    return withRetry(function () { return commitOnce(id, html, prev); }, 3);
  }

  // "Refused" is retried above: right after a rules change, servers can briefly disagree, and one
  // stray refusal must not look like a wrong passcode.
  function commitOnce(id, html, prev) {
    var pass = store('session', SS_PASS);
    var body = {
      writes: [
        { update: { name: DOC_ROOT + '/proofs/' + id, fields: { pass: { stringValue: pass || '' } } } },
        { update: { name: DOC_ROOT + '/texts/' + id, fields: {
          html: { stringValue: html },
          by: { stringValue: store('local', LS_NAME) || S.defaultName },
          at: { stringValue: new Date().toISOString() },
          prev: { stringValue: prev || '' }
        } } }
      ]
    };
    return timedFetch(DB + ':commit' + (KEYQ ? '?' + KEYQ : ''), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true
    }).then(function (r) {
      if (r.ok) return;
      var err = new Error('commit ' + r.status);
      err.denied = r.status === 403 || r.status === 401;
      throw err;
    });
  }

  // =========================================================================
  // Everyone: pull saved edits onto the page
  // =========================================================================

  function writeCache() {
    try { localStorage.setItem(window.NF.cacheKey, JSON.stringify(remote)); } catch (e) { /* ignore */ }
  }

  function withRetry(fn, tries) {
    return fn().catch(function (err) {
      if (tries <= 1) throw err;
      return new Promise(function (r) { setTimeout(r, 1500); }).then(function () { return withRetry(fn, tries - 1); });
    });
  }

  function refresh(force) {
    return withRetry(listAll, 3).then(function (map) {
      var changed = JSON.stringify(map) !== JSON.stringify(remote);
      remote = map;
      writeCache();
      if (changed || force) window.NF.apply(map);
      return changed;
    }).catch(function () { return false; });
  }

  // The cached copy was already applied by main.js; remember it so an unchanged server copy
  // does not trigger a redraw.
  try { remote = JSON.parse(store('local', window.NF.cacheKey) || '{}') || {}; } catch (e) { remote = {}; }

  // The edit link is the site address plus #edit=<passcode>. It is read on load, and again when
  // the address changes, because pasting it into a tab that already has the site open only changes
  // the # part and does not reload the page.
  function editFromLink() {
    var m = location.hash.match(/^#edit(?:=(.*))?$/);
    if (!m && store('session', 'nf-edit') !== '1') return;
    var linkPass = null;
    try { linkPass = m && m[1] ? decodeURIComponent(m[1]) : null; } catch (e) { linkPass = m[1]; }
    startEdit(linkPass);
  }

  refresh(false).then(editFromLink);
  window.addEventListener('hashchange', function () {
    if (/^#edit/.test(location.hash)) editFromLink();
  });

  // =========================================================================
  // Edit mode
  // =========================================================================

  var PLACEHOLDER = /\[(?:БАЙРШУУЛАХ|PLACEHOLDER|ТОО|ОН|САР|ОГНОО|ҮНЭ|CREDIT)[^\]]*\]/;
  var SKIP_INLINE = 'title, option, button, .sr-only, .skip-link';

  var pending = {};         // id -> { scope, key, html, prev }
  var timer = null, retry = null, inflight = null;
  var bar = null, statusEl = null, countEl = null, langEl = null, saveBtn = null;
  var started = false;

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function startEdit(urlPass) {
    if (started) return;
    var pass = urlPass || store('session', SS_PASS);
    if (urlPass) history.replaceState(null, '', location.pathname + location.search);

    if (!pass || !store('local', LS_NAME)) {
      return askAccess(pass, function (p) { startEdit(p); });
    }
    store('session', SS_PASS, pass);

    // Check the passcode before showing editing tools that would only fail to save.
    commit(PING_ID, 'ok', '').then(function () {
      started = true;
      store('session', 'nf-edit', '1');
      buildEditor();
    }, function (err) {
      if (err.denied) {
        store('session', SS_PASS, null);
        askAccess(null, function (p) { startEdit(p); }, S.wrong);
      } else {
        askAccess(pass, function (p) { startEdit(p); }, S.net);
      }
    });
  }

  function askAccess(pass, done, message) {
    if (document.querySelector('.nf-veil')) return;      // a dialog is already open
    var veil = el('div', { 'class': 'nf-veil' });
    var dlg = el('form', { 'class': 'nf-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': S.dlgTitle });
    dlg.innerHTML =
      '<h2>' + esc(S.dlgTitle) + '</h2>' +
      (pass ? '' : '<label>' + esc(S.pass) + '<input name="pass" type="password" autocomplete="off" required></label>') +
      '<label>' + esc(S.name) + '<input name="name" type="text" autocomplete="name"></label>' +
      '<p class="nf-note">' + esc(S.nameNote) + '</p>' +
      '<p class="nf-error" role="alert">' + (message ? esc(message) : '') + '</p>' +
      '<button type="submit" class="nf-btn nf-btn--primary">' + esc(S.go) + '</button>';
    var passInput = dlg.querySelector('[name="pass"]');
    var nameInput = dlg.querySelector('[name="name"]');
    nameInput.value = store('local', LS_NAME) || '';
    veil.appendChild(dlg);
    document.body.appendChild(veil);
    (passInput || nameInput).focus();
    dlg.addEventListener('submit', function (e) {
      e.preventDefault();
      store('local', LS_NAME, nameInput.value.trim() || S.defaultName);
      var p = pass || passInput.value.trim();
      document.body.removeChild(veil);
      done(p);
    });
  }

  function buildEditor() {
    var css = el('link', { rel: 'stylesheet', href: 'assets/css/edit.css' });
    document.head.appendChild(css);
    document.documentElement.classList.add('nf-editing');

    bar = el('div', { 'class': 'nf-bar', role: 'region', 'aria-label': S.title });
    bar.innerHTML =
      '<strong class="nf-bar__title">✎ ' + esc(S.title) + '</strong>' +
      '<span class="nf-bar__hint">' + esc(S.hint) + ' ' + esc(S.lang) + ': <b data-nf-lang></b></span>' +
      '<button type="button" class="nf-btn" data-nf="next">' + esc(S.unfilled) + ': <b data-nf-count>0</b> · ' + esc(S.next) + ' ▸</button>' +
      '<button type="button" class="nf-btn nf-btn--quiet" data-nf="other">' + esc(S.other) + '</button>' +
      '<button type="button" class="nf-btn nf-btn--quiet" data-nf="backup">' + esc(S.backup) + '</button>' +
      '<span class="nf-status" role="status" aria-live="polite"></span>' +
      '<button type="button" class="nf-btn nf-btn--primary" data-nf="save">' + esc(S.save) + '</button>' +
      '<button type="button" class="nf-btn nf-btn--quiet" data-nf="exit">' + esc(S.exit) + '</button>';
    document.body.appendChild(bar);
    statusEl = bar.querySelector('.nf-status');
    countEl = bar.querySelector('[data-nf-count]');
    langEl = bar.querySelector('[data-nf-lang]');
    saveBtn = bar.querySelector('[data-nf="save"]');

    markEditable();
    setStatus('saved');
    updateLang();
    updateFill();

    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-nf]');
      if (!b) return;
      var act = b.getAttribute('data-nf');
      if (act === 'save') flush();
      else if (act === 'next') jumpToNext();
      else if (act === 'other') openOther();
      else if (act === 'backup') downloadBackup();
      else if (act === 'exit') leave();
    });

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('input', onInput);
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('paste', onPaste);
    document.addEventListener('drop', function (e) { if (isEditable(e.target)) e.preventDefault(); });
    document.addEventListener('click', onClickCapture, true);

    new MutationObserver(function () { updateLang(); updateFill(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    window.addEventListener('beforeunload', function (e) {
      if (Object.keys(pending).length) { e.preventDefault(); e.returnValue = ''; }
    });

    // Pick up other members' edits while this page stays open, but never mid-sentence.
    setInterval(function () {
      if (Object.keys(pending).length || document.activeElement && isEditable(document.activeElement)) return;
      refresh(false).then(function (changed) { if (changed) { markEditable(); updateFill(); } });
    }, 25000);
  }

  function markEditable() {
    document.querySelectorAll('[data-i18n], [data-edit]').forEach(function (n) {
      if (n.matches(SKIP_INLINE) || n.closest('.nf-bar, .nf-veil')) return;
      n.setAttribute('contenteditable', 'true');
      n.setAttribute('spellcheck', 'false');
      n.setAttribute('data-nf-edit', '');
    });
  }

  function isEditable(n) { return n && n.nodeType === 1 && n.hasAttribute('data-nf-edit'); }
  function editableOf(n) { return n && n.closest ? n.closest('[data-nf-edit]') : null; }

  function scopeOf(n) { return n.hasAttribute('data-edit') ? 'all' : window.NF.lang(); }
  function keyOf(n) { return n.getAttribute('data-edit') || n.getAttribute('data-i18n'); }

  // ---- typing ---------------------------------------------------------------------------

  var lastEditable = null;

  function onFocusIn(e) {
    var n = editableOf(e.target);
    if (!n) return;
    lastEditable = n;
    n._nfBefore = scopeOf(n) === 'all' ? n.textContent.trim() : window.NF.sanitize(n.innerHTML);
  }

  function onInput(e) {
    var n = editableOf(e.target);
    if (!n) return;
    var scope = scopeOf(n), key = keyOf(n);
    var html = scope === 'all' ? n.textContent.trim() : window.NF.sanitize(n.innerHTML);
    window.NF.setLocal(scope, key, html, n);
    var id = scope + '__' + key;
    var job = pending[id];
    pending[id] = { scope: scope, key: key, html: html, prev: job ? job.prev : (n._nfBefore || '') };
    setStatus('dirty');
    clearTimeout(timer);
    timer = setTimeout(flush, 1500);
    n.classList.toggle('nf-ph', PLACEHOLDER.test(n.textContent));
    updateFill();
  }

  function onFocusOut(e) {
    var n = editableOf(e.target);
    if (!n || scopeOf(n) === 'all') return;
    // Tidy whatever the browser put in (stray <div>, <b>, &nbsp;) once typing stops.
    var clean = window.NF.sanitize(n.innerHTML);
    if (clean !== n.innerHTML) n.innerHTML = clean;
    flush();
  }

  function onKeyDown(e) {
    if (e.key !== 'Enter' || !isEditable(e.target)) return;
    e.preventDefault();
    if (e.shiftKey) document.execCommand('insertLineBreak');
  }

  function onPaste(e) {
    if (!isEditable(e.target)) return;
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\s*\r?\n\s*/g, ' ');
    document.execCommand('insertText', false, text);
  }

  // Links, labels and buttons must not navigate or steal the click while editing, except the
  // language switch and menu toggle, which members need.
  function onClickCapture(e) {
    if (e.target.closest('.nf-bar, .nf-veil, .lang-switch, #nav-toggle')) return;
    if (e.target.closest('a, label, button')) e.preventDefault();
  }

  // ---- saving ---------------------------------------------------------------------------

  function setStatus(kind) {
    if (!statusEl) return;
    statusEl.textContent = S[kind] || '';
    statusEl.setAttribute('data-kind', kind);
    if (saveBtn) saveBtn.disabled = kind === 'saved';
  }

  function flush() {
    clearTimeout(timer);
    clearTimeout(retry);
    if (inflight) return inflight;
    var ids = Object.keys(pending);
    if (!ids.length) { setStatus('saved'); return Promise.resolve(); }
    setStatus('saving');
    inflight = ids.reduce(function (chain, id) {
      return chain.then(function () {
        var job = pending[id];
        return commit(id, job.html, job.prev).then(function () {
          if (pending[id] === job) delete pending[id];
          remote[id] = job.html;
        });
      });
    }, Promise.resolve()).then(function () {
      inflight = null;
      writeCache();
      if (Object.keys(pending).length) return flush();
      setStatus('saved');
    }, function (err) {
      inflight = null;
      if (err.denied) {
        store('session', SS_PASS, null);
        setStatus('error');
        askAccess(null, function (p) { store('session', SS_PASS, p); flush(); }, S.wrong);
        return;
      }
      setStatus('error');
      retry = setTimeout(flush, 8000);
    });
    return inflight;
  }

  function leave() {
    flush().then(function () {
      store('session', 'nf-edit', null);
      location.reload();
    });
  }

  function downloadBackup() {
    var blob = new Blob([JSON.stringify(remote, null, 2)], { type: 'application/json' });
    var a = el('a', { href: URL.createObjectURL(blob), download: 'norovbanzad-texts-' + new Date().toISOString().slice(0, 10) + '.json' });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ---- placeholders ---------------------------------------------------------------------

  function placeholderEls() {
    return Array.prototype.filter.call(document.querySelectorAll('[data-nf-edit]'), function (n) {
      return PLACEHOLDER.test(n.textContent);
    });
  }

  function updateFill() {
    if (!bar) return;
    document.querySelectorAll('[data-nf-edit]').forEach(function (n) {
      n.classList.toggle('nf-ph', PLACEHOLDER.test(n.textContent));
    });
    var n = placeholderEls().length;
    countEl.textContent = n;
    bar.querySelector('[data-nf="next"]').disabled = n === 0;
  }

  function updateLang() {
    if (langEl) langEl.textContent = window.NF.lang() === 'en' ? 'EN' : 'МН';
  }

  function jumpToNext() {
    var list = placeholderEls();
    if (!list.length) return;
    var target = list[0];
    if (lastEditable) {
      for (var i = 0; i < list.length; i++) {
        if (list[i] !== lastEditable && (lastEditable.compareDocumentPosition(list[i]) & Node.DOCUMENT_POSITION_FOLLOWING)) {
          target = list[i];
          break;
        }
      }
    }
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    target.focus({ preventScroll: true });
    // Select just the bracketed placeholder so typing replaces it and nothing else.
    var walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    var range = document.createRange(), found = false, node;
    while ((node = walker.nextNode())) {
      var m = PLACEHOLDER.exec(node.data);
      if (m) { range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length); found = true; break; }
    }
    if (!found) range.selectNodeContents(target);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // ---- buttons, menu and form labels (cannot be edited in place) -------------------------

  function openOther() {
    var seen = {}, rows = [];
    document.querySelectorAll('[data-i18n]').forEach(function (n) {
      var key = n.getAttribute('data-i18n');
      if (!n.matches(SKIP_INLINE) || seen[key]) return;
      seen[key] = true;
      rows.push({ key: key, text: n.textContent.trim() });
    });
    var veil = el('div', { 'class': 'nf-veil' });
    var dlg = el('div', { 'class': 'nf-dialog nf-dialog--wide', role: 'dialog', 'aria-modal': 'true', 'aria-label': S.otherTitle });
    dlg.innerHTML = '<h2>' + esc(S.otherTitle) + ' <small>(' + (window.NF.lang() === 'en' ? 'EN' : 'МН') + ')</small></h2><div class="nf-rows"></div>' +
      '<button type="button" class="nf-btn nf-btn--primary">' + esc(S.close) + '</button>';
    var box = dlg.querySelector('.nf-rows');
    rows.forEach(function (r) {
      var row = el('label', {});
      var input = el('input', { type: 'text', 'aria-label': r.text });
      input.value = r.text;
      input.addEventListener('input', function () {
        var scope = window.NF.lang(), html = esc(input.value);
        window.NF.setLocal(scope, r.key, html, null);
        if (r.key === 'doc.title') document.title = input.value;
        var id = scope + '__' + r.key;
        var job = pending[id];
        pending[id] = { scope: scope, key: r.key, html: html, prev: job ? job.prev : r.text };
        setStatus('dirty');
        clearTimeout(timer);
        timer = setTimeout(flush, 1500);
      });
      row.appendChild(input);
      box.appendChild(row);
    });
    veil.appendChild(dlg);
    document.body.appendChild(veil);
    dlg.querySelector('button').addEventListener('click', function () { document.body.removeChild(veil); flush(); });
    box.querySelector('input').focus();
  }
})();
