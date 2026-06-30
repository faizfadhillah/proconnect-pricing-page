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
  const REG = [
    { k:'business', t:'Business Profile Details',           d:'Tell us about your company so we can set up your profile.' },
    { k:'rep',      t:'Company Representative Info',          d:"Provide your information as the company's point of contact." },
    { k:'branch',   t:'Headquarters and Branch Information',  d:"Please enter the details of your company's headquarters and branches." },
    { k:'team',     t:'Team Management',                      d:'Add, edit, and manage your team members information and roles. You can invite new staff and update existing member details anytime.' },
  ];;

  const S = {
    view: 'dashboard', cur: CUR[0], full: 0, dept: 0, annual: false, curOpen: false, regStep: 0,
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
    register() {
      const step = S.regStep || 0;
      const cur = REG[step];
      const eIc = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
      const tIc = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
      const userIc = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>';
      const calIc = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
      const searchIc = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#929393" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>';
      const F = (label, ctrl, req, hint) => `<div class="reg-field"><label class="reg-lab">${label}${req?'<span class="req"> *</span>':''}</label>${ctrl}${hint?`<div class="reg-hint">${hint}</div>`:''}</div>`;
      const inp = (ph, val) => `<input class="input" placeholder="${ph}" value="${val||''}">`;
      const sel = (ph, arr) => `<select class="select"><option value="" disabled selected hidden>${ph}</option>${arr.map(o=>`<option>${o}</option>`).join('')}</select>`;
      const ta = (ph) => `<textarea class="input" rows="3" placeholder="${ph}"></textarea>`;
      const upload = (btn) => `<div class="reg-upload"><span class="reg-up-ph">${userIc}</span><div><button class="btn btn-outline btn-sm" data-toast="Photo upload — coming soon.">${btn}</button><div class="reg-hint" style="margin-top:6px">Size recommendation: 400 x 400px</div></div></div>`;
      const verify = (ph) => `<div class="reg-verify">${inp(ph)}<button class="reg-verify-btn" data-toast="Verification link sent.">Verify</button></div>`;
      const checkIc = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>';
      const steps = `<div class="reg-vsteps">${REG.map((r,i)=>`<div class="reg-vstep ${i===step?'active':''} ${i<step?'done':''}" data-reg="${i}"><span class="rn">${i<step?checkIc:i+1}</span><span class="rl">${r.t}</span></div>`).join('')}</div>`;
      let headAction = '', form = '';
      if (cur.k==='business') form = `
        ${upload('Upload Company Photo')}
        ${F('Brand Name', inp('Your brand name, ie. ABC Hotel'), true)}
        ${F('Branch', inp('Please state your branch name'), true)}
        ${F('Company Name', inp('Your company name, ie. PT ABC'), true)}
        ${F('Industry', sel('Choose one that suits your company the most',['Tourism and Hospitality','Technology','Retail','Finance','Manufacturing']), true)}
        ${F('Company Description', ta('Explain about your company'), true)}
        ${F('Organization Type', sel('What is your organization type?',['Private','Government','NGO','Startup']))}
        ${F('Organization Size', sel('What is your organization size?',['1 - 10','11 - 50','51 - 200','200+']))}
        ${F('List of Department', sel('Select your Department',['HRD','Finance','IT','Marketing','Legal','Operation']))}
        ${F('Tagline', inp('Describe your company motto / tagline'))}
        ${F('Location', ta('Please state your address, city, and postal code (optional)'))}
        ${F('NPWP / TIN Number', inp('Input your NPWP / Tax ID Number (optional)'))}
        ${F('Upload Document NPWP / TIN Number', `<div class="reg-upload-row"><input class="input" placeholder="Upload your NPWP / Tax ID Number (optional)" readonly><button class="btn btn-outline btn-sm" data-toast="Upload — coming soon.">Upload</button></div>`)}
        ${F('Company Website', inp('Input your website (without https)'))}
        ${F('Company Email', verify('Input your general email address (optional)'))}
        ${F('Company Phone', verify('Input your general phone number (optional)'))}
        ${F('Status', `<input class="input" value="Unverified" readonly style="background:var(--bg);color:var(--muted)">`)}`;
      else if (cur.k==='rep') form = `
        ${upload('Upload Photo')}
        ${F('Full Name', inp('Input your full name'), true, 'Please use first letter capital')}
        ${F('Gender', sel('Select your Gender',['Male','Female','Prefer not to say']), true)}
        ${F('Date of Birth', `<div class="reg-verify">${inp('Select date of birth')}<span class="reg-cal">${calIc}</span></div>`, true)}
        ${F('Email', inp('Input email','bambang@seruam.com'), true)}
        ${F('Phone Number', inp('Input phone number'), true)}
        <div class="reg-field" style="display:flex;align-items:center;gap:12px"><label class="switch"><input type="checkbox"><span class="slider"></span></label><span style="font-weight:600;font-size:14px">Outside Indonesia?</span></div>
        ${F('City', sel('Select city',['Jakarta','Bandung','Surabaya','Semarang','Malang']), true)}
        ${F('Postal Code', inp('Input postal code'), true)}
        ${F('Location', ta('Please state your address, city, and postal code (optional)'))}`;
      else if (cur.k==='branch') { headAction = `<button class="btn btn-outline btn-sm" data-toast="Add branch — coming soon."><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Branch</button>`;
        form = `
        <div class="toolbar" style="margin:18px 0 14px"><div class="search">${searchIc}<input placeholder="Search name or email..."></div><select class="select" style="width:auto;min-width:190px"><option>Select Department</option><option>HRD</option><option>Finance</option><option>IT</option></select><button class="btn btn-outline btn-sm" data-toast="Filter applied.">Apply</button></div>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>No</th><th>Branch</th><th>Department</th><th>Location</th><th>Email</th><th>Phone Number</th><th style="text-align:right">Action</th></tr></thead><tbody>
          <tr><td>1</td><td>Headquarter</td><td style="font-size:12.5px;color:var(--muted)">Maintenance, IT, HRD, Marketing, Finance, Legal, Operation</td><td>Jakarta, Indonesia</td><td>info@seruam.com</td><td>081234567890</td><td style="text-align:right"><div class="tbl-actions" style="justify-content:flex-end"><button title="Edit">${eIc}</button><button title="Delete">${tIc}</button></div></td></tr>
        </tbody></table></div>`;
      }
      else {
        headAction = `<button class="btn btn-outline btn-sm" id="addTeam"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Invite New Member</button>`;
        const mvIc2 = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1560bd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 3-5 6-5"/><polyline points="16 11 19 14 16 17"/><line x1="13" y1="14" x2="19" y2="14"/></svg>';
        const rb = { owner:'badge-red', hrd:'badge-blue', member:'badge-gray' };
        const tm = [
          ['Bambang Setiawan','bambang@seruam.com','Headquarters','Human Resource','HRD','owner','Owner'],
          ['Brooklyn Simmons','brocklyns@seruam.com','Bandung','Human Resource','HRD','hrd','HRD'],
          ['Cody Fisher','codyf@seruam.com','Bandung','IT','Backend','member','Member'],
          ['Avery Johnson','averyj@seruam.com','Bandung','Finance','Accounting','member','Member'],
          ['Taylor Martinez','taylorm@seruam.com','Bandung','IT','IT Support','member','Member'],
          ['Riley Patel','rileyp@seruam.com','Bandung','Support','Customer Service','member','Member'],
          ['Peyton Robinson','peytonr@seruam.com','Bandung','Legal','Legal','member','Member'],
          ['Jamie Garcia','jamie@seruam.com','Bandung','Research','Business Analysis','member','Member'],
          ['Quinn Adams','quinna@seriuam.com','Bandung','IT','Quality Assurance','member','Member'],
          ['Ashley Torres','ashleyt@seriuam.com','Bandung','IT','Web Development','member','Member'],
        ];
        form = `
        <div class="toolbar" style="margin:18px 0 14px"><div class="search">${searchIc}<input placeholder="Search name or email..."></div><select class="select" style="width:auto;min-width:170px"><option>Select Branch</option><option>Headquarters</option><option>Bandung</option><option>Malaysia</option></select><select class="select" style="width:auto;min-width:150px"><option>Select Role</option><option>Owner</option><option>HRD</option><option>Member</option></select><button class="btn btn-outline btn-sm" data-toast="Filter applied.">Apply</button></div>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>No</th><th>Name</th><th>Email</th><th>Branch</th><th>Departement</th><th>Job Title</th><th>Role</th><th style="text-align:right">Action</th></tr></thead><tbody>
          ${tm.map((m,i)=>`<tr><td>${i+1}</td><td><div class="cell-user"><img class="avatar" src="assets/p${(i%6)+1}.jpg" alt=""><div class="nm">${m[0]}${i===0?' (you)':''}</div></div></td><td>${m[1]}</td><td>${m[2]}</td><td>${m[3]}</td><td>${m[4]}</td><td><span class="badge ${rb[m[5]]}">${m[6]}</span></td><td style="text-align:right"><div class="tbl-actions" style="justify-content:flex-end"><button title="Edit">${eIc}</button>${i===0?`<button title="Manage seat">${mvIc2}</button>`:`<button title="Delete">${tIc}</button>`}</div></td></tr>`).join('')}
        </tbody></table></div>
        <div class="between" style="margin-top:18px"><div style="display:flex;align-items:center;gap:10px;font-size:13px;color:var(--muted)">Item Per page <select class="select" style="width:auto;padding:6px 30px 6px 12px"><option>10</option><option>25</option><option>50</option></select></div><div class="pager"><button>«</button><button>‹</button><button class="active">1</button><button>2</button><button>3</button><button>…</button><button>99</button><button>›</button><button>»</button></div></div>`;
      }
      return `
      <div class="reg-wrap">
        ${steps}
        <div class="card card-pad${(cur.k==='business'||cur.k==='rep')?' reg-narrow':''}">
          <div class="between" style="align-items:flex-start"><div><div class="section-title" style="font-size:18px">${cur.t}</div><p class="muted" style="font-size:13px;margin-top:4px">${cur.d}</p></div>${headAction}</div>
          <div style="height:1px;background:var(--line);margin:18px 0"></div>
          ${form}
        </div>
      </div>
      <div class="reg-foot">
        <button class="btn btn-outline" ${step===0?'disabled':''} id="regBack">Back</button>
        <button class="btn btn-primary" id="regNext">${step===REG.length-1?'Submit':'Next'}</button>
      </div>`;
    },
        dashboard() {
      const trial = S.plan === 'trial';
      return `
      <h1 class="page-title">Hello Faiz</h1><p class="page-sub">Get Started Finding Something</p>
      <div class="stat-grid" style="margin-top:22px">
        <div class="stat-card"><div class="label">Total Country</div><div class="value">2</div></div>
        <div class="stat-card"><div class="label">Total Branch</div><div class="value">2</div></div>
        <div class="stat-card"><div class="label">Total Member</div><div class="value">14</div></div>
        <div class="stat-card"><div class="label">Total Active Jobs</div><div class="value">0</div></div>
      </div>
      <div class="card card-pad" style="margin-top:18px">
        <div class="between"><div><div class="section-title">Profile Completion</div><div class="muted" style="margin-top:4px">4 of 4 steps completed</div></div><button class="btn btn-outline btn-sm">Edit</button></div>
        <div class="grid" style="grid-template-columns:repeat(4,1fr);margin-top:18px">
          ${['Business Profile Details','Company Representative Info','Headquarters and Branch Information','Team Management'].map(t=>`<div style="display:flex;align-items:center;gap:10px;background:var(--blue-soft-2);border-radius:12px;padding:14px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1560bd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 9"/></svg><b style="color:var(--blue);font-size:13px;font-family:'Montserrat'">${t}</b></div>`).join('')}
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

      <div class="calc-head">
        <div><h2 class="section-title">Calculate Your Monthly Cost</h2><p class="muted" style="font-size:13.5px;margin-top:4px">Select country first to apply seats, it's to effect to price</p></div>
        <div class="calc-cur-row">
          <span class="calc-cur-label">Currency :</span>
          <div class="cur-select ${S.curOpen?'open':''}" id="curSelect">
            <button class="cur-trigger" id="curTrigger"><span class="flag">${S.cur.flag}</span><span>(${S.cur.code}) ${S.cur.name}</span><svg class="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></button>
            <ul class="cur-menu">
              <li class="cur-search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#929393" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="curSearch" placeholder="Search here..." autocomplete="off"></li>
              ${CUR.map(c=>`<li data-cur="${c.code}" class="${c.code===S.cur.code?'active':''}"><span class="flag">${c.flag}</span><span>(${c.code}) ${c.name}</span></li>`).join('')}
            </ul>
          </div>
          <button class="icon-box" style="border-color:var(--blue)" data-toast="Prices are localised to each market — taxes and purchasing power." aria-label="Currency info"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1560bd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
        </div>
      </div>
      <div class="calc-grid">
        <div class="calc-left">
          ${curItem('Full Recruiter Seats','full','full', money(S.cur,S.cur.full))}
          ${curItem('Department Seats','dept','dept', money(S.cur,S.cur.dept))}
          <div class="seatpick" style="background:var(--bg)">${seatTile('member')}<div class="info"><b>Member Seats</b><span class="per">FREE</span></div><span class="unlimited">Unlimited</span></div>
        </div>
        <div class="summary">
          <h3>Calculation Summary</h3><p class="sub">This calculation works on all type seats</p>
          <div class="seats"><div><span class="lbl">Full seats</span><div class="val">${S.full} seats</div></div><div><span class="lbl">Dept seats</span><div class="val">${S.dept} seats</div></div></div>
          <div class="total"><span class="cur">${S.cur.code}</span><span class="amt">${fmt(total,S.cur.sep)}</span><span class="mo">/mo</span></div>
          <div class="tog"><span class="save-badge" ${S.annual?'':'hidden'}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Save 10%</span><label class="switch"><input type="checkbox" id="annual" ${S.annual?'checked':''}><span class="slider"></span></label><span style="font-size:14px">Annual</span></div>
          <button class="btn btn-primary btn-block btn-lg" style="margin-top:18px" id="planUpgrade">Upgrade Now</button>
        </div>
      </div>

      <div class="card" style="margin-top:22px;padding:6px"><div class="table-wrap"><table class="tbl" style="min-width:560px"><thead><tr><th>Feature</th><th style="text-align:center">Free Seats</th><th style="text-align:center">Dept Seat</th><th style="text-align:center">Full Seat</th></tr></thead><tbody>
        ${[['Business Profile','—','—','✓'],['Comp Rep','—','—','✓'],['HQ & Branch Management','—','—','✓'],['Team Management','Self','Same Department Only','All Departments'],['Manage Jobs','—','✓','✓'],['Find Candidate','—','✓','✓'],['Manage Profile','✓','✓','✓'],['Job Posting','—','Unlimited','Unlimited'],['Type Profile','—','Department Profile','All Profile'],['Type Branch','—','Dept List','HQ & Branch List'],['Support Level','Email','Email','Priority 24/7']].map(r=>`<tr><td>${r[0]}</td><td style="text-align:center">${cell(r[1])}</td><td style="text-align:center">${cell(r[2])}</td><td style="text-align:center">${cell(r[3])}</td></tr>`).join('')}
      </tbody></table></div></div>

      <div class="card" style="margin-top:22px;background:linear-gradient(135deg,#1560bd 0%,#042648 100%);color:#fff;text-align:center;padding:30px 22px;border:none">
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
      const promo = S.promoState === 'ok' ? sub * 0.05 : 0;
      const grand = Math.max(0, sub - disc - promo);
      const _now = new Date();
      const _dim = new Date(_now.getFullYear(), _now.getMonth()+1, 0).getDate();
      const _daysLeft = _dim - _now.getDate() + 1;
      const firstMonth = grand * _daysLeft / _dim;
      const promoBorder = S.promoState === 'fail' ? 'var(--red)' : (S.promoState === 'ok' ? 'var(--green)' : 'var(--line)');
      return `
      <h1 class="page-title">Confirmation Order</h1><p class="page-sub">Review your seats and confirm payment</p>
      <div class="order-grid" style="margin-top:22px">
        <div class="card card-pad">
          <div class="section-title" style="font-size:16px">Seats Detail</div><p class="muted" style="font-size:13px;margin-top:2px">Add or remove seats to match your hiring needs</p>
          <div style="height:1px;background:var(--line);margin:16px 0"></div>
          <div class="seatpick" style="margin-top:0;border-radius:14px;padding:16px">${seatTile('full',46)}<div class="info"><b style="font-size:16px">Full Recruiter Seats</b><span class="per" style="font-size:12.5px;color:var(--muted);margin-top:4px">${money(S.cur,S.cur.full)}</span><span class="per" style="font-size:12px">Per user</span></div><span style="margin-left:auto;font-weight:700;font-size:18px">${S.full}</span></div>
          <div class="seatpick" style="border-radius:14px;padding:16px">${seatTile('dept',46)}<div class="info"><b style="font-size:16px">Department Seats</b><span class="per" style="font-size:12.5px;color:var(--muted);margin-top:4px">${money(S.cur,S.cur.dept)}</span><span class="per" style="font-size:12px">Per user</span></div><span style="margin-left:auto;font-weight:700;font-size:18px">${S.dept}</span></div>
        </div>
        <div class="card card-pad">
          <div class="section-title" style="font-size:16px">Order Summary</div><p class="muted" style="font-size:13px;margin-top:2px">This is summary based on your seats</p>
          <div style="height:1px;background:var(--line);margin:16px 0"></div>
          <div class="promo-box" style="display:flex;align-items:center;border:1px solid ${promoBorder};border-radius:10px;padding:0 4px 0 14px;transition:border-color .15s">
            <input id="promoInput" placeholder="Enter promo code" value="${S.promo}" style="flex:1;border:none;outline:none;font:600 14px 'Montserrat';background:none;padding:14px 0;color:var(--ink)">
            <span style="width:1px;height:24px;background:var(--line)"></span>
            <button id="promoBtn" style="background:none;border:none;cursor:pointer;color:var(--blue);font:600 14px 'Montserrat';padding:12px 14px;white-space:nowrap">Cek Promo</button>
          </div>
          <div class="total" style="display:flex;align-items:flex-end;gap:6px;margin-top:18px">
            <span style="font-size:15px;font-weight:700;align-self:flex-start;margin-top:2px">${S.cur.code}</span>
            <span style="font-size:30px;font-weight:800;font-family:'Montserrat';letter-spacing:-.02em;line-height:1">${fmt(grand,S.cur.sep)}</span>
            <span style="font-size:14px;color:var(--muted)">/mo</span>
          </div>
          <div class="tog" style="display:flex;align-items:center;margin-top:16px"><span class="save-badge" ${S.annual?'':'hidden'} style="color:var(--green);background:#e8f6ee;margin-right:auto"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Save 10%</span><label class="switch"><input type="checkbox" id="annualO" ${S.annual?'checked':''}><span class="slider"></span></label><span style="font-size:14px;margin-left:10px">Annual</span></div>
          <div style="height:1px;background:var(--line);margin:16px 0"></div>
          <button class="btn btn-primary btn-block btn-lg" id="payNow">Pay Now</button>
          <div class="muted" style="font-size:12px;margin-top:12px;text-align:center;line-height:1.7"><div>1st month (prorated): <b style="color:var(--ink)">${money(S.cur, firstMonth)}</b></div><div>Next month: ${money(S.cur, grand)} (full rate)</div><div>Billed every month on the 1st</div></div>
        </div>
      </div>`;
    },

    billing() {
      const active = S.plan === 'active';
      const b = S.bought;
      const total = b.annual ? monthly(b.full,b.dept,b.cur)*(1-DISC) : monthly(b.full,b.dept,b.cur);
      const price = active ? money(b.cur, total) : `${S.cur.code} 0`;
      const dl = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
      const planLines = active ? `- Full seats (${b.full})<br>- Dept seats (${b.dept})` : 'Free Seats';
      const invoices = active
        ? [['INV-20','Jun 1, 2026',price,'Paid',planLines],['INV-19','May 1, 2026',price,'Paid',planLines],['INV-18','Apr 1, 2026',`${S.cur.code} 0`,'Paid','Free Seats']]
        : [];
      return `
      <h1 class="page-title">Subscription &amp; Billing</h1><p class="page-sub">Manage your subscription and billing details here.</p>
      <div class="grid" style="grid-template-columns:1.35fr 1fr;margin-top:16px;align-items:start">
        <div class="card card-pad">
          <div class="between"><div><div class="section-title" style="font-size:16px">Current Subscription</div><p class="muted" style="font-size:13px;margin-top:2px">${active?'You are currently in Plan':'You are currently in Trial Plan'}</p></div>
            <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-outline btn-sm" id="changeCycle">Change Cycle</button>${active?`<button class="btn btn-outline btn-sm" id="editSeats">Edit seats</button>`:`<button class="btn btn-outline btn-sm" data-go="plan">Upgrade <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></button>`}</div></div>
          <div style="display:flex;gap:14px;margin-top:16px;flex-wrap:wrap">
            <div style="flex:1;min-width:170px;background:var(--bg);border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px">${seatTile('full',42)}<div><b style="font-size:15px">Full Seats</b><div class="muted" style="font-size:12px;margin-top:2px">${active?b.full:0} seats</div></div><b style="margin-left:auto;font-size:14px">${active?Math.max(0,b.full-(b.full?4:0)):0} Avail</b></div>
            <div style="flex:1;min-width:170px;background:var(--bg);border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px">${seatTile('dept',42)}<div><b style="font-size:15px">Dept Seats</b><div class="muted" style="font-size:12px;margin-top:2px">${active?b.dept:0} seats</div></div><b style="margin-left:auto;font-size:14px">${active?Math.max(0,b.dept-(b.dept?1:0)):0} Avail</b></div>
          </div>
          <div style="display:flex;gap:14px;margin-top:14px;align-items:stretch">
            <div style="flex:1;background:var(--bg);border-radius:12px;padding:14px 16px"><div class="muted" style="font-size:12px">${active?'Total Price':'Price'}</div><b style="font-size:15px">${price}</b></div>
            <div style="flex:1;background:var(--bg);border-radius:12px;padding:14px 16px"><div class="muted" style="font-size:12px">Next Billing</div><b style="font-size:15px">${active?'Feb 28, 2026':'-'}</b></div>
            ${active?`<button class="btn btn-danger" id="cancelSub" style="white-space:nowrap">Cancel Subscription</button>`:''}
          </div>
        </div>
        <div class="card card-pad">
          <div class="section-title" style="font-size:16px">Payment Method</div><p class="muted" style="font-size:13px;margin-top:2px">Manage your payment detials</p>
          <div style="height:1px;background:var(--line);margin:14px 0"></div>
          <div style="border:1px solid var(--line);border-radius:12px;padding:16px;display:flex;align-items:center;gap:14px"><span style="display:inline-flex;align-items:center;flex:none"><svg width="56" height="20" viewBox="0 0 64 22" xmlns="http://www.w3.org/2000/svg"><text x="0" y="17" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" font-style="italic" fill="#1A1F71" letter-spacing="0.5">VISA</text><rect x="1" y="19" width="62" height="2.4" fill="#F7B600"/></svg></span><div><b style="letter-spacing:1px">**** **** **** 3627</b><div class="muted" style="font-size:12px;margin-top:2px">Expiry 02/26</div></div></div>
          <button class="btn btn-outline btn-block" style="margin-top:18px">Update Payment Method</button>
        </div>
      </div>
      <div class="card card-pad" style="margin-top:18px">
        <div class="between"><div><div class="section-title" style="font-size:16px">Invoice</div><p class="muted" style="font-size:13px;margin-top:2px">View your previous invoices/</p></div><button class="btn btn-outline btn-sm">${dl} Download All</button></div>
        <div class="table-wrap" style="margin-top:14px"><table class="tbl invoice-tbl"><thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th><th>Plan</th><th style="text-align:right">Action</th></tr></thead><tbody>
          ${invoices.length?invoices.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td><span class="badge ${r[3]==='Paid'?'badge-green':'badge-red'}">${r[3]}</span></td><td style="font-size:12.5px;color:var(--ink-2)">${r[4]}</td><td style="text-align:right"><button class="tbl-actions">${dl}</button></td></tr>`).join(''):`<tr><td colspan="6" style="text-align:center;padding:40px 20px"><div style="font-family:'Montserrat';font-weight:700;font-size:16px">Oops</div><div class="muted" style="font-size:13px;margin-top:4px">Oops you don't have any invoice yet</div><button class="btn btn-outline btn-sm" data-go="plan" style="margin-top:14px">Upgrade Now <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></button></td></tr>`}
        </tbody></table></div>
        ${invoices.length?`<div class="between" style="margin-top:16px"><div style="display:flex;align-items:center;gap:10px;font-size:13px;color:var(--muted)">Item Per page <select class="select" style="width:auto;padding:6px 30px 6px 12px"><option>10</option><option>25</option><option>50</option></select></div><div class="pager"><button>«</button><button>‹</button><button class="active">1</button><button>2</button><button>3</button><button>…</button><button>99</button><button>›</button><button>»</button></div></div>`:''}
      </div>`;
    },

    staff() {
      const members = [
        ['Bambang Setiawan','bambang@seruam.com','HRD HQ','full','Active'],
        ['Brooklyn Simmons','brocklyns@seruam.com','PIC Branch','full','Active'],
        ['Cody Fisher','codyf@seruam.com','Member','member','Non Active'],
        ['Avery Johnson','averyj@seruam.com','HRD HQ','full','Active'],
        ['Taylor Martinez','taylorm@seruam.com','Dept Head Branch','dept','Active'],
      ];
      const roleIc = { full:'#1560bd', dept:'#1e9e5a', member:'#9ca3af' };
      const seatChip = c => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-left:6px"><path d="M2 9 12 4l10 5-10 5L2 9z"/></svg>`;
      const editIc = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`;
      const mvIc = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 3-5 6-5"/><polyline points="16 11 19 14 16 17"/><line x1="13" y1="14" x2="19" y2="14"/></svg>`;
      return `
      <h1 class="page-title">Staff Management</h1><p class="page-sub">Manage your team members and their roles</p>
      <div class="row" style="margin-top:18px;gap:14px;flex-wrap:wrap">
        ${[['Total Seats',(S.plan==='active'?S.bought.full+S.bought.dept+12:'12'),'member'],['Full Seats',(S.plan==='active'?S.bought.full:5),'full'],['Dept Seats',(S.plan==='active'?S.bought.dept:1),'dept'],['Free Seats',5,'member']].map(([a,n,k])=>`<div class="card" style="flex:1;min-width:160px;padding:16px;display:flex;align-items:center;gap:12px">${seatTile(k,40)}<div><div class="muted" style="font-size:12.5px">${a}</div><div style="font-size:22px;font-weight:800;font-family:'Montserrat';margin-top:2px">${n}</div></div></div>`).join('')}
      </div>
      <div class="card card-pad" style="margin-top:18px">
        <div class="between" style="margin-bottom:14px"><div><div class="section-title" style="font-size:16px">Team Members</div><p class="muted" style="font-size:13px;margin-top:2px">Add, edit and manage your staff and their roles</p></div><button class="btn btn-outline btn-sm" data-toast="Invite link copied — share it with your teammate."><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Invite Member</button></div>
        <div class="toolbar" style="margin-bottom:12px"><div class="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg><input placeholder="Search name or email"></div><select class="select" style="width:auto;min-width:150px"><option>Select Role</option><option>Full Seats</option><option>Dept Seats</option><option>Free Seats</option></select><button class="btn btn-outline btn-sm" data-toast="Filter applied.">Apply</button></div>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>No</th><th>Name</th><th>Role</th><th>Role Status</th><th style="text-align:right">Action</th></tr></thead><tbody>
          ${members.map((m,i)=>`<tr><td>${i+1}</td><td><div class="cell-user"><img class="avatar" src="assets/p${(i%6)+1}.jpg" alt=""><div><div class="nm">${m[0]}</div><div class="em">${m[1]}</div></div></div></td><td>${m[2]}${m[3]!=='member'?seatChip(roleIc[m[3]]):''}</td><td>${m[4]==='Active'?`<span class="badge badge-blue">✓ Active</span>`:`<span class="badge badge-red">✕ Non Active</span>`}</td><td style="text-align:right"><div class="tbl-actions" style="justify-content:flex-end"><button class="ed" data-member="${m[0]}" data-role="${m[2]}" data-status="${m[4]}" title="Edit">${editIc}</button><button class="mv" data-member="${m[0]}" title="Move seat">${mvIc}</button></div></td></tr>`).join('')}
        </tbody></table></div>
        <div class="between" style="margin-top:16px"><div style="display:flex;align-items:center;gap:10px;font-size:13px;color:var(--muted)">Item Per page <select class="select" style="width:auto;padding:6px 30px 6px 12px"><option>10</option><option>25</option><option>50</option></select></div><div class="pager"><button>«</button><button>‹</button><button class="active">1</button><button>2</button><button>3</button><button>…</button><button>99</button><button>›</button><button>»</button></div></div>
      </div>`;
    },
  };

  function actionCard(t, d, btn) {
    return `<div class="card card-pad"><div class="between"><div style="display:flex;gap:12px"><span style="color:var(--ink-2);margin-top:2px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg></span><div><b style="font-size:15px;font-family:'Montserrat'">${t}</b><div class="muted" style="font-size:13px;margin-top:4px">${d}</div></div></div><button class="btn btn-outline btn-sm" data-toast="${t} — coming soon in this prototype.">${btn}</button></div></div>`;
  }
  function cell(v){ return v==='✓'?'<span style="color:var(--green);font-weight:700">✓</span>':v==='—'?'<span style="color:var(--light)">—</span>':`<span class="muted" style="font-size:12.5px">${v}</span>`; }
  function faq(q,a,open){ return `<div class="faq-item${open?' open':''}"><button class="faq-q">${q}<svg class="faq-ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button><div class="faq-a"><p>${a}</p></div></div>`; }

  /* ===================== MODALS ===================== */
  let modalTmp = {};
  function openModal(kind, ctx) {
    let html = '';
    if (kind === 'editSeats' || kind === 'removeSeats') {
      modalTmp = { full: S.bought.full, dept: S.bought.dept };
      const avF = Math.max(0, S.bought.full - (S.bought.full ? 4 : 0));
      const avD = Math.max(0, S.bought.dept - (S.bought.dept ? 1 : 0));
      const canRemove = modalTmp.full + modalTmp.dept > 0;
      const banner = kind === 'removeSeats'
        ? `To remove the seats only for the available seat, please setting your seats member first <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1560bd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;margin-left:auto"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`
        : `To remove the seats only for the available seat`;
      const seatBox = (kind2, label, av, key, val) => `<div style="flex:1;min-width:0;border:1px solid var(--line);border-radius:14px;padding:14px">
        <div style="display:flex;align-items:center;gap:12px;background:var(--bg);border-radius:10px;padding:12px">${seatTile(kind2,42)}<div><b style="font-size:15px">${label}</b><div class="muted" style="font-size:12.5px;margin-top:2px">${av} Avail</div></div></div>
        <div class="seat-counter-wrap">${counter(key,val)}</div></div>`;
      html = `<div class="modal modal-pad" style="max-width:560px"><div class="modal-head"><h3>Edit Seats</h3><button class="modal-close" data-mclose>×</button></div>
        <div style="display:flex;align-items:center;gap:12px;background:var(--blue-soft-2);border-radius:10px;padding:14px 16px;margin-top:18px;font-size:13.5px;color:var(--ink-2)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1560bd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><span style="flex:1">${banner}</span></div>
        <p style="text-align:center;font-weight:700;font-family:'Montserrat';font-size:15px;margin-top:20px">Select seats to remove</p>
        <div style="display:flex;gap:16px;margin-top:14px">
          ${seatBox('full','Full Seats',avF,'mfull',modalTmp.full)}
          ${seatBox('dept','Dept Seats',avD,'mdept',modalTmp.dept)}
        </div>
        <div class="modal-foot"><button class="btn btn-outline" data-mclose>Cancel</button><button class="btn" id="saveSeats" ${canRemove?'':'disabled'} style="${canRemove?'background:var(--red);color:#fff;border-color:var(--red)':'background:#b8bcc4;color:#fff;border-color:#b8bcc4;cursor:not-allowed'}">Remove Seats</button></div></div>`;
    } else if (kind === 'cancel') {
      html = `<div class="modal modal-sm modal-pad" style="text-align:center"><div class="between" style="margin-bottom:6px"><span></span><button class="modal-close" data-mclose>×</button></div>
        <span style="display:inline-flex;width:78px;height:78px;border-radius:50%;border:3px solid var(--red);align-items:center;justify-content:center;margin:8px auto 0"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="M8 16c1-1.5 2.5-2 4-2s3 .5 4 2"/></svg></span>
        <h3 style="font-size:19px;margin-top:18px">Do you want to Cancel your plan?</h3>
        <p class="muted" style="font-size:14px;margin-top:8px">Are you sure you want to cancel plan?</p>
        <div class="modal-foot" style="flex-direction:column"><button class="btn btn-block" id="confirmCancel" style="background:var(--red);color:#fff;border-color:var(--red)">Cancel subscription</button><button class="btn btn-outline btn-block" data-mclose>Back</button></div></div>`;
    } else if (kind === 'moveSeat') {
      html = `<div class="modal modal-sm modal-pad"><div class="modal-head"><h3>Move ${ctx} to Full Seats?</h3><button class="modal-close" data-mclose>×</button></div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:16px"><span class="avatar" style="width:42px;height:42px;border-radius:50%;background:#e5e7eb"></span><div><b>${ctx}</b><div class="muted" style="font-size:12px">Currently: Member Seat (Free)</div></div></div>
        <p class="muted" style="font-size:12.5px;margin-top:14px">Assign an available seat to this member.</p>
        <div class="seatcard blue" style="margin-top:10px;padding:14px"><div class="hd">${seatTile('full')}<div><b>Full Recruiter Seat</b><div class="muted" style="font-size:12px">${money(S.cur,S.cur.full)} / mo</div></div></div></div>
        <div class="seatcard green" style="margin-top:10px;padding:14px"><div class="hd">${seatTile('dept')}<div><b>Department Head Seat</b><div class="muted" style="font-size:12px">${money(S.cur,S.cur.dept)} / mo</div></div></div></div>
        <p class="muted" style="font-size:12.5px;margin-top:12px">You'll be charged a prorated amount for the rest of this billing cycle.</p>
        <div class="modal-foot"><button class="btn btn-outline" data-mclose>Back</button><button class="btn btn-primary" id="confirmMove">Confirm</button></div></div>`;
    } else if (kind === 'changeCycle') {
      const b = S.bought;
      if (modalTmp.cycle === undefined) modalTmp = { cycle: b.annual ? 'yearly' : 'monthly' };
      const mMon = monthly(b.full, b.dept, b.cur);
      const mYrPerMo = mMon * (1 - DISC);
      const yrBilled = mMon * 12 * (1 - DISC);
      const sel = modalTmp.cycle;
      const card = (key,label,priceLine,note,badge) => `<div data-cycle="${key}" style="cursor:pointer;display:flex;align-items:center;gap:12px;border:${sel===key?'1.5px solid var(--blue)':'1px solid var(--line)'};background:${sel===key?'var(--blue-soft)':'#fff'};border-radius:12px;padding:14px 16px;margin-top:12px">
        <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><b style="font-size:14px">${label}</b>${badge?`<span style="background:#e7f5ed;color:#208f4f;font-weight:600;font-size:11px;padding:2px 8px;border-radius:6px">${badge}</span>`:''}</div><div style="font-size:13px;font-weight:500;margin-top:4px">${priceLine}</div>${note?`<div class="muted" style="font-size:12px;margin-top:2px">${note}</div>`:''}</div>
        <span style="width:20px;height:20px;border-radius:50%;flex:none;border:${sel===key?'none':'1.5px solid var(--line)'};background:${sel===key?'var(--blue)':'#fff'};display:flex;align-items:center;justify-content:center">${sel===key?'<span style="width:8px;height:8px;border-radius:50%;background:#fff"></span>':''}</span></div>`;
      html = `<div class="modal modal-sm modal-pad"><div class="modal-head"><h3>Change Billing Cycle</h3><button class="modal-close" data-mclose>×</button></div>
        <p class="muted" style="font-size:13.5px;margin-top:4px">Switch between monthly and yearly billing.</p>
        ${card('monthly','Monthly', money(b.cur,mMon)+' / month','','')}
        ${card('yearly','Yearly', money(b.cur,mYrPerMo)+' / month','Billed '+money(b.cur,yrBilled)+' yearly','Save 10%')}
        <div class="modal-foot"><button class="btn btn-outline" data-mclose>Cancel</button><button class="btn btn-primary" id="confirmCycle">Confirm Change</button></div></div>`;
    } else if (kind === 'editMember') {
      const m = modalTmp;
      const lbl = (t) => `<label style="display:block;font-size:13px;font-weight:600;color:var(--ink);margin:0 0 6px">${t}<span style="color:#ef4444"> *</span></label>`;
      const opt = (v,cur) => `<option ${v===cur?'selected':''}>${v}</option>`;
      html = `<div class="modal modal-pad" style="max-width:600px"><div class="modal-head"><h3>Edit Member</h3><button class="modal-close" data-mclose>×</button></div>
        <p class="muted" style="font-size:13px;margin-top:2px">Update ${m.name}'s placement, role and status.</p>
        <b style="display:block;font-size:15px;margin-top:18px">Team Role</b>
        <div class="form-grid-2" style="margin-top:14px">
          <div>${lbl('Placement Branch')}<select class="select">${['Semarang','Jakarta HQ','Surabaya'].map(v=>opt(v,'Semarang')).join('')}</select></div>
          <div>${lbl('Role')}<select class="select"><optgroup label="Full Seats">${opt('PIC Branch',m.role)}${opt('HRD Branch',m.role==='HRD HQ'?'HRD Branch':m.role)}</optgroup><optgroup label="Dept Seats">${opt('Dept Head HQ',m.role)}${opt('Dept Head Branch',m.role)}</optgroup><optgroup label="Free Seats">${opt('Member',m.role)}</optgroup></select></div>
          <div>${lbl('Department')}<select class="select">${['Human Resource','Finance','Operations'].map(v=>opt(v,'Human Resource')).join('')}</select></div>
          <div>${lbl('Employee Type')}<select class="select">${['Full Time','Part Time','Contract'].map(v=>opt(v,'Full Time')).join('')}</select></div>
          <div>${lbl('End Date')}<input class="input" type="text" placeholder="Select end date"></div>
          <div>${lbl('Status')}<select class="select">${opt('Active',m.status)}${opt('Non Active',m.status==='Active'?'Active':'Non Active')}</select></div>
        </div>
        <div class="modal-foot"><button class="btn btn-outline" data-mclose>Cancel</button><button class="btn btn-primary" id="saveMember">Save Changes</button></div></div>`;
    } else if (kind === 'addTeam') {
      const F = (label, ctrl, req, hint) => `<div class="reg-field"><label class="reg-lab">${label}${req?'<span class="req"> *</span>':''}</label>${ctrl}${hint?`<div class="reg-hint">${hint}</div>`:''}</div>`;
      const inp = (ph) => `<input class="input" placeholder="${ph}">`;
      const sel = (ph,arr) => `<select class="select"><option value="" disabled selected hidden>${ph}</option>${arr.map(o=>`<option>${o}</option>`).join('')}</select>`;
      const cal = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
      html = `<div class="modal modal-pad" style="max-width:520px"><div class="modal-head"><h3>Add Team Member</h3><button class="modal-close" data-mclose>×</button></div>
        <div style="margin-top:16px">
        ${F('Full Name', inp('Input your full name'), true, 'Please use first letter capital')}
        ${F('Gender', sel('Select your gender',['Male','Female','Prefer not to say']), true)}
        ${F('Date of Birth', `<div class="reg-verify">${inp('Select date of birth')}<span class="reg-cal">${cal}</span></div>`, true)}
        ${F('Email', inp('Input email'), true)}
        ${F('Phone Number', inp('Input phone number'), true)}
        <div class="reg-field" style="display:flex;align-items:center;gap:12px"><label class="switch"><input type="checkbox"><span class="slider"></span></label><span style="font-weight:600;font-size:14px">Outside Indonesia?</span></div>
        ${F('City', sel('Select city',['Jakarta','Bandung','Surabaya','Semarang']), true)}
        ${F('Postal Code', inp('Input postal code'), true)}
        ${F('Address', `<textarea class="input" rows="3" placeholder="Please state your address, city, and postal code (optional)"></textarea>`)}
        </div>
        <div class="modal-foot"><button class="btn btn-outline" data-mclose>Cancel</button><button class="btn btn-primary" id="saveTeam">Add Member</button></div></div>`;
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
    const reg = S.view === 'register';
    document.querySelector('.app-body').classList.toggle('reg-mode', reg);
    $('#trialBanner').style.display = (active || reg) ? 'none' : '';
    $('.side-trial').style.display = active ? 'none' : '';
    $('#seatBadge').textContent = active ? 'Full Seats' : 'Member Seats';
    $('#seatBadge').className = 'badge ' + (active ? 'badge-blue' : 'badge-gray');
    const pb = document.getElementById('planBadge'); if (pb) pb.textContent = active ? 'Full Seats' : 'Free Seats';
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
    { v:'register', t:'Registration (4 steps)' },
    { v:'dashboard', t:'Dashboard — Home' },
    { v:'plan', t:'Plan & Pricing' },
    { v:'order', t:'Order Confirmation' },
    { v:'billing', t:'Subscription & Billing' },
    { v:'staff', t:'Staff Management' },
  ];
  const MDLS = [
    { k:'editSeats', t:'Edit Seats' },
    { k:'removeSeats', t:'Remove Seats' },
    { k:'cancel', t:'Cancel Subscription' },
    { k:'moveSeat', t:'Move Member Seat', ctx:'Cody Fisher' },
  ];
  function buildDrawer() {
    const b = $('#flowBody'); if (!b) return;
    let h = '<div class="lbl">Registration flow</div>';
    REG.forEach((r, i) => {
      h += `<div class="flow-step ${S.view==='register'&&(S.regStep||0)===i?'active':''}" data-reg="${i}"><span class="n">${i+1}</span><div><div class="tt">${r.t}</div><div class="ds">${r.d}</div></div></div>`;
      if (i < REG.length - 1) h += '<div class="flow-conn"></div>';
    });
    h += '<div class="lbl">Upgrade flow</div>';
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
    if (e.target.closest('.hamburger')) {
      if (window.innerWidth > 900) { document.querySelector('.app-body').classList.toggle('sb-hidden'); }
      else { sbOpen(!sidebarEl.classList.contains('open')); }
      return;
    }
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
    if (e.target.closest('#changeCycle')) { modalTmp = {}; openModal('changeCycle'); return; }
    const cyc = e.target.closest('[data-cycle]'); if (cyc) { modalTmp.cycle = cyc.dataset.cycle; openModal('changeCycle'); return; }
    if (e.target.closest('#confirmCycle')) { S.bought.annual = (modalTmp.cycle === 'yearly'); closeModal(); toast('Billing cycle updated.'); render(); return; }
    const ed = e.target.closest('.ed'); if (ed) { modalTmp = { name: ed.dataset.member, role: ed.dataset.role, status: ed.dataset.status }; openModal('editMember'); return; }
    if (e.target.closest('#saveMember')) { closeModal(); toast('Member updated.'); render(); return; }
    const rg = e.target.closest('[data-reg]'); if (rg) { S.regStep = +rg.dataset.reg; go('register'); if (window.innerWidth < 900) openDrawer(false); return; }
    if (e.target.closest('#regBack')) { S.regStep = Math.max(0, (S.regStep||0) - 1); render(); return; }
    if (e.target.closest('#regNext')) { if ((S.regStep||0) >= REG.length - 1) { S.regStep = 0; toast('Registration complete — welcome to ProConnect.'); go('dashboard'); } else { S.regStep = (S.regStep||0) + 1; render(); } return; }
    if (e.target.closest('#addTeam')) { openModal('addTeam'); return; }
    if (e.target.closest('#saveTeam')) { closeModal(); toast('Team member added.'); return; }
    if (e.target.closest('[data-mclose]') || e.target.classList.contains('overlay')) { closeModal(); return; }

    // drawer
    if (e.target.closest('#flowTab')) { openDrawer(true); return; }
    if (e.target.closest('#flowClose') || e.target.closest('#flowOverlay')) { openDrawer(false); return; }
    const dm = e.target.closest('[data-modal]'); if (dm) { openDrawer(false); go(dm.dataset.modal === 'moveSeat' ? 'staff' : (dm.dataset.modal === 'cancel' || dm.dataset.modal === 'editSeats' ? 'billing' : S.view)); openModal(dm.dataset.modal, dm.dataset.ctx || 'Cody Fisher'); return; }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'curSearch') {
      const q = e.target.value.trim().toLowerCase();
      document.querySelectorAll('.cur-menu li[data-cur]').forEach(li => {
        li.style.display = li.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    }
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

  /* ===================== TRIAL COUNTDOWN ===================== */
  const TRIAL_END = Date.now() + ((6 * 24 + 23) * 3600 * 1000) + 59 * 60000;
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  function updateCountdown() {
    let ms = TRIAL_END - Date.now(); if (ms < 0) ms = 0;
    const d = Math.floor(ms / 86400000), h = Math.floor(ms % 86400000 / 3600000),
          m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000);
    const cd = document.getElementById('trialCountdown');
    const sd = document.getElementById('trialSide');
    if (cd) cd.textContent = ms <= 0 ? 'expired' : `${d}D ${pad(h)}H`;
    if (sd) sd.textContent = ms <= 0 ? 'Your free trial has ended' : `Your trial ends in ${d}d ${pad(h)}h`;
  }
  updateCountdown();
  setInterval(updateCountdown, 60000);
})();
