// 第 3 周：信用利差和 VIX 规则检验（结果由 Market Dashboard 里的 week3_backtest.py 预先算好）
const Week3 = (() => {
  const RULES = ['L','C','V','LC'];
  const RN = { L:'利差偏高就离场', C:'利差急升就离场', V:'VIX 偏高就离场', LC:'又高又急升才离场' };
  const RD = {
    L:'BAA10Y 比它过去全部历史的平均高出 1 个标准差以上（z > +1）就卖出、换成国库券；回落到 z < +0.5 再买回。前 5 年数据只用来热身，1991 年起才有信号。',
    C:'BAA10Y 在 3 个月（63 个交易日）里上升超过 0.5 个百分点（50bp）就卖出；3 个月变化回到 0 以下再买回。',
    V:'VIX 最近 20 个交易日的平均超过 30 就卖出；回到 25 以下再买回。VIX 1990 年才有。',
    LC:'“利差偏高”和“利差急升”两条同时亮才卖出；任何一条解除就买回。' };
  const RUNS = { base:'理想版：晚 1 周成交，每次买卖 0.1%', real:'现实版（QDII）：再晚 5 个交易日，一来一回 1%' };
  const P = (x, nd=1) => U.pct(x, nd);
  const Q = (x, nd=0) => x == null ? '—' : U.minus((x*100).toFixed(nd)) + '%';
  const okTag = b => b ? '<span class="tag g">通过</span>' : '<span class="tag r">没通过</span>';

  const Qs = [
    { id:'w3q1', q:'2008 年金融危机（标普从 2007 年 10 月的高点跌了 57%），你觉得四条规则里哪条躲开的跌幅最多？看信用利差的规则，会在股市见顶之前还是之后喊“卖”？', chips:RULES.map(r => RN[r]),
      ans: () => { const R = W3.idx.SPX, j = R.episodes.findIndex(e => e.peak.startsWith('2007'));
        const rows = RULES.map(r => ({ r, e:R.rules[r].runs.real.eps[j] }));
        const best = rows.filter(x => x.e.status === '触发').sort((a, b) => b.e.avoided - a.e.avoided)[0];
        return rows.map(({ r, e }) => `「${RN[r]}」${e.status === '触发' ? `${e.fired} 喊卖（${e.wk_after_peak < 0 ? '见顶前 ' + (-e.wk_after_peak).toFixed(0) : '见顶后 ' + e.wk_after_peak.toFixed(0)} 周），躲开 ${Q(e.avoided)}` : e.status}`).join('；') +
          `。躲得最多的是<b>「${RN[best.r]}」</b>。但躲得多的往往回来得也晚，错过了谷底之后的大反弹，下面的图里能看到。`; } },
    { id:'w3q2', q:'加上你买 QDII 的真实成本（比信号再晚 5 个交易日成交，买卖一来一回 1%）之后，四条规则里有几条能在 2006 年以后同时过三条及格线？', chips:['0 条','1 条','2 条','3 条以上'],
      ans: () => { const f = k => RULES.filter(r => W3.idx[k].rules[r].runs.real.v_OOS.useful).map(r => '「' + RN[r] + '」');
        const a = f('SPX'), b = f('NDX');
        return `标普 500：<b>${a.length} 条</b>${a.length ? '（' + a.join('、') + '）' : ''}；纳指 100：<b>${b.length} 条</b>${b.length ? '（' + b.join('、') + '）' : ''}。但同样的规则放到 1986–2005 年，都没能同时过线。一段时间行、另一段不行，说明结论很依赖少数几次危机。`; } },
  ];

  // —— 概念 1：用真实的 2007–2010 回放“利差急升就离场” ——
  function replay(root){
    const R = W3.idx.SPX, rr = R.rules.C.runs.real, B = U.ser('BAA10Y');
    const a = R.wk_dates.findIndex(d => d >= '2007-01-05'), b = R.wk_dates.findIndex(d => d >= '2010-12-31');
    const D = R.wk_dates.slice(a, b + 1), bh = R.bh.slice(a, b + 1).map(v => v / R.bh[a]), eq = rr.eq.slice(a, b + 1).map(v => v / rr.eq[a]), pos = rr.pos.slice(a, b + 1);
    let k = 0; const chg = D.map(d => { while (k + 1 < B.d.length && B.d[k + 1] <= d) k++; return k >= 63 ? B.v[k] - B.v[k - 63] : null; });
    const N = D.length, ep = R.episodes.find(e => e.peak.startsWith('2007')), e = rr.eps[R.episodes.indexOf(ep)];
    const idx = d => { const i = D.findIndex(x => x >= d); return i < 0 ? N - 1 : i; };
    const at = i => i / (N - 1);
    const cv = document.createElement('canvas'); cv.className = 'anim'; root.appendChild(cv);
    const iT = idx(ep.trough), ev = [];
    let offs = 0;
    for (let i = 1; i < N; i++){
      if (pos[i] === 0 && pos[i-1] !== 0){ offs++; ev.push({ i, cap: offs === 1 ? `${D[i]}：真正卖出、换成${T('国库券')}（黄色底）。比信号晚了两周：规则本身晚 1 周，QDII 再晚 5 个交易日。` : `${D[i]}：利差又急升，<b>再次卖出</b>。` }); }
      if (pos[i] !== 0 && pos[i-1] === 0) ev.push({ i, cap: `${D[i]}：3 个月变化回到 0 以下，<b>买回股票</b>。${i < iT ? '可下跌其实还没结束。' : ''}` });
    }
    ev.push({ i:idx(e.fired), cap:`${e.fired}：BAA10Y 3 个月涨幅超过 +50bp 红线，<b>规则喊“卖”</b>。` });
    ev.push({ i:idx(ep.peak), cap:`${ep.peak}：股市见顶。规则已经在场外了。` });
    ev.push({ i:iT, cap:`${ep.trough}：股市跌到谷底，从高点算跌了 ${Q(-ep.dd)}。蓝线（规则）比灰线（一直拿着）跌得少很多。` });
    ev.sort((x, y) => x.i - y.i);
    const steps = [{ at:0, cap:'2007 年初，规则在场内：100% 拿着标普。下面的橙线是 BAA10Y <b>最近 3 个月涨了多少</b>。' },
      ...ev.map(x => ({ at:at(x.i), cap:x.cap })),
      { at:0.999, cap:'到 2010 年底：规则（蓝）比一直拿着（灰）高。但这一整段优势几乎都来自这一次，下面会看到别的年份没这么好。' }];
    function draw(t){
      const { ctx, w, h } = Cv.setup(cv, 360), L = 52, Rr = 150, top = 14, ph = 190, cTop = 232, ch = 100;
      const n = Math.max(1, Math.round(t * (N - 1)));
      const X = i => L + i / (N - 1) * (w - L - Rr), Y = v => top + (1.15 - v) / 0.75 * ph, YC = v => cTop + (160 - v) / 260 * ch;
      // 场外底色
      ctx.fillStyle = 'rgba(232,182,60,.25)'; for (let i = 0; i < n; i++) if (pos[i] === 0) ctx.fillRect(X(i), top, X(i + 1) - X(i) + .5, cTop + ch - top);
      ctx.strokeStyle = '#ebe6dd'; ctx.fillStyle = '#8b939b'; ctx.lineWidth = 1;
      [0.5, 0.75, 1.0].forEach(v => { ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(w - Rr, Y(v)); ctx.stroke(); ctx.fillText((v*100).toFixed(0) + ' 元', 6, Y(v)); });
      ctx.fillText('100 元变成', L, 6);
      ctx.textAlign = 'center'; ['2007','2008','2009','2010'].forEach(y => { const i = idx(y + '-01-01'); ctx.fillText(y, X(i), h - 8); }); ctx.textAlign = 'left';
      // 利差 3 个月变化
      [[50, '#c4553f', '+50bp 卖出线'], [0, '#3c8d5a', '0 买回线']].forEach(([v, c, l]) => { ctx.strokeStyle = c; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(L, YC(v)); ctx.lineTo(w - Rr, YC(v)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = c; ctx.fillText(l, w - Rr + 8, YC(v)); });
      ctx.fillStyle = '#8b939b'; ctx.fillText('利差 3 个月变化', L, cTop - 10);
      ctx.strokeStyle = '#e08a2e'; ctx.lineWidth = 2; ctx.beginPath(); let st = false; for (let i = 0; i <= n; i++){ if (chg[i] == null) continue; const yy = YC(Math.max(-100, Math.min(160, chg[i]))); st ? ctx.lineTo(X(i), yy) : (ctx.moveTo(X(i), yy), st = true); } ctx.stroke();
      const line = (arr, c, wd) => { ctx.strokeStyle = c; ctx.lineWidth = wd; ctx.beginPath(); for (let i = 0; i <= n; i++) i ? ctx.lineTo(X(i), Y(arr[i])) : ctx.moveTo(X(i), Y(arr[i])); ctx.stroke(); };
      line(bh, '#9aa1a8', 2); line(eq, '#3b6ea8', 2.6);
      const bx = w - Rr + 8; ctx.font = '14px ' + U.css('--font');
      ctx.fillStyle = '#26303a'; ctx.fillText(D[n], bx, top + 8);
      ctx.fillStyle = '#3b6ea8'; ctx.fillText(`规则 ${(eq[n] * 100).toFixed(0)} 元`, bx, top + 34);
      ctx.fillStyle = '#7d858c'; ctx.fillText(`一直拿着 ${(bh[n] * 100).toFixed(0)} 元`, bx, top + 58);
      ctx.fillStyle = pos[n] === 0 ? '#b7861c' : '#2f7d6d'; ctx.font = 'bold 15px ' + U.css('--font'); ctx.fillText(pos[n] === 0 ? '在场外：国库券' : '在场内：股票', bx, top + 88);
      ctx.font = '13px ' + U.css('--font'); ctx.fillStyle = '#e08a2e'; ctx.fillText(chg[n] == null ? '' : `3 个月变化 ${U.sgn(chg[n], 0, 'bp')}`, bx, cTop + ch - 4);
    }
    Cv.player(root, { steps, draw, dur:15000 });
  }
  // —— 概念 2：成本计算器 ——
  function costDemo(root){
    root.innerHTML = `<div class="flow" id="lag-flow">
        <div class="f on"><b>周五收盘</b>看到信号</div><div class="f on"><b>下周五</b>按规则成交（晚 1 周）</div><div class="f on"><b>再晚 5 个交易日</b>QDII 赎回 / 申购到账</div></div>
      <div class="slider" style="margin-top:14px"><span>每年买卖几次</span><input type="range" min="0" max="4" step="0.2" value="0.8"><span class="v"></span></div><div class="formula"></div>`;
    const sl = U.$('input', root), f = U.$('.formula', root);
    const draw = () => { const k = +sl.value; U.$('.v', root).textContent = k.toFixed(1) + ' 次';
      f.innerHTML = `一来一回 1% = 卖一次 0.5% + 买一次 0.5%<br>每年切换 ${k.toFixed(1)} 次 × 每次 0.5% = 每年少赚约 <b>${(k * 0.5).toFixed(1)}%</b>`; };
    sl.oninput = draw; draw();
  }

  let st = { key:'SPX', rule:'LC', run:'real' };
  function render(app){
    const N = W3.data_note;
    app.innerHTML = `
      <div class="muted small">第 3 周 / 共 6 周</div>
      <h1>信用利差和 VIX：照规则进出，能躲开熊市吗？</h1>
      <p class="lead">把第 2 周学的读数变成四条写死的买卖规则：信号一坏就把股票全换成国库券，好了再买回来。用 1986 年以来的数据检验，再加上你买 QDII 的真实成本和延迟。</p>
      <div class="steps" id="steps"></div>
      <div class="question">完全照着事先写好的规则进出，会比一直拿着更好吗？加上 QDII 的真实成本之后呢？
        <small>规则和及格线在看结果之前就定好（2026-10-21 登记），这里一个数都没调。</small></div>
      <h2><span class="n">1</span>先猜</h2><div id="pred"></div>
      <h2 id="concept"><span class="n">2</span>看懂概念</h2>
      <div class="card concept"><h3>四条规则</h3>
        <div class="grid g2">${RULES.map(r => `<div class="rulecard"><h4>${RN[r]}</h4><p class="small" style="margin:0;color:var(--ink2)">${RD[r]}</p></div>`).join('')}</div>
        <p class="small muted" style="margin:12px 0 0">卖出后 100% 拿 3 个月${T('国库券')}吃利息；买回时 100% 拿指数。和“一直拿着”比。</p></div>
      <div class="card concept" style="margin-top:16px"><h3>一条规则怎么运作<span class="gloss">用 2007–2010 年真实数据回放「利差急升就离场」</span></h3><div id="replay"></div></div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card concept"><h3>${T('样本内')}和${T('样本外')}<span class="gloss">练习题和考试</span></h3>
          <div style="display:flex;border-radius:10px;overflow:hidden;margin:6px 0 10px;font-size:14px;text-align:center">
            <div style="flex:20;background:var(--accent2);padding:12px 6px"><b>1986–2005</b><br>练习题</div><div style="flex:21;background:var(--y-soft);padding:12px 6px"><b>2006–2026</b><br>考试，只有这段算数</div></div>
          <p class="small" style="margin:0">两段用的是<b>同一套</b>规则，没有根据练习题的成绩去改。规则在练习题上好不稀奇，在没见过的考试题上还好才算数。</p></div>
        <div class="card concept"><h3>延迟和成本<span class="gloss">你实际能做到的速度</span></h3><div id="cost"></div></div>
      </div>
      <div class="card concept" style="margin-top:16px"><h3>三条及格线<span class="gloss">样本外、现实版，三条都过才算“能当买卖规则用”</span></h3>
        <div class="grid g3">
          <div class="kpi"><div class="l">① ${T('最大回撤')}至少少 1/3</div><div class="v">−57% → −38%</div><div class="s">一直拿着最多跌 57%，规则最多只能跌到约 38%</div></div>
          <div class="kpi"><div class="l">② ${T('年化收益')}最多少 1 个百分点</div><div class="v">9.1% → 8.1%</div><div class="s">一直拿着每年 9.1%，规则至少要 8.1%</div></div>
          <div class="kpi"><div class="l">③ ${T('来回打脸')}每年不超过 1 次</div><div class="v">≤ 1 次</div><div class="s">卖了不到 8 周又买回来，算一次</div></div>
        </div>
        <p class="small muted" style="margin:10px 0 0">没过线的规则不是没用，只是不拿来做买卖，留在 Market Dashboard 上当参考。</p></div>
      <h2 id="data"><span class="n">3</span>看数据</h2><div id="lock"></div>
      <h2 id="take"><span class="n">4</span>要点和解读</h2><div id="take-body"></div>
      <h2 id="pits"><span class="n">5</span>要小心</h2>
      <div class="card pits">
        <details><summary>“通过”主要靠 2008 年一次</summary><p>大熊市只有 5 次。一次危机躲得好不好，就能决定整段结果。</p></details>
        <details><summary>没算分红，对规则有利</summary><p>拿股票时少算了每年约 1.5–2% 的分红，卖出后却算了国库券利息。下面有一个补上分红的检查，结论没变。</p></details>
        <details><summary>急跌时信号来得太晚</summary><p>2020 年这种一个月跌 34% 的情况，信号出来再加上执行延迟，已经过了谷底，反而卖在底部附近。</p></details>
        <details><summary>只看了美国</summary><p>样本很小，换个市场、换个年代，结论可能不同。</p></details>
        <details><summary>这周只检验，不改计划</summary><p>你的定投和分档加仓不因为这周的结果改变。</p></details>
      </div>
      <details class="more" style="margin-top:16px"><summary>数据来源</summary><div class="body small">${[N.spx, N.baa, N.vix, N.cash, N.ndx].map(U.esc).join('<br>').replace(/V 规则/g, '「VIX 偏高就离场」')}</div></details>`;
    const lock = U.$('#lock'), steps = U.$('#steps');
    U.$('#pred').appendChild(Predict.block(Qs, ok => { lock.dataset.ok = ok ? '1' : ''; weekSteps(steps, ok); draw(); }));
    weekSteps(steps, false);
    replay(U.$('#replay')); costDemo(U.$('#cost'));

    function draw(){
      const tk = U.$('#take-body');
      if (!lock.dataset.ok){
        lock.innerHTML = '<div class="lockmsg"><span class="ico">🔒</span>先在上面写下两道题的猜测并提交，图表和结果才会出现。</div>';
        tk.innerHTML = '<div class="lockmsg"><span class="ico">🔒</span>要点会揭晓答案，提交猜测后显示。</div>'; return; }
      if (lock.dataset.drawn) return; lock.dataset.drawn = '1';
      takeaways(tk);
      lock.innerHTML = `
        <div class="card">
          <div class="btns"><span class="lbl">指数</span>${['SPX','NDX'].map(k => `<button class="btn small" data-k="${k}">${k === 'SPX' ? '标普 500' : '纳指 100'}</button>`).join('')}</div>
          <div class="btns"><span class="lbl">规则</span>${RULES.map(r => `<button class="btn small" data-r="${r}">${RN[r]}</button>`).join('')}</div>
          <div class="btns"><span class="lbl">成本</span>${Object.entries(RUNS).map(([k, v]) => `<button class="btn small" data-run="${k}">${v}</button>`).join('')}</div>
          <p class="small" id="w3-desc" style="margin-top:10px"></p>
          <div class="grid g3" id="w3-verdict"></div><p class="small" id="w3-vtxt" style="margin-top:10px"></p>
          <div class="chart-title">100 元变成多少<span>${T('对数刻度')}；黄色底 = 规则在场外拿国库券；虚线右边是考试段</span></div><div id="w3-eq"></div>
          <div class="chart-title">从最高点跌了多少</div><div id="w3-dd"></div>
          <details class="more"><summary>全部指标</summary><div class="body tablewrap" id="w3-metrics"></div></details>
        </div>
        <div class="card" style="margin-top:16px"><h3 style="margin-top:0">每一次熊市：躲开了多少？<span class="small muted" style="font-weight:400">标普从最高点跌 15% 以上，固定用标普</span></h3><div class="eps" id="w3-eps"></div></div>
        <div class="card" style="margin-top:16px" id="w3-2022"></div>
        <h3>四条规则并排（考试段、现实版）</h3><div class="grid g4" id="w3-all"></div>
        <details class="more"><summary>探索性检查：补上分红以后（不是事先登记的结果）</summary><div class="body tablewrap" id="w3-tr"></div></details>`;
      U.$$('[data-k]', lock).forEach(b => b.onclick = () => { st.key = b.dataset.k; update(); });
      U.$$('[data-r]', lock).forEach(b => b.onclick = () => { st.rule = b.dataset.r; update(); });
      U.$$('[data-run]', lock).forEach(b => b.onclick = () => { st.run = b.dataset.run; update(); });
      update();
    }
    function bandsFrom(dates, pos){
      const out = []; let s = null;
      pos.forEach((p, i) => { if (p === 0 && s == null) s = U.ts(dates[i]); if (p !== 0 && s != null){ out.push([s, U.ts(dates[i])]); s = null; } });
      if (s != null) out.push([s, U.ts(U.last(dates))]); return out;
    }
    function gauge(title, val, txt, pass, frac){ return `<div class="kpi ${pass ? 'g' : 'r'}"><div class="l">${title}</div><div class="v">${val}</div><div class="bar" style="margin:6px 0"><i style="width:${Math.max(0, Math.min(1, frac))*100}%;background:${pass ? 'var(--g)' : 'var(--r)'}"></i></div><div class="s">${txt} ${okTag(pass)}</div></div>`; }
    function update(){
      const R = W3.idx[st.key], rr = R.rules[st.rule].runs[st.run];
      U.$$('[data-k]', lock).forEach(b => b.classList.toggle('on', b.dataset.k === st.key));
      U.$$('[data-r]', lock).forEach(b => b.classList.toggle('on', b.dataset.r === st.rule));
      U.$$('[data-run]', lock).forEach(b => b.classList.toggle('on', b.dataset.run === st.run));
      U.$('#w3-desc').innerHTML = `<b>「${RN[st.rule]}」</b>${RD[st.rule]}`;
      const v = rr.v_OOS, vi = rr.v_IS;
      U.$('#w3-verdict').innerHTML =
        gauge('① 回撤少了多少（要 ≥ 33%）', Q(v.mdd_cut), `${P(rr.OOS.mdd)} 对一直拿着 ${P(rr.OOS_bh.mdd)}`, v.pass_mdd, v.mdd_cut / 0.66) +
        gauge('② 每年少赚（要 ≤ 1 个百分点）', `${v.cagr_cost < 0 ? '多赚 ' : ''}${Math.abs(v.cagr_cost*100).toFixed(1)}`, `每年 ${P(rr.OOS.cagr)} 对 ${P(rr.OOS_bh.cagr)}`, v.pass_cagr, 1 - (v.cagr_cost*100 + 1) / 5) +
        gauge('③ 来回打脸（要 ≤ 1 次/年）', rr.OOS.whip_yr.toFixed(2) + ' 次', '每年', v.pass_whip, 1 - rr.OOS.whip_yr / 2);
      U.$('#w3-vtxt').innerHTML = `考试段（2006–${rr.OOS.end.slice(0,4)}）：<b>${v.useful ? '三条都过' : '没有全过，只做参考'}</b>。练习段（${rr.IS.start.slice(0,4)}–2005）：${vi.useful ? '三条都过' : '没有全过'}（回撤少 ${Q(vi.mdd_cut)}，每年${vi.cagr_cost < 0 ? '多赚 ' + Math.abs(vi.cagr_cost*100).toFixed(1) : '少赚 ' + (vi.cagr_cost*100).toFixed(1)} 个百分点）。<span class="muted">正式判定只看考试段的现实版。</span>`;
      const x = R.wk_dates.map(U.ts), xb = bandsFrom(R.wk_dates, rr.pos), xl = [{ t:U.ts('2006-01-02'), label:'考试段 →' }];
      Charts.line(U.$('#w3-eq'), { x, ys:[rr.eq.map(v => v*100), R.bh.map(v => v*100)], labels:[RN[st.rule], '一直拿着'], colors:[U.css('--chart1'), '#9aa1a8'], widths:[2.2, 1.6], range:'ALL', height:250, log:true, xbands:xb, xlines:xl, fmt: v => v == null ? '—' : v.toFixed(0) + ' 元' });
      const ddOf = a => { let m = -Infinity; return a.map(v => { m = Math.max(m, v); return (v/m - 1)*100; }); };
      Charts.line(U.$('#w3-dd'), { x, ys:[ddOf(rr.eq), ddOf(R.bh)], labels:[RN[st.rule], '一直拿着'], colors:[U.css('--chart1'), '#9aa1a8'], range:'ALL', height:180, maxY:0, xbands:xb, xlines:xl, axisFmt: v => v.toFixed(0) + '%', fmt: v => v == null ? '—' : v.toFixed(1) + '%' });
      const row = (lbl, m) => `<tr><td>${lbl}</td><td>${m.start} → ${m.end}</td><td>${P(m.cagr)}</td><td>${Q(m.vol,1)}</td><td>${m.sharpe == null ? '—' : m.sharpe.toFixed(2)}</td><td>${P(m.mdd)}</td><td>${Q(m.off)}</td><td>${m.sw_yr.toFixed(2)}</td><td>${m.whip_yr.toFixed(2)}</td></tr>`;
      U.$('#w3-metrics').innerHTML = `<table><thead><tr><th></th><th>时间段</th><th>年化</th><th>波动</th><th>${T('夏普比率', '夏普')}</th><th>最大回撤</th><th>在场外的时间</th><th>买卖次数/年</th><th>打脸/年</th></tr></thead><tbody>
        ${row('规则 · 练习段', rr.IS)}${row('一直拿着 · 练习段', rr.IS_bh)}${row('规则 · 考试段', rr.OOS)}${row('一直拿着 · 考试段', rr.OOS_bh)}</tbody></table>
        <p class="small muted">规则第一次能算出信号是 ${R.rules[st.rule].first_signal}，练习段从那之后算，“一直拿着”用同一段时间。</p>`;
      const S = W3.idx.SPX, sr = S.rules[st.rule].runs[st.run];
      U.$('#w3-eps').innerHTML = S.episodes.map((ep, j) => { const e = sr.eps[j];
        const head = `<div class="t">${ep.peak.slice(0,7)} → ${ep.trough.slice(0,7)}<small>跌了 ${Q(-ep.dd)}${ep.dd > -0.2 ? ' · 小熊市' : ''}</small></div>`;
        if (e.status !== '触发') return `<div class="ep">${head}<div class="bar"></div><div class="d">${e.status === '不评估' ? '那时还算不出信号' : '没有喊卖'}</div></div>`;
        const av = Math.max(0, e.avoided);
        return `<div class="ep">${head}<div><div class="bar"><i style="width:${av*100}%"></i></div><div class="small muted" style="margin-top:4px">躲开 ${Q(e.avoided)}　·　${e.wk_after_peak < 0 ? '见顶前 ' + (-e.wk_after_peak).toFixed(0) : '见顶后 ' + e.wk_after_peak.toFixed(0)} 周喊卖${e.exec_after_trough ? '，<b>成交时已过谷底</b>' : ''}</div></div>
          <div class="d">${e.reentry ? e.reentry + ' 买回' : e.back_before_trough ? '谷底前已买回' : '还没买回'}${e.missed == null ? '' : `<br>谷底到买回，错过 ${P(e.missed)}`}</div></div>`; }).join('') +
        `<p class="small muted" style="margin-top:8px">“躲开了多少”= 1 − 规则从高点到谷底的亏损 ÷ 指数的亏损。1987 年「利差偏高」和「VIX 偏高」还算不出信号。</p>`;
      const j22 = S.episodes.findIndex(e => e.peak.startsWith('2022'));
      U.$('#w3-2022').innerHTML = `<h3 style="margin-top:0">2022 年单独看（${st.run === 'real' ? '现实版' : '理想版'}）</h3><p style="margin:0">${RULES.map(r => { const e = S.rules[r].runs[st.run].eps[j22]; return `<b>「${RN[r]}」</b>${e.status === '触发' ? `${e.fired} 喊卖，躲开 ${Q(e.avoided)}${e.reentry ? '，' + e.reentry + ' 买回' : e.back_before_trough ? '，谷底前已买回' : ''}` : '没有喊卖'}`; }).join('<br>')}</p>
        <p class="small muted" style="margin:8px 0 0">2022 年是加息推动的熊市，信用市场几乎没报警。这和第 2 周看到的一样。</p>`;
      U.$('#w3-all').innerHTML = RULES.map(r => { const a = R.rules[r].runs.real, v = a.v_OOS;
        return `<div class="rulecard ${v.useful ? 'pass' : ''}"><h4>${RN[r]}</h4><div style="margin-bottom:6px">${v.useful ? '<span class="tag g">三条都过</span>' : '<span class="tag">只做参考</span>'}</div>
          <div class="check"><span>回撤少</span><span class="${v.pass_mdd ? 'ok' : 'no'}">${Q(v.mdd_cut)}</span></div>
          <div class="check"><span>每年${v.cagr_cost < 0 ? '多赚' : '少赚'}</span><span class="${v.pass_cagr ? 'ok' : 'no'}">${Math.abs(v.cagr_cost*100).toFixed(1)} 点</span></div>
          <div class="check"><span>打脸/年</span><span class="${v.pass_whip ? 'ok' : 'no'}">${a.OOS.whip_yr.toFixed(2)}</span></div></div>`; }).join('');
      const t = W3.tr_check;
      U.$('#w3-tr').innerHTML = t && t.rows ? `<p class="small">用 Shiller 教授公开的月度股息给标普补上分红，近似成“总回报”。考试段 2006-01 到 ${t.end}（他的股息数据只到这里），现实版成本。</p>
        <table><thead><tr><th>规则</th><th>年化</th><th>一直拿着年化</th><th>每年少赚（百分点）</th><th>回撤少了</th><th>打脸/年</th></tr></thead><tbody>
        ${Object.entries(t.rows).map(([r, x]) => `<tr><td>${RN[r]}</td><td>${P(x.cagr)}</td><td>${P(x.bh_cagr)}</td><td>${U.minus((x.cagr_cost*100).toFixed(2))}</td><td>${Q(x.mdd_cut)}</td><td>${x.whip_yr.toFixed(2)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">没有做成。</p>';
    }
    function takeaways(el){
      const S = W3.idx.SPX, pass = k => RULES.filter(r => W3.idx[k].rules[r].runs.real.v_OOS.useful).map(r => '「' + RN[r] + '」');
      el.innerHTML = `<ol class="takeaways">
        <li><b>按事先定好的标准，有规则“通过”了，但证据很薄。</b>标普上通过的是 ${pass('SPX').join('、')}，纳指上是 ${pass('NDX').join('、')}。同样的规则放到 1986–2005 年反而比一直拿着差，2006 年以后的优势几乎全来自 2008 年一次。</li>
        <li><b>「利差偏高就离场」练习题满分、考试不及格。</b>2008 年躲开了大部分跌幅，但直到 2010 年才买回，错过了谷底后的大反弹。</li>
        <li><b>VIX 总是来得太晚。</b>它是跟着下跌一起升的，不是提前报警的。2020 年四条规则都在谷底之后才成交。</li>
        <li><b>2022 年加息熊市，信用规则基本没反应。</b>信用预警和利率预警各管一类熊市，缺一个都有盲区。</li>
        <li><b>计划不改。</b>你的赎回费加上到账延迟，在急跌里会让你卖在谷底附近。“信号一亮就全部赎回”不能代替逢跌分档加仓。第 6 周再用随机打乱的方法检验一次这些结论是不是运气。</li></ol>
        <details class="more"><summary>完整解读（投资助手撰写）</summary><div class="body md">${window.INTERP && INTERP.week3 ? U.md(INTERP.week3) : '暂无'}</div></details>`;
    }
    draw();
  }
  return { render };
})();
