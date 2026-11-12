(() => {
'use strict';

/* ================= data ================= */
const KEY = 'mm_reviews_v1';
const MEALS = [
  { id: 'breakfast', label: 'Breakfast', icon: '🍳', start: [7, 30],  end: [9, 30] },
  { id: 'lunch',     label: 'Lunch',     icon: '🍛', start: [12, 30], end: [14, 30] },
  { id: 'snacks',    label: 'Snacks',    icon: '🫖', start: [17, 0],  end: [18, 15] },
  { id: 'dinner',    label: 'Dinner',    icon: '🍲', start: [19, 30], end: [21, 30] }
];
// weekly menu, index = Date.getDay() (0 = Sunday)
const MENU = {
  0: { breakfast: ['Puri Bhaji', 'Jalebi', 'Tea'], lunch: ['Veg Biryani', 'Raita', 'Papad', 'Salad'], snacks: ['Pav Bhaji'], dinner: ['Shahi Paneer', 'Dal Makhani', 'Naan', 'Jeera Rice', 'Ice Cream'] },
  1: { breakfast: ['Aloo Paratha', 'Curd', 'Tea'], lunch: ['Rajma', 'Jeera Rice', 'Roti', 'Salad'], snacks: ['Samosa', 'Mint Chutney', 'Tea'], dinner: ['Paneer Butter Masala', 'Dal Fry', 'Roti', 'Rice', 'Gulab Jamun'] },
  2: { breakfast: ['Poha', 'Banana', 'Tea'], lunch: ['Chole', 'Bhature', 'Onion Salad'], snacks: ['Bread Pakora', 'Tea'], dinner: ['Mix Veg', 'Dal Tadka', 'Roti', 'Steamed Rice', 'Kheer'] },
  3: { breakfast: ['Idli', 'Sambar', 'Coconut Chutney'], lunch: ['Kadhi Pakora', 'Rice', 'Roti', 'Boondi Raita'], snacks: ['Veg Sandwich', 'Tea'], dinner: ['Aloo Gobi', 'Dal Fry', 'Roti', 'Rice', 'Custard'] },
  4: { breakfast: ['Chole Kulche', 'Tea'], lunch: ['Dal Makhani', 'Jeera Rice', 'Roti', 'Salad'], snacks: ['Macaroni', 'Coffee'], dinner: ['Matar Paneer', 'Mix Dal', 'Roti', 'Rice', 'Halwa'] },
  5: { breakfast: ['Upma', 'Bread Butter', 'Tea'], lunch: ['Veg Pulao', 'Raita', 'Aloo Jeera', 'Papad'], snacks: ['Maggi', 'Tea'], dinner: ['Kadai Paneer', 'Dal Tadka', 'Roti', 'Rice', 'Ice Cream'] },
  6: { breakfast: ['Masala Dosa', 'Sambar', 'Chutney'], lunch: ['Rajma Chawal', 'Roti', 'Salad'], snacks: ['Veg Burger', 'Cold Coffee'], dinner: ['Paneer Do Pyaza', 'Dal', 'Roti', 'Fried Rice', 'Gulab Jamun'] }
};
const SCALE = [['😡', 'Awful'], ['😕', 'Poor'], ['😐', 'Okay'], ['🙂', 'Good'], ['😍', 'Loved it']];
const TAGS = [
  ['Tasty', 'pos'], ['Fresh', 'pos'], ['Served hot', 'pos'], ['Good portion', 'pos'],
  ['Too oily', 'neg'], ['Too salty', 'neg'], ['Bland', 'neg'], ['Served cold', 'neg'], ['Long queue', 'neg']
];
const TAG_KIND = Object.fromEntries(TAGS);

/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
const at = (dateStr, hm) => { const d = parse(dateStr); d.setHours(hm[0], hm[1], 0, 0); return d; };
const fmtHM = hm => { const h = hm[0] % 12 || 12; return `${h}:${pad(hm[1])} ${hm[0] < 12 ? 'AM' : 'PM'}`; };
const fmtTS = t => new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const dow = d => d.toLocaleDateString('en-IN', { weekday: 'short' });
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const colorFor = v => v >= 3.8 ? 'var(--good)' : v >= 2.8 ? 'var(--ok)' : 'var(--bad)';
const emojiFor = v => SCALE[Math.min(4, Math.max(0, Math.round(v) - 1))][0];
const mealById = id => MEALS.find(m => m.id === id);
const menuFor = (dateStr, mealId) => MENU[parse(dateStr).getDay()][mealId];

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2400);
}
function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(reviews)); return true; }
  catch { toast('Could not save (storage full or blocked).'); return false; }
}

/* ================= seed data ================= */
function seed() {
  let s = 20261111;
  const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const baseMeal = { breakfast: 3.2, lunch: 3.5, snacks: 3.9, dinner: 3.4 };
  const bias = { 'Paneer': .5, 'Biryani': .7, 'Pav Bhaji': .7, 'Maggi': .6, 'Samosa': .6, 'Gulab Jamun': .3, 'Ice Cream': .4, 'Dosa': .4, 'Mix Veg': -.6, 'Aloo Gobi': -.7, 'Upma': -.8, 'Macaroni': -.3, 'Kadhi': -.6, 'Mix Dal': -.4 };
  const comments = {
    hi: ['Really good today, would eat again.', 'Best meal this week!', 'Fresh and hot, loved it.', 'Portion was great and tasted homemade.', 'Finally something worth the queue.'],
    mid: ['Okay-ish, nothing special.', 'Average. Could use more seasoning.', 'Decent but a bit repetitive.', 'Fine for the price.'],
    lo: ['Too oily and served cold.', 'Not great today, please improve.', 'Very bland, had to skip.', 'Dal was watery and roti was hard.']
  };
  const now = new Date(), out = [];
  for (let off = -6; off <= 0; off++) {
    const date = ymd(addDays(now, off));
    MEALS.forEach(m => {
      const start = at(date, m.start), end = at(date, m.end);
      if (now < start) return;
      const items = menuFor(date, m.id).join(' ');
      let b = baseMeal[m.id] + (rnd() - .5) * .8;
      Object.keys(bias).forEach(k => { if (items.includes(k)) b += bias[k]; });
      const n = 3 + Math.floor(rnd() * 4);
      for (let i = 0; i < n; i++) {
        const stars = Math.min(5, Math.max(1, Math.round(b + (rnd() - .5) * 2.2)));
        const tags = [];
        if (stars >= 4) { tags.push(pick(['Tasty', 'Fresh', 'Served hot', 'Good portion'])); if (rnd() > .6) tags.push(pick(['Tasty', 'Good portion'])); }
        else if (stars <= 2) { tags.push(pick(['Too oily', 'Too salty', 'Bland', 'Served cold'])); if (rnd() > .6) tags.push('Long queue'); }
        else if (rnd() > .5) tags.push(pick(['Long queue', 'Bland', 'Tasty']));
        const ts = Math.min(now.getTime() - 60000, end.getTime() + Math.floor(rnd() * 150) * 60000);
        out.push({
          id: uid(), date, meal: m.id, stars, tags: [...new Set(tags)],
          comment: rnd() > .45 ? pick(stars >= 4 ? comments.hi : stars <= 2 ? comments.lo : comments.mid) : '',
          ts: Math.max(ts, start.getTime()), mine: false
        });
      }
    });
  }
  return out;
}

/* ================= state ================= */
let reviews = load();
if (!Array.isArray(reviews)) { reviews = seed(); save(); }
const state = { view: 'menu', date: ymd(new Date()), rDate: 'all', rMeal: 'all', rMine: false };
let modal = null;

const todayStr = () => ymd(new Date());
const forMeal = (date, meal) => reviews.filter(r => r.date === date && r.meal === meal);
const myReview = (date, meal) => reviews.find(r => r.mine && r.date === date && r.meal === meal);
const statusOf = (date, m, now) => {
  const st = at(date, m.start), en = at(date, m.end);
  return now < st ? 'upcoming' : now <= en ? 'live' : 'done';
};

/* ================= views ================= */
function render() {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
  const app = $('#app');
  app.innerHTML = state.view === 'menu' ? menuView() : state.view === 'reviews' ? reviewsView() : insightsView();
}

/* ---- next up hero ---- */
function nextUp(now) {
  const t = todayStr();
  for (const m of MEALS) {
    const s = statusOf(t, m, now);
    if (s === 'live') return { m, date: t, live: true };
    if (s === 'upcoming') return { m, date: t, live: false };
  }
  return { m: MEALS[0], date: ymd(addDays(now, 1)), live: false, tomorrow: true };
}
function untilText(target, now) {
  const mins = Math.max(0, Math.round((target - now) / 60000));
  const h = Math.floor(mins / 60), mm = mins % 60;
  return h ? `${h}h ${mm}m` : `${mm}m`;
}
function hero(now) {
  const n = nextUp(now);
  const items = menuFor(n.date, n.m.id);
  const start = at(n.date, n.m.start);
  const label = n.live ? 'Serving now' : n.tomorrow ? "Tomorrow's first meal" : 'Up next';
  const sub = n.live ? `Until ${fmtHM(n.m.end)}` : `${n.tomorrow ? 'Tomorrow ' : ''}${fmtHM(n.m.start)} · in ${untilText(start, now)}`;
  return `<section class="hero">
    <div><small>${label}</small><h2>${n.m.icon} ${n.m.label}</h2><p>${sub}</p>
      <div class="items">${items.map(i => `<span>${esc(i)}</span>`).join('')}</div></div>
    ${n.live ? `<button class="ghost" data-rate="${n.date}|${n.m.id}">⭐ Rate it</button>` : ''}
  </section>`;
}

/* ---- menu & rate ---- */
function menuView() {
  const now = new Date(), t = todayStr();
  const todays = reviews.filter(r => r.date === t);
  const avgToday = mean(todays.map(r => r.stars));
  const mineCount = reviews.filter(r => r.mine).length;

  const strip = [];
  for (let off = -6; off <= 1; off++) {
    const d = addDays(now, off), s = ymd(d);
    strip.push(`<button class="day ${s === state.date ? 'active' : ''} ${s === t ? 'today' : ''}" data-date="${s}"><span>${s === t ? 'Today' : dow(d)}</span><b>${d.getDate()}</b></button>`);
  }

  const cards = MEALS.map(m => {
    const st = statusOf(state.date, m, now);
    const list = forMeal(state.date, m.id);
    const avg = mean(list.map(r => r.stars));
    const mine = myReview(state.date, m.id);
    const pill = st === 'live' ? '<span class="pill live">● Serving now</span>' : st === 'upcoming' ? `<span class="pill upcoming">Starts ${fmtHM(m.start)}</span>` : '<span class="pill done">Served</span>';
    return `<article class="meal">
      <div class="meal-head"><span class="ico">${m.icon}</span><div><h3>${m.label}</h3><div class="when">${fmtHM(m.start)} – ${fmtHM(m.end)}</div></div>${pill}</div>
      <div class="chips">${menuFor(state.date, m.id).map(i => `<span class="chip">${esc(i)}</span>`).join('')}</div>
      <div class="avg">${avg === null ? '<span class="muted">No ratings yet</span>' :
        `<span class="big">${emojiFor(avg)} ${avg.toFixed(1)}</span><div class="bar"><i style="width:${avg / 5 * 100}%;background:${colorFor(avg)}"></i></div>
         <button data-goto="${state.date}|${m.id}" class="avg-link" style="all:unset;cursor:pointer;color:var(--accent);font-weight:600;text-decoration:underline">${list.length} review${list.length === 1 ? '' : 's'}</button>`}</div>
      <div class="meal-foot">
        ${st === 'upcoming' ? '<span class="muted">Ratings open when serving starts.</span>'
          : `<button class="${mine ? 'ghost' : 'primary'}" data-rate="${state.date}|${m.id}">${mine ? 'Edit my rating' : '⭐ Rate this meal'}</button>`}
        ${mine ? `<span class="mine-tag">You rated ${emojiFor(mine.stars)}</span>` : ''}
      </div></article>`;
  }).join('');

  return `${hero(now)}
    <section class="stats">
      <div class="stat"><b>${avgToday === null ? '–' : emojiFor(avgToday) + ' ' + avgToday.toFixed(1)}</b><span>Today's average</span></div>
      <div class="stat"><b>${reviews.length}</b><span>Total reviews</span></div>
      <div class="stat"><b>${mineCount}</b><span>Your reviews</span></div>
    </section>
    <div class="days">${strip.join('')}</div>
    <section class="meals">${cards}</section>`;
}

/* ---- reviews feed ---- */
function reviewsView() {
  const now = new Date();
  const dates = [];
  for (let off = 0; off >= -6; off--) dates.push(ymd(addDays(now, off)));
  const list = reviews.filter(r =>
    (state.rDate === 'all' || r.date === state.rDate) &&
    (state.rMeal === 'all' || r.meal === state.rMeal) &&
    (!state.rMine || r.mine)).sort((a, b) => b.ts - a.ts);

  const items = list.map(r => {
    const m = mealById(r.meal);
    return `<article class="rv"><div class="rv-top"><span class="emo">${SCALE[r.stars - 1][0]}</span>
      <div><strong>${m.icon} ${m.label} · ${esc(SCALE[r.stars - 1][1])}${r.mine ? '<span class="you">You</span>' : ''}</strong>
      <small>${parse(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · posted ${fmtTS(r.ts)} · Anonymous</small></div>
      ${r.mine ? `<button class="danger" data-del="${esc(r.id)}">Delete</button>` : ''}</div>
      ${r.comment ? `<p>${esc(r.comment)}</p>` : ''}
      ${r.tags.length ? `<div class="tags">${r.tags.map(t => `<span class="tag ${TAG_KIND[t] || 'pos'}">${esc(t)}</span>`).join('')}</div>` : ''}</article>`;
  }).join('');

  return `<h2 class="sec" style="margin-top:4px">All reviews (${list.length})</h2>
    <div class="filters">
      <select id="fDate"><option value="all">All days</option>${dates.map(d => `<option value="${d}" ${state.rDate === d ? 'selected' : ''}>${d === todayStr() ? 'Today' : parse(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</option>`).join('')}</select>
      <select id="fMeal"><option value="all">All meals</option>${MEALS.map(m => `<option value="${m.id}" ${state.rMeal === m.id ? 'selected' : ''}>${m.label}</option>`).join('')}</select>
      <label><input type="checkbox" id="fMine" ${state.rMine ? 'checked' : ''}> Only mine</label>
    </div>
    <section class="feed">${items || '<div class="empty"><div>📝</div><p>No reviews match these filters.</p></div>'}</section>`;
}

/* ---- insights ---- */
function insightsView() {
  const now = new Date();
  const cols = [];
  for (let off = -6; off <= 0; off++) {
    const d = addDays(now, off), s = ymd(d);
    const avg = mean(reviews.filter(r => r.date === s).map(r => r.stars));
    cols.push(`<div class="col ${off === 0 ? 'today' : ''}"><span class="v">${avg === null ? '–' : avg.toFixed(1)}</span>
      <div class="b" style="height:${avg === null ? 0 : avg / 5 * 100}%;background:${avg === null ? 'transparent' : colorFor(avg)}"></div>
      <span class="l">${off === 0 ? 'Today' : dow(d)}</span></div>`);
  }

  const byMeal = MEALS.map(m => {
    const a = mean(reviews.filter(r => r.meal === m.id).map(r => r.stars));
    return `<div class="hrow"><span>${m.icon} ${m.label}</span><div class="bar"><i style="width:${(a || 0) / 5 * 100}%;background:${a ? colorFor(a) : 'transparent'}"></i></div><b>${a === null ? '–' : a.toFixed(1)}</b></div>`;
  }).join('');

  // dish-level averages derived from the meals they were served in
  const dish = {};
  reviews.forEach(r => menuFor(r.date, r.meal).forEach(name => {
    if (/^(Tea|Coffee|Salad|Onion Salad|Papad|Curd|Banana|Rice|Roti|Steamed Rice)$/.test(name)) return;
    (dish[name] = dish[name] || []).push(r.stars);
  }));
  const ranked = Object.entries(dish).filter(([, a]) => a.length >= 4).map(([n, a]) => [n, mean(a), a.length]).sort((a, b) => b[1] - a[1]);
  const li = ([n, a, c]) => `<li><span>${esc(n)}</span><span><b style="color:${colorFor(a)}">${a.toFixed(1)}</b> <small>(${c})</small></span></li>`;

  const tagCount = {};
  reviews.forEach(r => r.tags.forEach(t => tagCount[t] = (tagCount[t] || 0) + 1));
  const cloud = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).map(([t, c]) => `<span class="tag ${TAG_KIND[t] || 'pos'}">${esc(t)} · ${c}</span>`).join('');

  return `<h2 class="sec" style="margin-top:4px">Mess insights</h2>
    <section class="cards2">
      <div class="panel"><h3>📈 Daily average, last 7 days</h3><div class="trend">${cols.join('')}</div></div>
      <div class="panel"><h3>🍽️ Average by meal</h3>${byMeal}</div>
      <div class="panel"><h3>🏆 Best rated dishes</h3><ul class="dishlist">${ranked.slice(0, 5).map(li).join('') || '<li class="muted">Not enough reviews yet.</li>'}</ul></div>
      <div class="panel"><h3>🛠️ Needs improvement</h3><ul class="dishlist">${ranked.slice(-5).reverse().map(li).join('') || '<li class="muted">Not enough reviews yet.</li>'}</ul></div>
      <div class="panel"><h3>💬 What students mention</h3><div class="cloud">${cloud || '<span class="muted">No tags yet.</span>'}</div></div>
    </section>`;
}

/* ================= rating modal ================= */
function openRate(date, mealId) {
  const m = mealById(mealId);
  if (statusOf(date, m, new Date()) === 'upcoming') { toast('This meal has not started yet.'); return; }
  const ex = myReview(date, mealId);
  modal = { date, mealId, stars: ex ? ex.stars : 0, tags: new Set(ex ? ex.tags : []), comment: ex ? ex.comment : '' };
  drawModal();
  $('#modal').classList.remove('hidden');
  document.body.classList.add('noscroll');
}
function drawModal() {
  const m = mealById(modal.mealId);
  const dateLabel = modal.date === todayStr() ? 'today' : parse(modal.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  $('#modalCard').innerHTML = `
    <div class="modal-head"><h2>${m.icon} Rate ${m.label}</h2><button class="ghost" id="mClose" aria-label="Close">✕</button></div>
    <p class="muted">${esc(menuFor(modal.date, modal.mealId).join(', '))} · ${dateLabel}. Reviews are anonymous.</p>
    <div class="scale">${SCALE.map((s, i) => `<button type="button" data-star="${i + 1}" class="${modal.stars === i + 1 ? 'sel' : ''}"><span>${s[0]}</span><small>${s[1]}</small></button>`).join('')}</div>
    <strong style="font-size:.9rem">What stood out? <span class="muted">(optional)</span></strong>
    <div class="tagpick">${TAGS.map(([t, k]) => `<button type="button" data-tag="${t}" class="${k} ${modal.tags.has(t) ? 'sel' : ''}">${t}</button>`).join('')}</div>
    <textarea id="mText" rows="3" maxlength="200" placeholder="Anything to add? (optional, max 200 characters)">${esc(modal.comment)}</textarea>
    <div class="modal-actions"><button class="ghost" id="mCancel">Cancel</button><button class="primary" id="mSubmit" ${modal.stars ? '' : 'disabled'}>${myReview(modal.date, modal.mealId) ? 'Update rating' : 'Submit rating'}</button></div>`;
}
function closeModal() {
  modal = null;
  $('#modal').classList.add('hidden');
  document.body.classList.remove('noscroll');
}
function submitRating() {
  if (!modal || !modal.stars) return;
  const text = $('#mText').value.trim().slice(0, 200);
  const prev = reviews.slice();
  reviews = reviews.filter(r => !(r.mine && r.date === modal.date && r.meal === modal.mealId));
  reviews.push({ id: uid(), date: modal.date, meal: modal.mealId, stars: modal.stars, tags: [...modal.tags], comment: text, ts: Date.now(), mine: true });
  if (!save()) { reviews = prev; return; }
  closeModal(); render(); toast('Thanks! Your rating is in 🎉');
}

/* ================= events ================= */
document.addEventListener('click', e => {
  const t = e.target;
  const tab = t.closest('#tabs [data-view]');
  if (tab) { state.view = tab.dataset.view; render(); window.scrollTo(0, 0); return; }
  const day = t.closest('[data-date]');
  if (day) { state.date = day.dataset.date; render(); return; }
  const rate = t.closest('[data-rate]');
  if (rate) { const [d, m] = rate.dataset.rate.split('|'); openRate(d, m); return; }
  const go = t.closest('[data-goto]');
  if (go) { const [d, m] = go.dataset.goto.split('|'); state.view = 'reviews'; state.rDate = d; state.rMeal = m; state.rMine = false; render(); return; }
  const del = t.closest('[data-del]');
  if (del) {
    if (!confirm('Delete your review?')) return;
    reviews = reviews.filter(r => !(r.mine && r.id === del.dataset.del));
    save(); render(); toast('Review deleted'); return;
  }
  if (t.id === 'modal' && modal) { closeModal(); return; }
  if (!modal) return;
  if (t.closest('#mClose') || t.closest('#mCancel')) { closeModal(); return; }
  const star = t.closest('[data-star]');
  if (star) { modal.comment = $('#mText').value; modal.stars = +star.dataset.star; drawModal(); return; }
  const tag = t.closest('[data-tag]');
  if (tag) { modal.comment = $('#mText').value; const v = tag.dataset.tag; modal.tags.has(v) ? modal.tags.delete(v) : modal.tags.add(v); drawModal(); return; }
  if (t.closest('#mSubmit')) submitRating();
});
document.addEventListener('change', e => {
  if (e.target.id === 'fDate') { state.rDate = e.target.value; render(); }
  if (e.target.id === 'fMeal') { state.rMeal = e.target.value; render(); }
  if (e.target.id === 'fMine') { state.rMine = e.target.checked; render(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal) closeModal(); });

// keep "serving now" / countdowns fresh, and roll over at midnight
setInterval(() => {
  if (modal) return;
  const t = todayStr();
  if (state.view === 'menu' && state.date < ymd(addDays(new Date(), -6))) state.date = t;
  render();
}, 60000);

render();
})();
