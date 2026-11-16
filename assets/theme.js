/* مسار — المظهر: وضع فاتح/غامق/تلقائي، ولون أساسي حرّ، وحواف، وحجم نص.
   كل شيء محلي: يُحفظ في localStorage ولا يُرسل إلى أي مكان. */
(function () {
  "use strict";

  var KEY = "masar.theme.v1";
  var DEFAULTS = { mode: "auto", accent: "#c8f169", round: 1, text: 1 };

  var PRESETS = [
    { c: "#c8f169", name: "ليموني" },
    { c: "#8cd6ef", name: "أزرق" },
    { c: "#e0a86a", name: "نحاسي" },
    { c: "#f2a0c4", name: "وردي" },
    { c: "#b9a6f5", name: "بنفسجي" },
    { c: "#9fd8a8", name: "أخضر" }
  ];

  /* ── أدوات لون صغيرة ── */
  function hex2rgb(h) {
    h = h.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgb2hex(a) {
    return "#" + a.map(function (v) {
      var x = Math.max(0, Math.min(255, Math.round(v))).toString(16);
      return x.length === 1 ? "0" + x : x;
    }).join("");
  }
  function mix(a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    return rgb2hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
  }
  function lum(hex) {
    var c = hex2rgb(hex).map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  /* نُغمّق أو نُفتّح حتى يبلغ اللون تباينًا كافيًا مع خلفيته */
  function ensure(hex, bg, target, toward) {
    var out = hex, i = 0;
    while (contrast(out, bg) < target && i < 30) {
      out = mix(out, toward, 0.07);
      i++;
    }
    return out;
  }

  /* ── الحالة ── */
  var t = { mode: DEFAULTS.mode, accent: DEFAULTS.accent, round: DEFAULTS.round, text: DEFAULTS.text };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && typeof saved === "object") {
      if (saved.mode) t.mode = saved.mode;
      if (saved.accent) t.accent = saved.accent;
      if (typeof saved.round === "number") t.round = saved.round;
      if (typeof saved.text === "number") t.text = saved.text;
    }
  } catch (e) {}

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(t)); } catch (e) {}
  }

  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function resolvedMode() {
    if (t.mode === "dark") return "dark";
    if (t.mode === "light") return "light";
    return mq && mq.matches ? "dark" : "light";
  }

  function apply() {
    var html = document.documentElement;
    var mode = resolvedMode();
    html.setAttribute("data-theme", mode);

    var paper = mode === "dark" ? "#0e181d" : "#f3f6ee";
    var accent = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t.accent) ? t.accent : DEFAULTS.accent;

    /* لون نصّي فوق اللون الأساسي: داكن دائمًا إن كان اللون فاتحًا */
    var accentInk = contrast(accent, "#16220f") >= contrast(accent, "#ffffff") ? "#16220f" : "#ffffff";

    var deep = mode === "dark"
      ? ensure(accent, paper, 4.6, "#ffffff")
      : ensure(accent, paper, 4.6, "#000000");

    html.style.setProperty("--accent", accent);
    html.style.setProperty("--accent-deep", deep);
    html.style.setProperty("--accent-line", mix(accent, paper, mode === "dark" ? 0.55 : 0.45));
    html.style.setProperty("--accent-ink", accentInk);
    html.style.setProperty("--round", String(t.round));
    html.style.setProperty("--text-scale", String(t.text));

    document.querySelectorAll("[data-mode-btn]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-mode-btn") === t.mode));
    });
    document.querySelectorAll("[data-accent-swatch]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-accent-swatch").toLowerCase() === accent.toLowerCase()));
    });
    var inp = document.querySelector("[data-accent-input]");
    if (inp && document.activeElement !== inp) inp.value = accent;
    var rr = document.querySelector("[data-round]");
    if (rr) rr.value = String(t.round);
    var tr = document.querySelector("[data-text]");
    if (tr) tr.value = String(t.text);
  }

  /* ── الواجهة ── */
  var HTML = '' +
    '<button id="thBtn" class="th-fab" type="button" aria-expanded="false" aria-controls="thPanel" title="إعدادات المظهر">' +
      '<span aria-hidden="true">⚙</span><span class="th-fab-t">المظهر</span>' +
    '</button>' +
    '<div id="thPanel" class="th-panel" role="dialog" aria-label="إعدادات المظهر" hidden>' +
      '<div class="th-head"><b>المظهر</b>' +
        '<button type="button" class="th-close" data-th-close aria-label="إغلاق">✕</button></div>' +

      '<div class="th-field">' +
        '<span class="th-label">الوضع</span>' +
        '<div class="th-seg" role="group" aria-label="وضع الألوان">' +
          '<button type="button" data-mode-btn="light">فاتح</button>' +
          '<button type="button" data-mode-btn="dark">غامق</button>' +
          '<button type="button" data-mode-btn="auto">تلقائي</button>' +
        '</div>' +
      '</div>' +

      '<div class="th-field">' +
        '<span class="th-label">اللون الأساسي</span>' +
        '<div class="th-swatches">' +
          PRESETS.map(function (p) {
            return '<button type="button" data-accent-swatch="' + p.c + '" style="--sw:' + p.c + '" title="' + p.name + '" aria-label="' + p.name + '"></button>';
          }).join("") +
        '</div>' +
        '<label class="th-custom">لون آخر' +
          '<input type="color" data-accent-input value="' + t.accent + '" aria-label="اختر لونًا" />' +
        '</label>' +
      '</div>' +

      '<div class="th-field">' +
        '<label class="th-label" for="thRound">الحواف</label>' +
        '<input id="thRound" type="range" min="0" max="1.8" step="0.1" data-round aria-describedby="thRoundHint" />' +
        '<span class="th-hint" id="thRoundHint">من الحادّ إلى الدائري</span>' +
      '</div>' +

      '<div class="th-field">' +
        '<label class="th-label" for="thText">حجم النص</label>' +
        '<input id="thText" type="range" min="0.9" max="1.3" step="0.05" data-text />' +
      '</div>' +

      '<div class="th-foot">' +
        '<button type="button" class="th-reset" data-th-reset>إعادة الضبط</button>' +
        '<span class="th-note">يُحفظ في هذا الجهاز وحده.</span>' +
      '</div>' +
    '</div>';

  function mount() {
    var wrap = document.createElement("div");
    wrap.innerHTML = HTML;
    var fab = wrap.firstChild;
    var panel = wrap.lastChild;
    document.body.appendChild(fab);
    document.body.appendChild(panel);

    function open(show) {
      if (show) { panel.removeAttribute("hidden"); fab.setAttribute("aria-expanded", "true"); }
      else { panel.setAttribute("hidden", ""); fab.setAttribute("aria-expanded", "false"); }
    }

    fab.addEventListener("click", function () { open(panel.hasAttribute("hidden")); });
    panel.querySelector("[data-th-close]").addEventListener("click", function () { open(false); fab.focus(); });

    panel.querySelectorAll("[data-mode-btn]").forEach(function (b) {
      b.addEventListener("click", function () {
        t.mode = b.getAttribute("data-mode-btn");
        save(); apply();
      });
    });

    panel.querySelectorAll("[data-accent-swatch]").forEach(function (b) {
      b.addEventListener("click", function () {
        t.accent = b.getAttribute("data-accent-swatch");
        save(); apply();
      });
    });

    var ci = panel.querySelector("[data-accent-input]");
    ci.addEventListener("input", function () {
      t.accent = ci.value;
      save(); apply();
    });

    var rr = panel.querySelector("[data-round]");
    rr.addEventListener("input", function () {
      t.round = Number(rr.value);
      save(); apply();
    });

    var tr = panel.querySelector("[data-text]");
    tr.addEventListener("input", function () {
      t.text = Number(tr.value);
      save(); apply();
    });

    panel.querySelector("[data-th-reset]").addEventListener("click", function () {
      t = { mode: DEFAULTS.mode, accent: DEFAULTS.accent, round: DEFAULTS.round, text: DEFAULTS.text };
      save(); apply();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hasAttribute("hidden")) { open(false); fab.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (panel.hasAttribute("hidden")) return;
      if (!panel.contains(e.target) && !fab.contains(e.target)) open(false);
    });
  }

  if (mq && mq.addEventListener) mq.addEventListener("change", apply);
  else if (mq && mq.addListener) mq.addListener(apply);

  window.MasarTheme = {
    set: function (patch) { Object.keys(patch).forEach(function (k) { t[k] = patch[k]; }); save(); apply(); },
    get: function () { return { mode: t.mode, accent: t.accent, round: t.round, text: t.text, resolved: resolvedMode() }; },
    reset: function () { t = { mode: DEFAULTS.mode, accent: DEFAULTS.accent, round: DEFAULTS.round, text: DEFAULTS.text }; save(); apply(); }
  };

  apply();
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
