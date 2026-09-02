/**
 * SKIP — وكالة إبداعية رقمية
 * Vanilla JS behaviour, migrated 1:1 from the original React component,
 * plus a few lightweight, progressive-enhancement additions:
 *   1) mobile/tablet full-screen nav menu (open/close)
 *   2) the services section's active-service state (hover/focus/click),
 *      crossfading between the real <img> illustrations already in the
 *      markup — no image creation or src-swapping
 *   3) the work section's project card carousel (manual + autoplay)
 *   4) a small IntersectionObserver-driven scroll-reveal for section content
 *   5) the hero stats row's 0 -> final-value animated counters
 * Every page on the site loads this same file, so each piece guards itself
 * against the elements it needs simply not being present on that page.
 */

(function () {
  'use strict';

  var prefersReducedMotion = !!(
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  /* -----------------------------------------------------------
   * 1) Mobile / tablet full-screen navigation menu
   * ----------------------------------------------------------- */
  var menuToggle = document.getElementById('menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');

  function setMenuOpen(open) {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileMenu.classList.toggle('is-open', open);
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      var isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      setMenuOpen(!isOpen);
    });

    // Close the menu whenever a link inside it is used (matches the
    // original React behaviour of closing on navigation).
    var menuLinks = mobileMenu.querySelectorAll('[data-menu-link]');
    for (var i = 0; i < menuLinks.length; i++) {
      menuLinks[i].addEventListener('click', function () {
        setMenuOpen(false);
      });
    }
  }

  /* -----------------------------------------------------------
   * 2) Services section — active-service state, hover/focus/click driven.
   *    Every service's illustration is a real <img> already sitting in the
   *    markup (nothing is created or src-swapped by JS); this only toggles
   *    which one is visible (a crossfade) and mirrors the same active state
   *    onto the matching list item. The first image/item already carries
   *    .is-active in the HTML, so the section looks correct even with JS
   *    disabled — this is a progressive-enhancement layer on top of that.
   * ----------------------------------------------------------- */
  var serviceList = document.getElementById('service-list');
  var servicesVisual = document.getElementById('services-visual');

  function setActiveService(index) {
    if (!serviceList) return;

    var items = serviceList.querySelectorAll('.service-item');
    for (var i = 0; i < items.length; i++) {
      var active = i === index;
      items[i].classList.toggle('is-active', active);
      items[i].setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    if (servicesVisual) {
      var images = servicesVisual.querySelectorAll('.service-visual-img');
      for (var k = 0; k < images.length; k++) {
        images[k].classList.toggle('is-active', k === index);
      }
    }
  }

  if (serviceList) {
    var serviceItems = serviceList.querySelectorAll('.service-item');
    for (var j = 0; j < serviceItems.length; j++) {
      (function (item) {
        var index = parseInt(item.getAttribute('data-index'), 10);
        item.addEventListener('mouseenter', function () { setActiveService(index); });
        item.addEventListener('focus', function () { setActiveService(index); });
        item.addEventListener('click', function () { setActiveService(index); });
      })(serviceItems[j]);
    }
  }

  /* -----------------------------------------------------------
   * 3) Work section — featured-project carousel: a crossfading stage
   *    synced with a thumbnail strip, a counter, prev/next controls and
   *    dot pagination, plus the project-details modal it opens. Autoplay
   *    loops, pauses on interaction, and resumes a short while later.
   * ----------------------------------------------------------- */
  var workCarousel = document.getElementById('work-carousel');
  var workStage = document.getElementById('work-stage');

  if (workCarousel && workStage) {
    var workSlides = Array.prototype.slice.call(workStage.querySelectorAll('.work-slide'));
    var workThumbs = Array.prototype.slice.call(document.querySelectorAll('#work-thumbs .work-thumb'));
    var workDotEls = Array.prototype.slice.call(document.querySelectorAll('#work-dots .work-dot'));
    var workIndexCurrentEl = document.getElementById('work-index-current');
    var workCounterCurrentEl = document.getElementById('work-counter-current');
    var workCounterTotalEl = document.getElementById('work-counter-total');
    var workPrevBtn = document.getElementById('work-prev');
    var workNextBtn = document.getElementById('work-next');

    var workCount = workSlides.length;
    var workActiveIndex = 0;

    function pad2(n) { return (n < 10 ? '0' : '') + n; }

    if (workCounterTotalEl) workCounterTotalEl.textContent = pad2(workCount);

    // Updates the featured slide, thumbnail, dot and counter together so
    // they always agree, whichever control triggered the change.
    function setWorkIndex(index) {
      workActiveIndex = ((index % workCount) + workCount) % workCount;

      workSlides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === workActiveIndex);
      });
      workThumbs.forEach(function (thumb, i) {
        var active = i === workActiveIndex;
        thumb.classList.toggle('is-active', active);
        thumb.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      workDotEls.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === workActiveIndex);
      });
      if (workIndexCurrentEl) workIndexCurrentEl.textContent = pad2(workActiveIndex + 1);
      if (workCounterCurrentEl) workCounterCurrentEl.textContent = pad2(workActiveIndex + 1);
    }

    // --- Autoplay: advances one project at a time and loops back to the
    // first after the last. Paused while the carousel is out of view, the
    // tab is hidden, reduced motion is requested, the project modal is
    // open, or the user is actively interacting with it (hover, focus,
    // touch) — and resumed automatically a short while after they let go.
    var AUTOPLAY_INTERVAL = 5500;
    var RESUME_DELAY = 4000;
    var workAutoplayTimer = null;
    var workResumeTimer = null;
    var workInView = true;

    function stopWorkAutoplay() {
      if (workAutoplayTimer) {
        clearInterval(workAutoplayTimer);
        workAutoplayTimer = null;
      }
    }

    function startWorkAutoplay() {
      if (prefersReducedMotion || workAutoplayTimer || !workInView || document.hidden) return;
      if (workCount < 2) return;
      workAutoplayTimer = setInterval(function () {
        setWorkIndex(workActiveIndex + 1);
      }, AUTOPLAY_INTERVAL);
    }

    function pauseWorkAutoplay() {
      stopWorkAutoplay();
      clearTimeout(workResumeTimer);
    }
    function scheduleWorkResume() {
      clearTimeout(workResumeTimer);
      workResumeTimer = setTimeout(startWorkAutoplay, RESUME_DELAY);
    }
    function pauseAndScheduleWorkResume() {
      pauseWorkAutoplay();
      scheduleWorkResume();
    }

    // Sustained hover / keyboard focus: pause immediately and only resume
    // once the user actually leaves, so a long hover never gets
    // interrupted by an autoplay jump.
    workCarousel.addEventListener('pointerenter', pauseWorkAutoplay);
    workCarousel.addEventListener('pointerleave', scheduleWorkResume);
    workCarousel.addEventListener('focusin', pauseWorkAutoplay);
    workCarousel.addEventListener('focusout', scheduleWorkResume);

    // Touch: a tap/swipe is a one-off interaction with no "leave" event of
    // its own, so pause and resume a few seconds later.
    workCarousel.addEventListener('touchstart', pauseAndScheduleWorkResume, { passive: true });

    if ('IntersectionObserver' in window) {
      var workVisibilityObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          workInView = entry.isIntersecting;
          if (workInView) {
            startWorkAutoplay();
          } else {
            stopWorkAutoplay();
          }
        });
      }, { threshold: 0.35 });
      workVisibilityObserver.observe(workCarousel);
    } else {
      startWorkAutoplay();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopWorkAutoplay();
      } else {
        startWorkAutoplay();
      }
    });

    if (workPrevBtn) {
      workPrevBtn.addEventListener('click', function () {
        setWorkIndex(workActiveIndex - 1);
        pauseAndScheduleWorkResume();
      });
    }
    if (workNextBtn) {
      workNextBtn.addEventListener('click', function () {
        setWorkIndex(workActiveIndex + 1);
        pauseAndScheduleWorkResume();
      });
    }

    workThumbs.forEach(function (thumb, i) {
      thumb.addEventListener('click', function () {
        setWorkIndex(i);
        pauseAndScheduleWorkResume();
      });
    });
    workDotEls.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        setWorkIndex(i);
        pauseAndScheduleWorkResume();
      });
    });

    // Basic keyboard support when the stage itself is focused.
    workStage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setWorkIndex(workActiveIndex + 1);
        pauseAndScheduleWorkResume();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setWorkIndex(workActiveIndex - 1);
        pauseAndScheduleWorkResume();
      }
    });

    setWorkIndex(0);

    /* ---- Project details modal --------------------------------------
     * Reads its content straight off the matching .work-slide (image,
     * icon, tag, title, description) instead of duplicating that data in
     * JS — the DOM markup stays the single source of truth. The "services
     * provided" list is derived from the existing tag text (e.g. "هوية +
     * محتوى" → two items) rather than inventing metadata the project data
     * doesn't have. */
    var projectModal = document.getElementById('project-modal');

    if (projectModal) {
      var modalImage = document.getElementById('project-modal-image');
      var modalCounter = document.getElementById('project-modal-counter');
      var modalTag = document.getElementById('project-modal-tag');
      var modalIcon = document.getElementById('project-modal-icon');
      var modalTitle = document.getElementById('project-modal-title');
      var modalDesc = document.getElementById('project-modal-desc');
      var modalServicesList = document.getElementById('project-modal-services-list');
      var modalPrevBtn = document.getElementById('project-modal-prev');
      var modalNextBtn = document.getElementById('project-modal-next');
      var modalCloseEls = Array.prototype.slice.call(projectModal.querySelectorAll('[data-modal-close]'));
      var openTriggers = Array.prototype.slice.call(document.querySelectorAll('[data-open-project]'));
      var modalLastFocused = null;

      function fillProjectModal(index) {
        var slide = workSlides[index];
        if (!slide) return;

        var img = slide.querySelector('.work-slide-media img');
        var icon = slide.querySelector('.work-slide-icon');
        var tag = slide.querySelector('.work-slide-tag');
        var title = slide.querySelector('h3');
        var desc = slide.querySelector('p');
        var tagText = tag ? tag.textContent.trim() : '';

        if (modalImage && img) { modalImage.src = img.src; modalImage.alt = img.alt; }
        if (modalCounter) modalCounter.textContent = '( ' + pad2(index + 1) + ' )';
        if (modalTag) modalTag.textContent = tagText;
        if (modalIcon) modalIcon.innerHTML = icon ? icon.innerHTML : '';
        if (modalTitle) modalTitle.textContent = title ? title.textContent : '';
        if (modalDesc) modalDesc.textContent = desc ? desc.textContent : '';

        if (modalServicesList) {
          modalServicesList.innerHTML = '';
          tagText.split('+').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (label) {
            var li = document.createElement('li');
            li.textContent = label;
            modalServicesList.appendChild(li);
          });
        }
      }

      function onModalKeydown(e) {
        if (e.key === 'Escape') {
          closeProjectModal();
          return;
        }
        if (e.key === 'Tab') {
          // Minimal focus trap: keep Tab/Shift+Tab cycling inside the panel.
          var focusable = Array.prototype.slice.call(
            projectModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
          ).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
          if (!focusable.length) return;
          var first = focusable[0];
          var last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }

      function openProjectModal(index) {
        modalLastFocused = document.activeElement;
        fillProjectModal(index);
        setWorkIndex(index);
        pauseWorkAutoplay();

        projectModal.hidden = false;
        void projectModal.offsetWidth; // force reflow so the entrance transition runs
        projectModal.classList.add('is-open');
        document.documentElement.classList.add('modal-open');

        var closeBtn = projectModal.querySelector('.project-modal-close');
        if (closeBtn) closeBtn.focus();
        document.addEventListener('keydown', onModalKeydown);
      }

      function closeProjectModal() {
        projectModal.classList.remove('is-open');
        document.documentElement.classList.remove('modal-open');
        document.removeEventListener('keydown', onModalKeydown);
        scheduleWorkResume();

        var finishClose = function () { projectModal.hidden = true; };
        if (prefersReducedMotion) {
          finishClose();
        } else {
          setTimeout(finishClose, 320);
        }

        if (modalLastFocused && typeof modalLastFocused.focus === 'function') modalLastFocused.focus();
      }

      openTriggers.forEach(function (trigger) {
        trigger.addEventListener('click', function () {
          var slide = trigger.closest('.work-slide');
          var index = slide ? workSlides.indexOf(slide) : workActiveIndex;
          openProjectModal(index);
        });
      });

      modalCloseEls.forEach(function (el) {
        el.addEventListener('click', closeProjectModal);
      });

      if (modalPrevBtn) {
        modalPrevBtn.addEventListener('click', function () {
          var i = (workActiveIndex - 1 + workCount) % workCount;
          setWorkIndex(i);
          fillProjectModal(i);
        });
      }
      if (modalNextBtn) {
        modalNextBtn.addEventListener('click', function () {
          var i = (workActiveIndex + 1) % workCount;
          setWorkIndex(i);
          fillProjectModal(i);
        });
      }
    }
  }

  /* -----------------------------------------------------------
   * 4) Scroll reveal — lightweight fade/slide-in as content enters the
   *    viewport. See the matching CSS in style.css for the full safety
   *    notes: the hidden initial state only ever applies when JS actually
   *    ran AND the visitor has no reduced-motion preference, so content
   *    is never at risk of being stuck invisible.
   * ----------------------------------------------------------- */
  if (!prefersReducedMotion) {
    var revealTargets = Array.prototype.slice.call(
      document.querySelectorAll('[data-reveal], [data-reveal-group]')
    );

    if (revealTargets.length) {
      if ('IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in');
              revealObserver.unobserve(entry.target);
            }
          });
          // threshold:0 + a positive bottom rootMargin means a section starts
          // animating as it approaches the viewport (while still a bit below
          // the fold), not only once it's already on screen — noticeably
          // more responsive while scrolling.
        }, { threshold: 0, rootMargin: '0px 0px 12% 0px' });

        revealTargets.forEach(function (el) { revealObserver.observe(el); });
      } else {
        // No IntersectionObserver support: skip the animation, not the content.
        revealTargets.forEach(function (el) { el.classList.add('is-in'); });
      }
    }
  }

  /* -----------------------------------------------------------
   * 5) Hero stats — animated counters. Each .hero-stat-value already holds
   *    its real final text ("+120", "97%", …) so the markup degrades
   *    correctly with no JS/no IntersectionObserver; here that text is
   *    parsed once into a leading non-digit prefix, the number, and a
   *    trailing non-digit suffix, the display is reset to zero, and the
   *    number counts up to its real value (only the digits animate — the
   *    "+"/"%" stay fixed) once the stats row scrolls into view. Runs once
   *    per page load and is skipped entirely under reduced motion.
   * ----------------------------------------------------------- */
  (function heroStatsCounters() {
    var statValues = Array.prototype.slice.call(document.querySelectorAll('.hero-stat-value'));
    if (!statValues.length) return;

    var counters = statValues.map(function (el) {
      var match = /^(\D*)(\d+)(\D*)$/.exec(el.textContent.trim());
      if (!match) return null;
      return { el: el, prefix: match[1], target: parseInt(match[2], 10), suffix: match[3] };
    }).filter(Boolean);
    if (!counters.length) return;

    if (prefersReducedMotion) return; // final values already sit in the markup — nothing to do.

    // Zero out the display up front (before anything is visible/observed)
    // so there is a real "0 -> final value" count to see once triggered.
    counters.forEach(function (c) { c.el.textContent = c.prefix + '0' + c.suffix; });

    var DURATION = 1700; // ms — within the requested 1.5-2s window.
    // easeOutCubic: fast start, gentle, premium settle — no bounce/overshoot.
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function runCounters() {
      var start = null;
      function tick(now) {
        if (start === null) start = now;
        var progress = Math.min((now - start) / DURATION, 1);
        var eased = easeOutCubic(progress);
        counters.forEach(function (c) {
          var value = Math.round(c.target * eased);
          c.el.textContent = c.prefix + value + c.suffix;
        });
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          // Land exactly on the authored target, sidestepping any float/round drift.
          counters.forEach(function (c) { c.el.textContent = c.prefix + c.target + c.suffix; });
        }
      }
      requestAnimationFrame(tick);
    }

    var statsRow = document.querySelector('.hero-stats');
    if (!statsRow) { runCounters(); return; }

    if ('IntersectionObserver' in window) {
      var statsObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            statsObserver.unobserve(entry.target);
            runCounters();
          }
        });
      }, { threshold: 0.35 });
      statsObserver.observe(statsRow);
    } else {
      runCounters();
    }
  })();

  /* -----------------------------------------------------------
   * 6) Sticky header — cross-fades in the light/scrolled header style the
   *    instant the page scrolls even slightly. Uses an IntersectionObserver
   *    on a zero-size sentinel at the very top of the page instead of a
   *    scroll listener, so there's no per-frame scroll handler running —
   *    just a single cheap callback the moment the sentinel leaves view.
   * ----------------------------------------------------------- */
  var siteHeader = document.querySelector('.site-header');
  var scrollSentinel = document.getElementById('scroll-sentinel');

  if (siteHeader && scrollSentinel && 'IntersectionObserver' in window) {
    var headerScrollObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        siteHeader.classList.toggle('is-scrolled', !entry.isIntersecting);
      });
    }, { threshold: 0 });
    headerScrollObserver.observe(scrollSentinel);
  } else if (siteHeader) {
    // No IntersectionObserver support: fall back to a passive scroll
    // listener (still cheap — just a class toggle, no layout reads beyond
    // the scroll position itself).
    var applyHeaderScrolledState = function () {
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 4);
    };
    window.addEventListener('scroll', applyHeaderScrolledState, { passive: true });
    applyHeaderScrolledState();
  }

  /* -----------------------------------------------------------
   * 7) Navigation active state — marks whichever nav link matches the
   *    current page/section with .is-active (styled in style.css). Driven
   *    entirely by <body data-page="home|join-team|start-project">, so it
   *    works consistently across the whole site without hard-coding any
   *    single page as "the" active one.
   *      - home: an IntersectionObserver scroll-spy over the six main
   *        sections toggles the matching .desktop-nav / .mobile-menu link
   *        (defaults to #top before the visitor has scrolled).
   *      - join-team / start-project: neither page has its own entry in
   *        the main nav — "Join Team" and "Start Project" only exist as
   *        the header/mobile CTA buttons — so the matching CTA (by href)
   *        is marked active instead, on every page that CTA appears on.
   * ----------------------------------------------------------- */
  var currentPage = document.body.getAttribute('data-page');

  var navLinkSelector = [
    '.desktop-nav a',
    '.mobile-menu a',
    '.header-actions .creative-link',
    '.header-actions .button-dark'
  ].join(', ');

  function setActiveNavLinks(isMatch) {
    var links = document.querySelectorAll(navLinkSelector);
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle('is-active', isMatch(links[i]));
    }
  }

  if (currentPage === 'home') {
    var sectionIds = ['top', 'section-1', 'section-2', 'work', 'section-5', 'contact'];
    var navSections = sectionIds
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    function activateSection(id) {
      setActiveNavLinks(function (link) {
        return link.getAttribute('href') === '#' + id;
      });
    }

    activateSection('top'); // default before the visitor scrolls (or without IO support)

    if (navSections.length && 'IntersectionObserver' in window) {
      var navObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) activateSection(entry.target.id);
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

      navSections.forEach(function (section) { navObserver.observe(section); });
    }
  } else if (currentPage === 'join-team' || currentPage === 'start-project') {
    var targetHash = currentPage === 'join-team' ? '#join-form' : '#start-form';
    setActiveNavLinks(function (link) { return link.getAttribute('href') === targetHash; });
  }
})();
