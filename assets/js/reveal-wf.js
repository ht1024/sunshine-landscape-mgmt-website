/**
 * Webflow IX2 leaves elements at opacity:0 until page animations run.
 * Without data-wf-page/site (or if IX fails), reveal stuck content.
 */
(function () {
  function reveal() {
    var nodes = document.querySelectorAll(
      '[data-w-id], [style*="opacity:0"], [style*="opacity: 0"]'
    );
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var opacity = window.getComputedStyle(el).opacity;
      if (opacity === "0") {
        el.style.opacity = "1";
        el.style.transform = "none";
      }
    }
  }

  function run() {
    reveal();
    window.setTimeout(reveal, 400);
    window.setTimeout(reveal, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
