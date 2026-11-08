/* =========================================================
   محرّك Markdown مصغّر — بدون أي اعتماد خارجي
   يدعم: Front Matter، العناوين، الفقرات، القوائم،
          الاقتباس، الخط الفاصل، الغامق/المائل، الروابط، الكود
   الهدف: تحويل ملفات data/*.md إلى واجهة الموقع
   ========================================================= */
(function (global) {
  "use strict";

  var ESCAPE = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) { return ESCAPE[ch]; });
  }

  /* نسمح فقط بالروابط الآمنة — حماية من javascript: */
  function safeUrl(url) {
    var u = String(url).trim();
    if (/^(https?:\/\/|mailto:|tel:|#|\/|\.{1,2}\/)/i.test(u)) return escapeHtml(u);
    return "#";
  }

  function inline(text) {
    var out = escapeHtml(text);
    var slots = [];

    function keep(html) {
      slots.push(html);
      return "\u0000" + (slots.length - 1) + "\u0000";
    }

    out = out.replace(/`([^`]+)`/g, function (_, code) {
      return keep("<code>" + code + "</code>");
    });

    out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, alt, src) {
      return keep('<img src="' + safeUrl(src) + '" alt="' + alt + '" loading="lazy">');
    });

    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, href) {
      var external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
      return keep('<a href="' + safeUrl(href) + '"' + external + ">" + label + "</a>");
    });

    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

    return out.replace(/\u0000(\d+)\u0000/g, function (_, i) { return slots[Number(i)]; });
  }

  function parseFrontMatter(text) {
    var src = String(text).replace(/^\uFEFF/, "");
    var match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
    if (!match) return { data: {}, body: src };

    var data = {};
    match[1].split(/\r?\n/).forEach(function (line) {
      if (!line.trim() || /^\s*#/.test(line)) return;
      var idx = line.indexOf(":");
      if (idx < 1) return;

      var key = line.slice(0, idx).trim();
      var value = line.slice(idx + 1).trim();

      if (
        (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') ||
        (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'")
      ) {
        value = value.slice(1, -1);
      }
      data[key] = value;
    });

    return { data: data, body: src.slice(match[0].length) };
  }

  /* يحول Markdown إلى HTML آمن */
  function toHtml(markdown) {
    var lines = String(markdown).replace(/\r\n?/g, "\n").split("\n");
    var html = [];
    var listType = null;
    var paragraph = [];

    function flushParagraph() {
      if (paragraph.length) {
        html.push("<p>" + inline(paragraph.join(" ")) + "</p>");
        paragraph = [];
      }
    }

    function closeList() {
      if (listType) {
        html.push("</" + listType + ">");
        listType = null;
      }
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        closeList();
        continue;
      }

      var heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
      if (heading) {
        flushParagraph();
        closeList();
        var level = Math.min(heading[1].length + 1, 6); // # في الملف = h2 داخل الصفحة
        html.push("<h" + level + ">" + inline(heading[2]) + "</h" + level + ">");
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        flushParagraph();
        closeList();
        html.push("<hr>");
        continue;
      }

      var quote = /^>\s?(.*)$/.exec(trimmed);
      if (quote) {
        flushParagraph();
        closeList();
        var quoteLines = [quote[1]];
        while (i + 1 < lines.length && /^>\s?/.test(lines[i + 1].trim())) {
          i++;
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        }
        html.push("<blockquote><p>" + inline(quoteLines.join(" ")) + "</p></blockquote>");
        continue;
      }

      var ordered = /^\d+\.\s+(.*)$/.exec(trimmed);
      var unordered = /^[-*+]\s+(.*)$/.exec(trimmed);

      if (ordered || unordered) {
        flushParagraph();
        var wanted = ordered ? "ol" : "ul";
        if (listType !== wanted) {
          closeList();
          html.push("<" + wanted + ">");
          listType = wanted;
        }
        html.push("<li>" + inline((ordered || unordered)[1]) + "</li>");
        continue;
      }

      if (listType) closeList();
      paragraph.push(trimmed);
    }

    flushParagraph();
    closeList();
    return html.join("\n");
  }

  global.MD = {
    parseFrontMatter: parseFrontMatter,
    toHtml: toHtml,
    escapeHtml: escapeHtml
  };
})(window);
