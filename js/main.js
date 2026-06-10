/* IMPRINT — main.js — Refactored */

document.addEventListener('DOMContentLoaded', () => {
  initSharedComponents();
  initPageSpecifics();
});

function initSharedComponents() {
  /* ── CUSTOM CURSOR ── */
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia("(pointer: coarse)").matches;
  
  if (isTouchDevice) {
    // Hide custom cursor on mobile/touch devices
    if (dot) dot.style.display = 'none';
    if (ring) ring.style.display = 'none';
  } else if (dot && ring) {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    
    // Override CSS transitions to remove 'transform' delay (since we calculate smoothness in JS)
    dot.style.transition = 'width 0.2s, height 0.2s, background-color 0.2s';
    ring.style.transition = 'width 0.3s, height 0.3s, border-color 0.3s';
    
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    function animateCursor() {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      // Hardware accelerated translation
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  }

  /* ── BACKGROUND CANVAS ── */
  const canvas = document.getElementById('bgCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', () => { resize(); createParticles(); });
    function createParticles() {
      particles = [];
      const n = Math.floor(W * H / 12000);
      for (let i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.3,
          vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
          alpha: Math.random() * 0.6 + 0.1, hue: Math.random() < 0.5 ? 260 : 200
        });
      }
    }
    createParticles();
    function drawCanvas() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},80%,70%,${p.alpha})`; ctx.fill();
      });
      // Lines connecting particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(260,80%,70%,${0.06 * (1 - dist / 120)})`; ctx.stroke();
          }
        }
      }
      requestAnimationFrame(drawCanvas);
    }
    drawCanvas();
  }

  /* ── NAVBAR & SCROLL ── */
  const nav = document.getElementById('nav');
  const scrollProgress = document.getElementById('scrollProgress');
  const backToTop = document.getElementById('backToTop');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
      if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 400);
      if (scrollProgress) {
        const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        scrollProgress.style.width = pct + '%';
      }
    });
  }

  /* ── HAMBURGER ── */
  const ham = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (ham && navLinks) {
    ham.addEventListener('click', () => { ham.classList.toggle('open'); navLinks.classList.toggle('open'); });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { ham.classList.remove('open'); navLinks.classList.remove('open'); }));
  }

  /* ── SCROLL REVEAL ── */
  const revealEls = document.querySelectorAll('.reveal,.reveal-left,.reveal-right');
  if (revealEls.length > 0) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    revealEls.forEach(el => observer.observe(el));
  }

  /* ── COUNTERS ── */
  const counters = document.querySelectorAll('.stat-num, .stat-num-big');
  if (counters.length > 0) {
    const counterObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target, target = parseInt(el.dataset.target); let count = 0;
          const step = Math.ceil(target / 60);
          const timer = setInterval(() => {
            count = Math.min(count + step, target); el.textContent = count;
            if (count >= target) clearInterval(timer);
          }, 30);
          counterObs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObs.observe(c));
  }
}

function initPageSpecifics() {
  /* ── INDEX ── */
  if (document.getElementById('heroBgVideo')) {
    /* Mute Toggle */
    window.toggleMute = function () {
      const video = document.getElementById('heroBgVideo');
      const btn = document.getElementById('unmuteBtn');
      video.muted = !video.muted;
      btn.classList.toggle('muted', video.muted);
    };

    /* Mixcloud Loader */
    window.loadMix = function (title, sub, feedSlug) {
      document.getElementById('mcPlayerTitle').textContent = title;
      document.getElementById('mcPlayerSub').textContent = sub;
      document.getElementById('mcPlayer').innerHTML = `<iframe width="100%" height="120" src="https://www.mixcloud.com/widget/iframe/?hide_cover=1&autoplay=1&feed=%2F${feedSlug}%2F" frameborder="0" allow="autoplay"></iframe>`;
      document.querySelectorAll('.track-item').forEach(t => { t.style.borderColor = ''; t.style.boxShadow = ''; });
      event.currentTarget.style.borderColor = '#7B52FF';
      event.currentTarget.style.boxShadow = '0 0 20px rgba(123,82,255,0.4)';
    };

    /* Load Handler - optimized speeds */
    window.addEventListener('load', () => {
      // Hides loader almost instantly 
      setTimeout(() => document.getElementById('loader')?.classList.add('hidden'), 300);

      // Animations follow swiftly 
      setTimeout(() => {
        document.getElementById('heroBgVideo')?.classList.add('dimmed');
        document.getElementById('heroOverlay')?.classList.add('visible');
      }, 500);
      setTimeout(() => document.getElementById('unmuteBtn')?.classList.add('visible'), 800);
      setTimeout(() => {
        document.getElementById('heroContent')?.classList.add('visible');
        startTyping();
      }, 1000);
      setTimeout(() => document.getElementById('heroViz')?.classList.add('visible'), 1400);
      setTimeout(() => document.getElementById('scrollCue')?.classList.add('visible'), 1800);
    });

    /* Typing Effect */
    const phrases = ["Creative Director Flashlab Creative.", "Founder Strobe Nightlife.", "Crafting sonic journeys since 2013.", "Sunset stories. Peak-hour rooms.", "Goa's nightlife architect."];
    let pi = 0, ci = 0, deleting = false;
    const typedEl = document.getElementById('typed');
    function startTyping() { type(); }
    function type() {
      if (!typedEl) return;
      const phrase = phrases[pi];
      if (!deleting) {
        typedEl.innerHTML = phrase.slice(0, ci + 1) + '<span class="cursor">|</span>'; ci++;
        if (ci === phrase.length) { deleting = true; setTimeout(type, 1800); return; }
      } else {
        typedEl.innerHTML = phrase.slice(0, ci - 1) + '<span class="cursor">|</span>'; ci--;
        if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
      }
      setTimeout(type, deleting ? 40 : 80);
    }

    /* Floaters */
    const floaters = document.getElementById('floaters');
    if (floaters) {
      const icons = ['♪', '♫', '♩', '♬', '◎', '◉', '⊕'];
      for (let i = 0; i < 18; i++) {
        const el = document.createElement('span'); el.className = 'floater';
        el.textContent = icons[Math.floor(Math.random() * icons.length)];
        el.style.cssText = `left:${Math.random() * 100}%;animation-duration:${Math.random() * 20 + 15}s;animation-delay:${Math.random() * 15}s;font-size:${Math.random() * 1.5 + 0.8}rem;`;
        floaters.appendChild(el);
      }
    }

    /* Booking Form (Index) */
    const bookForm = document.getElementById('bookForm');
    if (bookForm && !document.querySelector('.page-hero-bg')) { // not booking page
      bookForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('f-name').value;
        const email = document.getElementById('f-email').value;
        const evt = document.getElementById('f-event').value;
        const date = document.getElementById('f-date').value;
        const phone = document.getElementById('f-phone').value;
        const msg = document.getElementById('f-msg').value;
        const waText = encodeURIComponent(`Hi Imprints! 👋\n\nBooking Enquiry:\n\nName: ${name}\nEmail: ${email}\nEvent/Venue: ${evt}\nDate: ${date}\nPhone: ${phone}\n\nMessage: ${msg}`);
        window.open(`https://wa.me/919923580022?text=${waText}`, '_blank');
        document.getElementById('formMsg').textContent = '✓ Opening WhatsApp...';
      });
    }
  }

  /* ── ABOUT ── */
  // Inherits shared logic

  /* ── BOOKING ── */
  const pageBookForm = document.getElementById('bookForm');
  if (pageBookForm && document.querySelector('.page-hero-bg')) {
    pageBookForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('f-name').value.trim();
      const email = document.getElementById('f-email').value.trim();
      const phone = document.getElementById('f-phone').value.trim();
      const event = document.getElementById('f-event').value.trim();
      const date = document.getElementById('f-date').value;
      const type = document.getElementById('f-type').value;
      const location = document.getElementById('f-location').value.trim();
      const msg = document.getElementById('f-msg').value.trim();
      if (!name || !email) { document.getElementById('formMsg').textContent = '⚠ Please fill in your name and email.'; return; }
      const waText = encodeURIComponent(
        `Hi Imprints! 👋\n\n📋 *Booking Request*\n\n👤 Name: ${name}\n📧 Email: ${email}\n📱 Phone: ${phone || '—'}\n🎪 Event/Venue: ${event || '—'}\n📅 Date: ${date || '—'}\n🎵 Type: ${type || '—'}\n📍 Location: ${location || '—'}\n\n💬 Message:\n${msg || '—'}`
      );
      window.open(`https://wa.me/919923580022?text=${waText}`, '_blank');
      document.getElementById('formMsg').style.color = 'var(--blue)';
      document.getElementById('formMsg').textContent = '✓ Opening WhatsApp with your request…';
      setTimeout(() => document.getElementById('formMsg').textContent = '', 5000);
    });

    window.toggleFaq = function (el) {
      const item = el.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    };
  }

  /* ── GIGS ── */
  if (document.getElementById('tabUpcoming')) {
    window.switchTab = function (tab) {
      const up = document.getElementById('upcomingTab'), pa = document.getElementById('pastTab');
      const btnUp = document.getElementById('tabUpcoming'), btnPa = document.getElementById('tabPast');
      if (tab === 'upcoming') { up.style.display = 'block'; pa.style.display = 'none'; btnUp.classList.add('active'); btnPa.classList.remove('active'); }
      else { up.style.display = 'none'; pa.style.display = 'block'; btnPa.classList.add('active'); btnUp.classList.remove('active'); }
    };

    const eventDate = new Date('2026-12-31T23:59:59'); // Update event date
    function updateCountdown() {
      const cdDays = document.getElementById('cdDays');
      if (!cdDays) return;
      const now = new Date(), diff = eventDate - now;
      if (diff <= 0) { ['Days', 'Hours', 'Mins', 'Secs'].forEach(u => { const el = document.getElementById('cd' + u); if (el) el.textContent = '00'; }); return; }
      const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
      cdDays.textContent = String(d).padStart(2, '0'); document.getElementById('cdHours').textContent = String(h).padStart(2, '0'); document.getElementById('cdMins').textContent = String(m).padStart(2, '0'); document.getElementById('cdSecs').textContent = String(s).padStart(2, '0');
    }
    updateCountdown(); setInterval(updateCountdown, 1000);
  }

  /* ── MUSIC ── */
  if (document.getElementById('mcViz')) {
    const mcApiScript = document.createElement('script'); mcApiScript.src = 'https://widget.mixcloud.com/media/js/widgetApi.js'; document.head.appendChild(mcApiScript);
    let mcWidget = null, mcVizInterval = null, mcIsPlaying = false, mcDuration = 0;

    const mcViz = document.getElementById('mcViz');
    for (let i = 0; i < 50; i++) { const b = document.createElement('div'); b.className = 'mc-viz-bar'; mcViz.appendChild(b); }
    function animateMcBars() { mcViz.querySelectorAll('.mc-viz-bar').forEach(b => { b.style.height = (Math.random() * 56 + 4) + 'px'; }); }
    function startViz() { if (mcVizInterval) clearInterval(mcVizInterval); mcVizInterval = setInterval(animateMcBars, 120); mcViz.classList.add('active'); document.getElementById('mcDisc').classList.add('mc-spinning'); }
    function stopViz() { if (mcVizInterval) { clearInterval(mcVizInterval); mcVizInterval = null; } mcViz.querySelectorAll('.mc-viz-bar').forEach(b => b.style.height = '4px'); mcViz.classList.remove('active'); document.getElementById('mcDisc').classList.remove('mc-spinning'); }
    window.updatePlayBtn = function () { const btn = document.getElementById('mcPlayBtn'); if (btn) btn.textContent = mcIsPlaying ? '⏸' : '▶'; }

    window.playMcTrack = function (title, sub, slug, num) {
      document.getElementById('mcTitle').textContent = title;
      document.getElementById('mcSub').textContent = sub;
      const area = document.getElementById('mcEmbedArea');
      area.style.display = 'block';
      area.innerHTML = `<iframe id="mcIframe" width="100%" height="60" src="https://www.mixcloud.com/widget/iframe/?hide_cover=1&autoplay=1&feed=%2F${slug}%2F" frameborder="0" allow="autoplay"></iframe>`;
      setTimeout(() => {
        const iframe = document.getElementById('mcIframe');
        if (window.Mixcloud) {
          mcWidget = Mixcloud.PlayerWidget(iframe);
          mcWidget.ready.then(() => {
            mcWidget.events.progress.on((pos, dur) => {
              mcDuration = dur;
              const pct = dur > 0 ? (pos / dur) * 100 : 0;
              document.getElementById('mcFill').style.width = pct + '%';
              const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
              document.getElementById('mcTimeNow').textContent = fmt(pos);
              document.getElementById('mcTimeDur').textContent = fmt(dur);
            });
            mcWidget.events.play.on(() => { mcIsPlaying = true; startViz(); window.updatePlayBtn(); });
            mcWidget.events.pause.on(() => { mcIsPlaying = false; stopViz(); window.updatePlayBtn(); });
            mcWidget.events.ended.on(() => { mcIsPlaying = false; stopViz(); window.updatePlayBtn(); });
          });
        }
      }, 1500);
      [1, 2, 3].forEach(n => { const t = document.getElementById('mcT' + n); if (t) t.classList.remove('active'); });
      const active = document.getElementById('mcT' + num); if (active) active.classList.add('active');
      startViz();
    };
    window.mcTogglePlay = function () { if (!mcWidget) return; mcWidget.togglePlay().then(() => { mcIsPlaying = !mcIsPlaying; window.updatePlayBtn(); if (mcIsPlaying) startViz(); else stopViz(); }); };
    window.mcSeek = function (e) { if (!mcWidget || mcDuration === 0) return; const bar = document.getElementById('mcSeekBar'); const rect = bar.getBoundingClientRect(); const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); mcWidget.seek(pct * mcDuration); };

    let currentTrack = null;
    window.selectTrack = function (row, name, sub, url) {
      if (currentTrack) currentTrack.classList.remove('playing');
      row.classList.add('playing');
      currentTrack = row;
      window.open(url, '_blank');
    };
  }

  /* ── SHOWCASE ── */
  if (document.getElementById('carousel3d')) {
    const carousel = document.getElementById('carousel3d');
    const carouselImages = ['../assets/hero2.jpeg', '../assets/hero6.jpeg', '../assets/hero3.jpeg', '../assets/hero7.jpeg', '../assets/hero8.jpeg', '../assets/hero9.jpeg', '../assets/dj2.jpeg'];
    const count = carouselImages.length;
    const angleStep = 360 / count;
    const radius = 420;
    carouselImages.forEach((src, i) => {
      const item = document.createElement('div'); item.className = 'c-item';
      const img = document.createElement('img'); img.src = src; img.alt = 'Showcase'; img.loading = 'lazy';
      item.appendChild(img);
      item.style.transform = `rotateY(${angleStep * i}deg) translateZ(${radius}px)`;
      carousel.appendChild(item);
    });
    let isDragging = false, startX = 0, currentAngle = 0, dragAngle = 0;
    carousel.addEventListener('mousedown', e => { isDragging = true; startX = e.clientX; carousel.classList.add('paused'); carousel.style.animation = 'none'; });
    document.addEventListener('mousemove', e => { if (!isDragging) return; dragAngle = (e.clientX - startX) * 0.4; carousel.style.transform = `rotateY(${currentAngle + dragAngle}deg)`; });
    document.addEventListener('mouseup', () => { if (!isDragging) return; isDragging = false; currentAngle += dragAngle; dragAngle = 0; carousel.style.animation = ''; carousel.classList.remove('paused'); });
    carousel.addEventListener('mouseenter', () => { if (!isDragging) carousel.classList.add('paused'); });
    carousel.addEventListener('mouseleave', () => { if (!isDragging) carousel.classList.remove('paused'); });

    const lightbox = document.getElementById('lightbox'), lbImg = document.getElementById('lbImg');
    const galleryItems = Array.from(document.querySelectorAll('.m-item[data-src]'));
    let currentLbIdx = 0;
    window.openLightbox = function (idx) { currentLbIdx = idx; lbImg.src = galleryItems[idx].dataset.src; lightbox.classList.add('open'); updateLbCounter(); };
    function updateLbCounter() { document.getElementById('lbCounter').textContent = (currentLbIdx + 1) + ' / ' + galleryItems.length; }
    galleryItems.forEach((item, i) => { item.addEventListener('click', () => window.openLightbox(i)); });
    document.getElementById('lbClose').addEventListener('click', () => lightbox.classList.remove('open'));
    document.getElementById('lbPrev').addEventListener('click', () => { currentLbIdx = (currentLbIdx - 1 + galleryItems.length) % galleryItems.length; lbImg.src = galleryItems[currentLbIdx].dataset.src; updateLbCounter(); });
    document.getElementById('lbNext').addEventListener('click', () => { currentLbIdx = (currentLbIdx + 1) % galleryItems.length; lbImg.src = galleryItems[currentLbIdx].dataset.src; updateLbCounter(); });
    lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('open'); });
    document.addEventListener('keydown', e => { if (!lightbox.classList.contains('open')) return; if (e.key === 'ArrowLeft') document.getElementById('lbPrev').click(); if (e.key === 'ArrowRight') document.getElementById('lbNext').click(); if (e.key === 'Escape') lightbox.classList.remove('open'); });

    const strip = document.getElementById('photoStrip');
    if (strip) {
      let isDown = false, startXS = 0, scrollLeft = 0;
      strip.addEventListener('mousedown', e => { isDown = true; startXS = e.pageX - strip.offsetLeft; scrollLeft = strip.scrollLeft; strip.style.cursor = 'grabbing'; });
      strip.addEventListener('mouseleave', () => { isDown = false; strip.style.cursor = 'grab'; });
      strip.addEventListener('mouseup', () => { isDown = false; strip.style.cursor = 'grab'; });
      strip.addEventListener('mousemove', e => { if (!isDown) return; e.preventDefault(); const x = e.pageX - strip.offsetLeft; const walk = (x - startXS) * 2; strip.scrollLeft = scrollLeft - walk; });
      strip.style.cursor = 'grab';
    }
  }

  /* ── VENUES ── */
  if (document.querySelector('.venue-card')) {
    window.filterVenues = function (type, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.venue-card').forEach(card => {
        if (type === 'all' || card.dataset.type === type) { card.style.display = ''; setTimeout(() => { card.style.opacity = '1'; card.style.transform = ''; }, 10); }
        else { card.style.opacity = '0'; card.style.transform = 'scale(0.9)'; setTimeout(() => { card.style.display = 'none'; }, 300); }
      });
    };
  }

  /* ── HERO VIZ (Shared logic for hero bars where they exist) ── */
  const heroViz = document.getElementById('heroViz');
  if (heroViz && heroViz.children.length === 0) {
    for (let i = 0; i < 60; i++) {
      const bar = document.createElement('div'); bar.className = 'hv-bar';
      bar.style.cssText = `animation-duration:${(Math.random() * 0.6 + 0.3).toFixed(2)}s;animation-delay:${(Math.random() * 0.5).toFixed(2)}s;`;
      heroViz.appendChild(bar);
    }
  }
}
