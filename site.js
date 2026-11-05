(function () {
  'use strict';

  // Handover: put the venue's WhatsApp number here (digits with country code) and the send button switches to WhatsApp.
  var WHATSAPP = '';
  var IG_DM = 'https://ig.me/m/gavi.eg';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* header: transparent over the hero, solid after it */
  var hdr = $('#hdr');
  var sentinel = $('#sentinel');
  if (hdr && sentinel && hasIO) {
    new IntersectionObserver(function (es) {
      var e = es[0];
      var past = !e.isIntersecting && e.boundingClientRect.top < 0;
      hdr.classList.toggle('is-solid', past);
    }, { threshold: 0 }).observe(sentinel);
  } else if (hdr && sentinel) {
    hdr.classList.add('is-solid');
  }

  /* reveal on scroll, and the one slow scale-in on the crust close-up */
  var rv = $$('.rv');
  var crust = $('#crust');
  if (hasIO && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (n) { io.observe(n); });
    if (crust) {
      new IntersectionObserver(function (es, o) {
        if (es[0].isIntersecting) { crust.classList.add('in'); o.disconnect(); }
      }, { threshold: 0.35 }).observe(crust);
    }
  } else {
    rv.forEach(function (n) { n.classList.add('in'); });
    if (crust) crust.classList.add('in');
  }

  /* drawer */
  var drawer = $('#drawer');
  var burger = $('.burger');
  var lastFocus = null;
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    if (open) { drawer.removeAttribute('inert'); } else { drawer.setAttribute('inert', ''); }
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) {
      lastFocus = document.activeElement;
      var first = $('.drawer-close', drawer);
      if (first) first.focus();
    } else if (lastFocus && lastFocus.focus) {
      lastFocus.focus();
    }
  }
  if (burger) burger.addEventListener('click', function () { setDrawer(true); });
  if (drawer) {
    $$('[data-close]', drawer).forEach(function (n) { n.addEventListener('click', function () { setDrawer(false); }); });
    $$('.drawer-links a, .drawer-foot a', drawer).forEach(function (a) {
      a.addEventListener('click', function () { setDrawer(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('is-open')) setDrawer(false); });
  }

  /* Arabic pop-up */
  var pop = $('#ar-pop');
  $$('.ar-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!pop) return;
      if (pop.showModal) { if (!pop.open) pop.showModal(); } else { pop.setAttribute('open', ''); }
      var ok = $('[data-close-pop]', pop); if (ok) ok.focus();
    });
  });
  if (pop) {
    var closePop = function () { if (pop.close) pop.close(); else pop.removeAttribute('open'); };
    $('[data-close-pop]', pop).addEventListener('click', closePop);
    pop.addEventListener('click', function (e) { if (e.target === pop) closePop(); });
  }

  /* bottom bar: hides on the way down, and over the plan form and the footer */
  var dock = $('#dock');
  if (dock) {
    var forced = 0;
    var heroEnd = $('#sentinel');
    var pastHero = !heroEnd;
    if (heroEnd) dock.classList.add('is-hidden');
    var lastY = window.scrollY, ticking = false;
    var update = function () {
      var y = window.scrollY;
      if (heroEnd) pastHero = heroEnd.getBoundingClientRect().top < window.innerHeight * 0.5;
      if (forced > 0 || !pastHero) dock.classList.add('is-hidden');
      else if (y > lastY + 8 && y > 240) dock.classList.add('is-hidden');
      else if (y < lastY - 8 || (y < 240 && !heroEnd)) dock.classList.remove('is-hidden');
      lastY = y; ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    if (hasIO) {
      var watch = $$('#footer, #plan');
      var inView = new Set();
      var fio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) inView.add(e.target); else inView.delete(e.target); });
        forced = inView.size; update();
      }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
      watch.forEach(function (n) { fio.observe(n); });
    }
  }

  /* plan a table */
  var form = $('#plan-form');
  if (form) {
    var nameI = $('#f-name'), dateI = $('#f-date'), timeI = $('#f-time'), guestsO = $('#f-guests'), msg = $('#f-msg');
    var send = $('#send'), copy = $('#copy'), status = $('#status'), nameErr = $('#f-name-err');
    var guests = 2, occ = '';
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
    var today = new Date();
    var tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    dateI.min = iso(today);
    dateI.value = iso(tomorrow);

    var dateText = function () {
      if (!dateI.value) return '';
      var p = dateI.value.split('-');
      var d = new Date(+p[0], +p[1] - 1, +p[2]);
      var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()];
    };
    var compose = function () {
      var n = nameI.value.trim();
      var t = 'Hello Gavi, ' + (n ? 'this is ' + n + '. ' : '') + 'I would like to plan a table for ' + guests + (guests === 1 ? ' guest' : ' guests');
      var d = dateText();
      if (d) t += ' on ' + d;
      if (timeI.value) t += ' at ' + timeI.value;
      t += '.';
      if (occ) t += ' It is for ' + occ + '.';
      t += ' Could you let me know if you have space? Thank you.';
      return t;
    };
    var refresh = function () {
      guestsO.textContent = guests + (guests === 1 ? ' guest' : ' guests');
      msg.value = compose();
      var m = msg.value;
      if (WHATSAPP) {
        send.href = 'https://wa.me/' + WHATSAPP.replace(/\D/g, '') + '?text=' + encodeURIComponent(m);
        send.textContent = 'Send on WhatsApp';
      } else {
        send.href = IG_DM;
      }
    };
    $('.minus', form).addEventListener('click', function () { guests = Math.max(1, guests - 1); refresh(); });
    $('.plus', form).addEventListener('click', function () { guests = Math.min(20, guests + 1); refresh(); });
    $$('.chip', form).forEach(function (c) {
      c.addEventListener('click', function () {
        var on = c.getAttribute('aria-pressed') === 'true';
        $$('.chip', form).forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        if (!on) { c.setAttribute('aria-pressed', 'true'); occ = c.getAttribute('data-occ'); } else { occ = ''; }
        refresh();
      });
    });
    [nameI, dateI, timeI].forEach(function (n) { n.addEventListener('input', function () { refresh(); if (n === nameI) clearErr(); }); n.addEventListener('change', refresh); });
    var clearErr = function () { nameErr.textContent = ''; nameI.removeAttribute('aria-invalid'); };
    var needName = function () {
      if (nameI.value.trim()) return true;
      nameErr.textContent = 'Add your name so the team knows who to reply to.';
      nameI.setAttribute('aria-invalid', 'true');
      nameI.focus();
      return false;
    };
    var copyText = function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise(function (res, rej) {
        try { msg.removeAttribute('readonly'); msg.select(); var ok = document.execCommand('copy'); msg.setAttribute('readonly', ''); ok ? res() : rej(); } catch (err) { rej(err); }
      });
    };
    var say = function (t) { status.textContent = t; };
    send.addEventListener('click', function (ev) {
      if (!needName()) { ev.preventDefault(); return; }
      refresh();
      if (WHATSAPP) { say('Opening WhatsApp with your message.'); return; }
      copyText(msg.value).then(function () { say('Message copied. Paste it into the chat that opens.'); },
        function () { msg.focus(); msg.select(); say('Copy the message above, then paste it into the chat that opens.'); });
    });
    copy.addEventListener('click', function () {
      if (!needName()) return;
      refresh();
      copyText(msg.value).then(function () { say('Message copied.'); },
        function () { msg.focus(); msg.select(); say('Select the message above and copy it.'); });
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    refresh();
  }

  /* menu: chips follow the page, search filters live */
  var chipbar = $('#chipbar');
  if (chipbar) {
    var links = $$('a', chipbar);
    var secs = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var rail = $('.chipbar-in', chipbar);
    var setActive = function (i) {
      links.forEach(function (a, k) { if (k === i) { a.classList.add('is-active'); a.setAttribute('aria-current', 'true'); } else { a.classList.remove('is-active'); a.removeAttribute('aria-current'); } });
      var a = links[i];
      if (a && rail) {
        var left = a.offsetLeft - (rail.clientWidth - a.offsetWidth) / 2;
        if (rail.scrollTo) rail.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
      }
    };
    if (hasIO) {
      var seen = new Set();
      var offset = (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hdr'), 10) || 64) + 70;
      var so = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
        for (var i = 0; i < secs.length; i++) { if (secs[i] && seen.has(secs[i])) { setActive(i); return; } }
      }, { rootMargin: '-' + offset + 'px 0px -62% 0px', threshold: 0 });
      secs.forEach(function (s) { if (s) so.observe(s); });
    }

    var q = $('#q'), clear = $('#q-clear'), empty = $('#m-empty');
    var items = $$('.m-item');
    var norm = function (s) { return s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); };
    var index = items.map(function (it) { return norm(it.textContent); });
    var run = function () {
      var v = norm(q.value);
      clear.classList.toggle('show', !!q.value);
      var any = false;
      items.forEach(function (it, i) {
        var show = !v || v.split(' ').every(function (w) { return index[i].indexOf(w) > -1; });
        it.hidden = !show;
        if (show) any = true;
      });
      $$('.m-grp').forEach(function (g) { g.hidden = !$$('.m-item', g).some(function (i) { return !i.hidden; }); });
      $$('.m-sec').forEach(function (s, i) {
        var has = $$('.m-item', s).some(function (it) { return !it.hidden; });
        s.hidden = !has;
        if (links[i]) links[i].hidden = !has;
      });
      var pair = $('#m-pair'); if (pair) pair.hidden = !!v;
      empty.classList.toggle('show', !any);
    };
    q.addEventListener('input', run);
    clear.addEventListener('click', function () { q.value = ''; run(); q.focus(); });
  }
})();
