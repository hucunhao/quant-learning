// 第 1 周：回撤与分档加仓。算法和 Market Dashboard 的 update_data.py 一致（结果已核对）。
const Week1 = (() => {
  const START = '1990-01-01';
  const PLAN = { SPX:[10,20,30], NDX:[15,25,35] };
  const NAME = { SPX:'标普 500', NDX:'纳指 100' };
  function analyze(d, p, tiers){
    const n = p.length, hi = new Array(n), hix = new Array(n); let m = -Infinity, mi = 0;
    for (let i = 0; i < n; i++){ if (p[i] > m){ m = p[i]; mi = i; } hi[i] = m; hix[i] = mi; }
    const dd = p.map((x, i) => x/hi[i] - 1);
    const i0 = d.findIndex(x => x >= START);
    const events = []; let cur = null;
    for (let i = i0; i < n; i++){
      if (p[i] >= hi[i] && (i === 0 || p[i] > hi[i-1] - 1e-12)){ if (cur){ cur.end = i; events.push(cur); cur = null; } continue; }
      for (const t of tiers){ if (dd[i] <= -t/100){ if (!cur) cur = { start:i, peak:hi[i], peak_i:hix[i], trig:{}, end:null }; if (!(t in cur.trig)) cur.trig[t] = i; } }
    }
    if (cur) events.push(cur);
    const rows = [];
    events.forEach(e => tiers.forEach(t => { if (!(t in e.trig)) return; const i = e.trig[t];
      let r12 = null, w12 = null;
      if (i + 252 < n){ r12 = p[i+252]/p[i] - 1; let mn = Infinity; for (let k = i; k <= i+252; k++) if (p[k] < mn) mn = p[k]; w12 = mn/p[i] - 1; }
      rows.push({ tier:t, date:d[i], price:p[i], peak_date:d[e.peak_i], peak:e.peak, ret12:r12, worse12:w12, recover: e.end != null ? e.end - i : null, i });
    }));
    return { dd, hi, rows };
  }
  const baseCache = {};
  function baseline(key, d, p){
    if (baseCache[key]) return baseCache[key];
    const n = p.length, i0 = d.findIndex(x => x >= START), R = [], W = [];
    for (let i = i0; i < n-252; i++){ R.push(p[i+252]/p[i] - 1); let mn = Infinity; for (let k = i; k <= i+252; k++) if (p[k] < mn) mn = p[k]; W.push(mn/p[i] - 1); }
    return baseCache[key] = { n:R.length, ret_med:U.median(R), ret_mean:U.mean(R), ret_p10:U.quant(R,.1), ret_p90:U.quant(R,.9), w_med:U.median(W), share_w10: W.filter(x => x <= -0.10).length / W.length };
  }
  function summarize(rows, tiers){
    return tiers.map(t => { const rs = rows.filter(r => r.tier === t), done = rs.filter(r => r.ret12 != null);
      const R = done.map(r => r.ret12), W = done.map(r => r.worse12);
      return { tier:t, episodes:rs.length, complete:done.length, ret_med:U.median(R), ret_mean:U.mean(R), ret_min:R.length ? Math.min(...R) : null, ret_p10:U.quant(R,.1), ret_p90:U.quant(R,.9), w_med:U.median(W), share_w10: W.length ? W.filter(x => x <= -0.10).length / W.length : null }; });
  }

  const Q = [
    { id:'w1q1', q:'从 1990 年到现在，标普 500 从历史最高点下跌 20% 以上，分开算一共发生过几轮？纳指 100 下跌 25% 以上呢？', chips:['2 轮左右','4 轮左右','6–8 轮','10 轮以上'],
      ans: () => { const a = W1.SPX.summary.find(s => s.tier === 20), b = W1.NDX.summary.find(s => s.tier === 25);
        return `标普 −20%：<b>${a.episodes} 轮</b>（${W1.SPX.rows.filter(r => r.tier === 20).map(r => r.date.slice(0,4)).join('、')}）；纳指 100 −25%：<b>${b.episodes} 轮</b>（${W1.NDX.rows.filter(r => r.tier === 25).map(r => r.date.slice(0,4)).join('、')}）。比很多人想的少，深跌很少见。`; } },
    { id:'w1q2', q:'标普第一次跌到 −10% 之后再等 12 个月，结果通常比“随便哪一天买入”更好还是更差？差多少？', chips:['更好，多 5% 以上','差不多','更差'],
      ans: () => { const a = W1.SPX.summary.find(s => s.tier === 10), b = W1.SPX.baseline;
        const neg = W1.SPX.rows.filter(r => r.tier === 10 && r.ret12 != null && r.ret12 < 0);
        return `看<b>中位数</b>：−10% 触发后一年 ${U.pct(a.ret_med)}，随便哪天买 ${U.pct(b.ret_med)}，好一些。看<b>平均数</b>正好反过来：${U.pct(a.ret_mean)} 对 ${U.pct(b.ret_mean)}。原因是 ${a.complete} 次里有 ${neg.length} 次一年后还在亏：${neg.map(r => r.date.slice(0,4) + ' 年 ' + U.pct(r.ret12)).join('，')}，其中 2007 年那次一下子拖低了平均数。`; } },
  ];

  // —— 概念动画 1：回撤是怎么来的、“轮”怎么数 ——
  function demoPath(){
    const keys = [[0,100],[22,118],[38,103],[50,112],[62,126],[96,85],[112,101],[124,92],[150,134],[159,131]];
    const P = []; let s = 7;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 - 0.5; };
    for (let k = 0; k < keys.length - 1; k++){ const [a, va] = keys[k], [b, vb] = keys[k+1];
      for (let i = a; i < b; i++){ const f = (i - a)/(b - a); P.push(va + (vb - va) * f + (i === a ? 0 : rnd() * 2.2)); } }
    P.push(keys[keys.length-1][1]);
    return P;
  }
  function ddAnim(root){
    const cv = document.createElement('canvas'); cv.className = 'anim'; root.appendChild(cv);
    const P = demoPath(), N = P.length, tiers = [10, 20, 30], cols = ['#3b6ea8', '#e08a2e', '#c4553f'];
    const hi = [], dd = []; let m = -1; P.forEach((p, i) => { m = Math.max(m, p); hi.push(m); dd.push(p/m - 1); });
    // 找每一轮里每档第一次跌破的点
    const marks = []; let inEv = false, got = {}, firstDown = null, newHigh = null;
    P.forEach((p, i) => { if (dd[i] >= -1e-9){ if (inEv && newHigh == null) newHigh = i; inEv = false; got = {}; return; }
      if (firstDown == null && dd[i] < -0.02) firstDown = i;
      tiers.forEach((t, k) => { if (dd[i] <= -t/100 && !got[t]){ got[t] = 1; inEv = true; marks.push({ i, k }); } }); });
    const at = i => i/(N-1);
    const m2 = marks.filter(x => x.i > newHigh);
    const steps = [
      { at:0, cap:'价格往上走，<b>虚线是“到今天为止的最高价”</b>，跟着抬高。这时回撤是 0。' },
      { at:at(firstDown), cap:'价格回落，最高价不动。<b>两者之间的差距（橙色竖线）就是回撤</b>，画在下面那张图里。' },
      { at:at(marks[0].i), cap:'回撤跌破 −10% 线：<b>第 1 档触发</b>，打一个蓝点。这一轮里它只记一次，之后在 −10% 下面待多少天都不再数。' },
      { at:at(newHigh), cap:'价格涨回最高价以上：<b>这一轮结束</b>。以后再跌，算新的一轮。' },
      { at:at(m2[1].i), cap:'第二轮跌得更深：第 1 档、第 2 档先后触发……' },
      { at:at(m2[2].i), cap:'……一直跌到约 −33%，<b>三档全部触发</b>。' },
      { at:0.999, cap:'数一数：第 1 档触发 <b>2 次</b>，第 2、3 档各 <b>1 次</b>。下面的历史数据也是这样按“轮”来数。' },
    ];
    function draw(t){
      const { ctx, w, h } = Cv.setup(cv, 340), L = 46, R = 150, top = 14, ph = 170, dTop = 214, dh = 110;
      const n = Math.max(1, Math.round(t*(N-1)));
      const X = i => L + i/(N-1) * (w - L - R), Y = v => top + ph - (v - 75)/(140 - 75) * ph, YD = v => dTop + (-v)/0.36 * dh;
      ctx.strokeStyle = '#e4dfd5'; ctx.lineWidth = 1; ctx.fillStyle = '#8b939b';
      [80, 100, 120, 140].forEach(v => { ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(w - R, Y(v)); ctx.stroke(); ctx.fillText(v, 12, Y(v)); });
      ctx.fillText('价格', L, 8); ctx.fillText('回撤', L, dTop - 12);
      ctx.beginPath(); ctx.moveTo(L, YD(0)); ctx.lineTo(w - R, YD(0)); ctx.stroke(); ctx.fillText('0%', 12, YD(0));
      tiers.forEach((tt, k) => { ctx.strokeStyle = cols[k]; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(L, YD(-tt/100)); ctx.lineTo(w - R, YD(-tt/100)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = cols[k]; ctx.fillText(`−${tt}%`, 8, YD(-tt/100)); ctx.fillText(`第 ${k+1} 档`, w - R + 8, YD(-tt/100)); });
      // 最高价虚线
      ctx.strokeStyle = '#8b939b'; ctx.setLineDash([4, 4]); ctx.beginPath(); for (let i = 0; i <= n; i++) i ? ctx.lineTo(X(i), Y(hi[i])) : ctx.moveTo(X(i), Y(hi[i])); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = '#26303a'; ctx.lineWidth = 2.2; ctx.beginPath(); for (let i = 0; i <= n; i++) i ? ctx.lineTo(X(i), Y(P[i])) : ctx.moveTo(X(i), Y(P[i])); ctx.stroke();
      // 回撤面积
      ctx.fillStyle = 'rgba(224,138,46,.22)'; ctx.beginPath(); ctx.moveTo(X(0), YD(0)); for (let i = 0; i <= n; i++) ctx.lineTo(X(i), YD(dd[i])); ctx.lineTo(X(n), YD(0)); ctx.fill();
      ctx.strokeStyle = '#e08a2e'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= n; i++) i ? ctx.lineTo(X(i), YD(dd[i])) : ctx.moveTo(X(i), YD(dd[i])); ctx.stroke();
      marks.filter(mk => mk.i <= n).forEach(mk => { ctx.fillStyle = cols[mk.k]; ctx.beginPath(); ctx.arc(X(mk.i), YD(dd[mk.i]), 6, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); });
      // 当前点：竖线 + 读数
      const x = X(n); ctx.strokeStyle = '#e08a2e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, Y(hi[n])); ctx.lineTo(x, Y(P[n])); ctx.stroke();
      ctx.fillStyle = '#26303a'; ctx.beginPath(); ctx.arc(x, Y(P[n]), 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#26303a'; ctx.font = '14px ' + U.css('--font');
      const bx = w - R + 8; ctx.fillText(`最高价 ${hi[n].toFixed(0)}`, bx, top + 20); ctx.fillText(`今天 ${P[n].toFixed(0)}`, bx, top + 44);
      ctx.fillStyle = '#e08a2e'; ctx.font = 'bold 16px ' + U.css('--font'); ctx.fillText(`回撤 ${U.pct(dd[n])}`, bx, top + 72);
      ctx.font = '12px ' + U.css('--font'); ctx.fillStyle = '#8b939b'; ctx.fillText(`${P[n].toFixed(0)} ÷ ${hi[n].toFixed(0)} − 1`, bx, top + 96);
    }
    Cv.player(root, { steps, draw, dur:14000 });
  }
  // —— 概念动画 2：平均数被一次灾难拖下来，中位数不动 ——
  function meanMedian(root){
    root.innerHTML = `<canvas class="anim"></canvas>
      <div class="slider"><span>第 5 年的结果</span><input type="range" min="-60" max="30" value="-40" step="1"><span class="v"></span></div>
      <div class="formula" id="mm-f"></div>`;
    const cv = U.$('canvas', root), sl = U.$('input', root);
    const fixed = [20, 15, 12, 10];
    function draw(){
      const v = +sl.value, a = [...fixed, v], mean = U.mean(a), med = U.median(a);
      U.$('.v', root).textContent = U.sgn(v, 0, '%');
      const { ctx, w, h } = Cv.setup(cv, 150), L = 30, R = 30, X = x => L + (x + 60)/90 * (w - L - R), y = 70;
      ctx.strokeStyle = '#d8d1c4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(w - R, y); ctx.stroke();
      ctx.fillStyle = '#8b939b'; ctx.textAlign = 'center'; [-60, -40, -20, 0, 20].forEach(t => { ctx.fillRect(X(t) - .5, y - 4, 1, 8); ctx.fillText(U.sgn(t, 0, '%'), X(t), y + 18); });
      a.forEach((x, i) => { ctx.fillStyle = i === 4 ? '#c4553f' : '#3b6ea8'; ctx.beginPath(); ctx.arc(X(x), y - 14 - (i === 4 ? 0 : (i % 2) * 12), 8, 0, 7); ctx.fill(); });
      const mk = (x, col, txt, up) => { ctx.fillStyle = col; ctx.beginPath(); const yy = up ? y - 46 : y + 34; ctx.moveTo(X(x), up ? y - 34 : y + 26); ctx.lineTo(X(x) - 7, yy); ctx.lineTo(X(x) + 7, yy); ctx.fill(); ctx.font = 'bold 14px ' + U.css('--font'); ctx.fillText(txt, X(x), up ? y - 58 : y + 48); };
      mk(med, '#2f7d6d', `中位数 ${U.sgn(med, 0, '%')}`, true); mk(mean, '#e08a2e', `平均数 ${U.sgn(mean, 1, '%')}`, false);
      ctx.textAlign = 'left';
      const sorted = [...a].sort((p, q) => p - q);
      U.$('#mm-f', root).innerHTML = `5 年的结果：+20%、+15%、+12%、+10%、<span class="hl">${U.sgn(v, 0, '%')}</span><br>
        平均数 = (20 + 15 + 12 + 10 ${v < 0 ? '− ' + (-v) : '+ ' + v}) ÷ 5 = <b>${U.sgn(mean, 1, '%')}</b><br>
        中位数 = 从小到大排好（${sorted.map(x => U.sgn(x, 0)).join('、')}），正中间那个 = <b>${U.sgn(med, 0, '%')}</b><br>
        <span class="muted">拖动看看：一次大灾难只拉动平均数，中位数几乎不动。所以下面两个都给你看。</span>`;
    }
    sl.oninput = draw; draw(); window.addEventListener('resize', draw);
  }

  let state = { key:'SPX', tiers:{ SPX:[...PLAN.SPX], NDX:[...PLAN.NDX] }, explore:{ SPX:20, NDX:25 } };
  function render(app){
    const spx = U.ser('SPX'), ndx = U.ser('NDX');
    app.innerHTML = `
      <div class="muted small">第 1 周 / 共 6 周</div>
      <h1>回撤：你的分档加仓多久触发一次？</h1>
      <p class="lead">你的计划是：标普 500 从最高点跌 10%、20%、30%，纳指 100 跌 15%、25%、35% 时，各多买一档。这一周用 1990 年以来的真实数据，看这些档位到底多常见、买完以后一年怎么样。</p>
      <div class="steps" id="steps"></div>
      <div class="question">每一档历史上触发过几次？第一次触发后的 12 个月，比“随便哪一天买入”好还是差？
        <small>数据：标普 500 来自 Cboe（${spx.start} 起），纳指 100 来自 FRED（${ndx.start} 起），到 ${spx.end}。都是不含分红的价格指数。</small></div>
      <h2><span class="n">1</span>先猜</h2><div id="pred"></div>
      <h2 id="concept"><span class="n">2</span>看懂概念</h2>
      <div class="card concept"><h3>${T('回撤')}<span class="gloss">从最高点跌了多少</span></h3>
        <p class="small muted">点“播放”，看回撤怎么一步步算出来，以及为什么按“轮”数、不按天数。</p><div id="dd-anim"></div>
        <h3 style="margin-top:22px">自己算一次</h3>
        <div class="slider"><span>今天的价格</span><input type="range" min="50" max="110" value="85" id="c-now"><span class="v" id="c-nowv"></span></div>
        <div class="formula" id="c-f"></div>
      </div>
      <div class="card concept" style="margin-top:16px"><h3>${T('平均数')}和${T('中位数')}<span class="gloss">“平均情况”和“通常情况”</span></h3><div id="mm"></div></div>
      <h2 id="data"><span class="n">3</span>看数据</h2><div id="lock"></div>
      <h2 id="take"><span class="n">4</span>要点和解读</h2><div id="take-body"></div>
      <h2 id="pits"><span class="n">5</span>要小心</h2>
      <div class="card pits">
        <details><summary>次数太少</summary><p>深的档位只有 2–4 轮。用 3 个例子算出来的百分比只是故事，不是统计，换一个例子结论就可能翻过来。</p></details>
        <details><summary>按“轮”数，不按“天”数</summary><p>2008 年标普在 −10% 以下待了几百天。如果按天数算，一次危机会被当成几百个样本。</p></details>
        <details><summary>“历史最高点”会把一些回调并到一起</summary><p>2010、2011 年标普从局部高点跌了 16–19%，但还没回到 2007 年的最高点，所以都算在 2007 年那一轮里。</p></details>
        <details><summary>没算分红</summary><p>标普每年大约 1.5–2% 的分红没算进去，长期回报会被低估。“触发后”和“随便哪天”两组都少算，所以对比影响不大。</p></details>
        <details><summary>你买的是 QDII 基金，不是指数本身</summary><p>还有汇率、费用、溢价和申购额度限制，这里都没算。</p></details>
      </div>`;
    const lock = U.$('#lock'), steps = U.$('#steps');
    U.$('#pred').appendChild(Predict.block(Q, ok => { lock.dataset.ok = ok ? '1' : ''; weekSteps(steps, ok); drawLocked(); }));
    weekSteps(steps, false);
    ddAnim(U.$('#dd-anim'));
    meanMedian(U.$('#mm'));
    const calc = () => { const b = +U.$('#c-now').value; U.$('#c-nowv').textContent = b;
      U.$('#c-f').innerHTML = `最高价 100，今天 <span class="hl">${b}</span><br>${b} ÷ 100 = ${(b/100).toFixed(2)}　→　${(b/100).toFixed(2)} − 1 = ${U.minus((b/100 - 1).toFixed(2))}　→　回撤 <b>${U.pct(b/100 - 1, 0)}</b>${b >= 100 ? '（涨回最高价以上，回撤是 0，最高价换成新的）' : ''}<br><span class="muted">写成式子：</span><span class="sym">回撤 = 今天价格 ÷ 最高价 − 1</span>`; };
    U.$('#c-now').oninput = calc; calc();

    function drawLocked(){
      const tk = U.$('#take-body');
      if (!lock.dataset.ok){
        lock.innerHTML = `<div class="lockmsg"><span class="ico">🔒</span>先在上面写下两道题的猜测并提交，图表和结果才会出现。</div>`;
        tk.innerHTML = `<div class="lockmsg"><span class="ico">🔒</span>要点会揭晓答案，提交猜测后显示。</div>`; return; }
      if (lock.dataset.drawn) return; lock.dataset.drawn = '1';
      takeaways(tk);
      lock.innerHTML = `
        <div class="card">
          <div class="btns"><span class="lbl">看哪个指数</span><button class="btn small" data-k="SPX">标普 500</button><button class="btn small" data-k="NDX">纳指 100</button></div>
          <div class="kpis" id="w1-kpi"></div>
          <div class="chart-title">指数走势<span>${T('对数刻度')}，圆点 = 每一轮里每档第一次触发</span></div><div id="w1-price"></div>
          <div class="chart-title">回撤<span>虚线 = 你的三个档位</span></div><div id="w1-dd"></div>
          <div id="w1-tiers"></div>
        </div>
        <div class="card" style="margin-top:16px"><h3 style="margin-top:0">触发后一年：每一档 vs 随便哪天买</h3>
          <p class="small muted">柱子 = 一年后收益的${T('中位数')}。灰色那根是${T('基准')}：1990 年以来每一个交易日买入、一年后的结果。</p>
          <canvas class="anim" id="w1-bars"></canvas>
          <details class="more"><summary>完整统计表</summary><div class="body tablewrap" id="w1-sum"></div></details>
          <details class="more"><summary>每一轮的明细</summary><div class="body tablewrap" id="w1-rows"></div></details>
        </div>
        <div class="card" style="margin-top:16px"><h3 style="margin-top:0">探索：如果档位放在别处？<span class="tag y" style="margin-left:8px">只是探索，不是新规则</span></h3>
          <p class="small">拖动看看触发次数和之后的结果怎么变。样本只有几次时，挑出来的“最好档位”大多是碰巧（第 6 周专门讲${T('过度拟合')}），所以别据此改规则。</p>
          <div class="slider"><span>档位</span><input type="range" min="8" max="40" step="1" id="w1-ex"><span class="v" id="w1-exv"></span></div>
          <div class="kpis" id="w1-exout"></div>
        </div>`;
      U.$$('[data-k]', lock).forEach(b => b.onclick = () => { state.key = b.dataset.k; update(); });
      U.$('#w1-ex').oninput = () => { state.explore[state.key] = +U.$('#w1-ex').value; explore(); };
      update();
    }
    function update(){
      const key = state.key, s = U.ser(key), tiers = state.tiers[key];
      U.$$('[data-k]', lock).forEach(b => b.classList.toggle('on', b.dataset.k === key));
      const A = analyze(s.d, s.v, tiers), base = baseline(key, s.d, s.v);
      const i0 = s.d.findIndex(x => x >= START);
      const x = s.d.slice(i0).map(U.ts), px = s.v.slice(i0), dd = A.dd.slice(i0).map(v => v*100);
      const cols = [U.css('--chart1'), U.css('--chart2'), U.css('--r')];
      const pts = A.rows.map(r => ({ t:U.ts(r.date), y:A.dd[r.i]*100, color: cols[tiers.indexOf(r.tier)] }));
      const ppts = A.rows.map(r => ({ t:U.ts(r.date), y:r.price, color: cols[tiers.indexOf(r.tier)] }));
      const n = s.v.length, curDD = A.dd[n-1];
      U.$('#w1-kpi').innerHTML = `<div class="kpi"><div class="l">${NAME[key]} 今天离最高点</div><div class="v">${U.pct(curDD)}</div><div class="s">${s.d[n-1]}</div></div>` +
        tiers.map((t, k) => { const c = A.rows.filter(r => r.tier === t).length; return `<div class="kpi"><div class="l">第 ${k+1} 档 −${t}%</div><div class="v">${c} 轮</div><div class="s">1990 年以来触发过</div></div>`; }).join('');
      Charts.line(U.$('#w1-price'), { x, ys:[px], labels:[NAME[key]], range:'ALL', height:230, log:true, points:ppts, colors:[U.css('--ink2')], fmt: v => v == null ? '—' : U.fmtNum(v, 0) });
      Charts.line(U.$('#w1-dd'), { x, ys:[dd], labels:['回撤'], range:'ALL', height:200, maxY:0, points:pts, colors:[U.css('--chart2')], axisFmt: v => v.toFixed(0) + '%',
        hlines: tiers.map((t, i) => ({ y:-t, label:`第 ${i+1} 档 −${t}%`, color: cols[i] })), fmt: v => v == null ? '—' : v.toFixed(1) + '%' });
      const def = PLAN[key];
      U.$('#w1-tiers').innerHTML = `<h3>改一改档位 <span class="small muted">（只影响这一页；你的计划是 ${def.map(t => '−' + t + '%').join(' / ')}）</span></h3>` +
        tiers.map((t, i) => `<div class="slider"><span>第 ${i+1} 档</span><input type="range" min="5" max="60" step="1" value="${t}" data-i="${i}"><span class="v">−${t}%</span></div>`).join('') +
        `<button class="btn small" id="w1-reset">恢复成你的档位</button>`;
      U.$$('#w1-tiers input').forEach(inp => inp.oninput = () => { const arr = [...state.tiers[key]]; arr[+inp.dataset.i] = +inp.value; inp.nextElementSibling.textContent = '−' + inp.value + '%';
        clearTimeout(inp._t); inp._t = setTimeout(() => { state.tiers[key] = arr; update(); }, 150); });
      U.$('#w1-reset').onclick = () => { state.tiers[key] = [...def]; update(); };
      const sum = summarize(A.rows, tiers);
      bars(sum, base, cols);
      U.$('#w1-sum').innerHTML = `<table><thead><tr><th>档位</th><th>发生几轮</th><th>满 12 个月的</th><th>一年后中位数</th><th>平均</th><th>最差 10% 线</th><th>最好 10% 线</th><th>最差</th><th>之后又跌 ≥10% 的比例</th></tr></thead><tbody>
        ${sum.map(s => `<tr><td>−${s.tier}%</td><td>${s.episodes}</td><td>${s.complete}</td><td>${U.pct(s.ret_med)}</td><td>${U.pct(s.ret_mean)}</td><td>${U.pct(s.ret_p10)}</td><td>${U.pct(s.ret_p90)}</td><td>${U.pct(s.ret_min)}</td><td>${s.share_w10 == null ? '—' : (s.share_w10*100).toFixed(0) + '%'}</td></tr>`).join('')}
        <tr class="base"><td>随便哪天买（${base.n.toLocaleString()} 天）</td><td>—</td><td>—</td><td>${U.pct(base.ret_med)}</td><td>${U.pct(base.ret_mean)}</td><td>${U.pct(base.ret_p10)}</td><td>${U.pct(base.ret_p90)}</td><td>—</td><td>${(base.share_w10*100).toFixed(0)}%</td></tr></tbody></table>
        <p class="small muted">“之后又跌 ≥10%”= 买入后 12 个月内，最低点又比买入价低 10% 以上。不足 12 个月的触发不计入。</p>`;
      U.$('#w1-rows').innerHTML = `<table><thead><tr><th>档位</th><th>之前的最高点</th><th>触发日</th><th>一年后</th><th>之后最深再跌</th><th>回到最高点用了</th></tr></thead><tbody>
        ${A.rows.map(r => `<tr><td>−${r.tier}%</td><td>${r.peak_date}</td><td>${r.date}</td><td>${r.ret12 == null ? '还不满 12 个月' : U.pct(r.ret12)}</td><td>${r.worse12 == null ? '—' : U.pct(r.worse12)}</td><td>${r.recover == null ? '还没回到' : '约 ' + (r.recover/252).toFixed(1) + ' 年'}</td></tr>`).join('')}</tbody></table>`;
      U.$('#w1-ex').value = state.explore[key]; explore();
    }
    function bars(sum, base, cols){
      const cv = U.$('#w1-bars'), { ctx, w, h } = Cv.setup(cv, 230);
      const items = [...sum.map((s, i) => ({ l:`第 ${i+1} 档 −${s.tier}%`, v:s.ret_med, n:s.complete, c:cols[i] })), { l:'随便哪天买', v:base.ret_med, n:null, c:'#b9b3a8' }];
      const vals = items.map(i => i.v ?? 0), lo = Math.min(0, ...vals) - 0.05, hi = Math.max(0, ...vals) + 0.08;
      const L = 40, R = 20, top = 26, ph = h - 70, Y = v => top + (hi - v)/(hi - lo) * ph, bw = Math.min(110, (w - L - R) / items.length * 0.55);
      ctx.strokeStyle = '#d8d1c4'; ctx.beginPath(); ctx.moveTo(L, Y(0)); ctx.lineTo(w - R, Y(0)); ctx.stroke();
      ctx.textAlign = 'center';
      items.forEach((it, i) => { const cx = L + (i + 0.5) * (w - L - R) / items.length;
        if (it.v == null){ ctx.fillStyle = '#8b939b'; ctx.fillText('没有样本', cx, Y(0) - 10); }
        else { ctx.fillStyle = it.c; const y0 = Y(Math.max(0, it.v)), y1 = Y(Math.min(0, it.v)); ctx.fillRect(cx - bw/2, y0, bw, Math.max(2, y1 - y0));
          ctx.fillStyle = '#26303a'; ctx.font = 'bold 15px ' + U.css('--font'); ctx.fillText(U.pct(it.v), cx, it.v >= 0 ? y0 - 12 : y1 + 14); }
        ctx.font = '13px ' + U.css('--font'); ctx.fillStyle = '#55606b'; ctx.fillText(it.l, cx, h - 30); ctx.fillStyle = '#8b939b'; ctx.fillText(it.n == null ? '每个交易日' : `${it.n} 次`, cx, h - 12); });
      ctx.textAlign = 'left';
    }
    function explore(){
      const key = state.key, s = U.ser(key), t = state.explore[key];
      U.$('#w1-exv').textContent = '−' + t + '%';
      const A = analyze(s.d, s.v, [t]), sm = summarize(A.rows, [t])[0], b = baseline(key, s.d, s.v);
      U.$('#w1-exout').innerHTML = `<div class="kpi"><div class="l">发生几轮</div><div class="v">${sm.episodes}</div></div><div class="kpi"><div class="l">一年后中位数</div><div class="v">${U.pct(sm.ret_med)}</div><div class="s">随便哪天买：${U.pct(b.ret_med)}</div></div><div class="kpi"><div class="l">之后又跌 ≥10%</div><div class="v">${sm.share_w10 == null ? '—' : (sm.share_w10*100).toFixed(0) + '%'}</div><div class="s">随便哪天买：${(b.share_w10*100).toFixed(0)}%</div></div>`;
    }
    function takeaways(el){
      const S = W1.SPX, sm = t => S.summary.find(s => s.tier === t), b = S.baseline;
      el.innerHTML = `<ol class="takeaways">
        <li><b>深跌很少见。</b>1990 年以来，标普跌超 20% 只有 ${sm(20).episodes} 轮，纳指 100 跌超 25% 只有 ${W1.NDX.summary.find(s => s.tier === 25).episodes} 轮。</li>
        <li><b>−10% 这一档，大多数时候是好买点，少数时候是熊市的开头，当天分不清。</b>一年后中位数 ${U.pct(sm(10).ret_med)}，比随便哪天买的 ${U.pct(b.ret_med)} 好；但 ${sm(10).complete} 次里有 ${Math.round(sm(10).share_w10*sm(10).complete)} 次买完又跌了 10% 以上。</li>
        <li><b>越深的档，一年后看起来越差。</b>−30% 档一年后中位数 ${U.pct(sm(30).ret_med)}。能跌到 −30% 的基本都是真熊市（2001、2008），回到最高点要 4–7 年。12 个月这把尺子对深档位不公平，第 4 周用完整的定投模拟再回答。</li>
        <li><b>计划不改。</b>档位不是“便宜了”的信号，而是“按计划分批把现金放进去”的纪律。</li></ol>
        <details class="more"><summary>完整解读（投资助手撰写）</summary><div class="body md">${window.INTERP && INTERP.week1 ? U.md(INTERP.week1) : '暂无'}</div></details>`;
    }
    drawLocked();
  }
  return { render, analyze };
})();
