// Chrome: nav toggle, active-link highlighting, footer year. Does not touch the helix visual (see helix.js).
(function () {
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

  // Contact form. There is no backend yet, so rather than let a visitor type a message and watch
  // it vanish, submit is intercepted while `data-endpoint` is empty and the fallback email is
  // shown instead. Fill in data-endpoint (Formspree/Netlify/your own POST route) and this handler
  // hands over to a normal POST automatically -- no code change needed at that point.
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');

  if (form && status) {
    var endpoint = form.getAttribute('data-endpoint');

    // Point the form at the endpoint up front. Assigning action inside the submit handler is too
    // late in some browsers -- the target is already resolved by then -- so it's done at init.
    if (endpoint) {
      form.setAttribute('action', endpoint);
      form.setAttribute('method', 'post');
    }

    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        setStatus('Please complete the required fields before sending.', 'error');
        var firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (!endpoint) {
        e.preventDefault();
        setStatus(
          'The message form is not connected yet — please email the Foundation directly and we will reply.',
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
