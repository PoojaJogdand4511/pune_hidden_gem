(function() {
  const CSV_URL = 'mental_detox_dataset.csv';
  const SESSION_TOTAL_SECONDS = 15 * 60; // 900
  const PHASE_SECONDS = 5 * 60; // 300 per phase

  // Elements
  const appEl = document.getElementById('app');
  const heroEl = document.getElementById('intro-hero');
  const skipIntroBtn = document.getElementById('skipIntro');

  const issueSelect = document.getElementById('issueSelect');
  const languageSelect = document.getElementById('languageSelect');
  const startBtn = document.getElementById('startBtn');
  const resetBtn = document.getElementById('resetBtn');

  const progressFill = document.getElementById('progressFill');
  const phaseLabel = document.getElementById('phaseLabel');
  const timeRemainingEl = document.getElementById('timeRemaining');

  const phase1El = document.getElementById('phase1');
  const phase2El = document.getElementById('phase2');
  const phase3El = document.getElementById('phase3');
  const emptyEl = document.getElementById('emptyState');

  const videoContainer = document.getElementById('videoContainer');
  const videoSource = document.getElementById('videoSource');
  const videoMore = document.getElementById('videoMore');

  const quoteText = document.getElementById('quoteText');
  const quoteSource = document.getElementById('quoteSource');
  const quoteMore = document.getElementById('quoteMore');

  const tipsList = document.getElementById('tipsList');
  const tipsMore = document.getElementById('tipsMore');

  const anchorImg = document.querySelector('.anchor-img');

  let dataset = [];
  let filtered = [];

  let phaseTimer = null;
  let sessionTicker = null;
  let sessionStart = null;
  let paused = false; // reserved

  let indices = { video: 0, quote: 0, tips: 0 };

  function parseCSV(text) {
    // Robust-ish CSV parser supporting quotes and commas
    const rows = [];
    let current = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];
      if (inQuotes) {
        if (char === '"' && next === '"') { field += '"'; i++; continue; }
        if (char === '"') { inQuotes = false; continue; }
        field += char;
      } else {
        if (char === '"') { inQuotes = true; continue; }
        if (char === ',') { current.push(field.trim()); field = ''; continue; }
        if (char === '\n') { current.push(field.trim()); rows.push(current); current = []; field = ''; continue; }
        if (char === '\r') { continue; }
        field += char;
      }
    }
    if (field.length > 0 || current.length > 0) { current.push(field.trim()); rows.push(current); }
    if (rows.length === 0) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).filter(r => r.length && r.some(v => v && v.trim() !== '')).map(r => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = r[idx] ?? ''; });
      return obj;
    });
  }

  function uniqueValues(items, key) {
    return Array.from(new Set(items.map(it => (it[key] || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }

  function setHidden(el, hidden) { el.classList[hidden ? 'add' : 'remove']('hidden'); }

  function updateLanguageOptions() {
    const issue = issueSelect.value;
    const langs = uniqueValues(dataset.filter(d => d.issue === issue), 'language');
    languageSelect.innerHTML = '';
    langs.forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang; opt.textContent = lang; languageSelect.appendChild(opt);
    });
    languageSelect.disabled = langs.length === 0;
    startBtn.disabled = !(issueSelect.value && languageSelect.value);
  }

  function populateIssues() {
    const issues = uniqueValues(dataset, 'issue');
    issueSelect.innerHTML = '';
    issues.forEach(issue => {
      const opt = document.createElement('option');
      opt.value = issue; opt.textContent = issue; issueSelect.appendChild(opt);
    });
    updateLanguageOptions();
  }

  function filterData() {
    const issue = issueSelect.value;
    const lang = languageSelect.value;
    filtered = dataset.filter(d => (d.issue === issue) && (d.language === lang));
    indices = { video: 0, quote: 0, tips: 0 };
  }

  function getVideoRows() {
    return filtered.filter(r => (r.content_type || '').toLowerCase().includes('video') && (r.links || ''));
  }
  function getQuoteRows() {
    return filtered.filter(r => (r.quote || '').trim() !== '');
  }
  function getTipsRows() {
    return filtered.filter(r => (r.Tips || '').trim() !== '');
  }

  function embedYouTube(url) {
    try {
      const u = new URL(url);
      let videoId = '';
      if (u.hostname.includes('youtube.com')) {
        videoId = u.searchParams.get('v') || '';
      } else if (u.hostname.includes('youtu.be')) {
        videoId = u.pathname.split('/').pop();
      }
      if (!videoId) return null;
      const iframe = document.createElement('iframe');
      iframe.title = 'YouTube video player';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      return iframe;
    } catch { return null; }
  }

  function renderPhase1() {
    const rows = getVideoRows();
    videoContainer.innerHTML = '';
    if (rows.length === 0) {
      videoSource.textContent = 'No source';
      setHidden(phase1El, true);
      return false;
    }
    const row = rows[indices.video % rows.length];
    const frame = embedYouTube(row.links);
    if (!frame) {
      setHidden(phase1El, true); return false;
    }
    videoContainer.appendChild(frame);
    videoSource.textContent = (row.refrence || 'Source');
    setHidden(phase1El, false);
    return true;
  }

  function renderPhase2() {
    const rows = getQuoteRows();
    if (rows.length === 0) { setHidden(phase2El, true); return false; }
    const row = rows[indices.quote % rows.length];
    quoteText.textContent = row.quote;
    quoteSource.textContent = (row.refrence || 'Source');
    setHidden(phase2El, false);
    return true;
  }

  function renderPhase3() {
    const rows = getTipsRows();
    tipsList.innerHTML = '';
    if (rows.length === 0) { setHidden(phase3El, true); return false; }
    const row = rows[indices.tips % rows.length];
    const tipsRaw = row.Tips || '';
    let tips = tipsRaw.split(/[;,]/).map(t => t.trim()).filter(Boolean);
    if (tips.length > 6) tips = tips.slice(0, 6);
    if (tips.length < 3 && rows.length > 1) {
      // if too few tips, try next row as a fallback
      const row2 = rows[(indices.tips + 1) % rows.length];
      tips = tips.concat((row2.Tips || '').split(/[;,]/).map(t => t.trim()).filter(Boolean)).slice(0, 6);
    }
    tips.forEach((tip, idx) => {
      const li = document.createElement('li');
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.id = `tip_${idx}`; cb.name = 'today_tip';
      cb.addEventListener('change', () => {
        // allow only one as "Try today"
        if (cb.checked) {
          tipsList.querySelectorAll('input[type="checkbox"]').forEach(other => { if (other !== cb) other.checked = false; });
        }
      });
      const label = document.createElement('label');
      label.setAttribute('for', cb.id); label.textContent = tip;
      li.appendChild(cb); li.appendChild(label); tipsList.appendChild(li);
    });
    setHidden(phase3El, false);
    return true;
  }

  function renderAllPhases() {
    const ok1 = renderPhase1();
    const ok2 = renderPhase2();
    const ok3 = renderPhase3();
    const hasAny = ok1 || ok2 || ok3;
    setHidden(emptyEl, hasAny);
  }

  function setPhaseVisible(phaseIdx) {
    [phase1El, phase2El, phase3El].forEach((el, idx) => setHidden(el, (idx + 1) !== phaseIdx));
  }

  function formatTimeLeft(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateProgress() {
    if (!sessionStart) return;
    const elapsed = Math.min((Date.now() - sessionStart) / 1000, SESSION_TOTAL_SECONDS);
    const remaining = Math.max(0, Math.ceil(SESSION_TOTAL_SECONDS - elapsed));
    timeRemainingEl.textContent = formatTimeLeft(remaining);
    const pct = (elapsed / SESSION_TOTAL_SECONDS) * 100;
    progressFill.style.width = `${pct}%`;

    // Phase transitions
    if (elapsed < PHASE_SECONDS) {
      phaseLabel.textContent = 'Phase 1 · Watch / Listen';
      setPhaseVisible(1);
    } else if (elapsed < PHASE_SECONDS * 2) {
      phaseLabel.textContent = 'Phase 2 · Reflect';
      setPhaseVisible(2);
    } else {
      phaseLabel.textContent = 'Phase 3 · Apply';
      setPhaseVisible(3);
    }

    if (elapsed >= SESSION_TOTAL_SECONDS) {
      clearInterval(sessionTicker); sessionTicker = null;
      startBtn.disabled = false; resetBtn.disabled = false;
      phaseLabel.textContent = 'Complete · Great job';
    }
  }

  function startSession() {
    sessionStart = Date.now();
    updateProgress();
    if (sessionTicker) clearInterval(sessionTicker);
    sessionTicker = setInterval(updateProgress, 1000);
    startBtn.disabled = true; resetBtn.disabled = false;
  }

  function resetSession() {
    if (sessionTicker) { clearInterval(sessionTicker); sessionTicker = null; }
    sessionStart = null;
    progressFill.style.width = '0%';
    timeRemainingEl.textContent = '15:00';
    phaseLabel.textContent = 'Ready';
    setPhaseVisible(1);
    startBtn.disabled = !(issueSelect.value && languageSelect.value);
    resetBtn.disabled = true;
  }

  function showApp() {
    setHidden(heroEl, true);
    setHidden(appEl, false);
  }

  function initHero() {
    // If reduced motion is preferred, shorten intro
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const timeout = media.matches ? 1200 : 4200; // match CSS timing
    const tid = setTimeout(showApp, timeout);
    skipIntroBtn.addEventListener('click', () => { clearTimeout(tid); showApp(); });
  }

  function enableParallax() {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return;
    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const delta = (y - lastY) * 0.02;
      lastY = y;
      const clamped = Math.max(-10, Math.min(10, (y * 0.04)));
      anchorImg.style.transform = `translateY(${clamped}px)`;
    }, { passive: true });
  }

  function wireEvents() {
    issueSelect.addEventListener('change', () => { updateLanguageOptions(); filterData(); renderAllPhases(); startBtn.disabled = !(issueSelect.value && languageSelect.value); });
    languageSelect.addEventListener('change', () => { filterData(); renderAllPhases(); startBtn.disabled = !(issueSelect.value && languageSelect.value); });

    startBtn.addEventListener('click', () => { if (filtered.length === 0) return; startSession(); });
    resetBtn.addEventListener('click', resetSession);

    videoMore.addEventListener('click', () => { indices.video++; renderPhase1(); });
    quoteMore.addEventListener('click', () => { indices.quote++; renderPhase2(); });
    tipsMore.addEventListener('click', () => { indices.tips++; renderPhase3(); });
  }

  async function loadData() {
    try {
      const res = await fetch(CSV_URL, { cache: 'no-store' });
      const txt = await res.text();
      dataset = parseCSV(txt);
      populateIssues();
      filterData();
      renderAllPhases();
      startBtn.disabled = !(issueSelect.value && languageSelect.value);
    } catch (e) {
      console.error('Failed to load CSV', e);
      dataset = [];
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHero();
    enableParallax();
    wireEvents();
    loadData();
  });
})();