/* مسار — تقدّم المتعلّم.
   ملف صغير واحد. يقرأ ويكتب في localStorage فقط: لا حساب، لا خادم، لا إرسال.
   المفتاح واحد لكل الموقع: masar.done.v1  →  { "1": true, "2": true } */
(function () {
  "use strict";

  var KEY = "masar.done.v1";
  var TOTAL = 22;
  var AR = "٠١٢٣٤٥٦٧٨٩";

  function ar(n) {
    return String(n).replace(/[0-9]/g, function (d) { return AR[Number(d)]; });
  }

  function read() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch (e) {
      return {};
    }
  }

  function write(o) {
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* التصفّح في وضع خاص؟ نتجاهل بهدوء */ }
  }

  function has(n) {
    return !!read()[String(n)];
  }

  function mark(n) {
    n = Number(n);
    if (!(n >= 1 && n <= TOTAL)) return;
    var o = read();
    o[String(n)] = 1;
    write(o);
    paint();
  }

  function count() {
    var o = read(), c = 0;
    for (var i = 1; i <= TOTAL; i++) { if (o[String(i)]) c++; }
    return c;
  }

  function paint() {
    var c = count();

    document.querySelectorAll("[data-done-count]").forEach(function (el) {
      el.textContent = ar(c) + " من " + ar(TOTAL);
    });

    document.querySelectorAll("[data-done-track]").forEach(function (el) {
      el.style.width = Math.round((c / TOTAL) * 100) + "%";
    });

    /* فهرس الدروس: علامة على الدرس الذي أُنجز تحدّيه */
    document.querySelectorAll("a.go").forEach(function (a) {
      var m = /lessons\/(\d\d)-/.exec(a.getAttribute("href") || "");
      if (!m) return;
      var done = has(Number(m[1]));
      a.classList.toggle("done", done);
      var art = a.closest(".lesson-block");
      if (art) art.classList.toggle("is-done", done);
    });

    /* شريط الحالة في صفحة الدرس */
    document.querySelectorAll("[data-ch-status]").forEach(function (el) {
      var n = Number(el.getAttribute("data-ch-status"));
      var done = has(n);
      el.classList.toggle("on", done);
      var label = el.querySelector("span");
      if (label) label.textContent = done ? "أنجزت تحدي هذا الدرس" : "لم تُنجز تحدي هذا الدرس بعد";
    });

    /* أزرار التحديات نفسها */
    document.querySelectorAll("[data-ch-link]").forEach(function (b) {
      var n = Number(b.getAttribute("data-ch-link"));
      b.classList.toggle("done", has(n));
      var tick = b.querySelector(".tick");
      if (tick) tick.textContent = has(n) ? "✓" : "";
    });
  }

  /* نضيف شريط الحالة تلقائيًّا في صفحات الدروس — بلا تعديل عشرين ملفًا */
  (function injectLessonChip() {
    var m = /lessons\/(\d\d)-/.exec(location.pathname) || /lessons\/(\d\d)-/.exec(location.href);
    if (!m) return;
    var nav = document.querySelector("nav.lesson-nav");
    if (!nav || document.querySelector("[data-ch-status]")) return;
    var p = document.createElement("p");
    p.className = "ch-status";
    p.setAttribute("data-ch-status", String(Number(m[1])));
    var span = document.createElement("span");
    p.appendChild(span);
    var a = document.createElement("a");
    a.href = "../challenges.html";
    a.textContent = "افتح التحدي";
    p.appendChild(a);
    nav.parentNode.insertBefore(p, nav);
  })();

  /* إعادة الضبط — لازمة إن كان الجهاز يشترك فيه أكثر من متعلّم */
  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    paint();
  }

  document.querySelectorAll("[data-done-reset]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (window.confirm("أمحو كل علامات التقدّم على هذا الجهاز؟ لا يمكن التراجع.")) reset();
    });
  });

  window.addEventListener("storage", function (e) { if (e.key === KEY) paint(); });
  window.addEventListener("pageshow", paint);

  window.MasarDone = {
    key: KEY,
    total: TOTAL,
    has: has,
    mark: mark,
    count: count,
    paint: paint,
    reset: reset,
    ar: ar
  };

  paint();
})();
