/* =========================================================
   حملة لعجايلية عبد الحفيظ — منطق الصفحة
   المصدر الرسمي للمحتوى: مجلد data/*.md
   ========================================================= */
(function () {
  "use strict";

  var THEME_KEY = "taoura-theme";
  var STORE_KEY = "taoura-submissions";
  var DATA = {
    site: "data/site.md",
    program: "data/program.md",
    contact: "data/contact.md"
  };

  var ICONS = ["road", "network", "users", "rocket", "health", "leaf", "spark", "vote"];
  var SOCIAL_LABELS = {
    facebook: "فيسبوك",
    tiktok: "تيك توك",
    instagram: "إنستغرام"
  };

  var state = {
    endpoint: "",
    submissions: []
  };

  /* ---------------- أدوات عامة ---------------- */
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function setText(key, value) {
    if (!value) return;
    $all('[data-site="' + key + '"]').forEach(function (el) {
      el.textContent = value;
    });
  }

  function svgIcon(name) {
    var safe = ICONS.indexOf(name) > -1 ? name : "spark";
    return '<svg class="icon" aria-hidden="true"><use href="#i-' + safe + '"></use></svg>';
  }

  function onlyDigits(value) {
    return String(value || "").replace(/[^\d+]/g, "");
  }

  /* ---------------- الوضع الليلي ---------------- */
  function applyTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);

    var btn = $("#theme-toggle");
    if (btn) {
      var dark = theme === "dark";
      var label = dark ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي";
      btn.setAttribute("aria-pressed", String(dark));
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    }

    var meta = $("#meta-theme-color");
    if (meta) meta.setAttribute("content", theme === "dark" ? "#080d0a" : "#006233");

    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (err) { /* التخزين غير متاح */ }
    }
  }

  function initTheme() {
    var current = document.documentElement.getAttribute("data-theme");
    if (current !== "dark" && current !== "light") {
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      current = prefersDark ? "dark" : "light";
    }
    applyTheme(current, false);

    var btn = $("#theme-toggle");
    if (!btn) return;

    btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next, true);
    });
  }

  /* ---------------- تحميل المحتوى ---------------- */
  function loadFile(path) {
    return fetch(path, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error("تعذر تحميل " + path + " (" + res.status + ")");
      return res.text();
    });
  }

  function loadContent() {
    return Promise.all([loadFile(DATA.site), loadFile(DATA.program), loadFile(DATA.contact)])
      .then(function (files) {
        return { site: files[0], program: files[1], contact: files[2] };
      });
  }

  /* ---------------- تحليل المحتوى ---------------- */
  function parseSite(md) {
    return MD.parseFrontMatter(md);
  }

  function parseProgram(md) {
    var parsed = MD.parseFrontMatter(md);
    var data = parsed.data;
    var items = [];
    var current = null;

    parsed.body.split(/\r?\n/).forEach(function (line) {
      var h1 = /^#\s+(.+?)\s*$/.exec(line);
      var h2 = /^##\s+(.+?)\s*$/.exec(line);

      if (h1) {
        if (!data.title) data.title = h1[1];
        return;
      }

      if (h2) {
        var title = h2[1];
        var icon = "";
        var withIcon = /^\[([a-z0-9_-]+)\]\s*(.*)$/i.exec(title);
        if (withIcon) {
          icon = withIcon[1].toLowerCase();
          title = withIcon[2];
        }
        current = { icon: icon || "spark", title: title, md: "" };
        items.push(current);
        return;
      }

      if (current) current.md += line + "\n";
    });

    items.forEach(function (item) {
      item.html = MD.toHtml(item.md);
    });

    return { data: data, items: items };
  }

  function parseContact(md) {
    return MD.parseFrontMatter(md);
  }

  /* ---------------- العرض ---------------- */
  function renderTitle(title, highlight) {
    var el = $("#hero-title");
    if (!el || !title) return;

    el.textContent = "";
    if (highlight && title.indexOf(highlight) > -1) {
      var parts = title.split(highlight);
      el.appendChild(document.createTextNode(parts[0]));
      var span = document.createElement("span");
      span.textContent = highlight;
      el.appendChild(span);
      el.appendChild(document.createTextNode(parts.slice(1).join(highlight)));
    } else {
      el.textContent = title;
    }
  }

  function renderSite(site) {
    var data = site.data;

    renderTitle(data.title, data.title_highlight);
    setText("party", data.party);
    setText("party_short", data.party_short);
    setText("municipality", data.municipality);
    setText("election", data.election);
    setText("badge", data.badge);
    setText("role", data.role);
    setText("slogan", data.slogan);
    setText("tagline", data.tagline);

    var ctaPrimary = $('[data-site="cta_primary"]');
    if (ctaPrimary && data.cta_primary) ctaPrimary.textContent = data.cta_primary;

    var ctaSecondary = $('[data-site="cta_secondary"]');
    if (ctaSecondary && data.cta_secondary) ctaSecondary.textContent = data.cta_secondary;

    var about = $("#about-body");
    if (about) about.innerHTML = MD.toHtml(site.body);

    var joinTitle = $("#join-title");
    if (joinTitle && data.join_title) joinTitle.textContent = data.join_title;

    var joinText = $("#join-text");
    if (joinText && data.join_text) joinText.textContent = data.join_text;

    state.endpoint = (data.form_endpoint || "").trim();
  }

  function renderProgram(program) {
    var title = $("#program-title");
    if (title && program.data.title) title.textContent = program.data.title;

    var subtitle = $("#program-subtitle");
    if (subtitle && program.data.subtitle) subtitle.textContent = program.data.subtitle;

    var container = $("#program-cards");
    if (!container) return;

    container.innerHTML = program.items.map(function (item, index) {
      return (
        '<article class="card reveal" style="transition-delay:' + Math.min(index * 60, 300) + 'ms">' +
          '<span class="card-icon">' + svgIcon(item.icon) + "</span>" +
          "<h3>" + MD.escapeHtml(item.title) + "</h3>" +
          item.html +
        "</article>"
      );
    }).join("");
  }

  function contactRow(options) {
    var el = document.createElement(options.href ? "a" : "div");
    el.className = "contact-item";
    if (options.href) el.setAttribute("href", options.href);

    var icon = document.createElement("span");
    icon.className = "contact-icon";
    icon.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-' + options.icon + '"></use></svg>';

    var body = document.createElement("span");
    body.className = "contact-body";

    var small = document.createElement("small");
    small.textContent = options.label;

    var strong = document.createElement("strong");
    strong.textContent = options.value;
    strong.setAttribute("dir", "auto");

    body.appendChild(small);
    body.appendChild(strong);
    el.appendChild(icon);
    el.appendChild(body);
    return el;
  }

  function renderContact(contact) {
    var data = contact.data;

    var title = $("#contact-title");
    if (title && data.title) {
      title.textContent = "";
      title.appendChild(document.createTextNode(data.title + " "));
      var span = document.createElement("span");
      span.textContent = "معنا";
      title.appendChild(span);
    }

    var subtitle = $("#contact-subtitle");
    if (subtitle && data.subtitle) subtitle.textContent = data.subtitle;

    var grid = $("#contact-grid");
    if (grid) {
      grid.textContent = "";

      if (data.phone) {
        grid.appendChild(contactRow({
          icon: "phone",
          label: "الهاتف",
          value: data.phone,
          href: "tel:" + onlyDigits(data.phone)
        }));
      }
      if (data.whatsapp) {
        grid.appendChild(contactRow({
          icon: "whatsapp",
          label: "واتساب",
          value: data.whatsapp,
          href: "https://wa.me/" + onlyDigits(data.whatsapp).replace(/^\+/, "")
        }));
      }
      if (data.email) {
        grid.appendChild(contactRow({
          icon: "mail",
          label: "البريد الإلكتروني",
          value: data.email,
          href: "mailto:" + data.email
        }));
      }
      if (data.address) {
        grid.appendChild(contactRow({
          icon: "pin",
          label: "مقر الحملة",
          value: data.address
        }));
      }
    }

    var socials = $("#socials");
    if (socials) {
      socials.textContent = "";
      ["facebook", "tiktok", "instagram"].forEach(function (key) {
        var url = (data[key] || "").trim();
        if (!url) return;

        var link = document.createElement("a");
        link.className = "social " + key;
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        var dot = document.createElement("span");
        dot.className = "dot";
        dot.setAttribute("aria-hidden", "true");

        link.appendChild(dot);
        link.appendChild(document.createTextNode(SOCIAL_LABELS[key]));
        socials.appendChild(link);
      });
    }

    var year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ---------------- النموذج وقاعدة بيانات MD ---------------- */
  function readSubmissions() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveSubmissions(list) {
    state.submissions = list.slice(-500);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state.submissions));
    } catch (err) {
      /* التخزين ممتلئ أو معطّل */
    }
    renderAdmin();
  }

  function normalizePhone(value) {
    return String(value || "").replace(/[\s\-().]/g, "");
  }

  function isValidPhone(value) {
    var phone = normalizePhone(value);
    return /^(?:\+213|00213|0)[5-7]\d{8}$/.test(phone);
  }

  function setFieldError(fieldId, message) {
    var input = document.getElementById(fieldId);
    if (!input) return false;
    var field = input.closest(".field");
    if (!field) return false;

    var error = $(".field-error", field);
    if (message) {
      field.classList.add("has-error");
      input.setAttribute("aria-invalid", "true");
      if (error) error.textContent = message;
      return false;
    }

    field.classList.remove("has-error");
    input.removeAttribute("aria-invalid");
    if (error) error.textContent = "";
    return true;
  }

  function showFormMessage(text, type) {
    var box = $("#form-message");
    if (!box) return;
    box.textContent = text;
    box.className = "form-message " + (type === "error" ? "is-error" : "is-success");
  }

  function clearFormMessage() {
    var box = $("#form-message");
    if (!box) return;
    box.textContent = "";
    box.className = "form-message";
  }

  function buildMarkdown(entries) {
    var header =
      "# قاعدة بيانات المنضمين\n\n" +
      "> ملف مولَّد تلقائياً من صفحة الحملة. يحتوي معطيات شخصية، لا تنشره علناً.\n\n" +
      "| # | الاسم الكامل | الهاتف | الموافقة | التاريخ |\n" +
      "|---:|---|---|---|---|\n";

    var rows = entries.map(function (entry, index) {
      var cells = [
        String(index + 1),
        entry.name || "",
        entry.phone || "",
        entry.consent || "نعم",
        entry.date || ""
      ].map(function (cell) {
        return String(cell).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
      });
      return "| " + cells.join(" | ") + " |";
    });

    return header + (rows.length ? rows.join("\n") : "| - | - | - | - | - |") + "\n";
  }

  function downloadMarkdown() {
    var content = buildMarkdown(state.submissions);
    var blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "submissions.md";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function renderAdmin() {
    var panel = $("#admin");
    if (!panel || panel.hidden) return;

    state.submissions = readSubmissions();

    var count = $("#admin-count");
    if (count) count.textContent = String(state.submissions.length);

    var wrap = $("#admin-table");
    if (!wrap) return;

    if (!state.submissions.length) {
      wrap.innerHTML = '<p class="admin-empty">لا توجد تسجيلات محلية بعد.</p>';
      return;
    }

    var rows = state.submissions.map(function (entry, index) {
      var date = entry.date ? new Date(entry.date).toLocaleString("ar-DZ") : "-";
      return (
        "<tr>" +
          "<td>" + (index + 1) + "</td>" +
          "<td>" + MD.escapeHtml(entry.name || "") + "</td>" +
          "<td dir=\"ltr\" style=\"text-align:right\">" + MD.escapeHtml(entry.phone || "") + "</td>" +
          "<td>" + MD.escapeHtml(entry.consent || "نعم") + "</td>" +
          "<td>" + MD.escapeHtml(date) + "</td>" +
        "</tr>"
      );
    }).join("");

    wrap.innerHTML =
      '<div class="admin-table-wrap"><table>' +
        "<thead><tr><th>#</th><th>الاسم الكامل</th><th>الهاتف</th><th>الموافقة</th><th>التاريخ</th></tr></thead>" +
        "<tbody>" + rows + "</tbody>" +
      "</table></div>";
  }

  function initAdmin() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("admin") !== "1") return;

    var panel = $("#admin");
    if (!panel) return;
    panel.hidden = false;

    state.submissions = readSubmissions();
    renderAdmin();

    var exportBtn = $("#admin-export");
    if (exportBtn) exportBtn.addEventListener("click", downloadMarkdown);

    var clearBtn = $("#admin-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (!window.confirm("هل تريد مسح كل التسجيلات المحلية؟")) return;
        saveSubmissions([]);
        showFormMessage("تم مسح التسجيلات المحلية.", "success");
      });
    }
  }

  function initForm() {
    var form = $("#join-form");
    if (!form) return;

    var mode = $("#form-mode");
    if (mode) {
      mode.textContent = state.endpoint
        ? "يُرسل تسجيلك مباشرة إلى فريق الحملة."
        : "نسخة تجريبية: يُحفظ تسجيلك في هذا المتصفح، ويمكن تصديره إلى ملف submissions.md من لوحة الإدارة.";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearFormMessage();

      var nameInput = $("#full-name");
      var phoneInput = $("#phone");
      var consentInput = $("#consent");
      if (!nameInput || !phoneInput || !consentInput) return;

      var name = nameInput.value.trim();
      var phone = phoneInput.value.trim();
      var valid = true;

      if (name.length < 3 || name.length > 70) {
        valid = setFieldError("full-name", "الاسم يجب أن يكون بين 3 و70 حرفاً.") && valid;
      } else {
        setFieldError("full-name", "");
      }

      if (!isValidPhone(phone)) {
        valid = setFieldError("phone", "أدخل رقم هاتف جزائري صالح، مثال: 0550123456.") && valid;
      } else {
        setFieldError("phone", "");
      }

      if (!consentInput.checked) {
        valid = false;
        showFormMessage("يرجى الموافقة على معالجة بياناتك قبل التسجيل.", "error");
      }

      if (!valid) return;

      var entry = {
        name: name,
        phone: phone,
        consent: "نعم",
        date: new Date().toISOString()
      };

      var submitBtn = $('button[type="submit"]', form);
      if (submitBtn) submitBtn.disabled = true;

      function finish(message, type) {
        showFormMessage(message, type);
        if (submitBtn) submitBtn.disabled = false;
        form.reset();
      }

      if (state.endpoint) {
        fetch(state.endpoint, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(entry)
        })
          .then(function (res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            finish("تم تسجيلك بنجاح، شكراً لدعمك.", "success");
          })
          .catch(function () {
            saveSubmissions(readSubmissions().concat(entry));
            finish("تعذّر الإرسال، لكن تم حفظ تسجيلك محلياً حتى لا يضيع.", "error");
          });
      } else {
        saveSubmissions(readSubmissions().concat(entry));
        finish("تم تسجيلك بنجاح. (نسخة تجريبية: محفوظ في هذا المتصفح)", "success");
      }
    });
  }

  /* ---------------- عدّاد المنضمين إلى الحملة ---------------- */
  var JOINERS_CACHE = "taoura-joiners";
  var JOINERS_SEEN = "taoura-joiners-seen-at";
  var JOINERS_WINDOW = 5 * 60 * 1000; /* نافذة 5 دقائق: التحديث داخلها لا يُحسب زيارة جديدة */
  var JOINERS_API = "https://abacus.jasoncameron.dev/hit/adjailia-campaign-taoura/joiners";

  function readSeenAt() {
    var value = 0;
    try { value = parseInt(localStorage.getItem(JOINERS_SEEN) || "0", 10) || 0; } catch (err) { value = 0; }
    if (!value) {
      try { value = parseInt(sessionStorage.getItem(JOINERS_SEEN) || "0", 10) || 0; } catch (err) { value = 0; }
    }
    return value;
  }

  function writeSeenAt(timestamp) {
    var text = String(timestamp || 0);
    try { localStorage.setItem(JOINERS_SEEN, text); } catch (err) { /* ignore */ }
    try { sessionStorage.setItem(JOINERS_SEEN, text); } catch (err) { /* ignore */ }
  }

  function formatCount(value) {
    try {
      return Number(value).toLocaleString("ar-DZ-u-nu-latn");
    } catch (err) {
      return String(value);
    }
  }

  function animateCount(element, from, to) {
    var reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || to - from > 50000 || to <= from) {
      element.textContent = formatCount(to);
      return;
    }

    var started = null;
    var duration = 900;

    function step(now) {
      if (started === null) started = now;
      var progress = Math.min((now - started) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatCount(Math.round(from + (to - from) * eased));
      if (progress < 1) window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  }

  function joinersLabel(value) {
    if (value <= 1) return "منضمّ";
    if (value <= 10) return "منضمّين";
    return "منضمّاً";
  }

  function initJoiners() {
    var counter = $("#joiners-count");
    if (!counter) return;

    var label = $("#joiners-label");
    var cached = 0;
    try {
      cached = parseInt(localStorage.getItem(JOINERS_CACHE) || "0", 10) || 0;
    } catch (err) {
      cached = 0;
    }
    if (cached > 0) {
      counter.textContent = formatCount(cached);
      if (label) label.textContent = joinersLabel(cached);
    }

    if (!window.fetch) return;

    /*
      كل زائر يُحسب «منضمّاً» مرة واحدة فقط كل 5 دقائق:
      - التحديث أو التنقل داخل الموقع أو فتح تبويب جديد قبل انقضاء 5 دقائق → قراءة فقط (/get/)
      - بعد مرور 5 دقائق أو أكثر → تُحتسب زيارة جديدة (/hit/)
      الوقت محفوظ في localStorage، فيصمد حتى بعد إغلاق المتصفح.
    */
    var now = Date.now();
    var lastSeen = readSeenAt();
    var elapsed = now - lastSeen;
    var countedRecently = lastSeen > 0 && elapsed >= 0 && elapsed < JOINERS_WINDOW;

    var endpoint = countedRecently ? JOINERS_API.replace("/hit/", "/get/") : JOINERS_API;

    /* حجز النافذة فوراً حتى لا تُحسب تبويبات متزامنة أكثر من مرة */
    if (!countedRecently) writeSeenAt(now);

    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = controller
      ? window.setTimeout(function () { controller.abort(); }, 5000)
      : null;

    fetch(endpoint, {
      cache: "no-store",
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        var value = Number(data && (data.value !== undefined ? data.value : data.count));
        if (!isFinite(value) || value < 0) throw new Error("bad payload");

        animateCount(counter, cached, value);
        if (label) label.textContent = joinersLabel(value);
        try { localStorage.setItem(JOINERS_CACHE, String(value)); } catch (err) { /* ignore */ }
      })
      .catch(function () {
        /* تعذّر الاتصال: نُبقي آخر قيمة محفوظة، ونحرّر النافذة كي تُحتسب الزيارة لاحقاً */
        if (!countedRecently) writeSeenAt(lastSeen);
      })
      .then(function () {
        if (timer) window.clearTimeout(timer);
      });
  }

  /* ---------------- حركات الظهور ---------------- */
  function initReveal() {
    var items = $all(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------- شاشة تعذّر التحميل ---------------- */
  function showBootNotice(kind) {
    var main = $("#main");
    if (!main) return;

    Array.prototype.forEach.call(main.children, function (child) {
      if (child.tagName === "SECTION") child.hidden = true;
    });

    var notice = document.createElement("article");
    notice.className = "boot-notice";

    if (kind === "file") {
      notice.innerHTML =
        "<h2>المعاينة المحلية تحتاج سيرفراً بسيطاً</h2>" +
        "<p>متصفحك يمنع تحميل ملفات <code>data/*.md</code> عند فتح الصفحة بالنقر المزدوج. " +
        "شغّل الملف <code>serve.bat</code> (أو <code>python -m http.server 8080</code>) ثم افتح " +
        '<a href="http://localhost:8080">http://localhost:8080</a>.</p>' +
        "<p>على GitHub Pages تعمل الصفحة مباشرة دون أي إعداد.</p>";
    } else {
      notice.innerHTML =
        "<h2>تعذّر تحميل محتوى الصفحة</h2>" +
        "<p>تأكد من وجود الملفات <code>data/site.md</code>، <code>data/program.md</code> " +
        "و <code>data/contact.md</code>، ثم أعد تحميل الصفحة.</p>";
    }

    main.appendChild(notice);
  }

  /* ---------------- التشغيل ---------------- */
  function boot() {
    initTheme();
    initJoiners();
    initAdmin();

    var host = window.location.hostname;
    var isLocalDev = host === "localhost" || host === "127.0.0.1" || host === "";
    if (isLocalDev || new URLSearchParams(window.location.search).has("debug")) {
      document.documentElement.classList.add("is-dev");
    }

    if (window.location.protocol === "file:") {
      showBootNotice("file");
      return;
    }

    loadContent()
      .then(function (files) {
        var site = parseSite(files.site);
        var program = parseProgram(files.program);
        var contact = parseContact(files.contact);

        renderSite(site);
        renderProgram(program);
        renderContact(contact);

        initForm();
        initReveal();
      })
      .catch(function (error) {
        if (window.console && console.error) console.error(error);
        showBootNotice("error");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
