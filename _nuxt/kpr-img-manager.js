(function () {
  window.__kprImgManagerStatic = true;

  var title = "Mornikar | Portfolio";
  var description = "MMO_index - Mornikar root index and project navigation shell";
  var siteUrl = "https://mornikar.github.io/";
  var ogImage = "https://mornikar.github.io/og.jpg";

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
    setMeta('meta[property="og:site_name"]', title);
    setMeta('meta[name="description"]', description);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[name="twitter:url"]', siteUrl);
    setMeta('meta[property="og:url"]', siteUrl);
    setMeta('meta[name="twitter:image"]', ogImage);
    setMeta('meta[property="og:image"]', ogImage);
    setMeta('meta[property="og:image:secure_url"]', ogImage);
  }

  applySiteMeta();
  document.addEventListener("DOMContentLoaded", applySiteMeta);
  window.addEventListener("load", applySiteMeta);
  [100, 500, 1500, 4000, 10000].forEach(function (delay) {
    window.setTimeout(applySiteMeta, delay);
  });
})();
