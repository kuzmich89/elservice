/* Contact form delivery and validation. No third-party scripts are loaded. */
(function () {
  'use strict';
  const endpoint = 'https://formsubmit.co/ajax/oleksandr.kuzmich@gmail.com';
  function validPhone(value) {
    var digits = value.replace(/\D/g, '');
    return /^\+?[\d\s().-]+$/.test(value) && digits.length >= 9 && digits.length <= 13 &&
      !/^(\d)\1+$/.test(digits) && !/^(1234567890|0123456789)$/.test(digits);
  }
  async function sendMessage(fields, fetcher, signal) {
    var data = new URLSearchParams();
    fields.forEach(function (value, key) {
      if (/^(name|phone|email|textarea|message)$/i.test(key)) data.append(key, value);
    });
    data.set('_subject', 'Нова заявка з сайту Електросервіс');
    data.set('_template', 'table');
    data.set('_captcha', 'false');
    var response = await fetcher(endpoint, {
      method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json'},
      body: data.toString(), signal: signal
    });
    if (!response.ok) throw new Error('Form service HTTP ' + response.status);
    var result = await response.json();
    if (!result || (result.success !== true && result.success !== 'true')) throw new Error('Submission not confirmed');
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = {validPhone, sendMessage};
    return;
  }
  const english = document.documentElement.lang === 'en';
  const text = english ? {
    send: 'Send message', pending: 'Sending…', success: 'Thank you! Your message has been sent.',
    invalidPhone: 'Enter a valid phone number (9–13 digits).',
    error: 'Your message could not be sent. Please try again or email office@elservis.com.ua.'
  } : {
    send: 'Надіслати', pending: 'Надсилаємо…', success: 'Дякуємо! Ваше повідомлення надіслано.',
    invalidPhone: 'Вкажіть коректний номер телефону (9–13 цифр).',
    error: 'Не вдалося надіслати повідомлення. Спробуйте ще раз або напишіть на office@elservis.com.ua.'
  };
  document.querySelectorAll('[data-contact-form]').forEach(form => {
    let pending = false;
    const phone = form.elements.Phone;
    const button = form.querySelector('[type="submit"]');
    const status = form.querySelector('.form-status');
    phone.addEventListener('input', () => phone.setCustomValidity(''));
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending) return;
      phone.setCustomValidity(validPhone(phone.value) ? '' : text.invalidPhone);
      if (!form.reportValidity()) return;
      const fields = new FormData(form);
      if (fields.get('_hp_email')) {status.textContent = text.error; status.dataset.state = 'error'; return;}
      pending = true; button.disabled = true; button.textContent = text.pending;
      form.setAttribute('aria-busy', 'true'); status.dataset.state = 'pending'; status.textContent = text.pending;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        await sendMessage(fields, window.fetch.bind(window), controller.signal);
        form.reset(); status.dataset.state = 'success'; status.textContent = text.success;
      } catch {
        status.dataset.state = 'error'; status.textContent = text.error;
      } finally {
        clearTimeout(timer); pending = false; button.disabled = false; button.textContent = text.send;
        form.removeAttribute('aria-busy');
      }
    });
  });
})();
