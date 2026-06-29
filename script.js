// ---- Currency data (full + dept seat price per user / month) ----
const CURRENCIES = [
  { code: 'IDR', flag: '🇮🇩', name: 'Indonesia',     full: 750000, dept: 580000, sep: '.' },
  { code: 'MYR', flag: '🇲🇾', name: '(MYR) Malaysia', full: 175,    dept: 135,    sep: ',' },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore',      full: 65,     dept: 50,     sep: ',' },
  { code: 'PHP', flag: '🇵🇭', name: 'Philippines',    full: 2700,   dept: 2100,   sep: ',' },
  { code: 'USD', flag: '🇺🇸', name: 'United States',  full: 49,     dept: 38,     sep: ',' },
];

const ANNUAL_DISCOUNT = 0.10; // Save 10%

let state = { currency: CURRENCIES[0], full: 0, dept: 0, annual: false };

// ---- Number formatting with locale thousands separator ----
function fmt(n, sep) {
  const s = Math.round(n).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, sep || ',');
}

// ---- Render currency menu ----
const menu = document.getElementById('currencyMenu');
const select = document.getElementById('currencySelect');
const trigger = document.getElementById('currencyTrigger');

function buildMenu() {
  menu.innerHTML = '';
  CURRENCIES.forEach((c) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    if (c.code === state.currency.code) li.classList.add('active');
    li.innerHTML = `<span class="flag">${c.flag}</span><span>${c.name}</span><span class="cm-sub">${c.code}</span>`;
    li.addEventListener('click', () => {
      state.currency = c;
      closeMenu();
      render();
    });
    menu.appendChild(li);
  });
}

function openMenu() { select.classList.add('open'); trigger.setAttribute('aria-expanded', 'true'); }
function closeMenu() { select.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); }

trigger.addEventListener('click', (e) => {
  e.stopPropagation();
  select.classList.contains('open') ? closeMenu() : openMenu();
});
document.addEventListener('click', (e) => { if (!select.contains(e.target)) closeMenu(); });

// ---- Counters ----
document.querySelectorAll('.counter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const t = btn.dataset.target;
    const delta = btn.dataset.act === 'inc' ? 1 : -1;
    state[t] = Math.max(0, state[t] + delta);
    render();
  });
});

// ---- Annual toggle ----
const annualToggle = document.getElementById('annualToggle');
annualToggle.addEventListener('change', () => { state.annual = annualToggle.checked; render(); });

// ---- Render everything that depends on state ----
function render() {
  const c = state.currency;

  // Per-seat prices
  document.querySelector('[data-price="full"]').textContent = `${c.code} ${fmt(c.full, c.sep)}`;
  document.querySelector('[data-price="dept"]').textContent = `${c.code} ${fmt(c.dept, c.sep)}`;

  // Counts
  document.getElementById('fullCount').textContent = state.full;
  document.getElementById('deptCount').textContent = state.dept;
  document.getElementById('sumFull').textContent = `${state.full} seats`;
  document.getElementById('sumDept').textContent = `${state.dept} seats`;

  // Total
  let total = state.full * c.full + state.dept * c.dept;
  if (state.annual) total = total * (1 - ANNUAL_DISCOUNT);
  document.getElementById('totalCur').textContent = c.code;
  document.getElementById('totalAmt').textContent = fmt(total, c.sep);

  // Save badge
  document.getElementById('saveBadge').hidden = !state.annual;

  // Currency trigger label
  document.getElementById('currencyFlag').textContent = c.flag;
  document.getElementById('currencyName').textContent = c.name;

  buildMenu();
}

// ---- Feature comparison table ----
const FEATURES = [
  { name: 'Business Profile',  free: false, full: true,  dept: true  },
  { name: 'Comp Rep',          free: false, full: true,  dept: true  },
  { name: 'HQ & Branch Info',  free: false, full: true,  dept: 'HQ only' },
  { name: 'Team Management',   free: false, full: true,  dept: false },
  { name: 'Manage Jobs',       free: false, full: true,  dept: true  },
  { name: 'Find Candidate',    free: false, full: true,  dept: 'Dept only' },
  { name: 'Manage Profile',    free: false, full: true,  dept: true  },
  { name: 'Job Posting',       free: false, full: 'All depts', dept: 'Own dept' },
  { name: 'Type Profile',      free: false, full: true,  dept: true  },
  { name: 'Type Branch',       free: false, full: true,  dept: false },
  { name: 'Support Level',     free: 'Email', full: 'Priority', dept: 'Email' },
];

function cell(v) {
  if (v === true)  return '<span class="cmp-yes">✓</span>';
  if (v === false) return '<span class="cmp-no">—</span>';
  return `<span class="cmp-txt">${v}</span>`;
}

const tbody = document.getElementById('compareBody');
FEATURES.forEach((f) => {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${f.name}</td><td>${cell(f.free)}</td><td>${cell(f.full)}</td><td>${cell(f.dept)}</td>`;
  tbody.appendChild(tr);
});

// ---- FAQ ----
const FAQS = [
  {
    q: 'What exactly is a "seat"?',
    a: 'A seat is a paid license for one person who needs to post jobs and manage hiring. Everyone else in your company can be invited as a Member Profile for FREE to view the directory and apply for internal jobs.'
  },
  {
    q: 'Can I mix Full Recruiter and Department Head seats?',
    a: 'Yes. Most teams combine a few Full Recruiter seats for HR leadership with Department Head seats for managers who only hire within their own department. Use the calculator above to estimate your blend.'
  },
  {
    q: 'Why are prices different in each country?',
    a: 'Prices are localised to reflect local market conditions, taxes, and purchasing power. Select your country in the currency picker to see the exact rate you will be billed in.'
  },
  {
    q: 'Do I get charged per branch or location?',
    a: 'No. Billing is based purely on the number of seats you activate, not the number of branches or locations. A single Full Recruiter seat can manage hiring across all of your branches.'
  },
];

const faqList = document.getElementById('faqList');
FAQS.forEach((f, i) => {
  const item = document.createElement('div');
  item.className = 'faq-item' + (i === 0 ? ' open' : '');
  item.innerHTML = `
    <button class="faq-q">${f.q}
      <svg class="faq-ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="faq-a"><p>${f.a}</p></div>`;
  item.querySelector('.faq-q').addEventListener('click', () => item.classList.toggle('open'));
  faqList.appendChild(item);
});

// ---- Init ----
render();
