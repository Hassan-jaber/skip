/**
 * SKIP — وكالة إبداعية رقمية
 * Vanilla JS behaviour, migrated 1:1 from the original React component,
 * plus a few lightweight, progressive-enhancement additions:
 *   1) mobile/tablet full-screen nav menu (open/close)
 *   2) the services list hover/focus preview (active service index)
 *   3) the work section's project card carousel (manual + autoplay)
 *   4) a small IntersectionObserver-driven scroll-reveal for section content
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
   * 2) Services section — active preview driven by hover/focus
   * ----------------------------------------------------------- */
  var services = [
    ['01', 'التخطيط الاستراتيجي', 'نبدأ من السؤال الصح.'],
    ['02', 'إدارة حسابات التواصل الاجتماعي', 'حضور يومي، بصوت واضح.'],
    ['03', 'صناعة المحتوى', 'فكرة تعرف طريقها للناس.'],
    ['04', 'الإنتاج المرئي', 'مشاهد تعلق في الذاكرة.'],
    ['05', 'الإعلانات المدفوعة', 'ميزانية تروح للمكان الصح.'],
    ['06', 'الهوية البصرية', 'شكل يثبت في البال.'],
    ['07', 'تحسين محركات البحث', 'تطلع وقت ما يبحثون عنك.'],
    ['08', 'تحليل البيانات', 'نفهم الأرقام قبل ما نحكم.'],
    ['09', 'تطوير المواقع والمتاجر', 'تجربة تبيع، مو بس تنعرض.']
  ];

  var previewPhotoIds = [
    '1558655146-d09347e92766',
    '1556761175-b945217fcb8c',
    '1516321318423-f06f85e504b3',
    '1485846234645-a62644f84728',
    '1460925895917-afdab827c52f'
  ];

  var serviceList = document.getElementById('service-list');
  var previewNumber = document.getElementById('preview-number');
  var previewImage = document.getElementById('preview-image');
  var previewDesc = document.getElementById('preview-desc');

  function setActiveService(index) {
    if (!serviceList) return;

    var rows = serviceList.querySelectorAll('.service-row');
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.toggle('is-active', i === index);
    }

    var service = services[index];
    if (!service) return;

    if (previewNumber) previewNumber.textContent = service[0];
    if (previewDesc) previewDesc.textContent = service[2];
    if (previewImage) {
      var photoId = previewPhotoIds[index % previewPhotoIds.length];
      previewImage.src = 'https://images.unsplash.com/photo-' + photoId + '?auto=format&fit=crop&w=900&q=80';
    }
  }

  if (serviceList) {
    var serviceRows = serviceList.querySelectorAll('.service-row');
    for (var j = 0; j < serviceRows.length; j++) {
      (function (row) {
        var index = parseInt(row.getAttribute('data-index'), 10);
        row.addEventListener('mouseenter', function () { setActiveService(index); });
        row.addEventListener('focus', function () { setActiveService(index); });
      })(serviceRows[j]);
    }
  }

  /* -----------------------------------------------------------
   * 3) Work section — project card carousel: manual controls +
   *    autoplay that loops, pauses on interaction, and resumes.
   * ----------------------------------------------------------- */
  var workTrack = document.getElementById('work-track');
  var workDotsWrap = document.getElementById('work-dots');

  if (workTrack && workDotsWrap) {
    var workCards = Array.prototype.slice.call(workTrack.querySelectorAll('.work-card'));
    var workDots = Array.prototype.slice.call(workDotsWrap.querySelectorAll('.work-dot'));
    var workCarousel = workTrack.closest('.work-carousel') || workTrack;

    function goToWorkSlide(index) {
      var card = workCards[index];
      if (!card) return;
      // .work-track is position:relative, so card.offsetLeft is already
      // measured relative to it (its offsetParent) — no extra math needed.
      workTrack.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
    }

    function setActiveWorkDot(index) {
      for (var i = 0; i < workDots.length; i++) {
        var active = i === index;
        workDots[i].classList.toggle('is-active', active);
        workDots[i].setAttribute('aria-selected', active ? 'true' : 'false');
      }
    }

    function getActiveWorkIndex() {
      var i = workDots.findIndex(function (d) { return d.classList.contains('is-active'); });
      return i === -1 ? 0 : i;
    }

    // --- Autoplay: advances one slide at a time and loops back to the
    // first card after the last one. Paused while the carousel is out of
    // view, the tab is hidden, reduced motion is requested, or the user is
    // actively interacting with it (hover, focus, touch, manual scroll) —
    // and resumed automatically a short while after they let go.
    var AUTOPLAY_INTERVAL = 5000;
    var RESUME_DELAY = 3500;
    var autoplayTimer = null;
    var resumeTimer = null;
    var carouselInView = true;

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      if (prefersReducedMotion || autoplayTimer || !carouselInView || document.hidden) return;
      if (workCards.length < 2) return;
      autoplayTimer = setInterval(function () {
        var nextIndex = (getActiveWorkIndex() + 1) % workCards.length;
        // Update the dot immediately rather than waiting on the scroll-sync
        // debounce below to catch up.
        setActiveWorkDot(nextIndex);
        goToWorkSlide(nextIndex);
      }, AUTOPLAY_INTERVAL);
    }

    function pauseAutoplay() {
      stopAutoplay();
      clearTimeout(resumeTimer);
    }
    function scheduleResume() {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(startAutoplay, RESUME_DELAY);
    }
    function pauseAndScheduleResume() {
      pauseAutoplay();
      scheduleResume();
    }

    // Sustained hover / keyboard focus: pause immediately and only resume
    // once the user actually leaves (not just after a fixed delay, so a
    // long hover never gets interrupted by an autoplay jump).
    workCarousel.addEventListener('pointerenter', pauseAutoplay);
    workCarousel.addEventListener('pointerleave', scheduleResume);
    workCarousel.addEventListener('focusin', pauseAutoplay);
    workCarousel.addEventListener('focusout', scheduleResume);

    // Touch: a tap/swipe is a one-off interaction with no "leave" event of
    // its own, so pause and resume a few seconds later.
    workCarousel.addEventListener('touchstart', pauseAndScheduleResume, { passive: true });

    if ('IntersectionObserver' in window) {
      var carouselVisibilityObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          carouselInView = entry.isIntersecting;
          if (carouselInView) {
            startAutoplay();
          } else {
            stopAutoplay();
          }
        });
      }, { threshold: 0.4 });
      carouselVisibilityObserver.observe(workCarousel);
    } else {
      startAutoplay();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    workDots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        // Update the active dot immediately for instant feedback, rather
        // than waiting on the scroll-sync debounce below to catch up.
        setActiveWorkDot(i);
        goToWorkSlide(i);
        pauseAndScheduleResume();
      });
    });

    // Keep the dots in sync while the user scrolls/swipes the track
    // manually, by finding whichever card is closest to the start edge.
    var workScrollTimeout;
    workTrack.addEventListener('scroll', function () {
      clearTimeout(workScrollTimeout);
      workScrollTimeout = setTimeout(function () {
        var trackLeft = workTrack.scrollLeft;
        var closestIndex = 0;
        var closestDistance = Infinity;
        workCards.forEach(function (card, i) {
          var distance = Math.abs(card.offsetLeft - trackLeft);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = i;
          }
        });
        setActiveWorkDot(closestIndex);
        // Manual drag/trackpad scrolling only reaches here while the
        // cursor/finger is over the carousel, which already paused
        // autoplay via pointerenter/touchstart — this just makes sure
        // the resume timer counts from when scrolling actually settled.
        scheduleResume();
      }, 100);
    }, { passive: true });

    // Basic keyboard support when the track itself is focused.
    workTrack.addEventListener('keydown', function (e) {
      var activeIndex = getActiveWorkIndex();
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToWorkSlide(Math.min(activeIndex + 1, workCards.length - 1));
        pauseAndScheduleResume();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToWorkSlide(Math.max(activeIndex - 1, 0));
        pauseAndScheduleResume();
      }
    });
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
   * 5) Sticky header — cross-fades in the light/scrolled header style the
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
   * 6) Navigation active state — marks whichever nav link matches the
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
