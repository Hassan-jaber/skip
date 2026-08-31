/**
 * SKIP — "ابدأ مشروعك" project inquiry form.
 * Frontend-only validation and a simulated submit (no backend yet):
 * on a valid submission we swap the form for a success panel instead of
 * sending the data anywhere.
 */

(function () {
  'use strict';

  var form = document.getElementById('project-form');
  if (!form) return; // this script only runs on start-project.html

  var successPanel = document.getElementById('form-success');
  var submitBtn = document.getElementById('submit-btn');

  function getInput(name) {
    return form.querySelector('[name="' + name + '"]');
  }
  function getError(name) {
    return document.getElementById('err-' + name);
  }

  // One validator + Arabic error message per required field.
  var fields = {
    name: {
      validate: function (v) { return v.trim().length >= 2; },
      message: 'الرجاء إدخال اسمك الكامل.'
    },
    phone: {
      validate: function (v) { return /^[0-9]{8,10}$/.test(v.trim()); },
      message: 'الرجاء إدخال رقم جوال صحيح (٨ إلى ١٠ أرقام).'
    },
    email: {
      validate: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      message: 'الرجاء إدخال بريد إلكتروني صحيح.'
    },
    jobTitle: {
      validate: function (v) { return v.trim().length >= 2; },
      message: 'الرجاء إدخال المسمى الوظيفي.'
    },
    storeUrl: {
      validate: function (v) {
        var val = v.trim();
        if (!val) return false;
        var withProtocol = /^https?:\/\//i.test(val) ? val : 'https://' + val;
        try {
          var url = new URL(withProtocol);
          return /^[^.\s]+\.[^.\s]+/.test(url.hostname);
        } catch (e) {
          return false;
        }
      },
      message: 'الرجاء إدخال رابط متجر صحيح (مثال: mystore.com).'
    },
    storeAge: {
      validate: function (v) { return v !== ''; },
      message: 'الرجاء اختيار عمر المتجر.'
    },
    budget: {
      validate: function (v) { return v !== ''; },
      message: 'الرجاء اختيار الميزانية التسويقية الشهرية.'
    },
    sales: {
      validate: function (v) { return v !== ''; },
      message: 'الرجاء اختيار متوسط المبيعات الشهرية.'
    },
    workMode: {
      validate: function (v) { return v !== ''; },
      message: 'الرجاء اختيار طريقة عملك الحالية.'
    },
    source: {
      validate: function (v) { return v !== ''; },
      message: 'الرجاء اختيار كيف سمعت عنا.'
    }
  };

  function showError(name, message) {
    var input = getInput(name);
    var error = getError(name);
    if (!input || !error) return;
    input.setAttribute('aria-invalid', 'true');
    input.classList.add('has-error');
    error.textContent = message;
  }

  function clearError(name) {
    var input = getInput(name);
    var error = getError(name);
    if (!input || !error) return;
    input.removeAttribute('aria-invalid');
    input.classList.remove('has-error');
    error.textContent = '';
  }

  function validateField(name) {
    var input = getInput(name);
    if (!input) return true;
    var ok = fields[name].validate(input.value);
    if (ok) {
      clearError(name);
    } else {
      showError(name, fields[name].message);
    }
    return ok;
  }

  // Live feedback: validate selects on change, text/tel/email/url inputs
  // on blur, and re-validate anything already flagged as the user types.
  Object.keys(fields).forEach(function (name) {
    var input = getInput(name);
    if (!input) return;

    var settleEvent = input.tagName === 'SELECT' ? 'change' : 'blur';
    input.addEventListener(settleEvent, function () { validateField(name); });

    input.addEventListener('input', function () {
      if (input.classList.contains('has-error')) validateField(name);
    });
  });

  // Keep the phone number digits-only as the user types.
  var phoneInput = getInput('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      var digitsOnly = phoneInput.value.replace(/[^0-9]/g, '');
      if (digitsOnly !== phoneInput.value) phoneInput.value = digitsOnly;
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var allValid = true;
    var firstInvalid = null;

    Object.keys(fields).forEach(function (name) {
      var ok = validateField(name);
      if (!ok) {
        allValid = false;
        if (!firstInvalid) firstInvalid = getInput(name);
      }
    });

    if (!allValid) {
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // No backend yet: simulate a brief submit, then swap in the success
    // state instead of sending the data anywhere.
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');

    setTimeout(function () {
      form.hidden = true;
      successPanel.hidden = false;
      successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
    }, 650);
  });
})();
