/**
 * SKIP — "انضم لفريقنا" recruitment application form.
 * Frontend-only validation and a simulated submit (no backend, no email
 * service, no upload target): on a valid submission we swap the form for a
 * success panel instead of sending anything anywhere.
 */

(function () {
  'use strict';

  var form = document.getElementById('join-form-el');
  if (!form) return; // this script only runs on join-team.html

  var successPanel = document.getElementById('join-form-success');
  var submitBtn = document.getElementById('join-submit-btn');

  function getInput(name) {
    return form.querySelector('[name="' + name + '"]');
  }
  function getError(name) {
    return document.getElementById('err-' + name);
  }

  // One validator + Arabic error message per required text/select field.
  var fields = {
    name: {
      validate: function (v) { return v.trim().length >= 2; },
      message: 'الرجاء إدخال اسمك الكامل.'
    },
    email: {
      validate: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      message: 'الرجاء إدخال بريد إلكتروني صحيح.'
    },
    phone: {
      validate: function (v) { return /^[0-9]{8,10}$/.test(v.trim()); },
      message: 'الرجاء إدخال رقم جوال صحيح (٨ إلى ١٠ أرقام).'
    },
    age: {
      validate: function (v) {
        var n = parseInt(v.replace(/[^0-9]/g, ''), 10);
        return !isNaN(n) && n >= 16 && n <= 70;
      },
      message: 'الرجاء إدخال عمر صحيح (بين ١٦ و ٧٠ سنة).'
    },
    city: {
      validate: function (v) { return v.trim().length >= 2; },
      message: 'الرجاء إدخال المدينة اللي تسكن فيها.'
    },
    source: {
      validate: function (v) { return v !== ''; },
      message: 'الرجاء اختيار كيف عرفت عن سكيب.'
    },
    experience: {
      validate: function (v) { return v.trim().length >= 5; },
      message: 'الرجاء كتابة نبذة عن خبرتك.'
    },
    interest: {
      validate: function (v) { return v.trim().length >= 5; },
      message: 'الرجاء الإجابة على هذا السؤال.'
    },
    courses: {
      validate: function (v) { return v.trim().length >= 2; },
      message: 'الرجاء ذكر الدورات اللي أخذتها (أو اكتب "لا يوجد").'
    },
    ramadanShow: {
      validate: function (v) { return v.trim().length >= 1; },
      message: 'الرجاء الإجابة على هذا السؤال.'
    },
    learningStyle: {
      validate: function (v) { return v.trim().length >= 5; },
      message: 'الرجاء الإجابة على هذا السؤال.'
    },
    englishLevel: {
      validate: function (v) { return v.trim().length >= 2; },
      message: 'الرجاء إدخال مستواك في الإنجليزية.'
    },
    comfortZone: {
      validate: function (v) { return v.trim().length >= 2; },
      message: 'الرجاء الإجابة على هذا السؤال.'
    },
    salary: {
      validate: function (v) { return v.trim().length >= 1; },
      message: 'الرجاء إدخال توقعاتك المالية.'
    },
    workType: {
      validate: function (v) { return v !== ''; },
      message: 'الرجاء اختيار نوع التقديم.'
    },
    skillTimeline: {
      validate: function (v) { return v.trim().length >= 2; },
      message: 'الرجاء الإجابة على هذا السؤال.'
    },
    whyJoin: {
      validate: function (v) { return v.trim().length >= 5; },
      message: 'الرجاء إخبارنا ليش حابب تنضم لفريقنا.'
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

  // Live feedback: validate selects on change, text/textarea on blur, and
  // re-validate anything already flagged as the user keeps typing.
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

  // Keep the age field digits-only as the user types.
  var ageInput = getInput('age');
  if (ageInput) {
    ageInput.addEventListener('input', function () {
      var digitsOnly = ageInput.value.replace(/[^0-9]/g, '');
      if (digitsOnly !== ageInput.value) ageInput.value = digitsOnly;
    });
  }

  // ---------------------------------------------------------------------
  // Expertise chip multi-select — at least one checkbox must be checked.
  // ---------------------------------------------------------------------
  var expertiseGroup = document.getElementById('expertise-group');
  var expertiseError = document.getElementById('err-expertise');
  var expertiseCheckboxes = expertiseGroup
    ? Array.prototype.slice.call(expertiseGroup.querySelectorAll('input[name="expertise"]'))
    : [];

  function validateExpertise() {
    var anyChecked = expertiseCheckboxes.some(function (cb) { return cb.checked; });
    if (anyChecked) {
      expertiseError.textContent = '';
    } else {
      expertiseError.textContent = 'الرجاء اختيار مهارة واحدة على الأقل.';
    }
    return anyChecked;
  }

  expertiseCheckboxes.forEach(function (cb) {
    cb.addEventListener('change', function () {
      if (expertiseError.textContent) validateExpertise();
    });
  });

  // ---------------------------------------------------------------------
  // Career-preference radio group — exactly one option must be selected.
  // ---------------------------------------------------------------------
  var workStyleGroup = document.getElementById('work-style-group');
  var workStyleError = document.getElementById('err-workStyle');
  var workStyleRadios = workStyleGroup
    ? Array.prototype.slice.call(workStyleGroup.querySelectorAll('input[name="workStyle"]'))
    : [];

  function validateWorkStyle() {
    var anyChecked = workStyleRadios.some(function (r) { return r.checked; });
    if (anyChecked) {
      workStyleError.textContent = '';
    } else {
      workStyleError.textContent = 'الرجاء اختيار الخيار الأقرب لك.';
    }
    return anyChecked;
  }

  workStyleRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (workStyleError.textContent) validateWorkStyle();
    });
  });

  // ---------------------------------------------------------------------
  // CV upload — native file input + styled dropzone with drag-and-drop.
  // ---------------------------------------------------------------------
  var uploadDrop = document.getElementById('upload-drop');
  var fileInput = document.getElementById('j-cv');
  var uploadFilename = document.getElementById('upload-filename');
  var cvError = document.getElementById('err-cv');
  var allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'];
  var maxFileSize = 10 * 1024 * 1024; // 10MB

  function getExtension(filename) {
    var parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  function validateFile(silent) {
    var file = fileInput.files && fileInput.files[0];

    if (!file) {
      if (!silent) {
        cvError.textContent = 'الرجاء رفع سيرتك الذاتية.';
        uploadDrop.classList.add('has-error');
      }
      uploadFilename.textContent = '';
      uploadFilename.classList.remove('is-visible');
      return false;
    }

    var ext = getExtension(file.name);
    if (allowedExtensions.indexOf(ext) === -1) {
      cvError.textContent = 'صيغة غير مدعومة. الصيغ المقبولة: JPG، PNG، PDF، DOC، DOCX.';
      uploadDrop.classList.add('has-error');
      uploadFilename.textContent = '';
      uploadFilename.classList.remove('is-visible');
      fileInput.value = '';
      return false;
    }

    if (file.size > maxFileSize) {
      cvError.textContent = 'حجم الملف كبير جدًا. الحد الأقصى ١٠ ميجابايت.';
      uploadDrop.classList.add('has-error');
      uploadFilename.textContent = '';
      uploadFilename.classList.remove('is-visible');
      fileInput.value = '';
      return false;
    }

    cvError.textContent = '';
    uploadDrop.classList.remove('has-error');
    uploadFilename.textContent = file.name;
    uploadFilename.classList.add('is-visible');
    return true;
  }

  if (fileInput) {
    fileInput.addEventListener('change', function () { validateFile(false); });
  }

  if (uploadDrop) {
    ['dragenter', 'dragover'].forEach(function (evt) {
      uploadDrop.addEventListener(evt, function (e) {
        e.preventDefault();
        e.stopPropagation();
        uploadDrop.classList.add('is-dragover');
      });
    });

    ['dragleave', 'dragend'].forEach(function (evt) {
      uploadDrop.addEventListener(evt, function (e) {
        e.preventDefault();
        e.stopPropagation();
        uploadDrop.classList.remove('is-dragover');
      });
    });

    uploadDrop.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      uploadDrop.classList.remove('is-dragover');

      var dropped = e.dataTransfer && e.dataTransfer.files;
      if (dropped && dropped.length) {
        try {
          fileInput.files = dropped;
        } catch (err) {
          // Some browsers disallow assigning to .files directly; fall back
          // to a DataTransfer-backed FileList which works everywhere else.
          var dt = new DataTransfer();
          dt.items.add(dropped[0]);
          fileInput.files = dt.files;
        }
        validateFile(false);
      }
    });
  }

  // ---------------------------------------------------------------------
  // Submit — validate everything, focus the first problem, else simulate.
  // ---------------------------------------------------------------------
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var allValid = true;
    var firstInvalid = null;

    Object.keys(fields).forEach(function (name) {
      var ok = validateField(name);
      if (!ok && !firstInvalid) firstInvalid = getInput(name);
      allValid = allValid && ok;
    });

    var expertiseOk = validateExpertise();
    if (!expertiseOk && !firstInvalid) firstInvalid = expertiseGroup;
    allValid = allValid && expertiseOk;

    var workStyleOk = validateWorkStyle();
    if (!workStyleOk && !firstInvalid) firstInvalid = workStyleGroup;
    allValid = allValid && workStyleOk;

    var fileOk = validateFile(false);
    if (!fileOk && !firstInvalid) firstInvalid = uploadDrop;
    allValid = allValid && fileOk;

    if (!allValid) {
      if (firstInvalid) {
        if (typeof firstInvalid.focus === 'function') firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // No backend, email service, or upload target yet: simulate a brief
    // submit, then swap in the success state instead of sending anything.
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
