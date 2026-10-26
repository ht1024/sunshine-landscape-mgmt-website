(function () {
  var form = document.getElementById("email-form");
  if (!form) return;

  var wrap = form.closest(".w-form") || form.parentElement;
  var done = wrap && wrap.querySelector(".w-form-done");
  var fail = wrap && wrap.querySelector(".w-form-fail");
  var submitBtn = form.querySelector('[type="submit"]');
  var waitText = (submitBtn && submitBtn.getAttribute("data-wait")) || "Please wait...";

  // Stop Webflow's broken form AJAX from owning submit
  if (wrap && wrap.classList.contains("w-form")) {
    wrap.classList.remove("w-form");
    wrap.classList.add("js-contact-form");
  }

  function show(el, on) {
    if (!el) return;
    el.style.display = on ? "block" : "none";
  }

  function setBusy(busy) {
    if (!submitBtn) return;
    if (busy) {
      submitBtn.dataset.originalValue = submitBtn.value;
      submitBtn.value = waitText;
      submitBtn.disabled = true;
    } else {
      submitBtn.value = submitBtn.dataset.originalValue || "Send Message";
      submitBtn.disabled = false;
    }
  }

  form.addEventListener(
    "submit",
    function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      var apiUrl = window.CONTACT_API_URL;
      if (!apiUrl) {
        console.error("CONTACT_API_URL is not set in contact-config.js");
        show(done, false);
        show(fail, true);
        return;
      }

      var companyField = form.querySelector('[name="company"]');
      var payload = {
        name: form.querySelector('[name="Name"]').value,
        email: form.querySelector('[name="Email"]').value,
        phone: form.querySelector('[name="Phone-Number"]').value,
        message: form.querySelector('[name="Message"]').value,
        company: companyField ? companyField.value : "",
        source: window.location.pathname || "/contact-us",
      };

      show(done, false);
      show(fail, false);
      setBusy(true);

      fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok && data && data.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok) {
            form.style.display = "none";
            show(done, true);
            show(fail, false);
          } else {
            show(done, false);
            show(fail, true);
          }
        })
        .catch(function (err) {
          console.error(err);
          show(done, false);
          show(fail, true);
        })
        .finally(function () {
          setBusy(false);
        });
    },
    true
  );
})();
