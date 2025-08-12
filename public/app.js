const CSV_URL = './content.csv';

/** State */
let allItems = [];
let currentItem = null;
let timerIntervalId = null;
let remainingSeconds = 15 * 60;

/** DOM */
const categorySelect = document.getElementById('categorySelect');
const showBtn = document.getElementById('showBtn');
const randomBtn = document.getElementById('randomBtn');
const issueLabel = document.getElementById('issueLabel');
const quoteText = document.getElementById('quoteText');
const tipText = document.getElementById('tipText');
const videoFrame = document.getElementById('videoFrame');
const videoLink = document.getElementById('videoLink');
const musicSection = document.getElementById('musicSection');
const musicLink = document.getElementById('musicLink');
const contentCard = document.getElementById('contentCard');
const favBtn = document.getElementById('favBtn');
const favoritesList = document.getElementById('favoritesList');
const clearFavsBtn = document.getElementById('clearFavsBtn');
const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimerBtn');
const stopTimerBtn = document.getElementById('stopTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');

init();

async function init() {
  try {
    const csvText = await (await fetch(CSV_URL, { cache: 'no-store' })).text();
    allItems = parseCsv(csvText);
    const categories = Array.from(new Set(allItems.map(i => i.issue))).sort();
    categorySelect.innerHTML = categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

    // Default select first and show content
    if (categories.length > 0) {
      categorySelect.value = categories[0];
      showForSelected();
    }

    attachEvents();
    renderFavorites();
  } catch (err) {
    console.error('Failed to initialize app:', err);
  }
}

function attachEvents() {
  showBtn.addEventListener('click', showForSelected);
  randomBtn.addEventListener('click', () => {
    if (allItems.length === 0) return;
    const categories = Array.from(new Set(allItems.map(i => i.issue)));
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    categorySelect.value = randomCategory;
    showForSelected(true);
  });
  favBtn.addEventListener('click', addCurrentToFavorites);
  clearFavsBtn.addEventListener('click', clearFavorites);

  startTimerBtn.addEventListener('click', startTimer);
  stopTimerBtn.addEventListener('click', stopTimer);
  resetTimerBtn.addEventListener('click', () => { resetTimer(15 * 60); });
}

function showForSelected(isRandom = false) {
  const sel = categorySelect.value;
  const items = allItems.filter(i => i.issue === sel);
  if (items.length === 0) return;
  const item = isRandom ? items[Math.floor(Math.random() * items.length)] : items[0 + Math.floor(Math.random() * items.length)];
  showItem(item);
}

function showItem(item) {
  currentItem = item;
  issueLabel.textContent = item.issue;
  quoteText.textContent = item.quote;
  tipText.textContent = item.tip;

  const embedUrl = toEmbedUrl(item.video_link);
  videoFrame.src = embedUrl;
  videoLink.href = item.video_link;

  if (item.music_link && item.music_link.trim().length > 0) {
    musicSection.hidden = false;
    musicLink.href = item.music_link;
    musicLink.textContent = 'Open music / sound';
  } else {
    musicSection.hidden = true;
    musicLink.removeAttribute('href');
    musicLink.textContent = '';
  }

  contentCard.classList.remove('hidden');
}

function toEmbedUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      // Handle share links like /shorts or /embed already
      if (u.pathname.startsWith('/embed/')) return url;
      if (u.pathname.startsWith('/shorts/')) return `https://www.youtube.com/embed/${u.pathname.split('/').pop()}`;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
  } catch (e) {
    // ignore
  }
  return url;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split(',').map(s => s.trim());
  const rows = lines.map(line => line.split(',').map(s => s.trim()));
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  return rows.map(cols => ({
    issue: cols[idx.issue] || '',
    quote: cols[idx.quote] || '',
    video_link: cols[idx.video_link] || '',
    tip: cols[idx.tip] || '',
    music_link: cols[idx.music_link] || ''
  }));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Favorites */
function getFavorites() {
  const raw = localStorage.getItem('favorites_v1');
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function setFavorites(list) {
  localStorage.setItem('favorites_v1', JSON.stringify(list));
}

function addCurrentToFavorites() {
  if (!currentItem) return;
  const favs = getFavorites();
  favs.unshift({ ...currentItem, savedAt: new Date().toISOString() });
  setFavorites(favs.slice(0, 200));
  renderFavorites();
}

function renderFavorites() {
  const favs = getFavorites();
  if (favs.length === 0) {
    favoritesList.innerHTML = '<p class="alt-link">No favorites yet.</p>';
    return;
  }
  favoritesList.innerHTML = favs.map((f, i) => `
    <div class="favorite-item">
      <div class="meta">${escapeHtml(f.issue)} • ${new Date(f.savedAt).toLocaleString()}</div>
      <div class="quote">${escapeHtml(f.quote)}</div>
      <div class="tip">Tip: ${escapeHtml(f.tip)}</div>
      <div class="fav-actions">
        <a class="btn" href="${escapeHtml(f.video_link)}" target="_blank" rel="noopener noreferrer">Open video</a>
        <button class="btn" data-remove="${i}">Remove</button>
      </div>
    </div>
  `).join('');
  favoritesList.querySelectorAll('button[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-remove'));
      const list = getFavorites();
      list.splice(idx, 1);
      setFavorites(list);
      renderFavorites();
    });
  });
}

function clearFavorites() {
  if (!confirm('Clear all favorites?')) return;
  setFavorites([]);
  renderFavorites();
}

/** Timer */
function startTimer() {
  if (timerIntervalId) return;
  timerIntervalId = setInterval(() => {
    remainingSeconds = Math.max(0, remainingSeconds - 1);
    updateTimerDisplay();
    if (remainingSeconds === 0) {
      stopTimer();
      try { new AudioContext(); } catch {}
      alert('Time is up! Take a deep breath and notice how you feel.');
    }
  }, 1000);
}

function stopTimer() {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function resetTimer(seconds) {
  stopTimer();
  remainingSeconds = seconds;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
  const s = (remainingSeconds % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${m}:${s}`;
}

// Initialize display
updateTimerDisplay();