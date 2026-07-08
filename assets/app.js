/* gulfgeek app.js — no dependencies */
(function () {
  'use strict';
  var PATH = location.pathname;
  var DATA = {};

  /* ---------- helpers ---------- */
  function $(s, el) { return (el || document).querySelector(s); }
  function $all(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function fmt(n) { return n.toLocaleString('en-US'); }
  function fetchJSON(url) { return fetch(url).then(function (r) { return r.json(); }); }

  /* ---------- nav: mobile menu + live count ---------- */
  function initNav() {
    var burger = $('.hamburger'), menu = $('.mobile-menu');
    if (burger && menu) {
      burger.addEventListener('click', function () { menu.classList.add('open'); });
      var close = $('.mm-close', menu);
      if (close) close.addEventListener('click', function () { menu.classList.remove('open'); });
    }
  }

  /* count-up animation for any element with [data-countup] */
  function countUp(node, target, ms) {
    ms = ms || 1100;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { node.textContent = fmt(target); return; }
    var start = null;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / ms, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      node.textContent = fmt(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounts(meta) {
    $all('[data-countup]').forEach(function (n) {
      countUp(n, parseInt(n.getAttribute('data-countup') || meta.total, 10));
    });
    $all('[data-navcount]').forEach(function (n) {
      n.textContent = fmt(meta.total) + ' signals analyzed';
    });
  }

  /* ---------- dropdown chips ---------- */
  function closeAllMenus() {
    $all('.chip.open').forEach(function (c) { c.classList.remove('open'); });
    $all('.menu.is-open').forEach(function (m) { m.classList.remove('is-open'); });
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.chip') && !e.target.closest('.menu')) closeAllMenus();
  });
  window.addEventListener('scroll', closeAllMenus, { passive: true });

  function buildChip(id, label, options, onChange) {
    var chip = $('#' + id);
    if (!chip) return null;
    var btn = $('button.trigger', chip), menu = $('.menu', chip);
    document.body.appendChild(menu);
    var state = { value: 'ALL', label: label };
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var was = chip.classList.contains('open');
      closeAllMenus();
      if (!was) {
        chip.classList.add('open');
        var r = btn.getBoundingClientRect();
        menu.classList.add('is-open');
        menu.style.top = (r.bottom + 4) + 'px';
        menu.style.left = Math.min(r.left, window.innerWidth - 250) + 'px';
      }
    });
    function render() {
      menu.innerHTML = '';
      var all = el('button', null, '<span>All ' + label.toLowerCase() + '</span>' + (state.value === 'ALL' ? '<span class="check">✓</span>' : ''));
      all.addEventListener('click', function () { set('ALL'); });
      menu.appendChild(all);
      options.forEach(function (o) {
        var b = el('button', null, '<span>' + o + '</span>' + (state.value === o ? '<span class="check">✓</span>' : ''));
        b.addEventListener('click', function () { set(o); });
        menu.appendChild(b);
      });
    }
    function set(v) {
      state.value = v;
      chip.classList.remove('open');
      menu.classList.remove('is-open');
      chip.classList.toggle('on', v !== 'ALL');
      $('.chip-label', btn).textContent = v === 'ALL' ? label : v;
      render();
      onChange();
    }
    render();
    return state;
  }

  /* ---------- skills page ---------- */
  function initSkills() {
    var rows = DATA.skills, meta = DATA.meta;
    var countries = uniq(rows.map(function (r) { return r.c; })).sort();
    var roles = uniq(rows.map(function (r) { return r.r; })).sort();
    var cats = uniq(rows.map(function (r) { return r.cat; })).sort();

    var fCountry = buildChip('f-country', 'Country', countries, update);
    var fRole = buildChip('f-role', 'Role', roles, update);
    var fCat = buildChip('f-cat', 'Skill category', cats, update);

    var tip = null;
    function showTip(anchor, skill, pct, count, segTotal, cat, conf) {
      hideTip();
      tip = el('div', 'tip',
        '<h4>' + skill + '</h4>' +
        '<div class="tr"><span>Demand</span><span>' + pct.toFixed(1) + '% of postings</span></div>' +
        '<div class="tr"><span>Signals</span><span>' + fmt(count) + ' of ' + fmt(segTotal) + '</span></div>' +
        '<div class="tr"><span>Category</span><span>' + cat + '</span></div>' +
        '<div class="tr"><span>Avg confidence</span><span>' + conf.toFixed(0) + ' / 100</span></div>');
      anchor.appendChild(tip);
      var r = tip.getBoundingClientRect();
      tip.style.left = 'min(60%, calc(100% - ' + r.width + 'px))';
      tip.style.top = '30px';
    }
    function hideTip() { if (tip && tip.parentNode) tip.parentNode.removeChild(tip); tip = null; }

    function update() {
      var sel = rows.filter(function (r) {
        return (fCountry.value === 'ALL' || r.c === fCountry.value) &&
               (fRole.value === 'ALL' || r.r === fRole.value);
      });
      /* denominator = distinct (country,role) segment totals in selection */
      var segTotals = {}, skillAgg = {}, skillConf = {}, skillCat = {};
      sel.forEach(function (r) {
        segTotals[r.c + '|' + r.r] = r.seg;
        if (fCat.value !== 'ALL' && r.cat !== fCat.value) return;
        skillAgg[r.s] = (skillAgg[r.s] || 0) + r.n;
        skillConf[r.s] = (skillConf[r.s] || []).concat([r.conf]);
        skillCat[r.s] = r.cat;
      });
      /* canonical denominators: meta for all, roles/geo files for single-axis filters,
         segment totals only when both axes are filtered */
      var denom;
      if (fCountry.value === 'ALL' && fRole.value === 'ALL') {
        denom = meta.total;
      } else if (fRole.value !== 'ALL' && fCountry.value === 'ALL') {
        var rRec = DATA.roles.filter(function (x) { return x.role === fRole.value; })[0];
        denom = rRec ? rRec.n : 0;
      } else if (fCountry.value !== 'ALL' && fRole.value === 'ALL') {
        var gRec = DATA.geo.filter(function (x) { return x.c === fCountry.value; })[0];
        denom = gRec ? gRec.cTotal : 0;
      } else {
        denom = Object.keys(segTotals).reduce(function (a, k) { return a + segTotals[k]; }, 0);
      }
      var allSkillMentions = sel.reduce(function (a, r) { return a + r.n; }, 0);

      /* KPI 1: signals matched */
      countUp($('#kpi-matched'), denom, 700);
      $('#kpi-matched-sub').innerHTML = denom >= 100
        ? '<span class="dot"></span> Human-reviewed sample'
        : '<span class="dot" style="background:var(--warn)"></span> Small sample — read with care';

      /* KPI 2: avg detected skills per posting within selection */
      var avg = denom ? (allSkillMentions / denom) : 0;
      $('#kpi-avg').textContent = avg.toFixed(1);
      var delta = avg - meta.avgSkills;
      $('#kpi-avg-sub').textContent = (fCountry.value === 'ALL' && fRole.value === 'ALL')
        ? '— across all reviewed signals'
        : (delta >= 0 ? '↑ ' : '↓ ') + Math.abs(delta).toFixed(1) + ' vs. all-market average';

      /* KPI 3: freshness (role- or country-scoped where possible) */
      var freshPct = meta.fresh30Pct, freshScope = 'all signals';
      if (fRole.value !== 'ALL' && fCountry.value === 'ALL') {
        var rr = DATA.roles.filter(function (x) { return x.role === fRole.value; })[0];
        if (rr && rr.n) { freshPct = rr.fresh / rr.n * 100; freshScope = 'this role'; }
      } else if (fCountry.value !== 'ALL' && fRole.value === 'ALL') {
        var g = DATA.geo.filter(function (x) { return x.c === fCountry.value; });
        var fN = g.reduce(function (a, x) { return a + x.fresh; }, 0);
        var tN = g.length ? g[0].cTotal : 0;
        if (tN) { freshPct = fN / tN * 100; freshScope = 'this country'; }
      } else if (fCountry.value !== 'ALL' && fRole.value !== 'ALL') {
        var sr = rows.filter(function (x) { return x.c === fCountry.value && x.r === fRole.value; })[0];
        if (sr && sr.seg) { freshPct = (sr.segFresh || 0) / sr.seg * 100; freshScope = 'this country-role segment'; }
      }
      $('#kpi-fresh').textContent = freshPct.toFixed(0) + '%';
      $('#kpi-fresh-sub').textContent = 'posted ≤ 30 days before cutoff · ' + freshScope;

      /* chart */
      var top = Object.keys(skillAgg).map(function (s) {
        var confs = skillConf[s];
        return { s: s, n: skillAgg[s], pct: denom ? skillAgg[s] / denom * 100 : 0, cat: skillCat[s], conf: confs.reduce(function (a, b) { return a + b; }, 0) / confs.length };
      }).sort(function (a, b) { return b.n - a.n; }).slice(0, 10);

      var wrap = $('#bars'); wrap.innerHTML = '';
      if (!top.length) { wrap.appendChild(el('div', 'empty', 'No skills detected for this combination. Try widening a filter.')); return; }
      var max = top[0].pct;
      top.forEach(function (t, i) {
        var row = el('div', 'bar-row');
        row.appendChild(el('div', 'lbl', t.s));
        var track = el('div', 'bar-track');
        var bar = el('div', 'bar');
        bar.style.width = Math.max(t.pct / max * 100, 2) + '%';
        bar.style.animationDelay = (i * 45) + 'ms';
        bar.setAttribute('tabindex', '0');
        bar.setAttribute('role', 'img');
        bar.setAttribute('aria-label', t.s + ' appears in ' + t.pct.toFixed(1) + '% of postings');
        ['mouseenter', 'focus'].forEach(function (ev) {
          bar.addEventListener(ev, function () { showTip(row, t.s, t.pct, t.n, denom, t.cat, t.conf); });
        });
        ['mouseleave', 'blur'].forEach(function (ev) { bar.addEventListener(ev, hideTip); });
        track.appendChild(bar);
        track.appendChild(el('span', 'bar-pct', t.pct.toFixed(1) + '%'));
        row.appendChild(track);
        wrap.appendChild(row);
      });
    }
    update();

    /* metric explainer modal */
    var modal = $('#metric-modal');
    $('#metric-info').addEventListener('click', function () { modal.classList.add('open'); });
    $('.x', modal).addEventListener('click', function () { modal.classList.remove('open'); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') modal.classList.remove('open'); });
  }

  /* ---------- jobs page ---------- */
  function initJobs() {
    var roles = DATA.roles.slice().sort(function (a, b) { return b.n - a.n; });
    var pillWrap = $('#pills'), detail = $('#role-detail');
    roles.forEach(function (r) {
      var p = el('button', 'pill', r.role + '<span class="cnt">' + fmt(r.n) + '</span>');
      p.addEventListener('click', function () {
        $all('.pill', pillWrap).forEach(function (x) { x.classList.remove('on'); });
        p.classList.add('on');
        renderRole(r);
      });
      pillWrap.appendChild(p);
    });

    function miniRows(container, items, denom) {
      items.forEach(function (it) {
        if (!it.v) return;
        var pct = it.v / denom * 100;
        var row = el('div', 'mini-row');
        row.appendChild(el('div', 'mlbl', it.l));
        var mb = el('div', 'mini-bar'); var fill = el('i'); fill.style.width = pct + '%'; mb.appendChild(fill);
        row.appendChild(mb);
        row.appendChild(el('div', 'mval', pct.toFixed(0) + '%'));
        container.appendChild(row);
      });
    }

    function renderRole(r) {
      detail.classList.add('show');
      $('#rd-title').textContent = r.role;
      $('#rd-sub').textContent = fmt(r.n) + ' reviewed signals · ' + r.pct.toFixed(1) + '% of the GCC analyst market · ' + (r.fresh / r.n * 100).toFixed(0) + '% posted ≤ 30 days before cutoff';

      /* seniority */
      var sen = $('#rd-seniority'); sen.innerHTML = '';
      miniRows(sen, [
        { l: 'Intern / graduate', v: r.intern }, { l: 'Junior', v: r.jr },
        { l: 'Mid / unspecified', v: r.mid }, { l: 'Senior', v: r.sr },
        { l: 'Lead / principal', v: r.lead }, { l: 'Manager+', v: r.mgr }
      ], r.n);

      /* top skills for role (all countries) */
      var sk = {}, segTotals = {};
      DATA.skills.forEach(function (x) {
        if (x.r !== r.role) return;
        segTotals[x.c] = x.seg;
        sk[x.s] = (sk[x.s] || 0) + x.n;
      });
      var denom = Object.keys(segTotals).reduce(function (a, k) { return a + segTotals[k]; }, 0) || r.n;
      var topSk = Object.keys(sk).map(function (s) { return { l: s, v: sk[s] }; })
        .sort(function (a, b) { return b.v - a.v; }).slice(0, 6);
      var skEl = $('#rd-skills'); skEl.innerHTML = '';
      if (topSk.length) miniRows(skEl, topSk, denom);
      else skEl.appendChild(el('div', 'empty', 'Too few skill-bearing signals for this role.'));

      /* country split */
      var co = Object.keys(segTotals).map(function (c) { return { l: c, v: segTotals[c] }; })
        .sort(function (a, b) { return b.v - a.v; });
      var coEl = $('#rd-countries'); coEl.innerHTML = '';
      miniRows(coEl, co, denom);

      detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /* ---------- promo dismiss ---------- */
  function initPromo() {
    $all('.promo .x').forEach(function (x) {
      x.addEventListener('click', function () { x.closest('.promo').style.display = 'none'; });
    });
  }

  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }

  /* ---------- boot ---------- */
  var need = ['meta'];
  if (/skills/.test(PATH)) need = ['meta', 'skills', 'roles', 'geo'];
  else if (/jobs/.test(PATH)) need = ['meta', 'roles', 'skills'];

  Promise.all(need.map(function (k) { return fetchJSON('data/' + k + '.json'); }))
    .then(function (res) {
      need.forEach(function (k, i) { DATA[k] = res[i]; });
      initNav();
      initCounts(DATA.meta);
      initPromo();
      if (/skills/.test(PATH)) initSkills();
      if (/jobs/.test(PATH)) initJobs();
    })
    .catch(function (err) {
      console.error('gulfgeek data load failed', err);
      initNav();
    });
})();
