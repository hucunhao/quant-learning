// 通用：小工具、页眉页脚、术语小卡片、先猜模块、动画播放器
const DASHBOARD = 'https://hucunhao.github.io/macro-notebook/';
const U = (() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ts = d => Date.UTC(+d.slice(0,4), +d.slice(5,7)-1, +d.slice(8,10)) / 1000;
  const dstr = t => new Date(t*1000).toISOString().slice(0,10);
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const ser = id => (window.MS && MS.series[id] && MS.series[id].v.length) ? MS.series[id] : null;
  const last = a => a[a.length-1];
  const fmtNum = (x, nd=2) => x == null || isNaN(x) ? '—' : Number(x).toLocaleString('zh-CN', {minimumFractionDigits:nd, maximumFractionDigits:nd});
  const minus = s => s.replace(/^-/, '−');
  const pct = (x, nd=1, sign=true) => x == null || isNaN(x) ? '—' : minus((sign && x > 0 ? '+' : '') + (x*100).toFixed(nd) + '%');
  const sgn = (x, nd=2, unit='') => x == null || isNaN(x) ? '—' : minus((x > 0 ? '+' : '') + x.toFixed(nd) + unit);
  const median = a => { const b = [...a].sort((x,y)=>x-y), m = b.length>>1; return b.length ? (b.length%2 ? b[m] : (b[m-1]+b[m])/2) : null; };
  const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : null;
  const quant = (a, q) => { if(!a.length) return null; const b=[...a].sort((x,y)=>x-y), k=(b.length-1)*q, f=Math.floor(k), c=Math.ceil(k); return f===c?b[f]:b[f]+(b[c]-b[f])*(k-f); };
  const store = {
    get(k, def){ try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch(e){ return def; } },
    set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  };
  // 极简 markdown：标题、列表（- 和 1.）、表格、**粗体**、*斜体*
  function md(src){
    const inl = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>');
    const out = []; let list = null, para = [], tbl = null;
    const flush = () => { if (para.length){ out.push('<p>' + inl(para.join(' ')) + '</p>'); para = []; } };
    const endList = () => { if (list){ out.push(`</${list}>`); list = null; } };
    const endTbl = () => { if (tbl){ out.push('<div class="tablewrap"><table><thead><tr>' + tbl[0].map(c => `<th>${inl(c)}</th>`).join('') + '</tr></thead><tbody>' + tbl.slice(1).map(r => '<tr>' + r.map(c => `<td>${inl(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>'); tbl = null; } };
    src.split(/\r?\n/).forEach(line => {
      const l = line.trim();
      if (/^\|.*\|$/.test(l)){ flush(); endList(); if (/^\|[\s:|-]+\|$/.test(l)) return; (tbl = tbl || []).push(l.slice(1, -1).split('|').map(c => c.trim())); return; }
      endTbl();
      if (/^#{1,6}\s/.test(l)){ flush(); endList(); const n = l.match(/^#+/)[0].length; out.push(`<h${Math.min(n+1,4)}>${inl(l.replace(/^#+\s*/, ''))}</h${Math.min(n+1,4)}>`); }
      else if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)){ flush(); const t = /^\s*\d+\./.test(line) ? 'ol' : 'ul'; if (list !== t){ endList(); out.push(`<${t}>`); list = t; } out.push('<li>' + inl(line.replace(/^\s*([-*]|\d+\.)\s+/, '')) + '</li>'); }
      else if (!l){ flush(); endList(); }
      else { endList(); para.push(l); }
    });
    flush(); endList(); endTbl();
    return out.join('');
  }
  return { md, $, $$, esc, ts, dstr, css, ser, last, fmtNum, pct, sgn, median, mean, quant, store, minus };
})();

// 术语：鼠标放上去（或点一下）才出现的小卡片。专业词保留，旁边不写长解释。
const TERMS = {
  '回撤': '从最高点算起跌了多少。最高 100、今天 85，回撤就是 −15%。',
  '中位数': '把所有结果从小到大排好，正中间那个。不受一两个极端值影响。',
  '平均数': '全部加起来除以个数。一次大灾难就能把它拖下来。',
  '基准': '拿来比较的尺子。这里是“随便哪一天买入，一年后怎样”。',
  '分位数': '10% 分位 = 排在最差 10% 那条线上的结果；90% 分位 = 最好 10% 那条线。',
  '对数刻度': '纵轴按百分比画：从 100 涨到 200 和从 1000 涨到 2000 一样高。几十年的长图要用它，否则早年的波动看不见。',
  '信用利差': '企业借钱比国家多付的利息。企业越让人担心，这个差就越大。单位常用 bp。',
  'bp': '基点。1bp = 0.01%，100bp = 1%。利差 331bp 就是多付 3.31% 的利息。',
  'HY OAS': '高收益债（俗称垃圾债）的利差：信用最差的一批公司借钱要多付的利息。来自 ICE / FRED。',
  'IG OAS': '投资级债的利差：信用较好的大公司借钱要多付的利息。',
  'CCC': '高收益债里评级最低的一档，最容易违约。',
  'BAA10Y': '穆迪 Baa 级公司债收益率减 10 年期美国国债收益率。1986 年就有数据，用来看长历史。和 HY OAS 方向相近，但不是同一个东西。',
  '标准差': '数据通常离平均有多远。标准差 71，就是“一般离平均 71 左右”。',
  'z 分数': '今天离平均几个标准差。z = +2 就是比平均高出两个“通常距离”。',
  '百分位': '过去有多少比例的时候比今天低。90% = 今天比过去 90% 的时候都高。',
  '窗口': '拿来比较的那段过去，比如“过去 3 年”或“过去全部”。',
  '偷看未来': '回测时不小心用了当时还不知道的数据，结果会好得不真实。',
  '肥尾': '极端情况比钟形曲线预计的多得多。',
  '正态分布': '也叫钟形曲线。中间多、两边少，左右对称。课本里很多公式都假设数据长这样。',
  'VIX': '恐慌指数：用期权价格算出的、市场预期未来 30 天标普的波动。平时 12–20，恐慌时 30 以上。',
  '国库券': '3 个月期美国国债，几乎没有风险，相当于“把钱放在最安全的地方吃利息”。',
  '样本内': '拿来设计和练习的那段历史（这里是 1986–2005）。',
  '样本外': '设计规则时没看过的那段历史（这里是 2006–2026），相当于考试。',
  '年化收益': '把多年的总收益折算成“平均每年多少”。',
  '最大回撤': '整段时间里，从最高点跌到最低点最狠的那一次。',
  '夏普比率': '每承担 1 份波动，比国库券多赚多少。越高越好。',
  '来回打脸': '卖出之后不到 8 周又买回来（或反过来）。白付一次成本，常常还卖低买高。',
  'QDII': '在国内买海外资产的基金。场外申赎有费用，到账要几天，还可能有额度限制。',
  '过度拟合': '在历史里把参数调到“最好看”，其实是碰巧贴合了过去，以后多半失灵。',
};
function T(word, label){ const t = TERMS[word]; if (!t) return U.esc(label || word); return `<span class="term" tabindex="0">${U.esc(label || word)}<span class="tip"><b>${U.esc(word)}</b>　${U.esc(t)}</span></span>`; }

// 页眉页脚
const Layout = (() => {
  const NAV = [['index.html','课程首页','home'],['week1.html','第 1 周','w1'],['week2.html','第 2 周','w2'],['week3.html','第 3 周','w3'],['index.html#later','第 4–6 周 · 即将开放','later','soon'],['notes.html','我的笔记','notes']];
  function init(page){
    const h = document.createElement('header'); h.className = 'top';
    h.innerHTML = `<div class="wrap"><a class="brand" href="index.html"><i></i>量化学习</a><nav class="main">${NAV.map(([href, t, id, cls]) => `<a href="${href}" class="${id === page ? 'on' : ''} ${cls || ''}">${t}</a>`).join('')}</nav><a class="ext" href="${DASHBOARD}" target="_blank" rel="noopener">Market Dashboard ↗</a></div>`;
    document.body.prepend(h);
    const f = document.createElement('footer');
    const gen = window.MS && MS.meta ? `数据截至 ${MS.meta.generated}（台北时间），是固定的历史快照，不每天更新。` : '';
    f.innerHTML = `<div class="wrap">${gen} 每天的市场读数请看 <a href="${DASHBOARD}" target="_blank" rel="noopener">Market Dashboard</a>。<br>本站只用于个人学习，不构成任何投资建议。历史回测不代表未来。</div>`;
    document.body.appendChild(f);
  }
  return { init };
})();

// 先猜：写下答案并提交后，答案才出现；全部提交后才解锁数据
const Predict = (() => {
  const K = 'ql_predict';
  function all(){ return U.store.get(K, {}); }
  function block(qs, onAll){
    const saved = all();
    const el = document.createElement('div'); el.className = 'card predict'; el.id = 'guess';
    el.innerHTML = `<h3 style="margin-top:0">先猜一猜，再看数据</h3><p class="small muted" style="margin:0">凭直觉写就行，猜错正好说明值得学。写完并提交后才会看到答案；两题都提交后，下面的数据和解读才会打开。答案只存在这台设备的浏览器里。</p>` +
      qs.map((x, i) => `<div data-q="${x.id}"><div class="q">${i+1}. ${x.q}</div>
        ${x.chips ? `<div class="chips">${x.chips.map(c => `<button type="button">${U.esc(c)}</button>`).join('')}</div>` : ''}
        <textarea placeholder="写下你的猜测，可以点上面的选项快速填…">${U.esc(saved[x.id] || '')}</textarea>
        <div style="margin-top:8px;display:flex;gap:10px;align-items:center"><button class="btn primary small sub">提交我的猜测</button><span class="small muted saved"></span></div>
        <div class="answer" hidden></div></div>`).join('');
    function refresh(){
      const s = all();
      qs.forEach(x => { const box = U.$(`[data-q="${x.id}"]`, el), a = U.$('.answer', box);
        if (s[x.id]){ a.hidden = false; a.innerHTML = `<b>实际数据：</b>${x.ans()}`; U.$('.saved', box).textContent = '已提交，可以改了再提交'; }
        else { a.hidden = true; a.innerHTML = ''; U.$('.saved', box).textContent = ''; } });
      onAll(qs.every(x => s[x.id]));
    }
    qs.forEach(x => { const box = U.$(`[data-q="${x.id}"]`, el), ta = U.$('textarea', box);
      U.$$('.chips button', box).forEach(b => b.onclick = () => { ta.value = b.textContent; ta.focus(); });
      U.$('.sub', box).onclick = () => { const v = ta.value.trim(); if (!v){ ta.focus(); return; } const s = all(); s[x.id] = v; s[x.id + '_t'] = new Date().toISOString(); U.store.set(K, s); refresh(); }; });
    setTimeout(refresh, 0);
    return el;
  }
  return { block, all, K };
})();

// 画布小工具：按设备像素比设置大小，返回 ctx 和宽高
const Cv = (() => {
  function setup(cv, h){
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 600; h = h || cv.clientHeight || 260;
    cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr); cv.style.height = h + 'px';
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    ctx.font = '13px ' + U.css('--font'); ctx.textBaseline = 'middle';
    return { ctx, w, h };
  }
  // 分步播放器：steps = [{cap, at}]；draw(t) 里 t 从 0 到 1；会更新说明文字和小圆点
  function player(root, { steps, draw, dur = 9000 }){
    const bar = document.createElement('div'); bar.className = 'stepbar';
    bar.innerHTML = `<button class="btn small primary" data-a="play">▶ 播放</button><button class="btn small" data-a="prev">上一步</button><button class="btn small" data-a="next">下一步</button><div class="cap"></div><div class="dots">${steps.map(() => '<i></i>').join('')}</div>`;
    root.appendChild(bar);
    let t = 0, raf = null, t0 = 0, from = 0, target = 1;
    const cap = U.$('.cap', bar), pb = U.$('[data-a=play]', bar);
    const stepAt = t => { let k = 0; steps.forEach((s, i) => { if (t >= s.at - 1e-9) k = i; }); return k; };
    function paint(){ draw(t); const k = stepAt(t); cap.innerHTML = `<b>第 ${k+1} 步</b>　${steps[k].cap}`; U.$$('.dots i', bar).forEach((d, i) => d.classList.toggle('on', i <= k)); }
    function stop(){ if (raf) cancelAnimationFrame(raf); raf = null; pb.textContent = t >= 1 ? '↺ 重放' : '▶ 播放'; }
    function run(to){ stop(); from = t; target = to; t0 = performance.now(); pb.textContent = '❚❚ 暂停';
      const span = Math.max(0.001, Math.abs(target - from)) * dur;
      const tick = now => { const p = Math.min(1, (now - t0) / span); t = from + (target - from) * p; paint(); if (p < 1) raf = requestAnimationFrame(tick); else stop(); };
      raf = requestAnimationFrame(tick); }
    pb.onclick = () => { if (raf) return stop(); if (t >= 1) t = 0; run(1); };
    U.$('[data-a=next]', bar).onclick = () => { const k = stepAt(t); run(k + 1 < steps.length ? steps[k+1].at : 1); };
    U.$('[data-a=prev]', bar).onclick = () => { stop(); const k = stepAt(t); t = steps[Math.max(0, t > steps[k].at + 0.01 ? k : k-1)].at; paint(); };
    window.addEventListener('resize', paint);
    paint();
    const api = { set(v){ stop(); t = v; paint(); }, get t(){ return t; }, paint };
    (window.__players = window.__players || []).push(api);
    return api;
  }
  return { setup, player };
})();

// 顶部路线条：点到对应区域；进度随解锁变化
function weekSteps(el, unlocked){
  el.innerHTML = [['#guess','① 先猜','写下直觉'],['#concept','② 看懂概念','动画 + 数字'],['#data','③ 看数据','解锁后可看'],['#take','④ 要点和解读','几句话总结'],['#pits','⑤ 要小心','常见的坑']]
    .map(([h, b, s], i) => `<a href="${h}" class="${i < 2 || unlocked ? 'done' : ''}"><b>${b}</b>${s}</a>`).join('');
}
