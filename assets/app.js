/* مسار — سكربت واحد صغير لكل الموقع. لا مكتبات، لا بناء. */
(function () {
  "use strict";

  /* ── ١) نسخ الكود ───────────────────────────────────── */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var box = btn.closest(".code-block");
      var code = box ? box.querySelector("code") : null;
      if (!code) return;
      var text = code.textContent || "";
      var done = function () {
        var old = btn.textContent;
        btn.textContent = "نُسخ ✓";
        setTimeout(function () { btn.textContent = old; }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(fallback);
      } else {
        fallback();
      }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch (e) { /* تجاهل */ }
        document.body.removeChild(ta);
      }
    });
  });

  /* ── ٢) المعاينة الحيّة: الكود نفسه يُرسم في إطار ── */
  document.querySelectorAll("[data-run]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var block = btn.closest(".code-block");
      var preview = block ? block.nextElementSibling : null;
      if (!preview || !preview.classList.contains("preview")) return;
      var code = block.querySelector("code");
      if (!code) return;

      var frame = preview.querySelector("iframe");
      var empty = preview.querySelector(".preview-empty");
      if (!frame) {
        frame = document.createElement("iframe");
        frame.loading = "lazy";
        frame.title = "نتيجة الكود";
        preview.appendChild(frame);
      }
      if (empty) empty.remove();

      var html = code.textContent || "";
      // إن كان المثال مقتطفًا ناقص الهيكل، نلفّه في هيكل صحيح كي يُعرض.
      if (!/<!doctype/i.test(html)) {
        html =
          '<!doctype html><html lang="ar" dir="rtl"><head>' +
          '<meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<style>body{font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;' +
          'padding:16px;line-height:1.8;color:#17231f;background:#fff}' +
          'img{max-width:100%}</style></head><body>' + html + "</body></html>";
      }
      frame.srcdoc = html;

      // ضبط الارتفاع بعد الرسم، بحدٍّ أقصى معقول.
      frame.style.height = "180px";
      frame.addEventListener("load", function () {
        try {
          var h = frame.contentDocument.documentElement.scrollHeight;
          frame.style.height = Math.min(Math.max(h + 24, 120), 520) + "px";
        } catch (e) {
          frame.style.height = "260px";
        }
      });

      btn.textContent = "شغّلته ✓";
      setTimeout(function () { btn.textContent = "شغّل المثال"; }, 1400);
    });
  });

  /* ── ٣) فهرس الدروس في الصفحة الطويلة ───────────────── */
  var toc = document.querySelector("[data-toc]");
  if (toc) {
    var heads = document.querySelectorAll(".lesson-body h2[id]");
    var frag = document.createDocumentFragment();
    heads.forEach(function (h) {
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      frag.appendChild(a);
    });
    toc.appendChild(frag);

    /* على الهاتف: الفهرس مطويّ في سطر واحد، يُفتح عند الطلب */
    if (heads.length > 3 && window.matchMedia("(max-width: 720px)").matches) {
      var det = document.createElement("details");
      det.className = "toc-det";
      var sum = document.createElement("summary");
      sum.textContent = "محتويات الدرس · " + heads.length + " عناوين";
      var inner = document.createElement("div");
      inner.className = "toc-inner";
      toc.parentNode.insertBefore(det, toc);
      inner.appendChild(toc);
      det.appendChild(sum);
      det.appendChild(inner);
    }
  }
})();

/* ── ٤) لوحة تفكيك الوسم: اضغط قطعة من الكود لتعرف وظيفتها ── */
(function () {
  var demo = document.querySelector("[data-anatomy]");
  if (!demo) return;
  var out = document.querySelector("[data-anatomy-out]");
  var buttons = demo.querySelectorAll("button[data-t]");
  var current = null;

  function show(btn) {
    if (!out) return;
    buttons.forEach(function (b) { b.classList.remove("on"); });
    btn.classList.add("on");
    out.innerHTML = "";
    var title = document.createElement("b");
    title.textContent = btn.getAttribute("data-t");
    var body = document.createElement("p");
    body.textContent = btn.getAttribute("data-b");
    out.appendChild(title);
    out.appendChild(body);
    current = btn;
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () { show(btn); });
    btn.addEventListener("mouseenter", function () { show(btn); });
  });

  if (buttons.length) show(buttons[0]);
})();

/* ── ٥) حركة خفيفة: الأقسام تدخل عند ظهورها، والعدّاد يعدّ ── */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* العناصر التي تتحرّك عند الظهور */
  var targets = document.querySelectorAll(
    "main section, .lesson-block, .track, .quick-row, .callout, .q-card"
  );

  if (!reduce && "IntersectionObserver" in window && targets.length) {
    targets.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(i % 6, 5) * 40 + "ms";
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    targets.forEach(function (el) { io.observe(el); });

    /* شبكة أمان: لو لم يُرصد شيء بعد ثانية، أظهِر كل شيء */
    setTimeout(function () {
      targets.forEach(function (el) { el.classList.add("in"); });
    }, 1200);
  }

  /* شريط التقدّم ينمو بنعومة بعد أن يضبطه progress.js */
  setTimeout(function () {
    var bar = document.querySelector("[data-done-track]");
    if (!bar || !bar.style.width) return;
    var w = bar.style.width;
    bar.style.width = "0%";
    void bar.offsetWidth;
    requestAnimationFrame(function () { bar.style.width = w; });
  }, 120);
})();
