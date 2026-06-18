/* ──────────────────────────────────────────────
   IMPRINT — Express Backend Server
   ────────────────────────────────────────────── */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'gigs.json');

/* ── Middleware ── */
app.use(cors());
app.use(express.json({ limit: '10mb' }));

/* ── Basic Auth Middleware for Admin ── */
function basicAuthMiddleware(req, res, next) {
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  if (login === 'admin' && password === '123') {
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
  res.status(401).send('Authentication required.');
}

/* ── Static File Serving ──
   Serve the existing site structure so all relative
   paths (../css/, ../assets/, ../js/) continue to work. */
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/admin', basicAuthMiddleware, express.static(path.join(__dirname, 'public', 'admin')));
app.use(express.static(path.join(__dirname, 'html')));

/* ── Helper: Read gigs from JSON file ── */
function readGigs() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Create the file with an empty array if it doesn't exist
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
      return [];
    }
    throw err;
  }
}

/* ── Helper: Write gigs to JSON file ── */
function writeGigs(gigs) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(gigs, null, 2), 'utf-8');
}

/* ── Helper: Validate gig fields ── */
function validateGig(body, isUpdate = false) {
  const errors = [];
  const { title, description, category, date } = body;

  if (!isUpdate || body.hasOwnProperty('title')) {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Title is required and must be a non-empty string.');
    } else if (title.trim().length > 200) {
      errors.push('Title must be 200 characters or fewer.');
    }
  }

  if (!isUpdate || body.hasOwnProperty('description')) {
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      errors.push('Description is required and must be a non-empty string.');
    } else if (description.trim().length > 1000) {
      errors.push('Description must be 1000 characters or fewer.');
    }
  }

  if (!isUpdate || body.hasOwnProperty('category')) {
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      errors.push('Category is required and must be a non-empty string.');
    }
  }

  if (!isUpdate || body.hasOwnProperty('date')) {
    if (!date || typeof date !== 'string' || date.trim().length === 0) {
      errors.push('Date is required.');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date) && !isUpdate) {
      errors.push('Date must be in YYYY-MM-DD format.');
    }
  }

  if (body.hasOwnProperty('imageUrl') && body.imageUrl) {
    if (typeof body.imageUrl !== 'string') {
      errors.push('Image URL must be a string.');
    }
  }

  return errors;
}

/* ══════════════════════════════════════════════
   API ROUTES
   ══════════════════════════════════════════════ */

/* ── POST /api/upload ── */
app.post('/api/upload', basicAuthMiddleware, (req, res) => {
  try {
    const { filename, data } = req.body;
    if (!filename || !data) return res.status(400).json({ success: false, error: 'Missing file data' });

    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Invalid base64 encoding' });
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    const safeFilename = Date.now() + '-' + filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filepath = path.join(__dirname, 'assets', safeFilename);

    fs.writeFileSync(filepath, imageBuffer);

    res.json({ success: true, url: '../assets/' + safeFilename });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
});

/* ── GET /api/gigs ── */
app.get('/api/gigs', (req, res) => {
  try {
    const gigs = readGigs();
    // Sort by date descending (newest first)
    gigs.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, data: gigs });
  } catch (err) {
    console.error('Error reading gigs:', err);
    res.status(500).json({ success: false, error: 'Failed to load gigs.' });
  }
});

/* ── POST /api/gigs ── */
app.post('/api/gigs', basicAuthMiddleware, (req, res) => {
  try {
    const errors = validateGig(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const gigs = readGigs();
    const newGig = {
      id: uuidv4(),
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      category: req.body.category.trim(),
      date: req.body.date.trim(),
      datePill: req.body.datePill ? req.body.datePill.trim() : formatDatePill(req.body.date.trim()),
      time: req.body.time ? req.body.time.trim() : '',
      location: req.body.location ? req.body.location.trim() : '',
      imageUrl: req.body.imageUrl ? req.body.imageUrl.trim() : '',
      status: req.body.status || 'upcoming'
    };

    gigs.push(newGig);
    writeGigs(gigs);

    res.status(201).json({ success: true, data: newGig });
  } catch (err) {
    console.error('Error creating gig:', err);
    res.status(500).json({ success: false, error: 'Failed to create gig.' });
  }
});

/* ── PUT /api/gigs/:id ── */
app.put('/api/gigs/:id', basicAuthMiddleware, (req, res) => {
  try {
    const errors = validateGig(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const gigs = readGigs();
    const idx = gigs.findIndex(g => g.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Gig not found.' });
    }

    // Update only provided fields
    const updatable = ['title', 'description', 'category', 'date', 'datePill', 'time', 'location', 'imageUrl', 'status'];
    updatable.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        gigs[idx][field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      }
    });

    // Auto-update datePill if date changed but datePill wasn't provided
    if (req.body.hasOwnProperty('date') && !req.body.hasOwnProperty('datePill')) {
      gigs[idx].datePill = formatDatePill(gigs[idx].date);
    }

    writeGigs(gigs);
    res.json({ success: true, data: gigs[idx] });
  } catch (err) {
    console.error('Error updating gig:', err);
    res.status(500).json({ success: false, error: 'Failed to update gig.' });
  }
});

/* ── DELETE /api/gigs/:id ── */
app.delete('/api/gigs/:id', basicAuthMiddleware, (req, res) => {
  try {
    let gigs = readGigs();
    const idx = gigs.findIndex(g => g.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Gig not found.' });
    }

    const deleted = gigs.splice(idx, 1)[0];
    writeGigs(gigs);
    res.json({ success: true, data: deleted });
  } catch (err) {
    console.error('Error deleting gig:', err);
    res.status(500).json({ success: false, error: 'Failed to delete gig.' });
  }
});

/* ── Helper: Format date string to a readable pill ── */
function formatDatePill(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

/* ── Start Server ── */
app.listen(PORT, () => {
  console.log(`\n  ⚡ IMPRINT server running at http://localhost:${PORT}`);
  console.log(`  📋 Admin panel:  http://localhost:${PORT}/admin/`);
  console.log(`  🎵 Gigs page:    http://localhost:${PORT}/gigs.html`);
  console.log(`  🔗 API endpoint: http://localhost:${PORT}/api/gigs\n`);
});
