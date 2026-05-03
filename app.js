/* The Gummy Pack - Business Intelligence Dashboard */

const STORAGE_KEY = 'tgp_dashboard_v1';

const defaultState = {
  sales: [],
  products: [],
  coupons: [],
  tiktokContent: [],
  igContent: [],
  followers: [],
  affiliates: [],
  inventory: [],
  customer: [],
  finance: [],
  actions: { win: '', problem: '', step: '' },
  recommendations: { scale: [], improve: [], test: [], kill: [] },
  filters: { period: 'week' },
};

let state = load();
const charts = {};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const saved = JSON.parse(raw);
    return { ...structuredClone(defaultState), ...saved };
  } catch {
    return structuredClone(defaultState);
  }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uid() { return Math.random().toString(36).slice(2, 9); }
function fmt(n, currency = false) {
  if (n === null || n === undefined || isNaN(n)) return currency ? '$0' : '0';
  if (currency) return '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return Number(n).toLocaleString();
}
function pct(n) { if (!isFinite(n)) return '0%'; return (n * 100).toFixed(1) + '%'; }

function num(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

/* ---------- Navigation ---------- */
const titleMap = {
  dashboard: ['Executive Summary', 'Quick glance at overall business health'],
  sales: ['Sales Performance', 'Shopify + TikTok Shop, separate and combined'],
  products: ['Product Performance', 'Best sellers, slow movers, flavor trends'],
  coupons: ['Coupons & Promotions', 'Track ROI per discount code'],
  marketing: ['Marketing & Social Media', 'TikTok content, Instagram, affiliates'],
  inventory: ['Inventory & Fulfillment', 'Stock, delays, claims, freshness'],
  customers: ['Customer Experience', 'Reviews, complaints, sentiment, loyalty'],
  finance: ['Financial Overview', 'Are we really profitable?'],
  insights: ['Strategic Insights', 'Action panel + weekly recommendations'],
};

function showSection(key) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.section === key));
  document.querySelectorAll('.page').forEach(el => el.classList.toggle('hidden', el.id !== 'page-' + key));
  const [t, s] = titleMap[key];
  document.getElementById('pageTitle').textContent = t;
  document.getElementById('pageSub').textContent = s;
  renderAll();
}

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', () => showSection(el.dataset.section));
});

/* ---------- Period filter ---------- */
document.getElementById('periodFilter').addEventListener('change', e => {
  state.filters.period = e.target.value;
  save();
  renderAll();
});
document.getElementById('periodFilter').value = state.filters.period;

/* ---------- Period helpers ---------- */
function periodStart(period) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'day') return d;
  if (period === 'week') { const x = new Date(d); x.setDate(x.getDate() - 6); return x; }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === 'quarter') { const q = Math.floor(now.getMonth() / 3) * 3; return new Date(now.getFullYear(), q, 1); }
  if (period === 'year') return new Date(now.getFullYear(), 0, 1);
  return d;
}
function inPeriod(dateStr, period) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= periodStart(period) && d <= new Date();
}
function filteredSales() {
  return state.sales.filter(r => inPeriod(r.date, state.filters.period));
}

/* ---------- Forms ---------- */
function getForm(form) {
  const data = {};
  new FormData(form).forEach((v, k) => data[k] = v);
  return data;
}

document.getElementById('salesForm').addEventListener('submit', e => {
  e.preventDefault();
  const d = getForm(e.target);
  state.sales.push({ id: uid(), ...d });
  save(); e.target.reset(); renderAll();
});

document.getElementById('productForm').addEventListener('submit', e => {
  e.preventDefault();
  const d = getForm(e.target);
  const existing = state.products.findIndex(p => p.name.toLowerCase() === d.name.toLowerCase());
  if (existing >= 0) state.products[existing] = { ...state.products[existing], ...d };
  else state.products.push({ id: uid(), ...d });
  save(); e.target.reset(); renderAll();
});

document.getElementById('couponForm').addEventListener('submit', e => {
  e.preventDefault();
  state.coupons.push({ id: uid(), ...getForm(e.target) });
  save(); e.target.reset(); renderAll();
});

document.getElementById('tiktokContentForm').addEventListener('submit', e => {
  e.preventDefault();
  state.tiktokContent.push({ id: uid(), ...getForm(e.target) });
  save(); e.target.reset(); renderAll();
});

document.getElementById('igContentForm').addEventListener('submit', e => {
  e.preventDefault();
  state.igContent.push({ id: uid(), ...getForm(e.target) });
  save(); e.target.reset(); renderAll();
});

document.getElementById('followersForm').addEventListener('submit', e => {
  e.preventDefault();
  state.followers.push({ id: uid(), ...getForm(e.target) });
  state.followers.sort((a, b) => new Date(a.date) - new Date(b.date));
  save(); e.target.reset(); renderAll();
});

document.getElementById('affiliateForm').addEventListener('submit', e => {
  e.preventDefault();
  state.affiliates.push({ id: uid(), ...getForm(e.target) });
  save(); e.target.reset(); renderAll();
});

document.getElementById('inventoryForm').addEventListener('submit', e => {
  e.preventDefault();
  state.inventory.push({ id: uid(), ...getForm(e.target) });
  save(); e.target.reset(); renderAll();
});

document.getElementById('customerForm').addEventListener('submit', e => {
  e.preventDefault();
  state.customer.push({ id: uid(), ...getForm(e.target) });
  save(); e.target.reset(); renderAll();
});

document.getElementById('financeForm').addEventListener('submit', e => {
  e.preventDefault();
  state.finance.push({ id: uid(), ...getForm(e.target) });
  state.finance.sort((a, b) => new Date(a.periodEnd) - new Date(b.periodEnd));
  save(); e.target.reset(); renderAll();
});

document.getElementById('actionForm').addEventListener('submit', e => {
  e.preventDefault();
  const d = getForm(e.target);
  state.actions = { win: d.win || '', problem: d.problem || '', step: d.step || '' };
  save(); renderAll();
});

document.getElementById('recForm').addEventListener('submit', e => {
  e.preventDefault();
  const d = getForm(e.target);
  if (!d.text) return;
  state.recommendations[d.bucket].push({ id: uid(), text: d.text });
  save(); e.target.reset(); renderAll();
});

/* ---------- Generic delete ---------- */
function deleteFrom(collection, id) {
  state[collection] = state[collection].filter(x => x.id !== id);
  save(); renderAll();
}
function deleteRec(bucket, id) {
  state.recommendations[bucket] = state.recommendations[bucket].filter(x => x.id !== id);
  save(); renderAll();
}
window.deleteFrom = deleteFrom;
window.deleteRec = deleteRec;

/* ---------- Import / Export ---------- */
document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `tgp-dashboard-${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url);
});
document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      state = { ...structuredClone(defaultState), ...parsed };
      save(); document.getElementById('periodFilter').value = state.filters.period; renderAll();
    } catch { alert('Invalid JSON file.'); }
  };
  reader.readAsText(file);
});
document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Clear all data? This cannot be undone.')) return;
  state = structuredClone(defaultState); save(); renderAll();
});

/* ---------- KPI calculations ---------- */
function kpiTotals(rows) {
  return rows.reduce((acc, r) => {
    acc.shopify += num(r.shopifyRevenue);
    acc.tiktok += num(r.tiktokRevenue);
    acc.orders += num(r.orders);
    acc.refunds += num(r.refunds);
    acc.adSpend += num(r.adSpend);
    acc.sessions += num(r.sessions);
    acc.returning += num(r.returningCustomers);
    return acc;
  }, { shopify: 0, tiktok: 0, orders: 0, refunds: 0, adSpend: 0, sessions: 0, returning: 0 });
}

function storeHealth() {
  // 0-100 weighted: sales activity, fulfillment, customer satisfaction, marketing
  let score = 50;
  const period = filteredSales();
  const totals = kpiTotals(period);
  const revenue = totals.shopify + totals.tiktok;
  if (revenue > 0) score += 10;
  if (totals.orders > 0) score += 5;
  if (totals.adSpend > 0 && revenue / totals.adSpend > 2) score += 10;

  // fulfillment
  const inv = state.inventory;
  const totalIssues = inv.reduce((s, i) => s + num(i.delays) + num(i.damaged) + num(i.returns), 0);
  const totalSold = inv.reduce((s, i) => s + num(i.sold), 0) || 1;
  const issueRate = totalIssues / totalSold;
  score += Math.max(-15, 10 - issueRate * 100);

  // customer
  const cust = state.customer;
  const pos = cust.reduce((s, c) => s + num(c.positive), 0);
  const neg = cust.reduce((s, c) => s + num(c.complaints), 0);
  const sentiment = pos + neg > 0 ? pos / (pos + neg) : 0.5;
  score += (sentiment - 0.5) * 30;

  // marketing
  if (state.tiktokContent.length > 0) score += 5;
  if (state.igContent.length > 0) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function fulfillmentScore() {
  const inv = state.inventory;
  if (inv.length === 0) return null;
  const issues = inv.reduce((s, i) => s + num(i.delays) + num(i.damaged) + num(i.returns) + num(i.freshness), 0);
  const sold = inv.reduce((s, i) => s + num(i.sold), 0) || 1;
  return Math.max(0, Math.round(100 - (issues / sold) * 100));
}

/* ---------- Renderers ---------- */
function renderDashboard() {
  const period = filteredSales();
  const t = kpiTotals(period);
  const revenue = t.shopify + t.tiktok;
  const aov = t.orders ? revenue / t.orders : 0;
  const roas = t.adSpend ? revenue / t.adSpend : 0;

  // estimated net = revenue - refunds - adSpend (rough)
  const net = revenue - t.refunds - t.adSpend;

  document.getElementById('kpiTotalRev').textContent = fmt(revenue, true);
  document.getElementById('kpiShopifyRev').textContent = fmt(t.shopify, true);
  document.getElementById('kpiTiktokRev').textContent = fmt(t.tiktok, true);
  document.getElementById('kpiOrders').textContent = fmt(t.orders);
  document.getElementById('kpiAOV').textContent = fmt(aov, true);
  document.getElementById('kpiNet').textContent = fmt(net, true);
  document.getElementById('kpiAdSpend').textContent = fmt(t.adSpend, true);
  document.getElementById('kpiROAS').textContent = roas.toFixed(2) + 'x';

  // weekly compare: this week vs prev week
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 6);
  const prevStart = new Date(weekStart); prevStart.setDate(prevStart.getDate() - 7);
  const prevEnd = new Date(weekStart); prevEnd.setDate(prevEnd.getDate() - 1);
  const inRange = (d, s, e) => { const x = new Date(d); return x >= s && x <= e; };
  const thisWeek = state.sales.filter(r => inRange(r.date, weekStart, now));
  const lastWeek = state.sales.filter(r => inRange(r.date, prevStart, prevEnd));
  const tw = kpiTotals(thisWeek), lw = kpiTotals(lastWeek);
  const twRev = tw.shopify + tw.tiktok, lwRev = lw.shopify + lw.tiktok;
  const growth = lwRev ? ((twRev - lwRev) / lwRev) * 100 : 0;
  document.getElementById('kpiRevGrowth').textContent = (growth >= 0 ? '+' : '') + growth.toFixed(1) + '%';

  // best product
  const sortedProducts = [...state.products].sort((a, b) => num(b.totalRevenue) - num(a.totalRevenue));
  document.getElementById('kpiBestProduct').textContent = sortedProducts[0]?.name || '—';

  // best platform
  document.getElementById('kpiBestPlatform').textContent = t.shopify === 0 && t.tiktok === 0 ? '—' : (t.shopify >= t.tiktok ? 'Shopify' : 'TikTok');

  // top coupon
  const topCoupon = [...state.coupons].sort((a, b) => num(b.revenue) - num(a.revenue))[0];
  document.getElementById('kpiTopCoupon').textContent = topCoupon?.code || '—';

  // return rate
  const totalReturns = state.products.reduce((s, p) => s + num(p.returns), 0);
  const totalUnits = state.products.reduce((s, p) => s + num(p.shopifyUnits) + num(p.tiktokUnits), 0);
  document.getElementById('kpiReturnRate').textContent = totalUnits ? ((totalReturns / totalUnits) * 100).toFixed(1) + '%' : '0%';

  // social growth (latest follower delta)
  const f = state.followers;
  if (f.length >= 2) {
    const last = f[f.length - 1], prev = f[f.length - 2];
    const delta = (num(last.tiktokFollowers) + num(last.igFollowers)) - (num(prev.tiktokFollowers) + num(prev.igFollowers));
    document.getElementById('kpiSocialGrowth').textContent = (delta >= 0 ? '+' : '') + fmt(delta);
  } else { document.getElementById('kpiSocialGrowth').textContent = '+0'; }

  // monthly
  const monthRows = state.sales.filter(r => inPeriod(r.date, 'month'));
  const m = kpiTotals(monthRows);
  const mRev = m.shopify + m.tiktok;
  document.getElementById('kpiGross').textContent = fmt(mRev, true);
  document.getElementById('kpiNetMonth').textContent = fmt(mRev - m.refunds - m.adSpend, true);
  document.getElementById('kpiTotalOrders').textContent = fmt(m.orders);
  document.getElementById('kpiRepeatRate').textContent = m.orders ? ((m.returning / m.orders) * 100).toFixed(1) + '%' : '0%';
  document.getElementById('kpiRefundLoss').textContent = fmt(m.refunds, true);
  const fs = fulfillmentScore();
  document.getElementById('kpiFulfillmentScore').textContent = fs === null ? '--/100' : `${fs}/100`;

  // health
  const hs = storeHealth();
  const hsEl = document.getElementById('healthScore');
  hsEl.textContent = `${hs}/100`;
  hsEl.style.color = hs >= 75 ? 'var(--good)' : hs >= 50 ? 'var(--warn)' : 'var(--bad)';

  // action panel (read-only on dashboard)
  document.getElementById('actionWin').textContent = state.actions.win || 'Add insights to see your biggest win.';
  document.getElementById('actionProblem').textContent = state.actions.problem || 'Add insights to flag the biggest problem.';
  document.getElementById('actionStep').textContent = state.actions.step || 'Define the next step for this week.';

  renderRevenueTrendChart();
}

function renderSales() {
  const tbody = document.querySelector('#salesTable tbody');
  const rows = [...state.sales].sort((a, b) => new Date(b.date) - new Date(a.date));
  tbody.innerHTML = rows.map(r => {
    const combined = num(r.shopifyRevenue) + num(r.tiktokRevenue);
    const aov = num(r.orders) ? combined / num(r.orders) : 0;
    const conv = num(r.sessions) ? (num(r.orders) / num(r.sessions)) * 100 : 0;
    return `<tr>
      <td>${r.date || ''}</td>
      <td>${fmt(num(r.shopifyRevenue), true)}</td>
      <td>${fmt(num(r.tiktokRevenue), true)}</td>
      <td>${fmt(combined, true)}</td>
      <td>${fmt(num(r.orders))}</td>
      <td>${fmt(aov, true)}</td>
      <td>${conv.toFixed(2)}%</td>
      <td>${fmt(num(r.refunds), true)}</td>
      <td><button class="btn btn-sm btn-danger-ghost" onclick="deleteFrom('sales','${r.id}')">×</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:20px">No sales entries yet.</td></tr>';

  renderSalesCompareTable();
  renderSalesMixChart();
}

function renderSalesCompareTable() {
  const today = new Date(); today.setHours(0,0,0,0);
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  const todayStr = today.toISOString().slice(0,10);
  const yestStr = yest.toISOString().slice(0,10);
  const tRows = state.sales.filter(r => r.date === todayStr);
  const yRows = state.sales.filter(r => r.date === yestStr);
  const t = kpiTotals(tRows), y = kpiTotals(yRows);
  const tRev = t.shopify + t.tiktok, yRev = y.shopify + y.tiktok;
  const delta = (a, b) => {
    if (b === 0) return a === 0 ? '<span class="delta-flat">—</span>' : '<span class="delta-up">+∞</span>';
    const d = ((a - b) / b) * 100;
    const cls = d > 0 ? 'delta-up' : d < 0 ? 'delta-down' : 'delta-flat';
    return `<span class="${cls}">${d >= 0 ? '+' : ''}${d.toFixed(1)}%</span>`;
  };
  document.querySelector('#salesCompareTable tbody').innerHTML = `
    <tr><td>Revenue</td><td>${fmt(tRev, true)}</td><td>${fmt(yRev, true)}</td><td>${delta(tRev, yRev)}</td></tr>
    <tr><td>Orders</td><td>${t.orders}</td><td>${y.orders}</td><td>${delta(t.orders, y.orders)}</td></tr>
    <tr><td>Ad Spend</td><td>${fmt(t.adSpend, true)}</td><td>${fmt(y.adSpend, true)}</td><td>${delta(t.adSpend, y.adSpend)}</td></tr>
    <tr><td>Sessions</td><td>${t.sessions}</td><td>${y.sessions}</td><td>${delta(t.sessions, y.sessions)}</td></tr>
  `;
}

function renderProducts() {
  const tbody = document.querySelector('#productsTable tbody');
  tbody.innerHTML = state.products.map(p => {
    const units = num(p.shopifyUnits) + num(p.tiktokUnits);
    const rRate = units ? ((num(p.returns) / units) * 100).toFixed(1) + '%' : '—';
    const top = num(p.shopifyUnits) >= num(p.tiktokUnits) ? 'Shopify' : 'TikTok';
    return `<tr>
      <td>${p.name}</td>
      <td>${p.flavor || '—'}</td>
      <td>${num(p.shopifyUnits)}</td>
      <td>${num(p.tiktokUnits)}</td>
      <td>${fmt(num(p.totalRevenue), true)}</td>
      <td>${rRate}</td>
      <td>${p.complaintType || '—'}</td>
      <td>${num(p.inventory)}</td>
      <td>${top}</td>
      <td>${p.status || '—'}</td>
      <td><button class="btn btn-sm btn-danger-ghost" onclick="deleteFrom('products','${p.id}')">×</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="11" style="text-align:center;color:var(--muted);padding:20px">No products yet.</td></tr>';

  renderTopProductsChart();
  renderFlavorChart();
}

function renderCoupons() {
  const tbody = document.querySelector('#couponsTable tbody');
  tbody.innerHTML = state.coupons.map(c => {
    const roi = num(c.discountCost) ? (num(c.revenue) - num(c.discountCost)) / num(c.discountCost) : 0;
    const verdict = roi >= 2 ? `<span class="verdict scaled">Scale</span>` : roi >= 0.5 ? `<span class="verdict review">Review</span>` : `<span class="verdict kill">Kill</span>`;
    return `<tr>
      <td>${c.code}</td>
      <td>${c.platform || '—'}</td>
      <td>${c.type || '—'}</td>
      <td>${num(c.uses)}</td>
      <td>${fmt(num(c.revenue), true)}</td>
      <td>${fmt(num(c.discountCost), true)}</td>
      <td>${(roi * 100).toFixed(0)}%</td>
      <td>${num(c.conversion).toFixed(1)}%</td>
      <td>${verdict}</td>
      <td><button class="btn btn-sm btn-danger-ghost" onclick="deleteFrom('coupons','${c.id}')">×</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="10" style="text-align:center;color:var(--muted);padding:20px">No coupons yet.</td></tr>';
}

function renderMarketing() {
  // Best content table
  const tbody = document.querySelector('#bestContentTable tbody');
  const ranked = [...state.tiktokContent]
    .map(v => ({ ...v, viral: num(v.views) ? ((num(v.likes) + num(v.shares) * 2 + num(v.comments)) / num(v.views) * 100) : 0 }))
    .sort((a, b) => num(b.sales) - num(a.sales))
    .slice(0, 8);
  tbody.innerHTML = ranked.map(v => `
    <tr>
      <td>${v.date || ''}</td>
      <td>${v.title || ''}</td>
      <td>${v.type || ''}</td>
      <td>${fmt(num(v.views))}</td>
      <td>${fmt(num(v.sales), true)}</td>
      <td>${v.viral.toFixed(2)}%</td>
    </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">No videos logged yet.</td></tr>';

  // Affiliates
  const aBody = document.querySelector('#affiliatesTable tbody');
  aBody.innerHTML = state.affiliates.map(a => {
    const roi = num(a.commission) ? (num(a.sales) - num(a.commission)) / num(a.commission) : 0;
    return `<tr>
      <td>${a.name}</td>
      <td>${fmt(num(a.sales), true)}</td>
      <td>${fmt(num(a.commission), true)}</td>
      <td>${(roi * 100).toFixed(0)}%</td>
      <td>${fmt(num(a.views))}</td>
      <td><button class="btn btn-sm btn-danger-ghost" onclick="deleteFrom('affiliates','${a.id}')">×</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">No affiliates yet.</td></tr>';

  renderFollowersChart();
}

function renderInventory() {
  const tbody = document.querySelector('#inventoryTable tbody');
  tbody.innerHTML = state.inventory.map(i => {
    const remaining = num(i.beginning) - num(i.sold);
    let alert = `<span class="alert ok">OK</span>`;
    if (remaining <= 0) alert = `<span class="alert out">Out</span>`;
    else if (remaining < num(i.beginning) * 0.2) alert = `<span class="alert low">Low</span>`;
    return `<tr>
      <td>${i.product}</td>
      <td>${num(i.beginning)}</td>
      <td>${num(i.sold)}</td>
      <td>${remaining}</td>
      <td>${num(i.delays)}</td>
      <td>${num(i.damaged)}</td>
      <td>${num(i.claimsFiled)}/${num(i.claimsApproved)}</td>
      <td>${num(i.returns)}</td>
      <td>${num(i.freshness)}</td>
      <td>${alert}</td>
      <td><button class="btn btn-sm btn-danger-ghost" onclick="deleteFrom('inventory','${i.id}')">×</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="11" style="text-align:center;color:var(--muted);padding:20px">No inventory entries yet.</td></tr>';
}

function renderCustomers() {
  const tbody = document.querySelector('#customerTable tbody');
  tbody.innerHTML = [...state.customer].sort((a,b) => new Date(b.date) - new Date(a.date)).map(c => `
    <tr>
      <td>${c.date || ''}</td>
      <td>${num(c.complaints)}</td>
      <td>${num(c.positive)}</td>
      <td>${num(c.refundRequests)}</td>
      <td>${num(c.approvedReturns)}</td>
      <td>${c.mainComplaint || '—'}</td>
      <td>${c.resolution || '—'}</td>
      <td>${num(c.repeatBuyers)}</td>
      <td><button class="btn btn-sm btn-danger-ghost" onclick="deleteFrom('customer','${c.id}')">×</button></td>
    </tr>`).join('') || '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:20px">No customer entries yet.</td></tr>';

  // sentiment
  const pos = state.customer.reduce((s, c) => s + num(c.positive), 0);
  const neg = state.customer.reduce((s, c) => s + num(c.complaints), 0);
  const score = pos + neg > 0 ? Math.round((pos / (pos + neg)) * 100) : null;
  document.getElementById('sentimentScore').textContent = score === null ? '—' : score + '%';
  document.getElementById('sentimentNote').textContent = score === null
    ? 'Logged from positive reviews vs complaints.'
    : `${pos} positive vs ${neg} complaints across all entries.`;

  renderComplaintsChart();
}

function renderFinance() {
  const tbody = document.querySelector('#financeTable tbody');
  tbody.innerHTML = [...state.finance].map(f => {
    const net = num(f.revenue) - num(f.cogs) - num(f.packaging) - num(f.shipping) - num(f.ads) - num(f.discounts) - num(f.refunds) - num(f.fees);
    return `<tr>
      <td>${f.periodStart || ''} → ${f.periodEnd || ''}</td>
      <td>${fmt(num(f.revenue), true)}</td>
      <td>${fmt(num(f.cogs), true)}</td>
      <td>${fmt(num(f.packaging), true)}</td>
      <td>${fmt(num(f.shipping), true)}</td>
      <td>${fmt(num(f.ads), true)}</td>
      <td>${fmt(num(f.discounts), true)}</td>
      <td>${fmt(num(f.refunds), true)}</td>
      <td>${fmt(num(f.fees), true)}</td>
      <td><strong style="color:${net >= 0 ? 'var(--good)' : 'var(--bad)'}">${fmt(net, true)}</strong></td>
      <td><button class="btn btn-sm btn-danger-ghost" onclick="deleteFrom('finance','${f.id}')">×</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="11" style="text-align:center;color:var(--muted);padding:20px">No financial entries yet.</td></tr>';

  // latest snapshot
  const latest = state.finance[state.finance.length - 1];
  if (latest) {
    const rev = num(latest.revenue);
    const grossProfit = rev - num(latest.cogs);
    const net = grossProfit - num(latest.packaging) - num(latest.shipping) - num(latest.ads) - num(latest.discounts) - num(latest.refunds) - num(latest.fees);
    const margin = rev ? grossProfit / rev : 0;
    const cac = num(latest.customersAcquired) ? num(latest.ads) / num(latest.customersAcquired) : 0;
    document.getElementById('finGrossProfit').textContent = fmt(grossProfit, true);
    document.getElementById('finNet').textContent = fmt(net, true);
    document.getElementById('finMargin').textContent = pct(margin);
    document.getElementById('finMarketing').textContent = fmt(num(latest.ads), true);
    document.getElementById('finCAC').textContent = fmt(cac, true);
    document.getElementById('finRefund').textContent = fmt(num(latest.refunds), true);
    document.getElementById('finCoupon').textContent = fmt(num(latest.discounts), true);
    document.getElementById('finFees').textContent = fmt(num(latest.fees), true);
  }

  renderCostBreakdownChart();
}

function renderInsights() {
  // load actions into form
  const af = document.getElementById('actionForm');
  af.win.value = state.actions.win || '';
  af.problem.value = state.actions.problem || '';
  af.step.value = state.actions.step || '';

  // recommendations lists
  ['scale','improve','test','kill'].forEach(b => {
    const ul = document.getElementById('rec' + b.charAt(0).toUpperCase() + b.slice(1));
    ul.innerHTML = state.recommendations[b].map(r =>
      `<li><span>${r.text}</span><button onclick="deleteRec('${b}','${r.id}')">×</button></li>`
    ).join('') || `<li style="background:transparent;border:none;color:var(--muted);font-style:italic">None yet.</li>`;
  });

  // platform comparison
  const all = state.sales;
  const t = kpiTotals(all);
  const shopOrders = state.sales.reduce((s,r) => num(r.shopifyRevenue) > 0 ? s + num(r.orders) : s, 0);
  const tikOrders = state.sales.reduce((s,r) => num(r.tiktokRevenue) > 0 ? s + num(r.orders) : s, 0);
  const winner = (a, b) => a > b ? 'Shopify' : b > a ? 'TikTok' : '—';
  document.querySelector('#platformCompare tbody').innerHTML = `
    <tr><td>Total Revenue</td><td>${fmt(t.shopify, true)}</td><td>${fmt(t.tiktok, true)}</td><td>${winner(t.shopify, t.tiktok)}</td></tr>
    <tr><td>Order Volume*</td><td>${shopOrders}</td><td>${tikOrders}</td><td>${winner(shopOrders, tikOrders)}</td></tr>
    <tr><td>Avg Daily Rev</td><td>${fmt(state.sales.length ? t.shopify / state.sales.length : 0, true)}</td><td>${fmt(state.sales.length ? t.tiktok / state.sales.length : 0, true)}</td><td>${winner(t.shopify, t.tiktok)}</td></tr>
  `;

  // auto-generated insights
  const insights = [];
  if (t.shopify + t.tiktok > 0) {
    insights.push(`Shopify is ${t.shopify >= t.tiktok ? 'leading' : 'trailing'} TikTok by ${fmt(Math.abs(t.shopify - t.tiktok), true)} in total revenue.`);
  }
  const topProd = [...state.products].sort((a,b) => num(b.totalRevenue) - num(a.totalRevenue))[0];
  if (topProd) insights.push(`Top product: <strong>${topProd.name}</strong> at ${fmt(num(topProd.totalRevenue), true)}.`);
  const slowProd = state.products.find(p => p.status === 'Slow Seller' || p.status === 'Dead Stock');
  if (slowProd) insights.push(`Consider killing or repositioning <strong>${slowProd.name}</strong> (${slowProd.status}).`);
  const killCoupons = state.coupons.filter(c => num(c.discountCost) && (num(c.revenue) - num(c.discountCost)) / num(c.discountCost) < 0.5);
  if (killCoupons.length) insights.push(`${killCoupons.length} coupon(s) underperforming — review or kill: ${killCoupons.map(c => c.code).join(', ')}.`);
  const freshness = state.customer.filter(c => c.mainComplaint === 'Not Fresh').length;
  if (freshness > 0) insights.push(`<strong>${freshness}</strong> freshness complaint(s) logged — review supplier or storage.`);
  const viral = [...state.tiktokContent].sort((a,b) => num(b.views) - num(a.views))[0];
  if (viral && num(viral.views) > 10000) insights.push(`Viral video: "${viral.title}" with ${fmt(num(viral.views))} views.`);

  document.getElementById('autoInsights').innerHTML = insights.length
    ? insights.map(i => `<li>${i}</li>`).join('')
    : `<li style="border-left-color:var(--muted);color:var(--muted)">Add data across the dashboard to generate insights.</li>`;
}

/* ---------- Charts ---------- */
function destroy(name) { if (charts[name]) { charts[name].destroy(); delete charts[name]; } }

function renderRevenueTrendChart() {
  const ctx = document.getElementById('chartRevenueTrend');
  if (!ctx) return;
  destroy('rev');
  const sorted = [...state.sales].sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-30);
  const labels = sorted.map(r => r.date);
  charts.rev = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Shopify', data: sorted.map(r => num(r.shopifyRevenue)), borderColor: '#7c5cff', backgroundColor: 'rgba(124,92,255,0.15)', tension: 0.3, fill: true },
        { label: 'TikTok', data: sorted.map(r => num(r.tiktokRevenue)), borderColor: '#ff5f8a', backgroundColor: 'rgba(255,95,138,0.15)', tension: 0.3, fill: true },
      ],
    },
    options: chartOpts(),
  });
}

function renderSalesMixChart() {
  const ctx = document.getElementById('chartSalesMix');
  if (!ctx) return;
  destroy('mix');
  const t = kpiTotals(filteredSales());
  charts.mix = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: ['Shopify', 'TikTok'], datasets: [{ data: [t.shopify, t.tiktok], backgroundColor: ['#7c5cff', '#ff5f8a'], borderColor: '#171a22', borderWidth: 2 }] },
    options: { plugins: { legend: { labels: { color: '#e8eaf2' } } } },
  });
}

function renderTopProductsChart() {
  const ctx = document.getElementById('chartTopProducts');
  if (!ctx) return;
  destroy('topProd');
  const top = [...state.products].sort((a,b) => num(b.totalRevenue) - num(a.totalRevenue)).slice(0, 6);
  charts.topProd = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top.map(p => p.name),
      datasets: [{ label: 'Revenue', data: top.map(p => num(p.totalRevenue)), backgroundColor: 'rgba(124,92,255,0.7)' }],
    },
    options: chartOpts(),
  });
}

function renderFlavorChart() {
  const ctx = document.getElementById('chartFlavorTrend');
  if (!ctx) return;
  destroy('flavor');
  const map = {};
  state.products.forEach(p => {
    const key = p.flavor || 'Other';
    map[key] = (map[key] || 0) + num(p.totalRevenue);
  });
  charts.flavor = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(map),
      datasets: [{ data: Object.values(map), backgroundColor: ['#7c5cff', '#ff5f8a', '#2ecc71', '#f5a623', '#4ecdc4', '#a06cd5'], borderColor: '#171a22', borderWidth: 2 }],
    },
    options: { plugins: { legend: { labels: { color: '#e8eaf2' } } } },
  });
}

function renderFollowersChart() {
  const ctx = document.getElementById('chartFollowers');
  if (!ctx) return;
  destroy('followers');
  charts.followers = new Chart(ctx, {
    type: 'line',
    data: {
      labels: state.followers.map(f => f.date),
      datasets: [
        { label: 'TikTok', data: state.followers.map(f => num(f.tiktokFollowers)), borderColor: '#ff5f8a', tension: 0.3 },
        { label: 'Instagram', data: state.followers.map(f => num(f.igFollowers)), borderColor: '#7c5cff', tension: 0.3 },
      ],
    },
    options: chartOpts(),
  });
}

function renderComplaintsChart() {
  const ctx = document.getElementById('chartComplaints');
  if (!ctx) return;
  destroy('complaints');
  const map = {};
  state.customer.forEach(c => { if (c.mainComplaint) map[c.mainComplaint] = (map[c.mainComplaint] || 0) + 1; });
  charts.complaints = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(map),
      datasets: [{ label: 'Count', data: Object.values(map), backgroundColor: 'rgba(255,77,109,0.7)' }],
    },
    options: chartOpts(),
  });
}

function renderCostBreakdownChart() {
  const ctx = document.getElementById('chartCostBreakdown');
  if (!ctx) return;
  destroy('cost');
  const latest = state.finance[state.finance.length - 1];
  if (!latest) { return; }
  charts.cost = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['COGS', 'Packaging', 'Shipping', 'Ads', 'Discounts', 'Refunds', 'Fees'],
      datasets: [{
        data: [num(latest.cogs), num(latest.packaging), num(latest.shipping), num(latest.ads), num(latest.discounts), num(latest.refunds), num(latest.fees)],
        backgroundColor: ['#ff5f8a', '#7c5cff', '#2ecc71', '#f5a623', '#4ecdc4', '#a06cd5', '#888'],
        borderColor: '#171a22', borderWidth: 2,
      }],
    },
    options: { plugins: { legend: { labels: { color: '#e8eaf2' } } } },
  });
}

function chartOpts() {
  return {
    responsive: true,
    plugins: { legend: { labels: { color: '#e8eaf2' } } },
    scales: {
      x: { ticks: { color: '#8a91a6' }, grid: { color: '#262b3a' } },
      y: { ticks: { color: '#8a91a6' }, grid: { color: '#262b3a' } },
    },
  };
}

/* ---------- Render all ---------- */
function renderAll() {
  renderDashboard();
  renderSales();
  renderProducts();
  renderCoupons();
  renderMarketing();
  renderInventory();
  renderCustomers();
  renderFinance();
  renderInsights();
}

renderAll();
