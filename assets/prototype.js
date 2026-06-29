/* ===========================================================================
   ProConnect — working pricing prototype engine
   Single-page app: dashboard → plan → order → pay → billing, + staff + modals.
   Shared state carries across the flow.
=========================================================================== */
(function () {
  'use strict';

  const CUR = [
    { code: 'IDR', flag: '🇮🇩', name: 'Indonesia',      full: 750000, dept: 580000, sep: '.' },
    { code: 'MYR', flag: '🇲🇾', name: 'Malaysia',       full: 175,    dept: 135,    sep: ',' },
    { code: 'SGD', flag: '🇸🇬', name: 'Singapore',      full: 65,     dept: 50,     sep: ',' },
    { code: 'PHP', flag: '🇵🇭', name: 'Philippines',    full: 2700,   dept: 2100,   sep: ',' },
    { code: 'USD', flag: '🇺🇸', name: 'United States',  full: 49,     dept: 38,     sep: ',' },
  ];
  const DISC = 0.10; // annual save 10%

  const S = {
    view: 'dashboard', cur: CUR[0], full: 0, dept: 0, annual: false, curOpen: false,
    plan: 'trial',                                   // 'trial' | 'active'
    bought: { full: 0, dept: 0, cur: CUR[0], annual: false },
    promo: '', promoState: '',                       // '', 'ok', 'fail'
  };

  const $ = (s, r = document) => r.querySelector(s);
  const view = $('#view');
  let sidebarEl, sbBackdrop;
  function sbOpen(o) { if (!sidebarEl) return; sidebarEl.classList.toggle('open', o); sbBackdrop.classList.toggle('open', o); }
  const fmt = (n, sep) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep || ',');
  const money = (c, n) => `${c.code} ${fmt(n, c.sep)}`;
  const monthly = (f, d, c) => f * c.full + d * c.dept;
  const calcTotal = () => { let t = monthly(S.full, S.dept, S.cur); return S.annual ? t * (1 - DISC) : t; };

  /* ---------------- shared bits ---------------- */
  function seatTile(kind, w = 38) {
    const ic = { full: `<svg width="${w*0.5}" height="${w*0.5}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9 12 4l10 5-10 5L2 9z"/><path d="M5 11v5c0 1 3 3 7 3s7-2 7-3v-5"/></svg>`,
      dept: `<svg width="${w*0.5}" height="${w*0.5}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><circle cx="15" cy="7" r="3"/><circle cx="12" cy="14" r="3"/></svg>`,
      member: `<svg width="${w*0.5}" height="${w*0.5}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>` };
    const cls = { full: 'seat-ic-blue', dept: 'seat-ic-green', member: 'seat-ic-gray' };
    return `<span class="seat-ic ${cls[kind]}" style="width:${w}px;height:${w}px">${ic[kind]}</span>`;
  }
  function counter(key, val) {
    return `<div class="counter"><button class="counter-btn" data-dec="${key}">−</button><span class="counter-val" data-cv="${key}">${val}</span><button class="counter-btn" data-inc="${key}">+</button></div>`;
  }

  /* ===================== VIEWS ===================== */
  const Views = {
    dashboard() {
      const trial = S.plan === 'trial';
      return `
      <h1 class="page-title">Hello Arufa</h1><p class="page-sub">Get Started Finding Something</p>
      <div class="stat-grid" style="margin-top:22px">
        <div class="stat-card"><div class="label">Total Country</div><div class="value">2</div></div>
        <div class="stat-card"><div class="label">Total Branch</div><div class="value">2</div></div>
        <div class="stat-card"><div class="label">Total Member</div><div class="value">14</div></div>
        <div class="stat-card"><div class="label">Total Active Jobs</div><div class="value">0</div></div>
      </div>
      <div class="card card-pad" style="margin-top:18px">
        <div class="between"><div><div class="section-title">Profile Completion</div><div class="muted" style="margin-top:4px">4 of 4 steps completed</div></div><button class="btn btn-outline btn-sm">Edit</button></div>
        <div class="grid" style="grid-template-columns:repeat(4,1fr);margin-top:18px">
          ${['Business Profile Details','Company Representative Info','Headquarters and Branch Information','Team Management'].map(t=>`<div style="display:flex;align-items:center;gap:10px;background:var(--blue-soft-2);border-radius:12px;padding:14px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 9"/></svg><b style="color:var(--blue);font-size:13px;font-family:'Poppins'">${t}</b></div>`).join('')}
        </div>
      </div>
      <div class="card card-pad" style="margin-top:18px;background:var(--amber-soft);border-color:#f0e2bf">
        <div class="between"><div><div class="section-title">${trial?"You're on Trial Plan":"You're on a Paid Plan"}</div><div class="muted" style="margin-top:4px">${trial?'Upgrade to unlock more features':'Manage your seats and billing anytime'}</div></div><button class="btn btn-primary" data-go="${trial?'plan':'billing'}">${trial?'Upgrade Now':'Manage Plan'}</button></div>
        <div class="row" style="margin-top:20px;gap:48px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:12px">${seatTile('full',44)}<div><b style="font-size:15px">Full seats</b><div class="muted" style="font-size:13px">${trial?10:S.bought.full} seats</div></div></div>
          <div style="display:flex;align-items:center;gap:12px">${seatTile('dept',44)}<div><b style="font-size:15px">Dept seats</b><div class="muted" style="font-size:13px">${trial?2:S.bought.dept} seats</div></div></div>
          <div style="display:flex;align-items:center;gap:12px">${seatTile('member',44)}<div><b style="font-size:15px">Member seats</b><div class="muted" style="font-size:13px">2 seats</div></div></div>
        </div>
      </div>
      <div class="grid" style="grid-template-columns:1fr 1fr;margin-top:18px;align-items:start">
        <div class="grid" style="gap:16px">
          ${actionCard('Find Candidates','Directly Find the Ideal Candidates for Your Business','Find Now')}
          ${actionCard('Manage Jobs','Post Jobs and Manage Candidate Recruitment for Your Business','Manage Now')}
        </div>
        ${actionCard('Manage Profile','View and Manage Your Business Profile Details','Manage Now')}
      </div>`;
    },

    plan() {
      const total = calcTotal();
      const curItem = (label, kind, key, price) => `
        <div class="seatpick">${seatTile(kind)}<div class="info"><b>${label}</b><span class="price">${price}</span><span class="per">Per user/mo</span></div>${counter(key, S[key])}</div>`;
      return `
      <h1 class="page-title">Simple, transparent pricing</h1>
      <p class="page-sub">Pay only for the recruiters you need. Unlimited job postings included.</p>

      <div class="card card-pad" style="margin-top:20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <div style="flex:1;min-width:180px"><div class="section-title" style="font-size:16px">Understand Our Seat Types</div><p class="muted" style="font-size:13px;margin-top:4px">When you set specific role members, it affects your seat type.</p></div>
        <button class="btn btn-outline" data-toast="Seat types: Full Recruiter, Department Head, and free Member seats.">Learn More</button>
      </div>

      <div class="card card-pad" style="margin-top:14px">
        <div class="between"><b style="font-size:16px">${S.plan==='active'?"You're on a Paid Plan":"You're on Free Trial"}</b><a data-go="${S.plan==='active'?'billing':'order'}" style="font-weight:600;font-size:13.5px;cursor:pointer">Upgrade anytime →</a></div>
        <div style="display:flex;gap:36px;margin-top:14px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:10px">${seatTile('full')}<div><b style="font-size:14px">Full seats</b><div class="muted" style="font-size:12px">${S.plan==='active'?S.bought.full:10} seats</div></div></div>
          <div style="display:flex;align-items:center;gap:10px">${seatTile('dept')}<div><b style="font-size:14px">Dept seats</b><div class="muted" style="font-size:12px">${S.plan==='active'?S.bought.dept:2} seats</div></div></div>
        </div>
      </div>

      <div class="seatcard blue" style="margin-top:20px">
        <div class="hd">${seatTile('full',42)}<h4>Full Recruiter Seat</h4></div>
        <p style="margin-top:12px;font-size:13.5px"><b>Role for:</b> <span class="muted">HR Directors, PIC Branch, HRD Branch.</span></p>
        <ul class="flist"><li class="y">Post jobs for all departments</li><li class="y">Full candidate database access</li><li class="y">Multi-branch management</li></ul>
      </div>
      <div class="seatcard green" style="margin-top:14px">
        <div class="hd">${seatTile('dept',42)}<h4>Department Head Seat</h4></div>
        <p style="margin-top:12px;font-size:13.5px"><b>Role for:</b> <span class="muted">Dept Head HQ, Dept Head Branch.</span></p>
        <ul class="flist"><li class="y">Post for own department only</li><li class="y">View department applicants</li><li class="n">No branch-management</li></ul>
      </div>

      <h2 class="section-title" style="margin-top:28px">Calculate Your Monthly Cost</h2>
      <p class="muted" style="font-size:13.5px;margin-top:4px">Estimate your investment based on your team size</p>
      <label class="field-label" style="display:block;font-size:13px;color:var(--muted);margin:16px 0 8px">Currency</label>
      <div style="display:flex;align-items:center;gap:10px">
        <div class="cur-select ${S.curOpen?'open':''}" id="curSelect" style="flex:1">
          <button class="cur-trigger" id="curTrigger"><span class="flag">${S.cur.flag}</span><span>${S.cur.name}</span><svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></button>
          <ul class="cur-menu">${CUR.map(c=>`<li data-cur="${c.code}" class="${c.code===S.cur.code?'active':''}"><span class="flag">${c.flag}</span><span>${c.name}</span><span class="code">${c.code}</span></li>`).join('')}</ul>
        </div>
        <button class="icon-box" style="border-color:var(--blue)" data-toast="Prices are localised to each market — taxes & purchasing power." aria-label="Currency info"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
      </div>
      ${curItem('Full Recruiter Seats','full','full', money(S.cur,S.cur.full))}
      ${curItem('Department Seats','dept','dept', money(S.cur,S.cur.dept))}
      <div class="seatpick" style="background:#f9fafb">${seatTile('member')}<div class="info"><b>Member Seats</b><span class="per">FREE</span></div><span class="unlimited">Unlimited</span></div>

      <div class="summary">
        <h3>Calculation Summary</h3><p class="sub">This calculation works on all type seats</p>
        <div class="seats"><div><span class="lbl">Full seats</span><div class="val">${S.full} seats</div></div><div><span class="lbl">Dept seats</span><div class="val">${S.dept} seats</div></div></div>
        <div class="total"><span class="cur">${S.cur.code}</span><span class="amt">${fmt(total,S.cur.sep)}</span><span class="mo">/mo</span></div>
        <div class="tog"><span class="save-badge" ${S.annual?'':'hidden'}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Save 10%</span><label class="switch"><input type="checkbox" id="annual" ${S.annual?'checked':''}><span class="slider"></span></label><span style="font-size:14px">Annual</span></div>
        <button class="btn btn-primary btn-block btn-lg" style="margin-top:18px" id="planUpgrade">Upgrade Now</button>
      </div>

      <div class="card" style="margin-top:22px;padding:6px"><div class="table-wrap"><table class="tbl" style="min-width:480px"><thead><tr><th>Feature</th><th>Free Account</th><th>Full Recruiter</th><th>Dept Head</th></tr></thead><tbody>
        ${[['Business Profile','—','✓','✓'],['HQ & Branch Info','—','✓','HQ only'],['Team Management','—','✓','—'],['Find Candidate','—','✓','Dept only'],['Job Posting','—','All depts','Own dept'],['Support Level','Email','Priority','Email']].map(r=>`<tr><td>${r[0]}</td><td style="text-align:center">${cell(r[1])}</td><td style="text-align:center">${cell(r[2])}</td><td style="text-align:center">${cell(r[3])}</td></tr>`).join('')}
      </tbody></table></div></div>

      <div class="card" style="margin-top:22px;background:var(--blue);color:#fff;text-align:center;padding:26px 22px;border:none">
        <h2 style="font-size:19px;font-weight:700">Need a custom solution?</h2><p style="font-size:13.5px;margin-top:8px;opacity:.92">Contact our sales team for enterprise-grade features and custom billing options.</p>
        <button class="btn btn-white" style="margin-top:16px" data-toast="Our sales team will be in touch shortly.">Contact Now</button>
      </div>

      <h2 class="section-title" style="margin-top:28px">Frequently Asked Questions</h2>
      <div style="margin-top:12px">
        ${faq('What exactly is a "seat"?','A seat is a paid license for one person who needs to post jobs and manage hiring. Everyone else can be invited as a Member Profile for FREE.',true)}
        ${faq('Can I mix Full Recruiter and Department Head seats?','Yes. Combine Full Recruiter seats for HR leadership with Department Head seats for managers who only hire within their own department.')}
        ${faq('Why are prices different in each country?','Prices are localised to reflect local market conditions, taxes, and purchasing power. Pick your country in the currency selector above.')}
      </div>`;
    },

    order() {
      const sub = monthly(S.full, S.dept, S.cur);
      const disc = S.annual ? sub * DISC : 0;
      const total = sub - disc;
      const promoRow = S.promoState === 'ok' ? `<div class="between" style="font-size:13.5px;color:var(--green)"><span>Promo “BEASISWA”</span><span>− ${money(S.cur, sub*0.05)}</span></div>` : '';
      const grand = total - (S.promoState === 'ok' ? sub*0.05 : 0);
      return `
      <h1 class="page-title">Confirmation Order</h1><p class="page-sub">Review your seats and confirm payment</p>
      <div class="order-grid" style="margin-top:22px">
        <div class="card card-pad">
          <div class="section-title" style="font-size:16px">Seats Detail</div><p class="muted" style="font-size:13px;margin-top:2px">Add or remove seats to match your hiring needs</p>
          <div class="seatpick" style="margin-top:14px">${seatTile('full')}<div class="info"><b>Full Recruiter Seats</b><span class="per">${money(S.cur,S.cur.full)} / user / mo</span></div><span style="margin-left:auto;font-weight:700">${S.full}</span></div>
          <div class="seatpick">${seatTile('dept')}<div class="info"><b>Department Seats</b><span class="per">${money(S.cur,S.cur.dept)} / user / mo</span></div><span style="margin-left:auto;font-weight:700">${S.dept}</span></div>
          <div class="promo"><input class="input" id="promoInput" placeholder="Promo code" value="${S.promo}"><button class="btn btn-outline" id="promoBtn">Apply</button></div>
          ${S.promoState==='fail'?'<p style="color:var(--red);font-size:12.5px;margin-top:6px">Promo code failed to be used.</p>':''}
          ${S.promoState==='ok'?'<p style="color:var(--green);font-size:12.5px;margin-top:6px">Promo code successfully used.</p>':''}
        </div>
        <div class="card card-pad">
          <div class="section-title" style="font-size:16px">Order Summary</div>
          <div class="between" style="margin-top:14px;font-size:13.5px"><span class="muted">Subtotal</span><span>${money(S.cur,sub)}/mo</span></div>
          ${S.annual?`<div class="between" style="margin-top:8px;font-size:13.5px;color:var(--green)"><span>Annual discount (10%)</span><span>− ${money(S.cur,disc)}</span></div>`:''}
          ${promoRow}
          <div class="between" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line)"><b>Total</b><b style="font-size:20px;font-family:'Poppins'">${money(S.cur,Math.max(0,grand))}<span style="font-size:13px;color:var(--muted);font-weight:500">/mo</span></b></div>
          <div class="tog" style="display:flex;align-items:center;gap:10px;margin-top:14px;justify-content:flex-end"><span class="save-badge" ${S.annual?'':'hidden'} style="color:var(--green);background:#e8f6ee">Save 10%</span><label class="switch"><input type="checkbox" id="annualO" ${S.annual?'checked':''}><span class="slider"></span></label><span style="font-size:14px">Annual billing</span></div>
          <p class="muted" style="font-size:12px;margin-top:10px">Billed every month on the 1st. Cancel anytime.</p>
          <button class="btn btn-primary btn-block btn-lg" style="margin-top:14px" id="payNow">Pay Now</button>
          <button class="btn btn-ghost btn-block" style="margin-top:10px" data-go="plan">Back to Plan</button>
        </div>
      </div>`;
    },

    billing() {
      const active = S.plan === 'active';
      const b = S.bought;
      const price = active ? money(b.cur, (b.annual?monthly(b.full,b.dept,b.cur)*(1-DISC):monthly(b.full,b.dept,b.cur))) + '/mo' : '-';
      return `
      <h1 class="page-title">Subscription &amp; Billing</h1><p class="page-sub">Manage your subscription and billing details here.</p>
      ${active?`<div class="badge badge-green" style="margin-top:14px;padding:8px 14px">✓ Subscription is active</div>`:''}
      <div class="grid" style="grid-template-columns:1.3fr 1fr;margin-top:16px;align-items:start">
        <div class="card card-pad">
          <div class="section-title" style="font-size:16px">Current Subscription</div><p class="muted" style="font-size:13px;margin-top:2px">${active?'You are on a paid plan':'You are currently in Free Seats'}</p>
          <div style="display:flex;gap:14px;margin-top:14px;flex-wrap:wrap">
            <div class="card" style="flex:1;min-width:160px;padding:14px;display:flex;align-items:center;gap:12px;box-shadow:none">${seatTile('full')}<div><b>Full Seats</b><div class="muted" style="font-size:12px">${active?b.full:0} seats</div></div><b style="margin-left:auto">${active?b.full:0} Avail</b></div>
            <div class="card" style="flex:1;min-width:160px;padding:14px;display:flex;align-items:center;gap:12px;box-shadow:none">${seatTile('dept')}<div><b>Dept Seats</b><div class="muted" style="font-size:12px">${active?b.dept:0} seats</div></div><b style="margin-left:auto">${active?b.dept:0} Avail</b></div>
          </div>
          <div style="display:flex;gap:14px;margin-top:14px">
            <div class="card" style="flex:1;padding:12px 14px;box-shadow:none"><div class="muted" style="font-size:12px">Price</div><b>${price}</b></div>
            <div class="card" style="flex:1;padding:12px 14px;box-shadow:none"><div class="muted" style="font-size:12px">Next Billing</div><b>${active?'Jul 1, 2026':'-'}</b></div>
          </div>
          <div style="display:flex;gap:10px;margin-top:16px">
            ${active?`<button class="btn btn-outline" id="editSeats">Edit Seats</button><button class="btn btn-danger" id="cancelSub">Cancel Subscription</button>`:`<button class="btn btn-primary btn-block" data-go="plan">Upgrade</button>`}
          </div>
        </div>
        <div class="card card-pad">
          <div class="section-title" style="font-size:16px">Payment Method</div><p class="muted" style="font-size:13px;margin-top:2px">Manage your payment details</p>
          <div class="card" style="margin-top:14px;padding:14px;display:flex;align-items:center;gap:12px;box-shadow:none"><span style="background:#1a1f71;color:#fff;font-weight:800;font-style:italic;padding:6px 9px;border-radius:6px;font-size:13px">VISA</span><div><b>**** **** **** 3627</b><div class="muted" style="font-size:12px">Expiry 02/26</div></div></div>
          <button class="btn btn-outline btn-block" style="margin-top:14px">Update Payment Method</button>
        </div>
      </div>
      <div class="card card-pad" style="margin-top:18px">
        <div class="between"><div class="section-title" style="font-size:16px">Invoice</div><button class="btn btn-outline btn-sm">↓ Download All</button></div>
        <div class="table-wrap" style="margin-top:14px"><table class="tbl invoice-tbl"><thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>
          ${active?[['INV-20','Jun 1, 2026',price.replace('/mo',''),'Paid'],['INV-19','May 1, 2026',price.replace('/mo',''),'Paid']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td><span class="badge badge-green">${r[3]}</span></td><td style="text-align:right"><button class="tbl-actions"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button></td></tr>`).join(''):`<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">Oops — no invoices yet. Upgrade to a paid plan to see your billing history.</td></tr>`}
        </tbody></table></div>
      </div>`;
    },

    staff() {
      const members = [
        ['Bambang Setiawan','bambang@seruam.com','HRD HQ','Active'],
        ['Brooklyn Simmons','brocklyns@seruam.com','PIC Branch','Active'],
        ['Cody Fisher','codyf@seruam.com','Member','Non Active'],
        ['Avery Johnson','averyj@seruam.com','HRD HQ','Active'],
        ['Taylor Martinez','taylorm@seruam.com','Dept Head Branch','Active'],
      ];
      return `
      <h1 class="page-title">Staff Management</h1><p class="page-sub">Manage your team members and their roles</p>
      <div class="row" style="margin-top:18px;gap:14px;flex-wrap:wrap">
        ${['Full Seats|'+(S.plan==='active'?S.bought.full:5),'Dept Seats|'+(S.plan==='active'?S.bought.dept:1),'Free Seats|5'].map(x=>{const[a,b]=x.split('|');return `<div class="card" style="flex:1;min-width:180px;padding:16px"><div class="muted" style="font-size:13px">${a}</div><div style="font-size:24px;font-weight:800;font-family:'Poppins';margin-top:4px">${b}</div></div>`}).join('')}
      </div>
      <div class="card card-pad" style="margin-top:18px">
        <div class="between" style="margin-bottom:14px"><div class="section-title" style="font-size:16px">Team Members</div><button class="btn btn-outline btn-sm" data-toast="Invite link copied — share it with your teammate.">+ Invite Member</button></div>
        <div class="toolbar" style="margin-bottom:8px"><div class="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg><input placeholder="Search name or email"></div></div>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>No</th><th>Name</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>
          ${members.map((m,i)=>`<tr><td>${i+1}</td><td><div class="cell-user"><span class="avatar"></span><div><div class="nm">${m[0]}</div><div class="em">${m[1]}</div></div></div></td><td>${m[2]}</td><td><span class="dot-status ${m[3]==='Active'?'status-active':'status-inactive'}">${m[3]==='Active'?'● Active':'✕ Non Active'}</span></td><td><div class="tbl-actions"><button class="mv" data-member="${m[0]}" title="Move seat"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l3-3-3-3"/><path d="M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg></button><button title="Edit"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button></div></td></tr>`).join('')}
        </tbody></table></div>
        <div class="between" style="margin-top:14px"><span class="muted" style="font-size:13px">Item per page 10</span><div class="pager"><button>‹</button><button class="active">1</button><button>2</button><button>3</button><button>›</button></div></div>
      </div>`;
    },
  };

  function actionCard(t, d, btn) {
    return `<div class="card card-pad"><div class="between"><div style="display:flex;gap:12px"><span style="color:var(--ink-2);margin-top:2px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg></span><div><b style="font-size:15px;font-family:'Poppins'">${t}</b><div class="muted" style="font-size:13px;margin-top:4px">${d}</div></div></div><button class="btn btn-outline btn-sm" data-toast="${t} — coming soon in this prototype.">${btn}</button></div></div>`;
  }
  function cell(v){ return v==='✓'?'<span style="color:var(--green);font-weight:700">✓</span>':v==='—'?'<span style="color:var(--light)">—</span>':`<span class="muted" style="font-size:12.5px">${v}</span>`; }
  function faq(q,a,open){ return `<div class="faq-item${open?' open':''}"><button class="faq-q">${q}<svg class="faq-ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button><div class="faq-a"><p>${a}</p></div></div>`; }

  /* ===================== MODALS ===================== */
  let modalTmp = {};
  function openModal(kind, ctx) {
    let html = '';
    if (kind === 'editSeats') {
      modalTmp = { full: S.bought.full, dept: S.bought.dept };
      html = `<div class="modal modal-sm modal-pad"><div class="modal-head"><h3>Edit Seats</h3><button class="modal-close" data-mclose>×</button></div>
        <p class="muted" style="font-size:13px;margin-top:4px">Adjust the number of seats on your subscription.</p>
        <div class="seatpick" style="margin-top:14px">${seatTile('full')}<div class="info"><b>Full Seats</b><span class="per">${money(S.cur,S.cur.full)}/mo</span></div>${counter('mfull',modalTmp.full)}</div>
        <div class="seatpick">${seatTile('dept')}<div class="info"><b>Dept Seats</b><span class="per">${money(S.cur,S.cur.dept)}/mo</span></div>${counter('mdept',modalTmp.dept)}</div>
        <div class="modal-foot"><button class="btn btn-ghost" data-mclose>Cancel</button><button class="btn btn-primary" id="saveSeats">Save Changes</button></div></div>`;
    } else if (kind === 'cancel') {
      html = `<div class="modal modal-sm modal-pad" style="text-align:center"><div class="between"><span></span><button class="modal-close" data-mclose>×</button></div>
        <div style="font-size:46px;margin:6px 0">😔</div><h3 style="font-size:18px">Cancel subscription?</h3>
        <p class="muted" style="font-size:13.5px;margin-top:8px">You'll lose access to paid seats at the end of your billing cycle. This can't be undone.</p>
        <div class="modal-foot" style="flex-direction:column"><button class="btn btn-primary btn-block" data-mclose>Back</button><button class="btn btn-danger btn-block" id="confirmCancel">Cancel Subscription</button></div></div>`;
    } else if (kind === 'moveSeat') {
      html = `<div class="modal modal-sm modal-pad"><div class="modal-head"><h3>Move ${ctx} to Full Seats?</h3><button class="modal-close" data-mclose>×</button></div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:14px"><span class="avatar" style="width:42px;height:42px;border-radius:50%;background:#e5e7eb"></span><div><b>${ctx}</b><div class="muted" style="font-size:12px">Currently: Member Seat (Free)</div></div></div>
        <div class="seatcard blue" style="margin-top:14px;padding:14px"><div class="hd">${seatTile('full')}<div><b>Full Recruiter Seat</b><div class="muted" style="font-size:12px">${money(S.cur,S.cur.full)} / mo</div></div></div></div>
        <p class="muted" style="font-size:12.5px;margin-top:12px">You'll be charged a prorated amount for the rest of this billing cycle.</p>
        <div class="modal-foot"><button class="btn btn-ghost" data-mclose>Back</button><button class="btn btn-primary" id="confirmMove">Confirm</button></div></div>`;
    }
    $('#modalRoot').innerHTML = `<div class="overlay">${html}</div>`;
  }
  function closeModal(){ $('#modalRoot').innerHTML = ''; }

  /* ===================== TOAST ===================== */
  let toastT;
  function toast(msg, err) {
    const t = $('#toast'); t.textContent = '';
    const ic = err ? '⚠' : '✓';
    t.innerHTML = `<span>${ic}</span> ${msg}`;
    t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(toastT); toastT = setTimeout(() => t.className = 'toast' + (err?' err':''), 2600);
  }

  /* ===================== ROUTER / RENDER ===================== */
  function syncChrome() {
    const active = S.plan === 'active';
    $('#trialBanner').style.display = active ? 'none' : '';
    $('.side-trial').style.display = active ? 'none' : '';
    $('#seatBadge').textContent = active ? 'Full Seats' : 'Member Seats';
    $('#seatBadge').className = 'badge ' + (active ? 'badge-blue' : 'badge-gray');
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === S.view));
  }
  function render() {
    view.innerHTML = (Views[S.view] || Views.dashboard)();
    view.scrollTo?.(0, 0); window.scrollTo(0, 0);
    syncChrome(); buildDrawer();
  }
  function go(v) {
    if (!Views[v]) v = 'dashboard';
    S.view = v; S.curOpen = false;
    if (location.hash !== '#' + v) history.replaceState(null, '', '#' + v);
    render();
  }

  /* ===================== FLOW DRAWER ===================== */
  const FLOW = [
    { v:'dashboard', t:'Dashboard', d:'Trial overview & upgrade entry' },
    { v:'plan', t:'Plan & Pricing', d:'Seat calculator · currency · annual' },
    { v:'order', t:'Order Confirmation', d:'Review seats, promo, total' },
    { v:'billing', t:'Payment → Billing', d:'Active subscription & invoices' },
  ];
  const PAGES = [
    { v:'dashboard', t:'Dashboard — Home' },
    { v:'plan', t:'Plan & Pricing' },
    { v:'order', t:'Order Confirmation' },
    { v:'billing', t:'Subscription & Billing' },
    { v:'staff', t:'Staff Management' },
  ];
  const MDLS = [
    { k:'editSeats', t:'Edit Seats' },
    { k:'cancel', t:'Cancel Subscription' },
    { k:'moveSeat', t:'Move Member Seat', ctx:'Cody Fisher' },
  ];
  function buildDrawer() {
    const b = $('#flowBody'); if (!b) return;
    let h = '<div class="lbl">Upgrade flow</div>';
    FLOW.forEach((f, i) => {
      h += `<div class="flow-step ${S.view===f.v?'active':''}" data-go="${f.v}"><span class="n">${i+1}</span><div><div class="tt">${f.t}</div><div class="ds">${f.d}</div></div></div>`;
      if (i < FLOW.length - 1) h += '<div class="flow-conn"></div>';
    });
    h += '<div class="lbl">All pages</div>';
    PAGES.forEach(p => { h += `<div class="flow-pg ${S.view===p.v?'active':''}" data-go="${p.v}"><span class="dot"></span>${p.t}</div>`; });
    h += '<div class="lbl">Dialogs</div>';
    MDLS.forEach(m => { h += `<div class="flow-pg" data-modal="${m.k}" data-ctx="${m.ctx||''}"><span class="dot"></span>${m.t}</div>`; });
    b.innerHTML = h;
  }
  function openDrawer(o){ $('#flowDrawer').classList.toggle('open', o); $('#flowOverlay').classList.toggle('open', o); }

  /* ===================== EVENTS ===================== */
  document.addEventListener('click', (e) => {
    // hamburger -> toggle mobile sidebar drawer
    if (e.target.closest('.hamburger')) { sbOpen(!sidebarEl.classList.contains('open')); return; }
    if (e.target.classList && e.target.classList.contains('sidebar-backdrop')) { sbOpen(false); return; }

    const go_ = e.target.closest('[data-go]'); if (go_) { e.preventDefault(); go(go_.dataset.go); sbOpen(false); if (window.innerWidth < 900) openDrawer(false); return; }
    const to = e.target.closest('[data-toast]'); if (to) { toast(to.dataset.toast); return; }

    // counters
    const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
    if (inc || dec) {
      const key = (inc || dec).dataset[inc ? 'inc' : 'dec']; const delta = inc ? 1 : -1;
      if (key === 'full' || key === 'dept') { S[key] = Math.max(0, S[key] + delta); render(); }
      else if (key === 'mfull') { modalTmp.full = Math.max(0, modalTmp.full + delta); $('[data-cv="mfull"]').textContent = modalTmp.full; }
      else if (key === 'mdept') { modalTmp.dept = Math.max(0, modalTmp.dept + delta); $('[data-cv="mdept"]').textContent = modalTmp.dept; }
      return;
    }
    // currency
    if (e.target.closest('#curTrigger')) { S.curOpen = !S.curOpen; $('#curSelect').classList.toggle('open', S.curOpen); return; }
    const ci = e.target.closest('[data-cur]'); if (ci) { S.cur = CUR.find(c => c.code === ci.dataset.cur); S.curOpen = false; render(); return; }
    if (S.curOpen && !e.target.closest('#curSelect')) { S.curOpen = false; const cs = $('#curSelect'); if (cs) cs.classList.remove('open'); }

    // faq + sidebar submenu
    const q = e.target.closest('.faq-q'); if (q) { q.closest('.faq-item').classList.toggle('open'); return; }
    const sub = e.target.closest('.has-sub > .nav-item'); if (sub) { sub.parentElement.classList.toggle('open'); return; }

    // flow actions
    if (e.target.closest('#planUpgrade')) { if (S.full + S.dept > 0) go('order'); else toast('Add at least one seat to continue.', true); return; }
    if (e.target.closest('#payNow')) { S.plan = 'active'; S.bought = { full: S.full, dept: S.dept, cur: S.cur, annual: S.annual }; toast('Payment successful — your subscription is now active.'); go('billing'); return; }
    if (e.target.closest('#promoBtn')) { const v = $('#promoInput').value.trim(); S.promo = v; S.promoState = /beasiswa/i.test(v) ? 'ok' : (v ? 'fail' : ''); render(); return; }

    if (e.target.closest('#editSeats')) { openModal('editSeats'); return; }
    if (e.target.closest('#cancelSub')) { openModal('cancel'); return; }
    const mv = e.target.closest('.mv'); if (mv) { openModal('moveSeat', mv.dataset.member); return; }
    if (e.target.closest('#saveSeats')) { S.bought.full = modalTmp.full; S.bought.dept = modalTmp.dept; closeModal(); toast('Seats updated.'); render(); return; }
    if (e.target.closest('#confirmCancel')) { S.plan = 'trial'; S.bought = { full:0, dept:0, cur:S.cur, annual:false }; closeModal(); toast('Subscription cancelled.', true); go('billing'); return; }
    if (e.target.closest('#confirmMove')) { closeModal(); toast('Member moved to a Full Recruiter seat.'); return; }
    if (e.target.closest('[data-mclose]') || e.target.classList.contains('overlay')) { closeModal(); return; }

    // drawer
    if (e.target.closest('#flowTab')) { openDrawer(true); return; }
    if (e.target.closest('#flowClose') || e.target.closest('#flowOverlay')) { openDrawer(false); return; }
    const dm = e.target.closest('[data-modal]'); if (dm) { openDrawer(false); go(dm.dataset.modal === 'moveSeat' ? 'staff' : (dm.dataset.modal === 'cancel' || dm.dataset.modal === 'editSeats' ? 'billing' : S.view)); openModal(dm.dataset.modal, dm.dataset.ctx || 'Cody Fisher'); return; }
  });

  // toggles (change event)
  document.addEventListener('change', (e) => {
    if (e.target.id === 'annual') { S.annual = e.target.checked; render(); }
    if (e.target.id === 'annualO') { S.annual = e.target.checked; render(); }
  });

  window.addEventListener('hashchange', () => { const v = location.hash.replace('#',''); if (v && Views[v] && v !== S.view) go(v); });

  // init: sidebar drawer + accessible links
  sidebarEl = document.querySelector('.sidebar');
  sbBackdrop = document.createElement('div'); sbBackdrop.className = 'sidebar-backdrop';
  document.body.appendChild(sbBackdrop);
  document.querySelectorAll('a[data-go]').forEach(a => { if (!a.getAttribute('href')) a.setAttribute('href', '#' + a.dataset.go); });

  const start = location.hash.replace('#','');
  S.view = Views[start] ? start : 'dashboard';
  render();
})();
