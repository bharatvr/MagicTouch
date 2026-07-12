(function () {
  'use strict';

  /* ---------- EmailJS init ---------- */
  if (window.emailjs && typeof EMAILJS_CONFIG !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_CONFIG.PUBLIC_KEY });
  }

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('primaryNav');

  function closeNav() {
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
  }

  navToggle.addEventListener('click', function () {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* ---------- Hero slideshow ---------- */
  const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
  if (heroSlides.length > 1) {
    let heroCurrent = 0;
    setInterval(function () {
      heroSlides[heroCurrent].classList.remove('active');
      heroCurrent = (heroCurrent + 1) % heroSlides.length;
      heroSlides[heroCurrent].classList.add('active');
    }, 5000);
  }

  /* ---------- Gallery lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  let lightboxItems = [];
  let lightboxIndex = -1;

  function showLightboxAt(index) {
    if (lightboxItems.length === 0) return;
    lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
    const item = lightboxItems[lightboxIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.caption;
    const multiple = lightboxItems.length > 1;
    lightboxPrev.style.display = multiple ? '' : 'none';
    lightboxNext.style.display = multiple ? '' : 'none';
  }

  function openLightbox(index) {
    showLightboxAt(index);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
  }

  document.addEventListener('click', function (e) {
    const item = e.target.closest('.gallery-item');
    if (item) openLightbox(Number(item.dataset.index));
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', function () { showLightboxAt(lightboxIndex - 1); });
  lightboxNext.addEventListener('click', function () { showLightboxAt(lightboxIndex + 1); });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showLightboxAt(lightboxIndex - 1);
    if (e.key === 'ArrowRight') showLightboxAt(lightboxIndex + 1);
  });

  /* ---------- Gallery carousel (auto-loaded from folder) ---------- */
  function filenameToCaption(filename) {
    return filename
      .replace(/\.[^./]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function naturalCompare(a, b) {
    const chunk = /(\d+|\D+)/g;
    const aParts = a.match(chunk) || [];
    const bParts = b.match(chunk) || [];
    const len = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < len; i++) {
      const x = aParts[i] || '';
      const y = bParts[i] || '';
      if (x === y) continue;
      const xNum = parseInt(x, 10);
      const yNum = parseInt(y, 10);
      if (!isNaN(xNum) && !isNaN(yNum)) return xNum - yNum;
      return x < y ? -1 : 1;
    }
    return 0;
  }

  async function listWorkImages(folder) {
    const res = await fetch(folder + 'manifest.json');
    if (!res.ok) throw new Error('Could not load image manifest for ' + folder);
    const files = await res.json();
    return files.slice().sort(naturalCompare);
  }

  const GALLERY_PAGE_SIZE = 8;

  async function initGalleryGrid() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    const folder = grid.dataset.folder;
    const prevBtn = document.getElementById('galleryPrev');
    const nextBtn = document.getElementById('galleryNext');
    const dotsWrap = document.getElementById('galleryDots');

    let files;
    try {
      files = await listWorkImages(folder);
    } catch (err) {
      console.warn('Could not auto-load images from ' + folder + '. This only works when the site is served with directory listing enabled (e.g. a local dev server).', err);
      return;
    }
    if (files.length === 0) return;

    lightboxItems = files.map(function (file) {
      return { src: folder + file, caption: filenameToCaption(file) };
    });

    const pageCount = Math.ceil(files.length / GALLERY_PAGE_SIZE);
    let currentPage = 0;

    function renderPage() {
      const start = currentPage * GALLERY_PAGE_SIZE;
      const pageFiles = files.slice(start, start + GALLERY_PAGE_SIZE);

      grid.innerHTML = pageFiles.map(function (file, i) {
        const src = folder + file;
        const caption = filenameToCaption(file);
        return '<button class="gallery-item" data-index="' + (start + i) + '" data-caption="' + caption + '">' +
          '<img src="' + src + '" alt="' + caption + '">' +
        '</button>';
      }).join('');

      if (dotsWrap) {
        Array.from(dotsWrap.children).forEach(function (dot, i) {
          dot.classList.toggle('active', i === currentPage);
        });
      }
    }

    function goToPage(page) {
      currentPage = (page + pageCount) % pageCount;
      renderPage();
    }

    if (pageCount <= 1) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
    } else {
      if (dotsWrap) {
        dotsWrap.innerHTML = files
          .map(function (_, i) { return i; })
          .filter(function (i) { return i % GALLERY_PAGE_SIZE === 0; })
          .map(function (_, i) { return '<button aria-label="Go to image set ' + (i + 1) + '"></button>'; })
          .join('');
        Array.from(dotsWrap.children).forEach(function (dot, i) {
          dot.addEventListener('click', function () { goToPage(i); });
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', function () { goToPage(currentPage - 1); });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', function () { goToPage(currentPage + 1); });
      }

      // Swipe left/right to change page (touch devices, e.g. mobile where the arrows are hidden)
      let touchStartX = 0;
      let touchStartY = 0;
      grid.addEventListener('touchstart', function (e) {
        const t = e.changedTouches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
      }, { passive: true });
      grid.addEventListener('touchend', function (e) {
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          goToPage(currentPage + (dx < 0 ? 1 : -1));
        }
      }, { passive: true });
    }

    renderPage();
  }

  initGalleryGrid();

  /* ---------- Enquiry form ---------- */
  const form = document.getElementById('enquiryForm');
  const submitBtn = document.getElementById('submitBtn');
  const feedback = document.getElementById('formFeedback');

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;

  const validators = {
    name: function (v) {
      return v.trim().length > 0 ? '' : 'Please enter your name.';
    },
    email: function (v) {
      if (!v.trim()) return 'Please enter your email.';
      return EMAIL_RE.test(v.trim()) ? '' : 'Please enter a valid email address.';
    },
    phone: function (v) {
      if (!v.trim()) return '';
      return PHONE_RE.test(v.trim()) ? '' : 'Please enter a valid phone number.';
    },
    eventType: function (v) {
      return v ? '' : 'Please select an event type.';
    },
    eventDate: function (v) {
      if (!v) return 'Please select an event date.';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chosen = new Date(v + 'T00:00:00');
      return chosen >= today ? '' : 'Please choose today or a future date.';
    },
    message: function (v) {
      return v.trim().length > 0 ? '' : 'Please tell us a little about your event.';
    },
  };

  function showFieldError(field, message) {
    const row = document.getElementById(field).closest('.form-row');
    const errorEl = document.getElementById(field + 'Error');
    row.classList.toggle('invalid', Boolean(message));
    errorEl.textContent = message;
  }

  function validateField(field) {
    const el = document.getElementById(field);
    const message = validators[field](el.value);
    showFieldError(field, message);
    return !message;
  }

  Object.keys(validators).forEach(function (field) {
    const el = document.getElementById(field);
    el.addEventListener('blur', function () { validateField(field); });
  });

  function validateAll() {
    return Object.keys(validators)
      .map(validateField)
      .every(Boolean);
  }

  function setFeedback(message, type) {
    feedback.textContent = message;
    feedback.className = 'form-feedback' + (type ? ' ' + type : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setFeedback('', '');

    // Honeypot: if filled, a bot submitted the form. Pretend success, send nothing.
    const honeypot = document.getElementById('website');
    if (honeypot.value.trim() !== '') {
      form.reset();
      setFeedback('Thank you! Your enquiry has been sent.', 'success');
      return;
    }

    if (!validateAll()) {
      setFeedback('Please fix the errors above and try again.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    emailjs.sendForm(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, form)
      .then(function () {
        setFeedback('Thank you! Your enquiry has been sent — we\'ll be in touch within 24 hours.', 'success');
        form.reset();
      })
      .catch(function () {
        setFeedback('Something went wrong sending your enquiry. Please email reshuchaudhary2@gmail.com directly, or try again.', 'error');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Enquiry';
      });
  });
})();
