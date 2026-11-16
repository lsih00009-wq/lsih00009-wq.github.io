/* فاصلة — طبقة تجربة القراءة.
   تعمل في صفحات الدروس وحدها، ولا تفترض شيئًا عن بنية الصفحة:
   كل ما تضيفه يُبنى من العناصر الموجودة أصلًا. لا مكتبات، ولا طلبات. */
(function () {
  "use strict";

  var body = document.querySelector(".lesson-body");
  if (!body) return;

  /* ── ١. شريط تقدّم القراءة ───────────────────────────── */
  var bar = document.createElement("div");
  bar.className = "ux-progress";
  bar.setAttribute("aria-hidden", "true");
  bar.innerHTML = "<i></i>";
  document.body.appendChild(bar);
  var fill = bar.firstChild;

  /* ── ٢. زر العودة إلى الأعلى ─────────────────────────── */
  var up = document.createElement("button");
  up.className = "ux-top";
  up.type = "button";
  up.setAttribute("aria-label", "العودة إلى أعلى الدرس");
  up.textContent = "↑";
  up.hidden = true;
  up.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.body.appendChild(up);

  /* ── ٣. نسخ صناديق الكود ────────────────────────────── */
  var blocks = body.querySelectorAll("pre");
  Array.prototype.forEach.call(blocks, function (pre) {
    var code = pre.querySelector("code") || pre;
    var btn = document.createElement("button");
    btn.className = "ux-copy";
    btn.type = "button";
    btn.textContent = "نسخ";
    btn.setAttribute("aria-label", "نسخ الكود");
    btn.addEventListener("click", function () {
      var text = code.innerText;
      var done = function () {
        btn.textContent = "تم ✓";
        btn.classList.add("is-done");
        setTimeout(function () {
          btn.textContent = "نسخ";
          btn.classList.remove("is-done");
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    });
    pre.classList.add("ux-pre");
    pre.appendChild(btn);
  });

  /* ── ٤. فهرس الدرس اللاصق (شاشات واسعة فقط) ─────────── */
  var heads = body.querySelectorAll(":scope > h2[id]");
  var toc = null, links = [];
  if (heads.length >= 3) {
    toc = document.createElement("nav");
    toc.className = "ux-toc";
    toc.setAttribute("aria-label", "فهرس الدرس");
    var title = document.createElement("b");
    title.textContent = "في هذا الدرس";
    toc.appendChild(title);
    var list = document.createElement("ol");
    Array.prototype.forEach.call(heads, function (h, i) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent.trim();
      a.style.setProperty("--i", i);
      li.appendChild(a);
      list.appendChild(li);
      links.push({ a: a, h: h });
    });
    toc.appendChild(list);
    document.body.appendChild(toc);

    /* تتبّع القسم الظاهر */
    var current = -1;
    var setActive = function (idx) {
      if (idx === current) return;
      if (links[current]) links[current].a.classList.remove("is-active");
      current = idx;
      if (links[current]) links[current].a.classList.add("is-active");
    };
    var onScroll = function () {
      var idx = 0;
      for (var i = 0; i < links.length; i++) {
        if (links[i].h.getBoundingClientRect().top <= 140) idx = i;
      }
      setActive(idx);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ── ٥. تحديث الشريطين معًا في إطار واحد ────────────── */
  var ticking = false;
  function update() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.min(1, window.pageYOffset / h) : 0;
    fill.style.transform = "scaleX(" + p + ")";
    up.hidden = window.pageYOffset < 500;
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
})();
