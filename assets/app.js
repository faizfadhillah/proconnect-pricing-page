/* Shared interactions for ProConnect prototype screens.
   Safe no-ops if the relevant elements aren't on the page. */
(function () {
  // Sidebar submenu expand/collapse
  document.addEventListener('click', function (e) {
    var head = e.target.closest('.has-sub > .nav-item');
    if (head) head.parentElement.classList.toggle('open');

    // FAQ accordion
    var q = e.target.closest('.faq-q');
    if (q) q.closest('.faq-item').classList.toggle('open');

    // Generic [data-toggle="next"] — toggle "open" on next sibling
    var t = e.target.closest('[data-accordion]');
    if (t) t.closest('[data-acc-item]')?.classList.toggle('open');

    // Close modal on overlay click or [data-close]
    if (e.target.classList && e.target.classList.contains('overlay')) e.target.remove();
    var c = e.target.closest('[data-close]');
    if (c) { var ov = c.closest('.overlay'); if (ov) ov.style.display = 'none'; }
  });

  // +/- counters: <div class="counter" data-min="0"> with [data-act]
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var wrap = btn.closest('.counter');
    if (!wrap) return;
    var val = wrap.querySelector('.counter-val');
    var n = parseInt(val.textContent, 10) || 0;
    var min = parseInt(wrap.dataset.min || '0', 10);
    n += btn.dataset.act === 'inc' ? 1 : -1;
    if (n < min) n = min;
    val.textContent = n;
    wrap.dispatchEvent(new CustomEvent('counterchange', { bubbles: true, detail: { value: n } }));
  });
})();
