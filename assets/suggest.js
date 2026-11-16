/* مسار — اقتراحات الكتابة في محرّر المختبر.
   لا مكتبة، لا شبكة: قوائم كلمات من الموقع نفسه + كلمات مستخدمة في كودك.
   يمكن إيقافها من زر الإعدادات، ويُحفظ اختيارك في localStorage. */
(function () {
  "use strict";

  var KEY = "masar.lab.suggest.v1";
  var MAX = 8;

  /* كلمات كل لغة: مرتبة بالأكثر استخدامًا، لا أبجديًّا */
  var WORDS = {
    html: (
      "div section article header footer main nav aside h1 h2 h3 h4 p a img ul ol li " +
      "table thead tbody tr th td caption form label input button select option textarea " +
      "span strong em b i small code pre br hr blockquote figure figcaption details summary " +
      "script style link meta title html head body video audio picture source " +
      "class id href src alt title type name value placeholder required disabled checked " +
      "selected target rel lang dir charset content scope colspan rowspan width height " +
      "loading for action method role style aria-label data-"
    ).split(/\s+/),

    css: (
      "display flex flex-direction flex-wrap justify-content align-items align-content gap " +
      "grid grid-template-columns grid-template-rows grid-column grid-row place-items " +
      "position top right bottom left inset z-index " +
      "margin margin-top margin-right margin-bottom margin-left " +
      "padding padding-top padding-right padding-bottom padding-left " +
      "border border-radius background background-color background-image background-size " +
      "color font-size font-family font-weight font-style line-height letter-spacing text-align " +
      "text-decoration text-transform white-space " +
      "width height min-width max-width min-height max-height aspect-ratio " +
      "overflow overflow-x overflow-y box-shadow transition transform opacity cursor " +
      "list-style object-fit visibility filter content box-sizing " +
      "absolute relative fixed sticky static hidden auto none block inline inline-block center " +
      "space-between space-around column row wrap nowrap solid dashed dotted bold pointer " +
      "border-box content-box grid-template-columns"
    ).split(/\s+/),

    js: (
      "const let var function return if else for while of in do switch case break continue " +
      "try catch finally throw new this typeof instanceof delete void " +
      "document window console Math Number String Boolean Array Object JSON Date " +
      "querySelector querySelectorAll getElementById getElementsByClassName createElement " +
      "addEventListener removeEventListener preventDefault textContent innerHTML innerText " +
      "value classList style setAttribute getAttribute appendChild removeChild " +
      "forEach map filter reduce find join push pop shift unshift slice splice length " +
      "setTimeout setInterval clearTimeout parseFloat parseInt isNaN " +
      "localStorage getItem setItem stringify parse " +
      "true false null undefined async await"
    ).split(/\s+/)
  };

  function readOn() {
    try { return localStorage.getItem(KEY) !== "0"; } catch (e) { return true; }
  }
  function writeOn(v) {
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) {}
  }

  var on = readOn();
  var areas = [];

  function make(ta, lang) {
    var box = document.createElement("div");
    box.className = "ac";
    box.id = "ac-" + lang;
    box.setAttribute("role", "listbox");
    box.setAttribute("aria-label", "اقتراحات الكتابة");
    box.hidden = true;
    document.body.appendChild(box);

    var st = { ta: ta, lang: lang, box: box, items: [], active: -1, start: 0, end: 0 };

    ta.addEventListener("input", function () { refresh(st, false); });
    ta.addEventListener("click", function () { close(st); });
    ta.addEventListener("scroll", function () { close(st); });
    ta.addEventListener("blur", function () { setTimeout(function () { close(st); }, 120); });
    ta.addEventListener("keydown", function (e) {
      var open = !box.hidden && st.items.length > 0;
      if (open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        st.active = (st.active + (e.key === "ArrowDown" ? 1 : -1) + st.items.length) % st.items.length;
        paint(st);
        return;
      }
      if (open && (e.key === "Tab" || e.key === "Enter")) {
        e.preventDefault();
        accept(st, st.items[st.active < 0 ? 0 : st.active]);
        return;
      }
      if (open && e.key === "Escape") { e.preventDefault(); close(st); return; }
      if (e.key === " " && (e.ctrlKey || e.metaKey)) { e.preventDefault(); refresh(st, true); return; }
    });

    return st;
  }

  /* الكلمة التي تحت المؤشّر */
  function tokenAt(ta) {
    var before = ta.value.slice(0, ta.selectionStart);
    var m = /[A-Za-z][A-Za-z0-9_-]*$/.exec(before);
    if (!m) return null;
    return { word: m[0], start: ta.selectionStart - m[0].length, end: ta.selectionStart, prev: before[m.index - 1] || "" };
  }

  function candidates(st, tok) {
    if (!tok) return [];
    var w = tok.word.toLowerCase();
    var lang = st.lang === "js" ? "js" : st.lang === "css" ? "css" : "html";
    var list = [];
    var seen = {};

    function add(x) {
      if (!x || seen[x] || x.toLowerCase() === w && false) return;
      seen[x] = 1;
      list.push(x);
    }

    /* أولًا: ما كتبته أنت في هذا الملف — أقرب إلى سياقك */
    var own = st.ta.value.match(/[A-Za-z][A-Za-z0-9_-]{2,}/g) || [];
    var bag = own.concat(WORDS[lang]);
    for (var i = 0; i < bag.length; i++) {
      var cand = bag[i];
      if (cand.toLowerCase() === w) continue;
      if (cand.toLowerCase().indexOf(w) === 0) add(cand);
      if (list.length >= MAX) break;
    }
    return list.slice(0, MAX);
  }

  function refresh(st, force) {
    if (!on && !force) { close(st); return; }
    var ta = st.ta;
    if (document.activeElement !== ta) return;
    var tok = tokenAt(ta);
    if (!tok) { close(st); return; }
    var items = candidates(st, tok);
    if (!items.length) { close(st); return; }
    st.items = items;
    st.start = tok.start;
    st.end = tok.end;
    st.active = 0;
    st.box.innerHTML = "";
    items.forEach(function (t, i) {
      var d = document.createElement("div");
      d.className = "ac-item";
      d.setAttribute("role", "option");
      d.id = "ac-" + st.lang + "-" + i;
      d.dataset.i = String(i);
      d.textContent = t;
      d.addEventListener("mousedown", function (ev) { ev.preventDefault(); accept(st, t); });
      st.box.appendChild(d);
    });
    st.box.hidden = false;
    st.ta.setAttribute("aria-expanded", "true");
    place(st);
    paint(st);
  }

  /* موضع القائمة عند المؤشّر نفسه — الهامش والحشو محسوبان */
  function place(st) {
    var ta = st.ta;
    var cs = getComputedStyle(ta);
    var mirror = document.createElement("div");
    [
      "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing",
      "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
      "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth"
    ].forEach(function (p) { mirror.style[p] = cs[p]; });
    mirror.style.position = "absolute";
    mirror.style.visibility = "hidden";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.overflowWrap = "break-word";
    mirror.style.wordBreak = "normal";
    mirror.style.width = ta.clientWidth + "px";
    mirror.style.boxSizing = "border-box";
    mirror.textContent = ta.value.slice(0, st.start);
    var mark = document.createElement("span");
    mark.textContent = "\u200b";
    mirror.appendChild(mark);
    document.body.appendChild(mirror);
    var offTop = mark.offsetTop;
    var offLeft = mark.offsetLeft;
    document.body.removeChild(mirror);

    var rect = ta.getBoundingClientRect();
    var lh = parseFloat(cs.lineHeight) || 20;
    var w = 190;
    var x = rect.left + ta.clientLeft + offLeft - ta.scrollLeft;
    var y = rect.top + ta.clientTop + offTop - ta.scrollTop + lh + 2;
    x = Math.max(8, Math.min(x, window.innerWidth - w - 8));
    if (y + 170 > window.innerHeight) y = Math.max(8, y - lh - 172);

    st.box.style.top = y + "px";
    st.box.style.left = x + "px";
    st.box.style.width = w + "px";
  }

  function paint(st) {
    Array.prototype.forEach.call(st.box.children, function (el, i) {
      el.setAttribute("aria-selected", String(i === st.active));
    });
    if (st.items[st.active] !== undefined) st.ta.setAttribute("aria-activedescendant", "ac-" + st.lang + "-" + st.active);
  }

  function accept(st, word) {
    var ta = st.ta;
    var after = ta.value.slice(st.end, st.end + 1);
    var add = "";
    if (st.lang === "css" && after !== ":") add = ": ";
    var text = word + add;
    ta.value = ta.value.slice(0, st.start) + text + ta.value.slice(st.end);
    var caret = st.start + text.length;
    ta.selectionStart = ta.selectionEnd = caret;
    close(st);
    ta.focus();
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function close(st) {
    st.box.hidden = true;
    st.items = [];
    st.active = -1;
    st.ta.setAttribute("aria-expanded", "false");
    st.ta.removeAttribute("aria-activedescendant");
  }

  /* ── ربط المحرّرات ── */
  [["code-html", "html"], ["code-css", "css"], ["code-js", "js"]].forEach(function (pair) {
    var ta = document.getElementById(pair[0]);
    if (!ta) return;
    areas.push(make(ta, pair[1]));
  });

  /* ── زر الإعدادات ── */
  var btn = document.getElementById("hintBtn");
  var panel = document.getElementById("hintPanel");
  var box = document.getElementById("hintToggle");
  if (btn && panel && box) {
    box.checked = on;
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", function () {
      var open = panel.hasAttribute("hidden");
      if (open) { panel.removeAttribute("hidden"); btn.setAttribute("aria-expanded", "true"); }
      else { panel.setAttribute("hidden", ""); btn.setAttribute("aria-expanded", "false"); }
    });
    box.addEventListener("change", function () {
      on = box.checked;
      writeOn(on);
      if (!on) areas.forEach(close);
    });
    document.addEventListener("click", function (e) {
      if (!panel.hasAttribute("hidden") && !panel.contains(e.target) && !btn.contains(e.target)) {
        panel.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hasAttribute("hidden")) {
        panel.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", "false");
        btn.focus();
      }
    });
  }

  /* يُستدعى من معالج Tab في المختبر: هل هناك قائمة مفتوحة نقبلها؟
     نُعيد true فقط إن قبِلنا فعلًا، وإلا يبقى Tab مسافتين كما كان. */
  function acceptOpen() {
    for (var i = 0; i < areas.length; i++) {
      var st = areas[i];
      if (!st.box.hidden && st.items.length && document.activeElement === st.ta) {
        accept(st, st.items[st.active < 0 ? 0 : st.active]);
        return true;
      }
    }
    return false;
  }

  window.MasarSuggest = {
    acceptOpen: acceptOpen,
    isOn: function () { return on; },
    setOn: function (v) { on = !!v; writeOn(on); if (box) box.checked = on; if (!on) areas.forEach(close); }
  };
})();
