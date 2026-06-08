/**
 * Vaahan International — Main JavaScript
 * vaahan-child/assets/js/vaahan.js
 *
 * Keep this file lean. No heavy libraries.
 * jQuery is available as $ (enqueued by WordPress).
 */

(function ($) {
  'use strict';

  /* ============================================================
     1. SCROLL REVEAL ANIMATION
     Elements with class .vaahan-fade animate in on scroll
     ============================================================ */

  function initScrollReveal() {
    const elements = document.querySelectorAll('.vaahan-fade');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.08 }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }


  /* ============================================================
     2. MOBILE NAVIGATION TOGGLE
     ============================================================ */

  function initMobileNav() {
    const hamburger = document.getElementById('vaahan-hamburger');
    const mobileMenu = document.getElementById('vaahan-mobile-menu');

    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
      hamburger.setAttribute(
        'aria-expanded',
        mobileMenu.classList.contains('open') ? 'true' : 'false'
      );
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
      }
    });
  }


  /* ============================================================
     3. STICKY NAV SCROLL BEHAVIOUR
     Add shadow to nav on scroll
     ============================================================ */

  function initStickyNav() {
    const nav = document.querySelector('.site-header, #masthead');
    if (!nav) return;

    window.addEventListener(
      'scroll',
      function () {
        if (window.scrollY > 10) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      },
      { passive: true }
    );
  }


  /* ============================================================
     4. SMOOTH SCROLL FOR ANCHOR LINKS
     ============================================================ */

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;

        e.preventDefault();
        const navHeight = 70;
        const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;

        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      });
    });
  }


  /* ============================================================
     5. READ TIME DISPLAY
     If article has read time meta, show it in article header
     ============================================================ */

  function initReadTime() {
    const readTimeEl = document.querySelector('.vaahan-read-time');
    if (!readTimeEl) return;

    // If no value set via PHP, calculate from content
    if (!readTimeEl.textContent.trim()) {
      const content = document.querySelector('.entry-content');
      if (!content) return;

      const wordCount = content.innerText.split(/\s+/).length;
      const minutes = Math.ceil(wordCount / 200); // avg 200 wpm reading speed
      readTimeEl.textContent = minutes + ' min read';
    }
  }


  /* ============================================================
     6. LEAD FORM UTM TRACKING
     Capture UTM params from URL and add to hidden form fields
     ============================================================ */

  function initUTMTracking() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

    utmFields.forEach(function (param) {
      const value = urlParams.get(param);
      if (!value) return;

      // Store in sessionStorage
      sessionStorage.setItem(param, value);
    });

    // Fill hidden UTM fields in WPForms
    document.querySelectorAll('input[name*="utm_"]').forEach(function (input) {
      const paramName = input.name.match(/utm_\w+/);
      if (!paramName) return;

      const storedValue = sessionStorage.getItem(paramName[0]);
      if (storedValue) {
        input.value = storedValue;
      }
    });

    // Also capture current page URL for lead source tracking
    document.querySelectorAll('input[name="vaahan_lead_source"]').forEach(function (input) {
      input.value = window.location.href;
    });
  }


  /* ============================================================
     7. TABLE OF CONTENTS (Auto-generate for long articles)
     Finds all H2s in article and builds a TOC
     ============================================================ */

  function initTableOfContents() {
    const tocContainer = document.querySelector('.vaahan-toc');
    if (!tocContainer) return;

    const article = document.querySelector('.entry-content');
    if (!article) return;

    const headings = article.querySelectorAll('h2');
    if (headings.length < 3) {
      // Not enough headings to warrant a TOC
      tocContainer.style.display = 'none';
      return;
    }

    const tocList = document.createElement('ol');
    tocList.className = 'vaahan-toc-list';

    headings.forEach(function (heading, index) {
      // Add ID to heading for anchor links
      const id = 'section-' + (index + 1);
      heading.id = id;

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = heading.textContent;
      li.appendChild(a);
      tocList.appendChild(li);
    });

    tocContainer.appendChild(tocList);
  }


  /* ============================================================
     8. NEWSLETTER FORM HANDLING
     ============================================================ */

  function initNewsletterForm() {
    const form = document.getElementById('vaahan-newsletter-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const emailInput = form.querySelector('input[type="email"]');
      const btn = form.querySelector('button[type="submit"]');
      const successMsg = document.getElementById('vaahan-nl-success');

      if (!emailInput || !emailInput.value) return;

      // Show loading state
      btn.textContent = 'Subscribing...';
      btn.disabled = true;

      // Submit to Mailchimp via WPForms or directly
      // TODO: Replace with actual Mailchimp integration
      setTimeout(function () {
        form.style.display = 'none';
        if (successMsg) successMsg.style.display = 'block';
      }, 1000);
    });
  }


  /* ============================================================
     INITIALISE ALL ON DOM READY
     ============================================================ */

  $(document).ready(function () {
    initScrollReveal();
    initMobileNav();
    initStickyNav();
    initSmoothScroll();
    initReadTime();
    initUTMTracking();
    initTableOfContents();
    initNewsletterForm();

    console.log('Vaahan International — JS loaded ✓');
  });

})(jQuery);
