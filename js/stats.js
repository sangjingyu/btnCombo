import { supabaseClient } from './supabase-config.js';

// Auth
let currentUser = null;
async function getUser() {
  const demo = sessionStorage.getItem('hope_demo_user');
  if (demo) return JSON.parse(demo);
  if (!supabaseClient) return null;
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.user || null;
}

// State
let currentYear, currentMonth;
let selectedDate = null;
let monthData = {}; // date string -> count
let hourlyData = {}; // cached hourly data per date
let chart = null;

// DOM
const calDays = document.getElementById('cal-days');
const monthTitle = document.getElementById('month-title');
const graphSection = document.getElementById('graph-section');
const graphTitle = document.getElementById('graph-title');
const graphEmpty = document.getElementById('graph-empty');
const chartWrap = document.querySelector('.chart-wrap');
const totalCount = document.getElementById('total-count');

document.getElementById('back-btn').addEventListener('click', () => history.back());
document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
document.getElementById('next-month').addEventListener('click', () => changeMonth(1));

// ===== Calendar =====
function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
  loadMonthData();
}

function renderCalendar() {
  const months = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  monthTitle.textContent = `${currentYear}년 ${months[currentMonth]}`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  calDays.innerHTML = '';

  // Empty cells
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    calDays.appendChild(el);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const el = document.createElement('div');
    el.className = 'cal-day';
    if (dateStr === today) el.classList.add('today');
    if (dateStr === selectedDate) el.classList.add('selected');

    const count = monthData[dateStr] || 0;
    if (count > 0) el.classList.add('has-data');

    el.innerHTML = `
      <span>${d}</span>
      ${count > 0 ? `<span class="day-count">${count}</span>` : ''}
    `;

    el.addEventListener('click', () => selectDate(dateStr));
    calDays.appendChild(el);
  }
}

async function loadMonthData() {
  const padded = String(currentMonth + 1).padStart(2, '0');
  const startDate = `${currentYear}-${padded}-01`;
  const endDate = `${currentYear}-${padded}-31`;

  monthData = {};

  if (!supabaseClient || !currentUser || currentUser.id?.startsWith('demo')) {
    // Demo: no persistent data
    monthData = {};
  } else {
    const { data } = await supabaseClient
      .from('button_clicks')
      .select('clicked_at')
      .eq('user_id', currentUser.id)
      .gte('clicked_at', startDate + 'T00:00:00')
      .lte('clicked_at', endDate + 'T23:59:59');

    if (data) {
      data.forEach(row => {
        const date = row.clicked_at.split('T')[0];
        monthData[date] = (monthData[date] || 0) + 1;
      });
    }
  }

  renderCalendar();
}

// ===== Date selection =====
async function selectDate(dateStr) {
  selectedDate = dateStr;
  renderCalendar();

  const [y, m, d] = dateStr.split('-');
  graphTitle.textContent = `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;

  const hourly = await loadHourlyData(dateStr);
  renderChart(hourly);
}

async function loadHourlyData(dateStr) {
  if (hourlyData[dateStr]) return hourlyData[dateStr];

  const hours = new Array(24).fill(0);

  if (!supabaseClient || !currentUser || currentUser.id?.startsWith('demo')) {
    // Demo: no persistent data
  } else {
    const { data } = await supabaseClient
      .from('button_clicks')
      .select('clicked_at')
      .eq('user_id', currentUser.id)
      .gte('clicked_at', dateStr + 'T00:00:00')
      .lte('clicked_at', dateStr + 'T23:59:59');

    if (data) {
      data.forEach(row => {
        const h = new Date(row.clicked_at).getHours();
        hours[h]++;
      });
    }
  }

  hourlyData[dateStr] = hours;
  return hours;
}

// ===== Chart =====
function renderChart(hourly) {
  const total = hourly.reduce((a, b) => a + b, 0);

  if (total === 0) {
    chartWrap.classList.remove('visible');
    graphEmpty.style.display = 'block';
    return;
  }

  chartWrap.classList.add('visible');
  graphEmpty.style.display = 'none';

  const labels = Array.from({ length: 24 }, (_, i) => `${i}시`);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById('hourly-chart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '클릭 횟수',
        data: hourly,
        borderColor: '#f4c97a',
        backgroundColor: 'rgba(244,201,122,0.15)',
        borderWidth: 2,
        pointRadius: (ctx) => ctx.raw > 0 ? 4 : 2,
        pointBackgroundColor: '#f4c97a',
        pointBorderColor: '#f4c97a',
        fill: true,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,10,20,0.95)',
          borderColor: 'rgba(244,201,122,0.3)',
          borderWidth: 1,
          titleColor: '#f4c97a',
          bodyColor: '#f0ede8',
          callbacks: {
            label: (ctx) => ` ${ctx.raw}번 클릭`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: 'rgba(240,237,232,0.4)',
            font: { size: 10 },
            maxTicksLimit: 12,
          },
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: 'rgba(240,237,232,0.4)',
            font: { size: 10 },
            stepSize: 1,
          },
          grid: { color: 'rgba(255,255,255,0.05)' },
        }
      }
    }
  });
}

// ===== Total count =====
async function loadTotalCount() {
  let total = 0;

  if (!supabaseClient || !currentUser || currentUser.id?.startsWith('demo')) {
    // Demo: no persistent data
    total = 0;
  } else {
    const { count } = await supabaseClient
      .from('button_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', currentUser.id);
    total = count || 0;
  }

  totalCount.textContent = total.toLocaleString();
}

// ===== Init =====
async function init() {
  currentUser = await getUser();
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();

  await loadTotalCount();
  await loadMonthData();

  // Auto-select today
  const today = now.toISOString().split('T')[0];
  await selectDate(today);
}

init();
