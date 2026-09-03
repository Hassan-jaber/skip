/* ==========================================================================
   SKIP® — homepage behaviour
   ========================================================================== */
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------- load ----- */
  function boot() { requestAnimationFrame(function () { doc.classList.add("is-ready"); }); }
  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);

  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* -------------------------------------------- header state + logo ----- */
  var hdr = document.getElementById("hdr");
  var brand = document.getElementById("brand");
  var hero = document.querySelector(".hero");
  var tick = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var over = hero ? y > hero.offsetHeight - 90 : y > 80;
    if (hdr) hdr.classList.toggle("stuck", y > 20);
    /* white logo while the header floats over the dark hero, red once it
       sits on the light page */
    if (brand) brand.classList.toggle("on-dark", !over);
    spy();
    tick = false;
  }
  window.addEventListener("scroll", function () {
    if (!tick) { tick = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* --------------------------------------------------------- mobile ----- */
  var burger = document.getElementById("burger");
  var mmenu = document.getElementById("mmenu");

  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (burger) {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    }
    if (open && mmenu) {
      var links = mmenu.querySelectorAll(".mmenu__nav a");
      Array.prototype.forEach.call(links, function (a, i) {
        a.style.animationDelay = (0.12 + i * 0.055) + "s";
      });
      if (links[0]) setTimeout(function () { links[0].focus(); }, 300);
    }
  }
  if (burger) burger.addEventListener("click", function () {
    setNav(!document.body.classList.contains("nav-open"));
  });
  if (mmenu) mmenu.addEventListener("click", function (e) {
    if (e.target.closest("a")) setNav(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
      setNav(false);
      if (burger) burger.focus();
    }
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 960 && document.body.classList.contains("nav-open")) setNav(false);
  });

  /* -------------------------------------------------------- reveals ----- */
  var rv = document.querySelectorAll(".rv");
  if (reduced || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(rv, function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -7% 0px", threshold: 0 });
    Array.prototype.forEach.call(rv, function (el) { io.observe(el); });
  }

  /* --------------------------------------------------- nav scrollspy ----
     Position-based, not observer-based. The old version observed #top,
     which is <main> and therefore always intersecting — so whichever
     section fired last kept the active state, and scrolling back to the
     hero left "من نحن" lit. Here we resolve "#top" to the hero element
     itself and pick the last section whose top has passed a probe line
     just below the header. Deterministic at any viewport height, with
     smooth scrolling, and on mobile.                                     */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var menuLinks = Array.prototype.slice.call(document.querySelectorAll(".mmenu__nav a"));
  var heroEl = document.querySelector(".hero");

  var spots = navLinks.map(function (a) {
    var href = a.getAttribute("href");
    var el = href === "#top" ? heroEl : document.querySelector(href);
    return el ? { el: el, href: href } : null;
  }).filter(Boolean);

  var tops = [], lastH = 0, activeHref = null;

  function measure() {
    tops = spots.map(function (s) {
      return { href: s.href, top: s.el.getBoundingClientRect().top + window.scrollY };
    });
    lastH = document.documentElement.scrollHeight;
  }

  function setActive(href) {
    if (href === activeHref) return;
    activeHref = href;
    navLinks.concat(menuLinks).forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("href") === href);
    });
  }

  function spy() {
    if (!spots || !spots.length) return;
    var docH = document.documentElement.scrollHeight;
    if (docH !== lastH) measure();               /* images/fonts shifted things */

    var y = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight;

    if (y <= 4) { setActive(tops[0].href); return; }                    /* at the top → الرئيسية */
    if (y + vh >= docH - 2) { setActive(tops[tops.length - 1].href); return; }  /* at the bottom → last section */

    var headerH = hdr ? hdr.offsetHeight : 0;
    var probe = y + headerH + (vh - headerH) * 0.34;
    var current = tops[0].href;
    for (var i = 0; i < tops.length; i++) if (tops[i].top <= probe) current = tops[i].href;
    setActive(current);
  }

  measure();
  spy();
  window.addEventListener("load", function () { measure(); spy(); });
  window.addEventListener("resize", function () { measure(); spy(); });

  /* ------------------------------------------------ anchor scrolling ---- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    if (!id || id.length < 2) return;
    var t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    var pad = id === "#top" ? 0 : 74;
    window.scrollTo({
      top: t.getBoundingClientRect().top + window.scrollY - pad,
      behavior: reduced ? "auto" : "smooth"
    });
    if (history.replaceState) history.replaceState(null, "", id);
  });

  /* ------------------------------------------------------------ form ---- */
  var form = document.getElementById("form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = null;
      Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (f) {
        if (!f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value))) {
          if (!bad) bad = f;
        }
      });
      if (bad) { bad.focus(); return; }
      form.classList.add("sent");
      form.reset();
    });
  }
})();
