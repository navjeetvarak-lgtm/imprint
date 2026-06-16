/*  ═══════════════════════════════════════════════════════
    GIGS FIREBASE — IMPRINT
    Handles: Fetch, Render (upcoming + past), Countdown,
    Upload (admin), Real-time sync
    ═══════════════════════════════════════════════════════ */

import {
  db, storage,
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, onSnapshot, serverTimestamp,
  ref, uploadBytes, getDownloadURL
} from './firebase-config.js';

const GIGS_COLLECTION = 'gigs';

/* ─── HELPERS ─── */

function parseGigDateTime(dateStr, timeStr) {
  // dateStr = "2026-07-15", timeStr = "08:30 PM"
  const [year, month, day] = dateStr.split('-').map(Number);
  let hours = 0, minutes = 0;
  if (timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      hours = parseInt(match[1]);
      minutes = parseInt(match[2]);
      const period = (match[3] || '').toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
    }
  }
  return new Date(year, month - 1, day, hours, minutes);
}

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
}

function formatDay(dateStr) {
  return dateStr.split('-')[2];
}

function formatMonthYear(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear().toString().slice(-2);
  return `${month} '${year}`;
}

function isUpcoming(dateStr, timeStr) {
  const eventDate = parseGigDateTime(dateStr, timeStr);
  return eventDate > new Date();
}

/* ─── RENDER UPCOMING GIG CARD ─── */

function renderUpcomingCard(gig, index) {
  const gigDate = parseGigDateTime(gig.date, gig.time);
  const cardId = `countdown-${gig.id}`;
  const delay = index * 0.1;

  return `
    <div class="past-gig-card upcoming-gig-card reveal" style="transition-delay:${delay}s">
      <img src="${gig.image || '../assets/gig1.jpeg'}" alt="${gig.title}" loading="lazy" />
      <div class="past-gig-content">
        <div>
          <div class="past-gig-date-pill">📅 ${formatDisplayDate(gig.date)}</div>
          <h3 class="past-gig-title">${gig.title}</h3>
          <div class="past-gig-meta">
            <span>📅 ${formatDisplayDate(gig.date)}</span>
            <span>🕓 ${gig.time || 'TBA'}</span>
            <span>📍 ${gig.venue || 'TBA'}</span>
          </div>
        </div>
        <div class="upcoming-gig-bottom">
          <div class="upcoming-countdown" id="${cardId}" data-target="${gigDate.getTime()}">
            <div class="cd-mini-box"><span class="cd-mini-num" data-unit="days">00</span><span class="cd-mini-label">DAYS</span></div>
            <div class="cd-mini-box"><span class="cd-mini-num" data-unit="hours">00</span><span class="cd-mini-label">HOURS</span></div>
            <div class="cd-mini-box"><span class="cd-mini-num" data-unit="mins">00</span><span class="cd-mini-label">MINS</span></div>
            <div class="cd-mini-box"><span class="cd-mini-num" data-unit="secs">00</span><span class="cd-mini-label">SECS</span></div>
          </div>
          <a href="${gig.bookingUrl || '#'}" target="_blank" class="upcoming-book-btn">
            BOOK NOW <span>→</span>
          </a>
        </div>
      </div>
    </div>`;
}

/* ─── RENDER PAST GIG CARD ─── */

function renderPastCard(gig, index) {
  const delay = index * 0.1;
  const hoverColors = ['var(--purple)', 'var(--blue)', 'var(--pink)'];
  const hoverColor = hoverColors[index % 3];

  return `
    <div class="past-gig-card reveal" style="transition-delay:${delay}s"
         onmouseover="this.style.borderColor='${hoverColor}'"
         onmouseout="this.style.borderColor='var(--border)'">
      <img src="${gig.image || '../assets/gig1.jpeg'}" alt="${gig.title}" loading="lazy"
           style="filter:grayscale(0.4) brightness(0.8);" />
      <div class="past-gig-content">
        <div>
          <div class="past-gig-date-pill">${formatDisplayDate(gig.date)}</div>
          <h3 class="past-gig-title">${gig.title}</h3>
          <div class="past-gig-meta">
            <span>📅 ${formatDisplayDate(gig.date)}</span>
            <span>🕓 ${gig.time || ''}</span>
            <span>📍 ${gig.venue || ''}</span>
          </div>
        </div>
        <div class="past-gig-badge"><span>✓</span><span>Played</span></div>
      </div>
    </div>`;
}

/* ─── RENDER EVENT-CARD (for index.html) ─── */

function renderIndexUpcomingCard(gig, index) {
  const delay = index * 0.1;
  const day = formatDay(gig.date);
  const monthYear = formatMonthYear(gig.date);
  const bookUrl = gig.bookingUrl || `https://wa.me/919923580022?text=Hi%2C%20RSVP%20for%20${encodeURIComponent(gig.title)}`;

  return `
    <div class="event-card reveal" style="transition-delay:${delay}s">
      <div class="event-date-block">
        <div class="event-day">${day}</div>
        <div class="event-month">${monthYear}</div>
      </div>
      <div class="event-info">
        <h3>${gig.title}</h3>
        <p>${gig.venue || 'TBA'} · ${gig.time || ''}</p>
      </div>
      <a href="${bookUrl}" target="_blank" class="event-tag">RSVP</a>
    </div>`;
}

function renderIndexPastCard(gig, index) {
  const delay = (index + 3) * 0.1;
  const day = formatDay(gig.date);
  const monthYear = formatMonthYear(gig.date);

  return `
    <div class="event-card reveal" style="transition-delay:${delay}s;opacity:0.5;">
      <div class="event-date-block" style="background:rgba(255,255,255,0.04);border-color:var(--border);">
        <div class="event-day" style="background:none;-webkit-text-fill-color:var(--muted);">${day}</div>
        <div class="event-month">${monthYear}</div>
      </div>
      <div class="event-info">
        <h3>${gig.title}</h3>
        <p>${gig.venue || ''}</p>
      </div>
      <span class="event-tag past">Played</span>
    </div>`;
}

/* ─── COUNTDOWN ENGINE ─── */

let countdownInterval = null;

function startCountdowns() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    document.querySelectorAll('.upcoming-countdown').forEach(el => {
      const target = parseInt(el.dataset.target);
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        el.querySelectorAll('.cd-mini-num').forEach(n => n.textContent = '00');
        return;
      }

      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      el.querySelector('[data-unit="days"]').textContent = String(d).padStart(2, '0');
      el.querySelector('[data-unit="hours"]').textContent = String(h).padStart(2, '0');
      el.querySelector('[data-unit="mins"]').textContent = String(m).padStart(2, '0');
      el.querySelector('[data-unit="secs"]').textContent = String(s).padStart(2, '0');
    });
  }, 1000);
}

/* ─── LOAD GIGS — gigs.html (full page) ─── */

function loadGigsPage() {
  const upcomingContainer = document.getElementById('upcomingGigsContainer');
  const pastContainer = document.getElementById('pastGigsContainer');

  if (!upcomingContainer && !pastContainer) return;

  const q = query(collection(db, GIGS_COLLECTION), orderBy('date', 'asc'));

  onSnapshot(q, (snapshot) => {
    const upcoming = [];
    const past = [];

    snapshot.forEach(docSnap => {
      const data = { id: docSnap.id, ...docSnap.data() };
      if (isUpcoming(data.date, data.time)) {
        upcoming.push(data);
      } else {
        past.push(data);
      }
    });

    // Sort: upcoming by date ASC, past by date DESC
    upcoming.sort((a, b) => a.date.localeCompare(b.date));
    past.sort((a, b) => b.date.localeCompare(a.date));

    // Render upcoming
    if (upcomingContainer) {
      if (upcoming.length === 0) {
        upcomingContainer.innerHTML = `
          <p style="text-align:center;font-family:var(--font-mono);font-size:0.8rem;color:var(--muted);letter-spacing:0.15em;padding:40px 0;">
            Stay tuned for upcoming announcements</p>`;
      } else {
        upcomingContainer.innerHTML = upcoming.map((g, i) => renderUpcomingCard(g, i)).join('');
      }
    }

    // Render past
    if (pastContainer) {
      if (past.length === 0) {
        pastContainer.innerHTML = `
          <p style="text-align:center;font-family:var(--font-mono);font-size:0.8rem;color:var(--muted);letter-spacing:0.15em;padding:40px 0;">
            No past events yet</p>`;
      } else {
        pastContainer.innerHTML = past.map((g, i) => renderPastCard(g, i)).join('');
      }
    }

    // Start countdowns for upcoming
    startCountdowns();

    // Re-observe for reveal animations
    reobserveReveals();

    // Update the main page countdown to next event
    if (upcoming.length > 0) {
      updateMainCountdown(upcoming[0]);
    }
  });
}

/* ─── LOAD GIGS — index.html (limited) ─── */

function loadGigsHomepage() {
  const container = document.getElementById('gigsFirebaseContainer');
  if (!container) return;

  const q = query(collection(db, GIGS_COLLECTION), orderBy('date', 'asc'));

  onSnapshot(q, (snapshot) => {
    const upcoming = [];
    const past = [];

    snapshot.forEach(docSnap => {
      const data = { id: docSnap.id, ...docSnap.data() };
      if (isUpcoming(data.date, data.time)) {
        upcoming.push(data);
      } else {
        past.push(data);
      }
    });

    upcoming.sort((a, b) => a.date.localeCompare(b.date));
    past.sort((a, b) => b.date.localeCompare(a.date));

    // Show max 4 upcoming + max 2 past on homepage
    const showUpcoming = upcoming.slice(0, 4);
    const showPast = past.slice(0, 2);

    let html = '';
    html += showUpcoming.map((g, i) => renderIndexUpcomingCard(g, i)).join('');
    html += showPast.map((g, i) => renderIndexPastCard(g, i)).join('');

    if (html === '') {
      html = `<p style="text-align:center;font-family:var(--font-mono);font-size:0.8rem;color:var(--muted);letter-spacing:0.15em;padding:40px 0;">
        No gigs available. Check back soon!</p>`;
    }

    container.innerHTML = html;
    reobserveReveals();
  });
}

/* ─── UPDATE MAIN COUNTDOWN (gigs page header) ─── */

function updateMainCountdown(nextGig) {
  const cdDays = document.getElementById('cdDays');
  if (!cdDays) return;

  const target = parseGigDateTime(nextGig.date, nextGig.time).getTime();

  // Clear existing interval if set by main.js
  if (window._mainCountdownInterval) clearInterval(window._mainCountdownInterval);

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      ['cdDays', 'cdHours', 'cdMins', 'cdSecs'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '00';
      });
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('cdDays').textContent = String(d).padStart(2, '0');
    document.getElementById('cdHours').textContent = String(h).padStart(2, '0');
    document.getElementById('cdMins').textContent = String(m).padStart(2, '0');
    document.getElementById('cdSecs').textContent = String(s).padStart(2, '0');
  }

  tick();
  window._mainCountdownInterval = setInterval(tick, 1000);
}

/* ─── RE-OBSERVE REVEALS ─── */

function reobserveReveals() {
  setTimeout(() => {
    const revealEls = document.querySelectorAll('.reveal:not(.visible)');
    if (revealEls.length > 0) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
      }, { threshold: 0.1 });
      revealEls.forEach(el => observer.observe(el));
    }
  }, 100);
}

/* ─── ADMIN: ADD GIG ─── */

async function addGig(gigData) {
  const docRef = await addDoc(collection(db, GIGS_COLLECTION), {
    ...gigData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

/* ─── ADMIN: UPLOAD IMAGE ─── */

async function uploadGigImage(file) {
  const fileName = `gigs/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, fileName);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return url;
}

/* ─── ADMIN: DELETE GIG ─── */

async function deleteGig(gigId) {
  await deleteDoc(doc(db, GIGS_COLLECTION, gigId));
}

/* ─── ADMIN: GET ALL GIGS ─── */

async function getAllGigs() {
  const q = query(collection(db, GIGS_COLLECTION), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  const gigs = [];
  snapshot.forEach(docSnap => {
    gigs.push({ id: docSnap.id, ...docSnap.data() });
  });
  return gigs;
}

/* ─── INIT ─── */

function initGigsFirebase() {
  // Detect which page we're on
  if (document.getElementById('upcomingGigsContainer') || document.getElementById('pastGigsContainer')) {
    loadGigsPage();
  }
  if (document.getElementById('gigsFirebaseContainer')) {
    loadGigsHomepage();
  }
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGigsFirebase);
} else {
  initGigsFirebase();
}

// Export for admin page
export { addGig, uploadGigImage, deleteGig, getAllGigs, isUpcoming, formatDisplayDate };
