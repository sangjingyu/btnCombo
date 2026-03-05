import { supabaseClient } from './supabase-config.js';
import { HopeAnimator } from './animations.js';

// ===== Auth check =====
let currentUser = null;
let isDemo = false;

async function getUser() {
  const demo = sessionStorage.getItem('hope_demo_user');
  if (demo) {
    isDemo = true;
    return JSON.parse(demo);
  }
  if (!supabaseClient) return null;
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.user || null;
}

// ===== State =====
let todayCount = 0;
let level = 1;
const CLICKS_PER_LEVEL = 50;

// Load messages
let messages = { hope_messages: [], level_messages: {} };
fetch('data/messages.json')
  .then(r => r.json())
  .then(d => { messages = d; });

// ===== DOM =====
const comboCount = document.getElementById('combo-count');
const levelBadge = document.getElementById('level-badge');
const hopeBtn = document.getElementById('hope-button');
const statsBtn = document.getElementById('stats-btn');
const settingsBtn = document.getElementById('settings-btn');
const progressBar = document.getElementById('progress-bar');
const progressRemain = document.getElementById('progress-remain');
const msgOverlay = document.getElementById('message-overlay');
const levelAnnounce = document.getElementById('level-announce');
const settingsModal = document.getElementById('settings-modal');
const settingsClose = document.getElementById('settings-close');
const logoutBtn = document.getElementById('logout-btn');
const userNameEl = document.getElementById('settings-user-name');
const userEmailEl = document.getElementById('settings-user-email');
const demoBadgeEl = document.getElementById('settings-demo-badge');

// ===== Canvas setup =====
const canvas = document.getElementById('main-canvas');
const animator = new HopeAnimator(canvas);

function resizeCanvas() {
  animator.W = canvas.offsetWidth;
  animator.H = canvas.offsetHeight;
  canvas.width = canvas.offsetWidth * devicePixelRatio;
  canvas.height = canvas.offsetHeight * devicePixelRatio;
  animator.ctx.scale(devicePixelRatio, devicePixelRatio);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
animator.start();

// ===== Load today count (demo: in-memory only) =====
async function loadTodayCount() {
  const today = new Date().toISOString().split('T')[0];
  if (isDemo || !supabaseClient || !currentUser) {
    todayCount = 0;
  } else {
    const { data } = await supabaseClient
      .from('button_clicks').select('id', { count: 'exact' })
      .eq('user_id', currentUser.id)
      .gte('clicked_at', today + 'T00:00:00')
      .lte('clicked_at', today + 'T23:59:59');
    todayCount = data?.length || 0;
  }
  updateUI();
}

async function saveClick() {
  if (isDemo || !supabaseClient || !currentUser) return;
  await supabaseClient.from('button_clicks').insert({
    user_id: currentUser.id,
    clicked_at: new Date().toISOString()
  });
}

// ===== UI update =====
function updateUI() {
  comboCount.textContent = todayCount;
  const newLevel = Math.min(10, Math.floor(todayCount / CLICKS_PER_LEVEL) + 1);
  const inLevelProgress = todayCount % CLICKS_PER_LEVEL;
  const progressPct = (inLevelProgress / CLICKS_PER_LEVEL) * 100;
  progressBar.style.setProperty('--progress', progressPct + '%');
  progressRemain.textContent = CLICKS_PER_LEVEL - inLevelProgress;
  levelBadge.textContent = 'LV.' + newLevel;
  animator.setLevel(newLevel, inLevelProgress / CLICKS_PER_LEVEL);
  if (newLevel !== level) { level = newLevel; showLevelUp(); }
}

function showLevelUp() {
  const msg = messages.level_messages?.[level] || '레벨 ' + level + ' 달성!';
  levelAnnounce.innerHTML = '<div class="lv-num">✨ LEVEL ' + level + ' ✨</div><div class="lv-msg">' + msg + '</div>';
  levelAnnounce.classList.add('show');
  setTimeout(() => levelAnnounce.classList.remove('show'), 3000);
}

let msgTimeout, msgIndex = 0;
function showMessage() {
  const msgs = messages.hope_messages || [];
  if (!msgs.length) return;
  msgOverlay.textContent = msgs[msgIndex++ % msgs.length];
  msgOverlay.classList.add('show');
  clearTimeout(msgTimeout);
  msgTimeout = setTimeout(() => msgOverlay.classList.remove('show'), 2000);
}

function spawnFloatText(x, y) {
  const texts = ['+1', '💛', '✨', '희망', '+희망'];
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = texts[Math.floor(Math.random() * texts.length)];
  el.style.left = (x - 15) + 'px';
  el.style.top = (y - 20) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

function spawnRipple(x, y) {
  const el = document.createElement('div');
  el.className = 'ripple';
  el.style.cssText = 'width:60px;height:60px;left:' + (x - 30) + 'px;top:' + (y - 30) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

function vibrate(pattern) { if ('vibrate' in navigator) navigator.vibrate(pattern); }

let clickQueue = 0, saveTimeout;

async function handleClick() {
  const rect = hopeBtn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  todayCount++;
  clickQueue++;
  comboCount.textContent = todayCount;
  comboCount.classList.add('bump');
  setTimeout(() => comboCount.classList.remove('bump'), 150);
  hopeBtn.classList.add('clicked');
  setTimeout(() => hopeBtn.classList.remove('clicked'), 200);
  spawnRipple(cx, cy);
  vibrate(20);
  if (todayCount % 10 === 0) spawnFloatText(cx, cy);
  if (todayCount % 50 === 0) showMessage();
  const newLevel = Math.min(10, Math.floor(todayCount / CLICKS_PER_LEVEL) + 1);
  if (newLevel !== level) vibrate([100, 50, 100, 50, 200]);
  updateUI();
  if (!isDemo) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      for (let i = 0; i < clickQueue; i++) await saveClick();
      clickQueue = 0;
    }, 1000);
  } else { clickQueue = 0; }
}

hopeBtn.addEventListener('click', handleClick);
hopeBtn.addEventListener('touchstart', (e) => { e.preventDefault(); handleClick(); }, { passive: false });

statsBtn.addEventListener('click', () => { window.location.href = 'stats.html'; });

// ===== Settings modal =====
settingsBtn.addEventListener('click', () => {
  if (isDemo) {
    userNameEl.textContent = '희망 여행자';
    userEmailEl.textContent = '데모 모드 (새로고침 시 초기화)';
    demoBadgeEl.style.display = 'inline-block';
  } else if (currentUser) {
    userNameEl.textContent = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || '사용자';
    userEmailEl.textContent = currentUser.email || '';
    demoBadgeEl.style.display = 'none';
  }
  settingsModal.classList.add('open');
});

settingsClose.addEventListener('click', () => settingsModal.classList.remove('open'));
settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.classList.remove('open'); });

logoutBtn.addEventListener('click', async () => {
  if (isDemo) {
    sessionStorage.removeItem('hope_demo_user');
  } else if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  window.location.href = 'login.html';
});

// ===== Init =====
async function init() {
  currentUser = await getUser();
  if (!currentUser) { window.location.href = 'login.html'; return; }
  await loadTodayCount();
  level = Math.min(10, Math.floor(todayCount / CLICKS_PER_LEVEL) + 1);
}
init();
