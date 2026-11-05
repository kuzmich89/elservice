(function () {
  'use strict';
  const menu = document.getElementById('site-navigation');
  const toggle = document.getElementById('menu-toggle');
  const backdrop = document.querySelector('.menu-backdrop');
  const narrow = window.matchMedia('(max-width: 900px)');
  function setMenu(open, restoreFocus = false) {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    backdrop.hidden = !open;
    if (open) menu.querySelector('button').focus();
    else if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.querySelector('.menu-close').addEventListener('click', () => setMenu(false, true));
  backdrop.addEventListener('click', () => setMenu(false, true));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  narrow.addEventListener('change', () => setMenu(false));
  document.addEventListener('keydown', event => {
    if (!document.body.classList.contains('menu-open')) return;
    if (event.key === 'Escape') {event.preventDefault(); setMenu(false, true);}
    if (event.key === 'Tab') {
      const items = Array.from(menu.querySelectorAll('a, button'));
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
    }
  });
  const filters = document.querySelectorAll('[data-filter]');
  filters.forEach(button => button.addEventListener('click', () => {
    let count = 0;
    document.querySelectorAll('[data-category]').forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) count++;
    });
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const status = document.getElementById('product-count');
    status.textContent = count + ' ' + status.dataset.unit;
  }));
  const dialog = document.getElementById('photo-dialog');
  if (dialog) {
    const triggers = Array.from(document.querySelectorAll('[data-photo]'));
    let current = 0, opener;
    function show(index) {
      current = (index + triggers.length) % triggers.length;
      const image = document.getElementById('dialog-photo');
      image.src = triggers[current].dataset.photo;
      image.alt = triggers[current].querySelector('img').alt;
      document.getElementById('photo-count').textContent = (current + 1) + ' / ' + triggers.length;
    }
    triggers.forEach((button, index) => button.addEventListener('click', () => {
      opener = button; show(index); dialog.showModal();
    }));
    dialog.querySelector('[data-photo-close]').addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-photo-prev]').addEventListener('click', () => show(current - 1));
    dialog.querySelector('[data-photo-next]').addEventListener('click', () => show(current + 1));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') show(current + 1);
      if (event.key === 'ArrowLeft') show(current - 1);
    });
    dialog.addEventListener('close', () => {if (opener) opener.focus();});
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  }
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {entry.target.classList.add('is-revealing'); observer.unobserve(entry.target);}
    }), {threshold: .15});
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
  }
})();
