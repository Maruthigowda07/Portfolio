/* ==========================================================================
   MARUTHI — portfolio interactions
   Plain JavaScript: navigation, reveal-on-scroll, active section, form.
   ========================================================================== */

(function () {
  'use strict';

  var FORMSPREE_URL = 'https://formspree.io/f/xeaoppbq';

  var nav = document.getElementById('site-nav');
  var toggle = nav.querySelector('.nav__toggle');
  var menu = document.getElementById('nav-menu');
  var menuLinks = Array.prototype.slice.call(menu.querySelectorAll('a'));
  var toggleLabel = toggle.querySelector('.visually-hidden');

  /* ----------------------------------------------------------------------
     1. Navigation — solid background once the page is scrolled
     ---------------------------------------------------------------------- */
  function handleScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 10);
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* ----------------------------------------------------------------------
     2. Mobile menu — open / close, Escape key, focus handling
     ---------------------------------------------------------------------- */
  function isOpen() {
    return nav.classList.contains('is-open');
  }

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? 'Close menu' : 'Open menu';
    document.body.style.overflow = open ? 'hidden' : '';

    if (open && menuLinks.length) {
      menuLinks[0].focus();
    } else if (!open) {
      toggle.focus();
    }
  }

  toggle.addEventListener('click', function () {
    setMenu(!isOpen());
  });

  menuLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (isOpen()) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggleLabel.textContent = 'Open menu';
        document.body.style.overflow = '';
      }
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) {
      setMenu(false);
    }
  });

  document.addEventListener('click', function (event) {
    if (isOpen() && !menu.contains(event.target) && !toggle.contains(event.target)) {
      setMenu(false);
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && isOpen()) {
      setMenu(false);
    }
  });

  /* ----------------------------------------------------------------------
     3. Reveal elements as they enter the viewport (fade-up)
     ---------------------------------------------------------------------- */
  var revealItems = document.querySelectorAll('[data-reveal], [data-reveal-media]');

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add('is-visible');
    });
  }

  /* ----------------------------------------------------------------------
     4. Highlight the section currently being viewed
     ---------------------------------------------------------------------- */
  var sectionIds = ['about', 'skills', 'projects', 'contact'];
  var sections = sectionIds
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));

  function setActiveSection(id) {
    navLinks.forEach(function (link) {
      var match = link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-active', match);
      if (match) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  /* ----------------------------------------------------------------------
     5. Contact form — validation, then submit via Formspree (fetch/AJAX)
     ---------------------------------------------------------------------- */
  var form = document.getElementById('contact-form');

  if (form) {
    var statusEl = form.querySelector('.form__status');
    var fieldIds = ['name', 'email', 'subject', 'message'];
    var fields = fieldIds.map(function (id) { return document.getElementById(id); });
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function showFieldState(input, message) {
      var wrapper = input.closest('.form__field');
      var errorEl = document.getElementById(input.id + '-error');
      var invalid = Boolean(message);

      wrapper.classList.toggle('is-invalid', invalid);
      errorEl.textContent = message || '';

      if (invalid) {
        input.setAttribute('aria-invalid', 'true');
      } else {
        input.removeAttribute('aria-invalid');
      }

      return !invalid;
    }

    function validateField(input) {
      var value = input.value.trim();

      if (!value) {
        return showFieldState(input, 'This field is required.');
      }
      if (input.type === 'email' && !emailPattern.test(value)) {
        return showFieldState(input, 'Enter a valid email address.');
      }
      return showFieldState(input, '');
    }

    fields.forEach(function (input) {
      input.addEventListener('blur', function () {
        if (input.value.trim() || input.getAttribute('aria-invalid')) {
          validateField(input);
        }
      });

      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid')) {
          validateField(input);
        }
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var firstInvalid = null;

      fields.forEach(function (input) {
        var valid = validateField(input);
        if (!valid && !firstInvalid) {
          firstInvalid = input;
        }
      });

      if (firstInvalid) {
        statusEl.textContent = 'Please fix the highlighted fields.';
        firstInvalid.focus();
        return;
      }

      var payload = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        subject: document.getElementById('subject').value.trim(),
        message: document.getElementById('message').value.trim()
      };

      var submitBtn = form.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      statusEl.textContent = 'Sending…';

      fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      }).then(function (response) {
        if (!response.ok) {
          throw new Error('Formspree request failed with status ' + response.status);
        }
        return response.json().catch(function () { return {}; });
      }).then(function () {
        statusEl.textContent = 'Message sent successfully. I will get back to you soon.';
        form.reset();
        fields.forEach(function (input) {
          showFieldState(input, '');
        });
      }).catch(function () {
        statusEl.textContent = 'Something went wrong. Please try again or email me directly at ntrmaruthi72@gmail.com.';
      }).then(function () {
        submitBtn.disabled = false;
      });
    });
  }
})();
