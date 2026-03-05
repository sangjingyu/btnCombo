import { supabaseClient } from './supabase-config.js';

// Background canvas animation
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const particles = Array.from({ length: 60 }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  r: Math.random() * 2 + 0.5,
  vx: (Math.random() - 0.5) * 0.3,
  vy: -Math.random() * 0.4 - 0.1,
  alpha: Math.random() * 0.5 + 0.1,
}));

function animateBg() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
    if (p.x < -10) p.x = canvas.width + 10;
    if (p.x > canvas.width + 10) p.x = -10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(244,201,122,' + p.alpha + ')';
    ctx.fill();
  });
  requestAnimationFrame(animateBg);
}
animateBg();

const googleBtn = document.getElementById('google-login-btn');
const demoBtn = document.getElementById('demo-btn');

googleBtn.addEventListener('click', async () => {
  if (!supabaseClient) {
    alert('Supabase 설정이 필요합니다. js/supabase-config.js 를 먼저 설정해주세요.');
    return;
  }
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/btnCombo/index.html' }
  });
  if (error) console.error('Login error:', error);
});

demoBtn.addEventListener('click', () => {
  // Demo: sessionStorage only — cleared on tab/browser close or refresh
  sessionStorage.setItem('hope_demo_user', JSON.stringify({
    id: 'demo-user-' + Date.now(),
    name: '희망 여행자',
    email: 'demo@hope.com',
    avatar: null
  }));
  window.location.href = 'index.html';
});

// Check if already logged in (Supabase session only — no localStorage demo check)
async function checkAuth() {
  if (!supabaseClient) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) window.location.href = 'index.html';
}
checkAuth();
