(function () {
  window.__kprImgManagerStatic = true;

  var title = "Mornikar | Portfolio";
  var description = "MMO_index - Mornikar root index and project navigation shell";

  function setMeta(selector, value) {
    var el = document.querySelector(selector);
    if (el && el.getAttribute("content") !== value) {
      el.setAttribute("content", value);
    }
  }

  function applySiteMeta() {
    if (document.title !== title) {
      document.title = title;
    }
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:description"]', description);
  }

  applySiteMeta();
  document.addEventListener("DOMContentLoaded", applySiteMeta);
  window.addEventListener("load", applySiteMeta);
  [100, 500, 1500, 4000, 10000].forEach(function (delay) {
    window.setTimeout(applySiteMeta, delay);
  });
})();
