/* FormSubmit.co: intercept Tilda XHR and redirect to FormSubmit
 * Spam protection: honeypot injection, timing check, phone validation, content check
 */
(function () {
  'use strict';

  var FORMSUBMIT_URL = 'https://formsubmit.co/ajax/oleksandr.kuzmich@gmail.com';

  /* ── Timing: record when the page script first ran ── */
  var PAGE_LOAD_TIME = Date.now();
  var MIN_FILL_MS = 4000; /* reject submissions faster than 4 seconds */

  /* ── Honeypot: inject hidden field into every Tilda form ── */
  function injectHoneypot() {
    var forms = document.querySelectorAll('form.js-form, form[data-tilda-form]');
    forms.forEach(function (form) {
      if (form.querySelector('input[name="_hp_email"]')) return; /* already injected */
      var trap = document.createElement('input');
      trap.type = 'text';
      trap.name = '_hp_email';
      trap.tabIndex = -1;
      trap.autocomplete = 'off';
      /* visually hidden but still in DOM so bots pick it up */
      trap.setAttribute('aria-hidden', 'true');
      trap.style.cssText = 'position:absolute;left:-9999px;top:-9999px;' +
        'opacity:0;height:0;width:0;pointer-events:none;';
      form.appendChild(trap);
    });
  }

  /* Inject on DOM ready and again after a short delay (Tilda renders forms async) */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectHoneypot();
      setTimeout(injectHoneypot, 1500);
      setTimeout(injectHoneypot, 3000);
    });
  } else {
    injectHoneypot();
    setTimeout(injectHoneypot, 1500);
    setTimeout(injectHoneypot, 3000);
  }

  /* ── Phone validation (Ukrainian numbers) ── */
  function isValidPhone(raw) {
    if (!raw) return true; /* no phone field — skip check */
    var digits = raw.replace(/\D/g, '');

    /* too short or too long */
    if (digits.length < 9 || digits.length > 13) return false;

    /* all same digit (e.g. 0000000000 or 1111111111) */
    if (/^(\d)\1+$/.test(digits)) return false;

    /* obviously sequential (1234567890) */
    if (digits === '1234567890' || digits === '0123456789') return false;

    return true;
  }

  /* ── Content spam check ── */
  function isSpamContent(data) {
    var text = (data.get('Textarea') || data.get('Message') || data.get('message') || '').toLowerCase();
    if (!text) return false;

    /* more than 2 URLs → spam */
    var urlCount = (text.match(/https?:\/\/|www\./g) || []).length;
    if (urlCount > 2) return true;

    /* common spam phrases */
    var spamPhrases = ['casino', 'crypto', 'bitcoin', 'buy now', 'click here',
      'free money', 'make money', 'seo', 'backlink', 'discount offer',
      'weight loss', 'diet pill', 'payday loan'];
    for (var i = 0; i < spamPhrases.length; i++) {
      if (text.indexOf(spamPhrases[i]) !== -1) return true;
    }

    return false;
  }

  /* ── XHR proxy ── */
  var NativeXHR = window.XMLHttpRequest;

  window.XMLHttpRequest = function () {
    var real = new NativeXHR();
    var self = this;
    var isTilda = false;
    var _readyState = 0;
    var _status = 0;
    var _statusText = '';
    var _responseText = '';

    /* ── proxy readState / status / responseText ── */
    Object.defineProperty(self, 'readyState', {
      get: function () { return isTilda ? _readyState : real.readyState; }
    });
    Object.defineProperty(self, 'status', {
      get: function () { return isTilda ? _status : real.status; }
    });
    Object.defineProperty(self, 'statusText', {
      get: function () { return isTilda ? _statusText : real.statusText; }
    });
    Object.defineProperty(self, 'responseText', {
      get: function () { return isTilda ? _responseText : real.responseText; }
    });
    Object.defineProperty(self, 'response', {
      get: function () { return isTilda ? _responseText : real.response; }
    });
    Object.defineProperty(self, 'responseXML', {
      get: function () { return isTilda ? null : real.responseXML; }
    });
    Object.defineProperty(self, 'responseURL', {
      get: function () { return isTilda ? '' : real.responseURL; }
    });

    /* ── proxy writable props ── */
    ['timeout', 'withCredentials', 'responseType'].forEach(function (p) {
      Object.defineProperty(self, p, {
        get: function () { return real[p]; },
        set: function (v) { real[p] = v; }
      });
    });

    /* ── proxy event handlers ── */
    ['onreadystatechange', 'onload', 'onerror', 'onabort', 'ontimeout',
      'onprogress', 'onloadstart', 'onloadend'].forEach(function (ev) {
      Object.defineProperty(self, ev, {
        get: function () { return real[ev]; },
        set: function (v) { real[ev] = v; }
      });
    });

    self.upload = real.upload;

    /* ── open ── */
    self.open = function (method, url) {
      if (url && (url.indexOf('tildaapi') !== -1 || url.indexOf('/procces/') !== -1)) {
        isTilda = true;
        return; /* do not open real XHR */
      }
      return real.open.apply(real, arguments);
    };

    /* ── setRequestHeader ── */
    self.setRequestHeader = function (name, value) {
      if (!isTilda) real.setRequestHeader.apply(real, arguments);
    };

    /* ── fakeSuccess: silently drop spam but keep good UX ── */
    function fakeSuccess() {
      _readyState = 4;
      _status = 200;
      _statusText = 'OK';
      _responseText = '{"status":"ok"}';
      if (real.onreadystatechange) real.onreadystatechange();
    }

    /* ── send ── */
    self.send = function (body) {
      if (!isTilda) return real.send.apply(real, arguments);

      var data = new URLSearchParams(body || '');

      /* 1. HONEYPOT: if the hidden trap field is filled → bot */
      var honey = data.get('_hp_email');
      if (honey && honey.trim() !== '') {
        return fakeSuccess();
      }

      /* 2. TIMING: reject if form submitted too fast */
      var elapsed = Date.now() - PAGE_LOAD_TIME;
      if (elapsed < MIN_FILL_MS) {
        return fakeSuccess();
      }

      /* 3. PHONE VALIDATION */
      var phone = data.get('Phone') || data.get('Телефон') || data.get('phone');
      if (!isValidPhone(phone)) {
        /* show error to user rather than silently dropping */
        _readyState = 4;
        _status = 400;
        _statusText = 'Bad Request';
        _responseText = '{"message":"Будь ласка, вкажіть коректний номер телефону"}';
        if (real.onreadystatechange) real.onreadystatechange();
        return;
      }

      /* 4. SPAM CONTENT CHECK */
      if (isSpamContent(data)) {
        return fakeSuccess();
      }

      /* ── All checks passed: send to FormSubmit ── */
      data.set('_subject', 'Нова заявка з сайту Електросервіс');
      data.set('_captcha', 'false');
      data.set('_template', 'table');
      /* remove Tilda's honeypot field before sending (keep our custom one removed) */
      data.delete('_hp_email');

      fetch(FORMSUBMIT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: data.toString()
      }).then(function (res) {
        return res.json();
      }).then(function () {
        _readyState = 4;
        _status = 200;
        _statusText = 'OK';
        _responseText = '{"status":"ok"}';
        if (real.onreadystatechange) real.onreadystatechange();
      }).catch(function (err) {
        console.error('[formsubmit] submission error:', err);
        /* still show success to user so UX is not broken */
        _readyState = 4;
        _status = 200;
        _statusText = 'OK';
        _responseText = '{"status":"ok"}';
        if (real.onreadystatechange) real.onreadystatechange();
      });
    };

    /* ── misc ── */
    self.abort = function () { if (!isTilda) real.abort(); };
    self.getResponseHeader = function (n) {
      return isTilda ? null : real.getResponseHeader(n);
    };
    self.getAllResponseHeaders = function () {
      return isTilda ? '' : real.getAllResponseHeaders();
    };
    self.addEventListener = function (t, fn, opts) {
      if (!isTilda) real.addEventListener(t, fn, opts);
    };
    self.removeEventListener = function (t, fn, opts) {
      if (!isTilda) real.removeEventListener(t, fn, opts);
    };
    self.overrideMimeType = function (m) {
      if (!isTilda) real.overrideMimeType(m);
    };
  };

  /* copy static constants */
  window.XMLHttpRequest.UNSENT = 0;
  window.XMLHttpRequest.OPENED = 1;
  window.XMLHttpRequest.HEADERS_RECEIVED = 2;
  window.XMLHttpRequest.LOADING = 3;
  window.XMLHttpRequest.DONE = 4;
})();
