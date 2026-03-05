import { supabaseClient } from './supabase-config.js';
import { HopeAnimator } from './animations.js';

// ===== Auth check =====
let currentUser = null;

async function getUser() {
  const demo = localStorage.getItem('hope_demo_user');
  if (demo) return JSON.parse(demo);
  if (!supabaseClient) return null;
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.user || null;
}

// ===== State =====
let todayCount = 0;
let level = 1;
const CLICKS_PER_LEVEL = 500;

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
const progressBar = document.getElementById('progress-bar');
const progressRemain = document.getElementById('progress-remain');
const msgOverlay = document.getElementById('message-overlay');
const levelAnnounce = document.getElementById('level-announce');

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

// ===== Load today's count from DB / localStorage =====
async function loadTodayCount() {
  const today = new Date().toISOString().split('T')[0];

  if (!supabaseClient || !currentUser || currentUser.id?.startsWith('demo')) {
    // Use localStorage for demo
    const stored = localStorage.getItem(`hope_count_${today}_${currentUser?.id || 'demo'}`);
    todayCount = stored ? parseInt(stored) : 0;
  } else {
    const { data } = await supabaseClient
      .from('button_clicks')
      .select('id', { count: 'exact' })
      .eq('user_id', currentUser.id)
      .gte('clicked_at', today + 'T00:00:00')
      .lte('clicked_at', today + 'T23:59:59');
    todayCount = data?.length || 0;
  }

  updateUI();
}

async function saveClick() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (!supabaseClient || !currentUser || currentUser.id?.startsWith('demo')) {
    localStorage.setItem(`hope_count_${today}_${currentUser?.id || 'demo'}`, todayCount.toString());
    return;
  }

  await supabaseClient.from('button_clicks').insert({
    user_id: currentUser.id,
    clicked_at: now.toISOString()
  });
}

// ===== UI update =====
function updateUI() {
  // Combo
  comboCount.textContent = todayCount;

  // Level calculation
  const newLevel = Math.min(10, Math.floor(todayCount / CLICKS_PER_LEVEL) + 1);
  const inLevelProgress = todayCount % CLICKS_PER_LEVEL;
  const progressPct = (inLevelProgress / CLICKS_PER_LEVEL) * 100;
  const remain = CLICKS_PER_LEVEL - inLevelProgress;

  progressBar.style.setProperty('--progress', progressPct + '%');
  progressRemain.textContent = remain;
  levelBadge.textContent = `LV.${newLevel}`;

  // Update animator
  animator.setLevel(newLevel, inLevelProgress / CLICKS_PER_LEVEL);

  // Level up!
  if (newLevel !== level) {
    level = newLevel;
    showLevelUp();
  }
}

function showLevelUp() {
  const msg = messages.level_messages?.[level] || `레벨 ${level} 달성!`;
  levelAnnounce.innerHTML = `
    <div class="lv-num">✨ LEVEL ${level} ✨</div>
    <div class="lv-msg">${msg}</div>
  `;
  levelAnnounce.classList.add('show');
  setTimeout(() => levelAnnounce.classList.remove('show'), 3000);
}

// ===== Message display =====
let msgTimeout;
let msgIndex = 0;

function showMessage() {
  const msgs = messages.hope_messages || [];
  if (!msgs.length) return;
  const msg = msgs[msgIndex % msgs.length];
  msgIndex++;
  msgOverlay.textContent = msg;
  msgOverlay.classList.add('show');
  clearTimeout(msgTimeout);
  msgTimeout = setTimeout(() => msgOverlay.classList.remove('show'), 2000);
}

// ===== Float text effect =====
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

// ===== Ripple =====
function spawnRipple(x, y) {
  const el = document.createElement('div');
  el.className = 'ripple';
  const size = 60;
  el.style.cssText = `width:${size}px;height:${size}px;left:${x - size / 2}px;top:${y - size / 2}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

// ===== Vibration =====
function vibrate(pattern) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

// ===== Click Handler =====
let clickQueue = 0;
let saveTimeout;

async function handleClick(e) {
  const rect = hopeBtn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  todayCount++;
  clickQueue++;

  // Update combo display immediately
  comboCount.textContent = todayCount;
  comboCount.classList.add('bump');
  setTimeout(() => comboCount.classList.remove('bump'), 150);

  // Button animation
  hopeBtn.classList.add('clicked');
  setTimeout(() => hopeBtn.classList.remove('clicked'), 200);

  // Effects
  spawnRipple(cx, cy);
  vibrate(20);

  // Every 10 clicks: float text
  if (todayCount % 10 === 0) spawnFloatText(cx, cy);

  // Every 50 clicks: show message
  if (todayCount % 50 === 0) showMessage();

  // Level check
  const newLevel = Math.min(10, Math.floor(todayCount / CLICKS_PER_LEVEL) + 1);
  if (newLevel !== level) {
    vibrate([100, 50, 100, 50, 200]);
  }

  updateUI();

  // Debounced save
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    // Save all queued clicks
    for (let i = 0; i < clickQueue; i++) {
      await saveClick();
    }
    clickQueue = 0;
  }, 1000);
}

hopeBtn.addEventListener('click', handleClick);
hopeBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleClick(e);
}, { passive: false });

// ===== Stats button =====
statsBtn.addEventListener('click', () => {
  window.location.href = 'stats.html';
});

// ===== Init =====
async function init() {
  currentUser = await getUser();
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }
  await loadTodayCount();
  level = Math.min(10, Math.floor(todayCount / CLICKS_PER_LEVEL) + 1);
}

init();
