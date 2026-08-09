(() => {
  // ─── Mobile menu ───────────────────────────────────────────
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ─── Active nav link ───────────────────────────────────────
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const navLinks = document.querySelectorAll('.site-nav a, .mobile-nav a');

  navLinks.forEach(link => {
    const href = new URL(link.href).pathname.replace(/\/$/, '') || '/';
    if (href === path || (path === '/' && href.endsWith('index.html'))) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  // ─── Lightbox ──────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Imagem ampliada');
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="Fechar">✕</button>
    <img src="" alt="" />
  `;
  document.body.appendChild(overlay);

  const overlayImg = overlay.querySelector('img');
  const closeBtn = overlay.querySelector('.lightbox-close');

  function openLightbox(src, alt) {
    overlayImg.src = src;
    overlayImg.alt = alt || '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeLightbox() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    overlayImg.src = '';
  }

  document.addEventListener('click', e => {
    const item = e.target.closest('.gallery-item');
    if (item) {
      const img = item.querySelector('img');
      openLightbox(img ? img.src : item.dataset.src, img ? img.alt : '');
    }
  });

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeLightbox(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeLightbox();
  });
})();
